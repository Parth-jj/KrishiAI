import crypto from "crypto";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  db,
  maskPhoneNumber,
  normalizePhoneNumber,
  VoiceCallRecord,
  VoiceCallStatus,
  VoiceCallTranscriptTurn
} from "../db.js";
import { authenticateUser } from "./auth.js";
import {
  buildConversationSummary,
  generateVoiceAdvisoryForAgent,
  getSarvamAgentBlueprint,
  getSarvamAgentSystemPrompt,
  getSarvamConfigStatus,
  initiateSarvamOutboundCall,
  mapSarvamFailureReason,
  resolveSarvamLanguage,
  SARVAM_VOICE_LANGUAGES,
  SarvamApiError,
  SarvamConfigError,
  terminateExternalTelephonyCall,
  verifySarvamWebhookSignature
} from "../services/sarvamVoiceService.js";

export const voiceCallsRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "farmer_advisory_jwt_secret_key_2026";
const MAX_CONCURRENT_CALLS = Number(process.env.MAX_CONCURRENT_VOICE_CALLS || "50") || 50;

// Sliding-window rate limiters (isolated in memory per IP and per phone number)
const ipRateBuckets = new Map<string, number[]>();
const phoneRateBuckets = new Map<string, number[]>();

// Per-call SSE subscribers map keyed strictly by callId (zero global singleton call state)
const callSseSubscribers = new Map<string, Set<Response>>();

function checkRateLimit(
  bucketMap: Map<string, number[]>,
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = (bucketMap.get(key) || []).filter((ts) => now - ts < windowMs);
  if (existing.length >= maxRequests) {
    const oldest = existing[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    bucketMap.set(key, existing);
    return { allowed: false, retryAfterSeconds };
  }
  existing.push(now);
  bucketMap.set(key, existing);
  return { allowed: true, retryAfterSeconds: 0 };
}

function createCallAccessToken(callId: string, userId: string): string {
  return jwt.sign(
    {
      type: "voice_call_access",
      callId,
      userId
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function sanitizeVoiceCallForClient(call: VoiceCallRecord) {
  const langSpec = resolveSarvamLanguage(call.selectedLanguage);
  const { phoneNormalized: _omitPhone, ...safeRest } = call;
  return {
    ...safeRest,
    selectedLanguageName: langSpec.name,
    selectedLanguageNative: langSpec.nativeName,
    ttsSupportedNatively: langSpec.ttsSupportedNatively,
    languageNote: langSpec.notes,
    transcript: call.transcriptConsent ? (call.transcript || []) : undefined
  };
}

function broadcastCallUpdate(call: VoiceCallRecord) {
  const subscribers = callSseSubscribers.get(call.callId);
  if (!subscribers || subscribers.size === 0) return;

  const payload = JSON.stringify({
    type: "call_update",
    call: sanitizeVoiceCallForClient(call)
  });

  for (const res of subscribers) {
    try {
      res.write(`data: ${payload}\n\n`);
    } catch {
      subscribers.delete(res);
    }
  }
}

function authorizeCallAccess(req: Request, call: VoiceCallRecord): boolean {
  // 1. Check scoped per-call token (used by Login Page modal before full session sign-in)
  const callTokenHeader = req.headers["x-call-token"];
  const callTokenQuery = typeof req.query.callToken === "string" ? req.query.callToken : undefined;
  const callToken = typeof callTokenHeader === "string" ? callTokenHeader : callTokenQuery;

  if (callToken) {
    try {
      const decoded = jwt.verify(callToken, JWT_SECRET) as any;
      if (
        decoded?.type === "voice_call_access" &&
        decoded?.callId === call.callId &&
        decoded?.userId === call.userId
      ) {
        return true;
      }
    } catch {
      // fall through to Bearer check
    }
  }

  // 2. Check authenticated farmer/admin JWT
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any;
      const user = db.getUserById(decoded.id);
      if (user && (user.id === call.userId || user.role === "admin")) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

function verifyAgentToolSecret(req: Request): boolean {
  const expected = process.env.SARVAM_TOOL_SECRET?.trim();
  if (!expected) return true; // Allows local setup if secret not configured yet

  const headerSecret =
    (req.headers["x-tool-secret"] as string | undefined) ||
    (req.headers["x-sarvam-tool-secret"] as string | undefined) ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7).trim()
      : undefined);

  if (!headerSecret) return false;
  const a = Buffer.from(headerSecret);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// 1. GET /api/voice-calls/config - Non-secret configuration readiness & 12-language catalog
voiceCallsRouter.get("/config", (_req: Request, res: Response) => {
  const config = getSarvamConfigStatus();
  const activeCalls = db.getActiveVoiceCalls();
  return res.json({
    configured: config.configured,
    missingVariables: config.missingVariables,
    models: config.models,
    webhookSecretConfigured: config.webhookSecretConfigured,
    toolSecretConfigured: config.toolSecretConfigured,
    vobizHangupConfigured: config.vobizHangupConfigured,
    agentPhoneConfigured: config.agentPhoneConfigured,
    activeConcurrentCalls: activeCalls.length,
    maxConcurrentCalls: MAX_CONCURRENT_CALLS,
    languages: SARVAM_VOICE_LANGUAGES
  });
});

// 2. GET /api/voice-calls/blueprint - Sarvam Samvaad agent prompt & API tool URLs (non-secret)
voiceCallsRouter.get("/blueprint", (req: Request, res: Response) => {
  const appUrl =
    process.env.APP_URL?.trim() ||
    `${req.protocol}://${req.get("host") || "localhost:3000"}`;
  return res.json(getSarvamAgentBlueprint(appUrl));
});

// 3. GET /api/voice-calls/history - Authenticated farmer's own call history (strict cross-farmer isolation)
voiceCallsRouter.get("/history", authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user;
  const calls = db.getVoiceCallsByUserId(user.id).map(sanitizeVoiceCallForClient);
  return res.json({ calls });
});

// 4. POST /api/voice-calls/outbound - Initiate isolated outbound AI voice call for a registered farmer
voiceCallsRouter.post("/outbound", async (req: Request, res: Response) => {
  try {
    const { mobileNumber, preferredLanguage = "en-IN", callConsent, transcriptConsent = false } = req.body || {};

    // A. Validate mobile number format
    const normalizedPhone = normalizePhoneNumber(typeof mobileNumber === "string" ? mobileNumber : "");
    if (!normalizedPhone) {
      return res.status(400).json({
        code: "INVALID_MOBILE_NUMBER",
        error: "Please enter a valid 10-digit Indian mobile number (e.g., 98480 12345 or +91 98480 12345)."
      });
    }

    // B. Validate explicit call consent
    if (callConsent !== true) {
      return res.status(400).json({
        code: "CONSENT_REQUIRED",
        error: "Please read and accept the AI Voice Call consent notice before clicking Call Me."
      });
    }

    // C. Rate limiting (IP & Phone)
    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
    const ipLimit = checkRateLimit(ipRateBuckets, clientIp, 12, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({
        code: "RATE_LIMIT_EXCEEDED",
        error: `Too many call requests from this network. Please wait ${ipLimit.retryAfterSeconds} seconds before retrying.`,
        retryAfterSeconds: ipLimit.retryAfterSeconds
      });
    }

    const phoneLimit = checkRateLimit(phoneRateBuckets, normalizedPhone, 4, 5 * 60 * 1000);
    if (!phoneLimit.allowed) {
      res.setHeader("Retry-After", String(phoneLimit.retryAfterSeconds));
      return res.status(429).json({
        code: "PHONE_RATE_LIMIT_EXCEEDED",
        error: `Multiple calls were requested for this mobile number recently. Please wait ${phoneLimit.retryAfterSeconds} seconds before retrying.`,
        retryAfterSeconds: phoneLimit.retryAfterSeconds
      });
    }

    // D. Identify registered farmer from database by normalized mobile number
    const farmer = db.getUserByPhone(normalizedPhone);
    if (!farmer) {
      return res.status(404).json({
        code: "USER_NOT_REGISTERED",
        error: "This mobile number is not registered in KrishiAI yet. Please create an account with your mobile number or add your number in Farm Profile first."
      });
    }

    // E. Per-phone concurrency guard & global concurrency capacity check
    const activeSamePhone = db.getActiveVoiceCallByPhone(normalizedPhone);
    if (activeSamePhone) {
      return res.status(409).json({
        code: "CALL_ALREADY_ACTIVE",
        error: "An AI voice call is already active or ringing on this mobile number. Please answer or end the active call before starting a new one."
      });
    }

    const totalActiveCalls = db.getActiveVoiceCalls().length;
    if (totalActiveCalls >= MAX_CONCURRENT_CALLS) {
      return res.status(503).json({
        code: "MAX_CONCURRENT_CALLS_REACHED",
        error: "All voice helpline lines are currently assisting other farmers. Please try again in 1 minute."
      });
    }

    // F. Check Sarvam AI & telephony configuration honestly BEFORE creating a call attempt
    const sarvamConfig = getSarvamConfigStatus();
    if (!sarvamConfig.configured) {
      return res.status(503).json({
        code: "SARVAM_NOT_CONFIGURED",
        error: `Sarvam AI Voice Agents & telephony credentials are not configured on the server yet (${sarvamConfig.missingVariables.join(", ")}). Real phone calls cannot be placed until these environment variables are set.`,
        missingVariables: sarvamConfig.missingVariables
      });
    }

    // G. Create completely isolated per-call session record
    const callId = `call-${crypto.randomUUID()}`;
    const sessionId = `sess-${crypto.randomUUID()}`;
    const langSpec = resolveSarvamLanguage(
      typeof preferredLanguage === "string" && preferredLanguage.trim()
        ? preferredLanguage
        : farmer.preferredLanguage
    );
    const farm = db.getFarmByUserId(farmer.id);

    const newCall = db.createVoiceCall({
      callId,
      sessionId,
      userId: farmer.id,
      farmerName: farmer.name,
      phoneMasked: maskPhoneNumber(normalizedPhone),
      phoneNormalized: normalizedPhone,
      status: "Initiating",
      selectedLanguage: langSpec.code,
      callConsent: true,
      transcriptConsent: Boolean(transcriptConsent),
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      topicsDiscussed: []
    });

    const callToken = createCallAccessToken(callId, farmer.id);

    // H. Place real outbound call via Sarvam AI Voice Agents Outbounds API
    try {
      const { attemptId } = await initiateSarvamOutboundCall({
        callId,
        sessionId,
        user: farmer,
        farm,
        targetPhoneNormalized: normalizedPhone,
        selectedLanguage: langSpec
      });

      const updatedCall = db.updateVoiceCall(callId, {
        sarvamAttemptId: attemptId,
        status: "Ringing"
      }) || newCall;

      broadcastCallUpdate(updatedCall);

      return res.status(201).json({
        success: true,
        callToken,
        call: sanitizeVoiceCallForClient(updatedCall),
        agentPromptPreview: getSarvamAgentSystemPrompt(farmer, farm, langSpec)
      });
    } catch (sarvamErr: any) {
      const reason =
        sarvamErr instanceof SarvamConfigError || sarvamErr instanceof SarvamApiError
          ? sarvamErr.message
          : "Failed to initiate outbound AI voice call.";

      const failedCall = db.updateVoiceCall(callId, {
        status: "Failed",
        endedAt: new Date().toISOString(),
        durationSeconds: 0,
        failureReason: reason,
        summary: reason
      }) || newCall;

      broadcastCallUpdate(failedCall);

      const statusCode =
        sarvamErr instanceof SarvamConfigError
          ? 503
          : sarvamErr instanceof SarvamApiError
            ? sarvamErr.statusCode
            : 502;

      return res.status(statusCode).json({
        code: sarvamErr?.upstreamCode || "SARVAM_OUTBOUND_FAILED",
        error: reason,
        callToken,
        call: sanitizeVoiceCallForClient(failedCall)
      });
    }
  } catch (err: any) {
    console.error("[VoiceCalls Outbound Error]:", err);
    return res.status(500).json({
      code: "INTERNAL_CALL_ERROR",
      error: err?.message || "Unexpected error while starting AI voice call."
    });
  }
});

// 5. GET /api/voice-calls/:callId/status - Check status for a specific call session
voiceCallsRouter.get("/:callId/status", (req: Request, res: Response) => {
  const call = db.getVoiceCallById(req.params.callId);
  if (!call) {
    return res.status(404).json({ error: "Voice call session not found." });
  }
  if (!authorizeCallAccess(req, call)) {
    return res.status(403).json({ error: "Unauthorized access to this voice call session." });
  }
  return res.json({ call: sanitizeVoiceCallForClient(call) });
});

// 6. GET /api/voice-calls/:callId/events - Real-time SSE status stream isolated per callId
voiceCallsRouter.get("/:callId/events", (req: Request, res: Response) => {
  const call = db.getVoiceCallById(req.params.callId);
  if (!call) {
    return res.status(404).json({ error: "Voice call session not found." });
  }
  if (!authorizeCallAccess(req, call)) {
    return res.status(403).json({ error: "Unauthorized stream access for this voice call session." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  let subscribers = callSseSubscribers.get(call.callId);
  if (!subscribers) {
    subscribers = new Set<Response>();
    callSseSubscribers.set(call.callId, subscribers);
  }
  subscribers.add(res);

  // Send immediate initial snapshot
  res.write(
    `data: ${JSON.stringify({ type: "call_snapshot", call: sanitizeVoiceCallForClient(call) })}\n\n`
  );

  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    const set = callSseSubscribers.get(call.callId);
    if (set) {
      set.delete(res);
      if (set.size === 0) {
        callSseSubscribers.delete(call.callId);
      }
    }
  });
});

// 7. POST /api/voice-calls/:callId/language - Switch active language mid-call
voiceCallsRouter.post("/:callId/language", (req: Request, res: Response) => {
  const call = db.getVoiceCallById(req.params.callId);
  if (!call) {
    return res.status(404).json({ error: "Voice call session not found." });
  }
  if (!authorizeCallAccess(req, call)) {
    return res.status(403).json({ error: "Unauthorized access to modify call language." });
  }

  const { language } = req.body || {};
  if (!language || typeof language !== "string") {
    return res.status(400).json({ error: "Valid language code is required." });
  }

  const langSpec = resolveSarvamLanguage(language);
  const updated = db.updateVoiceCall(call.callId, {
    selectedLanguage: langSpec.code
  });

  if (updated) {
    broadcastCallUpdate(updated);
    return res.json({
      success: true,
      language: langSpec,
      call: sanitizeVoiceCallForClient(updated)
    });
  }
  return res.status(500).json({ error: "Failed to update language." });
});

// 8. POST /api/voice-calls/:callId/end - End / cancel an active call cleanly
voiceCallsRouter.post("/:callId/end", async (req: Request, res: Response) => {
  const call = db.getVoiceCallById(req.params.callId);
  if (!call) {
    return res.status(404).json({ error: "Voice call session not found." });
  }
  if (!authorizeCallAccess(req, call)) {
    return res.status(403).json({ error: "Unauthorized access to end this call." });
  }

  if (call.status === "Completed" || call.status === "Failed") {
    return res.json({
      success: true,
      alreadyEnded: true,
      call: sanitizeVoiceCallForClient(call)
    });
  }

  const termination = await terminateExternalTelephonyCall(call);
  const endedAt = new Date().toISOString();
  const baseStart = call.connectedAt ? new Date(call.connectedAt).getTime() : new Date(call.startedAt).getTime();
  const computedDuration = Math.max(0, Math.round((Date.now() - baseStart) / 1000));
  const wasConnected = call.status === "Connected" || call.status === "Conversation Active";

  const finalStatus: VoiceCallStatus = wasConnected ? "Completed" : "Failed";
  const summary = wasConnected
    ? buildConversationSummary({ ...call, status: "Completed" }, call.transcript || [])
    : "Call was ended by the farmer before connecting.";

  const updated = db.updateVoiceCall(call.callId, {
    status: finalStatus,
    endedAt,
    durationSeconds: wasConnected ? computedDuration : 0,
    failureReason: wasConnected ? undefined : "Call ended by farmer before pickup.",
    summary
  }) || call;

  broadcastCallUpdate(updated);

  return res.json({
    success: true,
    terminatedUpstream: termination.terminatedUpstream,
    providerNote: termination.providerNote,
    call: sanitizeVoiceCallForClient(updated)
  });
});

// 9. POST /api/voice-calls/webhook - Receive Sarvam Voice Agent lifecycle & completion webhooks
voiceCallsRouter.post("/webhook", (req: Request, res: Response) => {
  const rawBody: string = (req as any).rawBody || JSON.stringify(req.body || {});
  const signature =
    (req.headers["x-sarvam-signature"] as string | undefined) ||
    (req.headers["x-webhook-signature"] as string | undefined);

  if (!verifySarvamWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ error: "Invalid webhook signature." });
  }

  const payload = req.body || {};
  const attemptId = payload.attempt_id || payload.attemptId;
  const metaCallId = payload.webhook_config?.metadata?.callId || payload.call_id || payload.callId;

  const call =
    (metaCallId ? db.getVoiceCallById(String(metaCallId)) : undefined) ||
    (attemptId ? db.getVoiceCallByAttemptId(String(attemptId)) : undefined);

  if (!call) {
    return res.status(404).json({ error: "Matching voice call session not found for webhook." });
  }

  const rawStatus = String(payload.status || "").toLowerCase();
  const eventType = String(payload.event || payload.type || "").toLowerCase();

  let nextStatus: VoiceCallStatus = call.status;
  let failureReason: string | undefined = call.failureReason;
  let connectedAt = call.connectedAt;
  let endedAt = call.endedAt;
  let durationSeconds = call.durationSeconds;

  if (rawStatus === "ringing" || eventType === "ringing") {
    nextStatus = "Ringing";
  } else if (eventType === "call_connected" || (rawStatus === "connected" && !payload.ended_at && payload.duration == null && !payload.interaction_transcript)) {
    nextStatus = "Connected";
    connectedAt = connectedAt || new Date().toISOString();
  } else if (rawStatus === "in_progress" || rawStatus === "conversation_active" || eventType === "conversation_active") {
    nextStatus = "Conversation Active";
    connectedAt = connectedAt || new Date().toISOString();
  } else if (rawStatus === "connected" || rawStatus === "completed") {
    // Sarvam Outbound completion webhook sends status: "connected" with duration & interaction_transcript
    nextStatus = "Completed";
    connectedAt = connectedAt || call.startedAt;
    endedAt = new Date().toISOString();
    durationSeconds = typeof payload.duration === "number" ? payload.duration : call.durationSeconds ?? 0;
  } else if (rawStatus === "busy" || rawStatus === "no_answer" || rawStatus === "failed" || rawStatus === "disconnected") {
    nextStatus = "Failed";
    endedAt = new Date().toISOString();
    durationSeconds = typeof payload.duration === "number" ? payload.duration : 0;
    failureReason = mapSarvamFailureReason(rawStatus, payload.failure_reason || payload.reason);
  }

  const rawTurns: any[] = Array.isArray(payload.interaction_transcript)
    ? payload.interaction_transcript
    : [];

  const parsedTurns: VoiceCallTranscriptTurn[] = rawTurns
    .map((turn: any): VoiceCallTranscriptTurn => {
      const role: VoiceCallTranscriptTurn["role"] =
        turn?.role === "user" || turn?.speaker === "farmer" || turn?.speaker === "user"
          ? "farmer"
          : turn?.role === "system"
            ? "system"
            : "assistant";
      return {
        role,
        text: String(turn?.text || turn?.message || turn?.content || "").trim(),
        language: turn?.language || call.selectedLanguage,
        timestamp: turn?.timestamp || new Date().toISOString()
      };
    })
    .filter((t) => t.text.length > 0);

  // Enforce transcript storage strictly based on farmer's explicit transcriptConsent
  const mergedTranscript = call.transcriptConsent
    ? (parsedTurns.length > 0 ? parsedTurns : call.transcript || [])
    : undefined;

  const finalVars = payload.final_agent_variables || {};
  const updatedLanguage = finalVars.selected_language || finalVars.language
    ? resolveSarvamLanguage(String(finalVars.selected_language || finalVars.language)).code
    : call.selectedLanguage;

  const summary = buildConversationSummary(
    { ...call, status: nextStatus, selectedLanguage: updatedLanguage, failureReason },
    mergedTranscript || [],
    finalVars
  );

  const updated = db.updateVoiceCall(call.callId, {
    status: nextStatus,
    selectedLanguage: updatedLanguage,
    sarvamInteractionId: payload.interaction_id || call.sarvamInteractionId,
    vobizCallUuid: payload.channel_info?.call_uuid || payload.channel_info?.vobiz_call_uuid || call.vobizCallUuid,
    connectedAt,
    endedAt,
    durationSeconds,
    failureReason,
    summary,
    transcript: mergedTranscript
  });

  if (updated) {
    broadcastCallUpdate(updated);
  }

  return res.json({ received: true, callId: call.callId, status: nextStatus });
});

// 10. Sarvam Mid-Call API Tool Endpoints (called by Sarvam Samvaad agent during live phone calls)
function resolveActiveCallFromToolPayload(body: any): VoiceCallRecord | undefined {
  const callId = body?.callId || body?.call_id;
  const attemptId = body?.attempt_id || body?.attemptId;
  const phone = body?.user_phone_number || body?.phone;

  if (callId) {
    const found = db.getVoiceCallById(String(callId));
    if (found) return found;
  }
  if (attemptId) {
    const found = db.getVoiceCallByAttemptId(String(attemptId));
    if (found) return found;
  }
  if (phone) {
    const norm = normalizePhoneNumber(String(phone));
    if (norm) return db.getActiveVoiceCallByPhone(norm);
  }
  return undefined;
}

voiceCallsRouter.post("/agent-tool/context", (req: Request, res: Response) => {
  if (!verifyAgentToolSecret(req)) {
    return res.status(401).json({ error: "Invalid agent tool secret." });
  }

  const call = resolveActiveCallFromToolPayload(req.body);
  if (!call) {
    return res.status(404).json({ error: "Active call session not found." });
  }

  const farmer = db.getUserById(call.userId);
  const farm = db.getFarmByUserId(call.userId);
  const lang = resolveSarvamLanguage(call.selectedLanguage);

  const updated = db.updateVoiceCall(call.callId, {
    status: call.status === "Initiating" || call.status === "Ringing" ? "Connected" : call.status,
    connectedAt: call.connectedAt || new Date().toISOString()
  }) || call;

  broadcastCallUpdate(updated);

  return res.json({
    callId: updated.callId,
    farmerName: farmer?.name || updated.farmerName,
    selectedLanguage: lang,
    supportedLanguages: SARVAM_VOICE_LANGUAGES.map((l) => ({ code: l.code, name: l.name, nativeName: l.nativeName })),
    farm: farm
      ? {
          state: farm.state,
          district: farm.district,
          village: farm.village,
          crop: farm.crop,
          farmSizeAcres: farm.farmSizeAcres,
          soilType: farm.soilType,
          irrigationSource: farm.irrigationSource,
          sowingDate: farm.sowingDate
        }
      : null
  });
});

voiceCallsRouter.post("/agent-tool/language", (req: Request, res: Response) => {
  if (!verifyAgentToolSecret(req)) {
    return res.status(401).json({ error: "Invalid agent tool secret." });
  }

  const call = resolveActiveCallFromToolPayload(req.body);
  if (!call) {
    return res.status(404).json({ error: "Active call session not found." });
  }

  const langSpec = resolveSarvamLanguage(String(req.body?.language || call.selectedLanguage));
  const updated = db.updateVoiceCall(call.callId, {
    status: "Conversation Active",
    connectedAt: call.connectedAt || new Date().toISOString(),
    selectedLanguage: langSpec.code
  }) || call;

  broadcastCallUpdate(updated);

  return res.json({
    success: true,
    callId: updated.callId,
    selectedLanguage: langSpec
  });
});

voiceCallsRouter.post("/agent-tool/advisory", async (req: Request, res: Response) => {
  if (!verifyAgentToolSecret(req)) {
    return res.status(401).json({ error: "Invalid agent tool secret." });
  }

  try {
    const call = resolveActiveCallFromToolPayload(req.body);
    if (!call) {
      return res.status(404).json({ error: "Active call session not found." });
    }

    const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
    if (!question) {
      return res.status(400).json({ error: "Farmer question text is required." });
    }

    const langSpec = resolveSarvamLanguage(
      typeof req.body?.language === "string" && req.body.language.trim()
        ? req.body.language
        : call.selectedLanguage
    );

    const farmer = db.getUserById(call.userId);
    const farm = db.getFarmByUserId(call.userId);

    const result = await generateVoiceAdvisoryForAgent({
      question,
      languageCode: langSpec.code,
      crop: typeof req.body?.crop === "string" ? req.body.crop : undefined,
      farmer,
      farm
    });

    const topics = Array.from(
      new Set([...(call.topicsDiscussed || []), `${result.detectedCrop} (${result.detectedIntent.replace(/_/g, " ")})`])
    ).slice(0, 10);

    const existingTranscript = call.transcriptConsent ? (call.transcript || []) : undefined;
    const nowIso = new Date().toISOString();
    const updatedTranscript = existingTranscript
      ? [
          ...existingTranscript,
          { role: "farmer" as const, text: question, language: langSpec.code, timestamp: nowIso },
          { role: "assistant" as const, text: result.spokenResponse, language: langSpec.code, timestamp: nowIso }
        ]
      : undefined;

    const updated = db.updateVoiceCall(call.callId, {
      status: "Conversation Active",
      connectedAt: call.connectedAt || nowIso,
      selectedLanguage: langSpec.code,
      topicsDiscussed: topics,
      transcript: updatedTranscript
    }) || call;

    broadcastCallUpdate(updated);

    return res.json({
      callId: updated.callId,
      spoken_response: result.spokenResponse,
      language: result.language.code,
      tts_effective_language: result.language.ttsEffectiveLanguageCode,
      detected_crop: result.detectedCrop,
      detected_intent: result.detectedIntent,
      confidence: result.confidence,
      high_risk_warning: result.highRiskWarning,
      sources: result.sources
    });
  } catch (err: any) {
    console.error("[Sarvam Agent Tool Advisory Error]:", err);
    return res.status(500).json({ error: err?.message || "Failed to generate ICAR agricultural advisory." });
  }
});

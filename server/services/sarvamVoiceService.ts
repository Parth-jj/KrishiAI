import crypto from "crypto";
import { db, FarmRecord, UserRecord, VoiceCallRecord, VoiceCallTranscriptTurn } from "../db.js";
import { extractQueryContext, retrieveRelevantKnowledge } from "../ragEngine.js";
import { GeminiLLMProvider } from "../llmService.js";

export interface SarvamLanguageSpec {
  code: string;
  shortCode: string;
  name: string;
  nativeName: string;
  sttModel: string;
  ttsModel: string;
  ttsSupportedNatively: boolean;
  ttsEffectiveLanguageCode: string;
  recommendedSpeaker: string;
  notes?: string;
}

export const SARVAM_VOICE_LANGUAGES: SarvamLanguageSpec[] = [
  {
    code: "te-IN",
    shortCode: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    sttModel: "saaras:v4",
    ttsModel: "bulbul:v4-flash",
    ttsSupportedNatively: true,
    ttsEffectiveLanguageCode: "te-IN",
    recommendedSpeaker: "manisha"
  },
  {
    code: "hi-IN",
    shortCode: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    sttModel: "saaras:v4",
    ttsModel: "bulbul:v4-flash",
    ttsSupportedNatively: true,
    ttsEffectiveLanguageCode: "hi-IN",
    recommendedSpeaker: "anushka"
  },
  {
    code: "en-IN",
    shortCode: "en",
    name: "English",
    nativeName: "English (India)",
    sttModel: "saaras:v4",
    ttsModel: "bulbul:v4-flash",
    ttsSupportedNatively: true,
    ttsEffectiveLanguageCode: "en-IN",
    recommendedSpeaker: "anushka"
  },
  {
    code: "ta-IN",
    shortCode: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    sttModel: "saaras:v4",
    ttsModel: "bulbul:v4-flash",
    ttsSupportedNatively: true,
    ttsEffectiveLanguageCode: "ta-IN",
    recommendedSpeaker: "manisha"
  },
  {
    code: "kn-IN",
    shortCode: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    sttModel: "saaras:v4",
    ttsModel: "bulbul:v4-flash",
    ttsSupportedNatively: true,
    ttsEffectiveLanguageCode: "kn-IN",
    recommendedSpeaker: "anushka"
  },
  {
    code: "ml-IN",
    shortCode: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    sttModel: "saaras:v4",
    ttsModel: "bulbul:v4-flash",
    ttsSupportedNatively: true,
    ttsEffectiveLanguageCode: "ml-IN",
    recommendedSpeaker: "anushka"
  },
  {
    code: "mr-IN",
    shortCode: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    sttModel: "saaras:v4",
    ttsModel: "bulbul:v4-flash",
    ttsSupportedNatively: true,
    ttsEffectiveLanguageCode: "mr-IN",
    recommendedSpeaker: "anushka"
  },
  {
    code: "gu-IN",
    shortCode: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    sttModel: "saaras:v4",
    ttsModel: "bulbul:v4-flash",
    ttsSupportedNatively: true,
    ttsEffectiveLanguageCode: "gu-IN",
    recommendedSpeaker: "anushka"
  },
  {
    code: "bn-IN",
    shortCode: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    sttModel: "saaras:v4",
    ttsModel: "bulbul:v4-flash",
    ttsSupportedNatively: true,
    ttsEffectiveLanguageCode: "bn-IN",
    recommendedSpeaker: "anushka"
  },
  {
    code: "pa-IN",
    shortCode: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    sttModel: "saaras:v4",
    ttsModel: "bulbul:v4-flash",
    ttsSupportedNatively: true,
    ttsEffectiveLanguageCode: "pa-IN",
    recommendedSpeaker: "anushka"
  },
  {
    code: "od-IN",
    shortCode: "or",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    sttModel: "saaras:v4",
    ttsModel: "bulbul:v4-flash",
    ttsSupportedNatively: true,
    ttsEffectiveLanguageCode: "od-IN",
    recommendedSpeaker: "anushka",
    notes: "Sarvam API uses BCP-47 code od-IN for Odia."
  },
  {
    code: "as-IN",
    shortCode: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    sttModel: "saaras:v4",
    ttsModel: "bulbul:v4-flash",
    ttsSupportedNatively: false,
    ttsEffectiveLanguageCode: "bn-IN",
    recommendedSpeaker: "anushka",
    notes: "Saaras v4 STT understands Assamese speech natively; Bulbul TTS falls back to bn-IN/en-IN voice output."
  }
];

export class SarvamConfigError extends Error {
  missingVariables: string[];
  constructor(message: string, missingVariables: string[]) {
    super(message);
    this.name = "SarvamConfigError";
    this.missingVariables = missingVariables;
  }
}

export class SarvamApiError extends Error {
  statusCode: number;
  upstreamCode?: string;
  constructor(message: string, statusCode = 502, upstreamCode?: string) {
    super(message);
    this.name = "SarvamApiError";
    this.statusCode = statusCode;
    this.upstreamCode = upstreamCode;
  }
}

export function resolveSarvamLanguage(input?: string): SarvamLanguageSpec {
  const raw = (input || "").trim().toLowerCase();
  if (!raw || raw === "auto") {
    return SARVAM_VOICE_LANGUAGES[2]; // English (India) default until farmer selects on call
  }

  const aliasMap: Record<string, string> = {
    te: "te-IN",
    telugu: "te-IN",
    hi: "hi-IN",
    hindi: "hi-IN",
    en: "en-IN",
    english: "en-IN",
    ta: "ta-IN",
    tamil: "ta-IN",
    kn: "kn-IN",
    kannada: "kn-IN",
    ml: "ml-IN",
    malayalam: "ml-IN",
    mr: "mr-IN",
    marathi: "mr-IN",
    gu: "gu-IN",
    gujarati: "gu-IN",
    bn: "bn-IN",
    bengali: "bn-IN",
    bangla: "bn-IN",
    pa: "pa-IN",
    punjabi: "pa-IN",
    or: "od-IN",
    "or-in": "od-IN",
    od: "od-IN",
    odia: "od-IN",
    oriya: "od-IN",
    as: "as-IN",
    assamese: "as-IN"
  };

  const mappedCode = aliasMap[raw] || input!.trim();
  const found = SARVAM_VOICE_LANGUAGES.find(
    (l) => l.code.toLowerCase() === mappedCode.toLowerCase() || l.shortCode === raw
  );
  return found || SARVAM_VOICE_LANGUAGES[2];
}

export interface SarvamConfigStatus {
  configured: boolean;
  missingVariables: string[];
  models: {
    stt: string;
    tts: string;
    llm: string;
  };
  webhookSecretConfigured: boolean;
  toolSecretConfigured: boolean;
  vobizHangupConfigured: boolean;
  agentPhoneConfigured: boolean;
}

export function getSarvamConfigStatus(): SarvamConfigStatus {
  const requiredMap: Array<[string, string | undefined]> = [
    ["SARVAM_API_KEY", process.env.SARVAM_API_KEY],
    ["SARVAM_ORG_ID", process.env.SARVAM_ORG_ID],
    ["SARVAM_WORKSPACE_ID", process.env.SARVAM_WORKSPACE_ID],
    ["SARVAM_AGENT_APP_ID", process.env.SARVAM_AGENT_APP_ID],
    ["SARVAM_CONNECTION_ID", process.env.SARVAM_CONNECTION_ID],
    ["SARVAM_AGENT_PHONE_NUMBER", process.env.SARVAM_AGENT_PHONE_NUMBER]
  ];

  const missingVariables = requiredMap
    .filter(([, value]) => !value || !value.trim())
    .map(([key]) => key);

  return {
    configured: missingVariables.length === 0,
    missingVariables,
    models: {
      stt: process.env.SARVAM_STT_MODEL || "saaras:v4",
      tts: process.env.SARVAM_TTS_MODEL || "bulbul:v4-flash",
      llm: process.env.SARVAM_LLM_MODEL || "sarvam-105b"
    },
    webhookSecretConfigured: Boolean(process.env.SARVAM_WEBHOOK_SECRET?.trim()),
    toolSecretConfigured: Boolean(process.env.SARVAM_TOOL_SECRET?.trim()),
    vobizHangupConfigured: Boolean(process.env.VOBIZ_AUTH_ID?.trim() && process.env.VOBIZ_AUTH_TOKEN?.trim()),
    agentPhoneConfigured: Boolean(process.env.SARVAM_AGENT_PHONE_NUMBER?.trim())
  };
}

export function getSarvamAgentSystemPrompt(farmer?: UserRecord, farm?: FarmRecord, preferredLang?: SarvamLanguageSpec): string {
  const langLabel = preferredLang ? `${preferredLang.name} (${preferredLang.code})` : "Farmer's preferred Indian language";
  return `You are KrishiAI Sahayak, a friendly, patient, respectful Indian agricultural voice assistant speaking with a farmer on a phone call.

GREETING & LANGUAGE SELECTION:
1. Greet the farmer warmly ("Namaste! Welcome to KrishiAI Farmer Helpline.").
2. Ask which language they prefer from Telugu, Hindi, English, Tamil, Kannada, Malayalam, Marathi, Gujarati, Bengali, Punjabi, Odia, or Assamese. (Current hint: ${langLabel}).
3. Immediately switch to the language the farmer chooses, and allow switching languages at any moment during the call by calling the update_call_language tool.
4. Call fetch_farmer_context at the start of the conversation if details are missing.

FARMER PROFILE CONTEXT:
- Farmer Name: ${farmer?.name || "Registered Farmer"}
- District / State: ${farm ? `${farm.district}, ${farm.state}` : "Ask the farmer for their district"}
- Primary Crop: ${farm?.crop || "Ask which crop they are growing"}
- Farm Size: ${farm?.farmSizeAcres ? `${farm.farmSizeAcres} acres` : "Not specified"}
- Soil / Irrigation: ${farm ? `${farm.soilType}, ${farm.irrigationSource}` : "Not specified"}

CONVERSATIONAL RULES (CRITICAL):
- Keep every spoken turn concise (2 to 4 short sentences), natural, warm, and easy to understand over a telephone line.
- Avoid complicated scientific jargon; use simple rural terminology and tank/acre equivalents when explaining sprays.
- Support regional-language and mixed-language questions smoothly.
- Ask follow-up questions before prescribing treatment when symptoms or crop growth stage are unclear.
- Before answering questions about crop diseases, pests, fertilizers, irrigation, soil health, weather, harvesting, or government agricultural schemes, ALWAYS call the get_krishiai_advisory tool connected to KrishiAI's ICAR knowledge base.
- NEVER invent agricultural facts, weather forecasts, scheme eligibility rules, or chemical dosages.
- If the tool returns uncertainty, low confidence, or involves high-toxicity pesticides/chemicals, clearly state the uncertainty and recommend contacting the local Krishi Vigyan Kendra (KVK) scientist or Mandal Agricultural Officer before spraying.
- Pause immediately when the farmer interrupts or speaks (barge-in friendly).`;
}

export function getSarvamAgentBlueprint(appBaseUrl: string) {
  const cleanBase = appBaseUrl.replace(/\/+$/, "");
  const config = getSarvamConfigStatus();
  return {
    agentName: "KrishiAI Farmer Voice Assistant",
    models: config.models,
    bargeInAndInterruptions: true,
    supportedLanguages: SARVAM_VOICE_LANGUAGES,
    systemPrompt: getSarvamAgentSystemPrompt(),
    webhookEndpoint: `${cleanBase}/api/voice-calls/webhook`,
    apiTools: [
      {
        name: "fetch_farmer_context",
        method: "POST",
        url: `${cleanBase}/api/voice-calls/agent-tool/context`,
        description: "Fetches the registered farmer's crop, location, soil, irrigation, and active session language by callId or sarvamAttemptId."
      },
      {
        name: "get_krishiai_advisory",
        method: "POST",
        url: `${cleanBase}/api/voice-calls/agent-tool/advisory`,
        description: "Retrieves ICAR-grounded agricultural advisory, chemical safety cautions, and local weather spray window for the farmer's spoken question."
      },
      {
        name: "update_call_language",
        method: "POST",
        url: `${cleanBase}/api/voice-calls/agent-tool/language`,
        description: "Switches the active conversation language among the 12 supported Indian languages mid-call."
      }
    ]
  };
}

export async function initiateSarvamOutboundCall(params: {
  callId: string;
  sessionId: string;
  user: UserRecord;
  farm?: FarmRecord;
  targetPhoneNormalized: string;
  selectedLanguage: SarvamLanguageSpec;
}): Promise<{ attemptId: string; rawResponse: any }> {
  const status = getSarvamConfigStatus();
  if (!status.configured) {
    throw new SarvamConfigError(
      `Sarvam AI Voice Agent telephony is not configured yet. Missing environment variables: ${status.missingVariables.join(", ")}.`,
      status.missingVariables
    );
  }

  const apiKey = process.env.SARVAM_API_KEY!.trim();
  const orgId = process.env.SARVAM_ORG_ID!.trim();
  const workspaceId = process.env.SARVAM_WORKSPACE_ID!.trim();
  const appId = process.env.SARVAM_AGENT_APP_ID!.trim();
  const appVersion = Number(process.env.SARVAM_AGENT_APP_VERSION || "1") || 1;
  const connectionId = process.env.SARVAM_CONNECTION_ID!.trim();
  const agentPhoneNumber = process.env.SARVAM_AGENT_PHONE_NUMBER!.trim();
  const webhookId = process.env.SARVAM_WEBHOOK_ID?.trim();

  const endpoint = `https://apps.sarvam.ai/api/outbounds/v1/orgs/${encodeURIComponent(orgId)}/workspaces/${encodeURIComponent(workspaceId)}/outbounds`;

  const payload: Record<string, any> = {
    app_config: {
      app_id: appId,
      app_version: appVersion,
      connection_config: {
        connection_id: connectionId,
        agent_phone_number: agentPhoneNumber
      }
    },
    user_config: {
      user_phone_number: params.targetPhoneNormalized
    },
    webhook_config: webhookId
      ? {
          webhook_id: webhookId,
          metadata: {
            callId: params.callId,
            sessionId: params.sessionId,
            userId: params.user.id,
            farmerName: params.user.name,
            preferredLanguage: params.selectedLanguage.code,
            crop: params.farm?.crop || "",
            district: params.farm?.district || "",
            state: params.farm?.state || ""
          }
        }
      : null
  };

  let response: globalThis.Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000)
    });
  } catch (err: any) {
    throw new SarvamApiError(
      `Unable to reach Sarvam Voice Agents API (${err?.message || "network timeout"}). Please verify internet connectivity and try again.`,
      502,
      "SARVAM_NETWORK_ERROR"
    );
  }

  let body: any = null;
  const rawText = await response.text();
  try {
    body = rawText ? JSON.parse(rawText) : null;
  } catch {
    body = { raw: rawText };
  }

  if (!response.ok) {
    const upstreamMsg =
      body?.detail ||
      body?.message ||
      body?.error ||
      (typeof body?.raw === "string" ? body.raw.slice(0, 220) : "") ||
      `Sarvam Outbound API rejected request with status ${response.status}`;

    throw new SarvamApiError(
      typeof upstreamMsg === "string" ? upstreamMsg : JSON.stringify(upstreamMsg),
      response.status >= 400 && response.status < 500 ? 400 : 502,
      `SARVAM_HTTP_${response.status}`
    );
  }

  const attemptId = body?.attempt_id || body?.attemptId || body?.id;
  if (!attemptId) {
    throw new SarvamApiError(
      "Sarvam Outbound API succeeded without returning an attempt_id.",
      502,
      "SARVAM_INVALID_RESPONSE"
    );
  }

  return { attemptId: String(attemptId), rawResponse: body };
}

export async function terminateExternalTelephonyCall(call: VoiceCallRecord): Promise<{
  terminatedUpstream: boolean;
  providerNote: string;
}> {
  const vobizAuthId = process.env.VOBIZ_AUTH_ID?.trim();
  const vobizAuthToken = process.env.VOBIZ_AUTH_TOKEN?.trim();

  if (vobizAuthId && vobizAuthToken && call.vobizCallUuid) {
    try {
      const authHeader = Buffer.from(`${vobizAuthId}:${vobizAuthToken}`).toString("base64");
      const res = await fetch(
        `https://api.vobiz.ai/api/v1/Account/${encodeURIComponent(vobizAuthId)}/Call/${encodeURIComponent(call.vobizCallUuid)}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Basic ${authHeader}` },
          signal: AbortSignal.timeout(8000)
        }
      );
      if (res.ok || res.status === 204) {
        return {
          terminatedUpstream: true,
          providerNote: "Active telephony channel disconnected via Vobiz REST API."
        };
      }
      return {
        terminatedUpstream: false,
        providerNote: `Telephony hangup returned HTTP ${res.status}; call marked ended in KrishiAI.`
      };
    } catch (err: any) {
      return {
        terminatedUpstream: false,
        providerNote: `Telephony hangup request failed (${err?.message || "network error"}); session closed locally.`
      };
    }
  }

  return {
    terminatedUpstream: false,
    providerNote: "Call session ended in KrishiAI. Sarvam Voice Agent built-in End Call tool handles live voice hangup."
  };
}

export function verifySarvamWebhookSignature(rawBody: string, signatureHeader?: string): boolean {
  const secret = process.env.SARVAM_WEBHOOK_SECRET?.trim();
  if (!secret) {
    // Allow local/initial webhooks only if secret is unset; reject any invalid signature when secret IS configured.
    return true;
  }
  if (!signatureHeader) return false;

  const cleanedSig = signatureHeader.replace(/^sha256=/i, "").trim();
  const expectedHex = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBase64 = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");

  const checkEqual = (a: string, b: string) => {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  };

  return checkEqual(cleanedSig, expectedHex) || checkEqual(cleanedSig, expectedBase64);
}

export function mapSarvamFailureReason(rawStatus?: string, rawReason?: string): string {
  const combined = `${rawStatus || ""} ${rawReason || ""}`.toLowerCase();
  if (combined.includes("busy")) {
    return "The farmer's phone line was busy. Please wait a moment and try calling again.";
  }
  if (combined.includes("no_answer") || combined.includes("no answer") || combined.includes("unanswered") || combined.includes("timeout")) {
    return "The call was not answered. Please keep your phone nearby and tap Retry Call.";
  }
  if (combined.includes("ndnc") || combined.includes("dnd")) {
    return "Telecom DND restriction blocked the automated call. Please register transactional caller ID or call from an allowed number.";
  }
  if (combined.includes("invalid") || combined.includes("unallocated")) {
    return "The mobile number could not be reached by the telecom network. Please verify your registered number.";
  }
  if (combined.includes("disconnect") || combined.includes("dropped")) {
    return "The call was disconnected unexpectedly due to mobile signal drop. Please tap Retry Call.";
  }
  if (rawReason && rawReason.trim()) {
    return `Call could not be completed: ${rawReason.trim()}`;
  }
  return "The call could not connect due to a temporary telephony or network issue. Please try again.";
}

export function buildConversationSummary(
  call: VoiceCallRecord,
  transcriptTurns: VoiceCallTranscriptTurn[],
  finalVariables?: Record<string, any>
): string {
  if (finalVariables && typeof finalVariables.summary === "string" && finalVariables.summary.trim()) {
    return finalVariables.summary.trim();
  }
  if (call.topicsDiscussed && call.topicsDiscussed.length > 0) {
    const langSpec = resolveSarvamLanguage(call.selectedLanguage);
    return `Discussed ${call.topicsDiscussed.slice(0, 4).join(", ")} in ${langSpec.name} (${langSpec.code}).`;
  }
  const farmerTurns = transcriptTurns.filter((t) => t.role === "farmer");
  if (farmerTurns.length > 0) {
    const firstQ = farmerTurns[0].text.slice(0, 120);
    return `Voice consultation completed (${farmerTurns.length} farmer questions). Initial topic: "${firstQ}${farmerTurns[0].text.length > 120 ? "..." : ""}"`;
  }
  return call.status === "Completed"
    ? "AI voice call completed."
    : call.failureReason || "Call ended before conversation started.";
}

const geminiProvider = new GeminiLLMProvider();

export async function generateVoiceAdvisoryForAgent(params: {
  question: string;
  languageCode: string;
  crop?: string;
  farmer?: UserRecord;
  farm?: FarmRecord;
}): Promise<{
  spokenResponse: string;
  language: SarvamLanguageSpec;
  detectedCrop: string;
  detectedIntent: string;
  confidence: "low" | "medium" | "high";
  sources: string[];
  highRiskWarning: boolean;
}> {
  const langSpec = resolveSarvamLanguage(params.languageCode);
  const activeCrop = params.crop || params.farm?.crop || undefined;
  const extracted = extractQueryContext(params.question, activeCrop);
  const topK = parseInt(process.env.TOP_K_DOCUMENTS || "4", 10);
  const retrievedChunks = await retrieveRelevantKnowledge(
    params.question,
    extracted.crop,
    extracted.category,
    topK
  );

  const highRiskChemicalKeywords = [
    "monocrotophos",
    "phorate",
    "carbofuran",
    "paraquat",
    "organophosphate",
    "mix chemicals",
    "double dose",
    "herbicide",
    "weedicide",
    "poison",
    "insecticide",
    "fungicide",
    "pesticide",
    "spray"
  ];
  const lowerQ = params.question.toLowerCase();
  const isHighRiskDecision = highRiskChemicalKeywords.some((kw) => lowerQ.includes(kw));

  const knowledgeSnippets = retrievedChunks
    .map((r, i) => `[${i + 1}] (${r.chunk.source} - ${r.chunk.title}): ${r.chunk.text}`)
    .join("\n");

  const farmContextSummary = params.farm
    ? `${params.farm.crop} in ${params.farm.district}, ${params.farm.state} (${params.farm.farmSizeAcres} acres, ${params.farm.soilType})`
    : "Location/crop not fully set";

  // 1. Prefer Sarvam-105b conversational reasoning if SARVAM_API_KEY is available
  const sarvamApiKey = process.env.SARVAM_API_KEY?.trim();
  const sarvamLlmModel = process.env.SARVAM_LLM_MODEL || "sarvam-105b";

  if (sarvamApiKey) {
    try {
      const prompt = `You are KrishiAI, a patient, friendly agricultural voice assistant on a live phone call with an Indian farmer.
Respond strictly in ${langSpec.name} (${langSpec.code}) using simple, everyday spoken language (max 4 short sentences suitable for text-to-speech over phone).

Farmer Profile: ${params.farmer?.name || "Farmer"} | Farm: ${farmContextSummary}
Farmer Question: "${params.question}"

Authoritative ICAR Knowledge Retrieved:
${knowledgeSnippets || "NO SPECIFIC DOCUMENT FOUND IN KNOWLEDGE BASE."}

STRICT RULES:
- Base agricultural remedies and dosages ONLY on the Authoritative ICAR Knowledge Retrieved above.
- NEVER invent weather forecasts, government scheme eligibility dates/amounts, or chemical dosages not present in the retrieved knowledge.
- If the retrieved knowledge does not contain a clear answer, say honestly that you do not want to guess and advise speaking to their local Krishi Vigyan Kendra (KVK) scientist or Mandal Agricultural Officer.
- ${isHighRiskDecision ? "Since this involves chemical spraying/pesticides, remind the farmer to verify exact dosage with a local agricultural officer or dealer label and wear a protective mask." : "Give practical, step-by-step guidance."}`;

      const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": sarvamApiKey
        },
        body: JSON.stringify({
          model: sarvamLlmModel,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 350
        }),
        signal: AbortSignal.timeout(9000)
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) {
          return {
            spokenResponse: text,
            language: langSpec,
            detectedCrop: extracted.crop || activeCrop || "General Agriculture",
            detectedIntent: extracted.category,
            confidence: retrievedChunks[0]?.similarityScore >= 0.4 ? "high" : retrievedChunks.length > 0 ? "medium" : "low",
            sources: retrievedChunks.map((rc) => rc.chunk.title),
            highRiskWarning: isHighRiskDecision
          };
        }
      }
    } catch (err) {
      console.warn("[Sarvam LLM Tool] Falling back to KrishiAI ICAR RAG provider:", err);
    }
  }

  // 2. Fall back to KrishiAI's existing ICAR-grounded RAG + Gemini/offline engine
  const advisory = await geminiProvider.generateAdvisory(
    params.question,
    extracted,
    retrievedChunks,
    {
      farmerName: params.farmer?.name || "Farmer",
      state: params.farm?.state || "India",
      district: params.farm?.district || "",
      village: params.farm?.village,
      farmSizeAcres: params.farm?.farmSizeAcres,
      crop: activeCrop || extracted.crop || "Paddy",
      soilType: params.farm?.soilType,
      preferredLanguage: langSpec.shortCode
    },
    langSpec.shortCode
  );

  const firstRec = advisory.recommendations?.[0];
  const secondRec = advisory.recommendations?.[1];
  const safetyNote = isHighRiskDecision
    ? " For high-risk pesticide sprays, please confirm the exact dose with your nearest KVK scientist or Mandal Agricultural Officer before spraying."
    : "";

  const spokenParts = [
    advisory.summary_in_preferred_language ||
      `${advisory.problem}. ${firstRec ? `${firstRec.title}: ${firstRec.description}` : ""}`,
    secondRec ? `Next step: ${secondRec.description}` : "",
    advisory.confidence === "low"
      ? "I am not completely certain without inspecting the field, so please consult your local KVK agricultural officer."
      : safetyNote
  ].filter(Boolean);

  return {
    spokenResponse: spokenParts.join(" ").trim(),
    language: langSpec,
    detectedCrop: advisory.crop || extracted.crop || "General Agriculture",
    detectedIntent: extracted.category,
    confidence: advisory.confidence,
    sources: (advisory.sources || []).map((s) => s.title),
    highRiskWarning: isHighRiskDecision || advisory.confidence === "low"
  };
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  PhoneMissed,
  ShieldCheck,
  Languages,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  X,
  Volume2,
  FileText,
  History,
  Info,
  Loader2,
  UserPlus
} from "lucide-react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.js";
import { saveVoiceCallToFirestore } from "../services/firestoreService.js";
import { firebaseAuth } from "../firebase.js";
import {
  VoiceCallConfigStatus,
  VoiceCallRecord,
  VoiceCallStatus
} from "../types/index.js";

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "call" | "history";
  onSwitchToRegister?: () => void;
}

const STATUS_STEPS: VoiceCallStatus[] = [
  "Initiating",
  "Ringing",
  "Connected",
  "Conversation Active",
  "Completed"
];

function formatDuration(seconds?: number): string {
  const s = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  isOpen,
  onClose,
  defaultTab = "call",
  onSwitchToRegister
}) => {
  const { user, isAuthenticated, isFirebaseAuth } = useAuth();

  const [activeTab, setActiveTab] = useState<"call" | "history">(defaultTab);
  const [config, setConfig] = useState<VoiceCallConfigStatus | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Form states
  const [mobileNumber, setMobileNumber] = useState(user?.phone || "");
  const [selectedLanguage, setSelectedLanguage] = useState("te-IN");
  const [callConsent, setCallConsent] = useState(false);
  const [transcriptConsent, setTranscriptConsent] = useState(true);

  // Active call session state (isolated per callId + callToken)
  const [activeCall, setActiveCall] = useState<VoiceCallRecord | null>(null);
  const [callToken, setCallToken] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isSwitchingLang, setIsSwitchingLang] = useState(false);

  // Error & configuration feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [missingEnvVars, setMissingEnvVars] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Authenticated call history
  const [historyCalls, setHistoryCalls] = useState<VoiceCallRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

  useEffect(() => {
    if (user?.phone && !mobileNumber) {
      setMobileNumber(user.phone);
    }
  }, [user?.phone]);

  // Load Sarvam Voice Agent configuration on open
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoadingConfig(true);
    api
      .getVoiceCallConfig()
      .then((cfg) => {
        if (!cancelled) {
          setConfig(cfg);
          setMissingEnvVars(cfg.missingVariables || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("Could not fetch voice call config:", err);
          setErrorMsg(
            err instanceof Error
              ? err.message
              : "Could not load voice call configuration from server."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingConfig(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Load history if authenticated and viewing History tab
  useEffect(() => {
    if (!isOpen || !isAuthenticated || activeTab !== "history") return;
    let cancelled = false;
    setLoadingHistory(true);
    api
      .getVoiceCallHistory()
      .then((calls) => {
        if (!cancelled) setHistoryCalls(calls);
      })
      .catch((err) => {
        if (!cancelled) console.warn("Could not load call history:", err);
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, isAuthenticated, activeTab]);

  // Sync completed/failed call to Firestore for Firebase Google Sign-In users
  useEffect(() => {
    if (
      activeCall &&
      (activeCall.status === "Completed" || activeCall.status === "Failed") &&
      isFirebaseAuth &&
      firebaseAuth.currentUser
    ) {
      saveVoiceCallToFirestore(firebaseAuth.currentUser.uid, activeCall).catch((err) => {
        console.warn("Could not mirror voice call summary to Firestore:", err);
      });
    }
  }, [activeCall?.status, activeCall?.callId, isFirebaseAuth]);

  const isCallInProgress = useMemo(() => {
    if (!activeCall) return false;
    return (
      activeCall.status === "Initiating" ||
      activeCall.status === "Ringing" ||
      activeCall.status === "Connected" ||
      activeCall.status === "Conversation Active"
    );
  }, [activeCall?.status]);

  // Live call duration timer
  useEffect(() => {
    if (!activeCall || !isCallInProgress) return;
    const anchor = activeCall.connectedAt || activeCall.startedAt;
    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(anchor).getTime()) / 1000));
      setElapsedSeconds(diff);
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [activeCall?.callId, activeCall?.connectedAt, activeCall?.startedAt, isCallInProgress]);

  // Real-time SSE stream + safe polling fallback for the active callId
  useEffect(() => {
    if (!isOpen || !activeCall || !isCallInProgress) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const streamUrl = callToken
      ? `/api/voice-calls/${encodeURIComponent(activeCall.callId)}/events?callToken=${encodeURIComponent(callToken)}`
      : `/api/voice-calls/${encodeURIComponent(activeCall.callId)}/events`;

    let es: EventSource | null = null;
    try {
      es = new EventSource(streamUrl);
      eventSourceRef.current = es;
      es.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(evt.data);
          if (parsed?.call) {
            setActiveCall(parsed.call);
          }
        } catch {
          // ignore malformed heartbeat/frame
        }
      };
    } catch {
      // Fallback to polling below
    }

    const pollInterval = setInterval(() => {
      api
        .getVoiceCallStatus(activeCall.callId, callToken)
        .then((updated) => setActiveCall(updated))
        .catch(() => {});
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      if (es) es.close();
      eventSourceRef.current = null;
    };
  }, [isOpen, activeCall?.callId, callToken, isCallInProgress]);

  if (!isOpen) return null;

  const handleStartCall = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setErrorCode(null);

    if (!mobileNumber.trim()) {
      setErrorMsg("Please enter your registered 10-digit mobile number.");
      setErrorCode("INVALID_MOBILE_NUMBER");
      return;
    }

    if (!callConsent) {
      setErrorMsg("Please tick the consent box so we may place the AI voice call to your phone.");
      setErrorCode("CONSENT_REQUIRED");
      return;
    }

    setIsCalling(true);
    try {
      const { callToken: issuedToken, call } = await api.initiateVoiceCall({
        mobileNumber: mobileNumber.trim(),
        preferredLanguage: selectedLanguage,
        callConsent,
        transcriptConsent
      });
      setCallToken(issuedToken);
      setActiveCall(call);
      setElapsedSeconds(0);
    } catch (err: any) {
      setErrorMsg(err?.message || "Unable to initiate AI voice call. Please try again.");
      setErrorCode(err?.code || "CALL_FAILED");
      if (Array.isArray(err?.missingVariables) && err.missingVariables.length > 0) {
        setMissingEnvVars(err.missingVariables);
      }
      if (err?.call) {
        setActiveCall(err.call);
        if (err.callToken) setCallToken(err.callToken);
      }
    } finally {
      setIsCalling(false);
    }
  };

  const handleEndCall = async () => {
    if (!activeCall) return;
    setIsEnding(true);
    try {
      const { call } = await api.endVoiceCall(activeCall.callId, callToken);
      setActiveCall(call);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to end call cleanly.");
    } finally {
      setIsEnding(false);
    }
  };

  const handleSwitchLanguage = async (langCode: string) => {
    setSelectedLanguage(langCode);
    if (!activeCall || !isCallInProgress) return;
    setIsSwitchingLang(true);
    try {
      const updated = await api.switchVoiceCallLanguage(activeCall.callId, langCode, callToken);
      setActiveCall(updated);
    } catch (err: any) {
      setErrorMsg(err?.message || "Could not switch language.");
    } finally {
      setIsSwitchingLang(false);
    }
  };

  const handleResetCall = () => {
    setActiveCall(null);
    setCallToken(null);
    setErrorMsg(null);
    setErrorCode(null);
    setElapsedSeconds(0);
  };

  const getStatusBadgeStyle = (status: VoiceCallStatus) => {
    switch (status) {
      case "Initiating":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "Ringing":
        return "bg-sky-100 text-sky-900 border-sky-300";
      case "Connected":
      case "Conversation Active":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      case "Completed":
        return "bg-[#EBF3EA] text-[#1B3F23] border-[#C5E1A5]";
      case "Failed":
        return "bg-rose-100 text-rose-900 border-rose-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A2E1A]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="bg-[#FAF8F5] rounded-[32px] max-w-2xl w-full border-2 border-[#D5E5D3] shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="bg-[#256030] text-white px-6 py-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <PhoneCall className="w-6 h-6 text-[#FFD700]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                AI Voice Call Helpline
              </h2>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                Talk directly in your language with KrishiAI (Sarvam AI Voice Agents)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close voice call assistant"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Optional History Toggle when Farmer is Signed In */}
        {isAuthenticated && (
          <div className="bg-white border-b border-[#EAE5DC] px-6 py-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("call")}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeTab === "call"
                  ? "bg-[#EBF3EA] text-[#1B3F23]"
                  : "text-[#6E8070] hover:bg-[#FAF8F5]"
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Request Voice Call</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeTab === "history"
                  ? "bg-[#EBF3EA] text-[#1B3F23]"
                  : "text-[#6E8070] hover:bg-[#FAF8F5]"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>My Call Summaries</span>
            </button>
          </div>
        )}

        <div className="p-5 sm:p-7 space-y-5 max-h-[78vh] overflow-y-auto">
          {activeTab === "history" && isAuthenticated ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#1B3F23]">
                  Previous AI Voice Call Summaries
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setLoadingHistory(true);
                    api
                      .getVoiceCallHistory()
                      .then(setHistoryCalls)
                      .finally(() => setLoadingHistory(false));
                  }}
                  className="text-xs font-bold text-[#256030] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-10 flex items-center justify-center gap-2 text-xs font-bold text-[#6E8070]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#256030]" />
                  <span>Loading your voice call summaries...</span>
                </div>
              ) : historyCalls.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 text-center space-y-2">
                  <PhoneMissed className="w-8 h-8 text-[#6E8070] mx-auto opacity-70" />
                  <p className="text-sm font-bold text-[#1B3F23]">No voice calls recorded yet</p>
                  <p className="text-xs text-[#6E8070]">
                    Start a call from the Request Voice Call tab to receive telephone farming guidance.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyCalls.map((item) => (
                    <div
                      key={item.callId}
                      className="bg-white rounded-2xl border border-[#E5E0D8] p-4 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                          <span className="text-xs font-bold text-[#1B3F23]">
                            {item.selectedLanguageName || item.selectedLanguage}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#6E8070]">
                          {new Date(item.startedAt).toLocaleString()} • {formatDuration(item.durationSeconds)}
                        </span>
                      </div>

                      <p className="text-xs text-[#2E4230] font-medium leading-relaxed">
                        {item.summary || item.failureReason || "Voice consultation logged."}
                      </p>

                      {item.topicsDiscussed && item.topicsDiscussed.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {item.topicsDiscussed.map((topic, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EBF3EA] text-[#256030]"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.transcriptConsent && item.transcript && item.transcript.length > 0 && (
                        <details className="pt-1 border-t border-[#F0ECE4]">
                          <summary className="text-[11px] font-bold text-[#256030] cursor-pointer">
                            View Consented Call Transcript ({item.transcript.length} turns)
                          </summary>
                          <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {item.transcript.map((turn, idx) => (
                              <div key={idx} className="text-[11px] bg-[#FAF8F5] rounded-xl px-3 py-2">
                                <span className="font-black text-[#1B3F23]">
                                  {turn.role === "farmer" ? "You: " : "KrishiAI: "}
                                </span>
                                <span className="text-[#3C513E]">{turn.text}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Configuration Readiness Banner (Honest disclosure if env vars are missing) */}
              {!loadingConfig && config && !config.configured && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-amber-950">
                        Telephony Credentials Required for Live Calls
                      </h4>
                      <p className="text-xs text-amber-900 leading-relaxed font-medium">
                        Real telephone calling uses Sarvam AI Voice Agents (Saaras STT + Bulbul TTS) and a registered Indian agent number. Configure these server secrets in your environment panel before placing live calls:
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(missingEnvVars.length > 0 ? missingEnvVars : config.missingVariables).map((v) => (
                          <code
                            key={v}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 border border-amber-300"
                          >
                            {v}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Alert Banner */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 space-y-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-rose-900">{errorMsg}</p>
                        {errorCode === "USER_NOT_REGISTERED" && onSwitchToRegister && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSwitchToRegister();
                            }}
                            className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#256030] text-white text-xs font-black hover:bg-[#1B3F23] transition cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Create Farmer Account with Mobile Number</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* View 1: Active / Recent Call Monitor */}
              {activeCall ? (
                <div className="bg-white rounded-3xl border border-[#E5E0D8] p-5 sm:p-6 space-y-5 shadow-sm">
                  {/* Call Status Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFEAE0]">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          activeCall.status === "Failed"
                            ? "bg-rose-100 text-rose-700"
                            : activeCall.status === "Completed"
                              ? "bg-[#EBF3EA] text-[#256030]"
                              : "bg-emerald-100 text-emerald-700 animate-pulse"
                        }`}
                      >
                        {activeCall.status === "Failed" ? (
                          <PhoneMissed className="w-6 h-6" />
                        ) : activeCall.status === "Completed" ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <PhoneIncoming className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            id="voice-call-status-badge"
                            className={`text-xs font-black px-3 py-1 rounded-full border ${getStatusBadgeStyle(
                              activeCall.status
                            )}`}
                          >
                            {activeCall.status}
                          </span>
                          <span className="text-xs font-bold text-[#6E8070] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDuration(
                              isCallInProgress ? elapsedSeconds : activeCall.durationSeconds
                            )}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#1B3F23] mt-1.5">
                          {activeCall.farmerName} • {activeCall.phoneMasked}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E8070] block">
                        Session ID
                      </span>
                      <code className="text-[11px] font-bold text-[#1B3F23]">
                        {activeCall.callId.slice(0, 18)}
                      </code>
                    </div>
                  </div>

                  {/* Visual Lifecycle Stepper */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {STATUS_STEPS.map((step, idx) => {
                      const activeIndex =
                        activeCall.status === "Failed"
                          ? -1
                          : STATUS_STEPS.indexOf(activeCall.status);
                      const isDoneOrCurrent = activeIndex >= idx;
                      return (
                        <div key={step} className="space-y-1 text-center">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              activeCall.status === "Failed"
                                ? idx === 0
                                  ? "bg-rose-400"
                                  : "bg-[#EAE5DC]"
                                : isDoneOrCurrent
                                  ? "bg-[#256030]"
                                  : "bg-[#EAE5DC]"
                            }`}
                          />
                          <span
                            className={`block text-[10px] font-bold leading-tight ${
                              isDoneOrCurrent ? "text-[#1B3F23]" : "text-[#8A9A8B]"
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mid-Call Language Switcher */}
                  <div className="bg-[#FAF8F5] rounded-2xl border border-[#EAE5DC] p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#1B3F23] flex items-center gap-1.5">
                        <Languages className="w-4 h-4 text-[#256030]" />
                        Active Call Language (Switch Anytime)
                      </span>
                      {isSwitchingLang && (
                        <span className="text-[11px] font-bold text-[#256030]">Updating...</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {(config?.languages || []).map((lang) => {
                        const isSelected = activeCall.selectedLanguage === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            disabled={!isCallInProgress || isSwitchingLang}
                            onClick={() => handleSwitchLanguage(lang.code)}
                            className={`px-2.5 py-2 rounded-xl text-left border text-xs transition cursor-pointer disabled:cursor-default ${
                              isSelected
                                ? "bg-[#256030] text-white border-[#256030] shadow-xs"
                                : "bg-white text-[#1B3F23] border-[#E0D9CE] hover:border-[#256030]"
                            }`}
                          >
                            <div className="font-black leading-tight">{lang.nativeName}</div>
                            <div
                              className={`text-[10px] font-semibold ${
                                isSelected ? "text-emerald-100" : "text-[#6E8070]"
                              }`}
                            >
                              {lang.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Post-call Summary or Live Notes */}
                  {(activeCall.summary || activeCall.failureReason) && (
                    <div
                      className={`rounded-2xl p-4 border space-y-1.5 ${
                        activeCall.status === "Failed"
                          ? "bg-rose-50 border-rose-200"
                          : "bg-[#F1F8E9] border-[#C5E1A5]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#1B3F23]">
                        <FileText className="w-4 h-4 text-[#256030]" />
                        <span>
                          {activeCall.status === "Failed" ? "Call Issue" : "Consultation Summary"}
                        </span>
                      </div>
                      <p className="text-xs text-[#2B3D2D] font-medium leading-relaxed">
                        {activeCall.failureReason || activeCall.summary}
                      </p>
                    </div>
                  )}

                  {/* Consented Live / Completed Transcript */}
                  {activeCall.transcriptConsent &&
                    activeCall.transcript &&
                    activeCall.transcript.length > 0 && (
                      <div className="bg-[#FAF8F5] rounded-2xl border border-[#EAE5DC] p-4 space-y-2">
                        <h4 className="text-xs font-black text-[#1B3F23]">
                          Conversation Transcript (Consented)
                        </h4>
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                          {activeCall.transcript.map((turn, i) => (
                            <div key={i} className="bg-white rounded-xl p-2.5 border border-[#EAE5DC] text-xs">
                              <span className="font-black text-[#256030]">
                                {turn.role === "farmer" ? "Farmer: " : "KrishiAI: "}
                              </span>
                              <span className="text-[#1A2E1A]">{turn.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Call Controls */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    {isCallInProgress ? (
                      <button
                        type="button"
                        id="voice-end-call-btn"
                        disabled={isEnding}
                        onClick={handleEndCall}
                        className="flex-1 py-4 px-5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-base shadow-md flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-60"
                      >
                        {isEnding ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <PhoneOff className="w-5 h-5" />
                        )}
                        <span>{isEnding ? "Ending Call..." : "End Call"}</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          id="voice-retry-call-btn"
                          onClick={() => handleStartCall()}
                          disabled={isCalling}
                          className="flex-1 py-4 px-5 rounded-2xl bg-[#256030] hover:bg-[#1B3F23] text-white font-black text-base shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
                        >
                          <RefreshCw className="w-5 h-5" />
                          <span>Retry Call</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleResetCall}
                          className="py-4 px-5 rounded-2xl bg-white hover:bg-[#F2ECE1] text-[#1B3F23] border border-[#D8D2C8] font-bold text-sm transition cursor-pointer"
                        >
                          Change Number
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* View 2: Setup Form (Enter Mobile + Language + Consent + Call Me) */
                <form onSubmit={handleStartCall} className="space-y-5">
                  {/* Registered Mobile Number Input */}
                  <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 sm:p-5 space-y-3 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        htmlFor="voice-mobile-input"
                        className="text-sm font-black text-[#1B3F23]"
                      >
                        1. Enter Your Registered Mobile Number
                      </label>
                      {!isAuthenticated && (
                        <button
                          type="button"
                          onClick={() => setMobileNumber("+91 98480 12345")}
                          className="text-[11px] font-bold text-[#256030] bg-[#EBF3EA] hover:bg-[#DCEBD9] px-2.5 py-1 rounded-full transition cursor-pointer"
                        >
                          Use Demo Farmer (+91 98480 12345)
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <PhoneCall className="w-5 h-5 text-[#256030] absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        id="voice-mobile-input"
                        type="tel"
                        required
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="+91 98480 12345"
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#FAF8F5] border-2 border-[#E0D9CE] focus:border-[#256030] focus:bg-white text-base font-bold text-[#1A2E1A] outline-none transition"
                      />
                    </div>
                    <p className="text-xs text-[#6E8070] font-medium">
                      We match this number to your KrishiAI farmer account so our AI knows your crop, district, and soil profile.
                    </p>
                  </div>

                  {/* Preferred Language Grid (12 Languages) */}
                  <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 sm:p-5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-black text-[#1B3F23] flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-[#256030]" />
                        2. Choose Your Spoken Language
                      </label>
                      <span className="text-[11px] font-bold text-[#256030]">
                        12 Languages Supported
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {(config?.languages || []).map((lang) => {
                        const selected = selectedLanguage === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            id={`voice-lang-${lang.code}`}
                            onClick={() => setSelectedLanguage(lang.code)}
                            className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer ${
                              selected
                                ? "bg-[#256030] text-white border-[#256030] shadow-sm"
                                : "bg-[#FAF8F5] text-[#1B3F23] border-[#E5E0D8] hover:border-[#256030]"
                            }`}
                          >
                            <div className="text-sm font-black leading-snug">
                              {lang.nativeName}
                            </div>
                            <div
                              className={`text-[11px] font-semibold ${
                                selected ? "text-emerald-100" : "text-[#6E8070]"
                              }`}
                            >
                              {lang.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {selectedLanguage === "as-IN" && (
                      <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                        Note: Saaras AI understands spoken Assamese natively; spoken voice replies fall back clearly to Bengali/English audio when Assamese TTS is unavailable.
                      </p>
                    )}
                  </div>

                  {/* Consent Message & Checkboxes */}
                  <div className="bg-[#EBF3EA] rounded-2xl border border-[#C5E1A5] p-4 sm:p-5 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-[#256030] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-[#1B3F23]">
                          3. Farmer Call & Privacy Consent
                        </h4>
                        <p className="text-xs text-[#2B432E] font-medium leading-relaxed">
                          When you tap <strong>Call Me</strong>, KrishiAI will place an automated AI voice call to your registered mobile number. You can speak naturally, interrupt at any time, switch languages, or end the call whenever you want.
                        </p>
                      </div>
                    </div>

                    <label className="flex items-start gap-3 bg-white/90 rounded-xl p-3 border border-[#D5E5D3] cursor-pointer">
                      <input
                        id="voice-consent-checkbox"
                        type="checkbox"
                        checked={callConsent}
                        onChange={(e) => setCallConsent(e.target.checked)}
                        className="mt-0.5 w-5 h-5 accent-[#256030] rounded shrink-0 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-[#1B3F23] leading-snug">
                        Yes, I give consent for KrishiAI to call my mobile number with AI agricultural assistance. (Required)
                      </span>
                    </label>

                    <label className="flex items-start gap-3 bg-white/75 rounded-xl p-3 border border-[#D5E5D3] cursor-pointer">
                      <input
                        id="voice-transcript-consent-checkbox"
                        type="checkbox"
                        checked={transcriptConsent}
                        onChange={(e) => setTranscriptConsent(e.target.checked)}
                        className="mt-0.5 w-5 h-5 accent-[#256030] rounded shrink-0 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-[#2B432E] leading-snug">
                        Save call transcript & advisory summary in my private KrishiAI account for future reference. (Optional)
                      </span>
                    </label>
                  </div>

                  {/* Large Call Me Action Button */}
                  <motion.button
                    type="submit"
                    id="voice-call-me-btn"
                    disabled={isCalling}
                    whileHover={!isCalling ? { scale: 1.01 } : {}}
                    whileTap={!isCalling ? { scale: 0.99 } : {}}
                    className="w-full py-4 px-6 rounded-2xl bg-[#256030] hover:bg-[#1B3F23] text-white font-black text-base sm:text-lg shadow-lg flex items-center justify-center gap-3 transition cursor-pointer disabled:opacity-60"
                  >
                    {isCalling ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-[#FFD700]" />
                        <span>Connecting AI Voice Call...</span>
                      </>
                    ) : (
                      <>
                        <PhoneCall className="w-5 h-5 text-[#FFD700]" />
                        <span>Call Me</span>
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

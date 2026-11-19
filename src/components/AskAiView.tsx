import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Search, 
  Mic, 
  MicOff, 
  Send, 
  Image as ImageIcon, 
  Sprout, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Volume2,
  Share2,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext.js";
import { useLanguage } from "../context/LanguageContext.js";
import { api } from "../services/api.js";
import { firebaseAuth } from "../firebase.js";
import {
  loadQueriesFromFirestore,
  saveQueryFeedbackToFirestore,
  saveQueryToFirestore,
} from "../services/firestoreService.js";
import { QueryRecord } from "../types/index.js";
import { AdvisoryCard } from "./AdvisoryCard.js";
import { QueryPipelineVisualizer } from "./QueryPipelineVisualizer.js";

const VOICE_LOCALES = [
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "हिन्दी (भारत)" },
  { code: "te-IN", label: "తెలుగు (భారతదేశం)" },
] as const;

type VoiceLocaleCode = (typeof VOICE_LOCALES)[number]["code"];

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

function getSpeechRecognitionConstructor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

function mapLanguageToVoiceLocale(lang: string): VoiceLocaleCode {
  if (lang === "hi") return "hi-IN";
  if (lang === "te") return "te-IN";
  return "en-IN";
}

const CROPS = [
  "All",
  "Cotton",
  "Tomato",
  "Paddy",
  "Chilli",
  "Maize",
  "Groundnut",
  "Soybean",
  "Banana",
  "Mango",
  "General"
];

const EASY_SAMPLE_QUESTIONS: Record<string, Array<{ icon: string; title: string; query: string }>> = {
  "Cotton": [
    { icon: "🐛", title: "Pink Bollworm Entry", query: "Cotton flowers are closed like small roses and green bolls have worm entry holes." },
    { icon: "🍂", title: "Leaves Turning Red", query: "Cotton leaves are turning dark red between veins during boll formation stage." },
    { icon: "🪰", title: "Sticky Whiteflies", query: "Tiny white flies are flying when shaking plants, and leaves are sticky and curling down." }
  ],
  "Tomato": [
    { icon: "🍅", title: "Target Leaf Spots", query: "Dark brown target-like circular rings appearing on bottom tomato leaves." },
    { icon: "🟤", title: "Blossom End Rot", query: "The bottom tip of green tomato fruits is turning black, flat and leathery." },
    { icon: "🌿", title: "Neem Spray Dosage", query: "What is the recommended neem oil ratio per 15L spray knapsack tank for tomatoes?" }
  ],
  "Paddy": [
    { icon: "🌾", title: "Yellow Leaves & Blast", query: "My paddy leaves are turning yellow with brown boat-shaped spots and drying at tips." },
    { icon: "🦗", title: "Brown Planthopper", query: "Round dried patches looking like burnt spots are appearing in the center of my paddy field." }
  ],
  "All": [
    { icon: "💧", title: "Irrigation Scheduling", query: "How do I check if my soil has enough moisture for the next 3 days?" },
    { icon: "🛡️", title: "Pest Prevention", query: "What preventive organic spray should I use for early sucking pests?" }
  ]
};

interface AskAiViewProps {
  initialQuery?: string;
  initialCrop?: string;
}

export const AskAiView: React.FC<AskAiViewProps> = ({
  initialQuery = "",
  initialCrop = "Cotton"
}) => {
  const { farm, user, isFirebaseAuth } = useAuth();
  const { language, t } = useLanguage();

  const [selectedCrop, setSelectedCrop] = useState<string>(initialCrop || farm?.crop || "Cotton");
  const [question, setQuestion] = useState<string>(initialQuery);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentQueryRecord, setCurrentQueryRecord] = useState<QueryRecord | null>(null);
  const [pipelineExecution, setPipelineExecution] = useState<any | null>(null);
  const [recentQueries, setRecentQueries] = useState<QueryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceLocale, setVoiceLocale] = useState<VoiceLocaleCode>(() =>
    mapLanguageToVoiceLocale(language)
  );
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const baseQuestionRef = useRef<string>("");
  const manualStopRef = useRef<boolean>(false);
  const isSpeechSupported = Boolean(getSpeechRecognitionConstructor());

  // Sync default speech recognition locale when app language changes
  useEffect(() => {
    setVoiceLocale(mapLanguageToVoiceLocale(language));
  }, [language]);

  // Clean up active SpeechRecognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        manualStopRef.current = true;
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore cleanup errors
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  // Load recent queries
  useEffect(() => {
    async function loadHistory() {
      try {
        if (isFirebaseAuth && firebaseAuth.currentUser) {
          const fsQueries = await loadQueriesFromFirestore(firebaseAuth.currentUser.uid);
          setRecentQueries(fsQueries.slice(0, 5));
          return;
        }
        const queries = await api.getQueries();
        setRecentQueries(queries.slice(0, 5));
      } catch (e) {
        console.warn("Could not load query history:", e);
      }
    }
    loadHistory();
  }, [isFirebaseAuth, user?.id]);

  // If initialQuery is passed and not empty, auto submit
  useEffect(() => {
    if (initialQuery && initialQuery.trim().length > 0) {
      setQuestion(initialQuery);
      if (initialCrop) setSelectedCrop(initialCrop);
      handleProcessQuery(initialQuery, initialCrop);
    }
  }, [initialQuery, initialCrop]);

  const stopListening = () => {
    if (recognitionRef.current) {
      manualStopRef.current = true;
      try {
        recognitionRef.current.stop();
      } catch {
        // Fallback if already stopped
      }
    }
    setIsListening(false);
    setInterimTranscript("");
  };

  const toggleListening = () => {
    setVoiceError(null);

    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) {
      setVoiceError(t("voiceUnsupported"));
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = voiceLocale;

      baseQuestionRef.current = question.trim();
      manualStopRef.current = false;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript("");
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let finalTranscript = "";
        let interim = "";

        for (let i = 0; i < event.results.length; i += 1) {
          const result = event.results[i];
          const text = result?.[0]?.transcript || "";
          if (result.isFinal) {
            finalTranscript += `${text} `;
          } else {
            interim += text;
          }
        }

        const combined = [
          baseQuestionRef.current,
          finalTranscript.trim(),
          interim.trim(),
        ]
          .filter(Boolean)
          .join(" ");

        setInterimTranscript(interim.trim());
        setQuestion(combined);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        const code = event?.error || "";
        if (code === "aborted" && manualStopRef.current) {
          setIsListening(false);
          setInterimTranscript("");
          return;
        }

        if (code === "not-allowed" || code === "service-not-allowed") {
          setVoiceError(t("voicePermissionDenied"));
        } else if (code === "no-speech") {
          setVoiceError(t("voiceNoSpeech"));
        } else if (code === "audio-capture") {
          setVoiceError(t("voiceAudioCapture"));
        } else if (code === "network") {
          setVoiceError(t("voiceNetworkError"));
        } else {
          setVoiceError(t("voiceGenericError"));
        }

        setIsListening(false);
        setInterimTranscript("");
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        setIsListening(false);
        setInterimTranscript("");
      };

      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setInterimTranscript("");
      setVoiceError(t("voiceGenericError"));
    }
  };

  const handleProcessQuery = async (queryText: string, cropName?: string) => {
    if (!queryText.trim()) return;
    if (isListening) {
      stopListening();
    }
    setIsProcessing(true);
    setError(null);

    try {
      const result = await api.askQuery(
        queryText.trim(),
        cropName || selectedCrop,
        language
      );
      setCurrentQueryRecord(result.data);
      setPipelineExecution(result.pipelineExecution);

      if (isFirebaseAuth && firebaseAuth.currentUser) {
        await saveQueryToFirestore(firebaseAuth.currentUser.uid, result.data).catch((fsErr) =>
          console.warn("Firestore query persistence skipped:", fsErr)
        );
      }

      // Prepend to recent
      setRecentQueries(prev => [result.data, ...prev.filter(q => q.id !== result.data.id)].slice(0, 5));
    } catch (err: any) {
      setError(err.message || "Failed to process question. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessQuery(question, selectedCrop);
  };

  return (
    <div id="ask-ai-view" className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#EAE5DC] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <h2 className="text-2xl font-black text-[#193B20] tracking-tight">
                {t('krishiAiAgronomist')}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#6E8070] font-medium">
              {t('agronomistSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#6E8070]">{t('cropContextLabel')}</span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-[#F5F2EB] border border-[#EAE5DC] text-[#193B20] font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#256030]"
            >
              {CROPS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Big Interactive Query Box */}
        <form onSubmit={handleSubmit} className="mt-6">
          <div
            className={`bg-[#FAF8F5] border rounded-2xl p-3 sm:p-4 shadow-inner space-y-3 transition-all ${
              isListening
                ? "border-[#D9534F] ring-2 ring-[#D9534F]/20"
                : "border-[#EAE5DC] focus-within:border-[#256030] focus-within:ring-2 focus-within:ring-[#256030]/20"
            }`}
          >
            <textarea
              id="ai-question-textarea"
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('askAiPlaceholder')}
              className="w-full bg-transparent text-sm sm:text-base font-semibold text-[#193B20] placeholder-[#8A9C8D] focus:outline-none resize-none"
            />

            {/* Live Voice Listening Status Bar */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#FDEDEC] border border-[#F5C6CB] text-[#9E2A2B] text-xs font-semibold"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D9534F] animate-ping shrink-0" />
                    <span className="truncate">
                      {interimTranscript || t("voiceSpeakNow")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={stopListening}
                    className="shrink-0 text-[11px] font-extrabold underline cursor-pointer"
                  >
                    {t("voiceStopBtn")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voice Error / Browser Support Notice */}
            {voiceError && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#FFF8E1] border border-[#FFE082] text-[#7A4F01] text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{voiceError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVoiceError(null)}
                  aria-label="Dismiss voice notice"
                  className="p-0.5 hover:opacity-75 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EAE5DC]">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="voice-input-toggle-btn"
                  onClick={toggleListening}
                  aria-pressed={isListening}
                  aria-label={isListening ? t("voiceStopBtn") : t("voiceInputBtn")}
                  title={!isSpeechSupported ? t("voiceUnsupported") : undefined}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    isListening
                      ? "bg-[#D9534F] text-white animate-pulse"
                      : "bg-[#EBF3EA] text-[#256030] hover:bg-[#D5E5D3]"
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isListening ? t('voiceStopBtn') : t('voiceInputBtn')}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#6E8070] hidden sm:inline">
                    {t("voiceLanguageLabel")}
                  </span>
                  <select
                    aria-label="Voice input language"
                    value={voiceLocale}
                    disabled={isListening}
                    onChange={(e) => setVoiceLocale(e.target.value as VoiceLocaleCode)}
                    className="bg-[#F5F2EB] border border-[#EAE5DC] text-[#193B20] font-bold text-[11px] rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#256030] disabled:opacity-60"
                  >
                    {VOICE_LOCALES.map((loc) => (
                      <option key={loc.code} value={loc.code}>
                        {loc.label}
                      </option>
                    ))}
                  </select>
                </div>

                {question.trim().length > 0 && !isProcessing && (
                  <button
                    type="button"
                    onClick={() => {
                      baseQuestionRef.current = "";
                      if (recognitionRef.current) {
                        manualStopRef.current = true;
                        try {
                          recognitionRef.current.abort();
                        } catch {
                          // Ignore abort errors
                        }
                        recognitionRef.current = null;
                      }
                      setIsListening(false);
                      setInterimTranscript("");
                      setQuestion("");
                      setVoiceError(null);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-[#6E8070] hover:text-[#193B20] hover:bg-[#EAE5DC]/60 transition cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isProcessing || !question.trim()}
                id="submit-ai-query-btn"
                className="bg-[#256030] hover:bg-[#1B4B24] disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('analyzingRag')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#FFD700]" />
                    <span>{t('getAiAdvisoryBtn')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Quick Sample Questions */}
        <div className="mt-4 space-y-2">
          <span className="text-xs font-bold text-[#6E8070] flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-[#256030]" />
            <span>{t('commonCropQuestions')} {selectedCrop}</span>
          </span>
          
          <div className="flex flex-wrap gap-2">
            {(EASY_SAMPLE_QUESTIONS[selectedCrop] || EASY_SAMPLE_QUESTIONS["All"]).map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(sample.query);
                  handleProcessQuery(sample.query, selectedCrop);
                }}
                className="text-xs bg-[#F5F2EB] hover:bg-[#EBF3EA] hover:text-[#1E4D2B] text-[#4A5D4D] font-bold px-3.5 py-1.5 rounded-xl transition border border-[#E5E0D8] flex items-center gap-1.5 cursor-pointer"
              >
                <span>{sample.icon}</span>
                <span>{sample.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-[#FDEDEC] border border-[#F5C6CB] text-[#C62828] rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active AI Response & Advisory Output */}
      {currentQueryRecord && (
        <div className="space-y-6">
          <AdvisoryCard
            queryId={currentQueryRecord.id}
            question={currentQueryRecord.question}
            advisory={currentQueryRecord.advisory}
            retrievedChunks={currentQueryRecord.retrievedChunks}
            queryRecord={currentQueryRecord}
            onAskFollowUp={(fq) => {
              setQuestion(fq);
              handleProcessQuery(fq, selectedCrop);
            }}
            onFeedbackSubmitted={(isUseful, comment) => {
              if (isFirebaseAuth && firebaseAuth.currentUser) {
                saveQueryFeedbackToFirestore(
                  firebaseAuth.currentUser.uid,
                  currentQueryRecord.id,
                  isUseful,
                  comment
                ).catch((fsErr) => console.warn("Firestore feedback sync skipped:", fsErr));
              }
            }}
          />

          {pipelineExecution && (
            <QueryPipelineVisualizer pipelineExecution={pipelineExecution} />
          )}
        </div>
      )}

      {/* Recent Queries History */}
      {recentQueries.length > 0 && !currentQueryRecord && (
        <div className="bg-white rounded-[28px] p-6 border border-[#EAE5DC] shadow-xs space-y-4">
          <h3 className="text-base font-black text-[#193B20] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#256030]" />
            <span>{t('recentFarmQueries')}</span>
          </h3>

          <div className="space-y-2">
            {recentQueries.map((q) => (
              <div
                key={q.id}
                onClick={() => setCurrentQueryRecord(q)}
                className="p-3.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#EBF3EA] border border-[#EAE5DC] transition cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#193B20] group-hover:text-[#1E4D2B]">
                    {q.question}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-[#6E8070]">
                    <span className="font-bold text-[#256030]">
                      {q.detectedCrop || q.selectedCrop || "General"}
                    </span>
                    <span>•</span>
                    <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-[#8A9C8D] group-hover:text-[#1E4D2B] group-hover:translate-x-1 transition-transform" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

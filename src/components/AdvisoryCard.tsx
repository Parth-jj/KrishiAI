import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  HelpCircle, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  ThumbsUp, 
  ThumbsDown, 
  Sparkles, 
  FlaskConical, 
  Leaf, 
  Wrench, 
  ShieldCheck, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MessageSquareQuote,
  Clock,
  Layers,
  Languages,
  Loader2,
  AlertCircle,
  X
} from "lucide-react";
import { StructuredAdvisory, KnowledgeChunk, QueryRecord } from "../types/index.js";
import { api } from "../services/api.js";
import { useLanguage, LanguageCode } from "../context/LanguageContext.js";

interface AdvisoryCardProps {
  queryId?: string;
  question?: string;
  advisory?: StructuredAdvisory;
  retrievedChunks?: Array<{ chunk: KnowledgeChunk; similarityScore: number; rank: number }>;
  onAskFollowUp?: (followUpQuestion: string) => void;
  queryRecord?: QueryRecord;
  onFeedbackSubmitted?: (isUseful: boolean, comment?: string) => void;
}

export const AdvisoryCard: React.FC<AdvisoryCardProps> = ({
  queryId,
  question,
  advisory,
  retrievedChunks,
  onAskFollowUp,
  queryRecord,
  onFeedbackSubmitted
}) => {
  const { t, language, setLanguage } = useLanguage();
  const [selectedSourceChunk, setSelectedSourceChunk] = useState<KnowledgeChunk | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [feedbackUseful, setFeedbackUseful] = useState<boolean | null>(null);
  const [feedbackComment, setFeedbackComment] = useState<string>("");
  const [showSources, setShowSources] = useState<boolean>(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);

  // Safe extraction of parameters
  const effectiveId = queryId || queryRecord?.id;
  const effectiveQuestion = question || queryRecord?.question || "";
  const effectiveAdvisory: StructuredAdvisory = advisory || queryRecord?.advisory || {
    crop: queryRecord?.crop || "Crop",
    problem: effectiveQuestion || "Crop Advisory",
    confidence: (queryRecord?.confidence as any) || "medium",
    confidence_reasoning: queryRecord?.reasoning || "",
    recommendations: queryRecord?.answer ? [
      {
        title: "Recommended Action",
        type: "cultural",
        description: queryRecord.answer
      }
    ] : [],
    precautions: ["Always follow recommended dosage guidelines.", "Consult local KVK agricultural extension officer."],
    urgency: "medium",
    summary_in_preferred_language: queryRecord?.answer || ""
  };
  const effectiveChunks = retrievedChunks || queryRecord?.retrievedChunks || [];

  // Translation state
  const [currentAdvisory, setCurrentAdvisory] = useState<StructuredAdvisory>(effectiveAdvisory);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const translationsCacheRef = useRef<Record<string, StructuredAdvisory>>({});

  // Detect script helper
  const hasTelugu = (text: string) => /[\u0C00-\u0C7F]/.test(text || "");
  const hasHindi = (text: string) => /[\u0900-\u097F]/.test(text || "");

  // Update or translate advisory when language or base advisory changes
  useEffect(() => {
    let isCancelled = false;

    async function ensureAdvisoryLanguage() {
      // If we already cached translation for this target language
      if (translationsCacheRef.current[language]) {
        setCurrentAdvisory(translationsCacheRef.current[language]);
        return;
      }

      // Check if current effectiveAdvisory is already in target language
      const isAlreadyInLang = 
        (language === 'te' && (hasTelugu(effectiveAdvisory.problem || "") || (effectiveAdvisory.recommendations && effectiveAdvisory.recommendations.some(r => hasTelugu(r.description))))) ||
        (language === 'hi' && (hasHindi(effectiveAdvisory.problem || "") || (effectiveAdvisory.recommendations && effectiveAdvisory.recommendations.some(r => hasHindi(r.description))))) ||
        (language === 'en' && !hasTelugu(effectiveAdvisory.problem || "") && !hasHindi(effectiveAdvisory.problem || ""));

      if (isAlreadyInLang) {
        translationsCacheRef.current[language] = effectiveAdvisory;
        setCurrentAdvisory(effectiveAdvisory);
        return;
      }

      // Needs translation into target language
      try {
        setIsTranslating(true);
        const translated = await api.translateAdvisory(effectiveAdvisory, language);
        if (!isCancelled && translated) {
          translationsCacheRef.current[language] = translated;
          setCurrentAdvisory(translated);
        }
      } catch (err) {
        console.warn("Real-time advisory translation error:", err);
        // Fallback to original
        if (!isCancelled) {
          setCurrentAdvisory(effectiveAdvisory);
        }
      } finally {
        if (!isCancelled) {
          setIsTranslating(false);
        }
      }
    }

    ensureAdvisoryLanguage();

    return () => {
      isCancelled = true;
    };
  }, [language, effectiveAdvisory]);

  // Confidence color styling
  const confidenceConfig = {
    high: {
      badge: "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]",
      text: t("confidenceHigh"),
      icon: CheckCircle2
    },
    medium: {
      badge: "bg-[#FFF9C4] text-[#F57F17] border-[#FFE082]",
      text: t("confidenceMed"),
      icon: AlertTriangle
    },
    low: {
      badge: "bg-rose-100 text-rose-800 border-rose-300",
      text: t("confidenceLow"),
      icon: ShieldAlert
    }
  };

  const confKey = (currentAdvisory?.confidence || "medium").toLowerCase() as "high" | "medium" | "low";
  const currentConfidence = confidenceConfig[confKey] || confidenceConfig.medium;
  const ConfidenceIcon = currentConfidence.icon;

  // Text-To-Speech handler
  const toggleSpeech = () => {
    setSpeechNotice(null);
    if (!('speechSynthesis' in window)) {
      setSpeechNotice("Text-to-speech is not supported by your browser.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const textToSpeak = currentAdvisory.summary_in_preferred_language && (language === 'te' || language === 'hi')
      ? currentAdvisory.summary_in_preferred_language
      : `${currentAdvisory.crop || "Crop"} advisory. Problem: ${currentAdvisory.problem || ""}. Recommended actions: ${(currentAdvisory.recommendations || []).map(r => `${r.title}. ${r.description}`).join(". ")}. Precautions: ${(currentAdvisory.precautions || []).join(". ")}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    if (language === 'te') {
      utterance.lang = 'te-IN';
    } else if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  // Submit Feedback
  const handleFeedback = async (isUseful: boolean) => {
    if (!effectiveId) return;
    try {
      await api.submitFeedback(effectiveId, isUseful, feedbackComment);
      setFeedbackUseful(isUseful);
      setFeedbackSubmitted(true);
      if (onFeedbackSubmitted) onFeedbackSubmitted(isUseful, feedbackComment);
    } catch (err) {
      console.warn("Feedback submission error:", err);
      setFeedbackUseful(isUseful);
      setFeedbackSubmitted(true);
      if (onFeedbackSubmitted) onFeedbackSubmitted(isUseful, feedbackComment);
    }
  };

  const getRecommendationBadge = (type: string) => {
    switch (type) {
      case 'chemical':
        return { label: t('chemicalTreatment'), bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: FlaskConical };
      case 'biological':
        return { label: t('organicControl'), bg: 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]', icon: Leaf };
      case 'agronomic':
        return { label: t('agronomicPractice'), bg: 'bg-[#E1F5FE] text-[#0288D1] border-[#B3E5FC]', icon: Wrench };
      default:
        return { label: t('preventionMeasure'), bg: 'bg-[#FFF9C4] text-[#F57F17] border-[#FFE082]', icon: ShieldCheck };
    }
  };

  return (
    <div id="advisory-card" className="bg-white rounded-[28px] border-2 border-[#E0E7D9] shadow-md overflow-hidden mb-8">
      
      {/* Header Banner */}
      <div className="bg-[#2D5A27] text-white p-5 sm:p-6 border-b border-[#1E3D1A]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-[#FFD700] text-[#2D5A27] shadow-2xs">
                {currentAdvisory.crop || "Crop"}
              </span>
              <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border ${currentConfidence.badge}`}>
                <ConfidenceIcon className="w-3.5 h-3.5" />
                <span>{currentConfidence.text}</span>
              </div>
              {currentAdvisory.engineUsed && (
                <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#1E3D1A] text-[#C5E1A5] border border-[#3E7A37]">
                  {currentAdvisory.engineUsed}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {currentAdvisory.problem}
            </h2>
            {effectiveQuestion && (
              <p className="text-xs text-[#E0E7D9] mt-1 italic font-medium">
                {t("originalQuery")} "{effectiveQuestion}"
              </p>
            )}
          </div>

          {/* Action controls & In-Card Language Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Language Switcher Pill Selector right in Advisory */}
            <div className="flex items-center bg-[#1E3D1A] rounded-full p-0.5 border border-[#3E7A37] shadow-2xs">
              {(["en", "hi", "te"] as LanguageCode[]).map((langCode) => {
                const isActive = language === langCode;
                const labels: Record<LanguageCode, string> = {
                  en: "EN English",
                  hi: "HI हिन्दी",
                  te: "TE తెలుగు"
                };
                return (
                  <button
                    key={langCode}
                    onClick={() => setLanguage(langCode)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-black transition cursor-pointer ${
                      isActive 
                        ? "bg-[#FFD700] text-[#1E3D1A] shadow-xs" 
                        : "text-[#D0DBC7] hover:text-white"
                    }`}
                  >
                    {labels[langCode]}
                  </button>
                );
              })}
            </div>

            {/* TTS read aloud button */}
            <motion.button
              id="tts-read-aloud-btn"
              onClick={toggleSpeech}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                isPlayingAudio
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-[#1E3D1A] hover:bg-[#152B13] text-[#FFD700] border border-[#3E7A37]"
              }`}
              title="Listen to advisory audio"
            >
              {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isPlayingAudio ? t("stopAudio") : t("listenAudio")}</span>
            </motion.button>
          </div>
        </div>

        {/* Translation Loading Bar */}
        {isTranslating && (
          <motion.div 
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2.5 bg-[#FFD700]/20 border border-[#FFD700]/40 rounded-xl flex items-center gap-2 text-xs text-[#FFD700] font-bold"
          >
            <Loader2 className="w-4 h-4 animate-spin text-[#FFD700]" />
            <span>{t("translatingAdvisory")}</span>
          </motion.div>
        )}

        {/* Speech Notice Banner */}
        {speechNotice && (
          <div className="mt-3 px-3 py-2 bg-[#FFF8E1] border border-[#FFE082] rounded-xl flex items-center justify-between gap-2 text-xs text-[#7A4F01] font-semibold">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{speechNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSpeechNotice(null)}
              aria-label="Dismiss audio notice"
              className="p-0.5 hover:opacity-75 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Localized summary if in Telugu / Hindi */}
        {currentAdvisory.summary_in_preferred_language && (language === 'te' || language === 'hi') && (
          <div className="mt-4 p-3.5 bg-[#1E3D1A] border border-[#3E7A37] rounded-2xl text-xs text-[#E0E7D9] leading-relaxed font-medium">
            <div className="text-[11px] text-[#FFD700] font-bold uppercase mb-1">
              {language === 'te' ? 'తెలుగు సంక్షిప్త సలహా' : 'हिंदी सारांश'}
            </div>
            {currentAdvisory.summary_in_preferred_language}
          </div>
        )}
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        
        {/* Section 1: Likely Causes */}
        {currentAdvisory.likely_causes && currentAdvisory.likely_causes.length > 0 && (
          <div id="likely-causes-section">
            <h3 className="text-xs font-extrabold text-[#2D5A27] uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F2994A]" />
              {t("causesTitle")}
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {currentAdvisory.likely_causes.map((cause, idx) => (
                <li key={idx} className="bg-[#FFF9C4]/30 border border-[#FFE082]/80 rounded-2xl p-3.5 text-xs text-[#1A2E1A] flex items-start gap-2.5 shadow-2xs">
                  <span className="w-5 h-5 rounded-full bg-[#FFD700] text-[#2D5A27] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed font-semibold">{cause}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 2: Step-by-Step Recommendations */}
        <div id="recommendations-section">
          <h3 className="text-xs font-extrabold text-[#2D5A27] uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#8BC34A]" />
            {t("recommendationsTitle")}
          </h3>

          <div className="space-y-3">
            {(currentAdvisory.recommendations || []).map((rec, idx) => {
              const badge = getRecommendationBadge(rec.type);
              const BadgeIcon = badge.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-[#FBFEFA] hover:bg-[#F1F8E9]/60 border-2 border-[#E0E7D9] rounded-2xl p-4 sm:p-5 transition-all shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-[#2D5A27] text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-[#1A2E1A]">{rec.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {rec.dosage && (
                        <span className="px-2.5 py-1 rounded-full bg-[#F0F4ED] text-[#2D5A27] border border-[#D0DBC7] text-[11px] font-bold">
                          {t("dosage")} {rec.dosage}
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badge.bg}`}>
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#1A2E1A]/90 leading-relaxed pl-9 font-medium">
                    {rec.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Safety & Application Precautions */}
        {currentAdvisory.precautions && currentAdvisory.precautions.length > 0 && (
          <div id="precautions-section" className="bg-[#FFF3E0] border border-[#FFE0B2] rounded-2xl p-4 sm:p-5">
            <h3 className="text-xs font-black text-[#E65100] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#E65100]" />
              {t("precautionsTitle")}
            </h3>
            <ul className="space-y-1.5 text-xs text-[#1A2E1A] pl-5 list-disc font-medium">
              {currentAdvisory.precautions.map((p, idx) => (
                <li key={idx} className="leading-relaxed">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 4: Follow-up Questions */}
        {currentAdvisory.follow_up_questions && currentAdvisory.follow_up_questions.length > 0 && onAskFollowUp && (
          <div id="followup-questions-section" className="bg-[#F1F8E9] border border-[#C5E1A5] rounded-2xl p-4 sm:p-5">
            <h3 className="text-xs font-black text-[#33691E] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#558B2F]" />
              {t("followUpTitle")}
            </h3>
            <div className="space-y-2">
              {currentAdvisory.follow_up_questions.map((fq, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => onAskFollowUp(fq)}
                  whileHover={{ scale: 1.01, x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full text-left bg-white hover:bg-[#E8F5E9] border border-[#C5E1A5] rounded-xl p-3 text-xs text-[#2D5A27] font-semibold transition flex items-center justify-between group cursor-pointer shadow-2xs"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquareQuote className="w-3.5 h-3.5 text-[#558B2F] shrink-0" />
                    <span>{fq}</span>
                  </span>
                  <span className="text-[11px] text-[#2D5A27] font-bold opacity-0 group-hover:opacity-100 transition">
                    {language === 'te' ? 'AI ని అడగండి →' : language === 'hi' ? 'AI से पूछें →' : 'Ask AI →'}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Sources & Grounded Citations */}
        <div id="citations-section" className="border-t border-[#E0E7D9] pt-4">
          <div className="flex items-center justify-between mb-3">
            <motion.button
              onClick={() => setShowSources(!showSources)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-xs font-black text-[#2D5A27] uppercase tracking-wider flex items-center gap-2 hover:text-[#1E3D1A] transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#2D5A27]" />
              <span>{t("sourcesTitle")}</span>
              <span className="bg-[#E8F0E5] text-[#2D5A27] border border-[#D0DBC7] text-[10px] px-2 py-0.5 rounded-full font-bold">
                {currentAdvisory.sources?.length || 0} ICAR Documents
              </span>
              {showSources ? <ChevronUp className="w-3.5 h-3.5 text-stone-500" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-500" />}
            </motion.button>
          </div>

          {showSources && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 animate-fadeIn">
              {currentAdvisory.sources && currentAdvisory.sources.map((src, idx) => {
                const matchedChunk = effectiveChunks.find(rc => rc.chunk.title.includes(src.title) || src.title.includes(rc.chunk.title))?.chunk;
                return (
                  <div key={idx} className="bg-[#FBFEFA] border border-[#E0E7D9] rounded-2xl p-3.5 text-xs flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="font-bold text-[#1A2E1A] leading-snug mb-1">{src.title}</div>
                      <div className="text-[11px] text-stone-600 font-medium">{src.source}</div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E0E7D9]">
                      <span className="text-[10px] font-bold text-[#2E7D32] bg-[#E8F5E9] border border-[#C8E6C9] px-2 py-0.5 rounded-full">
                        {src.relevance}
                      </span>
                      {matchedChunk && (
                        <motion.button
                          onClick={() => setSelectedSourceChunk(matchedChunk)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-[11px] font-bold text-[#2D5A27] hover:text-[#1E3D1A] underline flex items-center gap-1 cursor-pointer"
                        >
                          {t("viewExcerpt")} <ExternalLink className="w-2.5 h-2.5" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 6: User Feedback Widget */}
        <div id="feedback-widget" className="bg-[#F0F4ED] rounded-2xl p-4 sm:p-5 border border-[#D0DBC7]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#1A2E1A]">
              {t("feedbackPrompt")}
            </span>

            {feedbackSubmitted ? (
              <div className="flex items-center gap-1.5 text-xs text-[#2E7D32] font-bold bg-[#E8F5E9] border border-[#C8E6C9] px-3.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t("feedbackThankYou")}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <motion.button
                  id="feedback-yes-btn"
                  onClick={() => handleFeedback(true)}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#E8F5E9] border border-[#C8E6C9] text-[#2E7D32] text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>{t("feedbackYes")}</span>
                </motion.button>
                <motion.button
                  id="feedback-no-btn"
                  onClick={() => handleFeedback(false)}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  className="px-3.5 py-1.5 rounded-full bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                  <span>{t("feedbackNo")}</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Source Excerpt Modal */}
      {selectedSourceChunk && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-xl w-full p-6 border border-[#E0E7D9] shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E0E7D9] mb-4">
              <div>
                <span className="text-[10px] uppercase text-[#2E7D32] font-bold bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-0.5 rounded-full">
                  ICAR Grounding Chunk
                </span>
                <h3 className="text-base font-bold text-[#1A2E1A] mt-1.5">{selectedSourceChunk.title}</h3>
                <p className="text-xs text-stone-500 font-medium">{selectedSourceChunk.source}</p>
              </div>
              <motion.button
                onClick={() => setSelectedSourceChunk(null)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                ✕
              </motion.button>
            </div>

            <div className="p-4 bg-[#F4F7F2] rounded-2xl border border-[#D0DBC7] text-xs text-[#1A2E1A] leading-relaxed font-mono whitespace-pre-wrap">
              {selectedSourceChunk.text}
            </div>

            <div className="mt-4 flex justify-end">
              <motion.button
                onClick={() => setSelectedSourceChunk(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2 bg-[#2D5A27] hover:bg-[#1E3D1A] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Excerpt
              </motion.button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

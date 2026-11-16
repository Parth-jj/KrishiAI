import React, { useState, useEffect } from "react";
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
  Share2
} from "lucide-react";
import { useAuth } from "../context/AuthContext.js";
import { useLanguage } from "../context/LanguageContext.js";
import { api } from "../services/api.js";
import { QueryRecord } from "../types/index.js";
import { AdvisoryCard } from "./AdvisoryCard.js";
import { QueryPipelineVisualizer } from "./QueryPipelineVisualizer.js";

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
  const { farm, user } = useAuth();
  const { language, t } = useLanguage();

  const [selectedCrop, setSelectedCrop] = useState<string>(initialCrop || farm?.crop || "Cotton");
  const [question, setQuestion] = useState<string>(initialQuery);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentQueryRecord, setCurrentQueryRecord] = useState<QueryRecord | null>(null);
  const [pipelineExecution, setPipelineExecution] = useState<any | null>(null);
  const [recentQueries, setRecentQueries] = useState<QueryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);

  // Load recent queries
  useEffect(() => {
    async function loadHistory() {
      try {
        const queries = await api.getQueries();
        setRecentQueries(queries.slice(0, 5));
      } catch (e) {
        console.warn("Could not load query history:", e);
      }
    }
    loadHistory();
  }, []);

  // If initialQuery is passed and not empty, auto submit
  useEffect(() => {
    if (initialQuery && initialQuery.trim().length > 0) {
      setQuestion(initialQuery);
      if (initialCrop) setSelectedCrop(initialCrop);
      handleProcessQuery(initialQuery, initialCrop);
    }
  }, [initialQuery, initialCrop]);

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser. Please type your question.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuestion(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleProcessQuery = async (queryText: string, cropName?: string) => {
    if (!queryText.trim()) return;
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
          <div className="bg-[#FAF8F5] border border-[#EAE5DC] focus-within:border-[#256030] focus-within:ring-2 focus-within:ring-[#256030]/20 rounded-2xl p-3 sm:p-4 shadow-inner space-y-3 transition-all">
            <textarea
              id="ai-question-textarea"
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('askAiPlaceholder')}
              className="w-full bg-transparent text-sm sm:text-base font-semibold text-[#193B20] placeholder-[#8A9C8D] focus:outline-none resize-none"
            />

            <div className="flex items-center justify-between pt-2 border-t border-[#EAE5DC]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    isListening
                      ? "bg-[#D9534F] text-white animate-pulse"
                      : "bg-[#EBF3EA] text-[#256030] hover:bg-[#D5E5D3]"
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isListening ? t('listening') : t('voiceInputBtn')}</span>
                </button>
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
            onFeedbackSubmitted={() => {}}
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
                    <span className="font-bold text-[#256030]">{q.crop || "General"}</span>
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

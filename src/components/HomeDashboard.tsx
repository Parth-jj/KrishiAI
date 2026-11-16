import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Mic, 
  MicOff, 
  Sun, 
  CloudRain, 
  Sparkles, 
  CheckCircle2, 
  CheckSquare, 
  Clock, 
  ChevronRight, 
  ArrowRight, 
  Sprout, 
  Droplets, 
  ShieldCheck, 
  Leaf, 
  Plus, 
  Trash2,
  X,
  AlertCircle
} from "lucide-react";
import { 
  FarmerHeroMascot, 
  CottonPlantArtwork, 
  TomatoPlantArtwork 
} from "./FarmIllustrations.js";
import { useAuth } from "../context/AuthContext.js";
import { useLanguage } from "../context/LanguageContext.js";
import { api } from "../services/api.js";
import { WeatherData } from "../types/index.js";

interface HomeDashboardProps {
  onAskQuestion: (query: string, crop?: string) => void;
  onNavigateTab: (tab: 'home' | 'ask-ai' | 'my-farm' | 'weather' | 'market-prices') => void;
}

interface FarmTask {
  id: string;
  title: string;
  crop: string;
  dueDate: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onAskQuestion,
  onNavigateTab
}) => {
  const { farm, user } = useAuth();
  const { language, t } = useLanguage();

  const [questionInput, setQuestionInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [tasksModalOpen, setTasksModalOpen] = useState(false);
  const [adviceModalOpen, setAdviceModalOpen] = useState(false);
  const [selectedAdviceDetail, setSelectedAdviceDetail] = useState<{
    crop: string;
    status: string;
    tips: Array<{ icon: string; text: string; detail?: string }>;
  } | null>(null);

  // Local Farm Tasks state
  const [tasks, setTasks] = useState<FarmTask[]>([
    {
      id: "task-1",
      title: "Inspect cotton leaves for sucking pests & whitefly",
      crop: "Cotton",
      dueDate: "Today",
      completed: false,
      priority: "high"
    },
    {
      id: "task-2",
      title: "Apply light furrow irrigation if upper soil layer is dry",
      crop: "Tomato",
      dueDate: "Tomorrow morning",
      completed: false,
      priority: "medium"
    },
    {
      id: "task-3",
      title: "Spray preventive Neem Oil (10,000 ppm) in evening",
      crop: "Cotton",
      dueDate: "In 2 days",
      completed: true,
      priority: "low"
    }
  ]);

  const [newTaskInput, setNewTaskInput] = useState("");
  const [newTaskCrop, setNewTaskCrop] = useState("Cotton");

  const pendingTasksCount = tasks.filter(t => !t.completed).length;

  // Fetch real weather data
  useEffect(() => {
    async function loadWeather() {
      try {
        const district = farm?.district || "Aurangabad";
        const state = farm?.state || "Maharashtra";
        const data = await api.getWeather({ district, state });
        setWeatherData(data);
      } catch (err) {
        console.warn("Weather fetch error:", err);
      }
    }
    loadWeather();
  }, [farm]);

  // Speech Recognition Handler
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
        setQuestionInput(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!questionInput.trim()) return;
    onAskQuestion(questionInput.trim(), farm?.crop || "Cotton");
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const newTask: FarmTask = {
      id: `task-${Date.now()}`,
      title: newTaskInput.trim(),
      crop: newTaskCrop,
      dueDate: "This week",
      completed: false,
      priority: "medium"
    };
    setTasks([newTask, ...tasks]);
    setNewTaskInput("");
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div id="home-dashboard-view" className="space-y-6 max-w-6xl mx-auto">
      
      {/* 1. HERO SEARCH BANNER (Matches uploaded design) */}
      <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-r from-[#21542A] via-[#2A6A35] to-[#1E4B25] p-6 sm:p-8 lg:p-10 shadow-lg border border-[#1E4A25] text-white">
        {/* Subtle background leaves pattern overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#8BC34A]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Column: Heading & Search Input */}
          <div className="w-full md:max-w-xl space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {t('askAnythingHero')}
              </h2>
            </div>

            {/* Big Search Input Pill */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <div className="w-full bg-white rounded-full p-1.5 sm:p-2 pl-5 sm:pl-6 shadow-xl flex items-center gap-2 border border-white/20">
                <input
                  id="hero-question-input"
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder={t('typeQuestionPlaceholder')}
                  className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-[#1B3F23] placeholder-[#8A9C8D] focus:outline-none"
                />

                {/* Microphone Voice Button */}
                <button
                  type="button"
                  id="hero-voice-mic-btn"
                  onClick={toggleListening}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isListening 
                      ? "bg-[#D9534F] text-white animate-pulse" 
                      : "bg-[#256030] text-white hover:bg-[#1B4B24]"
                  }`}
                  title={isListening ? t('listening') : t('clickToSpeak')}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Amber 'Ask now' Action Button */}
                <button
                  type="submit"
                  id="hero-ask-now-btn"
                  className="bg-[#FFB833] hover:bg-[#FFA726] active:scale-98 text-[#1A3821] font-extrabold text-xs sm:text-sm px-5 sm:px-7 py-2.5 sm:py-3 rounded-full transition-all duration-150 shadow-md cursor-pointer tracking-tight shrink-0"
                >
                  {t('askNowBtn')}
                </button>
              </div>
            </form>

            {/* Quick Prompt Suggestions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-[#D5EAD3] font-medium">{t('tryAsking')}</span>
              <button
                type="button"
                onClick={() => onAskQuestion("Cotton leaf reddening and curling solutions", "Cotton")}
                className="text-[11px] px-3 py-1 bg-white/15 hover:bg-white/25 rounded-full text-white font-medium backdrop-blur-xs transition cursor-pointer border border-white/10"
              >
                {t('promptCottonReddening')}
              </button>
              <button
                type="button"
                onClick={() => onAskQuestion("Tomato early blight pesticide dosage", "Tomato")}
                className="text-[11px] px-3 py-1 bg-white/15 hover:bg-white/25 rounded-full text-white font-medium backdrop-blur-xs transition cursor-pointer border border-white/10"
              >
                {t('promptTomatoBlight')}
              </button>
              <button
                type="button"
                onClick={() => onAskQuestion("Is tomorrow suitable for pesticide spraying?", "General")}
                className="text-[11px] px-3 py-1 bg-white/15 hover:bg-white/25 rounded-full text-white font-medium backdrop-blur-xs transition cursor-pointer border border-white/10"
              >
                {t('promptWeatherCheck')}
              </button>
            </div>
          </div>

          {/* Right Column: Illustrated Farmer Mascot */}
          <div className="shrink-0 flex items-end justify-center hidden sm:flex md:w-56 lg:w-64 -mb-6 sm:-mb-8 lg:-mb-10">
            <FarmerHeroMascot className="w-44 sm:w-52 lg:w-56 h-auto drop-shadow-2xl" />
          </div>
        </div>
      </div>


      {/* 2. THREE SUMMARY METRIC CARDS (Matches uploaded design) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Card 1: Today's Weather */}
        <div 
          onClick={() => onNavigateTab('weather')}
          className="bg-white rounded-[26px] p-5 sm:p-6 border border-[#EAE5DC] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-[#8BC34A]/50 transition-all duration-200 cursor-pointer flex items-center gap-4 group"
        >
          {/* Weather Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-[#E6F2FF] flex items-center justify-center shrink-0 border border-[#D0E6FF] group-hover:scale-105 transition-transform">
            <div className="relative">
              <Sun className="w-7 h-7 text-[#FFB833]" />
              <CloudRain className="w-5 h-5 text-[#3B82F6] absolute -bottom-1 -right-1" />
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-[#6E8070] block">
              {t('todaysWeather')}
            </span>
            <div className="text-2xl font-black text-[#193B20] tracking-tight">
              {(() => {
                const tempVal = weatherData?.current?.tempC ?? (weatherData?.current as any)?.temp;
                return typeof tempVal === "number" && !isNaN(tempVal)
                  ? `${Math.round(tempVal)}°C`
                  : "31°C";
              })()}
            </div>
            <div className="text-xs font-semibold text-[#4A6B52] flex items-center gap-1.5">
              <span>
                {weatherData?.daily && weatherData.daily.length > 1 && weatherData.daily[1].rainProbability > 40
                  ? t('rainTomorrow')
                  : (weatherData?.current?.condition || "Partly Cloudy")}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Crop Health */}
        <div 
          onClick={() => onNavigateTab('my-farm')}
          className="bg-white rounded-[26px] p-5 sm:p-6 border border-[#EAE5DC] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-[#8BC34A]/50 transition-all duration-200 cursor-pointer flex items-center gap-4 group"
        >
          {/* Crop Health Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-[#E8F5E9] flex items-center justify-center shrink-0 border border-[#CEEAD6] group-hover:scale-105 transition-transform">
            <Leaf className="w-7 h-7 text-[#2E7D32]" />
          </div>

          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-[#6E8070] block">
              {t('cropHealth')}
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#1E5E2B] tracking-tight">
              {farm?.crop || "Cotton"}: {t('healthyStatus')}
            </div>
            <div className="text-xs font-bold text-[#2E7D32] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>{t('allClear')}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Farm Tasks */}
        <div 
          onClick={() => setTasksModalOpen(true)}
          className="bg-white rounded-[26px] p-5 sm:p-6 border border-[#EAE5DC] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-[#8BC34A]/50 transition-all duration-200 cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            {/* Task Checklist Icon Badge */}
            <div className="w-14 h-14 rounded-2xl bg-[#FFF4E5] flex items-center justify-center shrink-0 border border-[#FFE0B2] group-hover:scale-105 transition-transform">
              <CheckSquare className="w-7 h-7 text-[#F57C00]" />
            </div>

            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-[#6E8070] block">
                {t('farmTasksTitle')}
              </span>
              <div className="text-xl sm:text-2xl font-black text-[#C45100] tracking-tight">
                {pendingTasksCount} {t('tasksPending')}
              </div>
              <span className="text-xs font-bold text-[#2E7D32] group-hover:underline flex items-center gap-1">
                {t('viewTasks')} <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>

      </div>


      {/* 3. TODAY'S FARM ADVICE SECTION (Matches uploaded design) */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <h3 className="text-xl font-extrabold text-[#193B20] tracking-tight">
              {t('todayFarmAdvice')}
            </h3>
          </div>

          <button
            onClick={() => onNavigateTab('ask-ai')}
            className="text-xs sm:text-sm font-bold text-[#2E7D32] hover:text-[#1B5E20] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{t('viewAllAdvice')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 2 Big Advice Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Card 1: Cotton Advice Card */}
          <div className="bg-white rounded-[28px] p-4 sm:p-5 border border-[#EAE5DC] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-center gap-4 hover:border-[#8BC34A]/60 transition-all duration-200">
            {/* Left Thumbnail Illustration */}
            <div className="w-full sm:w-44 h-44 rounded-2xl overflow-hidden shrink-0 border border-[#DCE8D8]">
              <CottonPlantArtwork className="w-full h-full object-cover" />
            </div>

            {/* Right Actionable Bullet Content */}
            <div className="flex-1 space-y-3 w-full">
              {/* Header with Crop Name & Status */}
              <div className="flex items-center justify-between pb-2 border-b border-[#F0ECE4]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#EBF3EA] flex items-center justify-center font-bold text-xs">
                    ☁️
                  </div>
                  <h4 className="text-lg font-black text-[#193B20]">Cotton</h4>
                </div>
                <span className="text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full border border-[#CEEAD6]">
                  Status: Healthy
                </span>
              </div>

              {/* 3 Key Action Bullets with Icons */}
              <ul className="space-y-2 text-xs sm:text-sm text-[#2D3E30] font-medium">
                <li className="flex items-center gap-2.5">
                  <span className="text-base">💧</span>
                  <span>{t("cottonAdvice1")}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-base">🍃</span>
                  <span>{t("cottonAdvice2")}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-base">🌾</span>
                  <span>{t("cottonAdvice3")}</span>
                </li>
              </ul>

              {/* Quick AI Action Link */}
              <div className="pt-1 flex items-center justify-between">
                <button
                  onClick={() => onAskQuestion(
                    language === 'te' ? "ఈరోజు పత్తి పంటకు వివరణాత్మక పిచికారీ మరియు నీటిపారుదల ప్రణాళిక ఇవ్వండి" :
                    language === 'hi' ? "आज कपास की फसल के लिए विस्तृत कीटनाशक छिड़काव व सिंचाई अनुसूची बताएं" :
                    "Give detailed spray and irrigation guide for cotton today", 
                    "Cotton"
                  )}
                  className="text-xs font-bold text-[#256030] hover:text-[#1B4B24] flex items-center gap-1 cursor-pointer group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FFB833]" />
                  <span>{language === 'te' ? 'పత్తి పంట పూర్తి ప్రణాళిక కోసం AI ని అడగండి' : language === 'hi' ? 'कपास के विस्तृत शेड्यूल के लिए AI से पूछें' : 'Ask AI for detailed cotton schedule'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Tomato Advice Card */}
          <div className="bg-white rounded-[28px] p-4 sm:p-5 border border-[#EAE5DC] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-center gap-4 hover:border-[#8BC34A]/60 transition-all duration-200">
            {/* Left Thumbnail Illustration */}
            <div className="w-full sm:w-44 h-44 rounded-2xl overflow-hidden shrink-0 border border-[#EAE0D8]">
              <TomatoPlantArtwork className="w-full h-full object-cover" />
            </div>

            {/* Right Actionable Bullet Content */}
            <div className="flex-1 space-y-3 w-full">
              {/* Header with Crop Name & Status */}
              <div className="flex items-center justify-between pb-2 border-b border-[#F0ECE4]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#FDEDEC] flex items-center justify-center font-bold text-xs">
                    🍅
                  </div>
                  <h4 className="text-lg font-black text-[#193B20]">
                    {language === 'te' ? 'టమోటా' : language === 'hi' ? 'टमाटर' : 'Tomato'}
                  </h4>
                </div>
                <span className="text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full border border-[#CEEAD6]">
                  {language === 'te' ? 'స్థితి: బాగుంది' : language === 'hi' ? 'स्थिति: अच्छी' : 'Status: Good'}
                </span>
              </div>

              {/* 3 Key Action Bullets with Icons */}
              <ul className="space-y-2 text-xs sm:text-sm text-[#2D3E30] font-medium">
                <li className="flex items-center gap-2.5">
                  <span className="text-base">🛡️</span>
                  <span>{t("tomatoAdvice1")}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-base">🌿</span>
                  <span>{t("tomatoAdvice2")}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-base">🌾</span>
                  <span>{t("tomatoAdvice3")}</span>
                </li>
              </ul>

              {/* Quick AI Action Link */}
              <div className="pt-1 flex items-center justify-between">
                <button
                  onClick={() => onAskQuestion(
                    language === 'te' ? "టమోటా ముందస్తు ఆకుమచ్చ తెగులు నివారణ మరియు వేప నూనె మోతాదు చెప్పండి" :
                    language === 'hi' ? "टमाटर में अगेती झुलसा रोग की रोकथाम और नीम तेल की सही मात्रा बताएं" :
                    "How to prevent tomato early blight and neem oil dosage", 
                    "Tomato"
                  )}
                  className="text-xs font-bold text-[#256030] hover:text-[#1B4B24] flex items-center gap-1 cursor-pointer group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FFB833]" />
                  <span>{language === 'te' ? 'టమోటా మందు మోతాదు వివరాల కోసం AI ని అడగండి' : language === 'hi' ? 'टमाटर के दवा और मात्रा के लिए AI से पूछें' : 'Ask AI for tomato dosage instructions'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>


      {/* 4. FARM TASKS MODAL (Interactive for "2 tasks pending") */}
      <AnimatePresence>
        {tasksModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[28px] max-w-lg w-full p-6 shadow-2xl border border-[#EAE5DC] space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE4]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFF4E5] flex items-center justify-center text-[#F57C00]">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#193B20]">{t('farmTaskChecklist')}</h3>
                    <p className="text-xs text-[#6E8070]">{t('farmTaskDesc')}</p>
                  </div>
                </div>

                <button
                  onClick={() => setTasksModalOpen(false)}
                  className="p-1.5 rounded-full text-[#6E8070] hover:bg-[#F2ECE1] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add New Task Form */}
              <form onSubmit={handleAddNewTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder={t('addTaskPlaceholder')}
                  className="flex-1 px-4 py-2.5 bg-[#F9F7F3] border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#193B20] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
                <select
                  value={newTaskCrop}
                  onChange={(e) => setNewTaskCrop(e.target.value)}
                  className="px-3 py-2.5 bg-[#F9F7F3] border border-[#EAE5DC] rounded-xl text-xs font-bold text-[#193B20] focus:outline-none"
                >
                  <option value="Cotton">Cotton</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Paddy">Paddy</option>
                  <option value="General">General</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#256030] hover:bg-[#1B4B24] text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> {t('addTaskBtn')}
                </button>
              </form>

              {/* Tasks List */}
              <div className="space-y-2.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      task.completed 
                        ? "bg-[#F9FBF8] border-[#E0EBDC] opacity-70" 
                        : "bg-white border-[#EAE5DC] shadow-2xs hover:border-[#8BC34A]"
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`w-5 h-5 mt-0.5 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
                          task.completed 
                            ? "bg-[#2E7D32] border-[#2E7D32] text-white" 
                            : "border-[#C2D0BF] hover:border-[#2E7D32]"
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <div>
                        <p className={`text-xs font-bold ${task.completed ? "line-through text-[#8A9C8D]" : "text-[#193B20]"}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 bg-[#EBF3EA] text-[#256030] rounded-full font-bold">
                            {task.crop}
                          </span>
                          <span className="text-[10px] text-[#6E8070] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {task.dueDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-[#9BAAA0] hover:text-[#D9534F] p-1 rounded-lg transition cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setTasksModalOpen(false)}
                  className="px-5 py-2 bg-[#256030] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {t('doneBtn')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

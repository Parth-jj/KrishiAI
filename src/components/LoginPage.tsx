import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Sprout, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Languages, 
  CloudSun, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Compass,
  BookOpen
} from "lucide-react";
import { KisanSathiLogoIcon, SidebarFarmLandscape } from "./FarmIllustrations.js";
import { useAuth } from "../context/AuthContext.js";
import { useLanguage, LanguageCode } from "../context/LanguageContext.js";

export const LoginPage: React.FC = () => {
  const { login, register, demoLogin, isLoading } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Registration fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [crop, setCrop] = useState("Cotton");
  const [district, setDistrict] = useState("Guntur");
  const [state, setState] = useState("Andhra Pradesh");
  const [farmSize, setFarmSize] = useState("3.5");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const languages: Array<{ code: LanguageCode; label: string; native: string }> = [
    { code: "en", label: "English", native: "English" },
    { code: "hi", label: "Hindi", native: "हिन्दी" },
    { code: "te", label: "Telugu", native: "తెలుగు" }
  ];

  const popularCrops = [
    "Cotton", "Paddy", "Chilli", "Wheat", "Maize", 
    "Groundnut", "Tomato", "Soybean", "Sugarcane", "Mustard"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        if (!email.trim() || !password) {
          throw new Error("Please enter your email and password");
        }
        await login(email.trim(), password);
      } else {
        if (!name.trim() || !email.trim() || !password) {
          throw new Error("Name, email, and password are required");
        }
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          farm: {
            crop,
            district: district.trim() || "Guntur",
            state: state.trim() || "Andhra Pradesh",
            farmSizeAcres: parseFloat(farmSize) || 2.0
          }
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please check your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAccess = async (role: "farmer" | "admin") => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await demoLogin(role);
    } catch (err: any) {
      setErrorMessage(err.message || "Demo login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A2E1A] flex flex-col justify-between selection:bg-[#8BC34A]/30">
      
      {/* Top Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EBF3EA] flex items-center justify-center border border-[#D5E5D3] shadow-xs">
            <KisanSathiLogoIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#1B3F23] tracking-tight">KrishiAI</h1>
            <p className="text-[11px] text-[#6E8070] font-semibold">Your AI Farm Companion</p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-[#E5E0D8] shadow-2xs">
          <div className="pl-2 pr-1 text-[#6E8070] flex items-center">
            <Languages className="w-3.5 h-3.5 text-[#256030]" />
          </div>
          {languages.map((l) => (
            <button
              key={l.code}
              id={`lang-btn-${l.code}`}
              onClick={() => setLanguage(l.code)}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                language === l.code
                  ? "bg-[#256030] text-white shadow-xs"
                  : "text-[#5C725E] hover:text-[#1B3F23] hover:bg-[#F2ECE1]"
              }`}
            >
              {l.native}
            </button>
          ))}
        </div>
      </header>

      {/* Main Authentication Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-4 sm:py-8 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Value Proposition & Visual Showcase (Desktop/Tablet) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-8 pr-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF3EA] border border-[#D0E2CE] text-[#1E4D2B] text-xs font-black">
                <Sparkles className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span>ICAR-Grounded Agricultural AI</span>
              </div>
              <h2 className="text-4xl xl:text-5xl font-black text-[#193B20] tracking-tight leading-[1.15]">
                Smart Farming Intelligence for Every Indian Farmer.
              </h2>
              <p className="text-base text-[#5C725E] font-medium leading-relaxed">
                Empowering farmers with instant crop pest diagnosis, scientific spray dosages, 7-day agro-weather alerts, and live mandi APMC price trends.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-[#E5E0D8] shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
                  <Sprout className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-[#1B3F23]">Crop Disease Diagnosis</h4>
                <p className="text-[11px] text-[#6E8070] leading-normal font-medium">
                  Authoritative ICAR guidance on pesticides, symptoms, and organic remedies.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E5E0D8] shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#E3F2FD] text-[#1565C0] flex items-center justify-center">
                  <CloudSun className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-[#1B3F23]">Precision Spray Windows</h4>
                <p className="text-[11px] text-[#6E8070] leading-normal font-medium">
                  Hourly rain & wind forecasts to avoid chemical runoff and wasted sprays.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E5E0D8] shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF8E1] text-[#F57F17] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-[#1B3F23]">Live Mandi Market Rates</h4>
                <p className="text-[11px] text-[#6E8070] leading-normal font-medium">
                  Real-time APMC arrivals, modal prices, and mandi comparison across districts.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E5E0D8] shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#F3E5F5] text-[#7B1FA2] flex items-center justify-center">
                  <Languages className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-[#1B3F23]">Multilingual Voice AI</h4>
                <p className="text-[11px] text-[#6E8070] leading-normal font-medium">
                  Speak in Telugu, Hindi, or English for instant spoken voice answers.
                </p>
              </div>
            </div>

            {/* Farm Illustration Banner */}
            <div className="rounded-2xl overflow-hidden border border-[#DDE7DA] shadow-xs relative">
              <SidebarFarmLandscape className="w-full h-28 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1B3F23]/80 via-[#1B3F23]/40 to-transparent flex items-center p-4">
                <p className="text-xs font-bold text-white max-w-xs">
                  🌾 Trusted by over 10,000+ farmers across Andhra Pradesh, Telangana, Maharashtra & Punjab.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="w-full max-w-md mx-auto lg:col-span-6">
            <div className="bg-white rounded-[32px] border border-[#E5E0D8] shadow-xl p-6 sm:p-8 space-y-6">
              
              {/* Form Mode Tabs (Sign In / Register) */}
              <div className="flex bg-[#F2ECE1] p-1.5 rounded-2xl">
                <button
                  type="button"
                  id="tab-mode-login"
                  onClick={() => {
                    setMode("login");
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    mode === "login"
                      ? "bg-white text-[#1B3F23] shadow-xs"
                      : "text-[#6E8070] hover:text-[#1B3F23]"
                  }`}
                >
                  {language === "hi" ? "लॉग इन करें" : language === "te" ? "సైన్ ఇన్" : "Sign In"}
                </button>
                <button
                  type="button"
                  id="tab-mode-register"
                  onClick={() => {
                    setMode("register");
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    mode === "register"
                      ? "bg-white text-[#1B3F23] shadow-xs"
                      : "text-[#6E8070] hover:text-[#1B3F23]"
                  }`}
                >
                  {language === "hi" ? "नया खाता बनाएं" : language === "te" ? "కొత్త ఖాతా" : "Create Account"}
                </button>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h3 className="text-xl font-black text-[#1B3F23] tracking-tight">
                  {mode === "login"
                    ? (language === "hi" ? "कृषि साथी में लॉग इन करें" : language === "te" ? "కృషి AI లోకి లాగిన్ అవ్వండి" : "Welcome Back to KrishiAI")
                    : (language === "hi" ? "किसान खाता बनाएं" : language === "te" ? "రైతు ఖాతాను ప్రారంభించండి" : "Create Your Farmer Account")}
                </h3>
                <p className="text-xs text-[#6E8070] font-medium mt-1">
                  {mode === "login"
                    ? (language === "hi" ? "अपने पंजीकृत ईमेल और पासवर्ड से साइन इन करें" : language === "te" ? "వ్యక్తిగత పంట సలహాల కోసం లాగిన్ అవ్వండి" : "Sign in to access your farm records, crop advisories, and history.")
                    : (language === "hi" ? "अपनी फसल व जिले के साथ नया खाता शुरू करें" : language === "te" ? "మీ పంట వివరాలతో నమోదు చేసుకోండి" : "Join to get customized spray reminders and agricultural advice.")}
                </p>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 font-semibold"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              {/* Main Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <div>
                    <label className="block text-xs font-bold text-[#1B3F23] mb-1.5">
                      Full Name / पूरा नाम / పూర్తి పేరు *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        id="reg-name-input"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ramesh Patil"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E0D9CE] focus:border-[#256030] focus:bg-white text-xs text-[#1A2E1A] font-medium transition outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#1B3F23] mb-1.5">
                    Email Address / ईमेल / ఈమెయిల్ *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      id="auth-email-input"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="farmer@kisan.in"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E0D9CE] focus:border-[#256030] focus:bg-white text-xs text-[#1A2E1A] font-medium transition outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B3F23] mb-1.5">
                    Password / पासवर्ड / పాస్‌వర్డ్ *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="auth-password-input"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E0D9CE] focus:border-[#256030] focus:bg-white text-xs text-[#1A2E1A] font-medium transition outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === "register" && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#1B3F23] mb-1.5">
                          Phone Number (Optional)
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            id="reg-phone-input"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E0D9CE] focus:border-[#256030] focus:bg-white text-xs text-[#1A2E1A] font-medium transition outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1B3F23] mb-1.5">
                          Farm Size (Acres)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          id="reg-size-input"
                          value={farmSize}
                          onChange={(e) => setFarmSize(e.target.value)}
                          placeholder="3.5"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E0D9CE] focus:border-[#256030] focus:bg-white text-xs text-[#1A2E1A] font-medium transition outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#1B3F23] mb-1.5">
                          Primary Crop / मुख्य फसल
                        </label>
                        <select
                          id="reg-crop-select"
                          value={crop}
                          onChange={(e) => setCrop(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E0D9CE] focus:border-[#256030] focus:bg-white text-xs text-[#1A2E1A] font-medium transition outline-none"
                        >
                          {popularCrops.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1B3F23] mb-1.5">
                          District / जिला / జిల్లా
                        </label>
                        <input
                          type="text"
                          id="reg-district-input"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="e.g. Guntur, Warangal"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E0D9CE] focus:border-[#256030] focus:bg-white text-xs text-[#1A2E1A] font-medium transition outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  id="auth-submit-btn"
                  disabled={isSubmitting || isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-2 py-3.5 bg-[#256030] hover:bg-[#1E4D2B] text-white rounded-2xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {mode === "login"
                          ? (language === "hi" ? "साइन इन करें" : language === "te" ? "సైన్ ఇన్ అవ్వండి" : "Sign In to KrishiAI")
                          : (language === "hi" ? "खाता बनाएं और शुरू करें" : language === "te" ? "ఖాతా నమోదు చేయండి" : "Create Account & Start")}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Instant 1-Click Demo Login Section */}
              <div className="pt-4 border-t border-[#EAE5DC] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#2D5A27] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FFD700] fill-[#FFD700]" />
                    Instant Demo Presets
                  </span>
                  <span className="text-[10px] font-semibold text-[#6E8070]">No password needed</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <motion.button
                    type="button"
                    id="demo-farmer-btn"
                    onClick={() => handleDemoAccess("farmer")}
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-3 bg-[#F1F8E9] hover:bg-[#E8F5E9] border border-[#C5E1A5] rounded-2xl text-left transition font-semibold text-[#2D5A27] flex flex-col justify-between cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-[#1B3F23]">Ramesh Patil</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#256030] text-[#FFD700] font-black">
                        Farmer
                      </span>
                    </div>
                    <p className="text-[10px] text-[#558B2F] mt-1 font-medium">
                      Cotton & Paddy • Guntur (A.P.)
                    </p>
                  </motion.button>

                  <motion.button
                    type="button"
                    id="demo-admin-btn"
                    onClick={() => handleDemoAccess("admin")}
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-3 bg-[#FFF9C4]/40 hover:bg-[#FFF9C4]/70 border border-[#FFE082] rounded-2xl text-left transition font-semibold text-[#E65100] flex flex-col justify-between cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-[#BF360C]">Dr. K. Sharma</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E65100] text-white font-black">
                        Agronomist
                      </span>
                    </div>
                    <p className="text-[10px] text-[#F57F17] mt-1 font-medium">
                      KVK Scientist • Advisory System
                    </p>
                  </motion.button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 border-t border-[#EAE5DC]/80 flex flex-wrap items-center justify-between gap-3 text-xs text-[#6E8070] font-medium">
        <div className="flex items-center gap-2">
          <span>🌾 <strong>KrishiAI</strong> — Empowering Indian Agriculture</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>ICAR-Grounded RAG System</span>
          <span>•</span>
          <span>Precision Agro-Meteorology</span>
          <span>•</span>
          <span>Mandi e-NAM Grounding</span>
        </div>
      </footer>

    </div>
  );
};

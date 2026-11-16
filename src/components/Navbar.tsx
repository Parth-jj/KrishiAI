import React from "react";
import { motion } from "motion/react";
import { 
  Sprout, 
  BookOpen, 
  BarChart3, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  MapPin, 
  Languages,
  Sparkles,
  ChevronDown,
  Wheat,
  Activity,
  FlaskConical
} from "lucide-react";
import { useAuth } from "../context/AuthContext.js";
import { useLanguage, LanguageCode } from "../context/LanguageContext.js";

interface NavbarProps {
  currentTab: 'farmer' | 'admin' | 'evaluation';
  setCurrentTab: (tab: 'farmer' | 'admin' | 'evaluation') => void;
  onOpenFarmModal: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenFarmModal,
  onOpenAuthModal
}) => {
  const { user, farm, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const navTabs = [
    { id: 'farmer', label: t("farmerDashboard"), icon: Sprout, testId: 'tab-farmer-btn' },
    { id: 'admin', label: t("adminDashboard"), icon: FlaskConical, testId: 'tab-admin-btn' },
    { id: 'evaluation', label: t("evaluationTab"), icon: BarChart3, testId: 'tab-evaluation-btn' }
  ] as const;

  return (
    <header id="app-header" className="sticky top-0 z-40 bg-[#2D5A27]/95 backdrop-blur-md text-white shadow-lg border-b border-[#1E3D1A]/80 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand Logo & Title with motion */}
          <motion.div 
            id="brand-logo-container"
            onClick={() => setCurrentTab('farmer')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer select-none group"
          >
            <div className="relative">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#FFD700] via-[#FFE082] to-[#FFD700] flex items-center justify-center shadow-md text-[#2D5A27] font-black text-xl border-2 border-white/20 group-hover:rotate-3 transition-transform">
                🌾
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8BC34A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#8BC34A] border-2 border-[#2D5A27]"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                  KisanMitra AI
                </span>
                <span className="text-[#FFD700] font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-[#1E3D1A] border border-[#3E7A37] shadow-2xs">
                  ICAR RAG
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#E0E7D9] font-medium hidden sm:block truncate max-w-[240px] md:max-w-none">
                {t("appSubtitle")}
              </p>
            </div>
          </motion.div>

          {/* Desktop Navigation Tabs with Animated Pill Morphing */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#1E3D1A]/90 p-1.5 rounded-full border border-[#3E7A37] shadow-inner">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={tab.testId}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 transition-colors cursor-pointer z-10 ${
                    isActive ? "text-[#1A2E1A]" : "text-[#E0E7D9] hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-pill"
                      className="absolute inset-0 bg-[#8BC34A] rounded-full shadow-sm"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#1A2E1A]" : "text-[#8BC34A]"}`} />
                    <span>{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Language Selector */}
            <div className="relative flex items-center bg-[#1E3D1A] rounded-full px-2 py-0.5 border border-[#3E7A37] shadow-2xs hover:border-[#8BC34A] transition-colors">
              <Languages className="w-3.5 h-3.5 text-[#FFD700] ml-1 pointer-events-none" />
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="bg-transparent text-white text-xs rounded-full pl-1.5 pr-2 py-1 focus:outline-none font-bold cursor-pointer border-none"
              >
                <option value="en" className="bg-[#2D5A27] text-white">English (EN)</option>
                <option value="te" className="bg-[#2D5A27] text-white">తెలుగు (Telugu)</option>
                <option value="hi" className="bg-[#2D5A27] text-white">हिंदी (Hindi)</option>
              </select>
            </div>

            {/* Farm Profile Chip (if Farmer role and on Farmer tab) */}
            {farm && currentTab === 'farmer' && (
              <motion.button
                id="farm-profile-chip"
                onClick={onOpenFarmModal}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="hidden xl:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1E3D1A] border border-[#3E7A37] text-xs text-[#E0E7D9] hover:text-white hover:border-[#8BC34A] transition shadow-2xs cursor-pointer"
              >
                <MapPin className="w-3 h-3 text-[#FFD700]" />
                <span className="font-semibold text-white">{farm.district}</span>
                <span className="text-[#8BC34A]">•</span>
                <span className="text-[#FFD700] font-black">{farm.crop} ({farm.farmSizeAcres} ac)</span>
              </motion.button>
            )}

            {/* User Account / Role Switcher */}
            {user ? (
              <div className="flex items-center gap-2 pl-1.5 sm:pl-2.5 border-l border-[#3E7A37]">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-[#1E3D1A]/60 px-2 sm:px-2.5 py-1 rounded-full border border-[#3E7A37]"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#8BC34A] border-2 border-white/80 flex items-center justify-center text-xs font-black text-[#1A2E1A] shadow-xs">
                    👨‍🌾
                  </div>
                  <div className="hidden sm:block text-left pr-1">
                    <div className="text-xs font-bold text-white truncate max-w-[100px] sm:max-w-[120px]">{user.name}</div>
                    <div className="text-[10px] text-[#FFD700] uppercase tracking-wider font-extrabold">
                      {user.role === 'admin' ? 'KVK Agronomist' : 'Farmer'}
                    </div>
                  </div>
                </motion.div>

                <motion.button
                  id="user-logout-btn"
                  onClick={logout}
                  whileHover={{ scale: 1.1, rotate: 6 }}
                  whileTap={{ scale: 0.9 }}
                  title="Sign Out"
                  className="p-1.5 sm:p-2 rounded-full text-[#E0E7D9] hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                id="signin-modal-btn"
                onClick={onOpenAuthModal}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="px-3.5 sm:px-4 py-1.5 rounded-full bg-[#FFD700] hover:bg-[#F2C94C] text-[#2D5A27] font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>{t("login")}</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar with Animated Pill Indicator */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-[#3E7A37]/80 text-xs">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`relative flex-1 py-1.5 text-center flex items-center justify-center gap-1.5 rounded-full transition-colors font-bold cursor-pointer ${
                  isActive ? "text-[#1A2E1A]" : "text-[#E0E7D9]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-mobile-nav-pill"
                    className="absolute inset-0 bg-[#8BC34A] rounded-full shadow-xs"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.id === 'evaluation' ? 'Benchmark' : tab.id === 'admin' ? 'Admin' : 'Farmer'}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

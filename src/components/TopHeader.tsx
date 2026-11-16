import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronDown, 
  MapPin, 
  Languages, 
  User as UserIcon, 
  LogOut, 
  Sparkles, 
  Menu,
  Check,
  Settings,
  ShieldCheck,
  Compass
} from "lucide-react";
import { FarmerAvatarIcon } from "./FarmIllustrations.js";
import { useAuth } from "../context/AuthContext.js";
import { useLanguage, LanguageCode } from "../context/LanguageContext.js";

interface TopHeaderProps {
  onToggleMobileMenu: () => void;
  onOpenFarmModal: () => void;
  onOpenAuthModal: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleMobileMenu,
  onOpenFarmModal,
  onOpenAuthModal
}) => {
  const { user, farm, logout, demoLogin } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return { text: t('goodMorning'), emoji: "☀️" };
    if (hour >= 12 && hour < 17) return { text: t('goodAfternoon'), emoji: "🌤️" };
    return { text: t('goodEvening'), emoji: "🌙" };
  };

  const greeting = getGreeting();
  const displayName = user?.name ? user.name.split(" ")[0] : "Ramesh";
  const displayLocation = farm?.state || (farm?.district ? `${farm.district}, Maharashtra` : "Maharashtra");

  const languages: Array<{ code: LanguageCode; label: string; native: string }> = [
    { code: "en", label: "English", native: "English" },
    { code: "hi", label: "Hindi", native: "हिन्दी" },
    { code: "te", label: "Telugu", native: "తెలుగు" }
  ];

  return (
    <header className="w-full flex items-center justify-between py-4 px-4 sm:px-8 bg-transparent">
      {/* Left: Mobile Menu & Greeting */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-white border border-[#EAE5DC] text-[#1E4D2B] shadow-2xs cursor-pointer hover:bg-[#F2ECE1]"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#193B20] tracking-tight flex items-center gap-2">
            <span>{greeting.text}, {displayName}</span>
            <span className="text-2xl sm:text-3xl">{greeting.emoji}</span>
          </h1>
        </div>
      </div>

      {/* Right: Profile & Settings Pill */}
      <div className="relative" ref={dropdownRef}>
        <button
          id="user-profile-pill-btn"
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          className="bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] px-3.5 py-1.5 rounded-full shadow-xs flex items-center gap-2.5 transition cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-[#EBF3EA] overflow-hidden flex items-center justify-center shrink-0 border border-[#D0E2CE]">
            <FarmerAvatarIcon className="w-8 h-8" />
          </div>

          <div className="text-left hidden sm:block">
            <span className="text-xs font-extrabold text-[#1B3F23] block leading-tight group-hover:text-[#256030]">
              {displayName}
            </span>
            <span className="text-[10px] text-[#6E8070] font-semibold block leading-none">
              {displayLocation}
            </span>
          </div>

          <ChevronDown className={`w-4 h-4 text-[#6E8070] transition-transform duration-200 ${
            profileDropdownOpen ? "rotate-180 text-[#256030]" : ""
          }`} />
        </button>

        {/* Profile & Farm Popover Dropdown */}
        <AnimatePresence>
          {profileDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E5E0D8] p-3 z-50 space-y-3"
            >
              {/* User Header Info */}
              <div className="p-3 bg-[#F7F9F6] rounded-xl border border-[#E2ECE0] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#EBF3EA] flex items-center justify-center shrink-0 border border-[#D0E2CE]">
                  <FarmerAvatarIcon className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#1B3F23]">{user?.name || "Ramesh Patil"}</h4>
                  <p className="text-xs text-[#5C725E] font-medium">{user?.email || "ramesh.farmer@kisan.in"}</p>
                  <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 bg-[#E8F5E9] text-[#2E7D32] rounded-full font-bold">
                    📍 {displayLocation}
                  </span>
                </div>
              </div>

              {/* Language Switcher */}
              <div>
                <label className="text-[11px] font-bold text-[#6E8070] uppercase tracking-wider block mb-1.5 px-1 flex items-center gap-1.5">
                  <Languages className="w-3 h-3 text-[#256030]" />
                  Language / भाषा / భాష
                </label>
                <div className="grid grid-cols-3 gap-1 bg-[#F5F2EB] p-1 rounded-xl">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        language === lang.code 
                          ? "bg-white text-[#1B3F23] shadow-xs" 
                          : "text-[#5C725E] hover:text-[#1B3F23]"
                      }`}
                    >
                      {lang.native}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions List */}
              <div className="space-y-1 pt-1 border-t border-[#EAE5DC]">
                <button
                  onClick={() => {
                    onOpenFarmModal();
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#1B3F23] hover:bg-[#F4F8F3] rounded-xl transition cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#256030]" />
                  <span>{t('editFarmProfile')}</span>
                </button>

                <button
                  onClick={() => {
                    demoLogin('farmer');
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#1B3F23] hover:bg-[#F4F8F3] rounded-xl transition cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-[#256030]" />
                  <span>{t('switchDemoFarm')}</span>
                </button>

                <button
                  onClick={() => {
                    if (user) {
                      logout();
                    } else {
                      onOpenAuthModal();
                    }
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#C62828] hover:bg-[#FDEDEC] rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-[#C62828]" />
                  <span>{user ? t('signOut') : t('signInRegister')}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

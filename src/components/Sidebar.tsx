import React from "react";
import { motion } from "motion/react";
import { 
  Home, 
  MessageSquare, 
  Sprout, 
  CloudSun, 
  TrendingUp, 
  Menu, 
  X,
  Languages,
  User as UserIcon,
  LogOut,
  Sparkles
} from "lucide-react";
import { KisanSathiLogoIcon, SidebarFarmLandscape } from "./FarmIllustrations.js";
import { useLanguage, LanguageCode } from "../context/LanguageContext.js";
import { useAuth } from "../context/AuthContext.js";

export type NavTabId = 'home' | 'ask-ai' | 'my-farm' | 'weather' | 'market-prices';

interface SidebarProps {
  currentTab: NavTabId;
  setCurrentTab: (tab: NavTabId) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenFarmModal: () => void;
  onOpenAuthModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  mobileOpen,
  setMobileOpen,
  onOpenFarmModal,
  onOpenAuthModal
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, farm, logout } = useAuth();

  const navItems = [
    { id: 'home' as NavTabId, label: t('navHome'), icon: Home, badge: null },
    { id: 'ask-ai' as NavTabId, label: t('navAskAi'), icon: MessageSquare, badge: t('navSmart') },
    { id: 'my-farm' as NavTabId, label: t('navMyFarm'), icon: Sprout, badge: null },
    { id: 'weather' as NavTabId, label: t('navWeather'), icon: CloudSun, badge: null },
    { id: 'market-prices' as NavTabId, label: t('navMarketPrices'), icon: TrendingUp, badge: t('navLive') }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#FCFAF7] border-r border-[#EAE5DC] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex flex-col flex-1 overflow-y-auto">
          {/* Top Logo & Header */}
          <div className="flex items-center justify-between pb-6 border-b border-[#EAE5DC]/80">
            <div 
              onClick={() => {
                setCurrentTab('home');
                setMobileOpen(false);
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#EBF3EA] flex items-center justify-center border border-[#D5E5D3] shadow-2xs group-hover:scale-105 transition-transform">
                <KisanSathiLogoIcon className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xl font-extrabold text-[#1B3F23] tracking-tight">KrishiAI</h1>
                </div>
                <p className="text-[11px] text-[#6E8070] font-semibold">{t('sidebarCompanion')}</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-[#6E8070] hover:bg-[#EAE5DC] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}-btn`}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? "bg-[#EBF3EA] text-[#1E4D2B] shadow-xs scale-[1.01]" 
                      : "text-[#4A5D4D] hover:bg-[#F2ECE1] hover:text-[#1B3F23]"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      isActive ? "bg-[#256030] text-white" : "bg-transparent text-[#4A5D4D]"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="tracking-tight">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                      isActive 
                        ? "bg-[#256030] text-[#FFD700]" 
                        : "bg-[#EAE5DC] text-[#4A5D4D]"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Card & Farm Landscape Graphic */}
        <div className="p-4 pt-0 space-y-3">
          {/* User Account & Sign Out */}
          {user && (
            <div className="p-3 bg-[#F4F8F3] border border-[#D5E5D3] rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#256030] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : "K"}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#1B3F23] truncate">{user.name || t('farmer')}</div>
                  <div className="text-[10px] text-[#6E8070] truncate">{farm?.crop || "Cotton"} • {farm?.district || "Guntur"}</div>
                </div>
              </div>
              <button
                id="sidebar-signout-btn"
                onClick={logout}
                title={t('signOut')}
                className="p-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="rounded-2xl overflow-hidden border border-[#DDE7DA] shadow-xs relative group">
            <SidebarFarmLandscape className="w-full h-auto object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1B3F23]/40 via-transparent to-transparent flex items-end p-3 pointer-events-none">
              <span className="text-[10px] text-white/90 font-bold drop-shadow-xs">
                {t('aiPoweredIntelligence')}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import { LanguageProvider } from "./context/LanguageContext.js";
import { Sidebar, NavTabId } from "./components/Sidebar.js";
import { TopHeader } from "./components/TopHeader.js";
import { HomeDashboard } from "./components/HomeDashboard.js";
import { AskAiView } from "./components/AskAiView.js";
import { MyFarmView } from "./components/MyFarmView.js";
import { WeatherCard } from "./components/WeatherCard.js";
import { MarketPricesView } from "./components/MarketPricesView.js";
import { FarmProfileModal } from "./components/FarmProfileModal.js";
import { AuthModal } from "./components/AuthModal.js";
import { LoginPage } from "./components/LoginPage.js";
import { KisanSathiLogoIcon } from "./components/FarmIllustrations.js";

export function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTabId>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isFarmModalOpen, setIsFarmModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // States to pass queries from Home to Ask AI seamlessly
  const [prefilledQuery, setPrefilledQuery] = useState<string>("");
  const [prefilledCrop, setPrefilledCrop] = useState<string>("Cotton");

  const handleAskQuestion = (query: string, crop: string = "Cotton") => {
    setPrefilledQuery(query);
    setPrefilledCrop(crop);
    setCurrentTab('ask-ai');
  };

  // Loading state while checking token
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#EBF3EA] flex items-center justify-center border border-[#D5E5D3] shadow-md animate-pulse">
            <KisanSathiLogoIcon className="w-10 h-10" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-[#1B3F23]">KrishiAI</h2>
            <p className="text-xs text-[#6E8070] font-semibold">Loading farm advisory workspace...</p>
          </div>
          <div className="w-32 h-1.5 bg-[#EAE5DC] rounded-full overflow-hidden">
            <div className="w-full h-full bg-[#256030] rounded-full animate-indeterminate" />
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show the dedicated Login Page
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A2E1A] flex font-sans selection:bg-[#8BC34A]/30">
      
      {/* Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        onOpenFarmModal={() => setIsFarmModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area (Offset for Desktop Sidebar) */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-72 transition-all duration-300">
        
        {/* Top Header Bar */}
        <TopHeader
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onOpenFarmModal={() => setIsFarmModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-2">
          {currentTab === 'home' && (
            <HomeDashboard
              onAskQuestion={handleAskQuestion}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'ask-ai' && (
            <AskAiView
              initialQuery={prefilledQuery}
              initialCrop={prefilledCrop}
            />
          )}

          {currentTab === 'my-farm' && (
            <MyFarmView
              onOpenFarmModal={() => setIsFarmModalOpen(true)}
              onAskAI={handleAskQuestion}
            />
          )}

          {currentTab === 'weather' && (
            <div className="max-w-6xl mx-auto">
              <WeatherCard />
            </div>
          )}

          {currentTab === 'market-prices' && (
            <MarketPricesView
              onAskAIForSellingAdvice={(commodity) => {
                handleAskQuestion(`What is the price forecast and best market selling advice for ${commodity} this week?`, commodity);
              }}
            />
          )}
        </main>

        {/* Modals */}
        <FarmProfileModal
          isOpen={isFarmModalOpen}
          onClose={() => setIsFarmModalOpen(false)}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />

      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

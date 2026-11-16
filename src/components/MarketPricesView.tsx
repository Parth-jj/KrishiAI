import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Search, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  CheckCircle2, 
  Sparkles,
  Info,
  RefreshCw
} from "lucide-react";

import { useLanguage } from "../context/LanguageContext.js";

interface MandiPrice {
  id: string;
  commodity: string;
  variety: string;
  market: string;
  district: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  msp: number;
  changePercent: number; // positive = up, negative = down
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

const MANDI_DATA: MandiPrice[] = [
  {
    id: "m-1",
    commodity: "Cotton (Medium Staple)",
    variety: "Shankar-6 / BT",
    market: "Amravati APMC",
    district: "Amravati",
    state: "Maharashtra",
    minPrice: 6850,
    maxPrice: 7420,
    modalPrice: 7280,
    msp: 7122,
    changePercent: 2.4,
    trend: "up",
    lastUpdated: "Today, 11:30 AM"
  },
  {
    id: "m-2",
    commodity: "Tomato",
    variety: "Hybrid Red",
    market: "Pimpalgaon APMC",
    district: "Nashik",
    state: "Maharashtra",
    minPrice: 1400,
    maxPrice: 2200,
    modalPrice: 1850,
    msp: 0,
    changePercent: 5.1,
    trend: "up",
    lastUpdated: "Today, 10:15 AM"
  },
  {
    id: "m-3",
    commodity: "Soybean",
    variety: "Yellow Grade A",
    market: "Latur Mandi",
    district: "Latur",
    state: "Maharashtra",
    minPrice: 4200,
    maxPrice: 4680,
    modalPrice: 4520,
    msp: 4892,
    changePercent: -1.2,
    trend: "down",
    lastUpdated: "Today, 01:00 PM"
  },
  {
    id: "m-4",
    commodity: "Paddy (Dhan)",
    variety: "Common Grade",
    market: "Gondia APMC",
    district: "Gondia",
    state: "Maharashtra",
    minPrice: 2180,
    maxPrice: 2360,
    modalPrice: 2300,
    msp: 2300,
    changePercent: 0.0,
    trend: "stable",
    lastUpdated: "Yesterday"
  },
  {
    id: "m-5",
    commodity: "Red Chilli",
    variety: "Guntur / Teja",
    market: "Nagpur APMC",
    district: "Nagpur",
    state: "Maharashtra",
    minPrice: 16500,
    maxPrice: 21000,
    modalPrice: 19200,
    msp: 0,
    changePercent: 3.8,
    trend: "up",
    lastUpdated: "Today, 09:45 AM"
  },
  {
    id: "m-6",
    commodity: "Onion",
    variety: "Red Nasik",
    market: "Lasalgaon Mandi",
    district: "Nashik",
    state: "Maharashtra",
    minPrice: 1350,
    maxPrice: 1850,
    modalPrice: 1620,
    msp: 0,
    changePercent: -2.3,
    trend: "down",
    lastUpdated: "Today, 12:00 PM"
  }
];

export const MarketPricesView: React.FC<{ onAskAIForSellingAdvice?: (commodity: string) => void }> = ({
  onAskAIForSellingAdvice
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredItems = MANDI_DATA.filter(item => {
    const matchesSearch = item.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.district.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === "All") return matchesSearch;
    return matchesSearch && item.commodity.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <div id="market-prices-view" className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#EAE5DC] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📈</span>
            <h2 className="text-2xl font-black text-[#193B20] tracking-tight">{t('liveMandiRates')}</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#6E8070] font-medium mt-1">
            {t('mandiSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E8F5E9] text-[#2E7D32] rounded-full text-xs font-bold border border-[#CEEAD6]">
            <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-ping" />
            {t('liveApmcFeed')}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-[24px] p-4 border border-[#EAE5DC] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#8A9C8D] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchCropMandi')}
            className="w-full pl-10 pr-4 py-2 bg-[#F9F7F3] border border-[#EAE5DC] rounded-xl text-xs font-semibold text-[#193B20] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["All", "Cotton", "Tomato", "Soybean", "Paddy", "Chilli", "Onion"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#256030] text-white shadow-2xs"
                  : "bg-[#F5F2EB] text-[#5C725E] hover:bg-[#EAE5DC] hover:text-[#193B20]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Mandi Rates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((mandi) => (
          <div
            key={mandi.id}
            className="bg-white rounded-[26px] p-5 border border-[#EAE5DC] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-[#8BC34A]/50 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Header: Commodity & Trend */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-black text-[#193B20] leading-tight">
                    {mandi.commodity}
                  </h3>
                  <span className="text-[11px] text-[#6E8070] font-medium block">
                    {mandi.variety}
                  </span>
                </div>

                <div className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1 ${
                  mandi.trend === 'up' 
                    ? "bg-[#E8F5E9] text-[#2E7D32]" 
                    : mandi.trend === 'down' 
                    ? "bg-[#FDEDEC] text-[#D9534F]" 
                    : "bg-[#F5F5F5] text-[#6E8070]"
                }`}>
                  {mandi.trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                  {mandi.trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{mandi.changePercent > 0 ? `+${mandi.changePercent}%` : `${mandi.changePercent}%`}</span>
                </div>
              </div>

              {/* Location Badge */}
              <div className="flex items-center gap-1.5 text-xs text-[#5C725E] font-medium bg-[#F9F7F3] px-3 py-1.5 rounded-xl">
                <MapPin className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span>{mandi.market}, {mandi.district}</span>
              </div>

              {/* Price Details */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EAE5DC]/80 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#6E8070] font-semibold">Modal Price</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#193B20]">
                      ₹{mandi.modalPrice.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#6E8070] font-bold block">per Quintal</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#EAE5DC] text-[#6E8070]">
                  <span>Range: ₹{mandi.minPrice} - ₹{mandi.maxPrice}</span>
                  {mandi.msp > 0 && (
                    <span className="font-bold text-[#2E7D32]">Govt MSP: ₹{mandi.msp}</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Advisor Button */}
            <div className="mt-4 pt-3 border-t border-[#F0ECE4] flex items-center justify-between">
              <span className="text-[10px] text-[#8A9C8D]">{mandi.lastUpdated}</span>
              
              {onAskAIForSellingAdvice && (
                <button
                  onClick={() => onAskAIForSellingAdvice(mandi.commodity)}
                  className="text-xs font-bold text-[#256030] hover:text-[#1B4B24] flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-[#FFB833]" />
                  <span>Selling Advice</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

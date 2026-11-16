import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sprout, 
  Bug, 
  ShieldAlert, 
  FlaskConical, 
  Droplets, 
  CheckCircle2, 
  Search, 
  Sparkles, 
  Calendar, 
  AlertCircle, 
  Clock, 
  Info,
  ChevronRight,
  ShieldCheck,
  Leaf,
  Layers,
  HelpCircle
} from "lucide-react";
import { CROP_GUIDES_DATA } from "../data/cropGuidesData.js";
import { CropGuideItem, SprayRemedy } from "../data/cropGuides.js";
import { useLanguage } from "../context/LanguageContext.js";

interface CropGuideProps {
  onSelectProblemForQuery?: (crop: string, problem: string) => void;
}

export const CropGuide: React.FC<CropGuideProps> = ({ onSelectProblemForQuery }) => {
  const { language, t } = useLanguage();
  const [selectedCropId, setSelectedCropId] = useState<string>("paddy");
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pest' | 'disease'>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [expandedRemedyId, setExpandedRemedyId] = useState<string | null>("paddy-blast");

  const selectedCrop = CROP_GUIDES_DATA.find(c => c.id === selectedCropId) || CROP_GUIDES_DATA[0];

  const filteredRemedies = selectedCrop.sprayGuides.filter(item => {
    if (selectedFilter !== 'all' && item.type !== selectedFilter) return false;
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const matchName = item.problemName.toLowerCase().includes(q);
      const matchRegional = item.regionalName.hi.includes(q) || item.regionalName.te.includes(q);
      const matchSymptoms = item.symptoms.some(s => s.toLowerCase().includes(q));
      const matchChemical = item.chemicalRemedy.activeIngredient.toLowerCase().includes(q);
      return matchName || matchRegional || matchSymptoms || matchChemical;
    }
    return true;
  });

  return (
    <div id="crop-guide-view" className="space-y-6">
      
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-r from-[#2D5A27] via-[#244A1F] to-[#1E3D1A] text-white rounded-[28px] p-6 sm:p-8 shadow-md border-2 border-[#1E3D1A]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3D1A] text-xs font-black text-[#FFD700] mb-2 border border-[#3E7A37]">
              <Leaf className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>ICAR Practical Field Spray & Disease Guide</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Crop Protection & Spray Schedule
            </h1>
            <p className="text-sm text-[#E0E7D9] mt-1 max-w-2xl font-medium">
              Select your crop to see common pests, symptoms, exact per-pump chemical dosage (15L tank), organic remedies, and waiting periods.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#1A3317] p-3 rounded-2xl border border-[#3E7A37]">
            <div className="w-10 h-10 rounded-xl bg-[#FFD700] text-[#1E3D1A] flex items-center justify-center font-black text-xl">
              🚜
            </div>
            <div className="text-xs">
              <span className="text-[#FFD700] font-black block">100% Practical</span>
              <span className="text-[#D0DBC7]">Per-Tank (15L) Dosages</span>
            </div>
          </div>
        </div>
      </div>

      {/* Crop Selector Grid */}
      <div className="bg-white rounded-[24px] p-4 sm:p-5 border border-[#D0DBC7] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-black text-[#2D5A27] uppercase tracking-wider flex items-center gap-1.5">
            <Sprout className="w-4 h-4 text-[#8BC34A]" />
            Select Your Crop:
          </label>
          <span className="text-xs text-[#5C7A5C] font-semibold">{CROP_GUIDES_DATA.length} Crops Available</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {CROP_GUIDES_DATA.map((crop) => {
            const isSelected = crop.id === selectedCropId;
            return (
              <button
                key={crop.id}
                id={`crop-select-btn-${crop.id}`}
                onClick={() => {
                  setSelectedCropId(crop.id);
                  setExpandedRemedyId(crop.sprayGuides[0]?.id || null);
                }}
                className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                  isSelected 
                    ? "bg-[#2D5A27] text-white border-[#1E3D1A] shadow-md scale-[1.02]" 
                    : "bg-[#F9FBF8] text-[#1E3D1A] hover:bg-[#E8F0E5] border-[#D0DBC7]"
                }`}
              >
                <span className="text-3xl mb-1">{crop.icon}</span>
                <span className="font-bold text-xs leading-tight line-clamp-1">{crop.name.split(" ")[0]}</span>
                <span className={`text-[10px] mt-0.5 ${isSelected ? "text-[#FFD700]" : "text-[#5C7A5C]"}`}>
                  {crop.sprayGuides.length} Guide Solutions
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Crop Overview Bar & Search/Filter */}
      <div className="bg-[#E8F0E5] rounded-[24px] p-4 sm:p-5 border border-[#D0DBC7] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{selectedCrop.icon}</span>
          <div>
            <h2 className="text-lg font-black text-[#1E3D1A]">{selectedCrop.name}</h2>
            <p className="text-xs text-[#4A6B45] italic">{selectedCrop.scientificName}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {selectedCrop.popularVarieties.slice(0, 3).map((v, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 bg-white rounded-full font-bold text-[#2D5A27] border border-[#C5D5BD]">
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-[#5C7A5C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Search symptom, pest, medicine..."
              className="w-full pl-8 pr-3 py-1.5 bg-white rounded-full text-xs font-semibold text-[#1E3D1A] border border-[#C5D5BD] focus:outline-none focus:ring-2 focus:ring-[#8BC34A]"
            />
          </div>

          <div className="flex items-center bg-white p-1 rounded-full border border-[#C5D5BD]">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                selectedFilter === 'all' ? "bg-[#2D5A27] text-white" : "text-[#5C7A5C] hover:text-[#1E3D1A]"
              }`}
            >
              All ({selectedCrop.sprayGuides.length})
            </button>
            <button
              onClick={() => setSelectedFilter('pest')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                selectedFilter === 'pest' ? "bg-[#D9534F] text-white" : "text-[#5C7A5C] hover:text-[#1E3D1A]"
              }`}
            >
              <Bug className="w-3 h-3" /> Pests
            </button>
            <button
              onClick={() => setSelectedFilter('disease')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                selectedFilter === 'disease' ? "bg-[#E67E22] text-white" : "text-[#5C7A5C] hover:text-[#1E3D1A]"
              }`}
            >
              <ShieldAlert className="w-3 h-3" /> Diseases
            </button>
          </div>
        </div>
      </div>

      {/* Critical Crop Growth Stages Visual Timeline */}
      <div className="bg-white rounded-[24px] p-5 border border-[#D0DBC7] shadow-xs">
        <h3 className="text-xs font-black text-[#2D5A27] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#8BC34A]" />
          Key Growth Stages & Critical Care Windows:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {selectedCrop.criticalStages.map((stage, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-[#F9FBF8] border border-[#D0DBC7] flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#2D5A27] text-[#FFD700] text-xs font-black flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <div>
                <span className="text-xs font-bold text-[#1E3D1A] block">{stage.split("(")[0]}</span>
                <span className="text-[11px] text-[#5C7A5C] font-semibold">{stage.includes("(") ? `(${stage.split("(")[1]}` : ""}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spray & Problem Cards List */}
      <div className="space-y-4">
        {filteredRemedies.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-[24px] border border-[#D0DBC7] text-[#5C7A5C]">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 text-[#8BC34A]" />
            <p className="font-bold text-sm">No specific remedies found matching your search.</p>
            <p className="text-xs mt-1">Try searching for generic symptoms like "leaf curl", "yellowing", or "spots".</p>
          </div>
        ) : (
          filteredRemedies.map((remedy) => {
            const isExpanded = expandedRemedyId === remedy.id;
            return (
              <motion.div
                key={remedy.id}
                layout
                className={`bg-white rounded-[24px] border transition-all overflow-hidden shadow-xs ${
                  isExpanded ? "border-[#2D5A27] ring-1 ring-[#2D5A27]" : "border-[#D0DBC7] hover:border-[#8BC34A]"
                }`}
              >
                {/* Card Header Accordion Clickable */}
                <div
                  onClick={() => setExpandedRemedyId(isExpanded ? null : remedy.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer bg-gradient-to-r from-transparent via-transparent to-[#F9FBF8]"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                      remedy.type === 'pest' ? "bg-[#FDEDEC] text-[#D9534F]" : "bg-[#FEF5E7] text-[#E67E22]"
                    }`}>
                      {remedy.type === 'pest' ? <Bug className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-sm sm:text-base text-[#1E3D1A]">
                          {language === 'te' && remedy.regionalName.te 
                            ? `${remedy.regionalName.te} (${remedy.problemName})`
                            : language === 'hi' && remedy.regionalName.hi
                            ? `${remedy.regionalName.hi} (${remedy.problemName})`
                            : remedy.problemName}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          remedy.type === 'pest' ? "bg-[#FDEDEC] text-[#C0392B]" : "bg-[#FEF5E7] text-[#D35400]"
                        }`}>
                          {remedy.type === 'pest' ? (language === 'te' ? 'పురుగు / కీటకం' : language === 'hi' ? 'कीट' : 'Pest') : (language === 'te' ? 'తెగులు / వ్యాధి' : language === 'hi' ? 'रोग' : 'Disease')}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-[#E8F0E5] text-[#2D5A27] rounded-full font-semibold">
                          {language === 'te' ? `దశ: ${remedy.stage}` : language === 'hi' ? `अवस्था: ${remedy.stage}` : `Stage: ${remedy.stage}`}
                        </span>
                      </div>

                      {/* Regional Names (Hindi / Telugu) */}
                      <p className="text-xs text-[#5C7A5C] font-semibold mt-1 flex flex-wrap gap-x-3">
                        <span>🇮🇳 <b>हिन्दी:</b> {remedy.regionalName.hi}</span>
                        <span>🌾 <b>తెలుగు:</b> {remedy.regionalName.te}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs font-bold text-[#2D5A27] hidden md:inline">
                      {isExpanded ? t("hideDetails") : t("viewSprayDosage")}
                    </span>
                    <div className={`w-7 h-7 rounded-full bg-[#E8F0E5] flex items-center justify-center text-[#2D5A27] transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 sm:px-6 pb-6 pt-2 border-t border-[#E8F0E5] space-y-4"
                    >
                      {/* Symptoms & Visual Identifiers */}
                      <div className="bg-[#F9FBF8] p-4 rounded-2xl border border-[#D0DBC7]">
                        <h4 className="text-xs font-black text-[#1E3D1A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-[#D9534F]" />
                          {t("symptomsTitle")}
                        </h4>
                        <ul className="space-y-1.5 text-xs text-[#3E5C3E]">
                          {remedy.symptoms.map((sym, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-2">
                              <span className="text-[#8BC34A] font-bold">•</span>
                              <span>{sym}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-[11px] font-bold text-[#2D5A27] mt-2.5 pt-2 border-t border-[#E0E7D9]">
                          🔍 <b>{t("keyIndicator")}</b> {remedy.visualIndicators}
                        </p>
                      </div>

                      {/* Chemical vs Organic Dual Remedy Box */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Chemical Spray & Tank Dosage */}
                        <div className="bg-[#FFFDF5] p-4 sm:p-5 rounded-2xl border border-[#FFE082] shadow-2xs">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-black text-[#8B6B00] uppercase tracking-wider flex items-center gap-1.5">
                              <FlaskConical className="w-4 h-4 text-[#E67E22]" />
                              {t("recommendedChemical")}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 bg-[#FFD700] text-[#1E3D1A] rounded-full font-black">
                              15L Tank Ready
                            </span>
                          </div>

                          <div className="space-y-2.5 text-xs">
                            <div>
                              <span className="text-[11px] text-[#7A6010] font-bold block">
                                {language === 'te' ? 'రసాయన మందు పేరు:' : language === 'hi' ? 'दवा व तकनीकी नाम:' : 'Chemical & Technical Name:'}
                              </span>
                              <p className="font-extrabold text-[#1E3D1A] text-sm">
                                {remedy.chemicalRemedy.activeIngredient}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-[#FFE599]">
                              <div>
                                <span className="text-[10px] text-[#7A6010] font-bold block">
                                  {language === 'te' ? '1 లీటర్ నీటికి:' : language === 'hi' ? 'प्रति 1 लीटर पानी:' : 'Per 1 Liter Water:'}
                                </span>
                                <span className="font-extrabold text-[#2D5A27]">{remedy.chemicalRemedy.perLiterDosage}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#7A6010] font-bold block">
                                  {language === 'te' ? '15 లీటర్ల ట్యాంకుకు:' : language === 'hi' ? 'प्रति 15 ली टंकी:' : 'Per 15L Knapsack Tank:'}
                                </span>
                                <span className="font-extrabold text-[#D9534F]">{remedy.chemicalRemedy.perPumpDosage}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-[#6B5200]">
                              <Clock className="w-3.5 h-3.5 text-[#E67E22] shrink-0" />
                              <span><b>{t("waitingPeriod")}</b> {remedy.chemicalRemedy.waitingPeriodDays} {language === 'te' ? 'రోజులు' : language === 'hi' ? 'दिन' : 'days'}</span>
                            </div>

                            <div className="p-2 bg-[#FFF8E1] rounded-lg text-[11px] text-[#7A5B00] border border-[#FFE082]">
                              ⚠️ <b>{t("safetyTip")}</b> {remedy.chemicalRemedy.safetyNote}
                            </div>
                          </div>
                        </div>

                        {/* Organic & Biological Alternative */}
                        <div className="bg-[#F4F9F1] p-4 sm:p-5 rounded-2xl border border-[#C5D5BD] shadow-2xs">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-black text-[#2D5A27] uppercase tracking-wider flex items-center gap-1.5">
                              <Leaf className="w-4 h-4 text-[#8BC34A]" />
                              {t("organicRemedy")}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 bg-[#8BC34A] text-white rounded-full font-black">
                              {language === 'te' ? 'రసాయన రహితం' : language === 'hi' ? 'रसायन मुक्त' : 'Zero Residue'}
                            </span>
                          </div>

                          <div className="space-y-2.5 text-xs">
                            <div>
                              <span className="text-[11px] text-[#4A6B45] font-bold block">{t("treatmentName")}</span>
                              <p className="font-extrabold text-[#1E3D1A] text-sm">
                                {remedy.organicRemedy.title}
                              </p>
                            </div>

                            <div className="bg-white p-2.5 rounded-xl border border-[#C5D5BD]">
                              <span className="text-[10px] text-[#4A6B45] font-bold block">{t("dosage")}</span>
                              <span className="font-bold text-[#2D5A27]">{remedy.organicRemedy.dosage}</span>
                            </div>

                            <p className="text-[11px] text-[#3E5C3E]">
                              📋 <b>{t("instructions")}</b> {remedy.organicRemedy.instructions}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Preventive Field Tips & Ask AI button */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                        <div className="text-xs text-[#5C7A5C]">
                          <span className="font-bold text-[#2D5A27]">🛡️ {t("prevention")} </span>
                          {remedy.preventiveTips.join(" ")}
                        </div>

                        {onSelectProblemForQuery && (
                          <button
                            onClick={() => onSelectProblemForQuery(selectedCrop.name.split(" ")[0], remedy.problemName)}
                            className="px-4 py-2 bg-[#2D5A27] hover:bg-[#1E3D1A] text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-2xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
                            {t("askAiAboutThis")}
                          </button>
                        )}
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

    </div>
  );
};

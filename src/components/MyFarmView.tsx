import React from "react";
import { 
  Sprout, 
  MapPin, 
  Layers, 
  Droplets, 
  Calendar, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Leaf,
  Plus,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { useAuth } from "../context/AuthContext.js";
import { useLanguage } from "../context/LanguageContext.js";
import { CottonPlantArtwork, TomatoPlantArtwork } from "./FarmIllustrations.js";

interface MyFarmViewProps {
  onOpenFarmModal: () => void;
  onAskAI: (query: string, crop: string) => void;
}

export const MyFarmView: React.FC<MyFarmViewProps> = ({
  onOpenFarmModal,
  onAskAI
}) => {
  const { farm, user } = useAuth();
  const { t } = useLanguage();

  const farmDetails = {
    state: farm?.state || "Maharashtra",
    district: farm?.district || "Aurangabad",
    village: farm?.village || "Shendra",
    size: farm?.farmSizeAcres || 4.5,
    crop: farm?.crop || "Cotton",
    soil: farm?.soilType || "Black Cotton Soil (Vertisol)",
    irrigation: farm?.irrigationSource || "Drip & Borewell",
    sowingDate: farm?.sowingDate || "2026-06-15"
  };

  return (
    <div id="my-farm-view" className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#EAE5DC] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚜</span>
            <h2 className="text-2xl font-black text-[#193B20] tracking-tight">
              {user?.name ? `${user.name.split(' ')[0]} - ${t('farmProfileTitle')}` : `Ramesh - ${t('farmProfileTitle')}`}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#6E8070] font-medium flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#2E7D32]" />
            <span>{farmDetails.village}, {farmDetails.district}, {farmDetails.state}</span>
          </p>
        </div>

        <button
          onClick={onOpenFarmModal}
          className="bg-[#256030] hover:bg-[#1B4B24] text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Edit3 className="w-4 h-4" />
          <span>{t('editFarmSetupBtn')}</span>
        </button>
      </div>

      {/* Grid of Farm Specifications */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#EAE5DC] shadow-2xs space-y-1">
          <span className="text-[11px] text-[#6E8070] font-bold uppercase tracking-wider block">{t('landAreaLabel')}</span>
          <div className="text-xl font-black text-[#193B20]">{farmDetails.size} {t('acres')}</div>
          <span className="text-[10px] text-[#2E7D32] font-semibold">{t('registeredPlot')}</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EAE5DC] shadow-2xs space-y-1">
          <span className="text-[11px] text-[#6E8070] font-bold uppercase tracking-wider block">{t('primaryCropLabel')}</span>
          <div className="text-xl font-black text-[#1E5E2B]">{farmDetails.crop}</div>
          <span className="text-[10px] text-[#2E7D32] font-semibold">{t('bollStage')}</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EAE5DC] shadow-2xs space-y-1">
          <span className="text-[11px] text-[#6E8070] font-bold uppercase tracking-wider block">{t('soilQualityLabel')}</span>
          <div className="text-sm font-black text-[#193B20] truncate">{farmDetails.soil}</div>
          <span className="text-[10px] text-[#6E8070] font-semibold">{t('soilMoistureRetention')}</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EAE5DC] shadow-2xs space-y-1">
          <span className="text-[11px] text-[#6E8070] font-bold uppercase tracking-wider block">{t('irrigationLabel')}</span>
          <div className="text-sm font-black text-[#193B20] truncate">{farmDetails.irrigation}</div>
          <span className="text-[10px] text-[#2E7D32] font-semibold">{t('microIrrigationActive')}</span>
        </div>
      </div>

      {/* Active Crop Parcels */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-[#193B20]">{t('activeCropsPlots')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Plot 1 */}
          <div className="bg-white rounded-[26px] p-5 border border-[#EAE5DC] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-36 h-36 rounded-2xl overflow-hidden shrink-0 border border-[#DCE8D8]">
              <CottonPlantArtwork className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black text-[#193B20]">{t('plotCotton')}</h4>
                <span className="text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full">
                  {t('healthyStatus')}
                </span>
              </div>
              <p className="text-xs text-[#6E8070]">
                {t('plotCottonDesc')}
              </p>
              
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => onAskAI("Optimal fertilizer booster for cotton square and boll stage", "Cotton")}
                  className="text-xs font-bold text-[#256030] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{t('fertilizerSchedule')}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Plot 2 */}
          <div className="bg-white rounded-[26px] p-5 border border-[#EAE5DC] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-36 h-36 rounded-2xl overflow-hidden shrink-0 border border-[#EAE0D8]">
              <TomatoPlantArtwork className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black text-[#193B20]">{t('plotTomato')}</h4>
                <span className="text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full">
                  {t('allClear')}
                </span>
              </div>
              <p className="text-xs text-[#6E8070]">
                {t('plotTomatoDesc')}
              </p>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => onAskAI("Best harvest timing and pest protection for tomato crop", "Tomato")}
                  className="text-xs font-bold text-[#256030] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{t('harvestGuidance')}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { motion } from "motion/react";
import { MapPin, Sprout, Layers, Droplets, Calendar, Sparkles, AlertCircle, PhoneCall } from "lucide-react";
import { useAuth } from "../context/AuthContext.js";

interface FarmProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FarmProfileModal: React.FC<FarmProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, farm, updateFarm, updatePhone } = useAuth();

  const [phone, setPhone] = useState(user?.phone || "");
  const [state, setState] = useState(farm?.state || "Andhra Pradesh");
  const [district, setDistrict] = useState(farm?.district || "Guntur");
  const [village, setVillage] = useState(farm?.village || "");
  const [farmSizeAcres, setFarmSizeAcres] = useState<number>(farm?.farmSizeAcres || 2.5);
  const [crop, setCrop] = useState(farm?.crop || "Paddy");
  const [sowingDate, setSowingDate] = useState(farm?.sowingDate || "");
  const [soilType, setSoilType] = useState(farm?.soilType || "Alluvial Black Soil");
  const [irrigationSource, setIrrigationSource] = useState(farm?.irrigationSource || "Canal / Borewell");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await updateFarm({
        state,
        district,
        village,
        farmSizeAcres: Number(farmSizeAcres),
        crop,
        sowingDate,
        soilType,
        irrigationSource
      });
      if (phone.trim() !== (user?.phone || "")) {
        await updatePhone(phone.trim());
      }
      onClose();
    } catch (err: any) {
      setSaveError(err.message || "Failed to update farm profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A2E1A]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-7 border-2 border-[#E0E7D9] shadow-2xl animate-fadeIn">
        <div className="flex items-start justify-between pb-3 border-b border-[#E0E7D9] mb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#1A2E1A] flex items-center gap-2">
              <Sprout className="w-5 h-5 text-[#2D5A27]" />
              Configure Farm Profile Context
            </h3>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              The AI advisory engine customizes chemical dosages and recommendations according to your location and crop size.
            </p>
          </div>
          <motion.button 
            onClick={onClose} 
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1 rounded-full cursor-pointer"
          >
            ✕
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {saveError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{saveError}</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1A2E1A] mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#1A2E1A] mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1A2E1A] mb-1">Village / Mandal</label>
              <input
                type="text"
                value={village}
                onChange={e => setVillage(e.target.value)}
                placeholder="e.g. Tenali"
                className="w-full p-2.5 rounded-xl border border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1A2E1A] mb-1">Farm Size (Acres)</label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={farmSizeAcres}
                onChange={e => setFarmSizeAcres(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1A2E1A] mb-1">Primary Crop</label>
              <select
                value={crop}
                onChange={e => setCrop(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:outline-none bg-white font-medium"
              >
                <option value="Paddy">Paddy (Rice)</option>
                <option value="Cotton">Cotton</option>
                <option value="Maize">Maize (Corn)</option>
                <option value="Groundnut">Groundnut (Peanut)</option>
                <option value="Chilli">Chilli</option>
                <option value="Tomato">Tomato</option>
                <option value="Banana">Banana</option>
                <option value="Mango">Mango</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1A2E1A] mb-1">Soil Type</label>
              <input
                type="text"
                value={soilType}
                onChange={e => setSoilType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1A2E1A] mb-1">Irrigation Source</label>
            <input
              type="text"
              value={irrigationSource}
              onChange={e => setIrrigationSource(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1A2E1A] mb-1 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-[#256030]" />
              Registered Mobile Number (for AI Voice Helpline)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98480 12345"
              className="w-full p-2.5 rounded-xl border border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold cursor-pointer"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={saving}
              whileHover={!saving ? { scale: 1.05, y: -1 } : {}}
              whileTap={!saving ? { scale: 0.95 } : {}}
              className="px-5 py-2 rounded-xl bg-[#2D5A27] hover:bg-[#1E3D1A] text-white font-black transition shadow-xs cursor-pointer"
            >
              {saving ? "Saving Profile..." : "Save Farm Profile"}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

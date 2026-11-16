import React, { useState } from "react";
import { motion } from "motion/react";
import { User, Lock, Mail, Phone, Sprout, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.js";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, demoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [crop, setCrop] = useState("Paddy");
  const [district, setDistrict] = useState("Guntur");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await register({
          name,
          email,
          password,
          phone,
          farm: { crop, district, state: "Andhra Pradesh" }
        });
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role: 'farmer' | 'admin') => {
    setLoading(true);
    try {
      await demoLogin(role);
      onClose();
    } catch (err: any) {
      setError(err.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A2E1A]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] max-w-md w-full p-6 sm:p-7 border-2 border-[#E0E7D9] shadow-2xl animate-fadeIn text-xs">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#E0E7D9] mb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#1A2E1A]">
              {isRegister ? "Create Farmer Account" : "Sign In to Agri-Sahayak AI"}
            </h3>
            <p className="text-stone-500 font-medium mt-0.5">
              {isRegister ? "Join to access personalized crop advisories and history" : "Sign in with your email or use one-click demo presets"}
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

        {/* Demo Fast Login Presets */}
        <div className="mb-4 p-3.5 bg-[#F1F8E9] border border-[#C5E1A5] rounded-2xl">
          <div className="font-black text-[#2D5A27] mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#2D5A27]" />
            <span>Instant Demo Presets</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <motion.button
              type="button"
              onClick={() => handleDemo('farmer')}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="p-2.5 bg-white hover:bg-[#E8F5E9] border border-[#C5E1A5] rounded-xl text-left transition font-semibold text-[#2D5A27] flex items-center justify-between cursor-pointer shadow-2xs"
            >
              <div className="truncate">
                <div className="font-bold text-xs">Ramesh Kumar</div>
                <div className="text-[10px] text-[#558B2F] font-normal">Farmer (Paddy, 2.5 Ac)</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#2D5A27] shrink-0" />
            </motion.button>

            <motion.button
              type="button"
              onClick={() => handleDemo('admin')}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="p-2.5 bg-white hover:bg-[#E8F5E9] border border-[#C5E1A5] rounded-xl text-left transition font-semibold text-[#2D5A27] flex items-center justify-between cursor-pointer shadow-2xs"
            >
              <div className="truncate">
                <div className="font-bold text-xs">Dr. K. Rao</div>
                <div className="text-[10px] text-[#558B2F] font-normal">KVK Agronomist</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#2D5A27] shrink-0" />
            </motion.button>
          </div>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#E0E7D9]"></div>
          <span className="flex-shrink mx-2 text-[10px] text-stone-400 uppercase font-bold">Or with Email</span>
          <div className="flex-grow border-t border-[#E0E7D9]"></div>
        </div>

        {error && (
          <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[11px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          {isRegister && (
            <div>
              <label className="block font-bold text-[#1A2E1A] mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Venkat Reddy"
                className="w-full p-2.5 rounded-xl border border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
                required
              />
            </div>
          )}

          <div>
            <label className="block font-bold text-[#1A2E1A] mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="farmer@example.com"
              className="w-full p-2.5 rounded-xl border border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-[#1A2E1A] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 rounded-xl border border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
              required
            />
          </div>

          {isRegister && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-[#1A2E1A] mb-1">Primary Crop</label>
                <select
                  value={crop}
                  onChange={e => setCrop(e.target.value)}
                  className="w-full p-2 rounded-xl border border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:outline-none bg-white font-medium"
                >
                  <option value="Paddy">Paddy</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Maize">Maize</option>
                  <option value="Groundnut">Groundnut</option>
                  <option value="Chilli">Chilli</option>
                  <option value="Tomato">Tomato</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#1A2E1A] mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  placeholder="Guntur"
                  className="w-full p-2 rounded-xl border border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
                />
              </div>
            </div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
            className="w-full mt-2 py-2.5 bg-[#2D5A27] hover:bg-[#1E3D1A] text-white font-black rounded-xl transition shadow-xs cursor-pointer"
          >
            {loading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}
          </motion.button>
        </form>

        <div className="mt-4 text-center">
          <motion.button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-[#2D5A27] hover:text-[#1E3D1A] font-bold transition cursor-pointer"
          >
            {isRegister ? "Already have an account? Sign In" : "Don't have an account? Register as Farmer"}
          </motion.button>
        </div>

      </div>
    </div>
  );
};

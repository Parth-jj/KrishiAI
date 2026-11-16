import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CloudSun, 
  CloudRain, 
  Sun, 
  Droplets, 
  Wind, 
  Thermometer, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Clock,
  Compass,
  Check,
  ChevronDown,
  ShieldAlert,
  Flame,
  Activity,
  Layers
} from "lucide-react";
import { WeatherData, LocationInfo } from "../types/index.js";
import { api } from "../services/api.js";
import { useLanguage } from "../context/LanguageContext.js";

interface WeatherCardProps {
  district?: string;
  state?: string;
  crop?: string;
  onLocationChange?: (location: LocationInfo) => void;
}

const POPULAR_AGRI_ZONES = [
  { name: "Guntur", district: "Guntur", state: "Andhra Pradesh", crop: "Chilli & Paddy" },
  { name: "Warangal", district: "Warangal", state: "Telangana", crop: "Cotton & Maize" },
  { name: "Thanjavur", district: "Thanjavur", state: "Tamil Nadu", crop: "Paddy" },
  { name: "Nashik", district: "Nashik", state: "Maharashtra", crop: "Onion & Grapes" },
  { name: "Bhatinda", district: "Bathinda", state: "Punjab", crop: "Wheat & Cotton" },
  { name: "Karnal", district: "Karnal", state: "Haryana", crop: "Basmati Rice" },
  { name: "Varanasi", district: "Varanasi", state: "Uttar Pradesh", crop: "Vegetables & Rice" },
  { name: "Cuttack", district: "Cuttack", state: "Odisha", crop: "Paddy" }
];

export const WeatherCard: React.FC<WeatherCardProps> = ({ 
  district: propDistrict, 
  state: propState, 
  crop,
  onLocationChange 
}) => {
  const { t } = useLanguage();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [gpsDetecting, setGpsDetecting] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Array<any>>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'hourly' | '7day' | 'advisory'>('overview');

  // Load initial weather based on farm profile or default
  useEffect(() => {
    fetchWeatherByDistrict(propDistrict || "Guntur", propState || "Andhra Pradesh");
  }, [propDistrict, propState]);

  async function fetchWeatherByDistrict(district: string, state: string) {
    setLoading(true);
    setGpsError(null);
    try {
      const data = await api.getWeather({ district, state });
      setWeather(data);
      if (onLocationChange && data.location) {
        onLocationChange(data.location);
      }
    } catch (err) {
      console.warn("Failed to load weather:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchWeatherByCoords(lat: number, lon: number) {
    setLoading(true);
    setGpsDetecting(true);
    setGpsError(null);
    try {
      const data = await api.getWeather({ lat, lon });
      setWeather(data);
      if (onLocationChange && data.location) {
        onLocationChange(data.location);
      }
    } catch (err) {
      console.warn("Failed to load GPS weather:", err);
      setGpsError("Failed to retrieve live weather for your coordinates. Using regional station.");
    } finally {
      setLoading(false);
      setGpsDetecting(false);
    }
  }

  // Real-time GPS Detection
  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    setGpsDetecting(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherByCoords(latitude, longitude);
      },
      (error) => {
        setGpsDetecting(false);
        let errorMsg = "Could not access GPS location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location permission was denied. You can select your district manually below.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Location information is currently unavailable.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "GPS request timed out. Retrying with default agricultural zone.";
        }
        setGpsError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Location search autocomplete
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api.searchLocations(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLocation = (loc: { name: string; district?: string; state: string; latitude?: number; longitude?: number }) => {
    setSearchOpen(false);
    setSearchQuery("");
    if (loc.latitude && loc.longitude) {
      fetchWeatherByCoords(loc.latitude, loc.longitude);
    } else {
      fetchWeatherByDistrict(loc.district || loc.name, loc.state);
    }
  };

  const getWeatherIcon = (iconName: string, isDay: boolean = true) => {
    switch (iconName) {
      case "sun":
        return <Sun className="w-8 h-8 text-[#FFD700] animate-pulse" />;
      case "cloud-sun":
        return <CloudSun className="w-8 h-8 text-[#F2C94C]" />;
      case "cloud-rain":
      case "cloud-rain-heavy":
      case "cloud-drizzle":
        return <CloudRain className="w-8 h-8 text-[#0288D1]" />;
      default:
        return <CloudSun className="w-8 h-8 text-[#2D5A27]" />;
    }
  };

  if (loading && !weather) {
    return (
      <div id="weather-card-loading" className="bg-white rounded-[28px] border-2 border-[#E0E7D9] p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E0E7D9]">
          <div className="h-6 bg-[#E0E7D9] rounded-md w-1/3"></div>
          <div className="h-6 bg-[#E0E7D9] rounded-full w-24"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="h-20 bg-[#F1F8E9] rounded-2xl"></div>
          <div className="h-20 bg-[#E1F5FE] rounded-2xl"></div>
          <div className="h-20 bg-[#E8F5E9] rounded-2xl"></div>
          <div className="h-20 bg-[#F3E5F5] rounded-2xl"></div>
        </div>
        <div className="h-24 bg-stone-100 rounded-2xl"></div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div id="weather-card" className="bg-white rounded-[28px] border-2 border-[#E0E7D9] p-5 sm:p-6 shadow-sm overflow-hidden relative">
      
      {/* Top Bar: Location Title, GPS Detection & Manual Search Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E0E7D9]">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2D5A27] text-[#FFD700] flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
            ☀️
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-[#1A2E1A] flex items-center gap-1.5">
                <span>{weather.location.name || weather.location.district}</span>
                {weather.location.state && (
                  <span className="text-xs font-semibold text-stone-500">
                    ({weather.location.state})
                  </span>
                )}
              </h3>

              {weather.location.isLiveGps ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E8F5E9] text-[#2D5A27] border border-[#A5D6A7] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-ping"></span>
                  Live GPS
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                  Agro-Met Station
                </span>
              )}
            </div>

            <p className="text-[11px] text-[#558B2F] font-semibold mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#2D5A27]" />
              Updated: {weather.current.lastUpdated || "Live"} • Ground Station Data (Open-Meteo & IMD)
            </p>
          </div>
        </div>

        {/* Location Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live GPS Button */}
          <motion.button
            onClick={handleDetectLiveLocation}
            disabled={gpsDetecting}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3.5 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
              weather.location.isLiveGps
                ? 'bg-[#2D5A27] text-[#FFD700]'
                : 'bg-[#F1F8E9] hover:bg-[#E8F5E9] text-[#2D5A27] border border-[#C5E1A5]'
            }`}
            title="Use device GPS to get precise micro-climate data"
          >
            <Navigation className={`w-3.5 h-3.5 ${gpsDetecting ? 'animate-spin' : ''}`} />
            <span>{gpsDetecting ? "Locating..." : "Detect Live GPS"}</span>
          </motion.button>

          {/* Search / Change District Button */}
          <motion.button
            onClick={() => setSearchOpen(!searchOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3.5 py-2 rounded-full text-xs font-black bg-stone-100 hover:bg-stone-200 text-[#1A2E1A] border border-stone-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-[#2D5A27]" />
            <span>Change Zone</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${searchOpen ? 'rotate-180' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* GPS Error or Status Notification */}
      {gpsError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs text-amber-900 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Search / Zone Switcher Dropdown Drawer */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-[#F8FAF6] border-2 border-[#D8E2D0] rounded-2xl overflow-hidden"
          >
            <div className="mb-3">
              <label className="block text-xs font-extrabold text-[#1A2E1A] mb-1.5">
                Search Any City, District or Village in India:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Guntur, Warangal, Nashik, Karnal, Thanjavur..."
                  className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-[#C5E1A5] text-xs focus:ring-2 focus:ring-[#8BC34A] focus:outline-none font-medium"
                  autoFocus
                />
                {searching && (
                  <RefreshCw className="w-3.5 h-3.5 absolute right-3 top-3 text-[#2D5A27] animate-spin" />
                )}
              </div>
            </div>

            {/* Autocomplete Search Results */}
            {searchResults.length > 0 && (
              <div className="mb-3 max-h-44 overflow-y-auto space-y-1 pr-1">
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectLocation(res)}
                    className="w-full text-left px-3 py-2 bg-white hover:bg-[#E8F5E9] rounded-xl border border-stone-200 text-xs font-semibold text-[#1A2E1A] flex items-center justify-between transition cursor-pointer"
                  >
                    <div>
                      <span className="font-bold">{res.name}</span>
                      <span className="text-stone-500 ml-1.5 text-[11px]">
                        ({res.district ? `${res.district}, ` : ''}{res.state}, {res.country})
                      </span>
                    </div>
                    <span className="text-[10px] text-[#2D5A27] font-bold">Select ➔</span>
                  </button>
                ))}
              </div>
            )}

            {/* Popular Agricultural Hubs Shortcuts */}
            <div>
              <div className="text-[11px] font-extrabold text-stone-500 uppercase tracking-wider mb-2">
                Popular Agricultural Hubs:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_AGRI_ZONES.map((zone, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectLocation(zone)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                      weather.location.district.toLowerCase() === zone.name.toLowerCase()
                        ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
                        : 'bg-white hover:bg-[#E8F5E9] text-[#2D5A27] border-[#C5E1A5]'
                    }`}
                  >
                    <span>{zone.name}</span>
                    <span className="text-[10px] opacity-75 ml-1">({zone.crop})</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Meteorological Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        
        {/* Temperature */}
        <div className="bg-[#FFF9C4]/40 border border-[#FFE082] rounded-2xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#FFF9C4] text-[#F57F17] shrink-0">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wider">Temperature</div>
            <div className="text-2xl font-black text-[#1A2E1A] leading-tight">
              {weather.current.tempC}°C
            </div>
            {weather.current.feelsLikeC && (
              <div className="text-[10px] text-stone-500 font-medium">
                Feels like {weather.current.feelsLikeC}°C
              </div>
            )}
          </div>
        </div>

        {/* Relative Humidity & Soil Moisture */}
        <div className="bg-[#E1F5FE]/50 border border-[#B3E5FC] rounded-2xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E1F5FE] text-[#0288D1] shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wider">Humidity</div>
            <div className="text-2xl font-black text-[#01579B] leading-tight">
              {weather.current.humidityPct}%
            </div>
            <div className="text-[10px] text-[#0277BD] font-medium">
              Soil Est: {weather.current.soilMoisturePct || 50}%
            </div>
          </div>
        </div>

        {/* Rain Probability & Volume */}
        <div className="bg-[#E8F5E9]/60 border border-[#C8E6C9] rounded-2xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E8F5E9] text-[#2E7D32] shrink-0">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wider">Rain Probability</div>
            <div className="text-2xl font-black text-[#1B5E20] leading-tight">
              {weather.current.rainProbabilityPct}%
            </div>
            <div className="text-[10px] text-[#2E7D32] font-medium">
              {weather.current.precipitationMm !== undefined ? `${weather.current.precipitationMm} mm volume` : 'Minimal rain'}
            </div>
          </div>
        </div>

        {/* Wind Speed & Direction */}
        <div className="bg-[#F3E5F5]/50 border border-[#E1BEE7] rounded-2xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#F3E5F5] text-[#7B1FA2] shrink-0">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wider">Wind Speed</div>
            <div className="text-2xl font-black text-[#4A148C] leading-tight">
              {weather.current.windSpeedKmh} <span className="text-xs font-bold">km/h</span>
            </div>
            <div className="text-[10px] text-[#7B1FA2] font-medium">
              Gusts: {weather.current.windGustsKmh || weather.current.windSpeedKmh} km/h
            </div>
          </div>
        </div>

      </div>

      {/* Weather View Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-[#E0E7D9] pb-2.5 mb-4 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-[#2D5A27] text-white shadow-xs'
              : 'text-[#2D5A27] hover:bg-[#E8F5E9]'
          }`}
        >
          ICAR Agro-Advisories
        </button>

        {weather.hourly && weather.hourly.length > 0 && (
          <button
            onClick={() => setActiveTab('hourly')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'hourly'
                ? 'bg-[#2D5A27] text-white shadow-xs'
                : 'text-[#2D5A27] hover:bg-[#E8F5E9]'
            }`}
          >
            12-Hour Micro Forecast
          </button>
        )}

        <button
          onClick={() => setActiveTab('7day')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
            activeTab === '7day'
              ? 'bg-[#2D5A27] text-white shadow-xs'
              : 'text-[#2D5A27] hover:bg-[#E8F5E9]'
          }`}
        >
          7-Day Farming Outlook
        </button>
      </div>

      {/* TAB CONTENT 1: ICAR Agro-Advisories */}
      {activeTab === 'overview' && (
        <motion.div 
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs"
        >
          {/* Chemical Spray Window */}
          <div className="bg-[#F1F8E9] rounded-2xl p-4 border border-[#C5E1A5] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-[#2D5A27] flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-[#8BC34A]" />
                  Foliar Spraying Window
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                  weather.agriculturalAdvice.sprayCondition === 'Optimal'
                    ? 'bg-[#2E7D32] text-white'
                    : weather.agriculturalAdvice.sprayCondition === 'Caution'
                    ? 'bg-[#F57F17] text-white'
                    : 'bg-[#D32F2F] text-white'
                }`}>
                  {weather.agriculturalAdvice.sprayCondition}
                </span>
              </div>
              <p className="text-[#1A2E1A] leading-relaxed font-medium mb-2">
                {weather.agriculturalAdvice.sprayNote}
              </p>
            </div>
            {weather.agriculturalAdvice.sprayWindow && (
              <div className="mt-2 pt-2 border-t border-[#C5E1A5] text-[11px] font-bold text-[#2D5A27]">
                Best Time: {weather.agriculturalAdvice.sprayWindow}
              </div>
            )}
          </div>

          {/* Irrigation & Soil Moisture */}
          <div className="bg-[#E1F5FE]/60 rounded-2xl p-4 border border-[#B3E5FC] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-[#0277BD] flex items-center gap-1.5 text-xs">
                  <Droplets className="w-4 h-4 text-[#0288D1]" />
                  Irrigation Strategy
                </span>
                {weather.agriculturalAdvice.irrigationUrgency && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#0288D1] text-white">
                    {weather.agriculturalAdvice.irrigationUrgency}
                  </span>
                )}
              </div>
              <p className="text-[#1A2E1A] leading-relaxed font-medium mb-2">
                {weather.agriculturalAdvice.irrigationAdvice}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-[#B3E5FC] text-[11px] font-bold text-[#01579B]">
              UV Index: {weather.current.uvIndex || 7.0} • Solar Evaporation Rate: Normal
            </div>
          </div>

          {/* Disease & Fungal Warning */}
          <div className="bg-[#FFF3E0] rounded-2xl p-4 border border-[#FFE0B2] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-[#E65100] flex items-center gap-1.5 text-xs">
                  <ShieldAlert className="w-4 h-4 text-[#F57F17]" />
                  Disease & Pest Risk Alert
                </span>
                {weather.agriculturalAdvice.diseaseRiskLevel && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    weather.agriculturalAdvice.diseaseRiskLevel === 'Severe'
                      ? 'bg-rose-600 text-white'
                      : weather.agriculturalAdvice.diseaseRiskLevel === 'Moderate'
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {weather.agriculturalAdvice.diseaseRiskLevel} Risk
                  </span>
                )}
              </div>
              <p className="text-[#1A2E1A] leading-relaxed font-medium mb-2">
                {weather.agriculturalAdvice.diseaseRiskAlert}
              </p>
            </div>
            {weather.agriculturalAdvice.fieldWorkCondition && (
              <div className="mt-2 pt-2 border-t border-[#FFE0B2] text-[11px] font-bold text-[#BF360C]">
                🚜 {weather.agriculturalAdvice.fieldWorkCondition}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT 2: 12-Hour Micro Forecast */}
      {activeTab === 'hourly' && weather.hourly && (
        <motion.div 
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-x-auto pb-2"
        >
          <div className="flex gap-2.5 min-w-max">
            {weather.hourly.map((h, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between w-24 shrink-0 transition ${
                  idx === 0 
                    ? 'bg-[#2D5A27] text-white border-[#2D5A27]' 
                    : 'bg-[#F8FAF6] hover:bg-white border-[#E0E7D9] text-[#1A2E1A]'
                }`}
              >
                <div className={`text-xs font-black ${idx === 0 ? 'text-[#FFD700]' : 'text-[#2D5A27]'}`}>
                  {h.hour}
                </div>
                
                <div className="my-2">
                  <div className="text-lg font-black">{h.tempC}°</div>
                  <div className="text-[10px] font-semibold opacity-85 truncate max-w-[80px]">
                    {h.condition}
                  </div>
                </div>

                <div className="space-y-1 w-full text-[10px]">
                  <div className={`flex items-center justify-center gap-1 font-bold ${
                    h.rainProbabilityPct > 30 ? (idx === 0 ? 'text-amber-300' : 'text-blue-600') : 'opacity-70'
                  }`}>
                    <CloudRain className="w-3 h-3" />
                    <span>{h.rainProbabilityPct}%</span>
                  </div>
                  <div className="opacity-70 flex items-center justify-center gap-1">
                    <Wind className="w-3 h-3" />
                    <span>{h.windSpeedKmh}k</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT 3: 7-Day Farming Outlook */}
      {activeTab === '7day' && (
        <motion.div 
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2"
        >
          {weather.forecast.map((d, idx) => (
            <div 
              key={idx}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-between text-center transition ${
                idx === 0
                  ? 'bg-[#E8F5E9] border-[#A5D6A7]'
                  : 'bg-[#F8FAF6] border-[#E0E7D9]'
              }`}
            >
              <div className="text-xs font-black text-[#2D5A27]">
                {d.day}
              </div>
              <div className="text-[10px] text-stone-500 font-medium mb-1">
                {d.date.split('-').slice(1).join('/')}
              </div>

              <div className="my-1.5">
                <div className="text-sm font-black text-[#1A2E1A]">
                  {d.tempMax}° / <span className="text-stone-500 text-xs font-semibold">{d.tempMin}°</span>
                </div>
                <div className="text-[10px] text-stone-600 font-medium truncate max-w-[90px]">
                  {d.condition}
                </div>
              </div>

              <div className="w-full pt-1.5 border-t border-stone-200 space-y-0.5 text-[10px]">
                <div className="flex items-center justify-center gap-1 font-bold text-blue-700">
                  <CloudRain className="w-3 h-3" />
                  <span>{d.rainProbability}%</span>
                </div>
                {d.precipitationMm > 0 && (
                  <div className="text-[9px] text-stone-500 font-medium">
                    {d.precipitationMm} mm
                  </div>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}

    </div>
  );
};

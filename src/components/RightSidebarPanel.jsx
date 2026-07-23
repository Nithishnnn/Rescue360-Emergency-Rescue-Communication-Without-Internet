import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  CloudSnow, 
  CloudFog, 
  CloudDrizzle,
  Thermometer, 
  Wind, 
  Eye, 
  Droplets, 
  Sunrise, 
  Sunset, 
  MapPin, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  X,
  Moon,
  TrendingUp,
  Compass,
  ShieldAlert,
  Wifi,
  Signal,
  Cpu,
  Activity,
  Heart,
  ShieldAlert as AlertIcon
} from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import NearestResponseUnits from './NearestResponseUnits';
import LiveResponseStatus from './LiveResponseStatus';

const getWeatherInfo = (code) => {
  switch (code) {
    case 0:
      return { label: 'Sunny', icon: Sun, color: 'text-yellow-400', glow: 'shadow-[0_0_15px_rgba(250,204,21,0.4)]' };
    case 1:
    case 2:
    case 3:
      return { label: 'Cloudy', icon: Cloud, color: 'text-gray-300', glow: 'shadow-[0_0_15px_rgba(156,163,175,0.4)]' };
    case 45:
    case 48:
      return { label: 'Foggy', icon: CloudFog, color: 'text-blue-300', glow: 'shadow-[0_0_15px_rgba(147,197,253,0.4)]' };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { label: 'Drizzle', icon: CloudDrizzle, color: 'text-teal-300', glow: 'shadow-[0_0_15px_rgba(115,237,215,0.4)]' };
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return { label: 'Rainy', icon: CloudRain, color: 'text-neonCyan', glow: 'shadow-[0_0_15px_rgba(0,242,255,0.4)]' };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { label: 'Snowy', icon: CloudSnow, color: 'text-pink-300', glow: 'shadow-[0_0_15px_rgba(244,114,182,0.4)]' };
    case 95:
    case 96:
    case 99:
      return { label: 'Storm', icon: CloudLightning, color: 'text-neonRed', glow: 'shadow-[0_0_15px_rgba(255,0,85,0.4)]' };
    default:
      return { label: 'Cloudy', icon: Cloud, color: 'text-gray-300', glow: 'shadow-[0_0_15px_rgba(156,163,175,0.4)]' };
  }
};

const getMoonPhase = (date) => {
  const referenceDate = new Date(2000, 0, 6, 18, 14, 0);
  const diff = date - referenceDate;
  const cycle = 29.530588853 * 24 * 60 * 60 * 1000;
  const phase = (diff % cycle) / cycle;
  if (phase < 0.06 || phase > 0.94) return 'New Moon';
  if (phase < 0.19) return 'Waxing Crescent';
  if (phase < 0.31) return 'First Quarter';
  if (phase < 0.44) return 'Waxing Gibbous';
  if (phase < 0.56) return 'Full Moon';
  if (phase < 0.69) return 'Waning Gibbous';
  if (phase < 0.81) return 'Third Quarter';
  return 'Waning Crescent';
};

const getAlertSeverity = (current, weatherCode) => {
  const wind = current.wind_speed_10m || 0;
  const rain = current.precipitation || 0;
  const visibilityKm = (current.visibility || 10000) / 1000;
  const isStorm = [95, 96, 99].includes(weatherCode);

  if (isStorm || wind > 50 || visibilityKm < 1) return 'RED';
  if (rain > 5 || (wind > 30 && wind <= 50)) return 'ORANGE';
  if ((rain > 0 && rain <= 5) || visibilityKm < 5) return 'YELLOW';
  return 'GREEN';
};

const formatTime = (isoString) => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '—';
  }
};

const RightSidebarPanel = () => {
  const { 
    alerts, 
    focusedAlertId, 
    mapCenter, 
    setFocusedAlertId,
    weatherData: weather,
    weatherAqi,
    weatherLoading: loading,
    weatherError: error,
    weatherLocationName: locationName,
    weatherLastUpdated: lastUpdated,
    systemLiveStatus,
    stats,
    settings,
    fetchWeatherForCoordinates,
    activeWeatherCoords,
    clearCustomFocus
  } = useAlert();

  const selectedAlert = alerts.find(a => a.id === focusedAlertId) || alerts[0];
  let lat, lng;
  if (activeWeatherCoords) {
    lat = activeWeatherCoords.lat;
    lng = activeWeatherCoords.lng;
  } else {
    lat = selectedAlert && selectedAlert.latitude ? Number(selectedAlert.latitude) : mapCenter.lat;
    lng = selectedAlert && selectedAlert.longitude ? Number(selectedAlert.longitude) : mapCenter.lng;
  }

  const activeLat = Number(lat) || 13.0827;
  const activeLng = Number(lng) || 80.2707;

  const handleManualRefresh = () => {
    fetchWeatherForCoordinates(activeLat, activeLng, true);
  };

  const handleClearFocus = () => {
    setFocusedAlertId(null);
  };

  // Weather calculations
  const current = weather?.current || {};
  const weatherCode = current.weather_code ?? 0;
  const condition = getWeatherInfo(weatherCode);
  const ConditionIcon = condition.icon;
  const severity = getAlertSeverity(current, weatherCode);

  const getAlertStyles = (level) => {
    switch (level) {
      case 'RED':
        return { text: 'CRITICAL WARNING', color: 'text-neonRed', badge: 'bg-neonRed/10 border-neonRed/30 text-neonRed' };
      case 'ORANGE':
        return { text: 'MODERATE ALERT', color: 'text-orange-400', badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400' };
      case 'YELLOW':
        return { text: 'WEATHER ADVISORY', color: 'text-yellow-400', badge: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' };
      case 'GREEN':
      default:
        return { text: 'SAFE CONDITIONS', color: 'text-neonGreen', badge: 'bg-neonGreen/10 border-neonGreen/30 text-neonGreen' };
    }
  };

  const alertStyle = getAlertStyles(severity);

  // AQI color logic
  const getAqiColor = (aqi) => {
    if (aqi === null || aqi === undefined) return 'text-gray-400';
    if (aqi <= 50) return 'text-neonGreen';
    if (aqi <= 100) return 'text-yellow-400';
    if (aqi <= 150) return 'text-orange-400';
    return 'text-neonRed animate-pulse';
  };

  // Emergency status calculations
  const activeAlertsCount = stats.active || 0;
  const riskLevel = activeAlertsCount > 5 ? 'CRITICAL' : activeAlertsCount > 0 ? 'HIGH' : 'NORMAL';
  const rescueStatus = activeAlertsCount > 0 ? 'ACTIVE RESPONSE' : 'STANDBY';

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'text-neonRed font-black';
      case 'HIGH': return 'text-orange-400 font-bold';
      case 'NORMAL':
      default: return 'text-neonGreen font-semibold';
    }
  };

  return (
    <div className="glass-card p-5 h-full flex flex-col justify-between overflow-hidden relative border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.65)] select-none">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="text-neonCyan animate-pulse drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" size={18} />
          <h2 className="text-sm font-black tracking-widest text-white uppercase">COMMAND INTEL STATION</h2>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="text-neonCyan shrink-0"
            >
              <RefreshCw size={12} />
            </motion.div>
          )}
          <button 
            onClick={handleManualRefresh}
            disabled={loading}
            className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-colors"
            title="Refresh intel feeds"
          >
            <RefreshCw size={11} className={loading ? 'opacity-0' : ''} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.div 
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neonRed font-black uppercase text-xs tracking-wider"
          >
            <AlertTriangle size={32} className="mb-2 animate-bounce text-neonRed" />
            WEATHER FEEDS OFFLINE
          </motion.div>
        ) : !weather ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 space-y-3"
          >
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 border-2 border-neonCyan/20 rounded-full"></div>
              <div className="absolute inset-0 border-t-2 border-neonCyan rounded-full animate-spin"></div>
            </div>
            <p className="text-[9px] uppercase font-black tracking-widest text-neonCyan animate-pulse-slow">
              SYNCING INTEL SOURCE...
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="data"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4 my-3 text-xs"
          >
            {/* Header: Node identification */}
            <div className="flex items-center justify-between p-2.5 bg-white/5 border border-white/5 rounded-xl shrink-0">
              <div className="flex items-center gap-2 truncate pr-2">
                <MapPin size={13} className="text-neonCyan shrink-0" />
                <div className="truncate">
                  <p className="text-[7.5px] text-gray-500 uppercase font-black tracking-wider leading-none">FOCUS NODE POSITION</p>
                  <p className="text-[11px] font-bold text-white truncate mt-0.5" title={locationName}>
                    {locationName || '--'}
                  </p>
                </div>
              </div>
              
              {activeWeatherCoords?.isCustom ? (
                <button
                  onClick={clearCustomFocus}
                  className="flex items-center gap-1 py-0.5 px-2 bg-neonCyan/15 border border-neonCyan/35 hover:bg-neonRed/20 text-neonCyan hover:text-white rounded-md transition-all text-[7.5px] font-black uppercase tracking-wider shrink-0"
                  title="Clear target location focus"
                >
                  <span>SIGNAL POINT</span>
                  <X size={8} />
                </button>
              ) : focusedAlertId ? (
                <button
                  onClick={handleClearFocus}
                  className="flex items-center gap-1 py-0.5 px-2 bg-neonRed/15 border border-neonRed/35 hover:bg-neonRed/25 text-neonRed hover:text-white rounded-md transition-all text-[7.5px] font-black uppercase tracking-wider shrink-0"
                  title="Clear marker focus"
                >
                  <span>SOS: {selectedAlert.user_name || 'Active'}</span>
                  <X size={8} />
                </button>
              ) : (
                <span className="py-0.5 px-2 bg-neonCyan/15 border border-neonCyan/35 text-neonCyan rounded-md text-[7.5px] font-black uppercase tracking-wider shrink-0">
                  MAP CENTER
                </span>
              )}
            </div>

            {/* Section 1: LIVE WEATHER CONDITIONS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-gray-500 uppercase font-black tracking-[0.2em] block">I. LIVE WEATHER CONDITIONS</span>
                <span className="text-[8.5px] font-bold text-white flex items-center gap-1">
                  <ConditionIcon className={`${condition.color} animate-pulse`} size={11} />
                  {condition.label}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Temp */}
                <div className="bg-[#0c0c12]/60 border border-white/5 p-2 rounded-xl flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 shrink-0">
                    <Thermometer size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[7px] text-gray-500 uppercase font-black tracking-wider leading-none">Temperature</p>
                    <p className="text-[11px] font-black text-white font-mono mt-0.5">
                      {current.temperature_2m !== undefined ? `${current.temperature_2m.toFixed(1)}` : '--'}°C
                    </p>
                  </div>
                </div>

                {/* Feels Like */}
                <div className="bg-[#0c0c12]/60 border border-white/5 p-2 rounded-xl flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 shrink-0">
                    <Thermometer size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[7px] text-gray-500 uppercase font-black tracking-wider leading-none">Feels Like</p>
                    <p className="text-[11px] font-black text-white font-mono mt-0.5">
                      {current.apparent_temperature !== undefined ? `${current.apparent_temperature.toFixed(1)}` : '--'}°C
                    </p>
                  </div>
                </div>

                {/* Humidity */}
                <div className="bg-[#0c0c12]/60 border border-white/5 p-2 rounded-xl flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-neonCyan/10 text-neonCyan shrink-0">
                    <Droplets size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[7px] text-gray-500 uppercase font-black tracking-wider leading-none">Humidity</p>
                    <p className="text-[11px] font-black text-white font-mono mt-0.5">
                      {current.relative_humidity_2m !== undefined ? `${current.relative_humidity_2m}` : '--'}%
                    </p>
                  </div>
                </div>

                {/* Wind Speed */}
                <div className="bg-[#0c0c12]/60 border border-white/5 p-2 rounded-xl flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
                    <Wind size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[7px] text-gray-500 uppercase font-black tracking-wider leading-none">Wind Speed</p>
                    <p className="text-[11px] font-black text-white font-mono mt-0.5">
                      {current.wind_speed_10m !== undefined ? `${current.wind_speed_10m}` : '--'} km/h
                    </p>
                  </div>
                </div>

                {/* Visibility */}
                <div className="bg-[#0c0c12]/60 border border-white/5 p-2 rounded-xl flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                    <Eye size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[7px] text-gray-500 uppercase font-black tracking-wider leading-none">Visibility</p>
                    <p className="text-[11px] font-black text-white font-mono mt-0.5">
                      {current.visibility !== undefined ? (current.visibility / 1000).toFixed(1) : '--'} km
                    </p>
                  </div>
                </div>

                {/* Pressure */}
                <div className="bg-[#0c0c12]/60 border border-white/5 p-2 rounded-xl flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                    <Compass size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[7px] text-gray-500 uppercase font-black tracking-wider leading-none">Pressure</p>
                    <p className="text-[11px] font-black text-white font-mono mt-0.5">
                      {current.pressure_msl !== undefined ? `${current.pressure_msl.toFixed(0)}` : '--'} hPa
                    </p>
                  </div>
                </div>

                {/* Rainfall */}
                <div className="bg-[#0c0c12]/60 border border-white/5 p-2 rounded-xl flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                    <CloudRain size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[7px] text-gray-500 uppercase font-black tracking-wider leading-none">Precipitation</p>
                    <p className="text-[11px] font-black text-white font-mono mt-0.5">
                      {current.precipitation !== undefined ? `${current.precipitation}` : '0'} mm
                    </p>
                  </div>
                </div>

                {/* UV Index */}
                <div className="bg-[#0c0c12]/60 border border-white/5 p-2 rounded-xl flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 shrink-0">
                    <Sun size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[7px] text-gray-500 uppercase font-black tracking-wider leading-none">UV Index</p>
                    <p className="text-[11px] font-black text-white font-mono mt-0.5">
                      {current.uv_index !== undefined ? `${current.uv_index.toFixed(1)}` : '--'}
                    </p>
                  </div>
                </div>

                {/* Cloud Cover */}
                <div className="bg-[#0c0c12]/60 border border-white/5 p-2 rounded-xl flex items-center gap-2 col-span-2">
                  <div className="p-1.5 rounded-lg bg-gray-500/10 text-gray-400 shrink-0">
                    <Cloud size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[7px] text-gray-500 uppercase font-black tracking-wider leading-none">Cloud Cover</p>
                    <p className="text-[11px] font-black text-white font-mono mt-0.5">
                      {current.cloud_cover !== undefined ? `${current.cloud_cover}%` : '--'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: LIVE SENSOR STATUS */}
            <div className="space-y-2">
              <span className="text-[8px] text-gray-500 uppercase font-black tracking-[0.2em] block">II. LIVE SENSOR STATUS</span>
              <div className="bg-[#0c0c12]/60 border border-white/5 p-3 rounded-xl space-y-2">
                {/* GPS Status */}
                <div className="flex justify-between items-center text-[10px] pb-1.5 border-b border-white/5">
                  <span className="text-gray-500 font-medium">GPS Status</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-neonCyan animate-pulse shadow-neon-cyan"></div>
                    ACTIVE NOMINAL
                  </span>
                </div>
                {/* Network Signal */}
                <div className="flex justify-between items-center text-[10px] pb-1.5 border-b border-white/5">
                  <span className="text-gray-500 font-medium">Network Signal</span>
                  <span className="font-mono text-neonCyan font-bold">
                    {selectedAlert?.signal_strength ? `-${100 - selectedAlert.signal_strength} dB` : '-43 dB'}
                  </span>
                </div>
                {/* Receiver Health */}
                <div className="flex justify-between items-center text-[10px] pb-1.5 border-b border-white/5">
                  <span className="text-gray-500 font-medium">Receiver Health</span>
                  <span className="font-bold text-neonGreen font-mono uppercase tracking-wider text-[9px]">
                    NOMINAL
                  </span>
                </div>
                {/* Last Update Time */}
                <div className="flex justify-between items-center text-[10px] pb-1.5 border-b border-white/5">
                  <span className="text-gray-500 font-medium">Last Update Time</span>
                  <span className="font-mono text-white text-[9px]">{lastUpdated || '--'}</span>
                </div>
                {/* Data Sync Status */}
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-500 font-medium">Data Sync Status</span>
                  <span className="text-neonCyan font-bold text-[9.5px]">
                    {settings.autoRefresh === 'off' ? 'REALTIME ONLY' : `AUTO INTERVAL (${settings.autoRefresh}s)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: LIVE ENVIRONMENT */}
            <div className="space-y-2">
              <span className="text-[8px] text-gray-500 uppercase font-black tracking-[0.2em] block">III. LIVE ENVIRONMENT</span>
              <div className="bg-[#0c0c12]/60 border border-white/5 p-3 rounded-xl grid grid-cols-2 gap-y-2.5 gap-x-4">
                {/* AQI */}
                <div className="flex flex-col">
                  <span className="text-[7.5px] text-gray-500 uppercase font-black tracking-wider leading-none">AQI (US)</span>
                  <span className={`text-[12px] font-black font-mono mt-1 ${getAqiColor(weatherAqi)}`}>
                    {weatherAqi !== null && weatherAqi !== undefined ? `${weatherAqi} US` : '--'}
                  </span>
                </div>
                {/* Moon Phase */}
                <div className="flex flex-col">
                  <span className="text-[7.5px] text-gray-500 uppercase font-black tracking-wider leading-none">Moon Phase</span>
                  <span className="text-[11px] font-bold text-white mt-1 truncate">
                    {getMoonPhase(new Date())}
                  </span>
                </div>
                {/* Sunrise */}
                <div className="flex flex-col border-t border-white/5 pt-2">
                  <span className="text-[7.5px] text-gray-500 uppercase font-black tracking-wider leading-none">Sunrise</span>
                  <span className="text-[11px] font-black text-white font-mono mt-1">
                    {weather?.daily?.sunrise?.[0] ? formatTime(weather.daily.sunrise[0]) : '--'}
                  </span>
                </div>
                {/* Sunset */}
                <div className="flex flex-col border-t border-white/5 pt-2">
                  <span className="text-[7.5px] text-gray-500 uppercase font-black tracking-wider leading-none">Sunset</span>
                  <span className="text-[11px] font-black text-white font-mono mt-1">
                    {weather?.daily?.sunset?.[0] ? formatTime(weather.daily.sunset[0]) : '--'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4: EMERGENCY STATUS */}
            <div className="space-y-2">
              <span className="text-[8px] text-gray-500 uppercase font-black tracking-[0.2em] block">IV. EMERGENCY STATUS</span>
              <div className="bg-[#0c0c12]/60 border border-white/5 p-3 rounded-xl space-y-2">
                {/* Risk Level */}
                <div className="flex justify-between items-center text-[10px] pb-1.5 border-b border-white/5">
                  <span className="text-gray-500 font-medium">Risk Level</span>
                  <span className={`text-[10px] tracking-wide ${getRiskColor(riskLevel)}`}>
                    {riskLevel}
                  </span>
                </div>
                {/* Rescue Status */}
                <div className="flex justify-between items-center text-[10px] pb-1.5 border-b border-white/5">
                  <span className="text-gray-500 font-medium">Rescue Status</span>
                  <span className={`text-[9.5px] font-black ${activeAlertsCount > 0 ? 'text-neonRed animate-pulse' : 'text-neonGreen'}`}>
                    {rescueStatus}
                  </span>
                </div>
                {/* Weather Alert */}
                <div className="flex justify-between items-center text-[10px] pb-1.5 border-b border-white/5">
                  <span className="text-gray-500 font-medium">Weather Alert</span>
                  <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-wider ${alertStyle.badge}`}>
                    {alertStyle.text}
                  </span>
                </div>
                {/* Operational Status */}
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-500 font-medium">Operational Status</span>
                  <span className={`font-black tracking-widest text-[9.5px] ${systemLiveStatus === 'ONLINE' ? 'text-neonCyan animate-pulse' : 'text-neonRed'}`}>
                    SYS_{systemLiveStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 5: NEAREST RESPONSE UNITS */}
            <NearestResponseUnits lat={activeLat} lng={activeLng} locationName={locationName} />

            {/* Section 6: LIVE RESPONSE STATUS */}
            <LiveResponseStatus lat={activeLat} lng={activeLng} alertId={focusedAlertId} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer coordinates */}
      <div className="flex justify-between items-center text-[7.5px] text-gray-600 font-mono border-t border-white/5 pt-2.5 shrink-0">
        <span>STATION STATUS: SYNCED</span>
        <span>LAT/LNG: {activeLat.toFixed(4)}, {activeLng.toFixed(4)}</span>
      </div>
    </div>
  );
};

export default RightSidebarPanel;

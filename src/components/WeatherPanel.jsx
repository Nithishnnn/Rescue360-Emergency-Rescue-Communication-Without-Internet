import React, { useState, useEffect } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const getWeatherInfo = (code) => {
  switch (code) {
    case 0:
      return { label: 'Sunny', icon: Sun, color: 'text-yellow-400', glow: 'shadow-[0_0_15px_rgba(250,204,21,0.4)] border-yellow-500/20' };
    case 1:
    case 2:
    case 3:
      return { label: 'Cloudy', icon: Cloud, color: 'text-gray-300', glow: 'shadow-[0_0_15px_rgba(156,163,175,0.4)] border-gray-500/20' };
    case 45:
    case 48:
      return { label: 'Foggy', icon: CloudFog, color: 'text-blue-300', glow: 'shadow-[0_0_15px_rgba(147,197,253,0.4)] border-blue-500/20' };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { label: 'Drizzle', icon: CloudDrizzle, color: 'text-teal-300', glow: 'shadow-[0_0_15px_rgba(115,237,215,0.4)] border-teal-500/20' };
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return { label: 'Rainy', icon: CloudRain, color: 'text-neonCyan', glow: 'shadow-[0_0_15px_rgba(0,242,255,0.4)] border-neonCyan/20' };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { label: 'Snowy', icon: CloudSnow, color: 'text-pink-300', glow: 'shadow-[0_0_15px_rgba(244,114,182,0.4)] border-pink-500/20' };
    case 95:
    case 96:
    case 99:
      return { label: 'Storm', icon: CloudLightning, color: 'text-neonRed', glow: 'shadow-[0_0_15px_rgba(255,0,85,0.4)] border-neonRed/20' };
    default:
      return { label: 'Cloudy', icon: Cloud, color: 'text-gray-300', glow: 'shadow-[0_0_15px_rgba(156,163,175,0.4)] border-gray-500/20' };
  }
};

const getMoonPhase = (date) => {
  const referenceDate = new Date(2000, 0, 6, 18, 14, 0);
  const diff = date - referenceDate;
  const cycle = 29.530588853 * 24 * 60 * 60 * 1000;
  const phase = (diff % cycle) / cycle;
  if (phase < 0.06 || phase > 0.94) return { text: 'New Moon', val: 0 };
  if (phase < 0.19) return { text: 'Waxing Crescent', val: 1 };
  if (phase < 0.31) return { text: 'First Quarter', val: 2 };
  if (phase < 0.44) return { text: 'Waxing Gibbous', val: 3 };
  if (phase < 0.56) return { text: 'Full Moon', val: 4 };
  if (phase < 0.69) return { text: 'Waning Gibbous', val: 5 };
  if (phase < 0.81) return { text: 'Third Quarter', val: 6 };
  return { text: 'Waning Crescent', val: 7 };
};

const getWeatherIcon = (code) => {
  switch (code) {
    case 0:
      return { icon: Sun, color: 'text-yellow-400' };
    case 1:
    case 2:
    case 3:
      return { icon: Cloud, color: 'text-gray-300' };
    case 45:
    case 48:
      return { icon: CloudFog, color: 'text-blue-300' };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { icon: CloudDrizzle, color: 'text-teal-300' };
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return { icon: CloudRain, color: 'text-neonCyan' };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { icon: CloudSnow, color: 'text-pink-300' };
    case 95:
    case 96:
    case 99:
      return { icon: CloudLightning, color: 'text-neonRed' };
    default:
      return { icon: Cloud, color: 'text-gray-300' };
  }
};

const getAlertSystem = (current, weatherCode) => {
  const warnings = [];
  let severity = 'GREEN';

  const wind = current.wind_speed_10m || 0;
  const rain = current.precipitation || 0;
  const visibilityMeters = current.visibility || 10000;
  const visibilityKm = visibilityMeters / 1000;
  const isStorm = [95, 96, 99].includes(weatherCode);

  // Red
  if (isStorm) {
    warnings.push('⚠ Thunderstorm warning. Use additional safety precautions.');
    severity = 'RED';
  }
  if (wind > 50) {
    warnings.push('⚠ Extreme wind warning. Do not deploy aerial support.');
    severity = 'RED';
  }
  if (visibilityKm < 1) {
    warnings.push('⚠ Severe visibility hazard. Ground rescue operations highly restricted.');
    severity = 'RED';
  }

  // Orange
  if (severity !== 'RED') {
    if (rain > 5 || weatherCode === 65 || weatherCode === 82) {
      warnings.push('⚠ Heavy rain may slow rescue operations.');
      severity = 'ORANGE';
    }
    if (wind > 30 && wind <= 50) {
      warnings.push('⚠ Strong winds may affect drone or helicopter deployment.');
      severity = 'ORANGE';
    }
  } else {
    if (rain > 5 || weatherCode === 65 || weatherCode === 82) {
      warnings.push('⚠ Heavy rain may slow rescue operations.');
    }
    if (wind > 30 && wind <= 50) {
      warnings.push('⚠ Strong winds may affect drone or helicopter deployment.');
    }
  }

  // Yellow
  if (severity !== 'RED' && severity !== 'ORANGE') {
    if ((rain > 0 && rain <= 5) || [51, 53, 55, 61, 63, 80, 81].includes(weatherCode)) {
      warnings.push('⚠ Light rain detected. Drone deployment may be restricted.');
      severity = 'YELLOW';
    }
    if (visibilityKm >= 1 && visibilityKm < 5) {
      warnings.push('⚠ Low visibility detected. Drive carefully.');
      severity = 'YELLOW';
    }
  } else {
    if (visibilityKm >= 1 && visibilityKm < 5) {
      warnings.push('⚠ Low visibility detected. Drive carefully.');
    }
  }

  // Green
  if (warnings.length === 0) {
    warnings.push('Safe weather conditions');
  }

  return { severity, warnings };
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

const WeatherPanel = () => {
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
    fetchWeatherForCoordinates
  } = useAlert();

  const selectedAlert = alerts.find(a => a.id === focusedAlertId) || alerts[0];
  const lat = selectedAlert && selectedAlert.latitude ? Number(selectedAlert.latitude) : mapCenter.lat;
  const lng = selectedAlert && selectedAlert.longitude ? Number(selectedAlert.longitude) : mapCenter.lng;

  const activeLat = Number(lat) || 13.0827;
  const activeLng = Number(lng) || 80.2707;

  const handleManualRefresh = () => {
    fetchWeatherForCoordinates(activeLat, activeLng, true);
  };

  const handleClearFocus = () => {
    setFocusedAlertId(null);
  };

  // Warning calculations
  const current = weather?.current || {};
  const weatherCode = current.weather_code ?? 0;
  const condition = getWeatherInfo(weatherCode);
  const ConditionIcon = condition.icon;
  const { severity, warnings } = getAlertSystem(current, weatherCode);

  const getAlertStyles = (level) => {
    switch (level) {
      case 'RED':
        return {
          card: 'bg-neonRed/10 border-neonRed/30 text-neonRed shadow-[0_0_12px_rgba(255,0,85,0.15)]',
          badge: 'bg-neonRed/20 text-neonRed border border-neonRed/40 shadow-[0_0_8px_rgba(255,0,85,0.25)]',
          text: 'SEVERE WARNING',
        };
      case 'ORANGE':
        return {
          card: 'bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.15)]',
          badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.25)]',
          text: 'MODERATE ALERT',
        };
      case 'YELLOW':
        return {
          card: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.15)]',
          badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 shadow-[0_0_8px_rgba(234,179,8,0.25)]',
          text: 'WEATHER ADVISORY',
        };
      case 'GREEN':
      default:
        return {
          card: 'bg-neonGreen/10 border-neonGreen/30 text-neonGreen shadow-[0_0_12px_rgba(57,255,20,0.1)]',
          badge: 'bg-neonGreen/20 text-neonGreen border border-neonGreen/40 shadow-[0_0_8px_rgba(57,255,20,0.2)]',
          text: 'SAFE CONDITIONS',
        };
    }
  };

  const alertStyle = getAlertStyles(severity);

  // Hourly visibility trend calculations
  const hourly = weather?.hourly || {};
  const hourlyTimes = hourly.time || [];
  const hourlyVisibility = hourly.visibility || [];
  
  let currentHourIdx = -1;
  if (hourlyTimes.length > 0) {
    const now = new Date();
    currentHourIdx = hourlyTimes.findIndex(t => {
      const d = new Date(t);
      return d.getTime() >= now.getTime() - 30 * 60 * 1000 && d.getTime() <= now.getTime() + 30 * 60 * 1000;
    });
    if (currentHourIdx === -1) {
      currentHourIdx = hourlyTimes.findIndex(t => new Date(t) >= now);
    }
  }

  let visibilityTrend = 'Stable →';
  if (current.visibility !== undefined && hourlyVisibility.length > 0 && currentHourIdx !== -1) {
    const nextHourVisibility = hourlyVisibility[currentHourIdx + 1] ?? hourlyVisibility[currentHourIdx];
    if (nextHourVisibility !== undefined) {
      if (nextHourVisibility > current.visibility) {
        visibilityTrend = 'Improving ↗';
      } else if (nextHourVisibility < current.visibility) {
        visibilityTrend = 'Reducing ↘';
      }
    }
  }

  // Hourly forecast calculations
  const hourlyForecast = [];
  if (hourlyTimes.length > 0) {
    const startIdx = Math.max(0, currentHourIdx);
    const hourlyTemp = hourly.temperature_2m || [];
    const hourlyCode = hourly.weather_code || [];
    const hourlyProb = hourly.precipitation_probability || [];
    
    for (let i = 0; i < 6; i++) {
      const idx = startIdx + i;
      if (idx < hourlyTimes.length) {
        const timeStr = new Date(hourlyTimes[idx]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const codeVal = hourlyCode[idx];
        const { icon: Icon, color } = getWeatherIcon(codeVal);
        hourlyForecast.push({
          time: timeStr,
          temp: hourlyTemp[idx] !== undefined ? `${hourlyTemp[idx].toFixed(1)}°C` : '--',
          prob: hourlyProb[idx] !== undefined ? `${hourlyProb[idx]}%` : '--',
          Icon,
          color
        });
      }
    }
  }

  // Moon Phase
  const moonPhaseInfo = getMoonPhase(new Date());
  const moonPhaseText = moonPhaseInfo ? moonPhaseInfo.text : '--';

  return (
    <div className="glass-card p-6 flex flex-col relative overflow-hidden transition-all duration-300 flex-1">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-lg font-bold flex items-center gap-2 text-white">
          <ConditionIcon className={`${condition.color} animate-pulse drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]`} size={20} />
          LIVE WEATHER CONDITIONS
        </h2>
        <div className="flex items-center gap-2">
          {loading && (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="text-neonCyan shrink-0"
            >
              <RefreshCw size={14} />
            </motion.div>
          )}
          <button 
            onClick={handleManualRefresh}
            disabled={loading}
            className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-colors"
            title="Force refresh weather data"
          >
            <RefreshCw size={12} className={loading ? 'opacity-0' : ''} />
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
            <AlertTriangle size={32} className="mb-2 animate-bounce" />
            Weather information unavailable.
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
            <p className="text-[10px] uppercase font-black tracking-widest text-neonCyan animate-pulse-slow">
              COMMUNICATION IN PROGRESS...
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="data"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar"
          >
            {/* Header: Location & Focus Node Badge */}
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl shrink-0">
              <div className="flex items-center gap-2 truncate pr-2">
                <MapPin size={14} className="text-neonCyan shrink-0" />
                <div className="truncate">
                  <p className="text-[8px] text-gray-500 uppercase font-black">ACTIVE NODE POSITION</p>
                  <p className="text-xs font-bold text-white truncate" title={locationName}>
                    {locationName || '--'}
                  </p>
                </div>
              </div>
              
              {selectedAlert ? (
                <button
                  onClick={handleClearFocus}
                  className="flex items-center gap-1.5 py-1 px-2 bg-neonRed/10 border border-neonRed/35 hover:bg-neonRed/20 text-neonRed hover:text-white rounded-lg transition-all text-[8px] font-black uppercase tracking-wider shrink-0"
                  title="Return to map center coordinates"
                >
                  <span>SOS: {selectedAlert.user_name || 'Active'}</span>
                  <X size={10} />
                </button>
              ) : (
                <span className="py-1 px-2 bg-neonCyan/10 border border-neonCyan/35 text-neonCyan rounded-lg text-[8px] font-black uppercase tracking-wider shrink-0">
                  MAP CENTER
                </span>
              )}
            </div>

            {/* Weather Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              {/* Temperature */}
              <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500">
                  <Thermometer size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] text-gray-500 uppercase font-black truncate">Temperature</p>
                  <p className="text-sm font-black text-white font-mono">
                    {current.temperature_2m !== undefined ? `${current.temperature_2m.toFixed(1)}` : '--'}°C
                  </p>
                </div>
              </div>

              {/* Humidity */}
              <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                <div className="p-2 rounded-xl bg-neonCyan/10 text-neonCyan">
                  <Droplets size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] text-gray-500 uppercase font-black truncate">Humidity</p>
                  <p className="text-sm font-black text-white font-mono">
                    {current.relative_humidity_2m !== undefined ? `${current.relative_humidity_2m}` : '--'}%
                  </p>
                </div>
              </div>

              {/* Wind Speed */}
              <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                  <Wind size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] text-gray-500 uppercase font-black truncate">Wind Speed</p>
                  <p className="text-sm font-black text-white font-mono">
                    {current.wind_speed_10m !== undefined ? `${current.wind_speed_10m}` : '--'} km/h
                  </p>
                </div>
              </div>

              {/* Visibility */}
              <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <Eye size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] text-gray-500 uppercase font-black truncate">Visibility</p>
                  <p className="text-sm font-black text-white font-mono">
                    {current.visibility !== undefined ? (current.visibility / 1000).toFixed(1) : '--'} km
                  </p>
                </div>
              </div>

              {/* Rainfall */}
              <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <CloudRain size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] text-gray-500 uppercase font-black truncate">Precipitation</p>
                  <p className="text-sm font-black text-white font-mono">
                    {current.precipitation !== undefined ? `${current.precipitation}` : '0'} mm
                  </p>
                </div>
              </div>

              {/* Weather Condition status */}
              <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-white/5 ${condition.color}`}>
                  <ConditionIcon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] text-gray-500 uppercase font-black truncate">Condition</p>
                  <p className="text-xs font-black text-white truncate">{condition.label ?? '--'}</p>
                </div>
              </div>
            </div>

            {/* Hourly Forecast */}
            {hourlyForecast.length > 0 && (
              <div className="space-y-2 shrink-0">
                <p className="text-[8px] text-gray-500 uppercase font-black tracking-[0.15em]">HOURLY METEOROLOGICAL MATRIX</p>
                <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
                  {hourlyForecast.map((h, i) => (
                    <div key={i} className="flex-1 min-w-[65px] bg-[#0e0e14]/50 border border-white/5 p-2 rounded-2xl flex flex-col items-center justify-between text-center gap-1.5">
                      <span className="text-[8px] text-gray-500 font-mono">{h.time}</span>
                      <h.Icon className={`${h.color} w-4 h-4 drop-shadow-[0_0_4px_currentColor]`} />
                      <span className="text-[10px] font-black text-white font-mono">{h.temp}</span>
                      <span className="text-[7px] text-neonCyan font-mono">{h.prob}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Environmental Secondary Grid */}
            <div className="space-y-2 shrink-0">
              <p className="text-[8px] text-gray-500 uppercase font-black tracking-[0.15em]">ATMOSPHERIC TELEMETRY</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Feels Like */}
                <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
                    <Thermometer size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[8px] text-gray-500 uppercase font-black truncate">Feels Like</p>
                    <p className="text-sm font-black text-white font-mono">
                      {current.apparent_temperature !== undefined ? `${current.apparent_temperature.toFixed(1)}°C` : '--'}
                    </p>
                  </div>
                </div>

                {/* Wind Gusts */}
                <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500">
                    <Wind size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[8px] text-gray-500 uppercase font-black truncate">Wind Gusts</p>
                    <p className="text-sm font-black text-white font-mono">
                      {current.wind_gusts_10m !== undefined ? `${current.wind_gusts_10m.toFixed(1)} km/h` : '--'}
                    </p>
                  </div>
                </div>

                {/* Dew Point */}
                <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                    <Droplets size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[8px] text-gray-500 uppercase font-black truncate">Dew Point</p>
                    <p className="text-sm font-black text-white font-mono">
                      {current.dew_point_2m !== undefined ? `${current.dew_point_2m.toFixed(1)}°C` : '--'}
                    </p>
                  </div>
                </div>

                {/* Cloud Cover */}
                <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Cloud size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[8px] text-gray-500 uppercase font-black truncate">Cloud Cover</p>
                    <p className="text-sm font-black text-white font-mono">
                      {current.cloud_cover !== undefined ? `${current.cloud_cover}%` : '--'}
                    </p>
                  </div>
                </div>

                {/* Pressure */}
                <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Compass size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[8px] text-gray-500 uppercase font-black truncate">Pressure</p>
                    <p className="text-sm font-black text-white font-mono">
                      {current.pressure_msl !== undefined ? `${current.pressure_msl.toFixed(0)} hPa` : '--'}
                    </p>
                  </div>
                </div>

                {/* UV Index */}
                <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                    <Sun size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[8px] text-gray-500 uppercase font-black truncate">UV Index</p>
                    <p className="text-sm font-black text-white font-mono">
                      {current.uv_index !== undefined ? `${current.uv_index.toFixed(1)}` : '--'}
                    </p>
                  </div>
                </div>

                {/* AQI */}
                <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-neonGreen">
                    <ShieldAlert size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[8px] text-gray-500 uppercase font-black truncate">AQI (US)</p>
                    <p className="text-sm font-black text-white font-mono">
                      {weatherAqi !== null && weatherAqi !== undefined ? weatherAqi : '--'}
                    </p>
                  </div>
                </div>

                {/* Visibility Trend */}
                <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-neonCyan/10 text-neonCyan">
                    <TrendingUp size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[8px] text-gray-500 uppercase font-black truncate">Vis. Trend</p>
                    <p className="text-sm font-black text-white font-mono truncate">
                      {visibilityTrend || '--'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sunrise, Sunset and Moon Phase row */}
            <div className="grid grid-cols-3 gap-2.5 p-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] text-gray-400 shrink-0">
              <div className="flex items-center gap-2">
                <Sunrise size={14} className="text-orange-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[8px] text-gray-500 block uppercase font-black truncate">SUNRISE</span>
                  <span className="font-bold text-white font-mono truncate">
                    {weather?.daily?.sunrise?.[0] ? formatTime(weather.daily.sunrise[0]) : '--'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sunset size={14} className="text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[8px] text-gray-500 block uppercase font-black truncate">SUNSET</span>
                  <span className="font-bold text-white font-mono truncate">
                    {weather?.daily?.sunset?.[0] ? formatTime(weather.daily.sunset[0]) : '--'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Moon size={14} className="text-neonCyan animate-pulse shrink-0" />
                <div className="min-w-0">
                  <span className="text-[8px] text-gray-500 block uppercase font-black truncate">MOON PHASE</span>
                  <span className="font-bold text-white font-mono text-[9px] truncate" title={moonPhaseText}>
                    {moonPhaseText}
                  </span>
                </div>
              </div>
            </div>

            {/* Weather Alerts Warning Card */}
            <div className={`p-4 border rounded-2xl ${alertStyle.card} transition-all duration-300 shrink-0`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${alertStyle.badge}`}>
                  {alertStyle.text}
                </span>
                <span className="text-[8px] font-bold opacity-60 uppercase font-mono">
                  SYS.ALERTS
                </span>
              </div>
              
              <div className="space-y-1.5">
                {warnings.map((msg, index) => (
                  <p key={index} className="text-[10px] leading-relaxed font-semibold">
                    {msg}
                  </p>
                ))}
              </div>
            </div>

            {/* Footer telemetry */}
            <div className="flex justify-between items-center text-[8px] text-gray-600 font-mono pt-1 shrink-0">
              <div className="flex items-center gap-1">
                <Clock size={10} />
                <span>UPDATED: {lastUpdated || '--'}</span>
              </div>
              <span>COORDS: {activeLat.toFixed(4)}, {activeLng.toFixed(4)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeatherPanel;

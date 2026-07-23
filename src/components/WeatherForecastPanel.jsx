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
  ShieldAlert, 
  Compass, 
  TrendingUp, 
  Calendar, 
  Moon,
  Clock,
  Navigation,
  AlertTriangle,
  MapPin
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useAlert } from '../context/AlertContext';

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

const calculateDaylightRemaining = (sunsetStr) => {
  if (!sunsetStr) return '0h 0m';
  try {
    const sunset = new Date(sunsetStr);
    const now = new Date();
    const diffMs = sunset - now;
    if (diffMs <= 0) return '0h 0m';
    const totalMin = Math.floor(diffMs / (60 * 1000));
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    return `${hours}h ${minutes}m`;
  } catch (e) {
    return '0h 0m';
  }
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

const WeatherForecastPanel = () => {
  const { 
    alerts, 
    focusedAlertId, 
    mapCenter,
    weatherData: forecast,
    weatherAqi: aqi,
    weatherLoading: loading,
    weatherError: error,
    weatherLocationName: locationName
  } = useAlert();

  const selectedAlert = alerts.find(a => a.id === focusedAlertId) || alerts[0];
  const lat = selectedAlert && selectedAlert.latitude ? Number(selectedAlert.latitude) : mapCenter.lat;
  const lng = selectedAlert && selectedAlert.longitude ? Number(selectedAlert.longitude) : mapCenter.lng;

  if (loading && !forecast) {
    return (
      <div className="glass-card p-6 min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-neonCyan/20 rounded-full"></div>
          <div className="absolute inset-0 border-t-2 border-neonCyan rounded-full animate-spin"></div>
        </div>
        <p className="text-[10px] uppercase font-black tracking-widest text-neonCyan animate-pulse">
          LOADING METEOROLOGICAL MATRIX...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 min-h-[300px] flex flex-col items-center justify-center text-center text-neonRed font-black uppercase text-xs tracking-wider">
        <AlertTriangle size={36} className="mb-2 animate-bounce" />
        Weather information unavailable.
      </div>
    );
  }

  if (!forecast) return null;

  // Process 24h forecast (hourly)
  const hourly = forecast.hourly || {};
  const times = hourly.time || [];
  const hourlyTemp = hourly.temperature_2m || [];
  const hourlyCode = hourly.weather_code || [];
  const hourlyProb = hourly.precipitation_probability || [];
  const hourlyWind = hourly.wind_speed_10m || [];
  const hourlyHumidity = hourly.relative_humidity_2m || [];
  const hourlyRain = hourly.precipitation || [];

  const currentHourIdx = times.findIndex(t => new Date(t) >= new Date()) || 0;
  const sliced24h = [];
  for (let i = 0; i < 24; i++) {
    const idx = currentHourIdx + i;
    if (idx < times.length) {
      sliced24h.push({
        time: new Date(times[idx]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        temp: hourlyTemp[idx],
        code: hourlyCode[idx],
        prob: hourlyProb[idx],
        wind: hourlyWind[idx],
        humidity: hourlyHumidity[idx],
        rain: hourlyRain[idx]
      });
    }
  }

  // Process 7-day forecast
  const daily = forecast.daily || {};
  const dailyTimes = daily.time || [];
  const dailyTempMax = daily.temperature_2m_max || [];
  const dailyTempMin = daily.temperature_2m_min || [];
  const dailyProbMax = daily.precipitation_probability_max || [];
  const dailyCode = daily.weather_code || [];

  const parsed7d = dailyTimes.slice(0, 7).map((t, i) => {
    const d = new Date(t);
    const dayName = d.toLocaleDateString([], { weekday: 'short' });
    return {
      day: dayName,
      max: dailyTempMax[i],
      min: dailyTempMin[i],
      prob: dailyProbMax[i],
      code: dailyCode[i]
    };
  });

  // Active Warnings calculations
  const warnings = [];
  const currentVal = forecast.current || {};
  const currentTemp = currentVal.temperature_2m || 0;
  const currentWind = currentVal.wind_speed_10m || 0;
  const currentRain = currentVal.precipitation || 0;
  const currentCode = currentVal.weather_code || 0;
  const isStorm = [95, 96, 99].includes(currentCode);

  if (currentRain > 5 || [65, 82].includes(currentCode)) {
    warnings.push({ title: 'Heavy Rain', desc: 'Precipitation exceeding operational thresholds.', color: 'border-orange-500/30 text-orange-400 bg-orange-500/5' });
  }
  if (isStorm) {
    warnings.push({ title: 'Thunderstorm', desc: 'Lightning threat active. Ground all operations.', color: 'border-neonRed/30 text-neonRed bg-neonRed/5' });
  }
  if (currentWind > 30) {
    warnings.push({ title: 'Strong Wind', desc: 'Wind speed exceeds safe drone deployment speed.', color: 'border-orange-500/30 text-orange-400 bg-orange-500/5' });
  }
  if (currentTemp > 38) {
    warnings.push({ title: 'Heatwave', desc: 'Extreme temperature. Monitor device cooling systems.', color: 'border-neonRed/30 text-neonRed bg-neonRed/5' });
  }
  if (currentRain > 15 || [65, 82].includes(currentCode)) {
    warnings.push({ title: 'Flood Warning', desc: 'High accumulation rate. Risk of regional flooding.', color: 'border-neonRed/30 text-neonRed bg-neonRed/5' });
  }

  // Rescue Recommendations
  let recommendation = { text: 'Safe for Rescue', desc: 'Operational parameters within nominal limits.', style: 'border-neonGreen/30 bg-neonGreen/10 text-neonGreen shadow-[0_0_10px_rgba(57,255,20,0.15)]' };
  const currentVisibility = currentVal.visibility ? currentVal.visibility / 1000 : 10;

  if (isStorm) {
    recommendation = { text: 'Use Alternate Route', desc: 'Severe storm activity. Reroute dispatch around danger pockets.', style: 'border-neonRed/40 bg-neonRed/10 text-neonRed shadow-[0_0_15px_rgba(255,0,85,0.25)]' };
  } else if (currentWind > 45) {
    recommendation = { text: 'High Wind Detected', desc: 'Wind speed critical. Aerial response platforms grounded.', style: 'border-neonRed/40 bg-neonRed/10 text-neonRed shadow-[0_0_15px_rgba(255,0,85,0.25)]' };
  } else if (currentWind > 30) {
    recommendation = { text: 'Delay Air Rescue', desc: 'Elevated wind speeds. Hold drone and helicopter operations.', style: 'border-orange-500/40 bg-orange-500/10 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]' };
  } else if (currentTemp > 38) {
    recommendation = { text: 'Extreme Heat Warning', desc: 'High ambient temperature. Monitor battery and crew thermal limits.', style: 'border-neonRed/40 bg-neonRed/10 text-neonRed shadow-[0_0_15px_rgba(255,0,85,0.25)]' };
  } else if (currentRain > 5 || [65, 82].includes(currentCode)) {
    recommendation = { text: 'Heavy Rain Expected', desc: 'Poor conditions may slow transit speeds. Ground support deployed.', style: 'border-orange-500/40 bg-orange-500/10 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]' };
  } else if (currentVisibility < 1 || [45, 48].includes(currentCode)) {
    recommendation = { text: 'Poor Visibility', desc: 'Extreme fog/precipitation. Ground deployment hazardous.', style: 'border-neonRed/40 bg-neonRed/10 text-neonRed shadow-[0_0_15px_rgba(255,0,85,0.25)]' };
  }

  // Moon Phase
  const moonPhase = getMoonPhase(new Date());

  // Graph Data (Last 24 Hours)
  const graphData = sliced24h.map(h => ({
    name: h.time,
    temp: h.temp,
    wind: h.wind,
    humidity: h.humidity,
    rain: h.rain
  }));

  return (
    <div className="space-y-6">
      {/* Target Location Area */}
      <div className="glass-card p-4 flex items-center gap-3 bg-white/5 border border-white/5">
        <MapPin size={16} className="text-neonCyan animate-pulse shrink-0" />
        <div className="truncate">
          <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest block">TARGET LOCATION AREA</span>
          <span className="text-xs font-black text-white uppercase tracking-wider truncate block">{locationName}</span>
        </div>
      </div>

      {/* Dynamic Grid: Alerts & Rescue Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rescue Alerts */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <ShieldAlert size={14} className="text-neonRed animate-pulse" />
              Rescue Weather Warnings
            </h3>
            <div className="space-y-2">
              {warnings.length > 0 ? (
                warnings.map((w, idx) => (
                  <div key={idx} className={`p-3 border rounded-xl flex flex-col ${w.color}`}>
                    <span className="text-xs font-bold uppercase tracking-wider">{w.title}</span>
                    <span className="text-[9px] opacity-75 font-mono leading-relaxed mt-0.5">{w.desc}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 border border-neonGreen/20 bg-neonGreen/5 rounded-xl text-center text-neonGreen font-semibold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neonGreen animate-pulse"></span>
                  No Active Weather Warnings.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rescue Recommendation */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Compass size={14} className="text-neonCyan animate-pulse" />
              Rescue Recommendation
            </h3>
            
            <div className={`p-5 border rounded-2xl flex flex-col items-center justify-center text-center ${recommendation.style} transition-all duration-300`}>
              <span className="text-sm font-black uppercase tracking-widest leading-none mb-2">
                {recommendation.text}
              </span>
              <span className="text-[10px] font-mono leading-relaxed opacity-90 max-w-[200px]">
                {recommendation.desc}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 24-Hour Forecast */}
      <div className="glass-card p-5">
        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Clock size={14} className="text-neonCyan" />
          24-Hour Weather Forecast
        </h3>
        
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none custom-scrollbar">
          {sliced24h.map((h, idx) => {
            const WeatherInfo = getWeatherIcon(h.code);
            const Icon = WeatherInfo.icon;
            return (
              <div 
                key={idx} 
                className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col items-center text-center space-y-1.5 shrink-0 w-24 hover:bg-white/10 transition-all hover:border-neonCyan/20"
              >
                <span className="text-[9px] text-gray-500 font-mono">{h.time}</span>
                <Icon className={`${WeatherInfo.color} drop-shadow-[0_0_6px_currentColor]`} size={16} />
                <span className="text-xs font-black text-white font-mono">{h.temp.toFixed(1)}°C</span>
                <div className="flex flex-col text-[8px] font-mono text-gray-400 leading-none">
                  <span>🌧 {h.prob}%</span>
                  <span>💨 {h.wind.toFixed(0)} km/h</span>
                  <span>💧 {h.humidity}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: 7-Day Forecast & Sun/Moon Info */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 7-Day Forecast */}
        <div className="glass-card p-5 md:col-span-8 flex flex-col justify-between">
          <div>
            <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Calendar size={14} className="text-neonCyan" />
              7-Day Weather Forecast
            </h3>
            
            <div className="space-y-2">
              {parsed7d.map((d, idx) => {
                const WeatherInfo = getWeatherIcon(d.code);
                const Icon = WeatherInfo.icon;
                return (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-2.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all"
                  >
                    <span className="text-xs font-bold text-gray-300 w-12">{d.day}</span>
                    <div className="flex items-center gap-1">
                      <Icon className={`${WeatherInfo.color}`} size={14} />
                      <span className="text-[9px] font-mono text-gray-500">🌧 {d.prob}%</span>
                    </div>
                    <div className="text-[10px] font-mono text-right flex items-center gap-2">
                      <span className="text-neonCyan font-bold">{d.min.toFixed(0)}°</span>
                      <span className="text-gray-600">/</span>
                      <span className="text-neonRed font-bold">{d.max.toFixed(0)}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sun & Moon / Environmental details */}
        <div className="glass-card p-5 md:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Moon size={14} className="text-purple-400" />
              Sun & Moon Information
            </h3>
            
            <div className="space-y-4">
              {/* Sun Times */}
              <div className="space-y-2 pb-3 border-b border-white/5 text-gray-400 text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 font-bold uppercase"><Sunrise size={12} className="text-orange-400" /> Sunrise</span>
                  <span className="font-mono text-white font-bold">{formatTime(daily.sunrise?.[0])}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 font-bold uppercase"><Sunset size={12} className="text-purple-400" /> Sunset</span>
                  <span className="font-mono text-white font-bold">{formatTime(daily.sunset?.[0])}</span>
                </div>
              </div>

              {/* Day details */}
              <div className="space-y-3 pt-1 text-gray-500 font-mono text-[9px]">
                <div className="flex justify-between items-center">
                  <span className="uppercase font-black text-gray-600">Daylight Remaining:</span>
                  <span className="text-neonGreen font-bold text-xs">{calculateDaylightRemaining(daily.sunset?.[0])}</span>
                </div>
                
                {/* Moon Phase representation */}
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[8px] text-gray-600 uppercase font-black mb-1">Moon Phase</span>
                  <span className="text-[10px] font-black text-purple-400 tracking-wider flex items-center gap-1.5">
                    <Moon size={12} className="animate-pulse" />
                    {moonPhase.text}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Environmental Conditions */}
      <div className="glass-card p-5">
        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Droplets size={14} className="text-neonCyan" />
          Environmental Conditions
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Pressure */}
          <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl">
            <span className="text-[8px] text-gray-600 block uppercase font-black mb-1">Pressure</span>
            <span className="text-xs font-black text-white font-mono">{currentVal.pressure_msl ?? '—'} hPa</span>
          </div>

          {/* Feels Like */}
          <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl">
            <span className="text-[8px] text-gray-600 block uppercase font-black mb-1">Feels Like</span>
            <span className="text-xs font-black text-neonRed font-mono">{currentVal.apparent_temperature ?? '—'}°C</span>
          </div>

          {/* Cloud Cover */}
          <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl">
            <span className="text-[8px] text-gray-600 block uppercase font-black mb-1">Cloud Cover</span>
            <span className="text-xs font-black text-white font-mono">{currentVal.cloud_cover ?? '—'}%</span>
          </div>

          {/* Dew Point */}
          <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl">
            <span className="text-[8px] text-gray-600 block uppercase font-black mb-1">Dew Point</span>
            <span className="text-xs font-black text-white font-mono">
              {hourly.dew_point_2m?.[currentHourIdx]?.toFixed(1) ?? '—'}°C
            </span>
          </div>

          {/* UV Index */}
          <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl">
            <span className="text-[8px] text-gray-600 block uppercase font-black mb-1">UV Index</span>
            <span className="text-xs font-black text-yellow-400 font-mono">
              {hourly.uv_index?.[currentHourIdx]?.toFixed(1) ?? '—'}
            </span>
          </div>

          {/* Air Quality AQI */}
          <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl">
            <span className="text-[8px] text-gray-600 block uppercase font-black mb-1">Air Quality</span>
            <span className={`text-xs font-black font-mono ${
              aqi === null ? 'text-gray-500' :
              aqi <= 50 ? 'text-neonGreen' :
              aqi <= 100 ? 'text-yellow-400' : 'text-neonRed'
            }`}>
              {aqi !== null ? `${aqi} AQI` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Weather Trend Graph */}
      <div className="glass-card p-5">
        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-neonCyan" />
          24-Hour Weather Trend Graph
        </h3>
        
        <div className="h-[250px] w-full text-xs font-mono">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} strokeOpacity={0.5} />
              <XAxis 
                dataKey="name" 
                stroke="#555" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#666' }}
              />
              <YAxis 
                stroke="#555" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#666' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(5, 5, 5, 0.95)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  fontSize: '11px'
                }}
                labelStyle={{ color: '#fff', fontSize: '9px', marginBottom: '4px', textTransform: 'uppercase' }}
              />
              <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
              <Line 
                name="Temp (°C)"
                type="monotone" 
                dataKey="temp" 
                stroke="#ff0055" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line 
                name="Humidity (%)"
                type="monotone" 
                dataKey="humidity" 
                stroke="#eab308" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line 
                name="Wind (km/h)"
                type="monotone" 
                dataKey="wind" 
                stroke="#00f2ff" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line 
                name="Rainfall (mm)"
                type="monotone" 
                dataKey="rain" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WeatherForecastPanel;

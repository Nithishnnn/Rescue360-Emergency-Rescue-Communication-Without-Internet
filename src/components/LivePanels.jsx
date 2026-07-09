import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, MapPin, AlertCircle, Clock, User, ShieldAlert, ShieldCheck } from 'lucide-react';

// Default center coordinates (Chennai)
const CENTER_LAT = 13.0827;
const CENTER_LNG = 80.2707;

// Helper to format ISO time to locale string
const formatAlertTime = (isoString) => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return '—';
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1.  EMERGENCY HOTSPOT ANALYSIS (Radar Heatmap Visualization)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const EmergencyHotspotAnalysis = ({ alerts = [], loading = false }) => {
  // Group and sort alerts by location bins (rounded coordinates)
  const hotspots = useMemo(() => {
    if (!alerts || alerts.length === 0) return [];
    
    const bins = {};
    alerts.forEach((alert) => {
      if (alert.latitude && alert.longitude) {
        const lat = Number(alert.latitude);
        const lng = Number(alert.longitude);
        // Rounding to 2 decimal places groups within ~1.1km
        const latBin = lat.toFixed(2);
        const lngBin = lng.toFixed(2);
        const key = `${latBin},${lngBin}`;
        
        if (!bins[key]) {
          bins[key] = {
            key,
            lat: Number(latBin),
            lng: Number(lngBin),
            count: 0,
            messages: new Set(),
            latestTime: alert.created_at,
          };
        }
        bins[key].count += 1;
        if (alert.emergency_message) {
          bins[key].messages.add(alert.emergency_message);
        }
        if (new Date(alert.created_at) > new Date(bins[key].latestTime)) {
          bins[key].latestTime = alert.created_at;
        }
      }
    });

    return Object.values(bins)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((h, index) => ({
        ...h,
        rank: index + 1,
        messageList: Array.from(h.messages),
      }));
  }, [alerts]);

  const maxCount = useMemo(() => {
    if (hotspots.length === 0) return 1;
    return Math.max(...hotspots.map((h) => h.count));
  }, [hotspots]);

  // Compute SVG layout coordinates for each hotspot on the radar
  const radarPoints = useMemo(() => {
    if (hotspots.length === 0) return [];

    // Calculate maximum coordinate offset from Center to scale points nicely within 85px radius
    let maxOffset = 0.02; // minimum offset boundary to prevent division by zero
    hotspots.forEach((h) => {
      const dLat = Math.abs(h.lat - CENTER_LAT);
      const dLng = Math.abs(h.lng - CENTER_LNG);
      if (dLat > maxOffset) maxOffset = dLat;
      if (dLng > maxOffset) maxOffset = dLng;
    });

    const radarRadius = 80;
    const centerOffset = 100; // SVG viewBox center (200x200)

    return hotspots.map((h) => {
      const dLat = h.lat - CENTER_LAT;
      const dLng = h.lng - CENTER_LNG;

      // Scale appropriately
      const x = centerOffset + (dLng / maxOffset) * radarRadius;
      const y = centerOffset - (dLat / maxOffset) * radarRadius; // invert Y for SVG screen coordinates

      return {
        ...h,
        cx: x,
        cy: y,
      };
    });
  }, [hotspots]);

  if (loading) {
    return (
      <div className="glass-card p-6 flex flex-col h-[400px] animate-pulse bg-white/5" />
    );
  }

  return (
    <div className="glass-card p-6 flex flex-col h-[400px] overflow-hidden relative">
      <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
        Emergency Hotspot Analysis
      </h3>

      {hotspots.length === 0 ? (
        <div className="flex-1 flex items-center justify-center flex-col">
          <Radio size={40} className="text-neonCyan/30 mb-3 animate-pulse" />
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">
            No live hotspots identified
          </p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Radar Scanning Visualisation */}
          <div className="relative w-full h-[180px] md:h-[220px] flex items-center justify-center bg-black/30 border border-white/5 rounded-2xl overflow-hidden group">
            {/* Ambient grid background */}
            <div className="absolute inset-0 bg-grid opacity-10" />
            
            {/* The Radar SVG */}
            <svg viewBox="0 0 200 200" className="w-[180px] h-[180px] relative z-10">
              {/* Radar Rings */}
              <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(0, 242, 255, 0.08)" strokeWidth="1" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(0, 242, 255, 0.12)" strokeWidth="1" />
              <circle cx="100" cy="100" r="30" fill="none" stroke="rgba(0, 242, 255, 0.15)" strokeWidth="1" />
              
              {/* Radar Axes */}
              <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(0, 242, 255, 0.1)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(0, 242, 255, 0.1)" strokeWidth="1" strokeDasharray="3,3" />

              {/* Scanning Hand Animation */}
              <motion.line
                x1="100"
                y1="100"
                x2="100"
                y2="10"
                stroke="url(#radarSweep)"
                strokeWidth="2.5"
                style={{ originX: '100px', originY: '100px' }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              />

              <defs>
                <linearGradient id="radarSweep" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f2ff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#00f2ff" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Center Dot (Rescue Base) */}
              <circle cx="100" cy="100" r="3" fill="#ff0055" />
              <circle cx="100" cy="100" r="8" fill="none" stroke="#ff0055" strokeWidth="1" className="animate-ping" style={{ transformOrigin: 'center' }} />

              {/* Hotspot density dots */}
              {radarPoints.map((pt) => {
                // Color gets hotter / redder if rank is high
                const dotColor = pt.rank === 1 ? '#ff0055' : pt.rank === 2 ? '#ff9900' : '#00f2ff';
                const glowColor = pt.rank === 1 ? 'rgba(255, 0, 85, 0.3)' : pt.rank === 2 ? 'rgba(255, 153, 0, 0.25)' : 'rgba(0, 242, 255, 0.25)';
                const dotRadius = Math.max(4, Math.min(10, (pt.count / maxCount) * 8));

                return (
                  <g key={pt.key}>
                    <circle cx={pt.cx} cy={pt.cy} r={dotRadius * 2.5} fill={glowColor} className="animate-pulse" />
                    <circle cx={pt.cx} cy={pt.cy} r={dotRadius} fill={dotColor} />
                    <text x={pt.cx + dotRadius + 3} y={pt.cy + 3} fill="#aaa" fontSize="6" fontWeight="bold" fontFamily="monospace">
                      #{pt.rank} ({pt.count})
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="absolute bottom-2 left-3 text-[8px] font-mono text-gray-500 uppercase tracking-wider">
              SCANNING GRID SEC-4...
            </div>
          </div>

          {/* Hotspot details lists */}
          <div className="space-y-3 h-full overflow-y-auto custom-scrollbar pr-1">
            {hotspots.map((h) => {
              const ratio = (h.count / maxCount) * 100;
              const colorClass = h.rank === 1 ? 'bg-neonRed text-neonRed' : h.rank === 2 ? 'bg-orange-500 text-orange-500' : 'bg-neonCyan text-neonCyan';
              
              return (
                <div key={h.key} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1.5 transition-all hover:bg-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${h.rank === 1 ? 'bg-neonRed animate-pulse' : h.rank === 2 ? 'bg-orange-500' : 'bg-neonCyan'}`} />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                        Grid Sector {h.key}
                      </span>
                    </div>
                    <span className="text-[10px] font-black font-mono tracking-widest text-gray-300">
                      {h.count} ALERTS
                    </span>
                  </div>

                  {/* Neon Density progress bar */}
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ratio}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-full ${colorClass}`}
                      style={{
                        boxShadow: h.rank === 1 
                          ? '0 0 8px rgba(255, 0, 85, 0.6)' 
                          : h.rank === 2 
                          ? '0 0 8px rgba(249, 115, 22, 0.6)' 
                          : '0 0 8px rgba(0, 242, 255, 0.6)'
                      }}
                    />
                  </div>

                  <div className="text-[8px] text-gray-500 truncate uppercase">
                    Latest: {h.messageList.join(' · ') || 'No message logged'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2.  RECENT EMERGENCY ACTIVITY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const RecentEmergencyActivity = ({ alerts = [], loading = false }) => {
  // Show the latest 5 alerts
  const recentAlerts = useMemo(() => {
    return alerts.slice(0, 5);
  }, [alerts]);

  if (loading) {
    return (
      <div className="glass-card p-6 flex flex-col h-[400px] animate-pulse bg-white/5" />
    );
  }

  return (
    <div className="glass-card p-6 flex flex-col h-[400px] overflow-hidden relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
          Recent Emergency Activity
        </h3>
        <div className="flex items-center gap-1.5 text-[8px] font-mono text-neonCyan uppercase tracking-widest bg-neonCyan/10 px-2 py-0.5 rounded-full">
          <span className="w-1 h-1 rounded-full bg-neonCyan animate-ping" />
          Live FEED
        </div>
      </div>

      {recentAlerts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center flex-col">
          <Clock size={40} className="text-neonCyan/30 mb-3 animate-pulse" />
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">
            No activity logged
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
          <AnimatePresence initial={false}>
            {recentAlerts.map((alert) => {
              const isActive = alert.alert_status === 'ACTIVE';
              return (
                <motion.div
                  key={alert.id || alert.created_at}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-start justify-between gap-4 transition-all hover:bg-white/10 hover:border-white/10 relative overflow-hidden group"
                >
                  {/* Left edge neon stripe */}
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${isActive ? 'bg-neonRed' : 'bg-neonGreen'}`} />

                  <div className="flex-1 min-w-0 pl-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-1 text-gray-400 font-mono text-[9px] uppercase tracking-wider">
                        <Clock size={10} className="text-neonCyan" />
                        {formatAlertTime(alert.created_at)}
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 font-mono text-[9px] uppercase tracking-wider truncate max-w-[120px]">
                        <User size={10} className="text-neonCyan" />
                        {alert.user_name || 'Unknown'}
                      </div>
                    </div>

                    <p className="text-white text-xs font-semibold uppercase tracking-wider line-clamp-1">
                      {alert.emergency_message || 'Emergency Signal Broadcast'}
                    </p>
                    
                    <div className="mt-1 flex items-center gap-2 text-[8px] text-gray-500 uppercase tracking-widest font-mono">
                      <span>Lat: {Number(alert.latitude).toFixed(4)}</span>
                      <span>Lng: {Number(alert.longitude).toFixed(4)}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div
                      className={`flex items-center gap-1 text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full ${
                        isActive
                          ? 'bg-neonRed/10 border border-neonRed/35 text-neonRed shadow-[0_0_8px_rgba(255,0,85,0.15)]'
                          : 'bg-neonGreen/10 border border-neonGreen/35 text-neonGreen shadow-[0_0_8px_rgba(57,255,20,0.15)]'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <ShieldAlert size={10} className="animate-pulse" />
                          Active
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={10} />
                          Resolved
                        </>
                      )}
                    </div>
                    {alert.signal_strength && (
                      <span className="text-[8px] font-mono text-gray-600 uppercase">
                        RSSI: {alert.signal_strength} dBm
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

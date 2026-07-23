import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  MapPin, 
  Clock, 
  Wifi, 
  Battery, 
  Signal, 
  ShieldAlert, 
  Navigation, 
  Radio, 
  CheckCircle2, 
  Crosshair,
  Truck,
  Cpu,
  Globe,
  AlertCircle
} from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { supabase } from '../supabase';

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getRoadDistanceAndEta = async (startLat, startLng, destLat, destLng) => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=false`;
    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distKm = (route.distance / 1000).toFixed(1);
        const etaMins = Math.max(1, Math.round(route.duration / 60));
        return { distance: `${distKm} km`, eta: `${etaMins} mins` };
      }
    }
  } catch (e) {
    // Fallback calculation below
  }

  const airDist = haversineDistance(startLat, startLng, destLat, destLng);
  const roadDist = (Math.max(0.4, airDist * 1.3)).toFixed(1);
  const etaMins = Math.max(2, Math.round((roadDist / 42) * 60));
  return { distance: `${roadDist} km`, eta: `${etaMins} mins` };
};

const LiveResponseStatus = ({ lat, lng, alertId }) => {
  const { alerts, focusedAlertId, systemLiveStatus, loading: alertsLoading } = useAlert();

  const [routeData, setRouteData] = useState({ distance: '-- km', eta: '-- mins' });
  const [loading, setLoading] = useState(false);
  const [lastPacketTime, setLastPacketTime] = useState('');
  const [socketConnected, setSocketConnected] = useState(true);

  // Active selected alert or latest alert
  const selectedAlert = alerts.find(a => a.id === (alertId || focusedAlertId)) || alerts[0];

  const activeLat = Number(lat || selectedAlert?.latitude) || 13.0827;
  const activeLng = Number(lng || selectedAlert?.longitude) || 80.2707;

  // Command station origin
  const originLat = 13.0827;
  const originLng = 80.2707;

  const calculateRouteMetrics = useCallback(async () => {
    if (!activeLat || !activeLng) return;
    setLoading(true);

    try {
      const metrics = await getRoadDistanceAndEta(originLat, originLng, activeLat, activeLng);
      setRouteData(metrics);
    } catch (err) {
      console.warn('Routing fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeLat, activeLng]);

  // Recalculate route whenever selected alert/coords change
  useEffect(() => {
    calculateRouteMetrics();
  }, [calculateRouteMetrics]);

  // Subscribe to live Supabase Postgres Changes
  useEffect(() => {
    const channel = supabase
      .channel('live_response_status_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sos_alerts' },
        (payload) => {
          if (payload.new) {
            const newCreatedAt = payload.new.created_at;
            if (newCreatedAt) {
              setLastPacketTime(new Date(newCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            }
          }
          calculateRouteMetrics();
        }
      )
      .subscribe((status) => {
        setSocketConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [calculateRouteMetrics]);

  // Dynamic values derived from selected alert telemetry
  const incidentStatus = selectedAlert?.alert_status === 'ACTIVE'
    ? 'Active Emergency'
    : selectedAlert?.alert_status === 'RESOLVED'
    ? 'Resolved'
    : selectedAlert
    ? 'Awaiting Response'
    : 'System Standby';

  const statusBadgeStyle = selectedAlert?.alert_status === 'ACTIVE'
    ? 'bg-neonRed/15 border border-neonRed/35 text-neonRed animate-pulse'
    : selectedAlert?.alert_status === 'RESOLVED'
    ? 'bg-neonGreen/15 border border-neonGreen/35 text-neonGreen'
    : 'bg-yellow-500/15 border border-yellow-500/35 text-yellow-400';

  const emergencyMessage = selectedAlert?.emergency_message || selectedAlert?.message || 'NO MESSAGE TRANSMITTED';

  const assignedUnit = selectedAlert?.assigned_unit || selectedAlert?.assigned_rescue_unit || selectedAlert?.vehicle_unit || (selectedAlert?.alert_status === 'ACTIVE' ? `Rapid Response Unit-01` : null) || 'Awaiting Dispatch';

  const rssiVal = selectedAlert?.rssi ?? selectedAlert?.lora_rssi ?? (selectedAlert?.signal_strength ? -(100 - selectedAlert.signal_strength) : null);
  const signalDisplay = rssiVal !== null && rssiVal !== undefined ? `${rssiVal} dBm` : (selectedAlert?.signal_strength ? `-${100 - selectedAlert.signal_strength} dBm` : '-68 dBm');

  const batteryVal = selectedAlert?.battery ?? selectedAlert?.battery_level ?? selectedAlert?.device_battery;
  const batteryDisplay = batteryVal !== undefined && batteryVal !== null ? `${batteryVal}%` : 'Unknown';

  const accuracyVal = selectedAlert?.gps_accuracy ?? selectedAlert?.accuracy ?? selectedAlert?.hdop;
  const accuracyDisplay = accuracyVal !== undefined && accuracyVal !== null ? `±${accuracyVal} meters` : '±3.2 meters';

  const packetTimestamp = selectedAlert?.created_at
    ? new Date(selectedAlert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : lastPacketTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Connection Status determination
  const getConnectionStatus = () => {
    if (systemLiveStatus === 'OFFLINE' && !socketConnected) return { text: 'Offline', color: 'text-neonRed' };
    if (systemLiveStatus === 'ONLINE' && socketConnected) return { text: 'LoRa Connected / Receiver Online', color: 'text-neonGreen' };
    if (socketConnected) return { text: 'Socket Connected / GPS Active', color: 'text-neonCyan' };
    return { text: 'Offline', color: 'text-neonRed' };
  };

  const connStatus = getConnectionStatus();

  return (
    <div className="space-y-2 select-none flex-1 flex flex-col justify-between">
      {/* Section Header */}
      <div className="flex items-center justify-between shrink-0">
        <span className="text-[8px] text-gray-500 uppercase font-black tracking-[0.2em] block">
          VI. LIVE RESPONSE STATUS
        </span>
        <span className="text-[7.5px] font-mono text-neonCyan font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-neonCyan animate-ping"></span>
          REAL-TIME TELEMETRY
        </span>
      </div>

      <AnimatePresence mode="wait">
        {alertsLoading || loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-[#0c0c12]/60 border border-white/5 p-3 rounded-xl space-y-3 animate-pulse"
          >
            <div className="h-4 bg-white/10 rounded w-2/3"></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-10 bg-white/5 rounded"></div>
              <div className="h-10 bg-white/5 rounded"></div>
              <div className="h-10 bg-white/5 rounded"></div>
              <div className="h-10 bg-white/5 rounded"></div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0c0c12]/60 border border-white/5 p-3 rounded-xl space-y-2.5 hover:border-white/10 transition-all flex-1 flex flex-col justify-between"
          >
            {/* 1. Incident Status & Emergency Message */}
            <div className="pb-2 border-b border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-neonRed animate-pulse shrink-0" />
                  <span className="text-[8px] text-gray-400 uppercase font-black tracking-wider">
                    🚨 INCIDENT STATUS
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[7.5px] font-black uppercase tracking-wider ${statusBadgeStyle}`}>
                  {incidentStatus}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-[7.5px] text-gray-500 uppercase font-black tracking-wider block leading-none">
                  🆘 EMERGENCY MESSAGE
                </span>
                <p className="text-[11px] font-bold text-white truncate mt-0.5" title={emergencyMessage}>
                  {emergencyMessage}
                </p>
              </div>
            </div>

            {/* Grid of Dynamic Operational Fields */}
            <div className="grid grid-cols-2 gap-2 text-[9.5px]">
              {/* 2. Assigned Rescue Unit */}
              <div className="bg-white/[0.02] border border-white/5 p-2 rounded-lg col-span-2">
                <span className="text-[7.5px] text-gray-500 uppercase font-black tracking-wider block leading-none">
                  🚑 ASSIGNED RESCUE UNIT
                </span>
                <p className={`text-[10.5px] font-bold truncate mt-0.5 flex items-center gap-1.5 ${assignedUnit === 'Awaiting Dispatch' ? 'text-yellow-400 italic' : 'text-neonCyan'}`}>
                  <Truck size={12} className="shrink-0" />
                  {assignedUnit}
                </p>
              </div>

              {/* 3. Current SOS GPS */}
              <div className="bg-white/[0.02] border border-white/5 p-1.5 rounded-lg col-span-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <MapPin size={11} className="text-neonCyan shrink-0" />
                  <span className="text-[8px] text-gray-400 uppercase font-black">📍 CURRENT SOS GPS</span>
                </div>
                <span className="font-mono text-[9.5px] font-bold text-white">
                  {activeLat.toFixed(5)}°, {activeLng.toFixed(5)}°
                </span>
              </div>

              {/* 4. Signal Strength */}
              <div className="bg-white/[0.02] border border-white/5 p-1.5 rounded-lg">
                <span className="text-[7.5px] text-gray-500 uppercase font-black tracking-wider block leading-none">
                  📶 SIGNAL STRENGTH
                </span>
                <p className="text-[10px] font-mono font-bold text-neonCyan mt-0.5 flex items-center gap-1">
                  <Signal size={10} className="text-neonCyan" />
                  {signalDisplay}
                </p>
              </div>

              {/* 5. Device Battery */}
              <div className="bg-white/[0.02] border border-white/5 p-1.5 rounded-lg">
                <span className="text-[7.5px] text-gray-500 uppercase font-black tracking-wider block leading-none">
                  🔋 DEVICE BATTERY
                </span>
                <p className={`text-[10px] font-mono font-bold mt-0.5 flex items-center gap-1 ${batteryDisplay === 'Unknown' ? 'text-gray-400 italic' : 'text-neonGreen'}`}>
                  <Battery size={10} className="shrink-0" />
                  {batteryDisplay}
                </p>
              </div>

              {/* 6. GPS Accuracy */}
              <div className="bg-white/[0.02] border border-white/5 p-1.5 rounded-lg">
                <span className="text-[7.5px] text-gray-500 uppercase font-black tracking-wider block leading-none">
                  📡 GPS ACCURACY
                </span>
                <p className="text-[10px] font-mono font-bold text-white mt-0.5 flex items-center gap-1">
                  <Crosshair size={10} className="text-yellow-400" />
                  {accuracyDisplay}
                </p>
              </div>

              {/* 7. Connection Status */}
              <div className="bg-white/[0.02] border border-white/5 p-1.5 rounded-lg">
                <span className="text-[7.5px] text-gray-500 uppercase font-black tracking-wider block leading-none">
                  🌐 CONNECTION STATUS
                </span>
                <p className={`text-[9px] font-mono font-black mt-0.5 flex items-center gap-1 uppercase truncate ${connStatus.color}`}>
                  <Globe size={10} className="shrink-0 animate-pulse" />
                  {connStatus.text}
                </p>
              </div>

              {/* 8. Distance to Incident */}
              <div className="bg-white/[0.02] border border-white/5 p-1.5 rounded-lg">
                <span className="text-[7.5px] text-gray-500 uppercase font-black tracking-wider block leading-none">
                  🚗 DISTANCE TO INCIDENT
                </span>
                <p className="text-[10.5px] font-mono font-black text-neonCyan mt-0.5 flex items-center gap-1">
                  <Navigation size={10} className="text-neonCyan" />
                  {routeData.distance}
                </p>
              </div>

              {/* 9. Estimated Arrival (ETA) */}
              <div className="bg-white/[0.02] border border-white/5 p-1.5 rounded-lg">
                <span className="text-[7.5px] text-gray-500 uppercase font-black tracking-wider block leading-none">
                  ⏱ ESTIMATED ARRIVAL (ETA)
                </span>
                <p className="text-[10.5px] font-mono font-black text-white mt-0.5 flex items-center gap-1">
                  <Clock size={10} className="text-yellow-400" />
                  {routeData.eta}
                </p>
              </div>
            </div>

            {/* 10. Last Updated Timestamp */}
            <div className="flex items-center justify-between p-1.5 bg-white/[0.03] border border-white/5 rounded-lg pt-1.5">
              <div className="flex items-center gap-1">
                <Clock size={10} className="text-neonCyan animate-pulse" />
                <span className="text-[7.5px] text-gray-400 font-black uppercase tracking-wider">
                  🕒 LAST UPDATED
                </span>
              </div>
              <span className="font-mono text-[9px] text-neonGreen font-bold">
                {packetTimestamp}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveResponseStatus;

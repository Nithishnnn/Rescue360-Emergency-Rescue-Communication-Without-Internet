import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabase';
import { 
  Radio, 
  Smartphone, 
  Database, 
  Cpu, 
  ShieldAlert,
  Wifi, 
  CheckCircle2, 
  Activity, 
  Clock, 
  Globe 
} from 'lucide-react';

import { useAlert } from '../context/AlertContext';

const Settings = () => {
  const { alerts, loading: globalLoading, error: globalError } = useAlert();

  const alertsCount = alerts.length;
  const latestAlert = alerts[0] || null;
  const loading = globalLoading;

  // Real-time diagnostics metrics
  const [uptime, setUptime] = useState('0h 0m 0s');
  const [cpu, setCpu] = useState(14);
  const [memory, setMemory] = useState(182.4);

  const dbStatus = globalError ? 'OFFLINE' : 'CONNECTED';
  const gatewayStatus = alerts.length > 0 ? 'ONLINE' : 'OFFLINE';
  const wifiStatus = 'CONNECTED';
  const espStatus = alerts.length > 0 ? 'ONLINE' : 'OFFLINE';
  const gpsStatus = 'ACTIVE';
  const bluetoothStatus = 'STANDBY';

  // Uptime Counter
  useEffect(() => {
    const bootTime = Date.now() - 7248000; // Simulated 2h 0m 48s uptime on page load
    const interval = setInterval(() => {
      const diff = Date.now() - bootTime;
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setUptime(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // CPU and Memory Fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setCpu((prev) => {
        const delta = (Math.random() - 0.5) * 5;
        return Math.max(8, Math.min(85, Math.round(prev + delta)));
      });
      setMemory((prev) => {
        const delta = (Math.random() - 0.5) * 3;
        return Number(Math.max(160, Math.min(280, prev + delta)).toFixed(1));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Reusable card layout component
  const TelemetryCard = ({ icon: Icon, title, description, children }) => (
    <div className="glass-card p-6 border-white/5 bg-[#0e0e14]/75 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-neonCyan/5 to-transparent blur-xl pointer-events-none" />
      <div className="flex items-start gap-4 mb-6 relative z-10">
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shadow-[inset_0_0_8px_rgba(255,255,255,0.03)] group-hover:border-neonCyan/40 transition-colors">
          <Icon className="text-neonCyan group-hover:scale-110 transition-transform" size={20} />
        </div>
        <div>
          <h3 className="text-white font-bold tracking-tight uppercase text-sm">{title}</h3>
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{description}</p>
        </div>
      </div>
      <div className="space-y-4 relative z-10">
        {children}
      </div>
    </div>
  );

  // Status Indicator helper
  const StatusIndicator = ({ label, status }) => {
    const isOnline = status === 'ONLINE' || status === 'CONNECTED' || status === 'ACTIVE';
    const isStandby = status === 'STANDBY';
    
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            isOnline 
              ? 'bg-neonGreen shadow-[0_0_8px_#39ff14] animate-pulse' 
              : isStandby 
              ? 'bg-orange-500 shadow-[0_0_8px_#f97316]' 
              : 'bg-neonRed shadow-[0_0_8px_#ff0055]'
          }`} />
          <span className={`text-[10px] font-black uppercase tracking-widest font-mono ${
            isOnline 
              ? 'text-neonGreen' 
              : isStandby 
              ? 'text-orange-500' 
              : 'text-neonRed'
          }`}>
            {status}
          </span>
        </div>
      </div>
    );
  };

  // Metric row helper
  const MetricRow = ({ label, value, highlight = false }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-black font-mono tracking-wider ${highlight ? 'text-neonCyan' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
      <Navbar pageTitle="System Monitoring Dashboard" />
      
      <main className="p-8 flex-1 max-w-5xl">
        <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Live Node Telemetry</h1>
            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">Real-time Health and Receiver Status Monitoring</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            <Activity className="text-neonCyan animate-pulse" size={12} />
            Diagnostics Active
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card h-[250px] animate-pulse bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. LoRa Gateway Status */}
            <TelemetryCard 
              icon={Radio} 
              title="LoRa Gateway" 
              description="Hardware receiver diagnostics"
            >
              <StatusIndicator label="Gateway Connection" status={gatewayStatus} />
              <MetricRow label="Operating Frequency" value="433.00 MHz" />
              <MetricRow label="Latest RSSI Signal" value={latestAlert ? `${latestAlert.signal_strength} dBm` : '-104 dBm'} highlight={true} />
              <MetricRow label="Packets Received" value={alertsCount} />
            </TelemetryCard>

            {/* 2. Network & Hardware */}
            <TelemetryCard 
              icon={Smartphone} 
              title="Network & Receivers" 
              description="Peripherals connection status"
            >
              <StatusIndicator label="WiFi Connection" status={wifiStatus} />
              <StatusIndicator label="ESP32 Receiver" status={espStatus} />
              <StatusIndicator label="GPS Tracking Module" status={gpsStatus} />
              <StatusIndicator label="Bluetooth Interface" status={bluetoothStatus} />
            </TelemetryCard>

            {/* 3. Database Synchronization */}
            <TelemetryCard 
              icon={Database} 
              title="Database Sync" 
              description="Central command storage synclog"
            >
              <StatusIndicator label="Database Node Link" status={dbStatus} />
              <MetricRow label="Total SOS Records" value={alertsCount} />
              <MetricRow label="Last Upload Log" value={latestAlert ? new Date(latestAlert.created_at).toLocaleTimeString() : 'N/A'} />
              <MetricRow label="Sync Protocol latency" value="42 ms" />
            </TelemetryCard>

            {/* 4. Processor Diagnostics */}
            <TelemetryCard 
              icon={Cpu} 
              title="System Diagnostics" 
              description="Core load and operating parameters"
            >
              <MetricRow label="CPU Utilization" value={`${cpu} %`} highlight={true} />
              <MetricRow label="ESP Heap Memory" value={`${memory} KB`} />
              <MetricRow label="System Uptime" value={uptime} />
              <MetricRow label="Latest SOS Received" value={latestAlert ? new Date(latestAlert.created_at).toLocaleTimeString() : 'N/A'} />
            </TelemetryCard>

          </div>
        )}

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-white/5">
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-white/5 text-gray-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
          >
            Force Sync Diagnostic
          </button>
          <div className="px-6 py-2.5 bg-neonCyan/10 border border-neonCyan/35 text-neonCyan rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_10px_rgba(0,242,255,0.15)] flex items-center gap-2">
            <Clock size={12} className="animate-spin" style={{ animationDuration: '4s' }} />
            Automatic Refreshing
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;

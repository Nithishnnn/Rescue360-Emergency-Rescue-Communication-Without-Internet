import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';
import { ShieldAlert, Radio, Terminal, Activity, Wifi, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const Welcome = () => {
  const navigate = useNavigate();
  const { startSession } = useAlert();

  const handleInitialize = () => {
    startSession();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid relative overflow-hidden px-4">
      {/* Sleek Cyber Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neonCyan/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-neonRed/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass-card max-w-2xl w-full border border-white/10 bg-[#0e0e14]/75 p-8 sm:p-12 relative z-10 shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
      >
        {/* Futuristic Corner Deco */}
        <div className="absolute top-0 left-0 w-6 h-[2px] bg-neonCyan"></div>
        <div className="absolute top-0 left-0 w-[2px] h-6 bg-neonCyan"></div>
        <div className="absolute bottom-0 right-0 w-6 h-[2px] bg-neonCyan"></div>
        <div className="absolute bottom-0 right-0 w-[2px] h-6 bg-neonCyan"></div>

        {/* Brand Banner */}
        <div className="flex flex-col items-center mb-10 text-center">
          <motion.div 
            animate={{ 
              boxShadow: [
                '0 0 15px rgba(0, 242, 255, 0.4)',
                '0 0 30px rgba(0, 242, 255, 0.6)',
                '0 0 15px rgba(0, 242, 255, 0.4)'
              ]
            }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="w-16 h-16 bg-neonCyan/10 border border-neonCyan rounded-2xl flex items-center justify-center text-neonCyan mb-6"
          >
            <ShieldAlert size={36} />
          </motion.div>
          
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white uppercase leading-none">
            Rescue<span className="text-neonCyan text-glow">360°</span>
          </h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-3">
            Emergency Command & Telemetry Suite
          </p>
        </div>

        {/* Terminal/Status Display Panel */}
        <div className="bg-black/50 border border-white/5 rounded-xl p-6 mb-10 font-mono text-xs text-left space-y-3.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-neonRed/10 border-l border-b border-neonRed/20 text-neonRed font-black px-2.5 py-1 text-[8.5px] uppercase tracking-widest animate-pulse">
            Session: Standby
          </div>

          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-neonCyan">&gt;</span>
            <span>SYSTEM MONITORING DEACTIVATED</span>
          </div>

          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-neonCyan">&gt;</span>
            <span>All background listeners and live telemetry streams are currently stopped.</span>
          </div>

          {/* Subsystems matrix */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-4 border-t border-white/5 mt-4">
            <div className="flex items-center justify-between text-gray-500 text-[10px]">
              <span className="flex items-center gap-1.5 uppercase font-bold"><Terminal size={10} /> LoRa Node Pipeline</span>
              <span className="text-orange-500/80 font-bold uppercase tracking-wider">Standby</span>
            </div>
            <div className="flex items-center justify-between text-gray-500 text-[10px]">
              <span className="flex items-center gap-1.5 uppercase font-bold"><Wifi size={10} /> Gateway Listener</span>
              <span className="text-neonRed/80 font-bold uppercase tracking-wider">Inactive</span>
            </div>
            <div className="flex items-center justify-between text-gray-500 text-[10px]">
              <span className="flex items-center gap-1.5 uppercase font-bold"><Activity size={10} /> Live Diagnostics</span>
              <span className="text-orange-500/80 font-bold uppercase tracking-wider">Standby</span>
            </div>
            <div className="flex items-center justify-between text-gray-500 text-[10px]">
              <span className="flex items-center gap-1.5 uppercase font-bold"><Globe size={10} /> Supabase Sync Channel</span>
              <span className="text-neonRed/80 font-bold uppercase tracking-wider">Disconnected</span>
            </div>
          </div>
        </div>

        {/* Actions Button */}
        <div className="flex flex-col items-center justify-center gap-4">
          <button
            onClick={handleInitialize}
            className="w-full sm:w-auto relative px-10 py-4 bg-neonCyan/10 hover:bg-neonCyan/25 border-2 border-neonCyan text-neonCyan hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] text-xs font-black rounded-2xl transition-all duration-300 uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.03] active:scale-[0.97]"
          >
            <Radio className="animate-pulse" size={16} />
            Initialize Monitoring Session
          </button>
          
          <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest pt-2">
            Clearance Level 5 Operator Credentials Verified
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Welcome;

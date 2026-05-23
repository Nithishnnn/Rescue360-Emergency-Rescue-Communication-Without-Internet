import React from 'react';
import { Radio, Signal, Battery, Cpu, Wifi } from 'lucide-react';

const StatusPanel = ({ status }) => {
  const { loraConnected, gpsActive, receiverOnline, battery, signalStrength } = status;

  const StatusItem = ({ icon: Icon, label, isActive, value, colorClass }) => (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-neonCyan/10 text-neonCyan shadow-neon-cyan' : 'bg-gray-500/10 text-gray-500'}`}>
          <Icon size={20} className={isActive ? 'animate-pulse' : ''} />
        </div>
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-widest">{label}</p>
          <p className={`font-bold ${isActive ? 'text-white' : 'text-gray-600'}`}>
            {isActive ? 'ONLINE' : 'OFFLINE'}
          </p>
        </div>
      </div>
      {value && (
        <span className={`text-lg font-mono font-bold ${colorClass}`}>
          {value}
        </span>
      )}
    </div>
  );

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-white">
        <Cpu className="text-neonCyan shadow-neon-cyan" />
        Device Infrastructure
      </h2>
      
      <div className="space-y-4 flex-1">
        <StatusItem 
          icon={Wifi} 
          label="LoRa Link" 
          isActive={loraConnected} 
        />
        <StatusItem 
          icon={Radio} 
          label="Receiver Node" 
          isActive={receiverOnline} 
        />
        <StatusItem 
          icon={Signal} 
          label="GPS Satellite" 
          isActive={gpsActive} 
          value={`${signalStrength} dBm`}
          colorClass="text-neonCyan"
        />
        <StatusItem 
          icon={Battery} 
          label="Sender Battery" 
          isActive={true} 
          value={`${battery}%`}
          colorClass={battery > 20 ? 'text-neonGreen' : 'text-neonRed'}
        />
      </div>

      <div className="mt-8 p-4 bg-neonCyan/5 border border-neonCyan/20 rounded-xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-neonCyan text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Last Sync</p>
          <p className="text-white font-mono text-sm">2026-05-10 16:44:16</p>
        </div>
        <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-neonCyan/20 to-transparent blur-xl"></div>
      </div>
    </div>
  );
};

export default StatusPanel;

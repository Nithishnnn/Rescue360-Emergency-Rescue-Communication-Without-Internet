import React from 'react';
import { Wifi, Signal, Battery, Cpu, Activity } from 'lucide-react';

const StatusCard = ({ status }) => {
  const { loraConnected, gpsActive, receiverOnline, battery, signalStrength } = status;

  const StatusItem = ({ icon: Icon, label, isActive, value, colorClass }) => (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${isActive ? 'bg-neonCyan/10 text-neonCyan shadow-neon-cyan' : 'bg-gray-500/10 text-gray-500'}`}>
          <Icon size={18} className={isActive ? 'animate-pulse' : ''} />
        </div>
        <div>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">{label}</p>
          <p className={`text-xs font-black ${isActive ? 'text-white' : 'text-gray-600'}`}>
            {isActive ? 'NOMINAL' : 'OFFLINE'}
          </p>
        </div>
      </div>
      {value !== undefined && (
        <span className={`text-lg font-mono font-black ${colorClass}`}>
          {value}
        </span>
      )}
    </div>
  );

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold flex items-center gap-2 text-white">
          <Activity className="text-neonCyan shadow-neon-cyan" size={20} />
          Telemetry Status
        </h2>
        <span className="text-[10px] text-neonCyan font-bold tracking-[0.2em] animate-pulse">LIVE REFRESH</span>
      </div>
      
      <div className="space-y-3 flex-1">
        <StatusItem 
          icon={Wifi} 
          label="LoRa Mesh Network" 
          isActive={loraConnected} 
        />
        <StatusItem 
          icon={Signal} 
          label="GPS Satellite" 
          isActive={gpsActive} 
          value={`${signalStrength}dB`}
          colorClass="text-neonCyan"
        />
        <StatusItem 
          icon={Battery} 
          label="Sender Energy" 
          isActive={true} 
          value={`${battery}%`}
          colorClass={battery > 20 ? 'text-neonGreen' : 'text-neonRed'}
        />
        <StatusItem 
          icon={Cpu} 
          label="Receiver Processor" 
          isActive={receiverOnline} 
        />
      </div>

      <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Signal Integrity</span>
          <span className="text-[10px] text-neonCyan font-bold">98.4%</span>
        </div>
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
          <div className="bg-neonCyan h-full shadow-neon-cyan" style={{ width: '98.4%' }}></div>
        </div>
      </div>
    </div>
  );
};

export default StatusCard;

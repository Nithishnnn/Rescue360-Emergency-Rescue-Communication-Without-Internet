import React from 'react';
import Navbar from '../components/Navbar';
import { Settings as SettingsIcon, Shield, Database, Radio, BellRing, Smartphone } from 'lucide-react';

const Settings = () => {
  const SettingSection = ({ icon: Icon, title, description, children }) => (
    <div className="glass-card p-6 mb-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
          <Icon className="text-gray-400" size={20} />
        </div>
        <div>
          <h3 className="text-white font-bold tracking-tight">{title}</h3>
          <p className="text-gray-500 text-xs font-medium">{description}</p>
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const Toggle = ({ active }) => (
    <div className={`w-10 h-5 rounded-full p-1 transition-colors ${active ? 'bg-neonCyan/30' : 'bg-white/5'}`}>
      <div className={`w-3 h-3 rounded-full transition-transform ${active ? 'bg-neonCyan translate-x-5 shadow-neon-cyan' : 'bg-gray-600'}`}></div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar pageTitle="System Configuration" />
      
      <main className="p-8 flex-1 max-w-4xl">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Protocol Parameters</h1>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">Configure Central Command Operations</p>
        </div>

        <SettingSection 
          icon={Shield} 
          title="Security Protocols" 
          description="Manage encryption keys and access authorization levels."
        >
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm text-gray-300">Biometric Verification Override</span>
            <Toggle active={true} />
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm text-gray-300">256-Bit Signal Encryption</span>
            <Toggle active={true} />
          </div>
        </SettingSection>

        <SettingSection 
          icon={Radio} 
          title="LoRa Gateway" 
          description="Hardware interface and transmission frequency settings."
        >
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Base Frequency (MHz)</label>
            <input 
              type="text" 
              defaultValue="868.0" 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:neon-border-cyan"
            />
          </div>
        </SettingSection>

        <SettingSection 
          icon={BellRing} 
          title="Notification Matrix" 
          description="Alert priority and dispatch automated triggers."
        >
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm text-gray-300">Audible Emergency Pulse</span>
            <Toggle active={true} />
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm text-gray-300">Automated SMS Broadcast</span>
            <Toggle active={false} />
          </div>
        </SettingSection>

        <SettingSection 
          icon={Database} 
          title="Storage Architecture" 
          description="Firestore synchronization and log retention policies."
        >
           <button className="px-6 py-3 bg-neonCyan/10 border border-neonCyan/30 text-neonCyan rounded-xl text-xs font-black tracking-widest hover:bg-neonCyan transition-all hover:text-background uppercase">
             Purge Historical Cache
           </button>
        </SettingSection>

        <div className="flex justify-end gap-4 mt-10">
          <button className="px-8 py-3 bg-white/5 text-gray-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
            Reset Defaults
          </button>
          <button className="px-8 py-3 bg-neonCyan text-background rounded-xl text-xs font-black uppercase tracking-widest shadow-neon-cyan hover:scale-[1.05] transition-all">
            Save Protocols
          </button>
        </div>
      </main>
    </div>
  );
};

export default Settings;

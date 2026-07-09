import React from 'react';
import Navbar from '../components/Navbar';
import AlertTable from '../components/AlertTable';
import { useAlert } from '../context/AlertContext';
import { ShieldAlert, Download } from 'lucide-react';

const Alerts = () => {
  const { alerts, loading, error } = useAlert();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar pageTitle="Emergency Logs" />
      
      <main className="p-8 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-neonCyan/10 rounded-2xl flex items-center justify-center border border-neonCyan/20 shadow-neon-cyan">
              <ShieldAlert className="text-neonCyan" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Alert Command Vault</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-neonCyan animate-pulse"></span>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">
                  Encrypted Log Repository — {loading ? 'Synchronizing...' : 'Live Data Stream'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {!loading && !error && alerts.length === 0 && (
          <div className="mb-8 p-10 glass-card flex flex-col items-center justify-center border-dashed border-white/10">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <ShieldAlert className="text-gray-600" size={32} />
            </div>
            <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-2">No Signal Detected</h3>
            <p className="text-gray-500 text-xs text-center max-w-sm">
              The database table <code className="text-neonCyan font-mono">sos_alerts</code> appears to be empty. 
              Once a node transmits data to Supabase, it will appear here instantly.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all"
            >
              Force Re-Sync
            </button>
          </div>
        )}

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12">
            <AlertTable alerts={alerts} loading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Alerts;

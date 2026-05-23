import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, MapPin, X, Cpu, User } from 'lucide-react';

const NotificationPopup = ({ alert, onClose }) => {
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [alert, onClose]);

  const getTime = (iso) => iso ? new Date(iso).toLocaleTimeString() : 'Just now';

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full"
        >
          <div className="bg-[#0a0a0f] border border-red-500/50 rounded-2xl p-5 shadow-[0_0_40px_rgba(255,0,85,0.3)] relative overflow-hidden">
            <div className="absolute inset-0 animate-ping rounded-2xl border border-red-500/10 pointer-events-none" />
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center animate-pulse">
                  <ShieldAlert className="text-red-400" size={22} />
                </div>
                <div>
                  <p className="text-red-400 font-black uppercase tracking-[0.2em] text-[9px] mb-0.5">Incoming SOS Alert</p>
                  <p className="text-white font-bold text-sm leading-tight">{alert.emergency_message}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-600 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <User size={13} className="text-neonCyan" />
                  <span className="text-[10px] font-bold uppercase">{alert.user_name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Cpu size={12} />
                  <span className="text-[9px] font-mono">{alert.sender_device_id}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin size={13} className="text-neonRed" />
                <span className="text-[10px] font-mono">{alert.latitude}, {alert.longitude}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
               <span className="text-[10px] text-gray-600 font-mono">{getTime(alert.created_at)}</span>
               <a href={alert.google_map_link} target="_blank" rel="noreferrer" className="text-[10px] text-neonCyan font-black uppercase tracking-widest hover:underline">
                 Trace Signal →
               </a>
            </div>

            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-red-500 shadow-[0_0_10px_red]"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 8, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPopup;

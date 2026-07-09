import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';
import { ShieldAlert, CheckCircle2, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TerminationOverlays = () => {
  const navigate = useNavigate();
  const { 
    terminationState, 
    cancelTermination, 
    executeTermination 
  } = useAlert();

  if (terminationState === 'idle') return null;

  return (
    <AnimatePresence>
      {/* 1. Confirmation Dialog Modal */}
      {terminationState === 'confirming' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelTermination}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="glass-card relative max-w-md w-full border border-neonRed/35 bg-[#0a0a0f]/90 p-8 shadow-[0_0_30px_rgba(255,0,85,0.25)] z-10 overflow-hidden"
          >
            {/* Cyberpunk corner decorative lines */}
            <div className="absolute top-0 left-0 w-4 h-[2px] bg-neonRed"></div>
            <div className="absolute top-0 left-0 w-[2px] h-4 bg-neonRed"></div>
            <div className="absolute bottom-0 right-0 w-4 h-[2px] bg-neonRed"></div>
            <div className="absolute bottom-0 right-0 w-[2px] h-4 bg-neonRed"></div>

            {/* Glowing warning icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-neonRed/10 border border-neonRed/30 flex items-center justify-center shadow-[0_0_15px_rgba(255,0,85,0.2)] animate-pulse">
                <ShieldAlert className="text-neonRed" size={32} />
              </div>
            </div>

            {/* Warning Details */}
            <div className="text-center space-y-3">
              <h3 className="text-lg font-black tracking-widest text-white uppercase">
                Confirm Session Termination
              </h3>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Rescue360° Protocol Warning
              </p>
              <p className="text-gray-300 text-sm leading-relaxed pt-2">
                Are you sure you want to end the current Rescue360° monitoring session?
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={cancelTermination}
                className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 hover:border-white/20 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => executeTermination(navigate)}
                className="flex-1 py-3 px-4 rounded-xl bg-neonRed/20 border border-neonRed/50 hover:bg-neonRed/35 text-neonRed font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(255,0,85,0.15)]"
              >
                Terminate Session
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 2. Loading Spinner & Success Message Modal */}
      {(terminationState === 'terminating' || terminationState === 'completed') && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Darker backdrop to hide dashboard background and focus on status */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`glass-card relative max-w-sm w-full bg-[#07070b]/95 p-10 text-center z-10 border transition-colors duration-500 ${
              terminationState === 'completed' 
                ? 'border-neonGreen/30 shadow-[0_0_30px_rgba(57,255,20,0.2)]' 
                : 'border-neonCyan/30 shadow-[0_0_30px_rgba(0,242,255,0.2)]'
            }`}
          >
            {/* Corner styling matching theme */}
            <div className={`absolute top-0 left-0 w-4 h-[2px] transition-colors duration-500 ${terminationState === 'completed' ? 'bg-neonGreen' : 'bg-neonCyan'}`}></div>
            <div className={`absolute top-0 left-0 w-[2px] h-4 transition-colors duration-500 ${terminationState === 'completed' ? 'bg-neonGreen' : 'bg-neonCyan'}`}></div>
            <div className={`absolute bottom-0 right-0 w-4 h-[2px] transition-colors duration-500 ${terminationState === 'completed' ? 'bg-neonGreen' : 'bg-neonCyan'}`}></div>
            <div className={`absolute bottom-0 right-0 w-[2px] h-4 transition-colors duration-500 ${terminationState === 'completed' ? 'bg-neonGreen' : 'bg-neonCyan'}`}></div>

            <div className="mb-6 relative">
              {terminationState === 'terminating' ? (
                /* High-tech spinning loader */
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  {/* Outer circle spinning clockwise */}
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-neonCyan animate-spin"></div>
                  {/* Inner circle spinning counter-clockwise */}
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-neonRed animate-spin [animation-duration:0.8s] [animation-direction:reverse]"></div>
                  {/* Core pulsing cpu indicator */}
                  <div className="absolute inset-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                    <Cpu className="text-neonCyan/80" size={20} />
                  </div>
                </div>
              ) : (
                /* Glowing checkmark container */
                <motion.div 
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-16 h-16 bg-neonGreen/10 border border-neonGreen/30 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(57,255,20,0.2)]"
                >
                  <CheckCircle2 className="text-neonGreen" size={32} />
                </motion.div>
              )}
            </div>

            {/* Display message based on state */}
            {terminationState === 'terminating' ? (
              <div className="space-y-2">
                <h4 className="text-[10px] text-neonCyan font-black uppercase tracking-[0.25em]">
                  Disconnecting Pipeline
                </h4>
                <p className="text-gray-300 font-bold text-sm tracking-wide">
                  Ending monitoring session...
                </p>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest pt-2">
                  Unsubscribing listeners & clearing cache
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-[10px] text-neonGreen font-black uppercase tracking-[0.25em]">
                  Session Terminated
                </h4>
                <p className="text-gray-100 font-bold text-sm tracking-wide">
                  Monitoring session terminated successfully.
                </p>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest pt-2 animate-pulse">
                  Redirecting to Command Home
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TerminationOverlays;

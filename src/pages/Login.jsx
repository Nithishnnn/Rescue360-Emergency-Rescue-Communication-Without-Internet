import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Lock, User, ChevronRight } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, use firebase auth here
    onLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neonCyan/5 rounded-full blur-[120px]"></div>
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-neonRed/5 rounded-full blur-[100px]"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card p-10 w-full max-w-md relative z-10 border-white/10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-neonCyan rounded-2xl flex items-center justify-center shadow-neon-cyan mb-6 rotate-12 group-hover:rotate-0 transition-transform">
            <ShieldAlert className="text-background" size={32} />
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-white">RESCUE<span className="text-neonCyan text-glow">360°</span></h2>
          <p className="text-gray-500 text-sm mt-2 uppercase tracking-[0.3em]">Command Authorization</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Personnel ID</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="email" 
                placeholder="admin@rescue.ops"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:neon-border-cyan transition-all text-white placeholder:text-gray-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Access Cipher</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:neon-border-cyan transition-all text-white placeholder:text-gray-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-neonCyan text-background font-black py-4 rounded-2xl shadow-neon-cyan hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-8"
          >
            AUTHORIZE ACCESS
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-white/5 flex justify-between text-[10px] text-gray-600 font-bold uppercase tracking-widest">
          <span>Encrypted Session</span>
          <span>v4.2.0-STABLE</span>
        </div>
      </motion.div>

      {/* Floating particles background is handled by CSS or separate component */}
    </div>
  );
};

export default Login;

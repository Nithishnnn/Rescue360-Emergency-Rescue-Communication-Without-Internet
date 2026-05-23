import React from 'react';
import { motion } from 'framer-motion';
import { Bell, User, Settings, Search } from 'lucide-react';

const Navbar = ({ pageTitle }) => {
  return (
    <nav className="h-20 flex items-center justify-between px-8 bg-card backdrop-blur-md border-b border-white/5 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">{pageTitle}</h2>
        <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neonCyan transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search command vault..."
            className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:neon-border-cyan w-64 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-neonCyan/5 border border-neonCyan/20 rounded-full">
          <div className="w-2 h-2 bg-neonCyan rounded-full animate-ping"></div>
          <span className="text-neonCyan text-[10px] font-black uppercase tracking-tight">System Live</span>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-white transition-all relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-neonRed rounded-full shadow-neon-red"></span>
          </button>
          <button className="p-2 text-gray-400 hover:text-white transition-all">
            <Settings size={20} />
          </button>
          <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right">
              <p className="text-xs font-bold text-white leading-none">Cmdr. Admin</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Level 5 Clearance</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-neonCyan/20 border border-neonCyan/40 flex items-center justify-center group-hover:neon-border-cyan transition-all">
              <User size={18} className="text-neonCyan" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShieldAlert, BarChart2, Settings, LogOut, ChevronRight } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/alerts', icon: ShieldAlert, label: 'Emergency Logs' },
    { path: '/analytics', icon: BarChart2, label: 'Signal Intel' },
    { path: '/settings', icon: Settings, label: 'Protocols' },
  ];

  return (
    <aside className="w-64 h-screen bg-card border-r border-white/5 flex flex-col items-center py-8 relative">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-12 px-6">
        <div className="w-10 h-10 bg-neonRed rounded-2xl flex items-center justify-center shadow-neon-red animate-pulse rotate-3">
          <ShieldAlert className="text-white" size={24} />
        </div>
        <h1 className="text-xl font-black text-white tracking-tighter">RESCUE<span className="text-neonCyan">OPS</span></h1>
      </div>

      {/* Profile summary */}
      <div className="mb-10 px-6 w-full">
         <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neonCyan/20 flex items-center justify-center text-neonCyan font-bold text-xs uppercase">HQ</div>
            <div className="flex-1 overflow-hidden">
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">Station</p>
               <p className="text-xs font-bold text-white truncate">Central Command</p>
            </div>
         </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 w-full px-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group
              ${isActive 
                ? 'bg-neonCyan/10 text-neonCyan neon-border-cyan' 
                : 'text-gray-500 hover:bg-white/5 hover:text-white'}
            `}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} />
              <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
            </div>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="mt-auto w-full px-4 pt-10 border-t border-white/5">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-neonRed/80 hover:bg-neonRed/10 hover:text-neonRed rounded-xl transition-all font-bold text-xs uppercase tracking-widest">
          <LogOut size={20} />
          <span>Terminate Session</span>
        </button>
      </div>

      {/* Floating background decorative element */}
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-neonCyan/5 rounded-full blur-3xl pointer-events-none"></div>
    </aside>
  );
};

export default Sidebar;

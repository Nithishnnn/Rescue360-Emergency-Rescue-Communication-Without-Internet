import React from 'react';
import { motion } from 'framer-motion';

const AlertCard = ({ title, value, icon: Icon, color, trend }) => {
  const isCyan = color === 'cyan';
  
  return (
    <motion.div 
      whileHover={{ scale: 1.02, translateY: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 flex items-start justify-between min-w-[240px] flex-1 ${
        isCyan ? 'hover:neon-border-cyan' : 'hover:neon-border-red'
      } transition-all duration-300`}
    >
      <div>
        <p className="text-gray-400 text-xs mb-1 uppercase tracking-[0.2em]">{title}</p>
        <h3 className="text-3xl font-black mb-2 tracking-tighter text-white">
          {value}
        </h3>
        {trend && (
          <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block font-bold tracking-widest ${
            trend.startsWith('+') ? 'bg-neonCyan/20 text-neonCyan' : 'bg-neonRed/20 text-neonRed'
          }`}>
            {trend} TREND
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${
        isCyan ? 'bg-neonCyan/10 text-neonCyan shadow-neon-cyan' : 'bg-neonRed/10 text-neonRed shadow-neon-red'
      }`}>
        <Icon size={24} />
      </div>
    </motion.div>
  );
};

export default AlertCard;

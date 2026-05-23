import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, color, trend }) => {
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
        <p className="text-gray-400 text-sm mb-1 uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-bold mb-2 tracking-tight">
          {value}
        </h3>
        {trend && (
          <div className={`text-xs px-2 py-1 rounded-full inline-block ${
            trend.startsWith('+') ? 'bg-green-500/10 text-green-400' : 'bg-neonRed/10 text-neonRed'
          }`}>
            {trend} from yesterday
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

export default StatCard;

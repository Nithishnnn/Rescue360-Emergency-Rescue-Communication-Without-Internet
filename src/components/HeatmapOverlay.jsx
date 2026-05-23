import React from 'react';
import { motion } from 'framer-motion';

const HeatmapOverlay = ({ alerts }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      {/* Heatmap spots based on alert locations */}
      {alerts.map((alert, i) => (
        <motion.div
           key={i}
           initial={{ scale: 0, opacity: 0 }}
           animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
           transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
           style={{
             position: 'absolute',
             left: `${((alert.lng + 180) % 360) / 3.6}%`, // Mock projection
             top: `${(90 - alert.lat) / 1.8}%`,
             width: '100px',
             height: '100px',
             background: 'radial-gradient(circle, rgba(255,0,85,0.6) 0%, transparent 70%)',
             transform: 'translate(-50%, -50%)'
           }}
        />
      ))}
      
      {/* Route Tracking Line - SVG */}
      <svg className="absolute inset-0 w-full h-full">
        <motion.polyline
          points={alerts.map(a => `${((a.lng + 180) % 360) / 3.6},${(90 - a.lat) / 1.8}`).join(' ')}
          fill="none"
          stroke="rgba(0,242,255,0.4)"
          strokeWidth="2"
          strokeDasharray="5,5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
};

export default HeatmapOverlay;

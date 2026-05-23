import React from 'react';
import Navbar from '../components/Navbar';
import AnalyticsCard from '../components/AnalyticsCard';
import { BarChart2, TrendingUp, PieChart, Activity } from 'lucide-react';

const analyticsData = [
  { name: '00:00', intensity: 20, frequency: 10 },
  { name: '04:00', intensity: 45, frequency: 15 },
  { name: '08:00', intensity: 30, frequency: 25 },
  { name: '12:00', intensity: 70, frequency: 40 },
  { name: '16:00', intensity: 50, frequency: 30 },
  { name: '20:00', intensity: 40, frequency: 20 },
];

const Analytics = () => {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar pageTitle="Emergency Analytics" />
      
      <main className="p-8 flex-1">
        <div className="grid grid-cols-12 gap-8 mb-8">
           <div className="col-span-12">
             <div className="glass-card p-8 flex items-center justify-between overflow-hidden relative">
               <div>
                 <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Predictive Signal Analysis</h1>
                 <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Statistical Modeling of Emergency Propagation</p>
               </div>
               <div className="w-64 h-24 opacity-20">
                 {/* Visual decoration */}
                 <div className="flex items-end gap-1 h-full">
                   {[...Array(20)].map((_, i) => (
                     <div 
                      key={i} 
                      className="flex-1 bg-neonCyan animate-pulse" 
                      style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}
                     ></div>
                   ))}
                 </div>
               </div>
               <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-neonCyan/20 to-transparent blur-3xl pointer-events-none"></div>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <AnalyticsCard title="Emergency Intensity Index" data={analyticsData} dataKey="intensity" color="#00f2ff" />
          <AnalyticsCard title="Incoming Signal Frequency" data={analyticsData} dataKey="frequency" color="#ff0055" />
          <AnalyticsCard title="Network Latency Matrix" data={analyticsData} dataKey="frequency" color="#39ff14" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-6 flex flex-col h-[400px]">
             <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Geographic Distribution Density</h3>
             <div className="flex-1 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-grid opacity-10"></div>
                <div className="relative z-10 text-center">
                  <PieChart size={48} className="text-neonCyan mx-auto mb-4 opacity-50" />
                  <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">Data Processing Protocol Active</p>
                </div>
                <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="bg-neonCyan h-full shadow-neon-cyan animate-[shimmer_2s_infinite]" style={{ width: '64%' }}></div>
                </div>
             </div>
          </div>
          
          <div className="glass-card p-6 flex flex-col h-[400px]">
             <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Historical Response Correlation</h3>
             <div className="flex-1 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center relative overflow-hidden">
                <TrendingUp size={48} className="text-neonRed mx-auto mb-4 opacity-50" />
                <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">Synthesizing Historical Nodes...</p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;

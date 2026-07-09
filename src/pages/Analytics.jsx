import React from 'react';
import Navbar from '../components/Navbar';
import { AlertTrendLive, RSSIChartLive, DistanceChartLive } from '../components/LiveCharts';
import { EmergencyHotspotAnalysis, RecentEmergencyActivity } from '../components/LivePanels';
import { useAnalyticsRealtime } from '../hooks/useAnalyticsRealtime';

const Analytics = () => {
  const {
    trendData,
    rssiData,
    distanceData,
    alerts,
    loading,
    lastUpdate,
    newPointFlag,
    hasData,
  } = useAnalyticsRealtime();

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
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

        {/* ── Live Charts Grid (replaces static AnalyticsCards) ── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card h-[300px] animate-pulse bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <AlertTrendLive
              data={trendData}
              hasData={hasData}
              lastUpdate={lastUpdate}
              glowKey={`trend-${newPointFlag}`}
            />
            <RSSIChartLive
              data={rssiData}
              hasData={hasData}
              lastUpdate={lastUpdate}
              glowKey={`rssi-${newPointFlag}`}
            />
            <DistanceChartLive
              data={distanceData}
              hasData={hasData}
              lastUpdate={lastUpdate}
              glowKey={`dist-${newPointFlag}`}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <EmergencyHotspotAnalysis alerts={alerts} loading={loading} />
          <RecentEmergencyActivity alerts={alerts} loading={loading} />
        </div>
      </main>
    </div>
  );
};

export default Analytics;

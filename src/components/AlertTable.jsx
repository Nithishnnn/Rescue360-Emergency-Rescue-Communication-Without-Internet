import React, { useState } from 'react';
import { Search, Download, MapPin, ExternalLink, History, Cpu, User } from 'lucide-react';

const statusStyles = {
  ACTIVE: 'bg-red-500/20 text-red-400 border border-red-500/40',
  RESOLVED: 'bg-green-500/20 text-green-400 border border-green-500/40',
};

const statusDot = {
  ACTIVE: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]',
  RESOLVED: 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]',
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[...Array(6)].map((_, i) => (
      <td key={i} className="px-4 py-4">
        <div className="h-3 bg-white/10 rounded-full w-20"></div>
      </td>
    ))}
  </tr>
);

const AlertTable = ({ alerts = [], loading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatDate = (isoString) => {
    if (!isoString) return { date: '—', time: '—' };
    const d = new Date(isoString);
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  const filtered = alerts.filter(a => {
    const search = searchTerm.toLowerCase();
    return (
      a.emergency_message?.toLowerCase().includes(search) ||
      a.sender_device_id?.toLowerCase().includes(search) ||
      a.user_name?.toLowerCase().includes(search)
    );
  });

  const exportCSV = () => {
    const headers = 'Timestamp,Device ID,User,Message,Latitude,Longitude,Status\n';
    const rows = alerts.map(a => {
      const { date, time } = formatDate(a.created_at);
      return `${date} ${time},${a.sender_device_id},${a.user_name},${a.emergency_message},${a.latitude},${a.longitude},${a.alert_status}`;
    }).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sos-history.csv';
    link.click();
  };

  return (
    <div className="glass-card p-6 w-full overflow-hidden flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-bold flex items-center gap-2 text-white">
          <History className="text-neonCyan" size={20} />
          Alert Command Vault
          <span className="ml-2 px-2 py-0.5 rounded-full bg-neonCyan/10 text-neonCyan text-[10px] font-black border border-neonCyan/20">LIVE</span>
        </h2>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search history..."
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-neonCyan/50 w-64 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={exportCSV} className="p-2 bg-white/5 hover:bg-neonCyan/10 rounded-xl border border-white/10 text-gray-400 hover:text-neonCyan transition-all">
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar max-h-[500px]">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#0a0a0f] z-10">
            <tr className="text-gray-500 text-[10px] uppercase tracking-widest border-b border-white/5">
              <th className="px-4 py-3 font-bold">Timestamp</th>
              <th className="px-4 py-3 font-bold">Node ID</th>
              <th className="px-4 py-3 font-bold">User</th>
              <th className="px-4 py-3 font-bold">Signal Message</th>
              <th className="px-4 py-3 font-bold">Location</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? [...Array(4)].map((_, i) => <SkeletonRow key={i} />) : 
             filtered.map(alert => {
               const { date, time } = formatDate(alert.created_at);
                return (
                  <tr key={alert.id} className="hover:bg-white/5 transition-colors">
                   <td className="px-4 py-4">
                     <div className="flex flex-col">
                       <span className="text-white font-medium">{date}</span>
                       <span className="text-gray-500 text-[10px]">{time}</span>
                     </div>
                   </td>
                   <td className="px-4 py-4">
                     <div className="flex items-center gap-2">
                       <Cpu size={14} className="text-neonCyan/60" />
                       <span className="font-mono text-xs">{alert.sender_device_id}</span>
                     </div>
                   </td>
                   <td className="px-4 py-4">
                     <div className="flex items-center gap-2">
                       <User size={14} className="text-gray-500" />
                       <span className="text-white font-medium">{alert.user_name}</span>
                     </div>
                   </td>
                   <td className="px-4 py-4 max-w-[200px] truncate" title={alert.emergency_message}>
                     <span className={alert.alert_status === 'ACTIVE' ? 'text-red-400 font-bold' : 'text-gray-300'}>
                       {alert.emergency_message}
                     </span>
                   </td>
                   <td className="px-4 py-4">
                     <div className="flex items-center gap-1 text-gray-500 text-[10px] font-mono">
                       <MapPin size={12} className="text-neonCyan" />
                       {Number(alert.latitude).toFixed(4)}, {Number(alert.longitude).toFixed(4)}
                     </div>
                   </td>
                   <td className="px-4 py-4">
                     <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 w-fit ${statusStyles[alert.alert_status] || statusStyles.RESOLVED}`}>
                       <span className={`w-1.5 h-1.5 rounded-full ${statusDot[alert.alert_status] || statusDot.RESOLVED}`}></span>
                       {alert.alert_status}
                     </span>
                   </td>
                   <td className="px-4 py-4 text-center">
                     <a href={alert.google_map_link} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-neonCyan transition-colors">
                       <ExternalLink size={16} />
                     </a>
                   </td>
                 </tr>
               );
             })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertTable;

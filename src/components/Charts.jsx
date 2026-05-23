import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const data = [
  { name: '00:00', alerts: 4 },
  { name: '04:00', alerts: 10 },
  { name: '08:00', alerts: 15 },
  { name: '12:00', alerts: 25 },
  { name: '16:00', alerts: 18 },
  { name: '20:00', alerts: 12 },
];

const categoryData = [
  { name: 'SOS', value: 45, color: '#00f2ff' },
  { name: 'Medical', value: 30, color: '#ff0055' },
  { name: 'Fire', value: 15, color: '#ff9900' },
  { name: 'Security', value: 10, color: '#39ff14' },
];

export const AlertTrendChart = () => (
  <div className="glass-card p-6 h-[300px]">
    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Alert Intensity Trend (24h)</h3>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
        <XAxis 
          dataKey="name" 
          stroke="#555" 
          fontSize={10} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          stroke="#555" 
          fontSize={10} 
          tickLine={false} 
          axisLine={false} 
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
          itemStyle={{ color: '#00f2ff' }}
        />
        <Area 
          type="monotone" 
          dataKey="alerts" 
          stroke="#00f2ff" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorAlerts)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export const AlertDistributionChart = () => (
  <div className="glass-card p-6 h-[300px]">
    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Emergency Distribution</h3>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={categoryData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
        <XAxis 
          dataKey="name" 
          stroke="#555" 
          fontSize={10} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis hide />
        <Tooltip 
          cursor={{fill: 'rgba(255,255,255,0.05)'}}
          contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {categoryData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

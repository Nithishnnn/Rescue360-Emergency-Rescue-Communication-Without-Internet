import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';

const AnalyticsCard = ({ title, data, dataKey, color = "#00f2ff" }) => {
  return (
    <div className="glass-card p-6 h-[300px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">{title}</h3>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-neonCyan"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
        </div>
      </div>
      
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} strokeOpacity={0.5} />
            <XAxis 
              dataKey="name" 
              stroke="#555" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#666', fontWeight: 600 }}
            />
            <YAxis 
              stroke="#555" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#666', fontWeight: 600 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(5, 5, 5, 0.9)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}
              itemStyle={{ color: color, fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ color: '#fff', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}
            />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={3}
              fillOpacity={1} 
              fill={`url(#color-${dataKey})`} 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsCard;

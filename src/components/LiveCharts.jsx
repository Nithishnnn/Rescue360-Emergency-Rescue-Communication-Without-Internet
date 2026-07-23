import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';

// ─── Shared style atoms ────────────────────────────────────────
const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(5, 5, 5, 0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
  padding: '8px 12px',
};

const AXIS_PROPS = {
  stroke: '#444',
  fontSize: 9,
  tickLine: false,
  axisLine: false,
  tick: { fill: '#555', fontWeight: 700 },
};

const NoData = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="text-center">
      <div className="w-10 h-10 mx-auto mb-3 rounded-full border border-white/10 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
      </div>
      <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.25em]">
        No Live Data
      </p>
      <p className="text-gray-700 text-[8px] uppercase tracking-widest mt-1">
        Awaiting SOS Transmission...
      </p>
    </div>
  </div>
);

const LastUpdated = ({ time }) =>
  time ? (
    <span className="text-[8px] text-gray-600 font-mono uppercase">
      Last update: {time.toLocaleTimeString()}
    </span>
  ) : null;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1.  EMERGENCY ALERT TREND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const AlertTrendLive = ({ data, hasData, lastUpdate, glowKey }) => {
  const color = '#00f2ff';
  const gradientId = 'trendGrad';

  return (
    <div className="glass-card p-6 h-[300px] flex flex-col relative overflow-hidden group">
      {/* glow flash on new data */}
      <div
        key={glowKey}
        className="absolute inset-0 pointer-events-none opacity-0 animate-[neonFlash_0.6s_ease-out]"
        style={{ background: `radial-gradient(ellipse at center, ${color}15 0%, transparent 70%)` }}
      />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
          Emergency Alert Trend
        </h3>
        <div className="flex items-center gap-2">
          <LastUpdated time={lastUpdate} />
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-neonCyan animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          </div>
        </div>
      </div>

      {!hasData ? (
        <NoData />
      ) : (
        <div className="w-full h-[200px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2a" vertical={false} strokeOpacity={0.6} />
              <XAxis dataKey="time" {...AXIS_PROPS} />
              <YAxis {...AXIS_PROPS} allowDecimals={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color, fontSize: '11px', fontWeight: 'bold' }}
                labelStyle={{ color: '#888', fontSize: '9px', textTransform: 'uppercase', marginBottom: 4 }}
                formatter={(v) => [`${v} alerts`, 'Count']}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                animationDuration={800}
                dot={false}
                activeDot={{ r: 5, stroke: color, strokeWidth: 2, fill: '#050505' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2.  LoRa SIGNAL STRENGTH (RSSI)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const RSSIDot = (props) => {
  const { cx, cy, index, payload } = props;
  const isLast = index === props.totalPoints - 1;
  if (cx == null || cy == null) return null;
  return (
    <g>
      {isLast && (
        <>
          <circle cx={cx} cy={cy} r={10} fill="rgba(255,0,85,0.15)" className="animate-pulse" />
          <circle cx={cx} cy={cy} r={6} fill="rgba(255,0,85,0.3)" />
        </>
      )}
      <circle
        cx={cx}
        cy={cy}
        r={isLast ? 4 : 2.5}
        fill={isLast ? '#ff0055' : 'rgba(255,0,85,0.6)'}
        stroke={isLast ? '#fff' : 'none'}
        strokeWidth={isLast ? 1.5 : 0}
      />
    </g>
  );
};

export const RSSIChartLive = ({ data, hasData, lastUpdate, glowKey }) => {
  const color = '#ff0055';
  const gradientId = 'rssiGrad';
  const totalPoints = data.length;

  return (
    <div className="glass-card p-6 h-[300px] flex flex-col relative overflow-hidden group">
      <div
        key={glowKey}
        className="absolute inset-0 pointer-events-none opacity-0 animate-[neonFlash_0.6s_ease-out]"
        style={{ background: `radial-gradient(ellipse at center, ${color}15 0%, transparent 70%)` }}
      />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
          LoRa Signal Strength (RSSI)
        </h3>
        <div className="flex items-center gap-2">
          <LastUpdated time={lastUpdate} />
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-neonRed animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          </div>
        </div>
      </div>

      {!hasData ? (
        <NoData />
      ) : (
        <div className="w-full h-[200px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2a" vertical={false} strokeOpacity={0.6} />
              <XAxis dataKey="time" {...AXIS_PROPS} />
              <YAxis
                {...AXIS_PROPS}
                domain={['dataMin - 10', 'dataMax + 10']}
                tickFormatter={(v) => `${v}`}
                label={{ value: 'dBm', angle: -90, position: 'insideLeft', fill: '#555', fontSize: 9 }}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color, fontSize: '11px', fontWeight: 'bold' }}
                labelStyle={{ color: '#888', fontSize: '9px', textTransform: 'uppercase', marginBottom: 4 }}
                formatter={(v, name, props) => [`${v} dBm`, `RSSI · ${props.payload.user}`]}
              />
              <Line
                type="monotone"
                dataKey="rssi"
                stroke={color}
                strokeWidth={2.5}
                animationDuration={800}
                dot={(dotProps) => <RSSIDot key={dotProps.index} {...dotProps} totalPoints={totalPoints} />}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: color }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3.  DISTANCE TO VICTIM (Haversine)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const DistanceChartLive = ({ data, hasData, lastUpdate, glowKey }) => {
  const color = '#39ff14';
  const gradientId = 'distGrad';

  // Decide unit: if max > 2000m show km, else m
  const maxDist = data.length ? Math.max(...data.map((d) => d.distance)) : 0;
  const useKm = maxDist > 2000;
  const unitLabel = useKm ? 'km' : 'm';
  const chartData = useKm
    ? data.map((d) => ({ ...d, value: d.distanceKm }))
    : data.map((d) => ({ ...d, value: d.distance }));

  return (
    <div className="glass-card p-6 h-[300px] flex flex-col relative overflow-hidden group">
      <div
        key={glowKey}
        className="absolute inset-0 pointer-events-none opacity-0 animate-[neonFlash_0.6s_ease-out]"
        style={{ background: `radial-gradient(ellipse at center, ${color}15 0%, transparent 70%)` }}
      />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
          Distance to Victim
        </h3>
        <div className="flex items-center gap-2">
          <LastUpdated time={lastUpdate} />
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-neonGreen animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          </div>
        </div>
      </div>

      {!hasData ? (
        <NoData />
      ) : (
        <div className="w-full h-[200px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2a" vertical={false} strokeOpacity={0.6} />
              <XAxis dataKey="time" {...AXIS_PROPS} />
              <YAxis
                {...AXIS_PROPS}
                label={{ value: unitLabel, angle: -90, position: 'insideLeft', fill: '#555', fontSize: 9 }}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color, fontSize: '11px', fontWeight: 'bold' }}
                labelStyle={{ color: '#888', fontSize: '9px', textTransform: 'uppercase', marginBottom: 4 }}
                formatter={(v, name, props) => [
                  `${v} ${unitLabel}`,
                  `Distance · ${props.payload.user}`,
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                animationDuration={800}
                dot={{ r: 2.5, fill: color, stroke: 'none' }}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

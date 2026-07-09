import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';

// ──────────────────────────────────────────────────────────────
// Haversine distance (meters) between two lat/lng pairs
// ──────────────────────────────────────────────────────────────
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6_371_000; // Earth radius in meters
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const CHART_LIMIT = 30;
const TOTAL_LIMIT = 100;

// Default rescue-team position (Chennai)
const DEFAULT_RESCUE = { lat: 13.0827, lng: 80.2707 };

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const useAnalyticsRealtime = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [newPointFlag, setNewPointFlag] = useState(0); // increments to trigger glow animation
  const rescuePos = useRef(DEFAULT_RESCUE);

  // Try to get real rescue-team (browser) position once
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          rescuePos.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        },
        () => {}, // silently keep default
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // ── transform raw alerts into chart datasets ──────────────
  const buildDatasets = useCallback(
    (raw) => {
      // Newest last for chart left-to-right flow
      const sorted = [...raw].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const sliced = sorted.slice(-CHART_LIMIT);

      // ── Chart 1: alert count per minute bucket ──
      const bucketMap = {};
      sliced.forEach((a) => {
        const key = formatTime(a.created_at);
        bucketMap[key] = (bucketMap[key] || 0) + 1;
      });
      const trendData = Object.entries(bucketMap).map(([time, count]) => ({ time, count }));

      // ── Chart 2: RSSI per alert ──
      const rssiData = sliced.map((a) => ({
        time: formatTime(a.created_at),
        rssi: Number(a.signal_strength) || 0,
        user: a.user_name || 'Unknown',
      }));

      // ── Chart 3: Haversine distance ──
      const { lat: rLat, lng: rLng } = rescuePos.current;
      const distanceData = sliced.map((a) => {
        const d = haversine(rLat, rLng, Number(a.latitude), Number(a.longitude));
        return {
          time: formatTime(a.created_at),
          distance: Math.round(d), // meters
          distanceKm: +(d / 1000).toFixed(2),
          user: a.user_name || 'Unknown',
        };
      });

      return { trendData, rssiData, distanceData };
    },
    []
  );

  // ── Initial fetch ─────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('sos_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(TOTAL_LIMIT);

      if (!error && data) {
        setAlerts(data);
        setLastUpdate(new Date());
      }
      setLoading(false);
    };
    fetch();
  }, []);

  // ── Realtime subscription ─────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('analytics_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sos_alerts' },
        (payload) => {
          setAlerts((prev) => {
            const next = [payload.new, ...prev];
            return next.slice(0, TOTAL_LIMIT);
          });
          setLastUpdate(new Date());
          setNewPointFlag((n) => n + 1);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const datasets = buildDatasets(alerts);

  return {
    ...datasets,
    alerts,
    loading,
    lastUpdate,
    newPointFlag,
    hasData: alerts.length > 0,
  };
};

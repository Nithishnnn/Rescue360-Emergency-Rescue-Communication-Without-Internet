import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Info, Signal, Clock, MapPin, User, AlertCircle } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons for Statuses & Time Periods
const createCustomIcon = (color, isBlinking, opacity = 1) => new L.DivIcon({
  className: `custom-div-icon ${isBlinking ? 'animate-blink-red' : ''}`,
  html: `
    <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; opacity: ${opacity};">
      ${isBlinking ? '<div class="absolute inset-0 bg-red-500/40 rounded-full animate-ripple"></div>' : ''}
      <div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color}; z-index: 10;"></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

// Helper to determine age category of alert
const getAlertAgeCategory = (createdAtStr) => {
  const date = new Date(createdAtStr);
  const now = new Date();
  const diffMs = now - date;
  const oneDay = 24 * 60 * 60 * 1000;

  if (diffMs < oneDay) {
    return 'today';
  } else if (diffMs < 7 * oneDay) {
    return 'week';
  } else if (diffMs < 30 * oneDay) {
    return 'month';
  } else {
    return 'older';
  }
};

// Map age category to marker configurations
const getAlertIcon = (alert, latestAlertId, isNewArrival, focusedAlertId, markerAnimationSetting) => {
  const isLatest = alert.id === latestAlertId;
  const animationOn = markerAnimationSetting !== 'off';
  const isBlinking = (isLatest || alert.id === isNewArrival || alert.id === focusedAlertId) && animationOn;

  if (isBlinking) {
    // 🔴 Blinking bright red for the newest/focused alert
    return createCustomIcon('#ff0055', animationOn, 1);
  }

  const age = getAlertAgeCategory(alert.created_at);
  switch (age) {
    case 'today':
      // 🔴 Today - Bright Red
      return createCustomIcon('#ef4444', false, 1);
    case 'week':
      // 🟠 Last 7 Days - Orange
      return createCustomIcon('#f97316', false, 1);
    case 'month':
      // 🟡 Last 30 Days - Yellow
      return createCustomIcon('#eab308', false, 1);
    case 'older':
    default:
      // ⚪ Older Alerts - Gray with reduced opacity
      return createCustomIcon('#6b7280', false, 0.45);
  }
};

// Custom Cluster Icon
const createClusterIcon = (count) => new L.DivIcon({
  className: 'custom-cluster-icon',
  html: `
    <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
      <div class="absolute inset-0 bg-neonCyan/20 rounded-full animate-ping" style="animation-duration: 3s;"></div>
      <div class="absolute inset-1 bg-[#0a0a0f] border-2 border-neonCyan rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.4)]" style="width: 36px; height: 36px;">
        <span style="color: #00f2ff; font-size: 11px; font-weight: 900; font-family: monospace;">${count}</span>
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22]
});

// Custom clustering algorithm based on screen projected pixel distance
const getClusters = (alerts, map, zoom) => {
  const clusters = [];
  const threshold = 55; // Pixels radius threshold

  alerts.forEach((alert) => {
    const lat = Number(alert.latitude);
    const lng = Number(alert.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    const pt = map.project([lat, lng], zoom);

    let found = false;
    for (let cluster of clusters) {
      const dist = Math.hypot(pt.x - cluster.projX, pt.y - cluster.projY);
      if (dist < threshold) {
        cluster.alerts.push(alert);
        cluster.count += 1;
        found = true;
        break;
      }
    }

    if (!found) {
      clusters.push({
        id: `cluster-${alert.id}`,
        projX: pt.x,
        projY: pt.y,
        latitude: lat,
        longitude: lng,
        alerts: [alert],
        count: 1,
      });
    }
  });

  return clusters;
};

// ─── Easing function for animation ─────────────────────────────
const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// ─── Movement animation constants ──────────────────────────────
const ANIM_DURATION   = 500;  // ms
const TRAIL_INTERVAL  = 60;   // ms
const TRAIL_DOT_SIZE  = 20;   // px

function latLngToOverlayPx(map, lat, lng) {
  const point = map.latLngToLayerPoint([lat, lng]);
  return point;
}

function spawnTrailDot(map, lat, lng) {
  const px = latLngToOverlayPx(map, lat, lng);
  const pane = map.getPanes().overlayPane;
  const el = document.createElement('div');
  el.className = 'marker-trail-dot';
  el.style.cssText = `
    width:  ${TRAIL_DOT_SIZE}px;
    height: ${TRAIL_DOT_SIZE}px;
    left:   ${px.x - TRAIL_DOT_SIZE / 2}px;
    top:    ${px.y - TRAIL_DOT_SIZE / 2}px;
    transform-origin: center;
  `;
  pane.appendChild(el);
  setTimeout(() => el.parentNode && el.parentNode.removeChild(el), 1050);
}

function spawnDepartPulse(map, lat, lng) {
  const px = latLngToOverlayPx(map, lat, lng);
  const pane = map.getPanes().overlayPane;
  const SIZE = 28;
  const el = document.createElement('div');
  el.className = 'marker-depart-pulse';
  el.style.cssText = `
    width:  ${SIZE}px;
    height: ${SIZE}px;
    left:   ${px.x - SIZE / 2}px;
    top:    ${px.y - SIZE / 2}px;
    transform-origin: center;
  `;
  pane.appendChild(el);
  setTimeout(() => el.parentNode && el.parentNode.removeChild(el), 700);
}

function spawnArriveRipple(map, lat, lng) {
  const px = latLngToOverlayPx(map, lat, lng);
  const pane = map.getPanes().overlayPane;
  const SIZE = 28;
  const el = document.createElement('div');
  el.className = 'marker-arrive-ripple';
  el.style.cssText = `
    width:  ${SIZE}px;
    height: ${SIZE}px;
    left:   ${px.x - SIZE / 2}px;
    top:    ${px.y - SIZE / 2}px;
    transform-origin: center;
  `;
  pane.appendChild(el);
  setTimeout(() => el.parentNode && el.parentNode.removeChild(el), 800);
}

function animateMarker(map, markerRef, fromLat, fromLng, toLat, toLng) {
  let rafId = null;
  let trailTimer = null;
  const startTime = performance.now();

  spawnDepartPulse(map, fromLat, fromLng);

  let lastTrailLat = fromLat;
  let lastTrailLng = fromLng;
  trailTimer = setInterval(() => {
    spawnTrailDot(map, lastTrailLat, lastTrailLng);
  }, TRAIL_INTERVAL);

  function step(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / ANIM_DURATION, 1);
    const ease = easeInOut(t);

    const curLat = fromLat + (toLat - fromLat) * ease;
    const curLng = fromLng + (toLng - fromLng) * ease;

    if (markerRef && markerRef.setLatLng) {
      markerRef.setLatLng([curLat, curLng]);
    }

    lastTrailLat = curLat;
    lastTrailLng = curLng;

    if (t < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      clearInterval(trailTimer);
      spawnArriveRipple(map, toLat, toLng);
    }
  }

  rafId = requestAnimationFrame(step);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    if (trailTimer) clearInterval(trailTimer);
  };
}

// ─── Map Controller (Centering, Zoom tracking, Event registration) ─────────
const MapController = ({ lat, lng, latestAlertId, isNew, onMapReady, onZoomChange, focusedAlertId, alerts, zoomLevel }) => {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  useEffect(() => {
    const handleZoom = () => {
      if (onZoomChange) onZoomChange(map.getZoom());
    };
    map.on('zoomend', handleZoom);
    if (onZoomChange) onZoomChange(map.getZoom());
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map, onZoomChange]);

  useEffect(() => {
    if (focusedAlertId && alerts && alerts.length > 0) {
      const target = alerts.find(a => a.id === focusedAlertId);
      if (target) {
        const tLat = Number(target.latitude);
        const tLng = Number(target.longitude);
        if (!isNaN(tLat) && !isNaN(tLng)) {
          const targetZoom = parseInt(zoomLevel, 10) || 15;
          map.setView([tLat, tLng], targetZoom, { animate: true });
        }
      }
    } else if (isNew && lat && lng) {
      map.setView([lat, lng], 15, { animate: true });
    }
  }, [lat, lng, isNew, map, focusedAlertId, alerts, zoomLevel]);

  return null;
};

// ─── Animated marker wrapper ──────────────────────────────────────────────────
const AnimatedMarker = ({ alert, icon, isBlinking, children }) => {
  const map = useMap();
  const { settings, focusedAlertId } = useAlert();
  const markerRef = useRef(null);
  const prevPosRef = useRef({ lat: alert.latitude, lng: alert.longitude });
  const cancelAnimRef = useRef(null);

  useEffect(() => {
    if (settings.markerAnimation === 'off') return;

    const newLat = parseFloat(alert.latitude);
    const newLng = parseFloat(alert.longitude);
    const oldLat = parseFloat(prevPosRef.current.lat);
    const oldLng = parseFloat(prevPosRef.current.lng);

    const latDelta = Math.abs(newLat - oldLat);
    const lngDelta = Math.abs(newLng - oldLng);
    const THRESHOLD = 0.000001;

    if ((latDelta > THRESHOLD || lngDelta > THRESHOLD) && markerRef.current) {
      if (cancelAnimRef.current) cancelAnimRef.current();

      cancelAnimRef.current = animateMarker(
        map,
        markerRef.current,
        oldLat,
        oldLng,
        newLat,
        newLng,
      );

      prevPosRef.current = { lat: newLat, lng: newLng };
    }
  }, [alert.latitude, alert.longitude, map, settings.markerAnimation]);

  useEffect(() => {
    return () => {
      if (cancelAnimRef.current) cancelAnimRef.current();
    };
  }, []);

  const shouldOpen = isBlinking || alert.id === focusedAlertId;

  return (
    <Marker
      key={alert.id}
      position={[alert.latitude, alert.longitude]}
      icon={icon}
      ref={(el) => {
        markerRef.current = el;
        if (el && shouldOpen) {
          setTimeout(() => {
            if (el && el.openPopup) el.openPopup();
          }, 350);
        }
      }}
    >
      {children}
    </Marker>
  );
};

// ─── Cluster Marker component ───────────────────────────────────────────────
const ClusterMarker = ({ cluster }) => {
  const map = useMap();

  const handleZoom = () => {
    map.setView([cluster.latitude, cluster.longitude], map.getZoom() + 2, { animate: true });
  };

  const latestAlert = useMemo(() => {
    return [...cluster.alerts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  }, [cluster.alerts]);

  const users = useMemo(() => {
    const names = cluster.alerts.map(a => a.user_name || 'Unknown').filter(Boolean);
    return Array.from(new Set(names));
  }, [cluster.alerts]);

  const icon = createClusterIcon(cluster.count);

  return (
    <Marker position={[cluster.latitude, cluster.longitude]} icon={icon}>
      <Popup className="custom-popup">
        <div className="p-3 w-64 bg-[#0a0a0f] text-white rounded-lg border border-white/10 shadow-2xl">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
            <AlertCircle size={14} className="text-neonCyan" />
            <span className="text-xs font-black uppercase tracking-wider">{cluster.count} Alerts Clustered</span>
          </div>

          <div className="space-y-2 mb-4">
            <div>
              <p className="text-[8px] text-gray-500 uppercase font-black">Latest Activity</p>
              <p className="text-xs font-semibold text-white mt-0.5">
                {latestAlert ? new Date(latestAlert.created_at).toLocaleString() : '—'}
              </p>
            </div>

            <div>
              <p className="text-[8px] text-gray-500 uppercase font-black">Affected Users</p>
              <div className="flex flex-wrap gap-1 mt-1 max-h-[60px] overflow-y-auto custom-scrollbar">
                {users.map((name, i) => (
                  <span key={i} className="text-[9px] bg-white/5 border border-white/5 px-1.5 py-0.5 rounded text-gray-300">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleZoom}
            className="w-full flex items-center justify-center gap-2 py-2 bg-neonCyan/20 hover:bg-neonCyan/30 border border-neonCyan/30 text-neonCyan rounded-lg transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <Navigation size={12} className="rotate-45" />
            Zoom to Location
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

// ─── Main MapView component ───────────────────────────────────────────────────
const MapView = ({ lat = 13.0827, lng = 80.2707, alerts = [], latestRealtimeAlert = null }) => {
  const { settings, focusedAlertId } = useAlert();
  const [newlyArrivedId, setNewlyArrivedId] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all'); // all, today, week, month
  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(15);

  const latestAlert = useMemo(() => {
    if (alerts.length === 0) return null;
    return alerts.find(a => a.alert_status === 'ACTIVE') || alerts[0];
  }, [alerts]);

  // Track Realtime incoming alert pings
  useEffect(() => {
    if (latestRealtimeAlert) {
      setNewlyArrivedId(latestRealtimeAlert.id);
      const timer = setTimeout(() => setNewlyArrivedId(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [latestRealtimeAlert]);

  // 1. Time Filter logic
  const filteredAlerts = useMemo(() => {
    if (timeFilter === 'all') return alerts;
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    return alerts.filter((alert) => {
      const alertDate = new Date(alert.created_at);
      const diffMs = now - alertDate;
      if (timeFilter === 'today') {
        return diffMs < oneDay;
      } else if (timeFilter === 'week') {
        return diffMs < 7 * oneDay;
      } else if (timeFilter === 'month') {
        return diffMs < 30 * oneDay;
      }
      return true;
    });
  }, [alerts, timeFilter]);

  // 2. Clustering logic based on zoom & filter
  const clusters = useMemo(() => {
    if (!map) {
      // Map instance not loaded yet, render individual items
      return filteredAlerts.map(a => ({
        id: `individual-${a.id}`,
        latitude: a.latitude,
        longitude: a.longitude,
        alerts: [a],
        count: 1
      }));
    }

    if (zoom >= 17) {
      // Expand all clusters when fully zoomed in
      return filteredAlerts.map(a => ({
        id: `individual-${a.id}`,
        latitude: a.latitude,
        longitude: a.longitude,
        alerts: [a],
        count: 1
      }));
    }

    return getClusters(filteredAlerts, map, zoom);
  }, [filteredAlerts, map, zoom]);

  return (
    <div className="glass-card w-full h-full relative overflow-hidden group border-neonCyan/20">
      {/* Top Left Overlay Card */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-white/10 p-3 rounded-xl pointer-events-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-neonCyan shadow-neon-cyan animate-pulse"></div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Signal Tracking Active</span>
          </div>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
            Nodes trackable: {filteredAlerts.length}
          </p>
        </div>
      </div>

      {/* Top Right Overlay Filters */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2 pointer-events-auto">
        {/* Time Filters UI panel */}
        <div className="bg-[#0a0a0f]/85 backdrop-blur-md border border-white/10 p-1 rounded-xl flex gap-1 shadow-2xl">
          {['all', 'today', 'week', 'month'].map((filterOpt) => {
            const label = {
              all: 'All Time',
              today: 'Today',
              week: '7 Days',
              month: '30 Days',
            }[filterOpt];
            const isActive = timeFilter === filterOpt;
            return (
              <button
                key={filterOpt}
                onClick={() => setTimeFilter(filterOpt)}
                className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  isActive
                    ? 'bg-neonCyan/25 text-neonCyan border border-neonCyan/35 shadow-[0_0_8px_rgba(0,242,255,0.25)]'
                    : 'text-gray-500 hover:text-white border border-transparent'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Live Sweep Badge */}
        <div className="bg-neonRed/10 backdrop-blur-md border border-neonRed/30 px-3 py-1.5 rounded-xl text-neonRed flex items-center gap-2 shadow-2xl">
          <Navigation size={12} className="animate-bounce" />
          <span className="text-[9px] font-black uppercase tracking-wider">Live Sweep</span>
        </div>
      </div>

      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', background: '#0a0a0f' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; CARTO'
          url={
            settings.mapStyle === 'street'
              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              : settings.mapStyle === 'satellite'
              ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          }
        />

        <MapController
          lat={lat}
          lng={lng}
          latestAlertId={latestAlert?.id}
          isNew={!!newlyArrivedId}
          onMapReady={setMap}
          onZoomChange={setZoom}
          focusedAlertId={focusedAlertId}
          alerts={alerts}
          zoomLevel={settings.zoomLevel}
        />

        {clusters.map((cluster) => {
          if (cluster.count === 1) {
            const alert = cluster.alerts[0];
            const isBlinking = (alert.id === latestAlert?.id || alert.id === newlyArrivedId || alert.id === focusedAlertId) && settings.markerAnimation !== 'off';
            const icon = getAlertIcon(alert, latestAlert?.id, newlyArrivedId, focusedAlertId, settings.markerAnimation);

            // Fetch alert history for the local area (~50 meters / 0.0005 deg coordinates delta)
            const history = alerts
              .filter(a => a.id !== alert.id &&
                Math.abs(Number(a.latitude) - Number(alert.latitude)) < 0.0005 &&
                Math.abs(Number(a.longitude) - Number(alert.longitude)) < 0.0005
              )
              .slice(0, 3);

            return (
              <AnimatedMarker
                key={alert.id}
                alert={alert}
                icon={icon}
                isBlinking={isBlinking}
              >
                <Popup className="custom-popup">
                  <div className="p-3 w-64 bg-[#0a0a0f] text-white rounded-lg border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                      <User size={14} className="text-neonCyan" />
                      <span className="text-xs font-black uppercase tracking-wider">{alert.user_name || 'Unknown User'}</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={14} className="text-neonRed mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Emergency Message</p>
                          <p className="text-xs font-medium leading-tight">{alert.emergency_message}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 p-2 rounded-md border border-white/5">
                          <p className="text-[8px] text-gray-500 uppercase font-black">Type</p>
                          <p className="text-[10px] font-bold text-neonCyan">{alert.emergency_type || 'General'}</p>
                        </div>
                        <div className="bg-white/5 p-2 rounded-md border border-white/5">
                          <p className="text-[8px] text-gray-500 uppercase font-black">Status</p>
                          <p className={`text-[10px] font-bold ${alert.alert_status === 'ACTIVE' ? 'text-neonRed' : 'text-green-500'}`}>
                            {alert.alert_status}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-gray-400 font-mono mt-2 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1">
                          <MapPin size={10} />
                          <span>{parseFloat(alert.latitude).toFixed(4)}, {parseFloat(alert.longitude).toFixed(4)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Signal size={10} />
                          <span>{alert.signal_strength || 'N/A'}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[9px] text-gray-500 italic mt-1 pb-2 border-b border-white/5">
                        <Clock size={10} />
                        <span>{new Date(alert.created_at).toLocaleString()}</span>
                      </div>

                      {/* Area Alert History Section */}
                      {history.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Alert History for Area</p>
                          <div className="space-y-1 max-h-[60px] overflow-y-auto custom-scrollbar">
                            {history.map((h, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[9px] bg-white/5 p-1 rounded border border-white/5">
                                <span className="text-gray-300 truncate max-w-[125px]">{h.emergency_message}</span>
                                <span className="text-gray-500 font-mono text-[8px]">{new Date(h.created_at).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${alert.latitude},${alert.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-neonCyan/20 hover:bg-neonCyan/30 border border-neonCyan/30 text-neonCyan rounded-lg transition-all text-[10px] font-black uppercase tracking-widest group/btn"
                    >
                      <Navigation size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                      Show Route
                    </a>
                  </div>
                </Popup>
              </AnimatedMarker>
            );
          } else {
            return (
              <ClusterMarker
                key={cluster.id}
                cluster={cluster}
              />
            );
          }
        })}
      </MapContainer>

      {/* Visual Decoration / Scanners */}
      <div className="absolute inset-0 pointer-events-none border-2 border-neonCyan/5 rounded-2xl z-[1001]"></div>
    </div>
  );
};

export default MapView;

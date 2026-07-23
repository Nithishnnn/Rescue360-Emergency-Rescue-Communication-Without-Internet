import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Info, Signal, Clock, MapPin, User, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Custom icons for Route Navigation start/end
const createRescueVehicleIcon = () => new L.DivIcon({
  className: 'rescue-vehicle-icon',
  html: `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      <div class="absolute inset-0 bg-[#00f2ff]/30 rounded-full animate-ping" style="animation-duration: 2s;"></div>
      <div style="background-color: #00f2ff; color: #0a0a0f; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px #00f2ff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold; z-index: 10;">
        🚑
      </div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

const createSosDestinationIcon = () => new L.DivIcon({
  className: 'sos-destination-icon',
  html: `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      <div class="absolute inset-0 bg-neonRed/30 rounded-full animate-ping" style="animation-duration: 1.5s;"></div>
      <div style="background-color: #ff0055; color: white; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px #ff0055; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold; z-index: 10;">
        🚨
      </div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17]
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
  const { handleMapClick } = useAlert();

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
    if (!focusedAlertId && isNew && lat && lng) {
      map.setView([lat, lng], 15, { animate: true });
    }
  }, [lat, lng, isNew, map, focusedAlertId]);

  useEffect(() => {
    const clickHandler = (e) => {
      // Ignore background map clicks
    };
    map.on('click', clickHandler);
    return () => {
      map.off('click', clickHandler);
    };
  }, [map]);

  return null;
};

// ─── Animated marker wrapper ──────────────────────────────────────────────────
const AnimatedMarker = ({ alert, icon, isBlinking, autoOpenPopupAlertId, children }) => {
  const map = useMap();
  const { settings, focusedAlertId, setFocusedAlertId } = useAlert();
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

  const shouldOpen = alert.id === autoOpenPopupAlertId;

  useEffect(() => {
    if (markerRef.current && shouldOpen) {
      const timer = setTimeout(() => {
        if (markerRef.current && markerRef.current.openPopup) {
          markerRef.current.openPopup();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [shouldOpen]);

  return (
    <Marker
      key={alert.id}
      position={[alert.latitude, alert.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => {
          setFocusedAlertId(alert.id);
        }
      }}
      ref={(el) => {
        markerRef.current = el;
      }}
    >
      {children}
    </Marker>
  );
};

// ─── Cluster Marker component ───────────────────────────────────────────────
const ClusterMarker = ({ cluster, onZoomToLocation }) => {
  const map = useMap();

  const latestAlert = useMemo(() => {
    return [...cluster.alerts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  }, [cluster.alerts]);

  const handleZoom = () => {
    if (onZoomToLocation && latestAlert) {
      onZoomToLocation(latestAlert);
    } else {
      map.setView([cluster.latitude, cluster.longitude], map.getZoom() + 2, { animate: true });
    }
  };

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

// ─── Signal History Panel Overlay ─────────────────────────────────────────────
const SignalHistoryPanel = ({ clickedLocations, activeWeatherCoords, selectClickedLocation, map }) => {
  const [isOpen, setIsOpen] = useState(false);

  const historyItems = useMemo(() => {
    return clickedLocations.slice(0, 10);
  }, [clickedLocations]);

  if (clickedLocations.length === 0) return null;

  return (
    <div className="bg-[#0a0a0f]/90 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white/5 border-b border-white/5 text-left text-white hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-neonCyan animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Signal History ({clickedLocations.length})</span>
        </div>
        <span className="text-[10px] text-gray-500 font-bold font-mono">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-2 max-h-56 overflow-y-auto custom-scrollbar space-y-1.5">
              {historyItems.map((loc) => {
                const isActive = activeWeatherCoords?.isCustom && activeWeatherCoords.id === loc.id;
                const formattedTime = new Date(loc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div
                    key={loc.id}
                    onClick={() => {
                      selectClickedLocation(loc);
                      if (map) {
                        map.setView([loc.latitude, loc.longitude], map.getZoom(), { animate: true });
                      }
                    }}
                    className={`p-2 rounded-lg border cursor-pointer transition-all flex flex-col justify-between gap-1 ${
                      isActive
                        ? 'bg-neonCyan/15 border-neonCyan/40 text-white shadow-[0_0_8px_rgba(0,242,255,0.15)]'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[9.5px] font-bold truncate max-w-[150px] leading-tight">
                        {loc.area || `Syncing location...`}
                      </span>
                      <span className="text-[8px] font-mono text-gray-500 uppercase shrink-0">
                        {formattedTime}
                      </span>
                    </div>
                    {loc.weatherCondition && (
                      <div className="flex items-center justify-between text-[8px] text-gray-400 font-mono mt-0.5">
                        <span>{loc.weatherCondition}</span>
                        <span className="text-neonCyan font-bold">{loc.temperature}°C</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main MapView component ───────────────────────────────────────────────────
const MapView = ({ lat = 13.0827, lng = 80.2707, alerts = [], latestRealtimeAlert = null }) => {
  const { 
    settings, 
    focusedAlertId, 
    setMapCenter, 
    setFocusedAlertId, 
    routeCoords, 
    fitRouteTrigger,
    clickedLocations,
    activeWeatherCoords,
    selectClickedLocation,
    traceTrigger
  } = useAlert();
  const [newlyArrivedId, setNewlyArrivedId] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all'); // all, today, week, month
  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(15);

  const [pulsingAlertId, setPulsingAlertId] = useState(null);
  const [autoOpenPopupAlertId, setAutoOpenPopupAlertId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const pulseTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const lastFocusedAlertIdRef = useRef(null);

  const triggerToast = useCallback((msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => {
      setShowToast(false);
    }, 3500);
  }, []);

  useEffect(() => {
    if (!map || !focusedAlertId || !alerts || alerts.length === 0) return;

    if (lastFocusedAlertIdRef.current === focusedAlertId) {
      setAutoOpenPopupAlertId(focusedAlertId);
      return;
    }
    lastFocusedAlertIdRef.current = focusedAlertId;

    const target = alerts.find(a => a.id === focusedAlertId);
    if (!target) return;

    const tLat = Number(target.latitude);
    const tLng = Number(target.longitude);
    if (isNaN(tLat) || isNaN(tLng)) return;

    const bounds = map.getBounds();
    const isVisible = bounds.pad(-0.05).contains([tLat, tLng]);

    if (isVisible) {
      map.panTo([tLat, tLng], { animate: true, duration: 1 });
      setAutoOpenPopupAlertId(focusedAlertId);
    } else {
      const currentZoom = map.getZoom();
      const targetZoom = currentZoom >= 16 && currentZoom <= 17 ? currentZoom : 16.5;

      map.flyTo([tLat, tLng], targetZoom, {
        animate: true,
        duration: 1.5
      });

      map.once('moveend', () => {
        setAutoOpenPopupAlertId(focusedAlertId);
      });
    }
  }, [focusedAlertId, alerts, map, setAutoOpenPopupAlertId]);

  useEffect(() => {
    if (!focusedAlertId) {
      setAutoOpenPopupAlertId(null);
      lastFocusedAlertIdRef.current = null;
    }
  }, [focusedAlertId, setAutoOpenPopupAlertId]);

  useEffect(() => {
    if (!map || !traceTrigger || !traceTrigger.id) return;

    const tLat = Number(traceTrigger.latitude);
    const tLng = Number(traceTrigger.longitude);
    if (isNaN(tLat) || isNaN(tLng)) return;

    map.flyTo([tLat, tLng], 18, {
      animate: true,
      duration: 1.5
    });

    map.once('moveend', () => {
      setAutoOpenPopupAlertId(traceTrigger.id);
    });
  }, [traceTrigger, map, setAutoOpenPopupAlertId]);

  useEffect(() => {
    if (map && routeCoords && routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true, duration: 1.5 });
    }
  }, [fitRouteTrigger, map, routeCoords]);

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleZoomToLocation = useCallback((alert) => {
    if (!map || !alert) return;

    const mapEl = map.getContainer();
    const rect = mapEl.getBoundingClientRect();
    const isOutsideViewport = rect.top < 0 || rect.bottom > window.innerHeight;

    triggerToast("Navigating to emergency location...");

    const performFlyTo = () => {
      const targetLat = Number(alert.latitude);
      const targetLng = Number(alert.longitude);

      if (map.getZoom() === 17 && 
          Math.abs(map.getCenter().lat - targetLat) < 0.0001 && 
          Math.abs(map.getCenter().lng - targetLng) < 0.0001) {
        map.setView([targetLat, targetLng], 15, { animate: false });
      }

      map.flyTo([targetLat, targetLng], 17, {
        duration: 2.5,
        easeLinearity: 0.25
      });

      map.once('moveend', () => {
        map.panTo([targetLat, targetLng]);

        if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
        setPulsingAlertId(alert.id);
        pulseTimerRef.current = setTimeout(() => {
          setPulsingAlertId(null);
        }, 10000);

        setAutoOpenPopupAlertId(alert.id);
        setTimeout(() => {
          setAutoOpenPopupAlertId(null);
        }, 1000);
      });
    };

    if (isOutsideViewport) {
      mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(performFlyTo, 800);
    } else {
      performFlyTo();
    }
  }, [map, triggerToast]);

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

  useEffect(() => {
    if (!map) return;
    const updateCenter = () => {
      const center = map.getCenter();
      setMapCenter({ lat: center.lat, lng: center.lng });
    };
    map.on('moveend', updateCenter);
    return () => {
      map.off('moveend', updateCenter);
    };
  }, [map, setMapCenter]);

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

      {/* Small Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[2000] bg-[#0a0a0f]/90 backdrop-blur-md border border-neonCyan/40 text-neonCyan font-bold text-xs px-4 py-2.5 rounded-xl shadow-[0_0_15px_rgba(0,242,255,0.35)] flex items-center gap-2 pointer-events-none"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-neonCyan animate-ping"></div>
            <span className="uppercase tracking-widest">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
            const isBlinking = (alert.id === latestAlert?.id || alert.id === newlyArrivedId || alert.id === focusedAlertId || alert.id === pulsingAlertId) && settings.markerAnimation !== 'off';
            const icon = getAlertIcon(alert, latestAlert?.id, newlyArrivedId, focusedAlertId || pulsingAlertId, settings.markerAnimation);

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
                autoOpenPopupAlertId={autoOpenPopupAlertId}
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
                onZoomToLocation={handleZoomToLocation}
              />
            );
          }
        })}

        {/* Clicked locations are displayed only in the History Panel; no temporary markers are rendered on the map */}
      </MapContainer>

      {/* Bottom Left: Signal History Panel */}
      <div className="absolute bottom-4 left-4 z-[1000] w-64 pointer-events-auto flex flex-col">
        <SignalHistoryPanel 
          clickedLocations={clickedLocations} 
          activeWeatherCoords={activeWeatherCoords}
          selectClickedLocation={selectClickedLocation}
          map={map}
        />
      </div>

      {/* Visual Decoration / Scanners */}
      <div className="absolute inset-0 pointer-events-none border-2 border-neonCyan/5 rounded-2xl z-[1001]"></div>
    </div>
  );
};

export default MapView;

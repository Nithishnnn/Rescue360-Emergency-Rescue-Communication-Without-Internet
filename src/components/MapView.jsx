import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Info, Signal, Clock, MapPin, User, AlertCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons for Statuses
const createCustomIcon = (color, isBlinking) => new L.DivIcon({
  className: `custom-div-icon ${isBlinking ? 'animate-blink-red' : ''}`,
  html: `
    <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
      ${isBlinking ? '<div class="absolute inset-0 bg-red-500/40 rounded-full animate-ripple"></div>' : ''}
      <div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color}; z-index: 10;"></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

const icons = {
  active: (blink) => createCustomIcon('#ff0055', blink), // Red
  previous: (blink) => createCustomIcon('#facc15', blink), // Yellow
  resolved: (blink) => createCustomIcon('#22c55e', blink), // Green
};

// Component to handle map centering and auto-popup
const MapController = ({ lat, lng, latestAlertId, isNew }) => {
  const map = useMap();

  useEffect(() => {
    if (isNew && lat && lng) {
      map.setView([lat, lng], 15, { animate: true });
    }
  }, [lat, lng, isNew, map]);

  return null;
};

const MapView = ({ lat = 13.0827, lng = 80.2707, alerts = [], latestRealtimeAlert = null }) => {
  const markerRefs = useRef({});
  const [newlyArrivedId, setNewlyArrivedId] = React.useState(null);
  const latestAlert = latestRealtimeAlert || alerts.find(a => a.alert_status === 'ACTIVE');

  useEffect(() => {
    if (latestRealtimeAlert) {
      setNewlyArrivedId(latestRealtimeAlert.id);
      const timer = setTimeout(() => setNewlyArrivedId(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [latestRealtimeAlert]);

  return (
    <div className="glass-card w-full h-full relative overflow-hidden group border-neonCyan/20">
      {/* Map UI Overlay */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-white/10 p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-neonCyan shadow-neon-cyan animate-pulse"></div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Signal Tracking Active</span>
          </div>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
            Nodes trackable: {alerts.length}
          </p>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-[1000] pointer-events-none">
        <div className="bg-neonRed/10 backdrop-blur-md border border-neonRed/30 p-2 rounded-lg text-neonRed flex items-center gap-2">
          <Navigation size={14} className="animate-bounce" />
          <span className="text-[9px] font-black uppercase">Live Sweep</span>
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
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapController lat={lat} lng={lng} latestAlertId={latestAlert?.id} isNew={!!newlyArrivedId} />

        {alerts.map((alert) => {
          const isBlinking = alert.id === newlyArrivedId;
          let icon = icons.previous(isBlinking);
          
          if (alert.alert_status === 'ACTIVE' && alert.id === latestAlert?.id) {
            icon = icons.active(isBlinking);
          } else if (alert.alert_status === 'RESOLVED') {
            icon = icons.resolved(isBlinking);
          } else if (alert.alert_status === 'ACTIVE') {
            icon = icons.active(isBlinking);
          }

          return (
            <Marker
              key={alert.id}
              position={[alert.latitude, alert.longitude]}
              icon={icon}
              ref={(el) => {
                if (el && isBlinking) el.openPopup();
              }}
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

                    <div className="flex items-center gap-1 text-[9px] text-gray-500 italic mt-1">
                      <Clock size={10} />
                      <span>{new Date(alert.created_at).toLocaleString()}</span>
                    </div>
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
            </Marker>
          );
        })}
      </MapContainer>

      {/* Visual Decoration / Scanners */}
      <div className="absolute inset-0 pointer-events-none border-2 border-neonCyan/5 rounded-2xl z-[1001]"></div>
    </div>
  );
};

export default MapView;

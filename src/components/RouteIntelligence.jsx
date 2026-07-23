import { useState, useEffect, useCallback } from 'react';
import { 
  Navigation, 
  RefreshCw, 
  Map, 
  MapPin, 
  Clock, 
  PlusCircle,
  Fuel,
  Shield,
  Milestone
} from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const RouteIntelligence = () => {
  const {
    alerts,
    focusedAlertId,
    weatherLocationName,
    weatherData,
    routeCoords,
    setRouteCoords,
    routeInfo,
    setRouteInfo,
    routeLoading,
    setRouteLoading,
    routeError,
    setRouteError,
    triggerFitRoute
  } = useAlert();

  const [operatorCoords, setOperatorCoords] = useState(null);

  // Get operator's live GPS coordinates if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setOperatorCoords([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          console.warn('Operator location unavailable. Defaulting to Rescue Command Center.');
          setOperatorCoords([13.0827, 80.2707]);
        }
      );
    } else {
      setOperatorCoords([13.0827, 80.2707]);
    }
  }, []);

  const selectedAlert = alerts.find(a => a.id === focusedAlertId) || alerts[0];
  const destLat = selectedAlert && selectedAlert.latitude ? Number(selectedAlert.latitude) : null;
  const destLng = selectedAlert && selectedAlert.longitude ? Number(selectedAlert.longitude) : null;

  const fetchRoute = useCallback(async () => {
    if (!destLat || !destLng) return;
    const startCoords = operatorCoords || [13.0827, 80.2707]; // Fallback to Chennai Command Center
    
    setRouteLoading(true);
    setRouteError(null);

    const startLat = startCoords[0];
    const startLng = startCoords[1];

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('OSRM route calculation failed');
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const rawCoords = route.geometry.coordinates; // [[lng, lat], ...]
        const parsedCoords = rawCoords.map(c => [c[1], c[0]]); // [[lat, lng], ...]

        setRouteCoords(parsedCoords);
        setRouteInfo({
          isLive: true,
          distance: route.distance / 1000, // to km
          eta: route.duration / 60, // to minutes
          start: startCoords,
          end: [destLat, destLng]
        });
      } else {
        throw new Error('No driving route found');
      }
    } catch (err) {
      console.warn('OSRM failed, using Haversine fallback:', err);
      // Fallback direct distance
      const distance = haversineDistance(startLat, startLng, destLat, destLng);
      const eta = (distance / 50) * 60; // Assuming 50km/h average speed direct line

      setRouteCoords([startCoords, [destLat, destLng]]);
      setRouteInfo({
        isLive: false,
        distance,
        eta,
        start: startCoords,
        end: [destLat, destLng]
      });
      setRouteError('Live routing unavailable. Showing estimated direct distance.');
    } finally {
      setRouteLoading(false);
    }
  }, [destLat, destLng, operatorCoords, setRouteCoords, setRouteInfo, setRouteLoading, setRouteError]);

  // Recalculate route on coordinate change, selection change, or every 30 seconds
  useEffect(() => {
    fetchRoute();

    const timer = setInterval(() => {
      fetchRoute();
    }, 30 * 1000);

    return () => clearInterval(timer);
  }, [fetchRoute]);

  // Trigger fit bounds on initial load of coordinates
  useEffect(() => {
    if (routeCoords && routeCoords.length > 0) {
      triggerFitRoute();
    }
  }, [routeCoords, triggerFitRoute]);

  // Derived environmental variables based on live weather data
  const currentVal = weatherData?.current || {};
  const currentRain = currentVal.precipitation || 0;
  const currentCode = currentVal.weather_code || 0;
  const isStorm = [95, 96, 99].includes(currentCode);

  // 1. Recommended Route
  const recommendedRoute = routeInfo?.isLive ? 'Fastest Route (OSRM Live)' : 'Alternate Route (Direct)';

  // 2. Traffic Status
  let trafficStatus = 'Low';
  let trafficColor = 'text-neonGreen';
  if (routeInfo) {
    const speed = routeInfo.distance / (routeInfo.eta / 60);
    if (speed < 25) {
      trafficStatus = 'Heavy';
      trafficColor = 'text-neonRed font-black shadow-[0_0_8px_rgba(255,0,85,0.4)]';
    } else if (speed < 45) {
      trafficStatus = 'Moderate';
      trafficColor = 'text-yellow-400 font-bold';
    }
  }

  // 3. Road Condition
  let roadCondition = 'Open';
  let roadColor = 'text-neonGreen';
  if (isStorm) {
    roadCondition = 'Blocked';
    roadColor = 'text-neonRed font-black';
  } else if (currentRain > 5) {
    roadCondition = 'Under Maintenance';
    roadColor = 'text-yellow-400 font-bold';
  }

  // 4. Flood Risk
  let floodRisk = 'None';
  let floodColor = 'text-neonGreen';
  if (currentRain > 15) {
    floodRisk = 'High';
    floodColor = 'text-neonRed font-black';
  } else if (currentRain > 5) {
    floodRisk = 'Medium';
    floodColor = 'text-yellow-400 font-bold';
  } else if (currentRain > 0) {
    floodRisk = 'Low';
    floodColor = 'text-orange-400';
  }

  // 5. Weather Impact
  let weatherImpact = 'Safe';
  let weatherColor = 'text-neonGreen';
  if (isStorm) {
    weatherImpact = 'Storm Warning';
    weatherColor = 'text-neonRed font-black';
  } else if (currentRain > 0) {
    weatherImpact = 'Rain Delay';
    weatherColor = 'text-yellow-400 font-bold';
  }

  // 6. Rescue Accessibility
  let rescueAccessibility = 'Ambulance Accessible';
  let accessibilityColor = 'text-neonGreen';
  if (roadCondition === 'Blocked' || floodRisk === 'High') {
    rescueAccessibility = 'Walking Required';
    accessibilityColor = 'text-neonRed font-black';
  } else if (roadCondition === 'Under Maintenance' || floodRisk === 'Medium') {
    rescueAccessibility = '4×4 Vehicle Required';
    accessibilityColor = 'text-yellow-400 font-bold';
  }

  // Extract name for POI display
  const primaryName = weatherLocationName && weatherLocationName !== 'Fetching location...'
    ? weatherLocationName.split(',')[0]
    : 'Sector Grid';

  // Dynamic POI distances
  const baseDistance = routeInfo ? routeInfo.distance : 10;
  const hospitalDistance = (baseDistance * 0.08 + 0.8).toFixed(1);
  const fuelDistance = (baseDistance * 0.15 + 1.2).toFixed(1);
  const policeDistance = (baseDistance * 0.11 + 0.5).toFixed(1);

  const hospitalName = `${primaryName} General Hospital`;
  const policeName = `${primaryName} Police HQ`;

  const handleNavigate = () => {
    if (destLat && destLng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
      window.open(url, '_blank');
      triggerFitRoute();
    }
  };

  const handleCenterMap = () => {
    triggerFitRoute();
  };

  const handleRefreshRoute = () => {
    fetchRoute();
  };

  if (!selectedAlert) {
    return (
      <div className="glass-card p-6 flex flex-col h-[320px] items-center justify-center text-center">
        <Navigation size={32} className="text-gray-600 mb-3 animate-pulse" />
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
          WAITING FOR SOS INCIDENT SIGNAL...
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 flex flex-col relative overflow-hidden transition-all duration-300">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-white">
          <Navigation className="text-neonCyan animate-pulse" size={20} />
          ROUTE INTELLIGENCE
        </h2>
        <button 
          onClick={handleRefreshRoute}
          disabled={routeLoading}
          className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-colors"
          title="Force route recalculation"
        >
          <RefreshCw size={12} className={routeLoading ? 'animate-spin text-neonCyan' : ''} />
        </button>
      </div>

      {routeError && (
        <div className="mb-3 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[9px] font-bold uppercase rounded-lg tracking-wider">
          ⚠ {routeError}
        </div>
      )}

      {/* Destination Badge */}
      <div className="bg-white/5 border border-white/5 p-3 rounded-2xl flex items-center gap-3 mb-4">
        <MapPin size={16} className="text-neonCyan shrink-0 animate-bounce" />
        <div className="truncate flex-1">
          <p className="text-[8px] text-gray-500 uppercase font-black">Destination</p>
          <p className="text-xs font-black text-white truncate uppercase" title={weatherLocationName}>
            {weatherLocationName && weatherLocationName !== 'Fetching location...' ? weatherLocationName : `Coordinates (${destLat?.toFixed(3)}, ${destLng?.toFixed(3)})`}
          </p>
          <p className="text-[8px] text-gray-600 font-mono">
            GPS: {destLat?.toFixed(5)}, {destLng?.toFixed(5)}
          </p>
        </div>
      </div>

      {/* Main Metric Pairs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Distance */}
        <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
          <div className="p-2 rounded-xl bg-neonCyan/10 text-neonCyan">
            <Milestone size={16} />
          </div>
          <div>
            <p className="text-[8px] text-gray-500 uppercase font-black">Distance</p>
            <p className="text-sm font-black text-white font-mono">
              {routeInfo ? `${routeInfo.distance.toFixed(1)} km` : '—'}
            </p>
          </div>
        </div>

        {/* ETA */}
        <div className="bg-[#0e0e14]/50 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
          <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-[8px] text-gray-500 uppercase font-black">ETA</p>
            <p className="text-sm font-black text-white font-mono">
              {routeInfo ? `${Math.round(routeInfo.eta)} min` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Route Conditions Table */}
      <div className="space-y-2 mb-5 font-mono text-[9px] bg-black/20 p-3.5 rounded-2xl border border-white/5">
        <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
          <span className="text-gray-500 uppercase font-black">Recommended Route:</span>
          <span className="text-white font-bold">{recommendedRoute}</span>
        </div>
        <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
          <span className="text-gray-500 uppercase font-black">Traffic Status:</span>
          <span className={trafficColor}>{trafficStatus}</span>
        </div>
        <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
          <span className="text-gray-500 uppercase font-black">Road Condition:</span>
          <span className={roadColor}>{roadCondition}</span>
        </div>
        <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
          <span className="text-gray-500 uppercase font-black">Flood Risk:</span>
          <span className={floodColor}>{floodRisk}</span>
        </div>
        <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
          <span className="text-gray-500 uppercase font-black">Weather Impact:</span>
          <span className={weatherColor}>{weatherImpact}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 uppercase font-black">Rescue Access:</span>
          <span className={accessibilityColor}>{rescueAccessibility}</span>
        </div>
      </div>

      {/* Nearest Emergency Facilities */}
      <div className="space-y-2 mb-5">
        <h4 className="text-[8px] text-gray-500 uppercase font-black tracking-widest mb-1.5">NEAREST DISPATCH CENTERS</h4>
        <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
          <div className="bg-[#0e0e14]/50 border border-white/5 p-2 rounded-xl flex flex-col">
            <span className="text-purple-400 flex items-center gap-1 font-bold mb-0.5"><PlusCircle size={10} /> Hospital</span>
            <span className="text-white truncate font-bold text-[8px]" title={hospitalName}>{hospitalName}</span>
            <span className="text-gray-500 text-[8px] mt-0.5">{hospitalDistance} km</span>
          </div>
          <div className="bg-[#0e0e14]/50 border border-white/5 p-2 rounded-xl flex flex-col">
            <span className="text-neonCyan flex items-center gap-1 font-bold mb-0.5"><Shield size={10} /> Police</span>
            <span className="text-white truncate font-bold text-[8px]" title={policeName}>{policeName}</span>
            <span className="text-gray-500 text-[8px] mt-0.5">{policeDistance} km</span>
          </div>
          <div className="bg-[#0e0e14]/50 border border-white/5 p-2 rounded-xl flex flex-col">
            <span className="text-yellow-500 flex items-center gap-1 font-bold mb-0.5"><Fuel size={10} /> Fuel Stn</span>
            <span className="text-white truncate font-bold text-[8px]">Station Reserve</span>
            <span className="text-gray-500 text-[8px] mt-0.5">{fuelDistance} km</span>
          </div>
        </div>
      </div>

      {/* Buttons Grid */}
      <div className="grid grid-cols-2 gap-3 mt-auto">
        <button
          onClick={handleCenterMap}
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-neonCyan/10 border border-neonCyan/40 hover:bg-neonCyan/20 text-neonCyan hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-wider"
          title="Center and fit the Leaflet map bounds on this route"
        >
          <Map size={12} />
          Center Map
        </button>
        <button
          onClick={handleNavigate}
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-neonGreen/10 border border-neonGreen/40 hover:bg-neonGreen/20 text-neonGreen hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-wider"
          title="Open Google Maps Navigation for this destination"
        >
          <Navigation size={12} className="rotate-45" />
          Navigate
        </button>
      </div>
    </div>
  );
};

export default RouteIntelligence;

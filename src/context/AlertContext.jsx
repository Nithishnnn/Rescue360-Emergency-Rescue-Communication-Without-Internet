import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { supabase } from '../supabase';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

const DEFAULT_SETTINGS = {
  theme: 'dark',
  sound: 'on',
  mapStyle: 'dark',
  markerAnimation: 'on',
  language: 'en',
  autoRefresh: 'off',
  zoomLevel: '15'
};

const getWeatherLabel = (code) => {
  switch (code) {
    case 0: return 'Sunny';
    case 1: case 2: case 3: return 'Cloudy';
    case 45: case 48: return 'Foggy';
    case 51: case 53: case 55: case 56: case 57: return 'Drizzle';
    case 61: case 63: case 65: case 66: case 67: case 80: case 81: case 82: return 'Rainy';
    case 71: case 73: case 75: case 77: case 85: case 86: return 'Snowy';
    case 95: case 96: case 99: return 'Storm';
    default: return 'Cloudy';
  }
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [focusedAlertId, setFocusedAlertId] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 13.0827, lng: 80.2707 });
  const [traceTrigger, setTraceTrigger] = useState(null);

  const traceSignal = (alert) => {
    setFocusedAlertId(alert.id);
    setTraceTrigger({
      id: alert.id,
      latitude: alert.latitude,
      longitude: alert.longitude,
      timestamp: Date.now()
    });
  };

  // Session Control States
  const [sessionActive, setSessionActive] = useState(true);
  const [terminationState, setTerminationState] = useState('idle');

  // Settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('rescue360_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Read alert IDs
  const [readAlertIds, setReadAlertIds] = useState(() => {
    try {
      const saved = localStorage.getItem('rescue360_read_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // System Live Status
  const [systemLiveStatus, setSystemLiveStatus] = useState('OFFLINE');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    latestTime: '—',
    receiverStatus: 'OFFLINE'
  });

  // Fetch alerts
  const fetchAlerts = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('sos_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (fetchErr) {
        console.error('Error fetching alerts:', fetchErr);
        setError(fetchErr.message);
      } else if (data) {
        setAlerts(data);
        setError(null);
        
        // Calculate stats
        const active = data.filter(a => a.alert_status === 'ACTIVE');
        const latest = data[0];
        setStats({
          total: data.length,
          active: active.length,
          latestTime: latest ? new Date(latest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
          receiverStatus: latest?.receiver_status || 'NOMINAL'
        });
      }
    } catch (err) {
      console.error('Telemetry fetch failed:', err);
      setError(err.message);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Update Settings
  const updateSetting = (key, value) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('rescue360_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Mark specific alert as read
  const markAsRead = (id) => {
    setReadAlertIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem('rescue360_read_alerts', JSON.stringify(updated));
      return updated;
    });
  };

  // Mark all alerts as read
  const clearAllNotifications = () => {
    const allIds = alerts.map(a => a.id);
    setReadAlertIds(allIds);
    localStorage.setItem('rescue360_read_alerts', JSON.stringify(allIds));
  };

  // Fetch on mount
  useEffect(() => {
    if (sessionActive) {
      fetchAlerts();
    }
  }, [sessionActive]);

  // Theme application
  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.body.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.body.classList.remove('light-theme');
    }
  }, [settings.theme]);

  // Supabase Realtime channel setup
  useEffect(() => {
    if (!sessionActive) return;

    const channel = supabase
      .channel('sos_alerts_global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_alerts'
        },
        (payload) => {
          console.log('Realtime change received:', payload);
          // Refresh alerts list
          fetchAlerts(true);

          if (payload.eventType === 'INSERT') {
            // Play alert sound if sound setting is ON
            if (settings.sound === 'on') {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.volume = 0.7;
              audio.play().catch(() => {});
            }

            // Animate bell logic triggers by noting new arrival
            const bell = document.getElementById('notification-bell-icon');
            if (bell) {
              bell.classList.remove('animate-wiggle');
              void bell.offsetWidth; // trigger reflow
              bell.classList.add('animate-wiggle');
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setError('Supabase Realtime subscription error.');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [settings.sound, sessionActive]);

  // Auto Refresh Interval
  useEffect(() => {
    if (!sessionActive || settings.autoRefresh === 'off') return;
    const intervalMs = parseInt(settings.autoRefresh, 10) * 1000;
    if (isNaN(intervalMs)) return;

    const timer = setInterval(() => {
      fetchAlerts(true);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [settings.autoRefresh, sessionActive]);

  // System Live Status monitoring (ESP32 telemetry data)
  useEffect(() => {
    if (!sessionActive) return;
    const checkLive = () => {
      if (alerts.length === 0) {
        setSystemLiveStatus('OFFLINE');
        return;
      }
      const latest = alerts[0];
      const alertTime = new Date(latest.created_at).getTime();
      const diffSeconds = (Date.now() - alertTime) / 1000;
      setSystemLiveStatus(diffSeconds <= 30 ? 'ONLINE' : 'OFFLINE');
    };

    checkLive();
    const timer = setInterval(checkLive, 1000);
    return () => clearInterval(timer);
  }, [alerts, sessionActive]);

  // Derived unread alerts count
  const unreadCount = alerts.filter(a => !readAlertIds.includes(a.id)).length;

  const confirmTermination = () => {
    setTerminationState('confirming');
  };

  const cancelTermination = () => {
    setTerminationState('idle');
  };

  const executeTermination = (navigate) => {
    setTerminationState('terminating');
    
    // Stop all background listeners, timers, subscriptions immediately
    setSessionActive(false);
    
    // Clear only temporary cached dashboard data from memory
    setAlerts([]);
    setStats({
      total: 0,
      active: 0,
      latestTime: '—',
      receiverStatus: 'OFFLINE'
    });
    setSystemLiveStatus('OFFLINE');
    setError(null);

    // Keep showing loading spinner with "Ending monitoring session..." for 1.5s
    setTimeout(() => {
      setTerminationState('completed');
      
      // Keep showing "Monitoring session terminated successfully." for 1.2s
      // during which the UI fades out, then navigate to welcome landing page
      setTimeout(() => {
        setTerminationState('idle');
        navigate('/welcome');
      }, 1200);
    }, 1500);
  };

  const startSession = () => {
    setSessionActive(true);
  };

  // Weather telemetry state
  const [weatherData, setWeatherData] = useState(null);
  const [weatherAqi, setWeatherAqi] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(false);
  const [weatherLocationName, setWeatherLocationName] = useState('Fetching location...');
  const [weatherLastUpdated, setWeatherLastUpdated] = useState('');
  
  const weatherCacheRef = useRef({});
  const lastFetchedCoordsRef = useRef({ lat: null, lng: null });

  // Custom clicked locations state & handlers
  const [clickedLocations, setClickedLocations] = useState([]);
  const [activeWeatherCoords, setActiveWeatherCoords] = useState(null);

  const handleMapClick = (lat, lng) => {
    // No-op to ignore map background/arbitrary clicks
  };

  const selectClickedLocation = async (loc) => {
    const alertExists = alerts.some(a => a.id === loc.id);
    if (alertExists) {
      setFocusedAlertId(loc.id);
    }
  };

  const clearCustomFocus = () => {
    setActiveWeatherCoords(null);
  };

  // Route Intelligence states
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [fitRouteTrigger, setFitRouteTrigger] = useState(0);

  const triggerFitRoute = useCallback(() => setFitRouteTrigger(prev => prev + 1), []);

  const fetchWeatherForCoordinates = async (latitude, longitude, forceBypass = false) => {
    if (!focusedAlertId) return;
    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    if (isNaN(latNum) || isNaN(lngNum)) return;

    const key = `${latNum.toFixed(3)},${lngNum.toFixed(3)}`;
    const now = Date.now();
    const cache = weatherCacheRef.current[key];

    if (!forceBypass && cache && now - cache.timestamp < 5 * 60 * 1000) {
      setWeatherData(cache.data);
      setWeatherAqi(cache.aqi);
      setWeatherLocationName(cache.locationName);
      setWeatherLastUpdated(new Date(cache.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setWeatherLoading(false);
      setWeatherError(false);
      lastFetchedCoordsRef.current = { lat: latNum, lng: lngNum };
      return;
    }

    setWeatherLoading(true);
    setWeatherError(false);

    // If new coordinates are different from current weather coordinates, clear data to trigger loading animations immediately
    const latChanged = lastFetchedCoordsRef.current.lat !== latNum;
    const lngChanged = lastFetchedCoordsRef.current.lng !== lngNum;
    if (latChanged || lngChanged) {
      setWeatherData(null);
      setWeatherAqi(null);
      lastFetchedCoordsRef.current = { lat: latNum, lng: lngNum };
    }

    try {
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lngNum}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,visibility,wind_speed_10m,wind_gusts_10m,cloud_cover,pressure_msl,uv_index,dew_point_2m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,dew_point_2m,uv_index,visibility&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto`;
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latNum}&longitude=${lngNum}&current=us_aqi`;
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latNum}&lon=${lngNum}`;

      const [forecastRes, aqiRes, locationRes] = await Promise.all([
        fetch(forecastUrl),
        fetch(aqiUrl).catch(() => null),
        fetch(nominatimUrl, {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'Rescue360-Weather-Agent/1.0'
          }
        }).catch(() => null)
      ]);

      if (!forecastRes.ok) throw new Error('Forecast fetch failed');
      const forecastData = await forecastRes.json();

      let aqiVal = null;
      if (aqiRes && aqiRes.ok) {
        const aqiData = await aqiRes.json();
        aqiVal = aqiData.current?.us_aqi ?? null;
      }

      let name = `Area (${latNum.toFixed(3)}, ${lngNum.toFixed(3)})`;
      let locationData = {};
      if (locationRes && locationRes.ok) {
        locationData = await locationRes.json();
        const address = locationData.address || {};
        const city = address.city || address.town || address.village || address.suburb || address.neighbourhood || address.hamlet || address.city_district;
        const district = address.county || address.state_district || address.district;
        const state = address.state;

        const parts = [];
        if (city) parts.push(city);
        if (district) parts.push(district);
        if (state) parts.push(state);

        if (parts.length > 0) {
          name = parts.join(', ');
        }
      }

      const cacheVal = {
        timestamp: Date.now(),
        data: forecastData,
        aqi: aqiVal,
        locationName: name
      };
      weatherCacheRef.current[key] = cacheVal;

      setWeatherData(forecastData);
      setWeatherAqi(aqiVal);
      setWeatherLocationName(name);
      setWeatherLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setWeatherError(false);

      // Save custom coordinates cache to clickedLocations
      if (activeWeatherCoords && activeWeatherCoords.isCustom) {
        const address = locationData.address || {};
        const area = name;
        const district = address.county || address.state_district || address.district || '';
        const state = address.state || '';
        const country = address.country || '';
        
        const currentData = forecastData.current || {};
        const condLabel = getWeatherLabel(currentData.weather_code ?? 0);

        setClickedLocations(prev => {
          const existingIdx = prev.findIndex(loc => loc.id === activeWeatherCoords.id);
          const newLoc = {
            id: activeWeatherCoords.id,
            latitude: latNum,
            longitude: lngNum,
            area,
            district,
            state,
            country,
            temperature: currentData.temperature_2m ?? 0,
            humidity: currentData.relative_humidity_2m ?? 0,
            windSpeed: currentData.wind_speed_10m ?? 0,
            pressure: currentData.pressure_msl ?? 1013,
            visibility: currentData.visibility ? currentData.visibility / 1000 : 10,
            weatherCondition: condLabel,
            weatherIcon: currentData.weather_code ?? 0,
            timestamp: Date.now(),
            weatherData: forecastData,
            weatherAqi: aqiVal,
            locationName: name
          };

          if (existingIdx !== -1) {
            const updated = [...prev];
            updated[existingIdx] = newLoc;
            return updated;
          } else {
            return [newLoc, ...prev];
          }
        });
      }
    } catch (err) {
      console.error('Unified Weather Fetch Error:', err);
      setWeatherError(true);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionActive) return;

    if (!focusedAlertId) {
      // Clear weather data when no alert is focused
      setWeatherData(null);
      setWeatherAqi(null);
      setActiveWeatherCoords(null);
      return;
    }

    let selectedAlert = alerts.find(a => a.id === focusedAlertId);
    if (!selectedAlert && traceTrigger && traceTrigger.id === focusedAlertId) {
      selectedAlert = traceTrigger;
    }
    if (!selectedAlert) return;

    const lat = Number(selectedAlert.latitude);
    const lng = Number(selectedAlert.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    // Check if we have cached weather for this alert in clickedLocations
    const existing = clickedLocations.find(loc => loc.id === selectedAlert.id);
    if (existing) {
      const now = Date.now();
      const isExpired = (now - existing.timestamp) > 5 * 60 * 1000;
      if (!isExpired) {
        setWeatherData(existing.weatherData);
        setWeatherAqi(existing.weatherAqi);
        setWeatherLocationName(existing.locationName);
        setWeatherLastUpdated(new Date(existing.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setWeatherLoading(false);
        setWeatherError(false);
        setActiveWeatherCoords({ lat: existing.latitude, lng: existing.longitude, isCustom: true, id: existing.id });
        return;
      }
    }

    setActiveWeatherCoords({ lat, lng, isCustom: true, id: selectedAlert.id });
    fetchWeatherForCoordinates(lat, lng);

    const interval = setInterval(() => {
      fetchWeatherForCoordinates(lat, lng, true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [focusedAlertId, alerts, sessionActive, clickedLocations, traceTrigger]);

  return (
    <AlertContext.Provider
      value={{
        alerts,
        loading,
        error,
        stats,
        settings,
        updateSetting,
        readAlertIds,
        markAsRead,
        clearAllNotifications,
        unreadCount,
        focusedAlertId,
        setFocusedAlertId,
        mapCenter,
        setMapCenter,
        systemLiveStatus,
        fetchAlerts,
        sessionActive,
        terminationState,
        confirmTermination,
        cancelTermination,
        executeTermination,
        startSession,
        weatherData,
        weatherAqi,
        weatherLoading,
        weatherError,
        weatherLocationName,
        weatherLastUpdated,
        fetchWeatherForCoordinates,
        routeCoords,
        setRouteCoords,
        routeInfo,
        setRouteInfo,
        routeLoading,
        setRouteLoading,
        routeError,
        setRouteError,
        fitRouteTrigger,
        setFitRouteTrigger,
        triggerFitRoute,
        clickedLocations,
        activeWeatherCoords,
        handleMapClick,
        selectClickedLocation,
        clearCustomFocus,
        traceTrigger,
        traceSignal
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

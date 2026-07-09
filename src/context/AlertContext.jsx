import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
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

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [focusedAlertId, setFocusedAlertId] = useState(null);

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
        systemLiveStatus,
        fetchAlerts,
        sessionActive,
        terminationState,
        confirmTermination,
        cancelTermination,
        executeTermination,
        startSession
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

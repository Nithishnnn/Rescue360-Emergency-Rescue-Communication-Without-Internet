import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ 
    total: 0, 
    active: 0, 
    latestTime: '—', 
    receiverStatus: 'OFFLINE'
  });

  const calcStats = (data) => {
    if (!data || data.length === 0) return;
    
    const latest = data[0];
    const active = data.filter(a => a.alert_status === 'ACTIVE');

    setStats({
      total: data.length,
      active: active.length,
      latestTime: new Date(latest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      receiverStatus: latest.receiver_status || 'NOMINAL'
    });
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      console.log('Supabase: Fetching with hardware schema keys...');
      const { data, error } = await supabase
        .from('sos_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('Supabase Fetch Error:', error);
        setError(error.message);
      } else {
        console.log(`Supabase: Successfully fetched ${data.length} alerts.`);
        setAlerts(data);
        calcStats(data);
      }
      setLoading(false);
    };

    fetchAlerts();

    const channel = supabase
      .channel('sos_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sos_alerts'
        },
        (payload) => {
          console.log(payload);
          fetchAlerts();
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setError('Realtime channel error. Check Supabase settings.');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { alerts, loading, error, stats };
};

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export const useRealtime = () => {
  const [latestAlert, setLatestAlert] = useState(null);

  useEffect(() => {
    const channel = supabase
      .channel('sos_new_alert_trigger')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sos_alerts' },
        (payload) => {
          setLatestAlert(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { latestAlert, setLatestAlert };
};

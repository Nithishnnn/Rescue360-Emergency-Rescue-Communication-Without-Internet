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
          // Play emergency sound
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.volume = 0.7;
          audio.play().catch(() => {}); // suppress autoplay policy errors
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { latestAlert, setLatestAlert };
};

import { 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Cpu 
} from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { useRealtime } from '../hooks/useRealtime';
import AlertCard from '../components/AlertCard';
import AlertTable from '../components/AlertTable';
import MapView from '../components/MapView';
import StatusCard from '../components/StatusCard';
import NotificationPopup from '../components/NotificationPopup';
import AnalyticsCard from '../components/AnalyticsCard';
import Navbar from '../components/Navbar';

const buildChartData = (alerts) => {
  const hours = [...Array(6)].map((_, i) => {
    const d = new Date();
    d.setHours(d.getHours() - (5 - i));
    return d.getHours();
  });
  return hours.map(h => ({
    name: `${String(h).padStart(2, '0')}:00`,
    alerts: alerts.filter(a => {
      const d = new Date(a.created_at);
      return d.getHours() === h;
    }).length,
  }));
};

const Skeleton = ({ className }) => <div className={`animate-pulse bg-white/10 rounded-xl ${className}`} />;

const Dashboard = () => {
  const { alerts, loading, stats, error } = useAlert();
  const { latestAlert, setLatestAlert } = useRealtime();

  const chartData = buildChartData(alerts);
  const latestLat = alerts[0]?.latitude || 13.0827;
  const latestLng = alerts[0]?.longitude || 80.2707;

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
      <Navbar pageTitle="Command Overview" />
      <NotificationPopup alert={latestAlert} onClose={() => setLatestAlert(null)} />

      <main className="p-8 flex-1 space-y-8">
        {error && (
          <div className="bg-neonRed/10 border border-neonRed/50 p-4 rounded-xl text-neonRed text-xs font-bold text-center">
            Critical Data Error: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />) : (
            <>
              <AlertCard title="Total Alerts" value={stats.total} icon={AlertTriangle} color="cyan" />
              <AlertCard title="Active SOS" value={stats.active} icon={ShieldAlert} color="red" />
              <AlertCard title="Last Signal" value={stats.latestTime} icon={Clock} color="cyan" />
              <AlertCard title="Receiver Status" value={stats.receiverStatus} icon={Cpu} color="red" />
            </>
          )}
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8 h-[500px]">
            {loading ? <Skeleton className="w-full h-full" /> : 
             <MapView 
               lat={latestLat} 
               lng={latestLng} 
               alerts={alerts} 
               latestRealtimeAlert={latestAlert}
             />}
          </div>
          <div className="col-span-12 lg:col-span-4">
            <StatusCard status={{ loraConnected: true, gpsActive: true, receiverOnline: true, battery: alerts[0]?.battery_level || 100, signalStrength: alerts[0]?.signal_strength || 0 }} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnalyticsCard title="Signal Propagation Flux" data={chartData} dataKey="alerts" />
          <div className="glass-card p-6">
            <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-5">Live Transmissions</h3>
            <div className="space-y-3">
              {alerts.slice(0, 4).map((alert, i) => (
                <div key={alert.id || i} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${alert.alert_status === 'ACTIVE' ? 'bg-red-500' : 'bg-green-500'}`} />
                    <div>
                      <p className="text-xs font-bold text-white">{alert.emergency_message}</p>
                      <p className="text-[9px] text-gray-500 uppercase font-black">{alert.sender_device_id} · {alert.user_name}</p>
                    </div>
                  </div>
                  <div className="text-[9px] font-mono text-gray-600 text-right">
                    {Number(alert.latitude).toFixed(3)}, {Number(alert.longitude).toFixed(3)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AlertTable alerts={alerts} loading={loading} />
      </main>
    </div>
  );
};

export default Dashboard;

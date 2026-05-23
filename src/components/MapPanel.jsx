import React from 'react';
import { Map as MapIcon, Maximize2, ExternalLink } from 'lucide-react';
import HeatmapOverlay from './HeatmapOverlay';

const MapPanel = ({ lat, lng, zoom = 15 }) => {
  // Google Maps Embed URL
  const mapUrl = `https://www.google.com/maps/embed/v1/view?key=YOUR_GOOGLE_MAPS_API_KEY&center=${lat},${lng}&zoom=${zoom}&maptype=satellite`;
  
  // Alternative fallback if no API key: standard interactive map search
  const fallbackUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed&t=k`;

  return (
    <div className="glass-card p-6 h-full flex flex-col relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MapIcon className="text-neonCyan shadow-neon-cyan" /> 
          Live Location Tracking
        </h2>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-all" title="Fullscreen">
            <Maximize2 size={18} />
          </button>
          <a 
            href={`https://www.google.com/maps?q=${lat},${lng}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 hover:bg-neonCyan/20 rounded-lg text-neonCyan transition-all"
            title="Open in Google Maps"
          >
            <ExternalLink size={18} />
          </a>
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden border border-white/10 relative">
        <iframe
          title="SOS Location Map"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={fallbackUrl}
          className="filter grayscale brightness-75 contrast-125"
        ></iframe>
        
        {/* Heatmap & Route tracking overlay */}
        <HeatmapOverlay alerts={[
          { lat, lng },
          { lat: lat + 0.002, lng: lng + 0.002 },
          { lat: lat + 0.004, lng: lng + 0.001 }
        ]} />

        {/* Overlay pulse on current location center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-12 h-12 bg-neonRed/30 rounded-full flex items-center justify-center sos-pulse">
            <div className="w-4 h-4 bg-neonRed rounded-full shadow-neon-red"></div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="text-gray-500 uppercase text-[10px] tracking-widest">Latitude</span>
            <span className="font-mono text-neonCyan">{lat.toFixed(6)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 uppercase text-[10px] tracking-widest">Longitude</span>
            <span className="font-mono text-neonCyan">{lng.toFixed(6)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-neonCyan/10 border border-neonCyan/30 rounded-full">
          <div className="w-2 h-2 bg-neonCyan rounded-full animate-pulse shadow-neon-cyan"></div>
          <span className="text-neonCyan text-[10px] font-bold uppercase">GPS Active</span>
        </div>
      </div>
    </div>
  );
};

export default MapPanel;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <div className="flex bg-background min-h-screen text-gray-100 bg-grid font-sans selection:bg-neonCyan/30 selection:text-neonCyan">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>

        {/* Global floating particles background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {[...Array(10)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-px h-px bg-neonCyan/40 blur-[1px] animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            ></div>
          ))}
        </div>
      </div>
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Welcome from './pages/Welcome';
import TerminationOverlays from './components/TerminationOverlays';
import { AlertProvider, useAlert } from './context/AlertContext';

function AppContent() {
  const { sessionActive, terminationState } = useAlert();
  const location = useLocation();
  
  const isWelcomePage = location.pathname === '/welcome';
  const isFadingOut = terminationState === 'completed';

  return (
    <div className={`flex bg-background min-h-screen text-gray-100 bg-grid font-sans selection:bg-neonCyan/30 selection:text-neonCyan transition-all duration-1000 ${
      isFadingOut ? 'opacity-0 scale-95 blur-sm' : 'opacity-100'
    }`}>
      {sessionActive && !isWelcomePage && <Sidebar />}
      
      <div className="flex-1 flex flex-col overflow-hidden h-screen">
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route 
            path="/" 
            element={sessionActive ? <Dashboard /> : <Navigate to="/welcome" replace />} 
          />
          <Route 
            path="/alerts" 
            element={sessionActive ? <Alerts /> : <Navigate to="/welcome" replace />} 
          />
          <Route 
            path="/analytics" 
            element={sessionActive ? <Analytics /> : <Navigate to="/welcome" replace />} 
          />
          <Route 
            path="/settings" 
            element={sessionActive ? <Settings /> : <Navigate to="/welcome" replace />} 
          />
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

      {/* Session Termination Confirmation & Progress Overlays */}
      <TerminationOverlays />
    </div>
  );
}

function App() {
  return (
    <AlertProvider>
      <Router>
        <AppContent />
      </Router>
    </AlertProvider>
  );
}

export default App;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';
import { 
  Bell, 
  User, 
  Settings as SettingsIcon, 
  Search, 
  Check, 
  Trash2, 
  MapPin, 
  Navigation, 
  ExternalLink,
  Volume2,
  VolumeX,
  Languages,
  Monitor,
  Eye,
  Key,
  LogOut,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ pageTitle }) => {
  const navigate = useNavigate();
  const { 
    alerts, 
    loading, 
    settings, 
    updateSetting, 
    readAlertIds, 
    markAsRead, 
    clearAllNotifications, 
    unreadCount, 
    setFocusedAlertId, 
    systemLiveStatus,
    confirmTermination,
    terminationState
  } = useAlert();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // Dropdown Open States
  const [bellOpen, setBellOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Profile Edit States
  const [profileEditing, setProfileEditing] = useState(false);
  const [operatorName, setOperatorName] = useState(() => localStorage.getItem('rescue360_operator_name') || 'Cmdr. Admin');
  const [operatorRole, setOperatorRole] = useState(() => localStorage.getItem('rescue360_operator_role') || 'Level 5 Clearance');
  
  // Change Password States
  const [passwordFormOpen, setPasswordFormOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Bell animation trigger
  const [bellWiggle, setBellWiggle] = useState(false);

  // Refs for click outside handling
  const searchRef = useRef();
  const bellRef = useRef();
  const settingsRef = useRef();
  const profileRef = useRef();

  useEffect(() => {
    if (unreadCount > 0) {
      setBellWiggle(true);
      const timer = setTimeout(() => setBellWiggle(false), 800);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // 1. Search Logic
  const filteredSuggestions = searchQuery.trim() ? alerts.filter(a => {
    const q = searchQuery.toLowerCase();
    const latStr = String(a.latitude).toLowerCase();
    const lngStr = String(a.longitude).toLowerCase();
    const coordsStr = `${latStr}, ${lngStr}`;
    const dateStr = new Date(a.created_at).toLocaleString().toLowerCase();

    return (
      a.user_name?.toLowerCase().includes(q) ||
      a.emergency_message?.toLowerCase().includes(q) ||
      a.sender_device_id?.toLowerCase().includes(q) ||
      a.receiver_device_id?.toLowerCase().includes(q) ||
      a.alert_status?.toLowerCase().includes(q) ||
      a.emergency_type?.toLowerCase().includes(q) ||
      coordsStr.includes(q) ||
      dateStr.includes(q)
    );
  }).slice(0, 6) : [];

  const handleSuggestionClick = (alert) => {
    setSearchQuery('');
    setSearchFocused(false);
    setFocusedAlertId(alert.id);
    navigate('/');
  };

  // 2. Profile Actions
  const handleProfileSave = (e) => {
    e.preventDefault();
    localStorage.setItem('rescue360_operator_name', operatorName);
    localStorage.setItem('rescue360_operator_role', operatorRole);
    setProfileEditing(false);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    setPasswordSuccess("Access cipher updated successfully!");
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setPasswordSuccess('');
      setPasswordFormOpen(false);
    }, 2000);
  };

  const handleLogout = () => {
    confirmTermination();
  };

  return (
    <nav className="h-20 flex items-center justify-between px-8 bg-card backdrop-blur-md border-b border-white/5 z-40 relative">
      {/* Left side: title & search */}
      <div className="flex items-center gap-4 flex-1">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider hidden sm:block">{pageTitle}</h2>
        <div className="h-4 w-[1px] bg-white/10 mx-2 hidden sm:block"></div>
        
        {/* Dynamic Search Bar */}
        <div className="relative group flex-1 max-w-md z-50" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neonCyan transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search command vault..."
            className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:neon-border-cyan w-full transition-all text-white placeholder:text-gray-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
          />

          {/* Search suggestions dropdown */}
          <AnimatePresence>
            {searchFocused && searchQuery.trim() && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 mt-2 glass-card border border-white/10 shadow-2xl overflow-hidden max-h-96 overflow-y-auto custom-scrollbar bg-[#0a0a0f]/95"
              >
                {filteredSuggestions.length > 0 ? (
                  <div className="p-2 space-y-1">
                    <p className="text-[9px] font-black text-neonCyan uppercase tracking-widest px-3 py-1">Search Results</p>
                    {filteredSuggestions.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => handleSuggestionClick(a)}
                        className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/5 flex flex-col gap-1"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-white text-xs">{a.user_name || 'Unknown User'}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                            a.alert_status === 'ACTIVE' ? 'bg-neonRed/10 text-neonRed border border-neonRed/20' : 'bg-neonGreen/10 text-neonGreen border border-neonGreen/20'
                          }`}>
                            {a.alert_status}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate max-w-full italic">"{a.emergency_message}"</p>
                        <div className="flex justify-between items-center text-[8px] text-gray-600 font-mono">
                          <span>{a.emergency_type || 'GENERAL'} · {a.sender_device_id}</span>
                          <span>{new Date(a.created_at).toLocaleDateString()} {new Date(a.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-600 text-xs uppercase tracking-widest font-bold">
                    No matching vault records
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right side: system status, notifications, settings, user profile */}
      <div className="flex items-center gap-6">
        
        {/* System Live Indicator */}
        <div className={`flex items-center gap-2 px-4 py-2 border rounded-full transition-all ${
          systemLiveStatus === 'ONLINE' 
            ? 'bg-neonCyan/5 border-neonCyan/20 text-neonCyan' 
            : 'bg-neonRed/5 border-neonRed/20 text-neonRed shadow-neon-red/10'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            systemLiveStatus === 'ONLINE' ? 'bg-neonCyan animate-ping' : 'bg-neonRed animate-pulse'
          }`}></div>
          <span className="text-[10px] font-black uppercase tracking-tight">
            System {systemLiveStatus}
          </span>
        </div>

        {/* Bell Icon & Notification Stream */}
        <div className="relative" ref={bellRef}>
          <button 
            onClick={() => setBellOpen(!bellOpen)}
            className={`p-2 text-gray-400 hover:text-white transition-all relative rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 ${bellWiggle ? 'animate-wiggle text-neonRed' : ''}`}
            id="notification-bell-icon"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 bg-neonRed rounded-full shadow-neon-red flex items-center justify-center text-[8px] font-black text-white px-1 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {bellOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-96 glass-card border border-white/10 shadow-2xl p-4 bg-[#0a0a0f]/95 z-50 flex flex-col max-h-[480px]"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-neonRed rounded-full shadow-neon-red animate-pulse"></span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">Live SOS Alerts</h3>
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={clearAllNotifications}
                      className="text-[9px] text-gray-500 hover:text-white uppercase font-black transition-all flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md border border-white/5"
                    >
                      <Trash2 size={10} />
                      Clear All
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1 max-h-[350px]">
                  {alerts.length > 0 ? (
                    alerts.slice(0, 15).map((a) => {
                      const isUnread = !readAlertIds.includes(a.id);
                      return (
                        <div 
                          key={a.id}
                          className={`p-3 rounded-xl border transition-all flex gap-3 items-start relative group ${
                            isUnread 
                              ? 'bg-neonRed/5 border-neonRed/20 hover:bg-neonRed/10' 
                              : 'bg-white/5 border-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => {
                              setFocusedAlertId(a.id);
                              navigate('/');
                              setBellOpen(false);
                            }}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-white text-xs">{a.user_name || 'Unknown User'}</span>
                              <span className="text-[8px] text-gray-500 font-mono">
                                {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className={`text-[10px] leading-relaxed italic ${isUnread ? 'text-white font-medium' : 'text-gray-400'}`}>
                              "{a.emergency_message}"
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-[8px] text-gray-600 font-mono">
                              <MapPin size={8} />
                              <span>{parseFloat(a.latitude).toFixed(4)}, {parseFloat(a.longitude).toFixed(4)}</span>
                              <span>·</span>
                              <span className={a.alert_status === 'ACTIVE' ? 'text-neonRed font-bold' : 'text-neonGreen'}>{a.alert_status}</span>
                            </div>
                          </div>

                          {isUnread && (
                            <button
                              onClick={() => markAsRead(a.id)}
                              className="p-1.5 bg-neonRed/10 hover:bg-neonRed/20 border border-neonRed/20 hover:border-neonRed text-neonRed rounded-lg transition-all shrink-0 mt-0.5"
                              title="Mark as Read"
                            >
                              <Check size={12} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-10 text-center text-gray-600 text-xs font-bold uppercase tracking-widest">
                      No active emergency signals
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings Icon & Dropdown */}
        <div className="relative" ref={settingsRef}>
          <button 
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="p-2 text-gray-400 hover:text-white transition-all rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5"
          >
            <SettingsIcon size={20} />
          </button>

          <AnimatePresence>
            {settingsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 glass-card border border-white/10 shadow-2xl p-4 bg-[#0a0a0f]/95 z-50 space-y-4"
              >
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <SettingsIcon className="text-neonCyan animate-spin-slow" size={14} />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">System Protocols</h3>
                </div>

                <div className="space-y-3">
                  {/* Theme */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">UI Theme</span>
                    <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/5">
                      {['dark', 'light'].map((t) => (
                        <button
                          key={t}
                          onClick={() => updateSetting('theme', t)}
                          className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${
                            settings.theme === t 
                              ? 'bg-neonCyan/20 text-neonCyan border border-neonCyan/30 shadow-sm' 
                              : 'text-gray-500 hover:text-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sound */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Audio Alerts</span>
                    <button
                      onClick={() => updateSetting('sound', settings.sound === 'on' ? 'off' : 'on')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[9px] font-black uppercase transition-all ${
                        settings.sound === 'on' 
                          ? 'bg-neonGreen/10 border-neonGreen/30 text-neonGreen shadow-[0_0_8px_rgba(57,255,20,0.15)]' 
                          : 'bg-white/5 border-white/10 text-gray-500'
                      }`}
                    >
                      {settings.sound === 'on' ? <Volume2 size={10} /> : <VolumeX size={10} />}
                      {settings.sound}
                    </button>
                  </div>

                  {/* Map Style */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Map Style</span>
                    <select
                      value={settings.mapStyle}
                      onChange={(e) => updateSetting('mapStyle', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none focus:border-neonCyan transition-all w-full cursor-pointer"
                    >
                      <option value="dark" className="bg-[#0a0a0f]">Cyber Dark Mode</option>
                      <option value="street" className="bg-[#0a0a0f]">Standard Streets</option>
                      <option value="satellite" className="bg-[#0a0a0f]">Orbital Satellite</option>
                    </select>
                  </div>

                  {/* Marker Animation */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Marker Sweep</span>
                    <button
                      onClick={() => updateSetting('markerAnimation', settings.markerAnimation === 'on' ? 'off' : 'on')}
                      className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase transition-all ${
                        settings.markerAnimation === 'on' 
                          ? 'bg-neonCyan/10 border-neonCyan/30 text-neonCyan shadow-[0_0_8px_rgba(0,242,255,0.15)]' 
                          : 'bg-white/5 border-white/10 text-gray-500'
                      }`}
                    >
                      {settings.markerAnimation}
                    </button>
                  </div>

                  {/* Language */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Language</span>
                    <div className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded-lg">
                      <Languages size={10} className="text-gray-500" />
                      <select
                        value={settings.language}
                        onChange={(e) => updateSetting('language', e.target.value)}
                        className="bg-transparent border-0 text-[10px] font-bold text-white focus:outline-none cursor-pointer"
                      >
                        <option value="en" className="bg-[#0a0a0f]">EN</option>
                        <option value="es" className="bg-[#0a0a0f]">ES</option>
                        <option value="fr" className="bg-[#0a0a0f]">FR</option>
                      </select>
                    </div>
                  </div>

                  {/* Auto Refresh */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Data Sync</span>
                    <select
                      value={settings.autoRefresh}
                      onChange={(e) => updateSetting('autoRefresh', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg p-1.5 text-[9px] font-bold text-white focus:outline-none focus:border-neonCyan transition-all cursor-pointer"
                    >
                      <option value="off" className="bg-[#0a0a0f]">Realtime Only</option>
                      <option value="10" className="bg-[#0a0a0f]">Interval 10s</option>
                      <option value="30" className="bg-[#0a0a0f]">Interval 30s</option>
                      <option value="60" className="bg-[#0a0a0f]">Interval 60s</option>
                    </select>
                  </div>

                  {/* Default Zoom Level */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Zoom Bounds</span>
                    <select
                      value={settings.zoomLevel}
                      onChange={(e) => updateSetting('zoomLevel', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg p-1.5 text-[9px] font-bold text-white focus:outline-none focus:border-neonCyan transition-all cursor-pointer"
                    >
                      <option value="10" className="bg-[#0a0a0f]">Wide (10)</option>
                      <option value="13" className="bg-[#0a0a0f]">Mid (13)</option>
                      <option value="15" className="bg-[#0a0a0f]">Normal (15)</option>
                      <option value="18" className="bg-[#0a0a0f]">Focused (18)</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="h-8 w-[1px] bg-white/10 mx-1"></div>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
          >
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-white leading-none">{operatorName}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{operatorRole}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-neonCyan/20 border border-neonCyan/40 flex items-center justify-center group-hover:neon-border-cyan transition-all">
              <User size={18} className="text-neonCyan" />
            </div>
          </div>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 glass-card border border-white/10 shadow-2xl p-5 bg-[#0a0a0f]/95 z-50 space-y-4 text-xs"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                  <div className="w-12 h-12 bg-neonCyan/10 border border-neonCyan/30 rounded-xl flex items-center justify-center text-neonCyan font-black text-sm uppercase shrink-0">
                    HQ
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{operatorName}</h3>
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider">{operatorRole}</p>
                  </div>
                </div>

                {/* Profile Details Grid */}
                {!profileEditing && !passwordFormOpen && (
                  <div className="space-y-3.5">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[9px] text-gray-500 uppercase font-black">Status</span>
                      <span className="text-neonGreen font-bold flex items-center gap-1 uppercase tracking-wider text-[9px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-neonGreen animate-ping"></span>
                        Active Operator
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[9px] text-gray-500 uppercase font-black">Last Logged</span>
                      <span className="text-gray-300 font-mono text-[10px]">Today, 08:15 AM</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => setProfileEditing(true)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-lg transition-all text-[9px] font-black uppercase tracking-wider"
                      >
                        <Edit2 size={10} />
                        Edit Profile
                      </button>
                      <button
                        onClick={() => setPasswordFormOpen(true)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-lg transition-all text-[9px] font-black uppercase tracking-wider"
                      >
                        <Key size={10} />
                        Cipher
                      </button>
                    </div>

                    <button
                      onClick={handleLogout}
                      disabled={terminationState !== 'idle'}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 bg-neonRed/10 hover:bg-neonRed/20 border border-neonRed/20 hover:border-neonRed text-neonRed rounded-lg transition-all text-[9px] font-black uppercase tracking-widest pt-3 border-t border-white/5 ${
                        terminationState !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <LogOut size={12} />
                      Terminate Session
                    </button>
                  </div>
                )}

                {/* Edit Profile Form */}
                {profileEditing && (
                  <form onSubmit={handleProfileSave} className="space-y-3.5">
                    <p className="text-[9px] text-neonCyan font-black uppercase tracking-widest">Edit Credentials</p>
                    <div className="space-y-1.5">
                      <label className="text-[8px] text-gray-500 uppercase font-black">Operator Name</label>
                      <input
                        type="text"
                        value={operatorName}
                        onChange={(e) => setOperatorName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-neonCyan"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] text-gray-500 uppercase font-black">Clearance / Role</label>
                      <input
                        type="text"
                        value={operatorRole}
                        onChange={(e) => setOperatorRole(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-neonCyan"
                        required
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setProfileEditing(false)}
                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 rounded-lg transition-all font-black text-[9px] uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-neonCyan/20 hover:bg-neonCyan/30 border border-neonCyan/40 text-neonCyan rounded-lg transition-all font-black text-[9px] uppercase tracking-wider"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}

                {/* Change Cipher Form */}
                {passwordFormOpen && (
                  <form onSubmit={handlePasswordChange} className="space-y-3.5">
                    <p className="text-[9px] text-neonCyan font-black uppercase tracking-widest">Update Session Cipher</p>
                    {passwordSuccess && (
                      <div className="p-2 bg-neonGreen/10 border border-neonGreen/30 text-neonGreen font-bold text-[9px] rounded text-center uppercase tracking-wider">
                        {passwordSuccess}
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[8px] text-gray-500 uppercase font-black">Current Cipher</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-neonCyan font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-gray-500 uppercase font-black">New Cipher</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-neonCyan font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-gray-500 uppercase font-black">Confirm New Cipher</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-neonCyan font-mono"
                        required
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setPasswordFormOpen(false)}
                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 rounded-lg transition-all font-black text-[9px] uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-neonCyan/20 hover:bg-neonCyan/30 border border-neonCyan/40 text-neonCyan rounded-lg transition-all font-black text-[9px] uppercase tracking-wider"
                      >
                        Commit
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  Coins, 
  Volume2, 
  VolumeX, 
  Menu, 
  X, 
  User, 
  LogOut, 
  Compass, 
  Users, 
  Scroll, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { muted, toggleMute, playClick } = useSound();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const xpPercentage = user ? Math.min(100, Math.round((user.xp / (user.xpToNextLevel || 100)) * 100)) : 0;

  return (
    <header className="sticky top-0 z-40 bg-[#0d0f18]/90 backdrop-blur-md border-b border-purple-900/30 px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        
        {/* Left: Hamburger + Brand */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { playClick(); onToggleSidebar(); }}
            className="lg:hidden p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 transition"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link 
            to="/" 
            onClick={playClick}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-500 p-[1.5px] shadow-lg shadow-purple-900/40 group-hover:shadow-purple-600/50 transition">
              <div className="w-full h-full bg-[#0a0b12] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <span className="font-['Orbitron',sans-serif] font-bold text-lg tracking-wider bg-gradient-to-r from-purple-300 via-indigo-200 to-pink-300 bg-clip-text text-transparent">
                MYTHOS
              </span>
              <span className="hidden sm:inline-block ml-1.5 text-xs uppercase tracking-widest text-slate-500 font-mono">
                Chronicles
              </span>
            </div>
          </Link>
        </div>

        {/* Center: RPG Stats HUD (Desktop) */}
        <div className="hidden md:flex items-center gap-6">
          {/* Level & XP Bar */}
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800/80 px-3.5 py-1.5 rounded-full shadow-inner">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-xs text-black shadow-sm font-mono">
                {user.level}
              </div>
              <span className="text-xs text-slate-400 font-medium">Lvl</span>
            </div>
            
            <div className="w-28 flex flex-col gap-1">
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono text-center leading-none">
                {user.xp} / {user.xpToNextLevel} XP
              </span>
            </div>
          </div>

          {/* Coins Display */}
          <div className="flex items-center gap-2 bg-amber-950/20 border border-amber-600/30 px-3.5 py-1.5 rounded-full shadow-sm">
            <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-mono text-sm font-bold text-amber-300">
              {user.coins}
            </span>
            <span className="text-[11px] text-amber-500 uppercase tracking-wider">Gold</span>
          </div>
        </div>

        {/* Right: Quick Action Buttons, Sound, Profile */}
        <div className="flex items-center gap-3">
          <Link
            to="/create"
            onClick={playClick}
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-md shadow-purple-900/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Generate Story</span>
          </Link>

          {/* Mute / Unmute Button */}
          <button
            onClick={() => { toggleMute(); playClick(); }}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            title={muted ? 'Unmute SFX' : 'Mute SFX'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Player Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => { playClick(); setDropdownOpen(!dropdownOpen); }}
              className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-purple-900/40 p-1.5 sm:px-2.5 rounded-xl transition"
            >
              <img
                src={user.avatar}
                alt={user.username}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-purple-500"
              />
              <span className="hidden sm:inline-block text-xs font-medium text-slate-200 max-w-[90px] truncate">
                {user.username}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#11131f] border border-purple-800/40 shadow-2xl py-2 z-50 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="px-4 py-2.5 border-b border-slate-800/80">
                  <p className="font-semibold text-slate-200 truncate">{user.username}</p>
                  <p className="text-[11px] text-purple-400 font-mono">{user.title}</p>
                  {user.isGuest && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Guest Account
                    </span>
                  )}
                </div>

                <div className="py-1">
                  <Link
                    to="/dashboard"
                    onClick={playClick}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-purple-900/20 hover:text-purple-300 transition"
                  >
                    <Compass className="w-4 h-4 text-purple-400" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={playClick}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-purple-900/20 hover:text-purple-300 transition"
                  >
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>Player Profile & Stats</span>
                  </Link>

                  <Link
                    to="/history"
                    onClick={playClick}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-purple-900/20 hover:text-purple-300 transition"
                  >
                    <Scroll className="w-4 h-4 text-cyan-400" />
                    <span>Saved Adventures</span>
                  </Link>

                  {user.isGuest ? (
                    <Link
                      to="/login"
                      onClick={playClick}
                      className="flex items-center gap-2.5 px-4 py-2 text-amber-300 hover:bg-amber-950/20 transition font-medium"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Claim & Register Account</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => { playClick(); logout(); navigate('/'); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-400 hover:bg-rose-950/20 transition text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}

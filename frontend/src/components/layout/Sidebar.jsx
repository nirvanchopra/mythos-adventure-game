import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  Wand2, 
  BookOpen, 
  History, 
  User, 
  Award, 
  CheckSquare, 
  ShoppingBag, 
  Trophy, 
  Users, 
  KeyRound, 
  X,
  Sparkles
} from 'lucide-react';
import { useSound } from '../../context/SoundContext';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { playClick } = useSound();
  const { user } = useAuth();

  const navGroups = [
    {
      title: 'ADVENTURE REALM',
      items: [
        { to: '/', label: 'Hero Portal', icon: Home, exact: true },
        { to: '/dashboard', label: 'Player Dashboard', icon: Compass },
        { to: '/create', label: 'AI Story Forge', icon: Wand2, highlight: true },
        { to: '/explore', label: 'Story Discovery', icon: BookOpen },
        { to: '/history', label: 'Adventure Archive', icon: History }
      ]
    },
    {
      title: 'PROGRESSION & LOOT',
      items: [
        { to: '/profile', label: 'Hero Profile & Stats', icon: User },
        { to: '/achievements', label: 'Trophies & Badges', icon: Award },
        { to: '/quests', label: 'Daily Quests', icon: CheckSquare },
        { to: '/store', label: 'Artifact Vault', icon: ShoppingBag },
        { to: '/leaderboard', label: 'Hall of Fame', icon: Trophy }
      ]
    },
    {
      title: 'MULTIPLAYER GUILD',
      items: [
        { to: '/multiplayer', label: 'Party Lobby', icon: Users, badge: 'Live' }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0c14] border-r border-purple-900/25 flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-10
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Top Header inside sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-purple-900/20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <span className="font-['Orbitron',sans-serif] font-bold text-sm tracking-wider text-slate-200">
              REALM NAV
            </span>
          </div>

          <button
            onClick={() => { playClick(); onClose(); }}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx}>
              <h3 className="px-3 text-[10px] font-mono tracking-widest text-slate-400 font-semibold mb-2 uppercase">
                {group.title}
              </h3>

              <div className="space-y-1">
                {group.items.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={idx}
                      to={item.to}
                      end={item.exact}
                      onClick={() => {
                        playClick();
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={({ isActive }) => `
                        flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 group
                        ${isActive 
                          ? 'bg-gradient-to-r from-purple-900/40 to-indigo-900/30 text-purple-200 border border-purple-500/30 shadow-sm shadow-purple-900/20' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                        }
                        ${item.highlight ? 'text-purple-300 font-semibold' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 transition-transform group-hover:scale-110 text-purple-400" />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Account status card in sidebar */}
          {user.isGuest && (
            <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-b from-purple-950/30 to-indigo-950/20 border border-purple-700/30 text-center">
              <p className="text-xs font-bold text-slate-200">Claim Adventurer Account</p>
              <p className="text-[11px] text-slate-400 mt-1">Save progression, unlock multiplayer rewards & leaderboard rank.</p>
              <NavLink
                to="/login"
                onClick={() => { playClick(); if (window.innerWidth < 1024) onClose(); }}
                className="mt-2.5 inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-purple-900/20 text-center">
          <p className="text-[10px] text-slate-400 font-mono">
            Mythos Engine v2.0 • Online
          </p>
        </div>
      </aside>
    </>
  );
}

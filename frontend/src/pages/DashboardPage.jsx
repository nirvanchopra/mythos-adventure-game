import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Wand2, 
  Compass, 
  Users, 
  Trophy, 
  Coins, 
  CheckCircle2, 
  Flame, 
  ChevronRight, 
  Play, 
  ShieldCheck, 
  Award,
  Scroll
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import confetti from 'canvas-confetti';

export default function DashboardPage() {
  const { user, addXp, addCoins } = useAuth();
  const { playClick, playVictory } = useSound();

  const xpPercent = Math.min(100, Math.round((user.xp / (user.xpToNextLevel || 100)) * 100));

  const handleClaimQuest = (quest) => {
    playVictory();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    addXp(quest.rewardXp);
    addCoins(quest.rewardCoins);
    quest.claimed = true;
  };

  return (
    <div className="space-y-8 py-4">
      
      {/* Hero Character Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#121422] via-[#10121d] to-[#151328] border border-purple-800/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          
          {/* Avatar & Player Info */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.username}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-purple-500 shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-600 text-black font-black text-xs px-2 py-0.5 rounded-full font-mono shadow-md">
                LVL {user.level}
              </div>
            </div>

            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel',serif]">
                  {user.username}
                </h1>
                {user.isGuest && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                    Guest
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-400 font-mono tracking-wider">
                {user.title}
              </p>
              
              {/* Level XP Bar */}
              <div className="pt-2 w-56 sm:w-72">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono mb-1">
                  <span>EXP Progress</span>
                  <span>{user.xp} / {user.xpToNextLevel} XP ({xpPercent}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-4 bg-slate-900/80 border border-purple-900/30 px-5 py-3 rounded-2xl">
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase font-mono">Stories</p>
                <p className="text-lg font-bold text-white font-mono">{user.storiesCompleted}</p>
              </div>
              <div className="w-[1px] h-8 bg-slate-800" />
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase font-mono">Gold</p>
                <p className="text-lg font-bold text-amber-400 font-mono">{user.coins}</p>
              </div>
              <div className="w-[1px] h-8 bg-slate-800" />
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase font-mono">Party Wins</p>
                <p className="text-lg font-bold text-pink-400 font-mono">{user.multiplayerWins}</p>
              </div>
            </div>

            <Link
              to="/create"
              onClick={playClick}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider uppercase shadow-xl shadow-purple-900/40 transition"
            >
              <Wand2 className="w-4 h-4" />
              <span>Launch Forge</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Main Grid: Quests & Quick Launch */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Quests & Adventure History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Daily Quests Widget */}
          <div className="rounded-3xl bg-[#0f111c] border border-slate-800/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-base text-slate-100">Daily Quests & Bounties</h2>
              </div>
              <Link to="/quests" onClick={playClick} className="text-xs text-purple-400 hover:text-purple-300 font-medium">
                View All Quests →
              </Link>
            </div>

            <div className="space-y-3">
              {(user.quests || []).map((q) => (
                <div 
                  key={q.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-600/30 transition"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-200">{q.title}</p>
                    <p className="text-[11px] text-slate-400">{q.description}</p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-amber-400">
                      <span>+{q.rewardXp} XP</span>
                      <span>+{q.rewardCoins} Gold</span>
                    </div>
                  </div>

                  <div>
                    {q.completed && !q.claimed ? (
                      <button
                        onClick={() => handleClaimQuest(q)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs shadow-md shadow-amber-600/30 hover:scale-105 transition"
                      >
                        Claim Loot
                      </button>
                    ) : q.claimed ? (
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-slate-400">
                        {q.progress}/{q.total}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Launch Story Realms */}
          <div className="rounded-3xl bg-[#0f111c] border border-slate-800/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-cyan-400" />
                <h2 className="font-bold text-base text-slate-100">Featured Adventure Realms</h2>
              </div>
              <Link to="/explore" onClick={playClick} className="text-xs text-purple-400 hover:text-purple-300 font-medium">
                Explore All 8 Genres →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { title: 'The Citadel of Void', genre: 'Sci-Fi', desc: 'Escape a derelict starship before the core collapses.', difficulty: 'Hard' },
                { title: 'The Shadow of Dunwich', genre: 'Horror', desc: 'Investigate cryptic disappearances in a mist-shrouded seaport.', difficulty: 'Medium' }
              ].map((adv, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-purple-400 uppercase">{adv.genre}</span>
                      <span className="text-amber-400">{adv.difficulty}</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-100">{adv.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{adv.desc}</p>
                  </div>

                  <Link
                    to="/create"
                    onClick={playClick}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-700/30 text-purple-200 text-xs font-semibold transition"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Embark Now</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Col: Multiplayer Fast Join & Trophies */}
        <div className="space-y-6">
          
          {/* Multiplayer Party Callout */}
          <div className="rounded-3xl bg-gradient-to-b from-purple-950/40 to-[#0e101b] border border-purple-600/30 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-400" />
              <h3 className="font-bold text-base text-slate-100">Live Party Lobby</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Adventure with friends! Vote on narrative choices together in real-time or face off in timed competitive trials.
            </p>
            <Link
              to="/multiplayer"
              onClick={playClick}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-pink-900/30 transition"
            >
              <span>Enter Party Lobby</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Recent Badges */}
          <div className="rounded-3xl bg-[#0f111c] border border-slate-800/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-slate-100">Trophies Unlocked</h3>
              </div>
              <Link to="/achievements" onClick={playClick} className="text-xs text-purple-400 hover:text-purple-300">
                Gallery →
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(user.achievements || []).slice(0, 3).map((ach) => (
                <div 
                  key={ach.id}
                  className={`p-3 rounded-2xl border text-center space-y-1 ${
                    ach.unlocked 
                      ? 'bg-purple-950/30 border-purple-600/40 text-purple-200' 
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 opacity-60'
                  }`}
                >
                  <Award className="w-6 h-6 mx-auto text-amber-400" />
                  <p className="text-[10px] font-bold truncate">{ach.title}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

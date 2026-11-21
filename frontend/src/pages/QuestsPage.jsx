import React, { useState } from 'react';
import { 
  CheckSquare, 
  Flame, 
  Sparkles, 
  Coins, 
  CheckCircle2, 
  Clock, 
  Gift, 
  Trophy 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';

export default function QuestsPage() {
  const { user, addXp, addCoins } = useAuth();
  const { playClick, playVictory } = useSound();

  const [streakDays, setStreakDays] = useState([
    { day: 1, gold: 20, claimed: true },
    { day: 2, gold: 30, claimed: true },
    { day: 3, gold: 45, claimed: true },
    { day: 4, gold: 60, current: true, claimed: false },
    { day: 5, gold: 80, claimed: false },
    { day: 6, gold: 100, claimed: false },
    { day: 7, gold: 250, bonus: 'Rare Relic', claimed: false },
  ]);

  const handleClaimQuest = (quest) => {
    playVictory();
    confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
    addXp(quest.rewardXp);
    addCoins(quest.rewardCoins);
    quest.claimed = true;
  };

  const handleClaimStreak = (dayIdx) => {
    playVictory();
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.5 } });
    addCoins(streakDays[dayIdx].gold);
    setStreakDays(prev => prev.map((d, i) => i === dayIdx ? { ...d, claimed: true, current: false } : d));
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950/40 via-[#10121d] to-pink-950/40 border border-purple-800/40 p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Daily Guild Trials</span>
          </div>
          <h1 className="font-['Cinzel',serif] text-3xl font-black text-white">
            CHALLENGES & BOUNTIES
          </h1>
          <p className="text-xs text-slate-400">
            Complete daily storytelling deeds to nurture your login streak and accumulate precious gold.
          </p>
        </div>

        {/* Next Reset Timer */}
        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-5 py-3 rounded-2xl">
          <Clock className="w-5 h-5 text-purple-400" />
          <div>
            <p className="text-[10px] font-mono text-slate-400 uppercase">Resets In</p>
            <p className="text-sm font-bold font-mono text-purple-300">08h : 34m : 12s</p>
          </div>
        </div>
      </div>

      {/* 7-Day Login Streak Box */}
      <div className="rounded-3xl bg-[#0f111c] border border-slate-800/80 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-sm text-slate-100 uppercase font-mono tracking-wider">
              7-Day Adventurer Login Streak (Day 4)
            </h2>
          </div>
          <span className="text-xs font-mono text-amber-400">+250 Gold on Day 7</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {streakDays.map((s, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl text-center space-y-1.5 border transition ${
                s.claimed 
                  ? 'bg-purple-950/20 border-purple-800/40 text-purple-300' 
                  : s.current 
                    ? 'bg-amber-950/30 border-amber-500 shadow-lg shadow-amber-950/30 text-white scale-105' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
              }`}
            >
              <p className="text-[10px] font-mono uppercase">Day {s.day}</p>
              <Coins className={`w-5 h-5 mx-auto ${s.claimed ? 'text-purple-400' : s.current ? 'text-amber-400 animate-bounce' : 'text-slate-600'}`} />
              <p className="text-xs font-bold font-mono">+{s.gold}</p>
              
              {s.current && !s.claimed ? (
                <button
                  onClick={() => handleClaimStreak(idx)}
                  className="w-full py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] transition"
                >
                  Claim
                </button>
              ) : s.claimed ? (
                <span className="text-[9px] font-mono text-emerald-400 font-bold block">✓ Claimed</span>
              ) : (
                <span className="text-[9px] font-mono text-slate-600 block">Locked</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Daily Quests List */}
      <div className="space-y-4">
        <h2 className="font-bold text-sm text-slate-200 uppercase font-mono tracking-wider flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-purple-400" />
          <span>Active Daily Missions</span>
        </h2>

        <div className="space-y-3">
          {(user.quests || []).map((q) => (
            <div
              key={q.id}
              className="p-5 rounded-3xl bg-[#0f111c] border border-slate-800/80 hover:border-purple-600/30 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-100">{q.title}</h3>
                  <span className="text-[10px] font-mono text-purple-400">+{q.rewardXp} XP • +{q.rewardCoins} Gold</span>
                </div>
                <p className="text-xs text-slate-400">{q.description}</p>
                
                {/* Progress bar */}
                <div className="pt-2 w-full max-w-xs">
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-amber-400 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((q.progress / q.total) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              <div>
                {q.completed && !q.claimed ? (
                  <button
                    onClick={() => handleClaimQuest(q)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs shadow-md shadow-amber-600/30 hover:scale-105 transition"
                  >
                    Claim Bounty Loot
                  </button>
                ) : q.claimed ? (
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Bounty Claimed
                  </span>
                ) : (
                  <span className="text-xs font-mono text-slate-400 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    In Progress ({q.progress}/{q.total})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

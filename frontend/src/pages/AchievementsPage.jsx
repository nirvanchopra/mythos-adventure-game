import React, { useState } from 'react';
import { 
  Award, 
  Sparkles, 
  Trophy, 
  CheckCircle2, 
  Lock, 
  Coins, 
  Filter 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { API_BASE_URL } from '../util.js';

export default function AchievementsPage() {
  const { user, unlockAchievement, addXp, addCoins } = useAuth();
  const { playClick, playVictory } = useSound();
  const [filter, setFilter] = useState('All');

  const unlockedCount = (user.achievements || []).filter(a => a.unlocked).length;
  const totalCount = (user.achievements || []).length;
  const percentComplete = Math.round((unlockedCount / totalCount) * 100);

  const handleClaim = async (ach) => {
    playVictory();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    try {
      await axios.post(`${API_BASE_URL}/rewards/achievements/unlock`, {
        achievement_code: ach.id || ach.code
      }, { withCredentials: true }).catch(() => null);
    } catch {
      // Ignore
    }
    unlockAchievement(ach.id || ach.code);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950/40 via-[#0f111c] to-indigo-950/40 border border-purple-800/40 p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" />
            <span>Hall of Laurels</span>
          </div>
          <h1 className="font-['Cinzel',serif] text-3xl font-black text-white">
            ACHIEVEMENTS & TROPHIES
          </h1>
          <p className="text-xs text-slate-400">
            Accomplish formidable storytelling feats to reap virtual gold and XP boosts.
          </p>
        </div>

        {/* Progress Circle Box */}
        <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 px-5 py-3.5 rounded-2xl">
          <div className="text-right">
            <p className="text-xl font-bold font-mono text-purple-300">{unlockedCount} / {totalCount}</p>
            <p className="text-[10px] font-mono text-slate-400 uppercase">Unlocked</p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-purple-900 border-t-purple-400 flex items-center justify-center font-mono font-bold text-xs text-white">
            {percentComplete}%
          </div>
        </div>
      </div>

      {/* Achievements Cards Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {(user.achievements || []).map((ach) => (
          <div
            key={ach.id}
            className={`p-5 rounded-3xl border transition-all duration-300 flex items-start gap-4 ${
              ach.unlocked 
                ? 'bg-gradient-to-r from-purple-950/30 to-[#0e101c] border-purple-600/40 shadow-lg shadow-purple-950/20' 
                : 'bg-[#0f111c] border-slate-800/80 opacity-60'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              ach.unlocked 
                ? 'bg-amber-400/20 border border-amber-400/30 text-amber-400' 
                : 'bg-slate-900 border border-slate-800 text-slate-600'
            }`}>
              {ach.unlocked ? <Award className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-100">{ach.title}</h3>
                {ach.unlocked && (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {ach.description}
              </p>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-purple-300 font-bold">+{ach.xp} XP</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400 font-bold">+{ach.coins} Gold</span>
                </div>

                {!ach.unlocked && (
                  <button
                    onClick={() => handleClaim(ach)}
                    className="px-2.5 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-800 border border-purple-600/40 text-purple-200 text-[10px] font-semibold transition"
                  >
                    Test Unlock
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

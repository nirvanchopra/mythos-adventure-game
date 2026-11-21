import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  History, 
  Trophy, 
  Skull, 
  RotateCcw, 
  Compass, 
  Share2, 
  Sparkles, 
  Check, 
  Wand2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';

export default function HistoryPage() {
  const { user } = useAuth();
  const { playClick, playSelect } = useSound();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const fallbackHistory = [
    {
      id: 1,
      title: 'The Whispering Vault of Eldoria',
      genre: 'Fantasy',
      outcome: 'win',
      completedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      nodesVisited: 3,
      endingTitle: 'Archmage of the Starfall Spire'
    },
    {
      id: 2,
      title: 'Derelict Station Omega Zero',
      genre: 'Sci-Fi',
      outcome: 'loss',
      completedAt: new Date(Date.now() - 86400000).toISOString(),
      nodesVisited: 2,
      endingTitle: 'Core Vent Explosion'
    }
  ];

  const storyHistory = (user.history && user.history.length > 0) ? user.history : fallbackHistory;

  const filteredHistory = storyHistory.filter(item => {
    if (filter === 'all') return true;
    return item.outcome === filter;
  });

  const handleShare = (storyId) => {
    playClick();
    navigator.clipboard.writeText(`${window.location.origin}/story/${storyId}`);
    setCopiedId(storyId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="font-['Cinzel',serif] text-3xl font-bold text-white flex items-center gap-3">
            <History className="w-7 h-7 text-purple-400" />
            <span>Adventure Archive & History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review past narrative checkpoints, replay branching sagas, and share chronicles.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
          {['all', 'win', 'loss'].map((f) => (
            <button
              key={f}
              onClick={() => { playClick(); setFilter(f); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                filter === f ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {f === 'all' ? 'All Sagas' : f === 'win' ? 'Victories' : 'Defeats'}
            </button>
          ))}
        </div>
      </div>

      {/* History Items Grid */}
      <div className="space-y-4">
        {filteredHistory.map((adv) => (
          <div
            key={adv.id}
            className="p-5 sm:p-6 rounded-3xl bg-[#0f111c] border border-slate-800/80 hover:border-purple-600/40 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg group"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                adv.outcome === 'win' 
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' 
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {adv.outcome === 'win' ? <Trophy className="w-6 h-6" /> : <Skull className="w-6 h-6" />}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-purple-300 font-bold uppercase">{adv.genre || 'Fantasy'}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">{new Date(adv.completedAt).toLocaleDateString()}</span>
                  <span className="text-slate-600">•</span>
                  <span className={adv.outcome === 'win' ? 'text-emerald-400' : 'text-rose-400'}>
                    {adv.outcome === 'win' ? 'Triumphant' : 'Fate Consumed'}
                  </span>
                </div>

                <h3 className="font-['Cinzel',serif] text-base font-bold text-white group-hover:text-purple-300 transition">
                  {adv.title}
                </h3>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleShare(adv.id)}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
                title="Share Adventure Link"
              >
                {copiedId === adv.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => { playSelect(); navigate(`/story/${adv.id}`); }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay Saga</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Forge More Callout */}
      <div className="text-center py-6">
        <Link
          to="/create"
          onClick={playClick}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-900/30 transition"
        >
          <Wand2 className="w-4 h-4" />
          <span>Forge Another Adventure</span>
        </Link>
      </div>

    </div>
  );
}

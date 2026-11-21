import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Trophy, 
  Crown, 
  Flame, 
  Sparkles, 
  Users, 
  Globe, 
  ChevronRight, 
  Award,
  RefreshCw,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { API_BASE_URL } from '../util.js';

const FALLBACK_USERS = [
  { rank: 1, username: 'EldoriaArchon', title: 'Legendary Storyteller', level: 24, xp: 12450, stories_completed: 42, multiplayer_wins: 38, avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80' },
  { rank: 2, username: 'CyberScribe99', title: 'Master Explorer', level: 19, xp: 9800, stories_completed: 35, multiplayer_wins: 29, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  { rank: 3, username: 'ValkyrieSol', title: 'Master Explorer', level: 17, xp: 8400, stories_completed: 29, multiplayer_wins: 24, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80' },
  { rank: 4, username: 'DungeonWeaver', title: 'Story Seeker', level: 14, xp: 6200, stories_completed: 21, multiplayer_wins: 18, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
  { rank: 5, username: 'VoidVoyager', title: 'Story Seeker', level: 12, xp: 5100, stories_completed: 18, multiplayer_wins: 15, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80' },
  { rank: 6, username: 'AetherMage', title: 'Adventurer', level: 8, xp: 3200, stories_completed: 12, multiplayer_wins: 9, avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80' }
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState('global');
  const [sortBy, setSortBy] = useState('xp');
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState(FALLBACK_USERS);
  const { playClick } = useSound();
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, [tab, sortBy]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const endpoint = tab === 'global' 
        ? `${API_BASE_URL}/leaderboard/global?sort_by=${sortBy}&limit=50`
        : `${API_BASE_URL}/leaderboard/friends`;

      const res = await axios.get(endpoint);
      if (res.data && res.data.length > 0) {
        setPlayers(res.data);
      } else if (tab === 'friends') {
        setPlayers([
          {
            rank: 1,
            user_id: user.id,
            username: user.username,
            avatar: user.avatar,
            title: user.title,
            level: user.level,
            xp: user.xp,
            stories_completed: user.storiesCompleted || 0,
            multiplayer_wins: user.multiplayerWins || 0,
            favorite_genre: user.favoriteGenre || 'Fantasy'
          }
        ]);
      } else {
        setPlayers(FALLBACK_USERS);
      }
    } catch {
      // In guest/offline or disconnected mode, preserve rich fallback
      setPlayers(FALLBACK_USERS);
    } finally {
      setLoading(false);
    }
  };

  const topThree = [
    players[1] || FALLBACK_USERS[1],
    players[0] || FALLBACK_USERS[0],
    players[2] || FALLBACK_USERS[2],
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      
      {/* Page Title & Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="font-['Cinzel',serif] text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-7 h-7 text-amber-400" />
            <span>Global Hall of Fame</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Revered storytellers and champions across all realms. Live on Neon Cloud.
          </p>
        </div>

        {/* Tab Switch */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => { playClick(); setTab('global'); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === 'global' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Global</span>
            </button>
            <button
              onClick={() => { playClick(); setTab('friends'); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === 'friends' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Guild & Friends</span>
            </button>
          </div>

          <button
            onClick={() => { playClick(); fetchLeaderboard(); }}
            title="Refresh Leaderboard"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sorting Pills for Global Mode */}
      {tab === 'global' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-mono text-[11px] uppercase mr-1">Sort Realm:</span>
          {[
            { id: 'xp', label: 'Highest XP' },
            { id: 'level', label: 'Max Level' },
            { id: 'stories', label: 'Stories Finished' },
            { id: 'wins', label: 'Multiplayer Wins' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => { playClick(); setSortBy(s.id); }}
              className={`px-3 py-1 rounded-full font-mono text-[11px] transition ${
                sortBy === s.id
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Podium for Top 3 Champions */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-4 items-end">
        
        {/* Silver - Rank 2 */}
        <div className="rounded-3xl bg-[#0f111c] border border-slate-700/60 p-4 sm:p-6 text-center space-y-3 relative overflow-hidden order-1 sm:order-1">
          <div className="w-8 h-8 mx-auto rounded-full bg-slate-400/20 text-slate-300 font-mono font-bold flex items-center justify-center text-xs">
            #2
          </div>
          <img 
            src={topThree[0]?.avatar || FALLBACK_USERS[1].avatar} 
            alt="" 
            className="w-14 h-14 mx-auto rounded-2xl object-cover ring-2 ring-slate-400 shadow-md" 
          />
          <div>
            <p className="font-bold text-xs sm:text-sm text-slate-100 truncate">{topThree[0]?.username}</p>
            <p className="text-[10px] text-purple-400 font-mono truncate">{topThree[0]?.title || 'Adventurer'}</p>
          </div>
          <p className="text-xs font-mono font-bold text-slate-300">{topThree[0]?.xp || 0} XP</p>
        </div>

        {/* Gold - Rank 1 (Crown) */}
        <div className="rounded-3xl bg-gradient-to-b from-amber-950/40 via-[#111320] to-[#0f111c] border border-amber-500/50 p-5 sm:p-8 text-center space-y-3 relative overflow-hidden order-2 sm:order-2 shadow-2xl shadow-amber-950/30 scale-105">
          <div className="w-10 h-10 mx-auto rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center">
            <Crown className="w-5 h-5" />
          </div>
          <img 
            src={topThree[1]?.avatar || FALLBACK_USERS[0].avatar} 
            alt="" 
            className="w-16 h-16 mx-auto rounded-2xl object-cover ring-2 ring-amber-400 shadow-xl" 
          />
          <div>
            <p className="font-bold text-sm sm:text-base text-amber-300 truncate">{topThree[1]?.username}</p>
            <p className="text-[11px] text-amber-400 font-mono truncate">{topThree[1]?.title || 'Legendary Champion'}</p>
          </div>
          <p className="text-sm font-mono font-black text-amber-300">{topThree[1]?.xp || 0} XP</p>
        </div>

        {/* Bronze - Rank 3 */}
        <div className="rounded-3xl bg-[#0f111c] border border-amber-800/40 p-4 sm:p-6 text-center space-y-3 relative overflow-hidden order-3 sm:order-3">
          <div className="w-8 h-8 mx-auto rounded-full bg-amber-700/20 text-amber-500 font-mono font-bold flex items-center justify-center text-xs">
            #3
          </div>
          <img 
            src={topThree[2]?.avatar || FALLBACK_USERS[2].avatar} 
            alt="" 
            className="w-14 h-14 mx-auto rounded-2xl object-cover ring-2 ring-amber-600 shadow-md" 
          />
          <div>
            <p className="font-bold text-xs sm:text-sm text-slate-100 truncate">{topThree[2]?.username}</p>
            <p className="text-[10px] text-purple-400 font-mono truncate">{topThree[2]?.title || 'Adventurer'}</p>
          </div>
          <p className="text-xs font-mono font-bold text-amber-500">{topThree[2]?.xp || 0} XP</p>
        </div>

      </div>

      {/* Leaderboard Rankings Table */}
      <div className="rounded-3xl bg-[#0f111c] border border-slate-800/80 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Rank & Storyteller</span>
          <div className="flex items-center gap-8">
            <span className="hidden sm:inline">Stories</span>
            <span className="hidden sm:inline">Wins</span>
            <span>Level</span>
            <span className="w-20 text-right">Total XP</span>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {players.map((player, idx) => {
            const rank = player.rank || idx + 1;
            const isMe = user.username && player.username === user.username;

            return (
              <div
                key={player.user_id || player.username || idx}
                className={`p-4 flex items-center justify-between transition ${
                  isMe 
                    ? 'bg-purple-950/40 border-l-4 border-purple-500' 
                    : 'hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 font-mono font-bold text-xs ${
                    rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-amber-600' : 'text-slate-500'
                  }`}>
                    #{rank}
                  </span>

                  <img 
                    src={player.avatar || FALLBACK_USERS[0].avatar} 
                    alt="" 
                    className="w-8 h-8 rounded-xl object-cover" 
                  />

                  <div>
                    <p className="font-semibold text-xs text-slate-200 flex items-center gap-2">
                      <span>{player.username}</span>
                      {isMe && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-300 font-mono">You</span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">{player.title || 'Story Adventurer'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8 text-xs font-mono">
                  <span className="hidden sm:inline text-slate-400">{player.stories_completed || 0}</span>
                  <span className="hidden sm:inline text-slate-400">{player.multiplayer_wins || 0}</span>
                  <span className="text-amber-400 font-bold">LVL {player.level || 1}</span>
                  <span className="w-20 text-right font-bold text-purple-300">{player.xp || 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

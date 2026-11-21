import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, 
  Trophy, 
  Award, 
  Coins, 
  Flame, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  History,
  BookOpen,
  Users,
  UserPlus,
  UserCheck,
  Search,
  Activity,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { API_BASE_URL } from '../util.js';

export default function ProfilePage() {
  const { user, DEFAULT_AVATARS } = useAuth();
  const { playClick, playVictory } = useSound();
  const [activeTab, setActiveTab] = useState('overview');

  // Social / Guild state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendsData, setFriendsData] = useState({ friends: [], incoming_requests: [] });
  const [activityFeed, setActivityFeed] = useState([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'social') {
      loadSocialData();
    }
  }, [activeTab]);

  const loadSocialData = async () => {
    setSocialLoading(true);
    try {
      const [friendsRes, feedRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/social/friends`),
        axios.get(`${API_BASE_URL}/social/feed?limit=10`)
      ]);

      if (friendsRes.status === 'fulfilled' && friendsRes.value.data) {
        setFriendsData(friendsRes.value.data);
      }
      if (feedRes.status === 'fulfilled' && feedRes.value.data) {
        setActivityFeed(feedRes.value.data);
      }
    } catch {
      // Guest or offline
    } finally {
      setSocialLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/social/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data || []);
    } catch {
      setSearchResults([]);
    }
  };

  const sendFriendRequest = async (targetId) => {
    playClick();
    try {
      const res = await axios.post(`${API_BASE_URL}/social/friends/request`, { friend_id: targetId });
      setActionMessage(res.data.message || 'Friend request sent!');
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage(err.response?.data?.detail || 'Failed to send request');
      setTimeout(() => setActionMessage(''), 4000);
    }
  };

  const respondFriendRequest = async (friendshipId, action) => {
    playClick();
    try {
      await axios.post(`${API_BASE_URL}/social/friends/respond`, {
        friendship_id: friendshipId,
        action: action
      });
      if (action === 'accept') playVictory();
      loadSocialData();
    } catch (err) {
      setActionMessage('Failed to update request');
      setTimeout(() => setActionMessage(''), 4000);
    }
  };

  const winRate = user.storiesCompleted > 0 
    ? Math.round(((user.storiesCompleted - 1) / user.storiesCompleted) * 100) 
    : 100;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      
      {/* Profile Header Hero Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#121422] via-[#0f111c] to-[#161226] border border-purple-800/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-24 h-24 rounded-3xl object-cover ring-2 ring-purple-500 shadow-2xl"
            />
            <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-mono font-bold text-xs shadow-md">
              LVL {user.level}
            </div>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <h1 className="font-['Cinzel',serif] text-2xl sm:text-3xl font-black text-white">
                {user.username}
              </h1>
              {user.isGuest ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Guest Explorer
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Verified Hero
                </span>
              )}
            </div>

            <p className="text-xs text-purple-400 font-mono tracking-wider font-semibold">
              {user.title}
            </p>
            <p className="text-xs text-slate-400 font-mono">
              Member since {new Date().getFullYear()} • Fav Genre: {user.favoriteGenre || 'Fantasy'}
            </p>
          </div>

          {/* Quick Level & Currency Box */}
          <div className="sm:ml-auto flex items-center gap-3 bg-slate-900/80 border border-purple-900/30 px-5 py-3 rounded-2xl">
            <div className="text-center">
              <p className="text-[10px] font-mono text-slate-400 uppercase">Total XP</p>
              <p className="text-base font-bold font-mono text-purple-300">{user.xp}</p>
            </div>
            <div className="w-[1px] h-7 bg-slate-800" />
            <div className="text-center">
              <p className="text-[10px] font-mono text-slate-400 uppercase">Gold</p>
              <p className="text-base font-bold font-mono text-amber-400">{user.coins}</p>
            </div>
          </div>

        </div>
      </div>

      {/* Career Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Completed Stories', value: user.storiesCompleted || 0, icon: BookOpen, color: 'text-purple-400' },
          { label: 'Multiplayer Wins', value: user.multiplayerWins || 0, icon: Trophy, color: 'text-pink-400' },
          { label: 'Trophies Unlocked', value: (user.achievements || []).filter(a => a.unlocked).length, icon: Award, color: 'text-amber-400' },
          { label: 'Survival Rate', value: `${winRate}%`, icon: ShieldCheck, color: 'text-emerald-400' }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="p-4 rounded-2xl bg-[#0f111c] border border-slate-800 space-y-1 text-center">
              <Icon className={`w-5 h-5 mx-auto ${stat.color} mb-1`} />
              <p className="text-xl font-bold font-mono text-white">{stat.value}</p>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs: Overview, Badges, Guild & Companions */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => { playClick(); setActiveTab('overview'); }}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === 'overview' 
              ? 'text-purple-400 border-b-2 border-purple-500' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Adventure Chronicle
        </button>
        <button
          onClick={() => { playClick(); setActiveTab('badges'); }}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === 'badges' 
              ? 'text-purple-400 border-b-2 border-purple-500' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Hall of Badges
        </button>
        <button
          onClick={() => { playClick(); setActiveTab('social'); }}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 ${
            activeTab === 'social' 
              ? 'text-purple-400 border-b-2 border-purple-500' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Companions & Social</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-purple-900/40 border border-purple-700/50 text-xs font-mono text-purple-200 text-center animate-fadeIn">
          {actionMessage}
        </div>
      )}

      {/* TAB CONTENT: Adventure Chronicle */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-200">Recent Sagas & Quests</h3>
          {(user.history && user.history.length > 0) ? (
            <div className="space-y-2">
              {user.history.map((h, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">{h.title}</p>
                    <p className="text-[11px] text-slate-400 font-mono">Genre: {h.genre} • {new Date(h.completedAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                    h.outcome === 'win' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {h.outcome === 'win' ? 'Victory' : 'Consumed'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#0f111c] border border-slate-800 text-center text-xs text-slate-400">
              No previous story archives found. Generate an adventure to carve your chronicle!
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Hall of Badges */}
      {activeTab === 'badges' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(user.achievements || []).map((ach) => (
            <div 
              key={ach.id}
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                ach.unlocked 
                  ? 'bg-purple-950/20 border-purple-700/40 text-purple-200' 
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 opacity-60'
              }`}
            >
              <Award className={`w-7 h-7 flex-shrink-0 ${ach.unlocked ? 'text-amber-400' : 'text-slate-600'}`} />
              <div className="space-y-1">
                <p className="font-bold text-xs text-white">{ach.title}</p>
                <p className="text-[11px] text-slate-400">{ach.description}</p>
                <p className="text-[10px] font-mono text-amber-400">+{ach.xp} XP • +{ach.coins} Gold</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: Companions & Social */}
      {activeTab === 'social' && (
        <div className="space-y-8">
          
          {/* Player Search Bar */}
          <div className="p-6 rounded-3xl bg-[#0f111c] border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-purple-400" />
              <span>Discover Adventurers across Realms</span>
            </h3>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by adventurer username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition"
              >
                Search
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                {searchResults.map((player) => (
                  <div key={player.user_id} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={player.avatar || DEFAULT_AVATARS[0]} alt="" className="w-9 h-9 rounded-xl object-cover" />
                      <div>
                        <p className="text-xs font-bold text-white">{player.username}</p>
                        <p className="text-[10px] text-slate-400 font-mono">LVL {player.level} • {player.title}</p>
                      </div>
                    </div>
                    {player.user_id !== user.id && (
                      <button
                        onClick={() => sendFriendRequest(player.user_id)}
                        className="p-2 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/30 transition text-xs flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incoming Requests */}
          {friendsData.incoming_requests?.length > 0 && (
            <div className="p-6 rounded-3xl bg-[#0f111c] border border-amber-500/30 space-y-4">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>Pending Companionship Requests ({friendsData.incoming_requests.length})</span>
              </h3>

              <div className="grid sm:grid-cols-2 gap-3">
                {friendsData.incoming_requests.map((req) => (
                  <div key={req.friendship_id} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={req.avatar || DEFAULT_AVATARS[0]} alt="" className="w-9 h-9 rounded-xl object-cover" />
                      <div>
                        <p className="text-xs font-bold text-white">{req.username}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Level {req.level}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => respondFriendRequest(req.friendship_id, 'accept')}
                        className="p-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/40 transition"
                        title="Accept Request"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => respondFriendRequest(req.friendship_id, 'decline')}
                        className="p-1.5 rounded-lg bg-rose-600/30 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/40 transition"
                        title="Decline"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List & Live Activity Feed Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Friends / Companions */}
            <div className="p-6 rounded-3xl bg-[#0f111c] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Guild Companions ({friendsData.friends?.length || 0})</span>
              </h3>

              {friendsData.friends?.length > 0 ? (
                <div className="space-y-2.5">
                  {friendsData.friends.map((friend) => (
                    <div key={friend.user_id} className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={friend.avatar || DEFAULT_AVATARS[0]} alt="" className="w-9 h-9 rounded-xl object-cover" />
                        <div>
                          <p className="text-xs font-bold text-white">{friend.username}</p>
                          <p className="text-[10px] text-purple-400 font-mono">{friend.title}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-amber-400">LVL {friend.level}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-4 text-center">
                  You haven't forged any companion bonds yet. Search adventurers above to join forces!
                </p>
              )}
            </div>

            {/* Realm Activity Feed */}
            <div className="p-6 rounded-3xl bg-[#0f111c] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Realm Activity Chronicle</span>
              </h3>

              {activityFeed.length > 0 ? (
                <div className="space-y-2.5">
                  {activityFeed.map((item) => (
                    <div key={item.id} className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-200">
                          <strong className="text-purple-300 font-mono">{item.username}</strong> {item.description}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5 text-xs text-slate-400">
                  <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80">
                    <p className="text-slate-300"><span className="text-purple-300 font-mono">EldoriaArchon</span> conquered a Fantasy saga in Underworld.</p>
                    <p className="text-[10px] text-slate-500 font-mono">5m ago</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80">
                    <p className="text-slate-300"><span className="text-purple-300 font-mono">ValkyrieSol</span> claimed victory in a 4-player multiplayer challenge.</p>
                    <p className="text-[10px] text-slate-500 font-mono">18m ago</p>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

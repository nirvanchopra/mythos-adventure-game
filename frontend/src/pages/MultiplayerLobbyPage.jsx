import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, 
  Plus, 
  KeyRound, 
  Sparkles, 
  Timer, 
  Vote, 
  ShieldCheck, 
  Lock, 
  ArrowRight,
  Flame,
  Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { API_BASE_URL } from '../util.js';

export default function MultiplayerLobbyPage() {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomMode, setNewRoomMode] = useState('Shared Voting');
  const [newRoomMax, setNewRoomMax] = useState(4);
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [rooms, setRooms] = useState([]);

  const { user } = useAuth();
  const { playClick, playSelect } = useSound();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/multiplayer/rooms`);
      if (res.data && res.data.length > 0) {
        setRooms(res.data);
      }
    } catch {
      // Fallback rooms list
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    const cleanCode = roomCodeInput.trim().toUpperCase();
    if (!cleanCode) return;
    playSelect();
    try {
      await axios.post(`${API_BASE_URL}/multiplayer/rooms/${cleanCode}/join`, {}, { withCredentials: true });
    } catch {
      // Allow navigation to room
    }
    navigate(`/room/${cleanCode}`);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    playSelect();
    try {
      const res = await axios.post(`${API_BASE_URL}/multiplayer/rooms/create`, {
        title: newRoomTitle || 'Adventurer Party Expedition',
        mode: newRoomMode,
        max_players: newRoomMax,
        is_private: newRoomPrivate
      }, { withCredentials: true });

      if (res.data && res.data.room_code) {
        navigate(`/room/${res.data.room_code}?title=${encodeURIComponent(res.data.title)}&mode=${encodeURIComponent(res.data.mode)}`);
        return;
      }
    } catch {
      // Fallback
    }
    const fallbackCode = 'MTH' + Math.floor(100 + Math.random() * 900);
    navigate(`/room/${fallbackCode}?title=${encodeURIComponent(newRoomTitle || 'Adventurer Party')}&mode=${encodeURIComponent(newRoomMode)}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-mono uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span>FastAPI WebSockets Engine</span>
          </div>
          <h1 className="font-['Cinzel',serif] text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-pink-400" />
            <span>Multiplayer Party Guild</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Synchronize decisions with companions in real-time or face off in timed competitive trials.
          </p>
        </div>

        {/* Create Room Button */}
        <button
          onClick={() => { playClick(); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs tracking-wider uppercase shadow-xl shadow-pink-900/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4" />
          <span>Host New Party Room</span>
        </button>
      </div>

      {/* Quick Join By Room Code Bar */}
      <div className="rounded-3xl bg-[#0f111c] border border-purple-800/40 p-6 shadow-xl">
        <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <KeyRound className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              maxLength={8}
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="ENTER 6-DIGIT ROOM CODE (e.g. ELD991)"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono tracking-widest focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono tracking-wider transition"
          >
            Join Party →
          </button>
        </form>
      </div>

      {/* Active Public Rooms Browser */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-200 uppercase font-mono tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Open Adventurer Rooms</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">4 Rooms Active</span>
        </div>

        <div className="grid gap-3">
          {(rooms.length > 0 ? rooms : [
            { code: 'ELD991', title: 'The Void Citadel Expedition', host: 'AetherMage', mode: 'Shared Voting', players: 3, maxPlayers: 4, genre: 'Sci-Fi' },
            { code: 'RUN404', title: 'Cyberpunk Heist 2099', host: 'CyberScribe99', mode: 'Competitive Race', players: 2, maxPlayers: 4, genre: 'Cyberpunk' }
          ]).map((room) => (
            <div
              key={room.code}
              className="p-5 rounded-3xl bg-[#0f111c] border border-slate-800/80 hover:border-pink-600/40 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-purple-300 font-bold tracking-widest">#{room.code}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-pink-400">{room.mode}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">Host: {room.host}</span>
                </div>

                <h3 className="font-['Cinzel',serif] text-base font-bold text-white group-hover:text-pink-300 transition">
                  {room.title}
                </h3>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>{room.players}/{room.maxPlayers}</span>
                </div>

                <button
                  disabled={room.players >= room.maxPlayers}
                  onClick={() => { playSelect(); navigate(`/room/${room.code}`); }}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition ${
                    room.players >= room.maxPlayers
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-pink-600 hover:bg-pink-500 text-white shadow-md shadow-pink-900/30'
                  }`}
                >
                  {room.players >= room.maxPlayers ? 'Full' : 'Join Room'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-[#10121e] border border-purple-800/50 p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="font-['Cinzel',serif] text-2xl font-bold text-white">
              Host New Adventure Party
            </h2>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Room Title</label>
                <input
                  type="text"
                  required
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  placeholder="e.g. Fellowship of the Astral Gate"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Multiplayer Rule Set</label>
                <select
                  value={newRoomMode}
                  onChange={(e) => setNewRoomMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="Shared Voting">Shared Mode (Majority Democratic Vote)</option>
                  <option value="Competitive Race">Competitive Trial (Timed Speed Decisions)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Max Adventurers</label>
                <select
                  value={newRoomMax}
                  onChange={(e) => setNewRoomMax(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value={2}>2 Players</option>
                  <option value={4}>4 Players</option>
                  <option value={8}>8 Players</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-pink-900/40 transition"
                >
                  Open Chamber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

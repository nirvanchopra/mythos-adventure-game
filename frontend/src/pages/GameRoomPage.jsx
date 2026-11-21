import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, 
  Copy, 
  Check, 
  Sparkles, 
  Play, 
  Send, 
  Crown, 
  Radio, 
  MessageSquare,
  ShieldAlert,
  Vote,
  Flame,
  Trophy,
  Skull
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { API_BASE_URL, getWebSocketUrl } from '../util.js';

export default function GameRoomPage() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { playClick, playSelect, playVictory, playDefeat } = useSound();

  const [copied, setCopied] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'System', text: `Connected to chamber ${code}. Prepare for departure!`, isSystem: true }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [players, setPlayers] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [activeNode, setActiveNode] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [voteTally, setVoteTally] = useState({});
  const [myVote, setMyVote] = useState(null);

  const wsRef = useRef(null);

  const roomTitle = roomData?.title || searchParams.get('title') || `Chamber of ${code}`;
  const roomMode = roomData?.mode || searchParams.get('mode') || 'Shared Voting';
  const isHost = players.find(p => p.username === user.username)?.is_host ?? true;

  // 1. Fetch initial room state via REST
  useEffect(() => {
    loadRoomDetails();
  }, [code]);

  const loadRoomDetails = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/multiplayer/rooms/${code}`, { withCredentials: true });
      if (res.data) {
        setRoomData(res.data);
        if (res.data.players && res.data.players.length > 0) {
          setPlayers(res.data.players);
        } else {
          setPlayers([
            { user_id: user.id, username: user.username, avatar: user.avatar, level: user.level, is_ready: true, is_host: true }
          ]);
        }
        if (res.data.messages && res.data.messages.length > 0) {
          setMessages(prev => [...prev, ...res.data.messages]);
        }
      }
    } catch {
      // Fallback local initial state
      setPlayers([
        { user_id: user.id, username: user.username, avatar: user.avatar, level: user.level, is_ready: true, is_host: true }
      ]);
    }
  };

  // 2. Establish live WebSocket connection
  useEffect(() => {
    const wsUrl = getWebSocketUrl(`/ws/rooms/${code}?token=${token || ''}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // WebSocket connected
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerBroadcast(data);
      } catch {
        // Ignore parsing errors
      }
    };

    ws.onclose = () => {
      // Clean disconnect
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [code, token]);

  const handleServerBroadcast = (data) => {
    if (data.type === 'chat_message') {
      playClick();
      setMessages(prev => [...prev, { sender: data.sender, text: data.text }]);
    } else if (data.type === 'player_joined') {
      setPlayers(prev => {
        if (prev.some(p => p.username === data.username)) return prev;
        return [...prev, {
          user_id: data.user_id,
          username: data.username,
          avatar: data.avatar || user.avatar,
          level: 1,
          is_ready: false,
          is_host: false
        }];
      });
      setMessages(prev => [...prev, { sender: 'System', text: `${data.username} has entered the chamber.`, isSystem: true }]);
    } else if (data.type === 'player_left') {
      setPlayers(prev => prev.filter(p => p.username !== data.username));
      setMessages(prev => [...prev, { sender: 'System', text: `${data.username} has departed.`, isSystem: true }]);
    } else if (data.type === 'player_ready_changed') {
      setPlayers(prev => prev.map(p => p.user_id === data.user_id ? { ...p, is_ready: data.is_ready } : p));
    } else if (data.type === 'host_migrated') {
      setPlayers(prev => prev.map(p => ({ ...p, is_host: p.user_id === data.new_host_id })));
      setMessages(prev => [...prev, { sender: 'System', text: `${data.new_host_username} has been promoted to Host.`, isSystem: true }]);
    } else if (data.type === 'game_started' || data.type === 'round_advanced') {
      playSelect();
      setActiveNode(data.node);
      setVoteTally({});
      setMyVote(null);
      setIsGameOver(false);
    } else if (data.type === 'vote_update') {
      playClick();
      setVoteTally(data.votes || {});
    } else if (data.type === 'game_over') {
      setIsGameOver(true);
      setGameResult(data);
      if (data.is_winning_ending) {
        playVictory();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } else {
        playDefeat();
      }
    }
  };

  const handleCopyCode = () => {
    playClick();
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    playClick();
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'chat',
        message: chatInput.trim()
      }));
    } else {
      setMessages(prev => [...prev, { sender: user.username, text: chatInput.trim() }]);
    }
    setChatInput('');
  };

  const handleToggleReady = () => {
    playClick();
    const nextReady = !isReady;
    setIsReady(nextReady);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'toggle_ready'
      }));
    }
  };

  const handleVote = (targetNodeId) => {
    playSelect();
    setMyVote(targetNodeId);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'vote',
        target_node_id: targetNodeId
      }));
    } else {
      setVoteTally(prev => ({
        ...prev,
        [targetNodeId]: (prev[targetNodeId] || 0) + 1
      }));
    }
  };

  const handleLaunchAdventure = () => {
    playVictory();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'start_game'
      }));
    } else {
      navigate('/create?theme=Multiplayer%20Expedition');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      
      {/* Room Header Banner */}
      <div className="rounded-3xl bg-[#0f111c] border border-purple-800/40 p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-semibold">Live Chamber Active</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-xs text-purple-400">{roomMode}</span>
          </div>

          <h1 className="font-['Cinzel',serif] text-2xl sm:text-3xl font-black text-white">
            {roomTitle}
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Room Code: <span className="text-purple-300 font-bold tracking-widest text-sm">{code}</span>
          </p>
        </div>

        {/* Copy Invite Link Button & Host Launch */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-purple-700/40 text-purple-200 text-xs font-semibold hover:bg-slate-800 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
            <span>{copied ? 'Link Copied!' : 'Copy Party Link'}</span>
          </button>

          {isHost && (
            <button
              onClick={handleLaunchAdventure}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-pink-900/40 transition"
            >
              <Play className="w-4 h-4" />
              <span>Launch Quest</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Player Roster & Real-Time Voting Stage */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Party Roster */}
          <div className="rounded-3xl bg-[#0f111c] border border-slate-800/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-200 uppercase font-mono tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Adventurer Roster ({players.length}/4)</span>
              </h2>
              <button
                onClick={handleToggleReady}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs uppercase transition ${
                  isReady 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {isReady ? '✓ Ready' : 'Mark Ready'}
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {players.map((p, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2 relative">
                  {p.is_host && (
                    <div className="absolute top-2 right-2 text-amber-400" title="Party Host">
                      <Crown className="w-4 h-4" />
                    </div>
                  )}
                  <img src={p.avatar || user.avatar} alt="" className="w-12 h-12 mx-auto rounded-xl object-cover ring-1 ring-purple-500" />
                  <div>
                    <p className="font-bold text-xs text-white truncate">{p.username || p.name}</p>
                    <p className="text-[10px] text-purple-400 font-mono">LVL {p.level || 1}</p>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                    p.is_ready ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {p.is_ready ? 'READY' : 'WAITING'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Synchronized Live Choice Voting Chamber */}
          <div className="rounded-3xl bg-[#0f111c] border border-purple-800/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vote className="w-5 h-5 text-pink-400" />
                <h3 className="font-bold text-sm text-slate-100">Live Party Decision Chamber</h3>
              </div>
              <span className="text-xs font-mono text-purple-400">
                {activeNode ? 'Synchronized Decision' : 'Awaiting Quest Launch'}
              </span>
            </div>

            {isGameOver ? (
              <div className="text-center py-6 space-y-4">
                <div className={`w-14 h-14 mx-auto rounded-2xl p-1 flex items-center justify-center ${
                  gameResult?.is_winning_ending ? 'bg-amber-400/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {gameResult?.is_winning_ending ? <Trophy className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
                </div>
                <h3 className="font-['Cinzel',serif] text-xl font-bold text-white">
                  {gameResult?.is_winning_ending ? 'Expedition Victorious!' : 'Party Consumed by Fate'}
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  {gameResult?.content}
                </p>
                <div className="inline-flex items-center gap-4 px-4 py-2 rounded-xl bg-purple-950/40 border border-purple-600/30 text-xs font-mono text-purple-300">
                  <span>+150 EXP Awarded</span>
                  <span>+60 Gold Loot</span>
                </div>
              </div>
            ) : activeNode ? (
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-200 bg-[#0a0b12] p-4 rounded-2xl border border-slate-800 leading-relaxed">
                  {activeNode.content}
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  {(activeNode.options || []).map((opt, oIdx) => {
                    const votesForThis = voteTally[opt.node_id] || 0;
                    const isMyPick = myVote === opt.node_id;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleVote(opt.node_id)}
                        className={`p-4 rounded-2xl border text-left space-y-2 transition ${
                          isMyPick 
                            ? 'bg-purple-900/40 border-purple-500 text-white shadow-lg' 
                            : 'bg-slate-900/40 border-slate-800 text-purple-200 hover:border-purple-600/40'
                        }`}
                      >
                        <div className="flex justify-between text-xs font-bold font-mono">
                          <span>Choice {oIdx + 1}</span>
                          <span className="text-purple-400">{votesForThis} Votes</span>
                        </div>
                        <p className="text-xs">{opt.text}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <Sparkles className="w-8 h-8 mx-auto text-purple-400 animate-pulse" />
                <p className="text-xs text-slate-400">
                  {isHost ? 'All adventurers are ready. Click "Launch Quest" above to commence the journey!' : 'Waiting for Party Host to launch the expedition...'}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right Col: Live Party Chat */}
        <div className="rounded-3xl bg-[#0f111c] border border-slate-800/80 p-5 flex flex-col h-[480px]">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-xs uppercase font-mono text-slate-200">Chamber Whispers</h3>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2.5 scrollbar-thin">
            {messages.map((m, idx) => (
              <div key={idx} className={`text-xs ${m.isSystem ? 'text-purple-300 italic text-center py-1 font-mono text-[11px]' : 'text-slate-300'}`}>
                {!m.isSystem && (
                  <span className="font-bold text-purple-400 mr-1.5">{m.sender}:</span>
                )}
                <span>{m.text}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Send message or emote..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}

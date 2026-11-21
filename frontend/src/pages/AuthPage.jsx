import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Sparkles, KeyRound, Mail, User, Coins, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, DEFAULT_AVATARS } = useAuth();
  const { playClick, playVictory } = useSound();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    playClick();

    if (!email || !password || (isRegister && !username)) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        await register(username, email, password, DEFAULT_AVATARS[selectedAvatar]);
        playVictory();
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-auto py-8">
      <div className="rounded-3xl bg-[#0f111c] border border-purple-800/40 p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-[1px] shadow-lg shadow-purple-900/40">
            <div className="w-full h-full bg-[#0a0b12] rounded-[15px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <h1 className="font-['Cinzel',serif] text-2xl font-bold text-white">
            {isRegister ? 'Create Player Character' : 'Adventurer Login'}
          </h1>
          <p className="text-xs text-slate-400">
            {isRegister ? 'Start your journey with 200 Gold + 100 Starter XP' : 'Return to your saved quests and party rooms'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => { playClick(); setIsRegister(false); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              !isRegister ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { playClick(); setIsRegister(true); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              isRegister ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register Character
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Selector if Register */}
          {isRegister && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Choose Hero Avatar</label>
              <div className="flex items-center justify-between gap-2">
                {DEFAULT_AVATARS.map((url, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => { playClick(); setSelectedAvatar(idx); }}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition ${
                      selectedAvatar === idx ? 'border-purple-500 scale-105 shadow-md shadow-purple-600/40' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" />
                <span>Player Username</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Valerius The Brave"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="adventurer@mythos.game"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-pink-400" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-purple-900/30 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isRegister ? 'Enter Realm & Claim Rewards' : 'Sign In To Account'}
          </button>
        </form>

        <div className="pt-2 text-center">
          <Link
            to="/explore"
            onClick={playClick}
            className="text-xs text-slate-400 hover:text-purple-300 transition"
          >
            Skip for now and continue as Guest →
          </Link>
        </div>

      </div>
    </div>
  );
}

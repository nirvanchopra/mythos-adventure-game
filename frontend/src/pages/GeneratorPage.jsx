import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Wand2, 
  Sparkles, 
  Compass, 
  User, 
  ShieldAlert, 
  Cpu, 
  Flame, 
  RefreshCw, 
  ChevronRight,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useSound } from '../context/SoundContext';
import { API_BASE_URL } from '../util.js';

export default function GeneratorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { playClick, playSelect, playVictory } = useSound();

  const [theme, setTheme] = useState(searchParams.get('theme') || '');
  const [genre, setGenre] = useState('Fantasy');
  const [difficulty, setDifficulty] = useState('Adventurer');
  const [characterName, setCharacterName] = useState('');
  const [characterClass, setCharacterClass] = useState('Mage / Arcanist');
  const [length, setLength] = useState('Standard (3 Nodes)');
  
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progressMsg, setProgressMsg] = useState('Initiating Story Matrix...');

  const genres = ['Fantasy', 'Horror', 'Mystery', 'Sci-Fi', 'Thriller', 'Romance', 'Historical', 'Adventure'];
  const difficulties = ['Novice (Gentle Paths)', 'Adventurer (Balanced Stakes)', 'Hardcore (Deadly Consequences)'];
  const classes = ['Mage / Arcanist', 'Shadow Rogue', 'Holy Paladin', 'Cyber-Runner', 'Gunslinger', 'Diplomat'];

  const quickThemes = [
    'The Lost Citadel of Eldoria',
    'Cyberpunk 2099 Blackout Protocol',
    'Haunted Lighthouse on Sorrow Reef',
    'The Pharaoh’s Eclipse Curse',
    'Derelict Starship Omega Zero',
    'The Clockwork Conspiracy of London'
  ];

  // Asynchronous Job Polling Loop
  useEffect(() => {
    let pollInterval;
    if (jobId && (jobStatus === 'pending' || jobStatus === 'processing')) {
      const messages = [
        'Consulting the Ancient Codex...',
        'Weaving branching destiny nodes...',
        'Structuring lethal dilemmas and rewards...',
        'Sealing final narrative checkpoints...',
        'Polishing branching timeline...'
      ];
      let msgIdx = 0;

      pollInterval = setInterval(async () => {
        try {
          msgIdx = (msgIdx + 1) % messages.length;
          setProgressMsg(messages[msgIdx]);

          const response = await axios.get(`${API_BASE_URL}/jobs/${jobId}`);
          const { status, story_id, error: jobErr } = response.data;
          setJobStatus(status);

          if (status === 'completed' && story_id) {
            clearInterval(pollInterval);
            setLoading(false);
            playVictory();
            navigate(`/story/${story_id}`);
          } else if (status === 'failed' || jobErr) {
            clearInterval(pollInterval);
            setError(jobErr || 'The AI Story Generator encountered a disturbance in the weave.');
            setLoading(false);
          }
        } catch (e) {
          if (e.response?.status !== 404) {
            clearInterval(pollInterval);
            setError(`Status query failed: ${e.message}`);
            setLoading(false);
          }
        }
      }, 4000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [jobId, jobStatus, navigate, playVictory]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!theme.trim()) {
      setError('Please provide an adventure theme or narrative premise.');
      return;
    }

    playSelect();
    setLoading(true);
    setError(null);
    setProgressMsg('Transmitting prompt to LangChain Groq Engine...');

    try {
      // Craft rich prompt integrating genre, character, and difficulty
      const response = await axios.post(`${API_BASE_URL}/stories/create`, {
        theme,
        genre,
        difficulty,
        character_name: characterName || 'The Wanderer',
        character_class: characterClass || 'Adventurer'
      }, { withCredentials: true });

      const { job_id, status } = response.data;
      setJobId(job_id);
      setJobStatus(status);
    } catch (err) {
      setLoading(false);
      setError(`Failed to enqueue generation job: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-mono uppercase tracking-wider">
          <Wand2 className="w-3.5 h-3.5" />
          <span>LangChain LLM Adventure Engine</span>
        </div>
        <h1 className="font-['Cinzel',serif] text-3xl sm:text-5xl font-black text-white">
          THE AI STORY FORGE
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Craft custom interactive storybooks with deep branches, inventory-dependent choices, and multiple endings.
        </p>
      </div>

      {/* Main Generation Interface or Loading Portal */}
      {loading ? (
        <div className="rounded-3xl bg-[#0f111c] border border-purple-800/40 p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
          {/* Animated Spell Circle Portal */}
          <div className="relative w-36 h-36 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-purple-500/50 animate-spin duration-1000" />
            <div className="absolute inset-2 rounded-full border border-pink-500/40 animate-ping duration-1500" />
            <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-purple-900/60 to-indigo-900/60 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-purple-300 animate-pulse" />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-['Cinzel',serif] text-2xl font-bold text-white">
              Weaving Your Narrative Arc
            </h3>
            <p className="text-xs sm:text-sm font-mono text-purple-300 animate-pulse">
              {progressMsg}
            </p>
            <p className="text-xs text-slate-500">
              Generating deep branching choices, winning paths, and deadly climaxes...
            </p>
          </div>

          <div className="w-48 mx-auto h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-full animate-pulse" style={{ width: '85%' }} />
          </div>
        </div>
      ) : (
        <form onSubmit={handleGenerate} className="rounded-3xl bg-[#0f111c] border border-purple-800/40 p-6 sm:p-8 shadow-2xl space-y-6">
          
          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Theme Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Flame className="w-4 h-4 text-purple-400" />
              <span>Adventure Premise & Central Conflict</span>
            </label>
            <textarea
              rows={3}
              required
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. A team of deep-sea archaeologists uncover an ancient temple buried inside the Mariana Trench..."
              className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-purple-500 transition resize-none"
            />

            {/* Quick Themes */}
            <div className="pt-2">
              <p className="text-[11px] text-slate-400 font-mono mb-2">Inspiration Sparks:</p>
              <div className="flex flex-wrap gap-2">
                {quickThemes.map((qt, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => { playClick(); setTheme(qt); }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-600/30 text-[11px] text-slate-300 hover:text-purple-300 transition"
                  >
                    + {qt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Genre Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Story Genre</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {genres.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => { playClick(); setGenre(g); }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                    genre === g 
                      ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-md shadow-purple-900/30' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Character & Difficulty 2-Col Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            
            {/* Character Info */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Protagonist Name</span>
              </label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="e.g. Captain Vane, Lyra Vance"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            {/* Character Archetype */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Hero Archetype</span>
              </label>
              <select
                value={characterClass}
                onChange={(e) => setCharacterClass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500 transition"
              >
                {classes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Difficulty & Length Row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">Difficulty Stakes</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500 transition"
              >
                {difficulties.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">Narrative Scope</label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500 transition"
              >
                <option value="Standard (3 Nodes)">Standard (3 Nodes, Multiple Endings)</option>
                <option value="Extended Epic (5 Nodes)">Extended Epic (High Branching)</option>
              </select>
            </div>
          </div>

          {/* Submit Forge Button */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm tracking-widest uppercase shadow-xl shadow-purple-900/40 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>Ignite Story Forge</span>
            <ChevronRight className="w-5 h-5" />
          </button>

        </form>
      )}

    </div>
  );
}

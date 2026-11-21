import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Wand2, 
  Users, 
  Trophy, 
  Compass, 
  ShieldAlert, 
  ChevronRight, 
  Coins, 
  Flame, 
  CheckCircle2, 
  BookOpen
} from 'lucide-react';
import { useSound } from '../context/SoundContext';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { playClick, playSelect } = useSound();
  const { user } = useAuth();

  const features = [
    {
      icon: Wand2,
      color: 'from-purple-500 to-indigo-500',
      title: 'AI Story Forge',
      desc: 'Powered by LangChain LLM intelligence. Choose themes, genres, character archetypes and embark on dynamically generated branching sagas.'
    },
    {
      icon: Users,
      color: 'from-pink-500 to-rose-500',
      title: 'Multiplayer Adventures',
      desc: 'Form a party with friends. Vote on decisions in real-time or compete in high-stakes timed challenge trials to determine the plot.'
    },
    {
      icon: Trophy,
      color: 'from-amber-400 to-amber-600',
      title: 'Progression & Ranks',
      desc: 'Gain XP, level up from Novice to Legendary Storyteller, unlock prestigious badges, and climb the Global Hall of Fame.'
    },
    {
      icon: Coins,
      color: 'from-cyan-400 to-blue-500',
      title: 'In-Game Economy',
      desc: 'Earn gold coins through victories and daily quests. Unlock exclusive story genres, avatar skins, and rare narrative relics.'
    }
  ];

  return (
    <div className="space-y-16 py-6 sm:py-10">
      
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-xs font-mono uppercase tracking-widest shadow-inner animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Multiplayer Storytelling Platform</span>
        </div>

        <h1 className="font-['Cinzel',serif] text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight bg-gradient-to-b from-white via-slate-200 to-purple-400 bg-clip-text text-transparent">
          FORGE YOUR FATE IN INFINITE REALITIES
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Step beyond static reading. Command branching narratives, solve lethal dilemmas with friends in real-time multiplayer, and carve your legend into the chronicles.
        </p>

        {/* CTA Button Group */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/create"
            onClick={playClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-purple-900/40 hover:shadow-purple-700/60 transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Wand2 className="w-4 h-4" />
            <span>Generate New Adventure</span>
            <ChevronRight className="w-4 h-4" />
          </Link>

          <Link
            to="/multiplayer"
            onClick={playClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-purple-500/30 text-slate-200 hover:text-white font-bold text-sm tracking-wide transition"
          >
            <Users className="w-4 h-4 text-pink-400" />
            <span>Join Multiplayer Lobby</span>
          </Link>
        </div>
      </section>

      {/* Interactive Story Showcase Preview Box */}
      <section className="max-w-3xl mx-auto rounded-3xl bg-[#10121d] border border-purple-800/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Flame className="w-32 h-32 text-purple-500" />
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-xs uppercase tracking-wider text-slate-400">Live Preview Dilemma</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-700/40 text-purple-300">
            Genre: Eldritch Fantasy
          </span>
        </div>

        <div className="py-6 space-y-4">
          <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-bold text-slate-100">
            The Whispering Vault of Eldoria
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Before you looms a cyclopean door inscribed with shifting starlight runes. A shadowy guardian steps forth, offering two paths: drink from the Well of Forgotten Visions, or challenge the Sentinel in armed combat.
          </p>
        </div>

        {/* Mock Choice Cards */}
        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          <button 
            onClick={() => { playSelect(); alert("You drank from the Well! Ancient visions flood your mind (+25 XP)."); }}
            className="p-4 rounded-2xl bg-purple-950/20 hover:bg-purple-900/40 border border-purple-800/30 text-left text-xs sm:text-sm font-medium text-purple-200 hover:text-white transition group flex items-start gap-3"
          >
            <span className="w-6 h-6 rounded-lg bg-purple-900/50 flex items-center justify-center font-mono text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition">
              1
            </span>
            <span>Drink from the Well of Forgotten Visions</span>
          </button>

          <button 
            onClick={() => { playSelect(); alert("You drew your blade against the Sentinel! Combat commenced (+25 XP)."); }}
            className="p-4 rounded-2xl bg-indigo-950/20 hover:bg-indigo-900/40 border border-indigo-800/30 text-left text-xs sm:text-sm font-medium text-indigo-200 hover:text-white transition group flex items-start gap-3"
          >
            <span className="w-6 h-6 rounded-lg bg-indigo-900/50 flex items-center justify-center font-mono text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition">
              2
            </span>
            <span>Draw your weapon and duel the Sentinel</span>
          </button>
        </div>
      </section>

      {/* Feature Pillar Cards */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div 
              key={idx}
              className="p-6 rounded-2xl bg-[#0f111c] border border-slate-800/80 hover:border-purple-600/40 transition duration-300 hover:shadow-xl hover:shadow-purple-950/20 group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feat.color} p-[1px] shadow-lg`}>
                  <div className="w-full h-full bg-[#0a0b12] rounded-[11px] flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white group-hover:scale-110 transition duration-300" />
                  </div>
                </div>

                <h3 className="font-bold text-base text-slate-100 group-hover:text-purple-300 transition">
                  {feat.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Fast Start Banner */}
      <section className="rounded-3xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900 border border-purple-700/30 p-8 text-center max-w-4xl mx-auto space-y-4">
        <h3 className="font-['Cinzel',serif] text-2xl font-bold text-white">
          Begin Playing Instantly as a Guest
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          No mandatory sign-up hurdles. Jump into an adventure now. You can link your progress and register your permanent hero profile at any time.
        </p>
        <div className="pt-2">
          <Link
            to="/explore"
            onClick={playClick}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Available Adventures</span>
          </Link>
        </div>
      </section>

    </div>
  );
}

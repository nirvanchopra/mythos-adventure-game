import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Sparkles, 
  Play, 
  Users, 
  Star, 
  Flame, 
  Layers, 
  Compass 
} from 'lucide-react';
import { useSound } from '../context/SoundContext';

export const DISCOVER_STORIES = [
  {
    id: 101,
    title: 'Crown of the Sunken Citadel',
    genre: 'Fantasy',
    difficulty: 'Adventurer',
    rating: 4.9,
    plays: 1420,
    depth: '4 Levels',
    description: 'An ancient kingdom submerged beneath the abyssal rift awakens. Only an intrepid diver can decipher the leviathan runes.',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 102,
    title: 'Neon Bloodlines: 2099',
    genre: 'Sci-Fi',
    difficulty: 'Legendary',
    rating: 4.8,
    plays: 980,
    depth: '5 Levels',
    description: 'In the rain-slick alleys of New Kyoto, a rogue android carries encrypted memories capable of toppling the megacorporation grid.',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 103,
    title: 'The Haunting of Blackwood Manor',
    genre: 'Horror',
    difficulty: 'Novice',
    rating: 4.7,
    plays: 2150,
    depth: '3 Levels',
    description: 'Locked inside a cursed Victorian estate on a storm-swept moor. Every clock ticks backwards as midnight approaches.',
    image: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 104,
    title: 'The Orient Express Enigma',
    genre: 'Mystery',
    difficulty: 'Adventurer',
    rating: 4.9,
    plays: 1670,
    depth: '4 Levels',
    description: 'A priceless sapphire vanished in the snowdrifts of the Swiss Alps. Interrogate eccentric passengers before the train arrives.',
    image: 'https://images.unsplash.com/photo-1517404215738-15263e9f9178?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 105,
    title: 'Siege of the Iron Citadel',
    genre: 'Historical',
    difficulty: 'Legendary',
    rating: 4.6,
    plays: 780,
    depth: '5 Levels',
    description: 'Command the royal vanguard during the climactic siege of 1453. Your tactical choices will alter the destiny of empires.',
    image: 'https://images.unsplash.com/photo-1533158307587-828f0a76ef46?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 106,
    title: 'Heartbeats in the Wasteland',
    genre: 'Romance',
    difficulty: 'Novice',
    rating: 4.8,
    plays: 1200,
    depth: '3 Levels',
    description: 'Amidst a post-apocalyptic shelter, two rival scavengers form a forbidden bond that could heal or shatter their fractured faction.',
    image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80'
  }
];

export default function ExplorePage() {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const { playClick, playSelect } = useSound();
  const navigate = useNavigate();

  const genres = ['All', 'Fantasy', 'Sci-Fi', 'Horror', 'Mystery', 'Historical', 'Romance', 'Thriller', 'Adventure'];

  const filteredStories = DISCOVER_STORIES.filter(s => {
    const matchesGenre = selectedGenre === 'All' || s.genre.toLowerCase() === selectedGenre.toLowerCase();
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = selectedDifficulty === 'All' || s.difficulty === selectedDifficulty;
    return matchesGenre && matchesSearch && matchesDiff;
  });

  return (
    <div className="space-y-8 py-4">
      
      {/* Page Title & Search Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="font-['Cinzel',serif] text-3xl font-bold text-white flex items-center gap-3">
            <Compass className="w-7 h-7 text-purple-400" />
            <span>Story Discovery & Realms</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Explore curated community sagas or use AI Forge to tailor a bespoke adventure.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sagas, relics, keywords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500 transition"
          />
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => { playClick(); setSelectedGenre(g); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedGenre === g
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Story Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStories.map((story) => (
          <div
            key={story.id}
            className="rounded-3xl bg-[#0f111c] border border-slate-800/80 hover:border-purple-600/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-950/30 flex flex-col group"
          >
            {/* Card Thumbnail */}
            <div className="relative h-44 overflow-hidden">
              <img
                src={story.image}
                alt={story.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f111c] via-transparent to-black/40" />
              
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-purple-300">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>{story.genre}</span>
              </div>

              <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-[10px] font-mono text-amber-300">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{story.rating}</span>
              </div>
            </div>

            {/* Card Details */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{story.depth}</span>
                  <span className="text-amber-400">{story.difficulty}</span>
                </div>

                <h3 className="font-['Cinzel',serif] text-base font-bold text-white group-hover:text-purple-300 transition line-clamp-1">
                  {story.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {story.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => { playSelect(); navigate(`/create?theme=${encodeURIComponent(story.title)}`); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Embark Solo</span>
                </button>

                <button
                  onClick={() => { playClick(); navigate(`/multiplayer?story=${encodeURIComponent(story.title)}`); }}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-pink-400 hover:text-pink-300 transition"
                  title="Host Multiplayer Room with this Story"
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

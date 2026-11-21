import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Coins, 
  Sparkles, 
  Check, 
  Palette, 
  ShieldCheck, 
  Scroll, 
  AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { API_BASE_URL } from '../util.js';

export const STORE_ITEMS = [
  { id: 'skin_cyber_assassin', name: 'Cyber Assassin Outfit', category: 'skins', price: 150, icon: 'Shield', description: 'Gleaming holographic armor suited for futuristic neon sagas.' },
  { id: 'skin_solar_paladin', name: 'Solar Dawn Regalia', category: 'skins', price: 250, icon: 'Sparkles', description: 'Blessed plate imbued with solar radiance.' },
  { id: 'genre_lovecraft', name: 'Cosmic Eldritch Lore Pack', category: 'genres', price: 200, icon: 'Scroll', description: 'Unlocks deeper cosmic horror prompts and sanity-loss branches.' },
  { id: 'genre_steampunk', name: 'Aether-Punk Victorian Odyssey', category: 'genres', price: 180, icon: 'Palette', description: 'Unlocks airship voyages and brass clockwork narrative choices.' },
  { id: 'relic_second_chance', name: 'Amulet of Chronos', category: 'relics', price: 100, icon: 'Scroll', description: 'Rewinds your most recent fatal choice in any adventure.' },
  { id: 'relic_divine_insight', name: 'Tears of the Seer', category: 'relics', price: 120, icon: 'Sparkles', description: 'Reveals which branching choices lead toward winning endings.' }
];

export default function StorePage() {
  const { user, spendCoins } = useAuth();
  const { playClick, playVictory } = useSound();
  const [activeTab, setActiveTab] = useState('all');
  const [message, setMessage] = useState(null);

  const handlePurchase = async (item) => {
    playClick();
    if (user.coins < item.price) {
      setMessage({ type: 'error', text: `Insufficient Gold! You need ${item.price - user.coins} more Gold coins.` });
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/rewards/store/purchase`, {
        item_id: item.id,
        item_name: item.name,
        cost: item.price,
        category: item.category,
        description: item.description
      }, { withCredentials: true });

      if (res.data?.success) {
        playVictory();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        setMessage({ type: 'success', text: `Successfully unlocked ${item.name}! Added to your inventory.` });
        user.coins = res.data.remaining_coins;
        user.inventory = res.data.inventory;
        return;
      }
    } catch (err) {
      const msg = err.response?.data?.detail;
      if (msg) {
        setMessage({ type: 'error', text: msg });
        return;
      }
    }

    const success = spendCoins(item.price);
    if (success) {
      playVictory();
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      setMessage({ type: 'success', text: `Successfully unlocked ${item.name}! Added to your inventory.` });
      user.inventory.push({
        id: item.id,
        name: item.name,
        type: item.category,
        description: item.description
      });
    }
  };

  const filteredItems = STORE_ITEMS.filter(item => activeTab === 'all' || item.category === activeTab);

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#10121d] to-purple-950/40 border border-amber-600/30 p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono uppercase tracking-wider">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Vault of Antiquities</span>
          </div>
          <h1 className="font-['Cinzel',serif] text-3xl font-black text-white">
            REWARDS & RELIC STORE
          </h1>
          <p className="text-xs text-slate-400">
            Exchange your earned adventure gold for narrative relics, character skins, and exclusive sagas.
          </p>
        </div>

        {/* Live Gold Counter */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-amber-500/40 px-5 py-3 rounded-2xl shadow-xl">
          <Coins className="w-6 h-6 text-amber-400 animate-pulse" />
          <div>
            <p className="text-[10px] text-amber-500 font-mono uppercase tracking-wider">Your Gold</p>
            <p className="text-xl font-bold font-mono text-amber-300">{user.coins}</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-300' 
            : 'bg-rose-950/40 border border-rose-800/50 text-rose-300'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['all', 'skins', 'genres', 'relics'].map((cat) => (
          <button
            key={cat}
            onClick={() => { playClick(); setActiveTab(cat); }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === cat 
                ? 'text-amber-400 border-b-2 border-amber-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {cat === 'all' ? 'All Relics' : cat}
          </button>
        ))}
      </div>

      {/* Store Items Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const isOwned = (user.inventory || []).some(inv => inv.id === item.id);
          return (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-[#0f111c] border border-slate-800/80 hover:border-amber-500/40 transition flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-purple-400 uppercase">{item.category}</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" /> {item.price} Gold
                  </span>
                </div>

                <h3 className="font-['Cinzel',serif] text-base font-bold text-white group-hover:text-amber-300 transition">
                  {item.name}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <button
                disabled={isOwned}
                onClick={() => handlePurchase(item)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                  isOwned
                    ? 'bg-slate-800 text-slate-500 cursor-default'
                    : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-900/30'
                }`}
              >
                {isOwned ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Acquired</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Unlock for {item.price} Gold</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}

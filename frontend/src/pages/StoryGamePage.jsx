import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Compass, 
  RotateCcw, 
  Sparkles, 
  Trophy, 
  Skull, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  Backpack, 
  BookOpen, 
  Coins, 
  Award,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { API_BASE_URL } from '../util.js';

export default function StoryGamePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { recordStoryCompletion, user } = useAuth();
  const { playClick, playSelect, playVictory, playDefeat } = useSound();

  const [story, setStory] = useState(null);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [currentNode, setCurrentNode] = useState(null);
  const [options, setOptions] = useState([]);
  const [isEnding, setIsEnding] = useState(false);
  const [isWinningEnding, setIsWinningEnding] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyTrail, setHistoryTrail] = useState([]);
  const [showInventory, setShowInventory] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  useEffect(() => {
    loadStory(id);
  }, [id]);

  const loadStory = async (storyId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/stories/${storyId}/complete`, { withCredentials: true });
      const storyData = response.data;
      setStory(storyData);
      
      // Check for saved checkpoint to resume
      let resumedNodeId = null;
      try {
        const progressRes = await axios.get(`${API_BASE_URL}/progress/${storyId}`, { withCredentials: true });
        if (progressRes.data && progressRes.data.current_node_id) {
          resumedNodeId = progressRes.data.current_node_id;
          if (progressRes.data.visited_node_ids) {
            setHistoryTrail(progressRes.data.visited_node_ids);
          }
        }
      } catch {
        // No saved progress, start at root
      }

      if (resumedNodeId && storyData.all_nodes[resumedNodeId]) {
        setCurrentNodeId(resumedNodeId);
      } else if (storyData.root_node) {
        setCurrentNodeId(storyData.root_node.id);
        setHistoryTrail([storyData.root_node.id]);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Story chronicles not found in this reality.');
      } else {
        setError(`Failed to retrieve story: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentNodeId && story && story.all_nodes) {
      const node = story.all_nodes[currentNodeId];
      if (node) {
        setCurrentNode(node);
        setIsEnding(Boolean(node.is_ending || node.is_end_node));
        
        // Corrected typo from original code: is_winning_ending
        const winning = Boolean(node.is_winning_ending);
        setIsWinningEnding(winning);

        if (!node.is_ending && !node.is_end_node && node.options && node.options.length > 0) {
          setOptions(node.options);
        } else {
          setOptions([]);
        }

        // Trigger victory fanfare & confetti or defeat tone
        if (node.is_ending || node.is_end_node) {
          if (winning) {
            playVictory();
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            if (!rewardClaimed) {
              recordStoryCompletion(story, 'win');
              axios.post(`${API_BASE_URL}/rewards/story-complete`, {
                story_id: story.id,
                outcome: 'win'
              }, { withCredentials: true }).catch(() => null);
              setRewardClaimed(true);
            }
          } else {
            playDefeat();
            if (!rewardClaimed) {
              recordStoryCompletion(story, 'loss');
              axios.post(`${API_BASE_URL}/rewards/story-complete`, {
                story_id: story.id,
                outcome: 'loss'
              }, { withCredentials: true }).catch(() => null);
              setRewardClaimed(true);
            }
          }
        }
      }
    }
  }, [currentNodeId, story]);

  const handleSelectOption = (targetNodeId) => {
    playSelect();
    const updatedTrail = [...historyTrail, targetNodeId];
    setHistoryTrail(updatedTrail);
    setCurrentNodeId(targetNodeId);

    // Auto-save checkpoint
    axios.post(`${API_BASE_URL}/progress/save`, {
      story_id: story.id,
      current_node_id: targetNodeId,
      visited_node_ids: updatedTrail,
      inventory_snapshot: user.inventory || [],
      is_completed: false,
      outcome: 'in_progress',
      checkpoint_name: `Decision at Step ${updatedTrail.length}`
    }, { withCredentials: true }).catch(() => null);
  };

  const handleRestart = () => {
    playClick();
    if (story && story.root_node) {
      setCurrentNodeId(story.root_node.id);
      setHistoryTrail([story.root_node.id]);
      setRewardClaimed(false);
      // Reset checkpoint on server
      axios.delete(`${API_BASE_URL}/progress/${story.id}`, { withCredentials: true }).catch(() => null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full border-2 border-dashed border-purple-500 animate-spin" />
        <h2 className="font-['Cinzel',serif] text-xl font-bold text-white">Opening Ancient Chronicles...</h2>
        <p className="text-xs text-slate-400">Loading narrative branching matrix</p>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="max-w-md mx-auto my-auto py-12 text-center space-y-6 rounded-3xl bg-[#0f111c] border border-rose-800/40 p-8 shadow-2xl">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="font-['Cinzel',serif] text-2xl font-bold text-white">Chronicle Unreachable</h2>
        <p className="text-xs text-slate-300">{error || 'Unable to open story.'}</p>
        <Link
          to="/create"
          onClick={playClick}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg transition"
        >
          <BookOpen className="w-4 h-4" />
          <span>Forge a New Story</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      
      {/* Top Story Header & Adventure HUD */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-purple-900/30">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400">
            <Compass className="w-3.5 h-3.5" />
            <span>Story Chapter • Step {historyTrail.length}</span>
          </div>
          <h1 className="font-['Cinzel',serif] text-2xl sm:text-3xl font-black text-white mt-1">
            {story.title}
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Inventory Drawer Toggle */}
          <button
            onClick={() => { playClick(); setShowInventory(!showInventory); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
              showInventory 
                ? 'bg-purple-600 border-purple-500 text-white' 
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Backpack className="w-4 h-4 text-purple-400" />
            <span>Pouch ({user.inventory?.length || 0})</span>
          </button>

          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
            title="Restart to Beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Inventory Drawer Dropdown */}
      {showInventory && (
        <div className="p-4 rounded-2xl bg-[#121422] border border-purple-800/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono">Hero's Adventure Inventory</h3>
            <span className="text-[11px] text-amber-400 font-mono">{user.coins} Gold</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            {(user.inventory || []).map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-200">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.description}</p>
                </div>
                <button 
                  onClick={() => { playSelect(); alert(`Used ${item.name}! Its arcane power resonates.`); }}
                  className="px-2 py-1 rounded bg-purple-950/60 hover:bg-purple-900 text-purple-300 text-[10px] font-mono border border-purple-800/40"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Narrative Display Card */}
      <div className="rounded-3xl bg-[#0f111c] border border-purple-800/40 p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
        
        {currentNode && (
          <div className="space-y-6">
            
            {/* Ambient Story Scene Text */}
            <div className="relative p-6 sm:p-8 rounded-2xl bg-[#0a0b12] border border-slate-800/90 shadow-inner">
              <p className="text-slate-100 text-base sm:text-lg leading-relaxed font-sans font-normal tracking-wide">
                {currentNode.content}
              </p>
            </div>

            {/* Ending Resolution Screen */}
            {isEnding ? (
              <div className="text-center py-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className={`w-16 h-16 mx-auto rounded-3xl p-1 shadow-2xl flex items-center justify-center ${
                  isWinningEnding 
                    ? 'bg-gradient-to-tr from-amber-400 to-amber-600 text-black' 
                    : 'bg-gradient-to-tr from-rose-500 to-red-700 text-white'
                }`}>
                  {isWinningEnding ? <Trophy className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
                </div>

                <div className="space-y-2">
                  <h2 className="font-['Cinzel',serif] text-2xl sm:text-3xl font-black text-white">
                    {isWinningEnding ? 'GLORIOUS TRIUMPH' : 'FATE CONSUMED'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                    {isWinningEnding 
                      ? 'You deciphered the trials and claimed the victorious ending. Your legend echoes across the realms!'
                      : 'Your decisions led into the abyss. Even in defeat, wisdom is etched into the adventurer’s soul.'
                    }
                  </p>
                </div>

                {/* Reward Claim Banner */}
                <div className="inline-flex items-center gap-6 px-6 py-3 rounded-2xl bg-slate-900/90 border border-purple-800/40 font-mono text-xs">
                  <span className="text-purple-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    +{isWinningEnding ? '120' : '60'} EXP
                  </span>
                  <div className="w-[1px] h-4 bg-slate-800" />
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    +{isWinningEnding ? '50' : '20'} Gold
                  </span>
                </div>

                {/* Navigation Options */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <button
                    onClick={handleRestart}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs transition"
                  >
                    Play Again from Start
                  </button>

                  <Link
                    to="/create"
                    onClick={playClick}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-purple-900/40 transition"
                  >
                    Forge Another Story
                  </Link>
                </div>
              </div>
            ) : (
              /* Branching Choice Cards */
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  <h3 className="font-mono text-xs uppercase tracking-widest text-purple-300 font-semibold">
                    The Crossroads of Destiny — Choose Your Path:
                  </h3>
                </div>

                <div className="grid gap-3">
                  {options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(option.node_id)}
                      className="w-full p-4 sm:p-5 rounded-2xl bg-purple-950/20 hover:bg-purple-900/40 border border-purple-800/30 hover:border-purple-500/60 text-left text-xs sm:text-sm font-medium text-purple-200 hover:text-white transition duration-200 group flex items-start gap-4 shadow-lg hover:shadow-purple-950/40"
                    >
                      <span className="w-7 h-7 rounded-xl bg-purple-900/60 border border-purple-700/50 flex items-center justify-center font-mono font-bold text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5 leading-relaxed">
                        {option.text}
                      </span>
                      <ChevronRight className="w-4 h-4 ml-auto text-purple-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}

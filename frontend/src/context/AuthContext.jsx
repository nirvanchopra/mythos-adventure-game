import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../util.js';

const AuthContext = createContext();

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80', // Mage
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', // Rogue
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', // Paladin
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', // Archer
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80', // Cyber-Runner
];

export const INITIAL_ACHIEVEMENTS = [
  { id: 'first_adventure', title: 'First Adventure', description: 'Begin your very first interactive story.', icon: 'Compass', xp: 50, coins: 25, unlocked: true },
  { id: 'mystery_solver', title: 'Mystery Solver', description: 'Reach a winning ending in a Mystery adventure.', icon: 'Search', xp: 150, coins: 75, unlocked: false },
  { id: 'master_of_choices', title: 'Master of Choices', description: 'Make 25 impactful decisions across any story.', icon: 'GitFork', xp: 200, coins: 100, unlocked: false },
  { id: '10_stories', title: 'Story Hoarder', description: 'Complete 10 different stories in your career.', icon: 'BookOpen', xp: 500, coins: 250, unlocked: false },
  { id: 'hidden_ending', title: 'Ending Hunter', description: 'Discover an elusive hidden ending path.', icon: 'Eye', xp: 300, coins: 150, unlocked: false },
  { id: 'multiplayer_champion', title: 'Multiplayer Champion', description: 'Win a competitive multiplayer adventure session.', icon: 'Trophy', xp: 400, coins: 200, unlocked: false },
  { id: 'legendary_explorer', title: 'Legendary Explorer', description: 'Reach Level 10 and conquer 5 different genres.', icon: 'Crown', xp: 1000, coins: 500, unlocked: false },
];

export const INITIAL_QUESTS = [
  { id: 'daily_explore', title: 'Daily Chronicler', description: 'Play at least 1 story node today', progress: 1, total: 1, rewardXp: 40, rewardCoins: 20, completed: true, claimed: false },
  { id: 'genre_dive', title: 'Sci-Fi Pioneer', description: 'Complete an adventure in the Sci-Fi genre', progress: 0, total: 1, rewardXp: 100, rewardCoins: 50, completed: false, claimed: false },
  { id: 'decision_maker', title: 'Crossroads Wanderer', description: 'Make 5 decisions in branching stories', progress: 3, total: 5, rewardXp: 80, rewardCoins: 35, completed: false, claimed: false },
];

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('mythos_token'));
  
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mythos_player');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    // Default initial guest profile
    return {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      isGuest: true,
      username: 'ShadowStrider',
      email: 'guest@mythos.com',
      avatar: DEFAULT_AVATARS[0],
      title: 'Novice Wanderer',
      level: 1,
      xp: 45,
      xpToNextLevel: 100,
      coins: 150,
      storiesCompleted: 1,
      multiplayerWins: 0,
      favoriteGenre: 'Fantasy',
      achievements: INITIAL_ACHIEVEMENTS,
      inventory: [
        { id: 'scroll_revival', name: 'Scroll of Second Chance', type: 'item', icon: 'Scroll', description: 'Rewinds one deadly choice in any adventure.' },
        { id: 'theme_cyberpunk', name: 'Neon Cyberpunk Theme', type: 'theme', icon: 'Palette', description: 'Dark futuristic UI theme overlay.' }
      ],
      quests: INITIAL_QUESTS,
      history: []
    };
  });

  // Keep Authorization header synchronized with token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('mythos_token', token);
      // Fetch fresh authenticated profile from backend
      axios.get(`${API_BASE_URL}/auth/me`, { withCredentials: true })
        .then(res => {
          if (res.data) {
            const u = res.data;
            const p = u.profile || {};
            setUser(prev => ({
              ...prev,
              id: u.id,
              isGuest: false,
              username: u.username,
              email: u.email,
              avatar: p.avatar_url || prev.avatar,
              title: p.title || prev.title,
              level: p.level || 1,
              xp: p.xp || 0,
              xpToNextLevel: Math.pow(p.level || 1, 2) * 50,
              coins: p.coins !== undefined ? p.coins : prev.coins,
              storiesCompleted: p.stories_completed || 0,
              multiplayerWins: p.multiplayer_wins || 0,
              favoriteGenre: p.favorite_genre || 'Fantasy',
              inventory: (p.inventory && p.inventory.length > 0) ? p.inventory : prev.inventory,
              achievements: prev.achievements
            }));
          }
        })
        .catch(() => {
          // Token expired or invalid
        });
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('mythos_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('mythos_player', JSON.stringify(user));
    }
  }, [user]);

  // Recalculate level on XP change
  const calculateLevel = (currentXp) => {
    const lvl = Math.floor(Math.sqrt(Math.max(0, currentXp) / 50)) + 1;
    const nextLvlXp = Math.pow(lvl, 2) * 50;
    return { level: lvl, xpToNext: nextLvlXp };
  };

  const getRankTitle = (lvl) => {
    if (lvl >= 10) return 'Legendary Storyteller';
    if (lvl >= 7) return 'Master Explorer';
    if (lvl >= 4) return 'Story Seeker';
    if (lvl >= 2) return 'Adventurer';
    return 'Novice Wanderer';
  };

  const addXp = (amount) => {
    setUser(prev => {
      const newXp = (prev.xp || 0) + amount;
      const { level, xpToNext } = calculateLevel(newXp);
      const title = getRankTitle(level);
      return {
        ...prev,
        xp: newXp,
        level,
        xpToNextLevel: xpToNext,
        title
      };
    });
  };

  const addCoins = (amount) => {
    setUser(prev => ({
      ...prev,
      coins: Math.max(0, (prev.coins || 0) + amount)
    }));
  };

  const spendCoins = (amount) => {
    if ((user.coins || 0) < amount) return false;
    setUser(prev => ({
      ...prev,
      coins: prev.coins - amount
    }));
    return true;
  };

  const unlockAchievement = (achId) => {
    setUser(prev => {
      let rewardedXp = 0;
      let rewardedCoins = 0;
      const updated = prev.achievements.map(ach => {
        if (ach.id === achId && !ach.unlocked) {
          rewardedXp = ach.xp;
          rewardedCoins = ach.coins;
          return { ...ach, unlocked: true };
        }
        return ach;
      });
      if (rewardedXp > 0 || rewardedCoins > 0) {
        const newXp = prev.xp + rewardedXp;
        const { level, xpToNext } = calculateLevel(newXp);
        return {
          ...prev,
          achievements: updated,
          xp: newXp,
          level,
          xpToNextLevel: xpToNext,
          coins: prev.coins + rewardedCoins
        };
      }
      return prev;
    });
  };

  const recordStoryCompletion = (storyData, outcome = 'win') => {
    setUser(prev => {
      const historyEntry = {
        id: storyData.id,
        title: storyData.title,
        genre: storyData.genre || 'Fantasy',
        outcome,
        completedAt: new Date().toISOString()
      };
      const newHistory = [historyEntry, ...(prev.history || [])];
      const newXp = prev.xp + (outcome === 'win' ? 120 : 60);
      const newCoins = prev.coins + (outcome === 'win' ? 50 : 20);
      const { level, xpToNext } = calculateLevel(newXp);

      return {
        ...prev,
        storiesCompleted: (prev.storiesCompleted || 0) + 1,
        xp: newXp,
        level,
        xpToNextLevel: xpToNext,
        coins: newCoins,
        history: newHistory
      };
    });
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password }, { withCredentials: true });
      if (response.data && response.data.token) {
        const { token: jwtToken, user: authUser } = response.data;
        setToken(jwtToken);
        const p = authUser.profile || {};
        setUser(prev => ({
          ...prev,
          id: authUser.id,
          isGuest: false,
          username: authUser.username,
          email: authUser.email,
          avatar: p.avatar_url || prev.avatar,
          title: p.title || 'Novice Wanderer',
          level: p.level || 1,
          xp: p.xp || 0,
          xpToNextLevel: Math.pow(p.level || 1, 2) * 50,
          coins: p.coins !== undefined ? p.coins : 200,
          storiesCompleted: p.stories_completed || 0,
          multiplayerWins: p.multiplayer_wins || 0,
          favoriteGenre: p.favorite_genre || 'Fantasy',
          inventory: (p.inventory && p.inventory.length > 0) ? p.inventory : prev.inventory
        }));
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Login failed';
      throw new Error(msg);
    }
  };

  const register = async (username, email, password, avatar) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        username,
        email,
        password,
        avatar_url: avatar
      }, { withCredentials: true });

      if (response.data && response.data.token) {
        const { token: jwtToken, user: authUser } = response.data;
        setToken(jwtToken);
        const p = authUser.profile || {};
        setUser(prev => ({
          ...prev,
          id: authUser.id,
          isGuest: false,
          username: authUser.username,
          email: authUser.email,
          avatar: p.avatar_url || avatar || DEFAULT_AVATARS[0],
          title: p.title || 'Novice Wanderer',
          level: p.level || 1,
          xp: p.xp || 100,
          xpToNextLevel: 150,
          coins: p.coins !== undefined ? p.coins : 200,
          storiesCompleted: 0,
          multiplayerWins: 0,
          favoriteGenre: 'Fantasy',
          inventory: p.inventory || [],
          achievements: INITIAL_ACHIEVEMENTS,
          quests: INITIAL_QUESTS,
          history: []
        }));
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Registration failed';
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true }).catch(() => null);
    } catch {
      // Ignore
    }
    setToken(null);
    setUser({
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      isGuest: true,
      username: 'ShadowStrider',
      email: 'guest@mythos.com',
      avatar: DEFAULT_AVATARS[0],
      title: 'Novice Wanderer',
      level: 1,
      xp: 20,
      xpToNextLevel: 100,
      coins: 100,
      storiesCompleted: 0,
      multiplayerWins: 0,
      favoriteGenre: 'Fantasy',
      achievements: INITIAL_ACHIEVEMENTS,
      inventory: [],
      quests: INITIAL_QUESTS,
      history: []
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      addXp,
      addCoins,
      spendCoins,
      unlockAchievement,
      recordStoryCompletion,
      DEFAULT_AVATARS
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SoundProvider } from './context/SoundContext';
import GamingLayout from './components/layout/GamingLayout';

// 14 Gaming Platform Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ExplorePage from './pages/ExplorePage';
import GeneratorPage from './pages/GeneratorPage';
import StoryGamePage from './pages/StoryGamePage';
import ProfilePage from './pages/ProfilePage';
import AchievementsPage from './pages/AchievementsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import MultiplayerLobbyPage from './pages/MultiplayerLobbyPage';
import GameRoomPage from './pages/GameRoomPage';
import StorePage from './pages/StorePage';
import QuestsPage from './pages/QuestsPage';
import HistoryPage from './pages/HistoryPage';

import './App.css';

export default function App() {
  return (
    <Router>
      <SoundProvider>
        <AuthProvider>
          <GamingLayout>
            <Routes>
              {/* 1. Landing Page with Hero Section */}
              <Route path="/" element={<LandingPage />} />

              {/* 2. Player Registration & Login */}
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage />} />

              {/* 3. Player Dashboard */}
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* 4. Story Discovery & Exploration */}
              <Route path="/explore" element={<ExplorePage />} />

              {/* 5. AI Story Generator */}
              <Route path="/create" element={<GeneratorPage />} />

              {/* 6. Story Gameplay Interface */}
              <Route path="/story/:id" element={<StoryGamePage />} />

              {/* 7. Player Profile & Statistics */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />

              {/* 8. Achievements & Rewards Gallery */}
              <Route path="/achievements" element={<AchievementsPage />} />

              {/* 9. Global Leaderboard */}
              <Route path="/leaderboard" element={<LeaderboardPage />} />

              {/* 10. Multiplayer Lobby */}
              <Route path="/multiplayer" element={<MultiplayerLobbyPage />} />

              {/* 11. Game Rooms & Invitations */}
              <Route path="/room/:code" element={<GameRoomPage />} />

              {/* 12. Inventory & Rewards Store */}
              <Route path="/store" element={<StorePage />} />

              {/* 13. Daily Challenges & Quests */}
              <Route path="/quests" element={<QuestsPage />} />

              {/* 14. Game History & Saved Adventures */}
              <Route path="/history" element={<HistoryPage />} />

              {/* Fallback to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </GamingLayout>
        </AuthProvider>
      </SoundProvider>
    </Router>
  );
}

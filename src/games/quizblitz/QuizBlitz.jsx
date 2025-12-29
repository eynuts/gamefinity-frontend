// src/games/quizblitz/QuizBlitz.jsx
import React, { useMemo } from "react";
import "./QuizBlitz.css";
import quizblitzLogo from "../../assets/quizblitz/logo.png";

import soloIcon from "../../assets/quizblitz/solo.png";
import friendsIcon from "../../assets/quizblitz/friends.png";
import onlineIcon from "../../assets/quizblitz/online.png";
import leaderboardIcon from "../../assets/quizblitz/leaderboard.png";
import helpIcon from "../../assets/quizblitz/help.png";
import settingsIcon from "../../assets/quizblitz/settings.png";
import exitIcon from "../../assets/quizblitz/exit.png";

/* ============================
   ICON-ONLY NAV COMPONENT
============================= */
const NavIconOnly = ({ icon, onClick }) => (
  <div className="nav-icon-container" onClick={onClick}>
    <span className="nav-icon">{icon}</span>
  </div>
);

/* ============================
   QUIZBLITZ MENU SCREEN
============================= */
export default function QuizBlitz({ user, onBack, onPlaySolo, onChallengeFriends }) {
  const playerName = user?.displayName || "Player";

  // XP source: MongoDB or fallback to localStorage
  const playerXP = user?.xp ?? Number(localStorage.getItem("quizblitz_xp")) ?? 0;

  // Level system
  const XP_PER_LEVEL = 100;
  const playerLevel = useMemo(() => Math.floor(playerXP / XP_PER_LEVEL) + 1, [playerXP]);

  return (
    <div className="quizblitz-screen">
      {/* ================= HEADER ================= */}
      <header className="game-header">
        <img src={quizblitzLogo} alt="Quiz Blitz Logo" className="quizblitz-logo" />
        <h2 className="game-tagline">Race. Learn. Conquer.</h2>
      </header>

      {/* ================= MAIN OPTIONS ================= */}
      <main className="main-options-container">
        {/* PLAY SOLO */}
        <button className="option-button play-solo" onClick={onPlaySolo}>
          <span className="icon">
            <img src={soloIcon} alt="Play Solo Icon" />
          </span>
          <span className="text">PLAY SOLO</span>
        </button>

        {/* CHALLENGE FRIENDS */}
        <button className="option-button challenge-friends" onClick={onChallengeFriends}>
          <span className="icon">
            <img src={friendsIcon} alt="Challenge Friends Icon" />
          </span>
          <span className="text">CHALLENGE FRIENDS</span>
        </button>

      </main>

      {/* ================= FOOTER ================= */}
      <footer className="quizblitz-footer">
        {/* PLAYER PROFILE */}
        <div className="player-profile">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={playerName} className="profile-logo-img" />
          ) : (
            <div className="profile-logo">{playerName.charAt(0)}</div>
          )}

          <span className="player-name">{playerName}</span>

          
        </div>

        {/* SECONDARY NAV */}
        <div className="secondary-nav">
          <NavIconOnly icon={<img src={exitIcon} alt="Exit" />} onClick={onBack} />
        </div>
      </footer>
    </div>
  );
}

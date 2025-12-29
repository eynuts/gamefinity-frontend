// src/games/quizblitz/Friends.jsx
import React, { useState } from "react";
import "./Friends.css";
import friendsIcon from "../../assets/quizblitz/friends.png";
import quizblitzLogo from "../../assets/quizblitz/logo.png";

export default function Friends({ user, onBack, onCreateGame, onJoinGame }) {
  const playerName = user?.displayName || "Player";

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [lobbyCode, setLobbyCode] = useState("");

  const handleJoin = () => {
    if (!lobbyCode.trim()) return;
    onJoinGame(lobbyCode.trim());
    setLobbyCode("");
    setShowJoinModal(false);
  };

  return (
    <div className="quizblitz-screen">
      <header className="game-header">
        <img src={quizblitzLogo} alt="Quiz Blitz" className="quizblitz-logo" />
        <p className="game-tagline">CHALLENGE YOUR FRIENDS</p>
      </header>

      <main className="main-options-container">
        <div className="friends-glass-card">
          <div className="friends-header-inner">
            <div className="friends-icon-wrapper">
              <img src={friendsIcon} alt="Friends" className="friends-icon-img" />
            </div>
            <h2>Multiplayer</h2>
          </div>

          <div className="friends-actions">
            <button
              className="friends-option-button create-game"
              onClick={onCreateGame}
            >
              <span className="button-text">Create Game</span>
            </button>

            <button
              className="friends-option-button join-game"
              onClick={() => setShowJoinModal(true)}
            >
              <span className="button-text">Join Game</span>
            </button>
          </div>
        </div>
      </main>

      {/* 🔥 JOIN LOBBY MODAL */}
      {showJoinModal && (
        <div className="join-modal-overlay">
          <div className="join-modal">
            <h3>Join Lobby</h3>
            <p>Enter the lobby code</p>

            <input
              type="text"
              value={lobbyCode}
              onChange={(e) => setLobbyCode(e.target.value)}
              placeholder="e.g. AB123"
              maxLength={6}
              autoFocus
            />

            <div className="join-modal-actions">
              <button
                className="modal-cancel"
                onClick={() => {
                  setShowJoinModal(false);
                  setLobbyCode("");
                }}
              >
                Cancel
              </button>

              <button className="modal-join" onClick={handleJoin}>
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="game-footer">
        <div className="player-profile">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="P" className="profile-logo-img" />
          ) : (
            <span className="profile-initial">
              {playerName.charAt(0)}
            </span>
          )}
          <span className="player-name">{playerName}</span>
        </div>

        <div className="secondary-nav">
          <button className="friends-back-btn" onClick={onBack}>
            Back to Menu
          </button>
        </div>
      </footer>
    </div>
  );
}

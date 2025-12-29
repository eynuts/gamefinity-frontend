// src/games/itapp/Settlement.jsx
import React from "react";
import "./Settlement.css";
import NebulaBackground from "../../assets/itapp/bg.png";

export default function Settlement({ lobby, userData, leaderboard, onPlayAgain, onHome }) {
  const isHost = userData?.uid === lobby?.hostId;

  // ---------------- FALLBACK ----------------
  if (!lobby || !userData || !leaderboard) {
    return (
      <div
        className="settlement-page-container"
        style={{ backgroundImage: `url(${NebulaBackground})` }}
      >
        <div className="settlement-status-card">
          <h2 className="settlement-blue">SESSION EXPIRED</h2>
          <p>The connection to the game server was lost or the session data is missing.</p>
          <button
            className="settlement-btn settlement-secondary-btn"
            onClick={onHome}
          >
            HOME
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="settlement-page-container"
      style={{ backgroundImage: `url(${NebulaBackground})` }}
    >
      <div className="settlement-circuit-left">LOG_TERMINATED_0x882</div>
      <div className="settlement-star-right">✦</div>

      <div className="settlement-main-content">
        <header className="settlement-header">
          <h1 className="settlement-title">
            SESSION <span className="settlement-blue">SETTLED</span>
          </h1>
          <p className="settlement-lobby-name">{lobby?.name?.toUpperCase() || "GAME SESSION"}</p>
        </header>

        {/* Podium for top 3 */}
        <div className="settlement-podium">
          {[1, 0, 2].map((i, idx) => {
            const player = leaderboard[i];
            if (!player) return null;
            const medals = ["🥈", "🥇", "🥉"];
            return (
              <div key={i} className={`settlement-podium-slot rank-${i + 1}`}>
                <div className="settlement-podium-avatar">{medals[idx]}</div>
                <div className="settlement-podium-name">{player.username}</div>
                <div className="settlement-podium-score">{player.score} <span className="pts-label">PTS</span></div>
                <div className="settlement-podium-bar"></div>
              </div>
            );
          })}
        </div>

        {/* Full Leaderboard */}
        <div className="settlement-glass-panel">
          <h3 className="settlement-section-title">FINAL DATA UPLINK</h3>
          <div className="settlement-rank-list">
            {leaderboard.map((player, index) => (
              <div
                key={player.userId || index}
                className={`settlement-rank-row ${player.userId === userData?.uid ? "is-me" : ""}`}
              >
                <div className="settlement-rank-info">
                  <span className="settlement-num">#{index + 1}</span>
                  <span className="settlement-name">{player.username}</span>
                </div>
                <span className="settlement-score">{player.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="settlement-actions">
          {isHost && (
            <button className="settlement-btn settlement-primary-btn" onClick={onPlayAgain}>
              RE-INITIALIZE
            </button>
          )}

          <button
            className="settlement-btn settlement-secondary-btn"
            onClick={onHome}
          >
            HOME
          </button>
        </div>
      </div>
    </div>
  );
}

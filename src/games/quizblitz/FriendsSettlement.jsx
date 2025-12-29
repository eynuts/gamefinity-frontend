import React from "react";
import "./FriendsSettlement.css";

export default function FriendsSettlement({ players, onExit, onPlayAgain, isHost }) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const topScore = sortedPlayers[0]?.score;

  return (
    <div className="friendsgame-settlement">
      <h1>🏆 Game Over!</h1>
      <h2>Final Scores</h2>

      <div className="friendsgame-ranking">
        {sortedPlayers.map((p, idx) => (
          <div
            key={p.id}
            className={`player-rank ${p.score === topScore ? "winner" : ""}`}
          >
            <span className="rank">{idx + 1}</span>
            <span className="name">{p.displayName}</span>
            <span className="score">{p.score}</span>
          </div>
        ))}
      </div>

      <div className="settlement-buttons">
        {isHost && onPlayAgain && (
          <button className="play-again-btn" onClick={onPlayAgain}>
            Play Again
          </button>
        )}
        <button className="exit-btn" onClick={onExit}>
          Exit to Menu
        </button>
      </div>
    </div>
  );
}

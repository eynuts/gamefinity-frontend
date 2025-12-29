// src/games/itapp/Lobby.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import NebulaBackground from "../../assets/itapp/bg.png";
import "./Lobby.css";
import Game from "./Game";
import Settlement from "./Settlement";

export default function Lobby({ onBack, mode = "create", userData, socket, onExitToHome, onFinish }) {
  const [lobby, setLobby] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinishedLeaderboard, setGameFinishedLeaderboard] = useState(null);
  const [hostChoice, setHostChoice] = useState(null);

  const [categoriesState, setCategoriesState] = useState([
    { name: "Riddles", selected: true },
    { name: "Motivational Trivia", selected: true },
    { name: "Inspirational Challenges", selected: true },
    { name: "History Hacker", selected: true },
    { name: "Science Surges", selected: true },
  ]);

  const isHost = lobby && socket && lobby.hostId === socket.id;
  const playerReady = lobby?.players?.find(p => p.id === socket.id)?.ready;

  /* -------------------------------
     SOCKET EVENTS
  ------------------------------- */
  useEffect(() => {
    if (!socket || !userData) return;

    const handleJoinedLobby = (l) => setLobby(l);
    const handleLobbyUpdated = (l) => setLobby(l);
    const handleGameStarted = (serverLobby) => {
      setLobby(serverLobby);
      setGameStarted(true);
    };
    const handleGameFinished = (leaderboard) => setGameFinishedLeaderboard(leaderboard);
    const handleCategoriesUpdated = (updatedCategories) => {
      setCategoriesState(updatedCategories || []);
      setLobby(prev => prev ? { ...prev, categories: updatedCategories || [] } : prev);
    };
    const handleHostChoice = (choice) => setHostChoice(choice);

    socket.on("joinedLobby", handleJoinedLobby);
    socket.on("lobbyUpdated", handleLobbyUpdated);
    socket.on("gameStarted", handleGameStarted);
    socket.on("gameFinished", handleGameFinished);
    socket.on("categoriesUpdated", handleCategoriesUpdated);
    socket.on("hostChoice", handleHostChoice);

    // CREATE / JOIN LOBBY
    if (mode === "create") {
      socket.emit("createLobby", { username: userData.username });
    }

    if (mode === "join") {
      socket.emit("requestLobbies");
      socket.once("lobbyList", (lobbies) => {
        const available = lobbies.find(l => l.players.length < 8);
        if (available) {
          socket.emit("joinLobby", { lobbyId: available.id, username: userData.username });
        }
      });
    }

    return () => {
      socket.off("joinedLobby", handleJoinedLobby);
      socket.off("lobbyUpdated", handleLobbyUpdated);
      socket.off("gameStarted", handleGameStarted);
      socket.off("gameFinished", handleGameFinished);
      socket.off("categoriesUpdated", handleCategoriesUpdated);
      socket.off("hostChoice", handleHostChoice);
    };
  }, [socket, userData, mode]);

  /* -------------------------------
     CATEGORY TOGGLE (HOST ONLY)
  ------------------------------- */
  const toggleCategory = (index) => {
    if (!isHost || !lobby) return;

    const updated = categoriesState.map((c, i) =>
      i === index ? { ...c, selected: !c.selected } : c
    );
    setCategoriesState(updated);

    socket.emit("updateCategories", {
      lobbyId: lobby.id,
      categories: updated.filter(c => c.selected).map(c => c.name),
    });
  };

  /* -------------------------------
     READY / START GAME
  ------------------------------- */
  const toggleReady = () => {
    if (!lobby || isHost) return;
    socket.emit("toggleReady", lobby.id);
  };

  const canStartGame = () => {
    if (!lobby || !lobby.players || lobby.players.length < 2) return false;
    return lobby.players
      .filter(p => p.id !== lobby.hostId)
      .every(p => p.ready === true);
  };

  const startGame = () => {
    const selected = categoriesState.filter(c => c.selected);
    if (!selected.length) return alert("Select at least one category!");
    socket.emit("startGame", { lobbyId: lobby.id, categories: selected.map(c => c.name) });
  };

  /* -------------------------------
     GAME / SETTLEMENT FLOW
  ------------------------------- */
  if (gameFinishedLeaderboard) {
    return (
      <Settlement
        lobby={lobby}
        userData={userData}
        leaderboard={gameFinishedLeaderboard}
        socket={socket}
        onPlayAgain={() => {
          setGameFinishedLeaderboard(null);
          setGameStarted(false);
          if (onFinish) onFinish(null, null); // reset to Lobby
        }}
        onHome={() => {
          setGameFinishedLeaderboard(null);
          setGameStarted(false);
          setHostChoice(null);
          if (onExitToHome) onExitToHome(); // go back to ItApp
        }}
      />
    );
  }

  if (gameStarted && lobby) {
    return (
      <Game
        lobby={lobby}
        userData={userData}
        socket={socket}
        onFinish={(finalLeaderboard) => setGameFinishedLeaderboard(finalLeaderboard)}
      />
    );
  }

  /* -------------------------------
     UI
  ------------------------------- */
  return (
    <div className="lobby-page-container">
      <div className="lobby-background" style={{ backgroundImage: `url(${NebulaBackground})` }}>
        <header className="lobby-header">
          <div className="lobby-logo-area">
            <div className="lobby-logo-text"><span className="lobby-blue">iT</span>-APP</div>
            <div className="lobby-subtitle">Interactive Trivia & Playful Platform</div>
          </div>

          <motion.button
            className="lobby-back-btn"
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back
          </motion.button>
        </header>

        <div className="lobby-main-content">
          <div className="lobby-player-grid-container">
            <div className="lobby-player-grid">
              {Array(8).fill(0).map((_, i) => {
                const player = lobby?.players?.[i];
                return (
                  <div key={i} className="lobby-player-slot">
                    {player ? (
                      <>
                        <div>👤</div>
                        <div>{player.username}</div>
                        <div>{player.id === lobby.hostId ? "HOST" : player.ready ? "Ready" : "Not Ready"}</div>
                      </>
                    ) : (
                      <div className="empty-text">JOIN SLOT</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="lobby-grid-center">
              {isHost ? (
                <motion.button
                  className="lobby-start-game-btn"
                  onClick={startGame}
                  disabled={!canStartGame()}
                >
                  START GAME
                </motion.button>
              ) : (
                <motion.button
                  className={`lobby-start-game-btn ${playerReady ? "ready" : ""}`}
                  onClick={toggleReady}
                >
                  {playerReady ? "READY" : "NOT READY"}
                </motion.button>
              )}
            </div>
          </div>

          <div className="lobby-sidebar">
            <div className="lobby-section-title">CATEGORY SELECTION</div>
            <ul>
              {categoriesState.map((c, i) => (
                <li
                  key={i}
                  onClick={() => toggleCategory(i)}
                  style={{ cursor: isHost ? "pointer" : "default" }}
                >
                  {c.selected ? "✅" : "⬜"} {c.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// src/games/itapp/Lobby.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
        } else {
            // Handle no lobby found if needed, or maybe create one fallback
            // For now, let's just wait or maybe alert
             alert("No available lobbies found. Please try creating one.");
             onBack();
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
  if (!lobby) {
    return (
        <div className="lobby-page-container">
            <div className="lobby-background" style={{ backgroundImage: `url(${NebulaBackground})` }}>
                 <div className="lobby-loading">
                    <div className="spinner"></div>
                    <div className="loading-text">Connecting to Lobby...</div>
                 </div>
            </div>
        </div>
    );
  }

  return (
    <div className="lobby-page-container">
      <div className="lobby-background" style={{ backgroundImage: `url(${NebulaBackground})` }}>
        <header className="lobby-header">
          <div className="lobby-logo-area">
            <div className="lobby-logo-text"><span className="lobby-blue">iT</span>-APP</div>
            <div className="lobby-subtitle">Interactive Trivia & Playful Platform</div>
          </div>
          
          <div className="lobby-room-info">
             <div className="lobby-room-code">ROOM: {lobby.id.slice(0, 6).toUpperCase()}</div>
             <div className="lobby-player-count">PLAYERS: {lobby.players.length}/8</div>
          </div>

          <motion.button
            className="lobby-back-btn"
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Exit
          </motion.button>
        </header>

        <div className="lobby-main-content">
          <div className="lobby-player-grid-container">
            <div className="lobby-player-grid">
              {Array(8).fill(0).map((_, i) => {
                const player = lobby?.players?.[i];
                return (
                  <motion.div 
                    key={i} 
                    className={`lobby-player-slot ${player ? 'occupied' : 'empty'} ${player?.id === lobby.hostId ? 'host-slot' : ''}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {player ? (
                      <>
                        <div className="lobby-slot-avatar">
                             {/* Placeholder avatar or initial */}
                             {player.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="lobby-slot-info">
                            <div className="lobby-slot-name">{player.username}</div>
                            <div className={`lobby-slot-status ${player.id === lobby.hostId ? "status-host" : player.ready ? "status-ready" : "status-waiting"}`}>
                                {player.id === lobby.hostId ? "HOST" : player.ready ? "READY" : "WAITING"}
                            </div>
                        </div>
                      </>
                    ) : (
                      <div className="empty-text">OPEN SLOT</div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="lobby-grid-center">
              {isHost ? (
                <motion.button
                  className="lobby-start-game-btn"
                  onClick={startGame}
                  disabled={!canStartGame()}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  START GAME
                </motion.button>
              ) : (
                <motion.button
                  className={`lobby-start-game-btn ${playerReady ? "ready" : ""}`}
                  onClick={toggleReady}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {playerReady ? "READY!" : "CLICK TO READY"}
                </motion.button>
              )}
               {!isHost && !playerReady && <div className="lobby-waiting-text">Waiting for you to be ready...</div>}
               {!isHost && playerReady && <div className="lobby-waiting-text">Waiting for host to start...</div>}
               {isHost && !canStartGame() && <div className="lobby-waiting-text">Waiting for players...</div>}
            </div>
          </div>

          <div className="lobby-sidebar">
            <div className="lobby-section-title">GAME CATEGORIES</div>
            <ul className="lobby-category-list">
              {categoriesState.map((c, i) => (
                <motion.li
                  key={i}
                  className={`lobby-category-item ${c.selected ? 'selected' : ''}`}
                  onClick={() => toggleCategory(i)}
                  style={{ cursor: isHost ? "pointer" : "default" }}
                  whileHover={isHost ? { x: 5, backgroundColor: "rgba(255,255,255,0.1)" } : {}}
                >
                  <div className={`checkbox-indicator ${c.selected ? 'checked' : ''}`}></div>
                  <span className="category-name">{c.name}</span>
                </motion.li>
              ))}
            </ul>
             <div className="lobby-sidebar-footer">
                <div className="lobby-tip">
                    <strong>Tip:</strong> {isHost ? "Select categories to include in the game." : "Host chooses the categories."}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

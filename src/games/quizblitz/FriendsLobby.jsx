// src/games/quizblitz/FriendsLobby.jsx
import React, { useEffect, useState, useRef } from "react";
import "./FriendsLobby.css";
import { db } from "../../firebase";
import {
  ref,
  onValue,
  update,
  remove,
  onDisconnect,
} from "firebase/database";

// Icons
import triviaIcon from "../../assets/quizblitz/trivia.png";
import idiomsIcon from "../../assets/quizblitz/idioms.png";
import criticalIcon from "../../assets/quizblitz/critical.png";
import generalIcon from "../../assets/quizblitz/general.png";

export default function FriendsLobby({ user, lobbyCode, onBack, onStart }) {
  const [players, setPlayers] = useState({});
  const [category, setCategory] = useState(null);

  const wasHostRef = useRef(false);

  useEffect(() => {
    if (!lobbyCode || !user?.uid) return;

    const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
    const playerRef = ref(db, `lobbies/${lobbyCode}/players/${user.uid}`);

    // 🔥 Auto-remove THIS player on disconnect
    onDisconnect(playerRef).remove();

    const unsub = onValue(lobbyRef, async (snap) => {
      // 🚨 LOBBY DELETED → KICK EVERYONE
      if (!snap.exists()) {
        onBack();
        return;
      }

      const data = snap.val();
      const playersData = data.players || {};

      setPlayers(playersData);
      setCategory(data.category || null);

      // 🔥 Detect HOST LEAVE
      const hostId = Object.entries(playersData).find(
        ([_, p]) => p.isHost
      )?.[0];

      // If there is NO host anymore → lobby is dead
      if (!hostId) {
        await remove(lobbyRef); // 🔥 delete entire lobby
      }
    });

    return () => unsub();
  }, [lobbyCode, user?.uid, onBack]);

  /** 🔥 MANUAL EXIT */
  const exitLobby = async () => {
    if (!user?.uid) return;

    const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
    const playerRef = ref(db, `lobbies/${lobbyCode}/players/${user.uid}`);

    // If HOST leaves → delete lobby
    if (players[user.uid]?.isHost) {
      await remove(lobbyRef);
    } else {
      await remove(playerRef);
    }

    onBack();
  };

  const hostId = Object.entries(players).find(([_, p]) => p.isHost)?.[0];
  const playerCount = Object.keys(players).length;
  const isHost = hostId === user?.uid;

  const canStart = playerCount >= 2 && playerCount <= 5 && category;

  const categories = [
    { id: "Trivia", label: "TRIVIA", icon: triviaIcon },
    { id: "Idioms", label: "IDIOMS", icon: idiomsIcon },
    { id: "Critical Thinking", label: "CRITICAL THINKING", icon: criticalIcon },
    { id: "General Knowledge", label: "GENERAL KNOWLEDGE", icon: generalIcon },
  ];

  const selectCategory = async (catId) => {
    if (!isHost) return;
    await update(ref(db, `lobbies/${lobbyCode}`), { category: catId });
  };

  return (
    <div className="quizblitz-screen">
      <header className="game-header">
        <h2>Lobby: {lobbyCode}</h2>
        <p>
          {playerCount < 2
            ? "Waiting for players..."
            : playerCount === 5
            ? "Lobby full!"
            : "Waiting for host to start"}
        </p>
      </header>

      <main className="main-options-container">
        {/* PLAYERS */}
        <div className="friendslobby-players-card">
          <h3>Players ({playerCount}/5)</h3>
          <ul>
            {Object.entries(players).map(([id, p]) => (
              <li key={id}>
                {p.displayName}
                {id === hostId && " (Host)"}
              </li>
            ))}
          </ul>
        </div>

        {/* CATEGORY PICKER */}
        <div className="friendslobby-category-card">
          <h3>Category</h3>
          <div className="friendslobby-categories">
            {categories.map((cat) => (
              <button
                key={cat.id}
                disabled={!isHost}
                className={`friendslobby-category-btn ${
                  category === cat.id ? "active" : ""
                }`}
                onClick={() => selectCategory(cat.id)}
              >
                <img src={cat.icon} alt={cat.label} />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
          {!category && (
            <p className="friendslobby-hint">
              Host must select a category
            </p>
          )}
        </div>
      </main>

      <footer className="game-footer">
        <button className="friendslobby-back-btn" onClick={exitLobby}>
          Exit Lobby
        </button>

        {isHost && (
          <button
            className="friendslobby-start-btn"
            disabled={!canStart}
            onClick={() => onStart(lobbyCode)}
          >
            Start Game
          </button>
        )}
      </footer>
    </div>
  );
}

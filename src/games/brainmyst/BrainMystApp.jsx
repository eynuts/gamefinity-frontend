import React, { useState, useEffect } from "react";
import BrainMyst from "./BrainMyst";
import StartGame from "./StartGame";
import BrainGame from "./BrainGame";
import "./brainmyst.css";

import { ref, get, update } from "firebase/database";
import { db } from "../../firebase";

export default function BrainMystApp({ user, onExit }) {
  const [screen, setScreen] = useState("menu");
  // Possible screens: menu | startGame | game

  const [activeRoomId, setActiveRoomId] = useState(null);

  // ================= FIRST BRAIN MYST ENTRY TRACKER =================
  useEffect(() => {
    if (!user?.uid) return;

    const saveFirstBrainMystEntry = async () => {
      try {
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) return;

        const userData = snapshot.val();

        // Save ONLY ONCE
        if (!userData.firstBrainMystEntry) {
          await update(userRef, {
            firstBrainMystEntry: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Failed to save BrainMyst entry:", err);
      }
    };

    saveFirstBrainMystEntry();
  }, [user]);

  // ================= START FROM MENU =================
  const handleStartGame = () => setScreen("startGame");

  // ================= EXIT TO HOME =================
  const handleExitGame = () => onExit?.();

  return (
    <div>
      {/* ================= MENU ================= */}
      {screen === "menu" && (
        <BrainMyst
          onStartGame={handleStartGame}
          onExitGame={handleExitGame}
        />
      )}

      {/* ================= START GAME / MATCHMAKING ================= */}
      {screen === "startGame" && (
        <StartGame
          user={user}
          onBack={() => setScreen("menu")}
          onExit={handleExitGame}
          onGameStart={(roomId) => {
            setActiveRoomId(roomId);
            setScreen("game");
          }}
        />
      )}

      {/* ================= BRAIN GAME ================= */}
      {screen === "game" && activeRoomId && (
        <BrainGame
          user={user}
          roomId={activeRoomId}
          onExit={() => {
            setActiveRoomId(null);
            setScreen("menu");
          }}
        />
      )}
    </div>
  );
}

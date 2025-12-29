import React, { useState, useEffect } from "react";
import QuizBlitz from "./QuizBlitz";
import Solo from "./Solo";
import Friends from "./Friends";
import FriendsLobby from "./FriendsLobby";
import FriendsGame from "./FriendsGame";
import SoloFinish from "./SoloFinish";

import { db } from "../../firebase";
import { ref, set, update, get, onValue } from "firebase/database";

// ✅ SAME QUESTION BANK AS SOLO
import { questionBank, shuffleQuestionChoices } from "./questions";

export default function QuizBlitzApp({ user, onExit }) {
  const [screen, setScreen] = useState("menu");
  const [lobbyCode, setLobbyCode] = useState(null);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [lobbyData, setLobbyData] = useState(null);
  const [soloScore, setSoloScore] = useState(0);

  // ---------------- HANDLE BACK TO MENU SCREEN ----------------
  const handleBackToMenuScreen = () => {
    setScreen("menu");
    setLobbyCode(null);
    setLobbyPlayers([]);
    setLobbyData(null);
  };

  // ---------------- HANDLE EXIT QUIZBLITZ ----------------
  const handleExitQuizBlitz = () => {
    if (onExit) onExit(); // Go back to Home.jsx
  };

  // ================= SAVE FIRST QUIZBLITZ ENTRY =================
  useEffect(() => {
    if (!user?.uid) return;

    const saveFirstQuizBlitzEntry = async () => {
      try {
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) return;

        const userData = snapshot.val();

        // Save only once
        if (!userData.firstQuizBlitzEntry) {
          await update(userRef, {
            firstQuizBlitzEntry: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Failed to save QuizBlitz entry:", err);
      }
    };

    saveFirstQuizBlitzEntry();
  }, [user]);

  // ================= CREATE GAME =================
  const handleCreateGame = async () => {
    const code = Math.floor(1000 + Math.random() * 9000);

    await set(ref(db, `lobbies/${code}`), {
      hostId: user.uid,
      category: null,
      gameStarted: false,
      currentQuestionIndex: 0,
      questions: [],
      players: {
        [user.uid]: {
          displayName: user.displayName,
          score: 0,
          isHost: true,
        },
      },
    });

    setLobbyCode(code);
    setScreen("friendsLobby");
  };

  // ================= JOIN GAME =================
  const handleJoinGame = async (code) => {
    if (!code) return alert("Please enter a lobby code.");

    const lobbyRef = ref(db, `lobbies/${code}`);
    const snapshot = await get(lobbyRef);

    if (!snapshot.exists()) return alert("Lobby not found!");

    const players = snapshot.val().players || {};
    if (Object.keys(players).length >= 5) return alert("Lobby is full!");

    await update(ref(db, `lobbies/${code}/players/${user.uid}`), {
      displayName: user.displayName,
      score: 0,
      isHost: false,
    });

    setLobbyCode(code);
    setScreen("friendsLobby");
  };

  // ================= START GAME (HOST) =================
  const handleStartGame = async (code) => {
    const lobbyRef = ref(db, `lobbies/${code}`);
    const snapshot = await get(lobbyRef);

    if (!snapshot.exists()) return;

    const { category } = snapshot.val();
    if (!category) {
      alert("Please select a category first.");
      return;
    }

    const shuffled = [...questionBank[category]]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    const finalQuestions = shuffleQuestionChoices(shuffled);

    await update(lobbyRef, {
      questions: finalQuestions,
      currentQuestionIndex: 0,
      gameStarted: true,
    });

    setScreen("friendsGame");
  };

  // ================= LISTEN TO LOBBY =================
  useEffect(() => {
    if (!lobbyCode) return;

    const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
    const unsubscribe = onValue(lobbyRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.val();
      setLobbyData(data);

      const playersArray = Object.entries(data.players || {}).map(
        ([id, p]) => ({
          id,
          displayName: p.displayName,
          score: p.score,
          isHost: p.isHost,
        })
      );

      setLobbyPlayers(playersArray);

      if (data.gameStarted) setScreen("friendsGame");
    });

    return () => unsubscribe();
  }, [lobbyCode]);

  return (
    <>
      {/* MAIN MENU */}
      {screen === "menu" && (
        <QuizBlitz
          user={user}
          onBack={handleExitQuizBlitz}  // Exit button goes to Home.jsx
          onPlaySolo={() => setScreen("solo")}
          onChallengeFriends={() => setScreen("friends")}
        />
      )}

      {/* SOLO MODE */}
      {screen === "solo" && (
        <Solo
          user={user}
          onBack={handleBackToMenuScreen} // Back button in Solo goes to QuizBlitz menu
          onFinish={(score) => {
            setSoloScore(score);
            setScreen("soloFinish");
          }}
        />
      )}

      {/* SOLO FINISH SCREEN */}
      {screen === "soloFinish" && (
        <SoloFinish
          user={user}
          score={soloScore}
          onBackToCategories={() => setScreen("solo")} // back to Solo categories
          onBackToMenu={handleBackToMenuScreen}       // back to QuizBlitz menu
        />
      )}

      {/* FRIENDS MENU */}
      {screen === "friends" && (
        <Friends
          user={user}
          onBack={handleBackToMenuScreen}
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
        />
      )}

      {/* FRIENDS LOBBY */}
      {screen === "friendsLobby" && (
        <FriendsLobby
          user={user}
          lobbyCode={lobbyCode}
          onBack={handleBackToMenuScreen}
          onStart={handleStartGame}
        />
      )}

      {/* FRIENDS GAME */}
      {screen === "friendsGame" && (
        <FriendsGame
          user={user}
          lobbyCode={lobbyCode}
          lobby={lobbyData}
          players={lobbyPlayers}
          onExit={handleBackToMenuScreen} // back to QuizBlitz menu
        />
      )}
    </>
  );
}

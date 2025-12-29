// src/games/itapp/Game.jsx
import React, { useEffect, useState } from "react";
import "./Game.css";
import NebulaBackground from "../../assets/itapp/bg.png";

export default function Game({ lobby, userData, socket, onFinish }) {
  const [players, setPlayers] = useState(lobby?.players || []);
  const [step, setStep] = useState("waiting"); // "waiting" | "countdown" | "questions"
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerLocked, setAnswerLocked] = useState(false);
  const [timer, setTimer] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [countdown, setCountdown] = useState(10);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (!socket || !lobby) return;

    const uniqueBy = (arr, key) =>
      Array.from(new Map(arr.map(i => [i[key], i])).values());

    // ---------------- SOCKET HANDLERS ----------------
    const handleJoinedLobby = (updatedLobby) => {
      if (updatedLobby.id !== lobby.id) return;
      setPlayers(uniqueBy(updatedLobby.players, "id"));
    };

    const handleGameStarted = (serverLobby) => {
      if (serverLobby.id !== lobby.id) return;
      setPlayers(uniqueBy(serverLobby.players, "id"));
      setQuestions(serverLobby.game.questions || []);
      setCurrentIndex(0);
      setCountdown(10);
      setStep("countdown");
    };

    const handleStartQuestion = ({ index, time, questions }) => {
      if (questions?.length) setQuestions(questions);
      setCurrentIndex(index);
      setSelectedAnswer(null);
      setAnswerLocked(false);
      setTimer(time);
      setStep("questions");
    };

    const handleTimerTick = (time) => {
      setTimer(time);
      if (time <= 0) setAnswerLocked(true);
    };

    const handleLeaderboardUpdate = (data) => {
      setLeaderboard(uniqueBy(data, "userId"));
    };

    const handleGameFinished = (finalBoard) => {
      const cleanBoard = uniqueBy(finalBoard, "userId");
      if (onFinish) onFinish(cleanBoard);
    };

    socket.on("joinedLobby", handleJoinedLobby);
    socket.on("lobbyUpdated", handleJoinedLobby);
    socket.on("gameStarted", handleGameStarted);
    socket.on("startQuestion", handleStartQuestion);
    socket.on("timerTick", handleTimerTick);
    socket.on("leaderboardUpdate", handleLeaderboardUpdate);
    socket.on("gameFinished", handleGameFinished);

    return () => {
      socket.off("joinedLobby", handleJoinedLobby);
      socket.off("lobbyUpdated", handleJoinedLobby);
      socket.off("gameStarted", handleGameStarted);
      socket.off("startQuestion", handleStartQuestion);
      socket.off("timerTick", handleTimerTick);
      socket.off("leaderboardUpdate", handleLeaderboardUpdate);
      socket.off("gameFinished", handleGameFinished);
    };
  }, [socket, lobby, onFinish]);

  // ---------------- COUNTDOWN ----------------
  useEffect(() => {
    if (step !== "countdown") return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setStep("questions");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  // ---------------- HANDLE ANSWER ----------------
  const handleAnswer = (index) => {
    if (!currentQuestion || answerLocked) return;
    setSelectedAnswer(index);
    setAnswerLocked(true);
    socket.emit("submitAnswer", { lobbyId: lobby.id, answerIndex: index });
  };

  // ---------------- RENDER ----------------
  return (
    <div className="game-page-container">
      <div className="game-background" style={{ backgroundImage: `url(${NebulaBackground})` }}>
        
        {/* Header */}
        <header className="game-header">
          <div className="game-logo-area">
            <div className="game-logo-text">iT-<span className="game-blue">APP</span></div>
            <div className="game-subtitle">{lobby?.name?.toUpperCase() || "GAME SESSION"}</div>
          </div>

          {step === "questions" && (
            <div className="game-timer-container">
              <span className="game-timer-label">TIME REMAINING</span>
              <div className={`game-timer-value ${timer < 5 ? "timer-critical" : ""}`}>
                {timer}s
              </div>
            </div>
          )}
        </header>

        {/* Main Layout */}
        <main className="game-main-layout">

          {/* Left Sidebar */}
          <aside className="game-sidebar">
            <div className="game-glass-panel">
              <h4 className="game-section-title">LEADERBOARD</h4>
              <div className="game-rank-list">
                {leaderboard.length ? leaderboard.map((p, i) => (
                  <div key={p.userId} className={`game-rank-item ${p.userId === userData?.uid ? "is-user" : ""}`}>
                    <span className="rank-pos">#{i + 1}</span>
                    <span className="rank-nick">{p.username}</span>
                    <span className="rank-pts">{p.score}</span>
                  </div>
                )) : <div className="game-note">Awaiting scores...</div>}
              </div>
            </div>

            <div className="game-glass-panel">
              <h4 className="game-section-title">CONNECTED</h4>
              <div className="game-player-badges">
                {players.map(p => (
                  <div key={p.id} className="game-player-pill">
                    <span className="game-status-indicator"></span>
                    {p.username}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Center Stage */}
          <section className="game-stage">
            {step === "waiting" && (
              <div className="game-status-overlay">
                <div className="game-spinner"></div>
                <h2>ESTABLISHING UPLINK</h2>
                <p>Waiting for the host to initialize...</p>
              </div>
            )}

            {step === "countdown" && (
              <div className="game-status-overlay">
                <div className="game-countdown-circle">
                  <h1 className="game-countdown-number">{countdown}</h1>
                </div>
                <p className="game-neon-text">SYSTEMS READY</p>
              </div>
            )}

            {step === "questions" && currentQuestion && (
              <div className="game-question-container">
                <div className="game-question-meta">
                  PROGRESS: {currentIndex + 1} / {questions.length}
                </div>
                <h2 className="game-question-text">{currentQuestion.questionText}</h2>

                <div className="game-choices-grid">
                  {currentQuestion.choices.map((choice, idx) => (
                    <button
                      key={idx}
                      className={`game-choice-card ${selectedAnswer === idx ? "is-selected" : ""}`}
                      disabled={answerLocked}
                      onClick={() => handleAnswer(idx)}
                    >
                      <div className="game-choice-index">{String.fromCharCode(65 + idx)}</div>
                      <div className="game-choice-label">{choice}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>

        {/* Decorative */}
        <div className="game-circuit-detail-left">010101</div>
        <div className="game-star-detail-right">✦</div>
      </div>
    </div>
  );
}

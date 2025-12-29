import React, { useEffect, useState } from "react";
import "./FriendsGame.css";
import { db } from "../../firebase";
import { ref, onValue, update } from "firebase/database";
import FriendsSettlement from "./FriendsSettlement";

const QUESTION_DURATION = 10; // seconds

export default function FriendsGame({ user, lobbyCode, lobby, players, onExit, onPlayAgain }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answeredIndex, setAnsweredIndex] = useState(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION);

  const isHost = lobby?.hostId === user?.uid;
  const questions = lobby?.questions || [];
  const currentQuestion = questions[currentIndex];

  // ================= LISTEN TO QUESTION INDEX =================
  useEffect(() => {
    if (!lobbyCode) return;

    const indexRef = ref(db, `lobbies/${lobbyCode}/currentQuestionIndex`);
    return onValue(indexRef, async (snap) => {
      if (!snap.exists()) return;

      setCurrentIndex(snap.val());
      setSelectedAnswer(null);
      setHasAnswered(false);
      setAnsweredIndex(null);
      setTimeLeft(QUESTION_DURATION);

      if (isHost) {
        await update(ref(db, `lobbies/${lobbyCode}`), {
          questionStartTime: Date.now(),
        });
      }
    });
  }, [lobbyCode, isHost]);

  // ================= SHARED TIMER =================
  useEffect(() => {
    if (!lobby?.questionStartTime || lobby?.gameFinished) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lobby.questionStartTime) / 1000);
      const remaining = QUESTION_DURATION - elapsed;
      setTimeLeft(Math.max(0, remaining));

      if (remaining <= 0 && isHost) {
        goNextQuestion();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [lobby?.questionStartTime, lobby?.gameFinished, isHost]);

  // ================= HANDLE ANSWER =================
  const handleAnswer = async (choiceIndex) => {
    if (hasAnswered || timeLeft <= 0) return;

    setSelectedAnswer(choiceIndex);
    setHasAnswered(true);
    setAnsweredIndex(currentIndex);

    if (choiceIndex === currentQuestion.answer) {
      const currentScore = players.find((p) => p.id === user?.uid)?.score || 0;
      await update(ref(db, `lobbies/${lobbyCode}/players/${user.uid}`), {
        score: currentScore + 1,
      });
    }
  };

  // ================= AUTO NEXT QUESTION =================
  const goNextQuestion = async () => {
    if (!isHost) return;

    if (currentIndex + 1 >= questions.length) {
      await update(ref(db, `lobbies/${lobbyCode}`), {
        gameFinished: true,
      });
    } else {
      await update(ref(db, `lobbies/${lobbyCode}`), {
        currentQuestionIndex: currentIndex + 1,
      });
    }
  };

  // ================= RENDER =================
  if (lobby?.gameFinished) {
    return (
      <FriendsSettlement
        players={players}
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        isHost={isHost}
      />
    );
  }

  if (!currentQuestion) {
    return <div className="friendsgame-screen">Loading question...</div>;
  }

  return (
    <div className="friendsgame-screen">
      <header className="friendsgame-header">
        <h3>
          Question {currentIndex + 1} / {questions.length}
        </h3>
        <div className={`friendsgame-timer ${timeLeft <= 3 ? "danger" : ""}`}>
          ⏱ {timeLeft}s
        </div>
      </header>

      <main className="friendsgame-main">
        <h2 className="friendsgame-question">{currentQuestion.question}</h2>
        <div className="friendsgame-choices">
          {currentQuestion.choices.map((choice, index) => {
            const isCorrect = index === currentQuestion.answer;
            const isSelected = index === selectedAnswer;

            let className = "choice-btn";
            if (answeredIndex === currentIndex) {
              if (isCorrect) className += " correct";
              else if (isSelected) className += " wrong";
            }

            return (
              <button
                key={index}
                className={className}
                disabled={hasAnswered || timeLeft === 0}
                onClick={() => handleAnswer(index)}
              >
                {choice}
              </button>
            );
          })}
        </div>
      </main>

      <footer className="friendsgame-footer">
        <div className="friendsgame-scoreboard">
          {players.map((p) => (
            <span key={p.id}>
              {p.displayName}: {p.score}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}

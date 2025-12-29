// src/games/quizblitz/SoloQuiz.jsx
import React, { useState, useEffect, useRef } from "react";
import "./SoloQuiz.css";
import quizblitzLogo from "../../assets/quizblitz/logo.png";

export default function SoloQuiz({ user, questions, onQuizFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const timerRef = useRef(null);
  const currentQuestion = questions[currentIndex];

  const playerName = user?.displayName || "Player";
  const playerLevel = Math.floor((user?.xp || 0) / 100) + 1;

  // Start countdown timer
  useEffect(() => {
    setTimeLeft(10);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex]);

  // Auto move to next question if timer reaches 0
  useEffect(() => {
    if (timeLeft <= 0) {
      handleNext();
    }
  }, [timeLeft]);

  const handleAnswer = (index) => {
    if (selectedAnswer !== null) return; // prevent multiple clicks
    setSelectedAnswer(index);

    if (index === currentQuestion.answer) {
      setScore((prev) => prev + 10);
    }

    // Wait 1 second to show feedback, then move to next
    setTimeout(() => {
      handleNext();
    }, 1000);
  };

  const handleNext = () => {
    clearInterval(timerRef.current);
    setSelectedAnswer(null);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // When quiz finishes, send score to parent
      onQuizFinish(score);
    }
  };

  return (
    <div className="solo-quiz-screen">
      {/* ================= HEADER ================= */}
      <header className="solo-quiz-header">
        <img src={quizblitzLogo} alt="Quiz Blitz" className="solo-quiz-logo" />
        <div className="solo-quiz-progress-bar">
          <div
            className="solo-quiz-progress-fill"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        <span className="solo-quiz-count">
          QUESTION {currentIndex + 1} OF {questions.length}
        </span>
      </header>

      {/* ================= TIMER ================= */}
      <div className="solo-quiz-timer-container">
        <div className={`solo-quiz-timer-circle ${timeLeft <= 3 ? "low-time" : ""}`}>
          <span className="solo-quiz-timer-text">{timeLeft}</span>
        </div>
      </div>

      {/* ================= QUESTION & CHOICES ================= */}
      <main className="solo-quiz-main">
        <div className="solo-quiz-question-box">
          <p>{currentQuestion.question}</p>
        </div>

        <div className="solo-quiz-choices-grid">
          {currentQuestion.choices.map((choice, i) => {
            let choiceClass = "solo-quiz-choice-button";
            if (selectedAnswer !== null) {
              if (i === currentQuestion.answer) choiceClass += " correct";
              else if (i === selectedAnswer) choiceClass += " wrong";
            }

            return (
              <button
                key={i}
                className={choiceClass}
                onClick={() => handleAnswer(i)}
              >
                <span className="solo-choice-letter">{String.fromCharCode(65 + i)}</span>
                <span className="solo-choice-text">{choice}</span>
              </button>
            );
          })}
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="solo-quiz-footer">
        <div className="solo-quiz-player-info">
          <div className="solo-quiz-avatar-placeholder">{playerName.charAt(0)}</div>
          <div className="solo-quiz-footer-text">
            <span className="solo-quiz-player-name">{playerName}</span>
          </div>
        </div>
        <div className="solo-quiz-score-display">
          <span className="solo-score-label">SCORE</span>
          <span className="solo-score-value">{score}</span>
        </div>
      </footer>
    </div>
  );
}

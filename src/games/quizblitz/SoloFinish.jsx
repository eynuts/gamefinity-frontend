// src/games/quizblitz/SoloFinish.jsx
import React from "react";
import "./SoloFinish.css";
import quizblitzLogo from "../../assets/quizblitz/logo.png";
import soloBackground from "../../assets/quizblitz/bg.png";

export default function SoloFinish({ user, score, onBackToCategories, onBackToHome }) {
  const playerName = user?.displayName || "Player";

  return (
    <div
      className="finish-quiz-screen"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(${soloBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <header className="finish-quiz-header">
        <img 
          src={quizblitzLogo} 
          alt="Quiz Blitz" 
          className="finish-quiz-logo" 
        />
      </header>

      <div className="finish-quiz-result-card">
        <h2 className="finish-quiz-title">Quiz Finished</h2>
        
        <div className="finish-quiz-final-score">
          <span>TOTAL SCORE</span>
          <h1>{score}</h1>
        </div>
        
        <p className="finish-quiz-result-text">Well done, {playerName}!</p>

        <div className="finish-finish-buttons">
          <button 
            className="finish-quiz-back-btn" 
            onClick={onBackToCategories} // ✅ Back to Solo categories
          >
            Categories
          </button>
          <button 
            className="finish-quiz-back-btn" 
            onClick={onBackToHome}       // ✅ Back to QuizBlitz main menu
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}

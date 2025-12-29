// src/games/quizblitz/Solo.jsx
import React, { useState } from "react";
import "./Solo.css";
import quizblitzLogo from "../../assets/quizblitz/logo.png";

// Category Icons
import triviaIcon from "../../assets/quizblitz/trivia.png";
import idiomsIcon from "../../assets/quizblitz/idioms.png";
import criticalIcon from "../../assets/quizblitz/critical.png";
import generalIcon from "../../assets/quizblitz/general.png";

// ✅ Import question bank and SoloQuiz/SoloFinish screens
import { questionBank, shuffleQuestionChoices } from "./questions";
import SoloQuiz from "./SoloQuiz";
import SoloFinish from "./SoloFinish";

export default function Solo({ user, onBack }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [screen, setScreen] = useState("categories"); // "categories", "quiz", "finish"
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [score, setScore] = useState(0);

  const playerName = user?.displayName || "Player";
  const playerXP = user?.xp ?? Number(localStorage.getItem("quizblitz_xp")) ?? 0;
  const playerLevel = Math.floor(playerXP / 100) + 1;

  const categories = [
    { id: "Trivia", label: "TRIVIA", icon: triviaIcon, className: "solo-cat-yellow" },
    { id: "Idioms", label: "IDIOMS", icon: idiomsIcon, className: "solo-cat-teal" },
    { id: "Critical Thinking", label: "CRITICAL THINKING", icon: criticalIcon, className: "solo-cat-red" },
    { id: "General Knowledge", label: "GENERAL KNOWLEDGE", icon: generalIcon, className: "solo-cat-blue" },
  ];

  // ================= QUIZ LOGIC =================
  const handleStartQuiz = () => {
    if (!selectedCategory) {
      alert("Please select a category first!");
      return;
    }

    const categoryQuestions = [...questionBank[selectedCategory]];
    const shuffled = categoryQuestions.sort(() => Math.random() - 0.5).slice(0, 10);
    const finalQuestions = shuffleQuestionChoices(shuffled);

    setQuizQuestions(finalQuestions);
    setScreen("quiz");
  };

  const handleQuizFinish = (finalScore) => {
    setScore(finalScore);
    setScreen("finish");
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setScreen("categories");
  };

  const handleBackToMenu = () => {
    // Go back to QuizBlitz main menu
    onBack();
  };

  // ================= SCREENS =================
  if (screen === "quiz") {
    return <SoloQuiz user={user} questions={quizQuestions} onQuizFinish={handleQuizFinish} />;
  }

  if (screen === "finish") {
    return (
      <SoloFinish
        user={user}
        score={score}
        onBackToCategories={handleBackToCategories} // back to Solo categories
        onBackToHome={handleBackToMenu}            // back to QuizBlitz menu
      />
    );
  }

  // ================= CATEGORY SELECTION SCREEN =================
  return (
    <div className="solo-screen">
      <header className="solo-header">
        <img src={quizblitzLogo} alt="Quiz Blitz Logo" className="solo-logo" />
        <h2 className="solo-tagline">SELECT A CATEGORY</h2>
      </header>

      <main className="solo-options-container">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`solo-option-button ${cat.className} ${selectedCategory === cat.id ? "solo-active" : ""}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {selectedCategory === cat.id && <div className="solo-selection-checkmark">✓</div>}
            <span className="solo-icon">
              <img src={cat.icon} alt={cat.label} className="solo-category-img" />
            </span>
            <span className="solo-text">{cat.label}</span>
          </button>
        ))}
      </main>

      <div className="solo-action-area">
        <button className="solo-start-button" onClick={handleStartQuiz}>
          START QUIZ
        </button>
      </div>

      <footer className="solo-footer">
        <div className="solo-player-profile">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={playerName} className="solo-profile-img" />
          ) : (
            <div className="solo-profile-placeholder">{playerName.charAt(0)}</div>
          )}
          <span className="solo-player-name">{playerName}</span>
        </div>

        <div className="solo-secondary-nav">
          <button className="solo-back-button" onClick={handleBackToMenu}>
            BACK
          </button>
        </div>
      </footer>
    </div>
  );
}

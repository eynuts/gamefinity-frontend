// src/home/Home.jsx
import { useState, useEffect } from "react";
import "./Home.css";
import "bootstrap/dist/css/bootstrap.min.css";

import logo from "../assets/gamelogo.png";
import brainMystLogo from "../assets/brainmystlogo.png";
import itAppLogo from "../assets/itapplogo.png";
import quizBlitzLogo from "../assets/quizblitzlogo.png";

import BrainMystApp from "../games/brainmyst/BrainMystApp";
import ItApp from "../games/itapp/itapp";
import QuizBlitzMain from "../games/quizblitz/QuizBlitzMain";
import { auth, provider } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { ref, set, child, onValue, get } from "firebase/database";
import { db } from "../firebase"; // make sure you have db exported from firebase.js
import Admin from "../admin/Admin";
import Subscription from "./Subscription";

export default function Home() {
  // GAME STATES
  const [riddleAnswer, setRiddleAnswer] = useState("");
  const [riddleFeedback, setRiddleFeedback] = useState("");

  const [triviaAnswer, setTriviaAnswer] = useState("");
  const [triviaFeedback, setTriviaFeedback] = useState("");

  const [mathAnswer, setMathAnswer] = useState("");
  const [mathFeedback, setMathFeedback] = useState("");

  // USER AUTH STATE
  const [user, setUser] = useState(null);

  // CURRENT GAME SCREEN
  const [currentGame, setCurrentGame] = useState(null);

  // ADMIN PANEL STATE
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // LOGIN MODAL
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null); // null | "pending" | "approved"
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false); // NEW
  
  // AUTH LISTENER
  useEffect(() => {
    let unsubscribeSub;
  
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        const userRef = ref(db, "users/" + u.uid);
        onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setIsAdmin(userData.isAdmin || false);
          }
        });
  
        const subRef = ref(db, "subscriptions/" + u.uid);
        unsubscribeSub = onValue(subRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setSubscriptionStatus(data.status || "pending");
          } else {
            setSubscriptionStatus(null);
          }
        });
      } else {
        setIsAdmin(false);
        setSubscriptionStatus(null);
      }
    });
  
    // Cleanup listeners on unmount
    return () => {
      if (unsubscribeSub) unsubscribeSub();
      unsubscribeAuth();
    };
  }, []);
  
  

  // LOGIN
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
  
      // Reference to all users
      const usersRef = ref(db, "users");
      const snapshot = await get(child(usersRef, u.uid));
  
      if (!snapshot.exists()) {
        // Check if there are any users yet
        const allUsersSnapshot = await get(usersRef);
        const isFirstUser = !allUsersSnapshot.exists();
  
        // Save user info to database
        await set(ref(db, "users/" + u.uid), {
          name: u.displayName,
          email: u.email,
          firstLogin: new Date().toISOString(),
          isAdmin: false
        });
      }
  
      setShowLoginPrompt(false);
    } catch (err) {
      console.error(err);
    }
  };
  
  // LOGOUT
  const handleLogout = async () => {
    await signOut(auth);
  };

  // subs
  const handleSubscriptionClick = () => {
    if (!user) {
      setShowLoginPrompt(true); // Show login first
      return;
    }
  
    // Always show the subscription modal
    setShowSubscriptionPrompt(true);
  };
  
  
  // 🔒 GAME ACCESS GUARD
  const handlePlay = (gameName) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
  
    // Admin bypass subscription checks
    if (!subscriptionStatus && !isAdmin) {
      setShowSubscriptionPrompt(true);
      return;
    }
  
    if (subscriptionStatus !== "approved" && !isAdmin) {
      setShowSubscriptionPrompt(true);
      return;
    }
  
    setCurrentGame(gameName);    
  };
  
  // CHECKERS
  const checkRiddle = () => {
    if (riddleAnswer.toLowerCase().includes("piano")) {
      setRiddleFeedback("🎉 Correct! Great job!");
    } else {
      setRiddleFeedback("❌ Try again!");
    }
  };

  const checkTrivia = () => {
    const ans = triviaAnswer.toLowerCase();
    if (ans.includes("perseverance") || ans.includes("determination")) {
      setTriviaFeedback("🌟 Correct! Stay motivated!");
    } else {
      setTriviaFeedback("❌ Oops! Think positive!");
    }
  };

  const checkMath = () => {
    if (mathAnswer === "6") {
      setMathFeedback("⚡ Correct! Fast and smart!");
    } else {
      setMathFeedback("❌ Wrong! Time’s up!");
    }
  };

  // ADMIN PANEL ROUTING
if (showAdminPanel) {
  return <Admin user={user} onExit={() => setShowAdminPanel(false)} />;
}
  // GAME ROUTING (UNCHANGED)
  if (currentGame === "BrainMyst") {
    return <BrainMystApp user={user} onExit={() => setCurrentGame(null)} />;
  }

  if (currentGame === "ItApp") {
    return (
      <ItApp
        user={user}
        onBack={() => setCurrentGame(null)}
        onExitToHome={() => setCurrentGame(null)}
      />
    );
  }

  if (currentGame === "QuizBlitz") {
    return <QuizBlitzMain user={user} onExit={() => setCurrentGame(null)} />;
  }

  return (
    <div className="home-container">
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center" href="#">
            <img src={logo} alt="Gamefinity Logo" className="logo-img me-2" />
            Gamefinity
          </a>

          <button
            className="navbar-toggler"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
            <ul className="navbar-nav align-items-center">
              <li className="nav-item">
                <a className="nav-link active">Home</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#games">Games</a>
              </li>

              <li className="nav-item">
                <a className="nav-link" href="#about">About</a>
              </li>

              {!user && (
                <li className="nav-item">
                  <button
                    className="btn btn-outline-light ms-3"
                    onClick={handleLogin}
                  >
                    Login
                  </button>
                </li>
              )}

              {user && (
                <>
                  <img
                    src={user.photoURL}
                    alt="User"
                    className="rounded-circle ms-3"
                    style={{ width: "35px", height: "35px" }}
                  />
                  <span className="nav-link text-info">
                    {user.displayName}
                  </span>

                  {isAdmin && (
                    <button
                      className="btn btn-warning ms-2"
                      onClick={() => setShowAdminPanel(true)}
                    >
                      Admin
                    </button>
                  )}


                  <button
                    className="btn btn-danger ms-2"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                  <li className="nav-item">
                <button
                  className="btn btn-info ms-3"
                  onClick={handleSubscriptionClick} // NEW handler (see next step)
                >
                  Subscription
                </button>
              </li>
                </>
              )}

            </ul>
          </div>
        </div>
      </nav>

      {/* HEADER */}
      <header>
        <h1>Welcome to Gamefinity</h1>
        <p>
          Fun, Interactive, Motivational, and Competitive Learning for Gen Z.
        </p>
        <a href="#games" className="btn btn-play mt-3">
          Start Playing
        </a>
      </header>

      {/* GAME CARDS */}
      <section id="games" className="game-section container">
        <div className="row justify-content-center d-flex align-items-stretch">

          {/* BrainMyst */}
          <div className="col-md-4 mb-4 d-flex">
            <div className="card game-card d-flex flex-column">
              <img src={brainMystLogo} alt="BrainMyst" />
              <div className="card-body d-flex flex-column">
                <h5>BrainMyst</h5>
                <p className="text-light flex-grow-1">
                  Solve mysteries, puzzles, and word scrambles to test your logic.
                </p>
                <button
                  className="btn-play mt-auto"
                  onClick={() => handlePlay("BrainMyst")}
                >
                  Play Now
                </button>
              </div>
            </div>
          </div>

          {/* iT-APP */}
          <div className="col-md-4 mb-4 d-flex">
            <div className="card game-card d-flex flex-column">
              <img src={itAppLogo} alt="iT-APP" />
              <div className="card-body d-flex flex-column">
                <h5>iT-APP</h5>
                <p className="text-light flex-grow-1">
                  Engage in motivational trivia and inspiring challenges.
                </p>
                <button
                  className="btn-play mt-auto"
                  onClick={() => handlePlay("ItApp")}
                >
                  Play Now
                </button>
              </div>
            </div>
          </div>

          {/* Quiz Blitz */}
          <div className="col-md-4 mb-4 d-flex">
            <div className="card game-card d-flex flex-column">
              <img src={quizBlitzLogo} alt="Quiz Blitz" />
              <div className="card-body d-flex flex-column">
                <h5>Quiz Blitz</h5>
                <p className="text-light flex-grow-1">
                  Race against time in this multiplayer battle of wits!
                </p>
                <button
                  className="btn-play mt-auto"
                  onClick={() => handlePlay("QuizBlitz")}
                >
                  Play Now
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* EXISTING MODALS (UNCHANGED) */}
      <div className="modal fade" id="itAppModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content p-4 text-center">
            <h3>🎲 iT-APP</h3>
            <p>What word means “never giving up”?</p>
            <input
              type="text"
              className="form-control text-center mb-3"
              value={triviaAnswer}
              onChange={(e) => setTriviaAnswer(e.target.value)}
            />
            <button className="btn-play" onClick={checkTrivia}>Submit</button>
            <p className="mt-3">{triviaFeedback}</p>
          </div>
        </div>
      </div>

      <div className="modal fade" id="quizBlitzModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content p-4 text-center">
            <h3>⚡ Quiz Blitz</h3>
            <p>2 + 2 × 2 = ?</p>
            <input
              type="text"
              className="form-control text-center mb-3"
              value={mathAnswer}
              onChange={(e) => setMathAnswer(e.target.value)}
            />
            <button className="btn-play" onClick={checkMath}>Submit</button>
            <p className="mt-3">{mathFeedback}</p>
          </div>
        </div>
      </div>

      {/* LOGIN REQUIRED MODAL */}
      {showLoginPrompt && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4 text-center">
              <h3>🔒 Login Required</h3>
              <p>You need to log in first before playing.</p>
              <div className="d-flex justify-content-center gap-2">
                <button className="btn btn-primary" onClick={handleLogin}>
                  Login
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowLoginPrompt(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        <Subscription 
          show={showSubscriptionPrompt} 
          onClose={() => setShowSubscriptionPrompt(false)}
          status={subscriptionStatus} // pass current subscription status
        />


      {/* ABOUT */}
      <section id="about" className="container text-center py-5">
        <h2 className="fw-bold text-info mb-3">About Gamefinity</h2>
        <p className="text-light">
          Gamefinity is a web-based 3-in-1 educational platform for Gen Z,
          combining fun, interactive, motivational, and competitive learning
          experiences through BrainMyst, iT-APP, and Quiz Blitz.
        </p>
      </section>

      <footer>
        © 2025 Gamefinity | Developed for Gen Z Interactive Learning
      </footer>
    </div>
  );
}


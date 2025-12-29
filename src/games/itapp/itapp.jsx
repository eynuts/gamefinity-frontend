import React, { useState, useEffect, useRef } from "react"; 
import axios from "axios";
import NebulaBackground from "../../assets/itapp/bg.png"; 
import { motion } from "framer-motion"; 
import "./itapp.css"; 
import Lobby from "./Lobby";
import Menu from "./Menu";
import menuIcon from "../../assets/itapp/menu.png";
import { auth } from "../../firebase";
import { io } from "socket.io-client";

import { ref, get, update } from "firebase/database";
import { db } from "../../firebase";

const socket = io("http://localhost:5000/itapp");

export default function ItApp({ onExitToHome }) {
  const [showLobby, setShowLobby] = useState(false);
  const [lobbyMode, setLobbyMode] = useState(null); 
  const [userData, setUserData] = useState(null);
  const [lobbies, setLobbies] = useState([]);
  const [settlementData, setSettlementData] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const searchIntervalRef = useRef(null);

  // ================= FIRST IT-APP ENTRY TRACKER =================
  useEffect(() => {
    if (!auth.currentUser?.uid) return;

    const saveFirstItAppEntry = async () => {
      try {
        const { uid, email } = auth.currentUser;
        const userRef = ref(db, `users/${uid}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) return;

        const userData = snapshot.val();

        // Save ONLY once
        if (!userData.firstItAppEntry) {
          await update(userRef, {
            email,
            firstItAppEntry: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Failed to save IT-App entry:", err);
      }
    };

    saveFirstItAppEntry();
  }, []);

  // --- Setup body scroll ---
  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => {
      document.body.classList.remove("no-scroll");
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    };
  }, []);

  // --- Fetch / Save user (Express backend) ---
  useEffect(() => {
    const saveUser = async () => {
      if (!auth.currentUser) return;
      const { uid, email } = auth.currentUser;
      try {
        const res = await axios.post("http://localhost:5000/api/itapp/user", { uid, email });
        setUserData(res.data);
      } catch (err) {
        console.error("Error saving user:", err);
      }
    };
    saveUser();
  }, []);

  // --- Socket: receive lobby list ---
  useEffect(() => {
    const handleLobbyList = (data) => {
      setLobbies(
        data.map(lobby => ({
          id: lobby.id,
          name: lobby.name || "Unknown Lobby",
          hostId: lobby.hostId,
          players: lobby.players || [],
          categories: lobby.categories || [],
          ...lobby
        }))
      );
    };

    socket.on("lobbyList", handleLobbyList);
    socket.emit("requestLobbies");

    return () => socket.off("lobbyList", handleLobbyList);
  }, []);

  // --- Handlers ---
  const stopSearching = () => {
    setIsSearching(false);
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }
  };

  const openFindLobby = () => {
    if (!userData) return;
    
    setIsSearching(true);

    searchIntervalRef.current = setInterval(() => {
      socket.emit("requestLobbies");
      const available = lobbies.find(l => l.players.length < 8);

      if (available) {
        stopSearching();

        if (!available.players.find(p => p.id === userData.uid)) {
          socket.emit("joinLobby", {
            lobbyId: available.id,
            uid: userData.uid,
            username: userData.username
          });
        }

        setLobbyMode("join");
        setShowLobby(true);
      }
    }, 1000);
  };

  const openCreateLobby = () => {
    if (!userData) return;
    socket.emit("createLobby", { uid: userData.uid, username: userData.username });
    setLobbyMode("create");
    setShowLobby(true);
  };

  const backToItApp = () => {
    setShowLobby(false);
    setLobbyMode(null);
    stopSearching();
  };

  const openMenu = () => setShowMenu(true);
  const closeMenu = () => setShowMenu(false);
  const exitToHome = () => {
    setShowMenu(false);
    onExitToHome();
  };

  const openSettlement = (lobby, leaderboard) => {
    setSettlementData({ lobby, leaderboard });
  };

  const closeSettlement = () => {
    setSettlementData(null);
    setShowLobby(false);
    setLobbyMode(null);
  };

  // --- Render Views ---

  if (settlementData && userData) {
    const Settlement = require("./Settlement").default;
    return (
      <Settlement
        lobby={settlementData.lobby}
        userData={userData}
        leaderboard={settlementData.leaderboard}
        onPlayAgain={() => setSettlementData(null)}
        onHome={closeSettlement}
        socket={socket}
      />
    );
  }

  if (showLobby && userData) {
    return (
      <Lobby
        onBack={backToItApp}
        userData={userData}
        mode={lobbyMode}
        socket={socket}
        onExitToHome={backToItApp}
        onFinish={(lobby, leaderboard) => openSettlement(lobby, leaderboard)}
      />
    );
  }

  return (
    <div className="itapp-page-container">
      <div className="itapp-background" style={{ backgroundImage: `url(${NebulaBackground})` }}>
        <header className="itapp-header">
          <div className="itapp-logo-area">
            <div className="itapp-logo-text">
              <span className="itapp-blue">iT</span>-APP
            </div>
            <div className="itapp-subtitle">
              Interactive Trivia & Playful Platform
            </div>
          </div>
          <div className="itapp-search-area">
            <button className="itapp-menu-btn" onClick={openMenu}>
              <img src={menuIcon} alt="Menu" />
            </button>
          </div>
        </header>

        <div className="itapp-main-content">
          {isSearching ? (
            <div className="itapp-searching-container">
              <div className="itapp-spinner"></div>
              <p className="itapp-searching-text">SCANNING NEBULA FOR LOBBIES...</p>
              <button className="itapp-cancel-search" onClick={stopSearching}>
                CANCEL
              </button>
            </div>
          ) : (
            <>
              <div className="itapp-game-buttons">
                <motion.button
                  className="itapp-btn itapp-create-new-btn"
                  onClick={openCreateLobby}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  CREATE NEW GAME
                </motion.button>

                <motion.button
                  className="itapp-btn itapp-find-game-btn"
                  onClick={openFindLobby}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  FIND A GAME
                </motion.button>
              </div>

            </>
          )}
        </div>

        

        {showMenu && (
          <Menu
            onClose={closeMenu}
            onExit={exitToHome}
            userData={userData}
            setUserData={setUserData}
          />
        )}
      </div>
    </div>
  );
}

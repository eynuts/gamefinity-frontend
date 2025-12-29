// src/games/itapp/Menu.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Menu.css";
import exitIcon from "../../assets/itapp/exit.png";
import axios from "axios";

export default function Menu({ onClose, onExit, userData, setUserData }) {
  const [changeUsernameMode, setChangeUsernameMode] = useState(false);
  const [newUsername, setNewUsername] = useState(userData?.username || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUsernameChange = async () => {
    if (!newUsername || newUsername === userData?.username) {
      setChangeUsernameMode(false);
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.put(`http://localhost:5000/api/itapp/user/${userData.uid}`, { 
        username: newUsername 
      });
      setUserData(res.data);
      setChangeUsernameMode(false);
    } catch (err) {
      console.error(err);
      setError("SYSTEM ERROR: UNABLE TO UPDATE IDENTITY");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { staggerChildren: 0.08, delayChildren: 0.2 } 
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { x: -15, opacity: 0 },
    show: { x: 0, opacity: 1 },
  };

  return (
    <div
      className="itappmenu-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="itappmenu-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        <div className="itappmenu-header">
          <div className="itappmenu-glitch-wrapper">
            <h2 className="itappmenu-title">
              {changeUsernameMode ? "IDENTITY" : "SYSTEM MENU"}
            </h2>
          </div>
          <div className="itappmenu-title-underline"></div>
        </div>

        <div className="itappmenu-content-wrapper">
          <AnimatePresence mode="wait">
            {!changeUsernameMode ? (
              <motion.div 
                key="main-menu"
                className="itappmenu-content"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <div className="itappmenu-section-label">USER PROFILE</div>
                <div className="itappmenu-buttons">
                  <motion.button
                    variants={itemVariants}
                    className="itappmenu-btn itappmenu-secondary-btn itappmenu-user-btn"
                    onClick={() => setChangeUsernameMode(true)}
                  >
                    <span className="itappmenu-btn-icon">👤</span>
                    <span className="itappmenu-btn-text">{userData?.username || "USER"}</span>
                    <span className="itappmenu-edit-tag">EDIT</span>
                  </motion.button>

                  
                </div>

                <div className="itappmenu-divider" />

                <div className="itappmenu-buttons">
                  <motion.button 
                    variants={itemVariants}
                    className="itappmenu-btn itappmenu-tertiary-btn itappmenu-exit-btn" 
                    onClick={onExit}
                  >
                    <img src={exitIcon} alt="" className="itappmenu-exit-btn-img" />
                    <span className="itappmenu-btn-text">EXIT TO HUB</span>
                  </motion.button>

                  <motion.button 
                    variants={itemVariants}
                    className="itappmenu-btn itappmenu-primary-btn itappmenu-back-btn" 
                    onClick={onClose}
                  >
                    RETURN TO GAME
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="username-mode"
                className="itappmenu-username-change-container"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p className="itappmenu-current-username">
                  CURRENT IDENTIFIER: <strong>{userData?.username}</strong>
                </p>

                <div className="itappmenu-input-group">
                  <input
                    type="text"
                    className="itappmenu-username-input"
                    value={newUsername}
                    onChange={(e) => { setError(""); setNewUsername(e.target.value); }}
                    placeholder="ENTER NEW NAME..."
                    autoFocus
                    maxLength={15}
                  />
                  <div className="itappmenu-input-scanline"></div>
                </div>
                
                <AnimatePresence>
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="itappmenu-error"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="itappmenu-buttons">
                  <button 
                    className={`itappmenu-btn itappmenu-save-btn ${loading ? 'loading' : ''}`} 
                    onClick={handleUsernameChange}
                    disabled={loading}
                  >
                    {loading ? "PROCESSING..." : "CONFIRM CHANGES"}
                  </button>
                  <button 
                    className="itappmenu-btn itappmenu-cancel-btn" 
                    onClick={() => { setChangeUsernameMode(false); setError(""); }}
                  >
                    CANCEL
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="itappmenu-footer-decor">
          <span className="itappmenu-version">v2.4.0</span>
          <div className="itappmenu-status-dot"></div>
          <span className="itappmenu-status-text">SYSTEM ACTIVE</span>
        </div>
      </motion.div>
    </div>
  );
}
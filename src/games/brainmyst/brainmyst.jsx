import React from "react";
import { motion } from "framer-motion";
import "./brainmyst.css";
import logo from "../../assets/brainmyst/logo.png";
import background from "../../assets/brainmyst/bg.png";

export default function BrainMyst({ onStartGame, onExitGame }) {
  // Animation Variants for a smooth, high-quality entrance
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div
      className="brain-myst-wrapper"
      style={{ backgroundImage: `url(${background})` }}
    >
      {/* Background Overlay to ensure contrast */}
      <div className="brain-myst-overlay"></div>

      <motion.div
        className="brain-main-menu-card"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Logo Section - Top */}
        <motion.div className="brain-logo-section" variants={itemVariants}>
          <img src={logo} alt="BrainMyst Logo" className="brain-myst-logo" />
        </motion.div>

        {/* Buttons Section - Vertical Stack */}
        <div className="brain-menu-actions">
          <motion.button
            className="brain-menu-btn brain-start-btn"
            variants={itemVariants}
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 0 25px rgba(0, 212, 255, 0.6)" 
            }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartGame}
          >
            START GAME
          </motion.button>

          <motion.button
            className="brain-menu-btn brain-exit-btn"
            variants={itemVariants}
            whileHover={{ 
              scale: 1.05, 
              backgroundColor: "rgba(255, 255, 255, 0.15)" 
            }}
            whileTap={{ scale: 0.95 }}
            onClick={onExitGame}
          >
            EXIT GAME
          </motion.button>
        </div>

        {/* Version Info */}
        <motion.span className="brain-version-tag" variants={itemVariants}>
          v1.0.0
        </motion.span>
      </motion.div>
    </div>
  );
}
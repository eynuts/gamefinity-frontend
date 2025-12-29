// src/admin/AdminGame.jsx
import React, { useMemo } from "react";
import "./AdminGame.css";
// Keep original imports
import { 
  FaGamepad, 
  FaBrain, 
  FaCode, 
  FaLightbulb, 
  FaArrowTrendUp 
} from "react-icons/fa6"; 
import { 
  FaChartBar, 
  FaUserFriends, 
  FaHome 
} from "react-icons/fa";

const AdminGame = ({ users, onBack }) => {
  const { startOfDay, startOfMonth, startOfYear } = useMemo(() => {
    const now = new Date();
    return {
      startOfDay: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      startOfMonth: new Date(now.getFullYear(), now.getMonth(), 1),
      startOfYear: new Date(now.getFullYear(), 0, 1),
    };
  }, []);

  const gameStats = useMemo(() => {
    const stats = {
      BrainMyst: { daily: 0, monthly: 0, yearly: 0, icon: <FaBrain />, color: "#a855f7" },
      ITApp: { daily: 0, monthly: 0, yearly: 0, icon: <FaCode />, color: "#3b82f6" },
      QuizBlitz: { daily: 0, monthly: 0, yearly: 0, icon: <FaLightbulb />, color: "#eab308" },
    };

    if (users && users.length > 0) {
      users.forEach(u => {
        const games = [
          { key: 'BrainMyst', date: u.firstBrainMystEntry },
          { key: 'ITApp', date: u.firstItAppEntry },
          { key: 'QuizBlitz', date: u.firstQuizBlitzEntry }
        ];

        games.forEach(game => {
          if (game.date) {
            const entryDate = new Date(game.date);
            if (entryDate >= startOfDay) stats[game.key].daily++;
            if (entryDate >= startOfMonth) stats[game.key].monthly++;
            if (entryDate >= startOfYear) stats[game.key].yearly++;
          }
        });
      });
    }
    return stats;
  }, [users, startOfDay, startOfMonth, startOfYear]);

  const totalEngagement = Object.values(gameStats).reduce((acc, curr) => acc + curr.yearly, 0);

  return (
    <div className="admin-game-container">
      {/* --- HEADER --- */}
      <header className="game-header">
        <div className="header-info">
          <h2><FaGamepad className="title-icon" /> Game Analytics</h2>
          <p>Monitor real-time user engagement and popularity</p>
        </div>
        <div className="stat-pill">
          <FaUserFriends />
          <span>Total Yearly Players: <strong>{totalEngagement}</strong></span>
        </div>
      </header>

      {/* --- GAME GRID --- */}
      <div className="game-grid">
        {Object.entries(gameStats).map(([game, data]) => {
          const monthlyRate = data.yearly > 0 ? (data.monthly / data.yearly) * 100 : 0;

          return (
            <div key={game} className="game-card">
              <FaArrowTrendUp className="trend-bg-icon" />
              
              <div className="card-top">
                <div 
                  className="icon-box" 
                  style={{ backgroundColor: `${data.color}25`, color: data.color }}
                >
                  {data.icon}
                </div>
                <div className="game-title-group">
                  <h3 className="game-card-name">{game}</h3>
                  <span className="status-tag">Live</span>
                </div>
              </div>

              <div className="card-body">
                <div className="main-stat">
                  <span className="stat-label">TODAY'S ACTIVE PLAYERS</span>
                  <h2 className="player-count-display">{data.daily}</h2>
                </div>

                <div className="sub-stats-row">
                  <div className="sub-item">
                    <span className="sub-label">Monthly</span>
                    <strong className="sub-value">{data.monthly}</strong>
                  </div>
                  <div className="v-divider"></div>
                  <div className="sub-item">
                    <span className="sub-label">Yearly</span>
                    <strong className="sub-value">{data.yearly}</strong>
                  </div>
                </div>

                <div className="engagement-section">
                  <div className="progress-info">
                    <span>Monthly Retention</span>
                    <span>{Math.round(monthlyRate)}%</span>
                  </div>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ 
                        width: `${monthlyRate}%`, 
                        backgroundColor: data.color,
                        boxShadow: `0 0 10px ${data.color}80` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- HOME BUTTON --- */}
      <div className="game-home-btn-container">
        <button className="admin-home-btn" onClick={onBack}>
          <FaHome /> <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
};

export default AdminGame;

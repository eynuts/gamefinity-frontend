// src/components/BrainGame/BrainSettlement.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { 
  ref, 
  onValue, 
  update, 
  onDisconnect 
} from "firebase/database";

// Styles and Assets
import "./BrainSettlement.css";
import background from "../../assets/brainmyst/bg.png"; 

/**
 * BrainSettlement Component
 * Finalized compact version to prevent screen overflow.
 */
export default function BrainSettlement({ 
  user, 
  roomId, 
  gameResult, 
  onBackToGame, 
  onExit 
}) {
  const [playersReady, setPlayersReady] = useState({});
  const [allReady, setAllReady] = useState(false);
  const [playersList, setPlayersList] = useState([]);
  const [spyIdentity, setSpyIdentity] = useState(null);

  // --- 1. REAL-TIME DATA SYNC ---
  useEffect(() => {
    if (!roomId) return;
    const roomRef = ref(db, `brainmyst/rooms/${roomId}`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // Identify the Spy for revelation
      if (data.spyId) {
        const spy = data.players[data.spyId];
        setSpyIdentity(spy ? spy.name : "Unknown");
      }

      // Filter and map online players
      const list = Object.entries(data.players || {}).map(([id, p]) => ({
        id,
        name: p.name,
        state: p.state || "online",
      }));
      setPlayersList(list);

      const readyData = data.playersReady || {};
      setPlayersReady(readyData);

      // Check if everyone currently online is ready
      const onlinePlayers = list.filter(p => p.state === "online").map(p => p.id);
      if (onlinePlayers.length > 0) {
        setAllReady(onlinePlayers.every(id => readyData[id] === true));
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // --- 2. REMATCH HANDLER ---
  const handlePlayAgain = async () => {
    try {
      const readyRef = ref(db, `brainmyst/rooms/${roomId}/playersReady/${user.uid}`);
      
      // Mark current user as ready
      await update(ref(db, `brainmyst/rooms/${roomId}/playersReady`), { 
        [user.uid]: true 
      });

      // If user closes tab while waiting, remove ready status so room isn't stuck
      onDisconnect(readyRef).remove();
    } catch (error) {
      console.error("Firebase Update Error:", error);
    }
  };

  // --- 3. AUTO-RESTART LOGIC ---
  useEffect(() => {
    if (allReady) {
      const transitionTimeout = setTimeout(() => {
        onBackToGame();
        // Clear ready states for the next round
        update(ref(db, `brainmyst/rooms/${roomId}`), { playersReady: {} });
      }, 1000); // 1s delay for visual feedback
      return () => clearTimeout(transitionTimeout);
    }
  }, [allReady, onBackToGame, roomId]);

  // --- 4. EXIT HANDLER ---
  const handleExit = async () => {
    try {
      await update(ref(db, `brainmyst/rooms/${roomId}/players/${user.uid}`), { 
        state: "offline" 
      });
      onExit();
    } catch (error) {
      onExit();
    }
  };

  return (
    <div 
      className="brainsettlement-wrapper" 
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="braingame-overlay"></div>

      <div className="settlement-card">
        {/* Compact Header */}
        <header className="settlement-header">
          <h1 className="result-title">{gameResult}</h1>
          {spyIdentity && (
            <div className="spy-reveal-inline">
              THE SPY WAS: <span>{spyIdentity}</span>
            </div>
          )}
        </header>

        {/* Players List with Scroll Guard */}
        <div className="settlement-players-list">
          <div className="list-header">
            <h3>CREW STATUS</h3>
            <span className="count-badge">
              {Object.keys(playersReady).length}/{playersList.filter(p => p.state === 'online').length} READY
            </span>
          </div>

          <div className="players-scroll-area">
            {playersList.map((player) => {
              if (player.state !== "online") return null;
              const isReady = playersReady[player.id];

              return (
                <div key={player.id} className={`settlement-player-row ${isReady ? "ready" : ""}`}>
                  <div className="player-info">
                    <div className={`status-dot ${isReady ? "active" : ""}`}></div>
                    <span className="player-name">
                      {player.name} {player.id === user.uid && "(YOU)"}
                    </span>
                  </div>
                  <span className="status-label">
                    {isReady ? "READY" : "WAITING"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Group */}
        <div className="settlement-actions">
          <button 
            className={`btn-rematch ${playersReady[user.uid] ? "is-waiting" : ""}`}
            onClick={handlePlayAgain} 
            disabled={playersReady[user.uid]}
          >
            {playersReady[user.uid] ? "WAITING FOR OTHERS..." : "VOTE FOR REMATCH"}
          </button>

          <button className="btn-exit" onClick={handleExit}>
            EXIT LOBBY
          </button>
        </div>
      </div>
    </div>
  );
}
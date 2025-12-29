// src/components/BrainGame/BrainGame.jsx
import React, { useEffect, useState, useRef } from "react";
import { db } from "../../firebase";
import { 
  ref, 
  onValue, 
  update, 
  push, 
  onDisconnect, 
  get 
} from "firebase/database";
import "./BrainGame.css";
import BrainSettlement from "./BrainSettlement";
import background from "../../assets/brainmyst/bg.png";

export default function BrainGame({ user, roomId, onExit }) {
  // ================= STATE MANAGEMENT =================
  const [game, setGame] = useState(null);
  const [playersList, setPlayersList] = useState([]);
  const [message, setMessage] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [timer, setTimer] = useState(15);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteStage, setVoteStage] = useState("preparation");
  const [gameEnded, setGameEnded] = useState(false);
  const [gameResult, setGameResult] = useState("");

  const intervalRef = useRef(null);
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [game?.chat]);

  // ================= LISTEN TO ROOM / GAME =================
  useEffect(() => {
    if (!roomId) return;

    const gameRef = ref(db, `brainmyst/rooms/${roomId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      setGame(data);

      const list = Object.entries(data.players || {}).map(([id, p]) => ({
        id,
        name: p.name,
        alive: p.alive,
        state: p.state || "online",
        lastSeen: p.lastSeen || 0,
      }));
      setPlayersList(list);

      setShowVoteModal(!!data.voting);
      if (data.voting) setVoteStage(data.voteStage || "preparation");

      if (data.voteStageStart) {
        const duration =
          data.voteStage === "preparation" ? 5 :
          data.voteStage === "voting" ? 30 : 10;
        const remaining = Math.max(0, Math.ceil((data.voteStageStart + duration * 1000 - Date.now()) / 1000));
        setTimer(remaining);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // ================= SET PLAYER STATUS =================
  useEffect(() => {
    if (!roomId || !user?.uid) return;
    const playerStatusRef = ref(db, `brainmyst/rooms/${roomId}/players/${user.uid}`);
    
    update(playerStatusRef, { state: "online", alive: true });
    onDisconnect(playerStatusRef).update({ state: "offline", alive: false });
    
    return () => update(playerStatusRef, { state: "offline", alive: false });
  }, [roomId, user?.uid]);

  // ================= TURN TIMER LOGIC =================
  useEffect(() => {
    if (!game || game.status !== "playing") return;
    clearInterval(timerRef.current);

    const alive = playersList.filter(p => p.alive);
    const turnsTaken = game.turnsTaken || {};
    const everyonePlayed = alive.every(p => turnsTaken[p.id]);

    if (everyonePlayed && !game.voting) {
      const now = Date.now();
      update(ref(db, `brainmyst/rooms/${roomId}`), { 
        voting: true, 
        voteStage: "preparation", 
        votes: {}, 
        voteStageStart: now 
      });
      setShowVoteModal(true);
      setVoteStage("preparation");
      return;
    }

    if (!game.voting && game.currentTurn === user.uid) {
      setTimer(15);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            moveToNextTurn();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [game, user.uid, playersList]);

  // ================= ACTION HANDLERS =================
  const sendMessage = async () => {
    if (!message.trim()) return;
    if (showVoteModal && voteStage !== "result") return;

    await push(ref(db, `brainmyst/rooms/${roomId}/chat`), {
      uid: user.uid,
      name: user.displayName,
      text: message,
      time: Date.now(),
    });

    setMessage("");
    if (!showVoteModal && game.currentTurn === user.uid) moveToNextTurn();
  };

  const moveToNextTurn = async () => {
    const alive = playersList.filter(p => p.alive);
    if (!alive.length) return;

    const turnsTakenRef = ref(db, `brainmyst/rooms/${roomId}/turnsTaken`);
    await update(turnsTakenRef, { [user.uid]: true });

    const snapshot = await get(turnsTakenRef);
    const turnsTaken = snapshot.val() || {};
    const everyonePlayed = alive.every(p => turnsTaken[p.id]);

    if (everyonePlayed) {
        // ⏳ Silent reading time (no state change)
        setTimer(PRE_VOTE_DELAY);
      
        setTimeout(async () => {
          await update(ref(db, `brainmyst/rooms/${roomId}`), {
            voting: true,
            voteStage: "preparation",
            voteStageStart: Date.now(),
          });
        }, PRE_VOTE_DELAY * 1000);
      
        return;
      }
      

    const currentIndex = alive.findIndex(p => p.id === game.currentTurn);
    const nextTurn = alive[(currentIndex + 1) % alive.length];
    await update(ref(db, `brainmyst/rooms/${roomId}`), { currentTurn: nextTurn.id });
  };

  const votePlayer = async (targetId) => {
    if (hasVoted) return;
    const alive = playersList.filter(p => p.alive);
    if (!alive.find(p => p.id === user.uid)) return;

    await update(ref(db, `brainmyst/rooms/${roomId}/votes`), { [user.uid]: targetId });
    setHasVoted(true);
  };

  // ================= VOTE STAGE TICKER =================
  useEffect(() => {
    if (!showVoteModal) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      if (!game) return;

      const stage = game.voteStage || "preparation";
      const stageStart = game.voteStageStart || Date.now();
      const duration = stage === "preparation" ? 5 : stage === "voting" ? 30 : 10;
      const elapsed = Math.floor((Date.now() - stageStart) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setTimer(remaining);

      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        const now = Date.now();
        if (stage === "preparation") {
          await update(ref(db, `brainmyst/rooms/${roomId}`), { voteStage: "voting", voteStageStart: now });
        } else if (stage === "voting") {
          await update(ref(db, `brainmyst/rooms/${roomId}`), { voteStage: "result", voteStageStart: now });
        } else if (stage === "result") {
          resetRound();
        }
      }
    }, 500);

    return () => clearInterval(intervalRef.current);
  }, [showVoteModal, game]);
// ================= PRE-VOTE LISTENER (SYNCED) =================
useEffect(() => {
    if (!game?.preVoteStart || game.voting) return;
  
    startPreVoteCountdown(game.preVoteStart);
  
    return () => clearInterval(intervalRef.current);
  }, [game?.preVoteStart, game?.voting]);
  
  // ================= GAME LOGIC PROCESSING =================
  useEffect(() => {
    if (!game?.votes || voteStage !== "result") return;

    const votes = game.votes || {};
    const votedPlayers = Object.keys(votes).filter(k => votes[k] && votes[k] !== "skip");
    if (!votedPlayers.length) return;

    const tally = {};
    Object.values(votes).forEach(v => { 
      if (v && v !== "skip") tally[v] = (tally[v] || 0) + 1; 
    });

    const majority = Math.ceil(votedPlayers.length / 2);
    const sortedTally = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    const [kickedId, count] = sortedTally[0] || [];

    if (count >= majority) kickPlayer(kickedId);
  }, [game?.votes, voteStage]);

  const kickPlayer = async (playerId) => {
    await update(ref(db, `brainmyst/rooms/${roomId}/players/${playerId}`), { alive: false });
    const remainingAlive = playersList.filter(p => p.alive && p.id !== playerId);

    if (playerId === game.spyId) {
      setGameResult("🎉 The Spy was caught! Innocents win!");
      setGameEnded(true);
      return;
    }

    if (remainingAlive.length <= 2) {
      setGameResult("🕵️ The Spy has infiltrated successfully. Spy wins!");
      setGameEnded(true);
      return;
    }
  };

  const resetRound = async () => {
    const alive = playersList.filter(p => p.alive);
    if (!alive.length) return;

    await update(ref(db, `brainmyst/rooms/${roomId}`), {
        round: (game.round || 1) + 1,
        voting: false,
        voteStage: "preparation",
        votes: {},
        turnsTaken: {},
        preVoteStart: null, // 👈 add this
        currentTurn: alive[0].id,
        turnStart: Date.now(),
      });

    setHasVoted(false);
    setShowVoteModal(false);
    setVoteStage("preparation");
    setTimer(15);
  };

  const handlePlayAgain = async () => {
    const onlinePlayers = playersList.filter(p => p.state === "online");
    if (!onlinePlayers.length) return;
    
    const randomSpy = onlinePlayers[Math.floor(Math.random() * onlinePlayers.length)];
    const newPlayersState = {};
    
    playersList.forEach(p => {
      newPlayersState[p.id] = { ...p, alive: true, state: "online" };
    });
  
    await update(ref(db, `brainmyst/rooms/${roomId}`), {
      round: 1,
      currentTurn: onlinePlayers[0].id,
      voting: false,
      voteStage: "preparation",
      votes: {},
      turnsTaken: {},
      spyId: randomSpy.id,
      chat: {},
      status: "playing",
      players: newPlayersState,
    });
  
    setHasVoted(false);
    setShowVoteModal(false);
    setGameEnded(false);
    setGameResult("");
    setTimer(15);
  };
  
  if (!game) return <div className="braingame-loading">Entering the Realm...</div>;

  if (gameEnded) {
    return (
      <BrainSettlement
        user={user}
        roomId={roomId}
        gameResult={gameResult}
        onBackToGame={handlePlayAgain}
        onExit={onExit}
      />
    );
  }

  const isSpy = game.spyId === user.uid;
  const alivePlayers = playersList.filter(p => p.alive);
  const currentTurnPlayer = playersList.find(p => p.id === game.currentTurn);
  const chatList = game.chat ? Object.entries(game.chat).map(([k, v]) => ({ id: k, ...v })) : [];

  return (
    <div className="braingame-wrapper" style={{ backgroundImage: `url(${background})` }}>      
      <div className="braingame-overlay"></div>
      
      <div className="braingame-content">
        <header className="braingame-header">
          <h1>ROUND {game.round || 1}</h1>
          <div className="braingame-players-grid">
            {playersList.map(p => (
              <div key={p.id} className={`braingame-player-card ${p.id === game.currentTurn ? "active-turn" : ""} ${!p.alive ? "is-dead" : ""}`}>
                {p.name}
              </div>
            ))}
          </div>
        </header>

        <div className="braingame-main-layout">
          {/* Side Panel: Topic & Player Info */}
          <div className="braingame-side-panel">
            <div className="braingame-info-card">
              <p>PLAYER: <span>{user.displayName} {isSpy && <span className="spy-tag">(SPY)</span>}</span></p>
              <p>TOPIC: <span>{isSpy ? "???" : game.topic}</span></p>
              <p>ALIVE: <span>{alivePlayers.length} / {playersList.length}</span></p>
              
              <div className="turn-indicator-box">
                <strong>TURN:</strong>
                <h3>{currentTurnPlayer?.name || "Waiting..."}</h3>
                {!showVoteModal && game.currentTurn === user.uid && (
                   <div className="timer-flash">{timer}s</div>
                )}
              </div>
            </div>

            <button className="braingame-exit-btn" onClick={onExit}>EXIT LOBBY</button>
          </div>

          {/* Chat Panel: The Chat and Input Box */}
          <div className="braingame-chat-container">
            <div className="braingame-chat-box">
              {chatList.length === 0 && <p className="empty-chat">The forest is silent...</p>}
              {chatList.map(c => (
                <div key={c.id} className="chat-message">
                  <span className="chat-author">{c.name}:</span>
                  <span className="chat-text">{c.text}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {!showVoteModal && game.currentTurn === user.uid && (
              <div className="braingame-input-area">
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={`Describe topic... (${timer}s)`}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  autoFocus
                />
                <button onClick={sendMessage}>SEND</button>
              </div>
            )}
          </div>
        </div>

        {showVoteModal && (
            <div
                className={`vote-modal-backdrop ${
                    game?.voteStage === "preparation" ? "reading" : ""
                }`}
                >
            <div className="vote-modal-content">
              <h2 className={voteStage === "voting" ? "danger-text" : ""}>
                {voteStage === "preparation" && "PREPARING TO VOTE"}
                {voteStage === "voting" && "EXPOSE THE SPY"}
                {voteStage === "result" && "THE VERDICT"}
              </h2>
              <p className="vote-timer">REMAINING: {timer}s</p>
              {voteStage === "voting" && (
                <div className="vote-options">
                  <div className="vote-buttons-grid">
                    {alivePlayers.map(p => (
                      <button key={p.id} disabled={hasVoted || p.id === user.uid} onClick={() => votePlayer(p.id)} className="vote-btn">{p.name}</button>
                    ))}
                    <button disabled={hasVoted} onClick={() => votePlayer("skip")} className="vote-btn skip">SKIP</button>
                  </div>
                </div>
              )}
              {voteStage === "result" && (
                <div className="vote-results-list">
                  {alivePlayers.map(p => {
                    const count = Object.values(game.votes || {}).filter(v => v === p.id).length;
                    return (
                      <div key={p.id} className="result-row">
                        <span>{p.name}</span>
                        <span className="vote-count">{count} VOTES</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
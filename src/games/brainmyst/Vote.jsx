import React, { useState, useEffect, useRef } from "react";
import "./Vote.css";

export default function VoteModal({
  alivePlayers,
  votePlayer,
  hasVoted,
  chatList = [],
  sendChat,
  votesData = {},
  onStageEnd,
}) {
  const [stage, setStage] = useState("preparation");
  const [timer, setTimer] = useState(30);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const intervalRef = useRef(null);

  // ================= STAGE TIMER =================
  useEffect(() => {
    // Clear previous interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Set initial timer based on stage
    if (stage === "preparation") setTimer(30);
    if (stage === "voting") setTimer(30);
    if (stage === "result") setTimer(10);

    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        let newTime = t - 1;

        if (stage === "voting") {
          const aliveIds = alivePlayers.map((p) => p.id);
          const votedIds = Object.keys(votesData || {});
          const everyoneVoted = aliveIds.every((id) => votedIds.includes(id));

          // Fast-forward to 3 seconds if all voted
          if (everyoneVoted && t > 3) newTime = 3;
        }

        if (newTime <= 0) {
          clearInterval(intervalRef.current);
          if (stage === "preparation") setStage("voting");
          else if (stage === "voting") setStage("result");
          else if (stage === "result" && onStageEnd) onStageEnd();
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [stage]); // only re-run when stage changes

  // ================= CHAT HANDLER =================
  const handleSend = () => {
    if (!chatMessage.trim()) return;
    sendChat(chatMessage);
    setChatMessage("");
  };

  const votingDisabled = stage !== "voting" || hasVoted;

  const tally = {};
  Object.values(votesData || {}).forEach((v) => {
    tally[v] = (tally[v] || 0) + 1;
  });

  return (
    <div className="vote-modal-backdrop">
      <div className="vote-modal">
        <h2>
          {stage === "preparation" && "Preparation Stage"}
          {stage === "voting" && "Voting Stage"}
          {stage === "result" && "Result Stage"}
        </h2>
        <p>Time remaining: {timer}s</p>

        {stage === "voting" && (
          <>
            <p>Select a player to vote or skip.</p>
            <div className="vote-buttons">
              {alivePlayers.map((p) => (
                <button
                  key={p.id}
                  disabled={votingDisabled}
                  onClick={() => votePlayer(p.id)}
                  className="vote-button"
                >
                  {p.name}
                </button>
              ))}
              <button
                disabled={votingDisabled}
                onClick={() => votePlayer("skip")}
                className="vote-button skip-button"
              >
                Skip
              </button>
            </div>
            {hasVoted && <p className="vote-message">Waiting for other players...</p>}
          </>
        )}

        {stage === "result" && (
          <div className="vote-results">
            <h3>Votes:</h3>
            {alivePlayers.map((p) => (
              <p key={p.id}>
                {p.name}: {tally[p.id] || 0} votes
              </p>
            ))}
            <p>Skip: {tally["skip"] || 0} votes</p>
          </div>
        )}

        {/* CHAT */}
        <button
          className="toggle-chat-button"
          onClick={() => setShowChat((prev) => !prev)}
        >
          {showChat ? "Hide Chat" : "Show Chat"}
        </button>

        {showChat && (
          <div className="vote-chat">
            <div className="chat-list">
              {chatList.map((c) => (
                <div key={c.id} className="chat-item">
                  <strong>{c.name}:</strong> {c.text}
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button onClick={handleSend}>Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

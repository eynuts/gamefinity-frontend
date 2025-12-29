// src/home/Subscription.jsx
import React, { useState, useEffect } from "react";
import monthlyQR from "../assets/monthly.png";
import yearlyQR from "../assets/yearly.png";
import { db, auth } from "../firebase";
import { ref, set, onValue, update, get } from "firebase/database";
import "./Subscription.css";
import { 
  FaCheckCircle, 
  FaClock, 
  FaCreditCard, 
  FaRocket, 
  FaChevronRight, 
  FaArrowLeft 
} from "react-icons/fa";

export default function Subscription({ show, onClose }) {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState("monthly");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const monthlyPrice = 150;
  const yearlyPrice = 1620; // 10% discount

  // Admin UID (set your admin UID here)
  const ADMIN_UID = "admin_uid_here";

  // Format countdown
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    let unsubscribeSub;
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);

        // Admin is always approved
        if (user.uid === ADMIN_UID) {
          setSubscriptionStatus("approved");
          setTimeLeft(null); // no countdown
          return;
        }

        const subRef = ref(db, "subscriptions/" + user.uid);

        unsubscribeSub = onValue(subRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setSubscriptionStatus(data.status || "pending");

            // Handle countdown only for non-admin
            if (data.status === "approved" && data.date && data.plan) {
              const startDate = new Date(data.date);
              const duration = data.plan === "monthly" ? 30 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000;
              const endDate = new Date(startDate.getTime() + duration);

              const updateCountdown = () => {
                const now = new Date();
                const diff = endDate - now;
                if (diff > 0) {
                  setTimeLeft(diff);
                } else {
                  setTimeLeft(0);
                  setSubscriptionStatus("expired");
                  update(ref(db, "subscriptions/" + user.uid), { status: "expired" });
                }
              };

              updateCountdown();
              const interval = setInterval(updateCountdown, 1000);
              return () => clearInterval(interval);
            }
          } else {
            setSubscriptionStatus(null);
          }
        });
      }
    });

    return () => {
      if (unsubscribeSub) unsubscribeSub();
      unsubscribeAuth();
    };
  }, []);

  const handleSubmit = async () => {
    if (!reference.trim()) {
      setMessage("⚠️ Please enter your transaction reference number.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await set(ref(db, "subscriptions/" + userId), {
        plan,
        reference,
        date: new Date().toISOString(),
        status: "pending",
      });
      setSubscriptionStatus("pending");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to save. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  // Approved view with countdown (or forever for admin)
  if (subscriptionStatus === "approved") {
    return (
      <div className="sub-modal-overlay">
        <div className="sub-modal-container status-view">
          <FaCheckCircle className="status-icon success" />
          <h2 className="sub-title">Premium Active</h2>
          <p className="sub-subtitle">Welcome to the inner circle! Your pro features are now unlocked.</p>
          {userId !== ADMIN_UID && timeLeft !== null && (
            <p className="sub-countdown">
              Time left: <strong>{formatTime(timeLeft)}</strong>
            </p>
          )}
          <button className="btn-primary-custom" onClick={onClose}>Start Playing</button>
        </div>
      </div>
    );
  }

  // Expired view (only for non-admin)
  if (subscriptionStatus === "expired") {
    return (
      <div className="sub-modal-overlay">
        <div className="sub-modal-container status-view">
          <FaClock className="status-icon expired" />
          <h2 className="sub-title">Subscription Expired</h2>
          <p className="sub-subtitle">Your subscription has ended. Renew now to continue accessing premium features.</p>
          <button className="btn-primary-custom" onClick={() => setStep(1)}>Renew</button>
        </div>
      </div>
    );
  }

  // Pending view
  if (subscriptionStatus === "pending") {
    return (
      <div className="sub-modal-overlay">
        <div className="sub-modal-container status-view">
          <div className="loader-ring">
            <FaClock className="status-icon pending" />
          </div>
          <h2 className="sub-title">Verifying Payment</h2>
          <p className="sub-subtitle">Our team is checking your reference <strong>#{reference}</strong>. This usually takes a few minutes.</p>
          <button className="btn-secondary-custom" onClick={onClose}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // Plan selection & payment view
  return (
    <div className="sub-modal-overlay">
      <div className="sub-modal-container">
        <button className="sub-close-btn" onClick={onClose}>&times;</button>

        <div className="sub-header">
          <FaRocket className="rocket-icon" />
          <h2 className="sub-title">Choose Your Plan</h2>
          <div className="step-dots">
            <div className={`dot ${step === 1 ? "active" : ""}`}></div>
            <div className={`dot ${step === 2 ? "active" : ""}`}></div>
          </div>
        </div>

        {step === 1 ? (
          <div className="step-fade-in">
            <div className="sub-plan-grid">
              <div
                className={`sub-plan-card ${plan === "monthly" ? "active" : ""}`}
                onClick={() => setPlan("monthly")}
              >
                <div className="plan-check"><FaCheckCircle /></div>
                <span className="plan-label">Monthly</span>
                <div className="plan-price">₱{monthlyPrice}<span>/mo</span></div>
                <p className="plan-desc">Perfect for trying out all premium features.</p>
              </div>

              <div
                className={`sub-plan-card ${plan === "yearly" ? "active" : ""}`}
                onClick={() => setPlan("yearly")}
              >
                <div className="badge-save">Save 10%</div>
                <div className="plan-check"><FaCheckCircle /></div>
                <span className="plan-label">Annually</span>
                <div className="plan-price">₱{yearlyPrice}<span>/yr</span></div>
                <p className="plan-desc">The best value for serious competitors.</p>
              </div>
            </div>
            
            <button className="btn-primary-custom btn-full" onClick={() => setStep(2)}>
              Next Step <FaChevronRight />
            </button>
          </div>
        ) : (
          <div className="step-fade-in">
            <div className="payment-summary">
              <button className="btn-back-step" onClick={() => setStep(1)}>
                <FaArrowLeft /> Change Plan
              </button>
              <div className="summary-pill">
                Selected: <strong>{plan.charAt(0).toUpperCase() + plan.slice(1)}</strong>
              </div>
            </div>

            <div className="sub-qr-section">
              <div className="qr-wrapper">
                <img
                  src={plan === "monthly" ? monthlyQR : yearlyQR}
                  alt="GCash QR Code"
                  className="sub-qr-image"
                />
              </div>
              <p className="sub-qr-instruction">
                Scan QR to pay <span className="highlight-price">₱{plan === "monthly" ? monthlyPrice : yearlyPrice}</span>
              </p>
            </div>

            <div className="sub-input-group">
              <label htmlFor="refInput"><FaCreditCard /> Reference Number</label>
              <input
                id="refInput"
                type="text"
                placeholder="Enter 13-digit GCash Ref #"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            {message && (
              <div className={`sub-message ${message.includes("✅") ? "success" : "error"}`}>
                {message}
              </div>
            )}

            <div className="sub-actions">
              <button
                className="btn-primary-custom"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Processing..." : "Complete Upgrade"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// src/admin/AdminSubscription.jsx
import React, { useState, useEffect, useMemo } from "react";
import "./AdminSubscription.css";
import { 
  FaCheck, 
  FaTimes, 
  FaSearch, 
  FaUndo, 
  FaHourglassHalf, 
  FaCheckCircle, 
  FaTimesCircle 
} from "react-icons/fa";
import { db } from "../firebase";
import { ref, get, update } from "firebase/database";

const AdminSubscription = ({ subscriptions, setSubscriptions }) => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [subsWithUserInfo, setSubsWithUserInfo] = useState([]);
  const [activeTab, setActiveTab] = useState("pending"); // Options: "pending", "approved", "rejected"

  // Fetch detailed user info from Firebase
  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      setLoading(true);
      try {
        const detailedSubs = await Promise.all(
          subscriptions.map(async (sub) => {
            const userRef = ref(db, `users/${sub.uid}`);
            const snapshot = await get(userRef);
            const userData = snapshot.exists() ? snapshot.val() : {};
            return {
              ...sub,
              name: userData.name || "Unknown",
              email: userData.email || "Unknown",
              status: sub.status || "pending",
              approvedDate: sub.approvedDate || null,
              declinedDate: sub.declinedDate || null,
            };            
          })
        );
        setSubsWithUserInfo(detailedSubs);
      } catch (err) {
        console.error("Failed to fetch subscription user info:", err);
      } finally {
        setLoading(false);
      }
    };

    if (subscriptions.length > 0) fetchSubscriptionDetails();
  }, [subscriptions]);

  // Email Notification Logic
  const sendEmail = async (email, subject, message) => {
    try {
      const res = await fetch("http://localhost:5000/send-subscription-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, subject, message }),
      });
      if (!res.ok) throw new Error("Email service unreachable");
    } catch (err) {
      console.error("Email Error:", err);
    }
  };

  // Professional Email Templates based on status changes
  const getEmailContent = (newStatus, sub) => {
    const templates = {
      approved: {
        subject: "🎉 Subscription Approved!",
        message: `Dear ${sub.name},\n\nYour subscription to the ${sub.plan} plan is now active. You have full access to all features.\n\nBest regards,\nAdmin Team`
      },
      rejected: {
        subject: "Subscription Status Update",
        message: `Dear ${sub.name},\n\nWe were unable to verify your payment for the ${sub.plan} plan at this time. Please check your transaction details and try again.\n\nBest regards,\nAdmin Team`
      },
      pending: {
        subject: "Subscription Under Review",
        message: `Dear ${sub.name},\n\nYour subscription for ${sub.plan} has been moved back to 'Under Review' status. We will notify you once the verification is complete.`
      }
    };
    return templates[newStatus];
  };

  // Main Status Update Function
  const updateStatus = async (uid, newStatus) => {
    try {
      const sub = subsWithUserInfo.find(s => s.uid === uid);
      if (!sub) return;

      const now = new Date().toISOString();
      const updateData = { status: newStatus };

      if (newStatus === "approved") updateData.approvedDate = now;
      if (newStatus === "rejected") updateData.declinedDate = now;
      if (newStatus === "pending") {
        updateData.approvedDate = null;
        updateData.declinedDate = null;
      }

      // Update Firebase
      await update(ref(db, `subscriptions/${uid}`), updateData);

      // Local State Update
      const updater = prev => prev.map(s => (s.uid === uid ? { ...s, ...updateData } : s));
      setSubsWithUserInfo(updater);
      setSubscriptions(updater);

      // Trigger Email
      const email = getEmailContent(newStatus, sub);
      if (email) await sendEmail(sub.email, email.subject, email.message);
    } catch (err) {
      console.error("Status Update Failed:", err);
    }
  };

  // Filter logic for Tabs + Search Bar
  const filteredSubs = useMemo(() => {
    return subsWithUserInfo.filter(sub =>
      sub.status === activeTab &&
      (sub.name.toLowerCase().includes(search.toLowerCase()) ||
       sub.email.toLowerCase().includes(search.toLowerCase()))
    );
  }, [subsWithUserInfo, search, activeTab]);

  // Unified Table Component
  const renderTable = () => (
    <div className="table-main-wrapper">
      <table className="subs-table">
        <thead>
          <tr>
            <th>User Details</th>
            <th>Plan Info</th>
            <th>{activeTab === 'pending' ? 'Request Date' : 'Action Date'}</th>
            <th className="text-right">Quick Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredSubs.length === 0 ? (
            <tr><td colSpan="4" className="empty-msg">No {activeTab} requests found.</td></tr>
          ) : (
            filteredSubs.map(sub => (
              <tr key={sub.uid} className="fade-in-row">
                <td>
                  <div className="user-cell">
                    <span className="user-name">{sub.name}</span>
                    <span className="user-email">{sub.email}</span>
                  </div>
                </td>
                <td>
                  <span className={`plan-badge ${sub.plan?.toLowerCase()}`}>{sub.plan}</span>
                </td>
                <td className="date-cell">
                  {sub.status === "approved" ? new Date(sub.approvedDate).toLocaleDateString() : 
                   sub.status === "rejected" ? new Date(sub.declinedDate).toLocaleDateString() : 
                   "Awaiting Review"}
                </td>
                <td className="actions-cell">
                  {activeTab === "pending" && (
                    <>
                      <button className="btn-icon approve" title="Approve" onClick={() => updateStatus(sub.uid, "approved")}><FaCheck /></button>
                      <button className="btn-icon decline" title="Decline" onClick={() => updateStatus(sub.uid, "rejected")}><FaTimes /></button>
                    </>
                  )}
                  {activeTab === "approved" && (
                    <>
                      <button className="btn-icon undo" title="Return to Pending" onClick={() => updateStatus(sub.uid, "pending")}><FaUndo /></button>
                      <button className="btn-icon decline" title="Decline Access" onClick={() => updateStatus(sub.uid, "rejected")}><FaTimes /></button>
                    </>
                  )}
                  {activeTab === "rejected" && (
                    <button className="btn-icon undo" title="Review Again" onClick={() => updateStatus(sub.uid, "pending")}><FaUndo /></button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="admin-subs-container">
      <header className="subs-header">
        <div className="header-main-group">
          <div className="header-text">
            <h2>Subscription Management</h2>
            <p>Verification and User Access Control</p>
          </div>
          
          <div className="status-toggle-bar">
            <button 
              className={`toggle-tab ${activeTab === 'pending' ? 'active pending' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <FaHourglassHalf /> Pending 
              <span className="badge-count">{subsWithUserInfo.filter(s => s.status === 'pending').length}</span>
            </button>
            <button 
              className={`toggle-tab ${activeTab === 'approved' ? 'active approved' : ''}`}
              onClick={() => setActiveTab('approved')}
            >
              <FaCheckCircle /> Active 
              <span className="badge-count">{subsWithUserInfo.filter(s => s.status === 'approved').length}</span>
            </button>
            <button 
              className={`toggle-tab ${activeTab === 'rejected' ? 'active rejected' : ''}`}
              onClick={() => setActiveTab('rejected')}
            >
              <FaTimesCircle /> Declined 
              <span className="badge-count">{subsWithUserInfo.filter(s => s.status === 'rejected').length}</span>
            </button>
          </div>
        </div>

        <div className="search-box-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </header>

      {loading ? (
        <div className="loading-overlay">
          <div className="loader-ring"></div>
          <p>Syncing Live Subscriptions...</p>
        </div>
      ) : (
        <div className="subs-view-area">
          {renderTable()}
        </div>
      )}
    </div>
  );
};

export default AdminSubscription;
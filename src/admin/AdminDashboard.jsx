// src/admin/AdminDashboard.jsx
import React, { useMemo } from "react";
import { 
  FaUsers, 
  FaUserPlus, 
  FaCalendarCheck, 
  FaCalendarAlt,
  FaFileInvoiceDollar, 
  FaHourglassHalf, 
  FaCheckCircle, 
  FaTimesCircle,
  FaWallet, 
  FaChartLine 
} from "react-icons/fa";
import "./AdminDashboard.css";

const AdminDashboard = ({ user, userStats, subscriptions }) => {
  // -----------------------------
  // DATE HELPERS
  // -----------------------------
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // -----------------------------
  // SUBSCRIPTION + REVENUE STATS
  // -----------------------------
  const stats = useMemo(() => {
    const PRICE_MONTHLY = 150;
    const PRICE_ANNUAL = 1690;
  
    let dailyRevenue = 0;
    let monthlyRevenue = 0;
    let yearlyRevenue = 0;
  
    let pending = 0;
    let approved = 0;
    let rejected = 0;
  
    subscriptions.forEach(sub => {
      const amount = sub.plan?.toLowerCase() === "monthly" ? PRICE_MONTHLY : PRICE_ANNUAL;
      const status = sub.status || "pending";
      const date = sub.approvedDate ? new Date(sub.approvedDate) : null;
  
      if (status === "approved") {
        approved++;
        if (date && date >= startOfDay) dailyRevenue += amount;
        if (date && date >= startOfMonth) monthlyRevenue += amount;
        if (date && date >= startOfYear) yearlyRevenue += amount;
      }
  
      if (status === "pending") pending++;
      if (status === "rejected") rejected++;
    });
  
    return {
      totalSubs: subscriptions.length,
      pending,
      approved,
      rejected,
      dailyRevenue,
      monthlyRevenue,
      yearlyRevenue
    };
  }, [subscriptions, startOfDay, startOfMonth, startOfYear]);
  
  return (
    <div className="dashboard-container">
      {/* HEADER SECTION */}
      <header className="dashboard-top-nav">
        <div className="welcome-text">
          <h1>System Overview</h1>
          <p>Welcome back, <span>{user?.displayName || "Arvin Candari"}</span> 👋</p>
        </div>
        <div className="date-display">
          {now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </div>
      </header>

      {/* 1. USER ANALYTICS SECTION */}
      <section className="dashboard-grid-section">
        <div className="section-header">
          <FaUsers /> <span>User Analytics</span>
        </div>
        <div className="compact-grid">
          <div className="c-card blue-gradient">
            <div className="c-icon-wrapper">
              <FaUsers />
            </div>
            <div className="c-info">
              <label>Total Users</label>
              <strong>{userStats.totalUsers.toLocaleString()}</strong>
            </div>
          </div>

          <div className="c-card">
            <div className="c-icon-wrapper gray">
              <FaUserPlus />
            </div>
            <div className="c-info">
              <label>New Today</label>
              <strong>{userStats.daily}</strong>
            </div>
          </div>

          <div className="c-card">
            <div className="c-icon-wrapper gray">
              <FaCalendarCheck />
            </div>
            <div className="c-info">
              <label>This Month</label>
              <strong>{userStats.monthly}</strong>
            </div>
          </div>

          <div className="c-card">
            <div className="c-icon-wrapper gray">
              <FaCalendarAlt />
            </div>
            <div className="c-info">
              <label>This Year</label>
              <strong>{userStats.yearly}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LOWER ROW: REVENUE & SUBSCRIPTIONS */}
      <div className="dashboard-lower-row">
        
        {/* REVENUE PERFORMANCE */}
        <div className="revenue-split">
          <div className="section-header">
            <FaWallet /> <span>Revenue Performance</span>
          </div>
          <div className="revenue-grid">
            <div className="rev-card">
              <div className="rev-icon-circle">
                <FaWallet />
              </div>
              <div className="rev-details">
                <label>Daily Earnings</label>
                <p>₱{stats.dailyRevenue.toLocaleString()}</p>
              </div>
            </div>

            <div className="rev-card">
              <div className="rev-icon-circle blue-icon">
                <FaChartLine />
              </div>
              <div className="rev-details">
                <label>Monthly Earnings</label>
                <p>₱{stats.monthlyRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* SUBSCRIPTION STATUS */}
        <div className="subs-split">
          <div className="section-header">
            <FaFileInvoiceDollar /> <span>Subscriptions</span>
          </div>
          <div className="subs-status-container">
            <div className="status-pill warning">
              <div className="pill-left">
                <FaHourglassHalf />
                <span>Pending</span>
              </div>
              <strong>{stats.pending}</strong>
            </div>

            <div className="status-pill success">
              <div className="pill-left">
                <FaCheckCircle />
                <span>Approved</span>
              </div>
              <strong>{stats.approved}</strong>
            </div>

            <div className="status-pill danger">
              <div className="pill-left">
                <FaTimesCircle />
                <span>Rejected</span>
              </div>
              <strong>{stats.rejected}</strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
// src/admin/Admin.jsx
import React, { useEffect, useState } from "react";
import "./admin.css";
import {
  FaHome,
  FaTachometerAlt,
  FaUsers,
  FaFileInvoiceDollar,
  FaBars,
  FaTimes,
  FaMoneyBillWave,
  FaGamepad
} from "react-icons/fa";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

// Import admin sections
import AdminDashboard from "./AdminDashboard";
import AdminUser from "./AdminUser";
import AdminSubscription from "./AdminSubscription";
import AdminRevenue from "./AdminRevenue";
import AdminGame from "./AdminGame"; // Game Analytics panel

// ✅ Updated prop name to match Home.jsx
const Admin = ({ user, onExit }) => {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    daily: 0,
    monthly: 0,
    yearly: 0
  });
  const [loading, setLoading] = useState(true);

  // --- Fetch users and subscriptions ---
  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribeUsers = onValue(usersRef, snapshot => {
      const data = snapshot.val() || {};
      const usersList = Object.keys(data).map(uid => ({
        uid,
        ...data[uid]
      }));
      setUsers(usersList);

      // Compute user stats
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      const daily = usersList.filter(u => new Date(u.firstLogin) >= startOfDay).length;
      const monthly = usersList.filter(u => new Date(u.firstLogin) >= startOfMonth).length;
      const yearly = usersList.filter(u => new Date(u.firstLogin) >= startOfYear).length;

      setUserStats({ totalUsers: usersList.length, daily, monthly, yearly });
      setLoading(false);
    });

    const subsRef = ref(db, "subscriptions");
    const unsubscribeSubs = onValue(subsRef, snapshot => {
      const data = snapshot.val() || {};
      const subsList = Object.keys(data).map(uid => ({
        uid,
        ...data[uid]
      }));
      setSubscriptions(subsList);
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeSubs();
    };
  }, []);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <div className="admin-container">
      {!sidebarOpen && (
        <button className="floating-burger" onClick={toggleSidebar} title="Open Menu">
          <FaBars />
        </button>
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">Admin Panel</div>
          <button className="admin-sidebar-burger" onClick={toggleSidebar} title="Close Menu">
            <FaTimes />
          </button>
        </div>

        <nav className="admin-sidebar-menu">
          <div className="menu-items">
            <button
              className={activeMenu === "dashboard" ? "admin-active-menu" : ""}
              onClick={() => setActiveMenu("dashboard")}
            >
              <FaTachometerAlt /> <span>Dashboard</span>
            </button>

            <button
              className={activeMenu === "subscriptions" ? "admin-active-menu" : ""}
              onClick={() => setActiveMenu("subscriptions")}
            >
              <FaFileInvoiceDollar /> <span>Subscriptions</span>
            </button>

            <button
              className={activeMenu === "revenue" ? "admin-active-menu" : ""}
              onClick={() => setActiveMenu("revenue")}
            >
              <FaMoneyBillWave /> <span>Revenue</span>
            </button>

            <button
              className={activeMenu === "games" ? "admin-active-menu" : ""}
              onClick={() => setActiveMenu("games")}
            >
              <FaGamepad /> <span>Games</span>
            </button>

            <button
              className={activeMenu === "users" ? "admin-active-menu" : ""}
              onClick={() => setActiveMenu("users")}
            >
              <FaUsers /> <span>Users</span>
            </button>
          </div>

          <div className="sidebar-footer">
            {/* ✅ Use onExit prop from Home.jsx */}
            <button className="admin-home-btn" onClick={onExit}>
              <FaHome /> Back to Home
            </button>
          </div>
        </nav>
      </aside>

      <main className="admin-main">
        <div className="admin-content-body">
          {loading ? (
            <p>Loading admin data...</p>
          ) : (
            <>
              {activeMenu === "dashboard" && (
                <AdminDashboard user={user} userStats={userStats} subscriptions={subscriptions} />
              )}
              {activeMenu === "subscriptions" && (
                <AdminSubscription subscriptions={subscriptions} setSubscriptions={setSubscriptions} />
              )}
              {activeMenu === "users" && (
                <AdminUser users={users} setUsers={setUsers} />
              )}
              {activeMenu === "revenue" && <AdminRevenue />}
              {activeMenu === "games" && <AdminGame users={users} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;

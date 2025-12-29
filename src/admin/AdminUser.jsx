// src/admin/AdminUser.jsx
import React, { useState, useMemo } from "react";
import "./AdminUser.css";
import { 
  FaTrash, 
  FaUserShield, 
  FaUserEdit, 
  FaSearch, 
  FaUsers, 
  FaShieldAlt,
  FaCalendarAlt 
} from "react-icons/fa";
import { ref, update, remove } from "firebase/database";
import { db } from "../firebase";

const AdminUser = ({ users, setUsers }) => {
  const [search, setSearch] = useState("");

  // Memoized filter for performance
  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  // Stats calculation for the header
  const stats = {
    total: users.length,
    admins: users.filter(u => u.isAdmin).length,
    recent: users.filter(u => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(u.firstLogin) > weekAgo;
    }).length
  };

  const handleDelete = async (uid) => {
    if (window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) {
      try {
        await remove(ref(db, "users/" + uid));
        setUsers(users.filter((u) => u.uid !== uid));
      } catch (err) {
        console.error("Delete error:", err);
        alert("❌ Error removing user from database.");
      }
    }
  };

  const toggleAdmin = async (uid) => {
    const user = users.find((u) => u.uid === uid);
    if (!user) return;

    const newStatus = !user.isAdmin;
    const originalUsers = [...users];

    // Optimistic Update
    setUsers(users.map((u) => u.uid === uid ? { ...u, isAdmin: newStatus } : u));

    try {
      await update(ref(db, "users/" + uid), { isAdmin: newStatus });
    } catch (err) {
      console.error("Update error:", err);
      setUsers(originalUsers); // Revert on failure
      alert("❌ Failed to update permissions.");
    }
  };

  return (
    <div className="admin-user-container">
      <header className="user-header">
        <div className="header-left">
          <h2>User Management</h2>
          <div className="user-stats-bar">
            <div className="stat-item">
              <FaUsers className="icon" />
              <span><strong>{stats.total}</strong> Total Users</span>
            </div>
            <div className="stat-item">
              <FaShieldAlt className="icon admin" />
              <span><strong>{stats.admins}</strong> Admins</span>
            </div>
          </div>
        </div>

        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="user-table-wrapper">
        <table className="user-main-table">
          <thead>
            <tr>
              <th>Profile Info</th>
              <th>Registration Date</th>
              <th>Role / Status</th>
              <th className="text-right">Management</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-state">
                  <div className="empty-content">
                    <FaSearch size={40} />
                    <p>No users found matching "{search}"</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.uid} className="user-row-animate">
                  <td>
                    <div className="user-info-cell">
                      <div className="avatar-placeholder">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="details">
                        <span className="name">{user.name}</span>
                        <span className="email">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <FaCalendarAlt className="date-icon" />
                      {user.firstLogin 
                        ? new Date(user.firstLogin).toLocaleDateString(undefined, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) 
                        : "N/A"}
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${user.isAdmin ? "admin" : "member"}`}>
                      {user.isAdmin ? "Administrator" : "Member"}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className={`action-btn admin-toggle ${user.isAdmin ? "active" : ""}`}
                      title={user.isAdmin ? "Demote to Member" : "Promote to Admin"}
                      onClick={() => toggleAdmin(user.uid)}
                    >
                      <FaUserShield />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      title="Delete User"
                      onClick={() => handleDelete(user.uid)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUser;
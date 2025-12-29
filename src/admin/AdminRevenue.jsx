// src/admin/AdminRevenue.jsx
import React, { useEffect, useState } from "react";
import "./AdminRevenue.css";
import { ref, onValue, get } from "firebase/database";
import { db } from "../firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import { 
  FaFilePdf, 
  FaFileCsv, 
  FaWallet, 
  FaCalendarDay, 
  FaCalendarAlt, 
  FaChartLine,
  FaArrowUp
} from "react-icons/fa";

const AdminRevenue = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenues, setRevenues] = useState({
    daily: 0,
    monthly: 0,
    yearly: 0,
  });

  const PRICE_MONTHLY = 150;
  const PRICE_ANNUAL = 1690;

  useEffect(() => {
    const subsRef = ref(db, "subscriptions");

    const unsubscribe = onValue(subsRef, async (snapshot) => {
      const data = snapshot.val() || {};

      const subsList = await Promise.all(
        Object.keys(data).map(async (uid) => {
          const sub = data[uid];
          if (sub.status !== "approved") return null;

          const userRef = ref(db, `users/${uid}`);
          const snapshotUser = await get(userRef);
          const userData = snapshotUser.exists() ? snapshotUser.val() : {};

          return {
            uid,
            name: userData.name || "Unknown User",
            email: userData.email || "No Email",
            plan: sub.plan,
            approvedDate: sub.approvedDate,
          };
        })
      );

      const filteredSubs = subsList.filter(Boolean);
      setSubscriptions(filteredSubs);
      computeRevenue(filteredSubs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const computeRevenue = (subsList) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let daily = 0, monthly = 0, yearly = 0;

    subsList.forEach((sub) => {
      const approvedDate = new Date(sub.approvedDate);
      const amount = sub.plan?.toLowerCase() === "monthly" ? PRICE_MONTHLY : PRICE_ANNUAL;

      if (approvedDate >= startOfDay) daily += amount;
      if (approvedDate >= startOfMonth) monthly += amount;
      if (approvedDate >= startOfYear) yearly += amount;
    });

    setRevenues({ daily, monthly, yearly });
  };

  const getFilteredData = (type) => {
    const now = new Date();
    if (type === "Daily") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return subscriptions.filter(sub => new Date(sub.approvedDate) >= startOfDay);
    } else if (type === "Monthly") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return subscriptions.filter(sub => new Date(sub.approvedDate) >= startOfMonth);
    } else if (type === "Yearly") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return subscriptions.filter(sub => new Date(sub.approvedDate) >= startOfYear);
    }
    return subscriptions;
  };

  const downloadPDF = (type) => {
    const data = getFilteredData(type);
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(`Revenue Report - ${type}`, 14, 22);
    
    const tableRows = data.map((sub, index) => [
      index + 1,
      sub.email,
      sub.plan.toUpperCase(),
      `$${sub.plan === "monthly" ? PRICE_MONTHLY : PRICE_ANNUAL}`,
      new Date(sub.approvedDate).toLocaleDateString()
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['#', 'User Email', 'Plan', 'Amount', 'Date']],
      body: tableRows,
      theme: 'grid'
    });
    

    doc.save(`Revenue_${type}_${new Date().toLocaleDateString()}.pdf`);
  };

  const downloadCSV = (type) => {
    const data = getFilteredData(type);
    let csv = "Email,Plan,Amount,Approved Date\n";
    data.forEach(sub => {
      const amount = sub.plan === "monthly" ? PRICE_MONTHLY : PRICE_ANNUAL;
      csv += `${sub.email},${sub.plan},${amount},${sub.approvedDate}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `Revenue_${type}.csv`);
  };

  if (loading) return (
    <div className="revenue-loader">
      <div className="spinner"></div>
      <p>Calculating Financials...</p>
    </div>
  );

  return (
    <div className="admin-revenue-container">
      <header className="revenue-header">
        <div className="header-title">
          <h2>Revenue Analytics</h2>
          <p>Track your earnings and export financial reports</p>
        </div>
        <div className="total-wallet-badge">
          <FaWallet />
          <span>Lifetime Approved: <strong>{subscriptions.length}</strong></span>
        </div>
      </header>

      {/* Revenue Stat Cards */}
      <div className="revenue-stats-grid">
        <div className="rev-card daily">
          <div className="card-icon"><FaCalendarDay /></div>
          <div className="card-info">
            <span className="label">Daily Income</span>
            <h3 className="amount">${revenues.daily.toLocaleString()}</h3>
            <div className="card-actions">
              <button onClick={() => downloadPDF("Daily")}><FaFilePdf /> PDF</button>
              <button onClick={() => downloadCSV("Daily")}><FaFileCsv /> CSV</button>
            </div>
          </div>
          <FaArrowUp className="trend-icon" />
        </div>

        <div className="rev-card monthly">
          <div className="card-icon"><FaCalendarAlt /></div>
          <div className="card-info">
            <span className="label">Monthly Income</span>
            <h3 className="amount">${revenues.monthly.toLocaleString()}</h3>
            <div className="card-actions">
              <button onClick={() => downloadPDF("Monthly")}><FaFilePdf /> PDF</button>
              <button onClick={() => downloadCSV("Monthly")}><FaFileCsv /> CSV</button>
            </div>
          </div>
          <FaArrowUp className="trend-icon" />
        </div>

        <div className="rev-card yearly">
          <div className="card-icon"><FaChartLine /></div>
          <div className="card-info">
            <span className="label">Yearly Income</span>
            <h3 className="amount">${revenues.yearly.toLocaleString()}</h3>
            <div className="card-actions">
              <button onClick={() => downloadPDF("Yearly")}><FaFilePdf /> PDF</button>
              <button onClick={() => downloadCSV("Yearly")}><FaFileCsv /> CSV</button>
            </div>
          </div>
          <FaArrowUp className="trend-icon" />
        </div>
      </div>

      {/* Transaction Table */}
      <div className="revenue-table-section">
        <div className="table-header">
          <h3>Recent Transactions</h3>
        </div>
        <div className="table-wrapper">
          <table className="revenue-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Subscription Plan</th>
                <th>Amount</th>
                <th>Verification Date</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-msg">No earnings recorded yet.</td>
                </tr>
              ) : (
                subscriptions.slice().reverse().map((sub) => {
                  const amount = sub.plan?.toLowerCase() === "monthly" ? PRICE_MONTHLY : PRICE_ANNUAL;
                  return (
                    <tr key={sub.uid} className="revenue-row">
                      <td>
                        <div className="user-col">
                          <span className="u-name">{sub.name}</span>
                          <span className="u-email">{sub.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`plan-pill ${sub.plan?.toLowerCase()}`}>
                          {sub.plan}
                        </span>
                      </td>
                      <td className="amount-col">${amount.toLocaleString()}</td>
                      <td className="date-col">
                        {new Date(sub.approvedDate).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenue;
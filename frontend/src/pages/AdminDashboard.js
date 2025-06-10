import React from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  FaFolder,
  FaClipboardList,
  FaUserShield,
  FaChartBar,
  FaSignOutAlt,
} from "react-icons/fa";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: "Cases", path: "/admin/cases", icon: <FaFolder /> },
    { label: "Incident Reports", path: "/admin/reports", icon: <FaClipboardList /> },
    { label: "Victims/Witnesses", path: "/admin/victims", icon: <FaUserShield /> },
    { label: "Analytics", path: "/admin/analytics", icon: <FaChartBar /> },
    { label: "Logout", path: "/logout", icon: <FaSignOutAlt /> },
  ];

  const sidebarStyle = {
    width: "240px",
    background: "#1e293b",
    color: "#fff",
    padding: "2rem 1rem",
    boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  };

  const menuItemStyle = (path) => ({
    padding: "12px 16px",
    marginBottom: "12px",
    borderRadius: "8px",
    backgroundColor: location.pathname.startsWith(path) ? "#ff9800" : "transparent",
    color: location.pathname.startsWith(path) ? "#fff" : "#cbd5e1",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  });

  const handleNavigation = (path) => navigate(path);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial, sans-serif" }}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        <div>
          <h2 style={{ marginBottom: "2rem", textAlign: "center", fontSize: "20px" }}>
            Admin Panel
          </h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {menuItems.map((item, index) => (
              <li
                key={index}
                style={menuItemStyle(item.path)}
                onClick={() => handleNavigation(item.path)}
              >
                {item.icon}
                {item.label}
              </li>
            ))}
          </ul>
        </div>
        <footer style={{ textAlign: "center", fontSize: "12px", color: "#94a3b8" }}>
          © 2025 HRMIS
        </footer>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "3rem", background: "#f9fafb" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard;
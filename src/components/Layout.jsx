import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  Activity, 
  LayoutDashboard, 
  Users, 
  Plus, 
  LogOut,
  Home,
  ChevronRight,
  Sun,
  Moon
} from "lucide-react";
import { useState, useEffect } from "react";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <Activity size={20} />
        </div>
        <div>
          <h2>HeelUp</h2>
          <p>Pemantauan Tekanan</p>
        </div>
      </div>

      <div className="nav-links">
        <Link 
          to="/dashboard" 
          className={`nav-item ${location.pathname === "/dashboard" ? "active" : ""}`}
        >
          <LayoutDashboard size={20} />
          <span>Dasbor</span>
        </Link>
        <Link 
          to="/patients" 
          className={`nav-item ${location.pathname === "/patients" ? "active" : ""}`}
        >
          <Users size={20} />
          <span>Daftar Pasien</span>
        </Link>
      </div>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={handleLogout} style={{ background: "transparent", border: "none", width: "100%", textAlign: "left", fontFamily: "inherit" }}>
          <LogOut size={20} />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');

    return () => {
      document.documentElement.setAttribute('data-theme', 'light');
    };
  }, [isDarkMode]);

  const getPageTitle = () => {
    if (location.pathname === "/dashboard") return "Masukan Data Pasien";
    if (location.pathname === "/monitoring") return "Monitor Risiko";
    if (location.pathname === "/patients") return "Direktori Pasien";
    return "Dasbor";
  };

  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div className="page-title">
            <Home size={16} />
            <span>{getPageTitle()}</span>
          </div>
          <div className="user-profile">
            <button className="btn-icon" onClick={() => setIsDarkMode(!isDarkMode)} style={{ border: "none" }}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

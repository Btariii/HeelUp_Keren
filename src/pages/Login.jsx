import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, User, ShieldCheck, Activity, Footprints } from "lucide-react";
import { findUser } from "../utils/authStorage";

export default function Login() {
  const location = useLocation();
  const [username, setUsername] = useState(location.state?.username ?? "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(location.state?.message ?? "");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!location.state) {
      return;
    }

    navigate(".", { replace: true, state: null });
  }, [location.state, navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (findUser(username, password)) {
      navigate("/menu");
    } else {
      setMessage("");
      setError("Nama Pengguna atau Kata Sandi salah.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper animate-fade-in">
        {/* Left Branding Panel */}
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="auth-brand-logo">
              <Footprints size={28} />
            </div>
            <h1 className="auth-brand-title">HeelUp</h1>
            <p className="auth-brand-subtitle">
              Sistem Pemantauan Tekanan Tumit &amp; Penilaian Risiko Luka Tekan
            </p>

            <div className="auth-brand-features">
              <div className="auth-brand-feature">
                <div className="auth-brand-feature-icon">
                  <Activity size={18} />
                </div>
                <div>
                  <span className="auth-brand-feature-label">Pemantauan Real-time</span>
                  <span className="auth-brand-feature-desc">Pantau tekanan tumit secara langsung</span>
                </div>
              </div>
              <div className="auth-brand-feature">
                <div className="auth-brand-feature-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <span className="auth-brand-feature-label">Penilaian Skala Braden</span>
                  <span className="auth-brand-feature-desc">Penilaian risiko luka tekan otomatis</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="auth-brand-decor auth-brand-decor-1"></div>
          <div className="auth-brand-decor auth-brand-decor-2"></div>
          <div className="auth-brand-decor auth-brand-decor-3"></div>
        </div>

        {/* Right Form Panel */}
        <form className="auth-form-panel" onSubmit={handleLogin}>
          <div className="auth-form-header">
            <h2>Selamat Datang</h2>
            <p className="subtitle">Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          {message ? <div className="auth-message success">{message}</div> : null}
          {error ? <div className="auth-message error">{error}</div> : null}

          <div className="auth-form-fields">
            <div className="input-group">
              <label className="input-label">Nama Pengguna</label>
              <div className="input-wrapper">
                <User size={18} />
                <input
                  type="text"
                  placeholder="Masukkan nama pengguna"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Kata Sandi</label>
              <div className="input-wrapper">
                <Lock size={18} />
                <input
                  type="password"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary auth-submit-btn">
            Masuk
            <ArrowRight size={18} />
          </button>

          <div className="auth-footer">
            <p className="hint">Demo: nama pengguna <b>admin</b> · kata sandi <b>12345</b></p>
            <div className="auth-footer-link">
              <span>Belum punya akun?</span>
              <Link to="/signup" className="auth-link">
                Buat akun baru
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound, Lock, User, Footprints, UserPlus, Shield } from "lucide-react";
import { createUser, userExists } from "../utils/authStorage";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    setError("");

    const cleanUsername = username.trim();

    if (!cleanUsername || !password || !confirmPassword) {
      setError("Semua kolom wajib diisi.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Kata sandi dan Konfirmasi Kata Sandi tidak sama.");
      return;
    }

    if (userExists(cleanUsername)) {
      setError("Nama pengguna sudah dipakai, coba yang lain.");
      return;
    }

    createUser({ username: cleanUsername, password });

    navigate("/", {
      replace: true,
      state: {
        username: cleanUsername,
        message: "Akun berhasil dibuat. Silakan login.",
      },
    });
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
              Buat akun baru untuk mulai memantau tekanan tumit dan mencegah pressure ulcer.
            </p>

            <div className="auth-brand-features">
              <div className="auth-brand-feature">
                <div className="auth-brand-feature-icon">
                  <UserPlus size={18} />
                </div>
                <div>
                  <span className="auth-brand-feature-label">Registrasi Cepat</span>
                  <span className="auth-brand-feature-desc">Hanya 3 langkah untuk membuat akun</span>
                </div>
              </div>
              <div className="auth-brand-feature">
                <div className="auth-brand-feature-icon">
                  <Shield size={18} />
                </div>
                <div>
                  <span className="auth-brand-feature-label">Aman & Terjaga</span>
                  <span className="auth-brand-feature-desc">Data pasien tersimpan dengan aman</span>
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
        <form className="auth-form-panel" onSubmit={handleSignup}>
          <div className="auth-form-header">
            <h2>Buat Akun Baru</h2>
            <p className="subtitle">Daftar untuk mendapatkan akses penuh ke HeelUp</p>
          </div>

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
                  placeholder="Buat kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Konfirmasi Kata Sandi</label>
              <div className="input-wrapper">
                <KeyRound size={18} />
                <input
                  type="password"
                  placeholder="Ulangi kata sandi"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary auth-submit-btn">
            Buat Akun
            <ArrowRight size={18} />
          </button>

          <div className="auth-footer">
            <div className="auth-footer-link">
              <span>Sudah punya akun?</span>
              <Link to="/" className="auth-link">
                Masuk di sini
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
import { useNavigate } from "react-router-dom";
import { ClipboardPlus, Users, ArrowRight } from "lucide-react";
import { useFirebase, createEmptyPatient } from "../context/FirebaseContext";

export default function MenuChoice() {
  const navigate = useNavigate();
  const { setPatient } = useFirebase();

  return (
    <div className="menu-choice-page">
      <div className="menu-choice-card animate-fade-in">
        <div className="menu-choice-header">
          <p className="menu-choice-kicker">Selamat datang di HeelUp</p>
          <h1>Pilih menu yang ingin dibuka</h1>
          <p>
            Langsung masuk ke input data pasien atau lihat daftar pasien yang sudah tersimpan.
          </p>
        </div>

        <div className="menu-choice-grid">
          <button
            type="button"
            className="menu-choice-option primary"
            onClick={() => {
              setPatient(createEmptyPatient());
              navigate("/dashboard");
            }}
          >
            <div className="menu-choice-icon">
              <ClipboardPlus size={26} />
            </div>
            <div className="menu-choice-content">
              <span className="menu-choice-label">Input data pasien</span>
              <span className="menu-choice-description">
                Tambahkan data baru dan hitung risiko pressure ulcer.
              </span>
            </div>
            <ArrowRight size={18} className="menu-choice-arrow" />
          </button>

          <button
            type="button"
            className="menu-choice-option secondary"
            onClick={() => navigate("/patients")}
          >
            <div className="menu-choice-icon alt">
              <Users size={26} />
            </div>
            <div className="menu-choice-content">
              <span className="menu-choice-label">Lihat data pasien</span>
              <span className="menu-choice-description">
                Buka daftar pasien, riwayat perubahan, dan detail lengkap.
              </span>
            </div>
            <ArrowRight size={18} className="menu-choice-arrow" />
          </button>
        </div>
      </div>
    </div>
  );
}
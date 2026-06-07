import { useFirebase } from "../context/FirebaseContext";
import { IdCard, Gauge, Clock, BellRing, CheckCircle, AlertCircle, Info, Loader, Save, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "../firebase.js"; // file firebase.js dari tahap 2
import { ref, onValue } from "firebase/database";

export default function Dashboard() {
  const {
    pressure,
    servoStatus,
    prosesReposisi,
    timerReposisi,
    tahapReposisi,
    jumlahReposisi,
    lastReposition,
    patient,
    addPatient,
    updatePatientRecord,
  } = useFirebase();
  const navigate = useNavigate();

  const riskMap = {
  HIGH: { label: "Tinggi", color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.2)" },
  LOW: { label: "Rendah", color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.2)" },
};

  function formatGender(gender) {
  if (!gender) return "-";
  const low = gender.toLowerCase();
  if (low === "female") return "Perempuan";
  if (low === "male") return "Laki-laki";
  return gender;
}
  const [isCalculating, setIsCalculating] = useState(true);
  const [displayPressure, setDisplayPressure] = useState(0);
  const [displayBraden, setDisplayBraden] = useState(0);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    // Scramble effect
    const scrambleInterval = setInterval(() => {
      setDisplayPressure(Math.random() * 80);
      setDisplayBraden(Math.floor(Math.random() * 20));
    }, 100);

    const timeout = setTimeout(() => {
      setIsCalculating(false);
      clearInterval(scrambleInterval);
    }, 1500);

    return () => {
      clearInterval(scrambleInterval);
      clearTimeout(timeout);
    };
  }, []);

  // --- Ambil data sensor realtime dari Firebase ---
  useEffect(() => {
  if (!database) return; // jangan jalanin jika database undefined
  const sensorRef = ref(database, "sensorFSR");
  const unsubscribe = onValue(sensorRef, snapshot => {
    const val = snapshot.val();
    if (val != null) setDisplayPressure(val);
  });
  return () => unsubscribe();
}, [database]);

  const hitungBraden = () => {
    return (
      Number(patient.persepsiSensori || 0) +
      Number(patient.kelembapan || 0) +
      Number(patient.aktivitas || 0) +
      Number(patient.mobilitas || 0) +
      Number(patient.nutrisi || 0) +
      Number(patient.gesekan || 0)
    );
  };

  const bradenScore = hitungBraden();
  const finalBraden = isCalculating ? displayBraden : bradenScore;
  const finalPressure = isCalculating ? displayPressure : pressure;
  const risiko = finalBraden <= 14 ? "HIGH" : "LOW";
  const tekananTinggi = finalPressure >= 35;

  const angle = Math.min(Math.max((finalPressure / 100) * 180 - 90, -90), 90);

  const waktuReposisi = lastReposition
  ? new Date(lastReposition).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  : "-";

  const isPatientFormComplete = Boolean(
    patient.nama &&
    patient.umur &&
    patient.jenisKelamin &&
    patient.persepsiSensori &&
    patient.kelembapan &&
    patient.aktivitas &&
    patient.mobilitas &&
    patient.nutrisi &&
    patient.gesekan
  );

  const hitungSkorBraden = () => {
    return (
      Number(patient.persepsiSensori || 0) +
      Number(patient.kelembapan || 0) +
      Number(patient.aktivitas || 0) +
      Number(patient.mobilitas || 0) +
      Number(patient.nutrisi || 0) +
      Number(patient.gesekan || 0)
    );
  };

  const tentukanRisikoDanDurasi = (skorBraden) => {
    if (skorBraden <= 12) {
      return {
        risiko: "TINGGI",
        risk: "HIGH",
        durasiReposisiDetik: 60,
        keteranganDurasi: "1 menit tiap posisi",
      };
    }

    if (skorBraden <= 18) {
      return {
        risiko: "SEDANG",
        risk: "MEDIUM",
        durasiReposisiDetik: 120,
        keteranganDurasi: "2 menit tiap posisi",
      };
    }

    return {
      risiko: "RENDAH",
      risk: "LOW",
      durasiReposisiDetik: 180,
      keteranganDurasi: "3 menit tiap posisi",
    };
  };

  const handleSaveRecord = async () => {
    if (!isPatientFormComplete) {
      setSaveMessage("Lengkapi data pasien dulu sebelum menyimpan.");
      return;
    }

    const skorBraden = hitungSkorBraden();
    const hasil = tentukanRisikoDanDurasi(skorBraden);

    const patientData = {
      nama: patient.nama,
      jenisKelamin: patient.jenisKelamin,
      umur: patient.umur,
      persepsiSensori: patient.persepsiSensori,
      kelembapan: patient.kelembapan,
      aktivitas: patient.aktivitas,
      mobilitas: patient.mobilitas,
      nutrisi: patient.nutrisi,
      gesekan: patient.gesekan,
      skorBraden,
      bradenScore: skorBraden,
      risiko: hasil.risiko,
      risk: hasil.risk,
      durasiReposisiDetik: hasil.durasiReposisiDetik,
      keteranganDurasi: hasil.keteranganDurasi,
    };

    try {
      if (patient.id) {
        await updatePatientRecord(patient.id, patientData);
      } else {
        await addPatient(patientData);
      }

      setSaveMessage("Record berhasil disimpan.");
      navigate("/patients");
    } catch (error) {
      console.error(error);
      setSaveMessage("Gagal menyimpan record.");
    }
  };

  function formatTimer(totalDetik) {
    const menit = Math.floor(totalDetik / 60);
    const detik = totalDetik % 60;
    return `${menit.toString().padStart(2, "0")}:${detik.toString().padStart(2, "0")}`;
  }

  return (
    <div>
      <div className="page-header animate-fade-in">
        <h1>Dasbor Pemantauan Tekanan Tumit</h1>
        <p>Analisis tekanan realtime dan status pasien.</p>
      </div>

      <div className="dashboard-actions animate-fade-in delay-1">
        <button type="button" className="btn-outline dashboard-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Kembali
        </button>
        <button type="button" className="btn-primary dashboard-save-btn" onClick={handleSaveRecord}>
          <Save size={16} />
          Simpan Riwayat
        </button>
        {saveMessage ? <span className="dashboard-save-message">{saveMessage}</span> : null}
      </div>

      <div className="dashboard-grid">
        <div className="card animate-fade-in delay-1">
          <div className="card-title">
            <IdCard size={16} />
            IDENTIFIKASI PASIEN
          </div>
          
          <div className="patient-info-row">
            <span>Nama</span>
            <span>:</span>
            <span>{patient?.nama ?? "-"}</span>
          </div>
          <div className="patient-info-row">
            <span>Umur</span>
            <span>:</span>
            <span>{patient?.umur ?? "-"}</span>
          </div>
          <div className="patient-info-row">
            <span>Jenis Kelamin</span>
            <span>:</span>
            <span>{formatGender(patient?.jenisKelamin)}</span>
          </div>
        </div>

        <div className="card risk-card animate-fade-in delay-2" style={{ border: isCalculating ? "1px solid #8b949e" : "1px solid var(--accent-color)" }}>
          <div>
            <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#fff", lineHeight: "1.2" }}>
              PRESSURE<br />RISIKO LUKA TEKAN
            </h2>
            <p style={{ color: "#8b949e", fontSize: "12px", letterSpacing: "2px", marginTop: "8px", textTransform: "uppercase" }}>
              {isCalculating ? "Menghitung..." : "Skor Skala Braden"}
            </p>
          </div>
          <div className="risk-score">
            <h1 style={{ color: isCalculating ? "#8b949e" : (risiko === "HIGH" ? "#ef4444" : "#22c55e") }}>
              {finalBraden}
            </h1>
            <div className="risk-badge" style={{ 
              background: isCalculating ? "rgba(139, 148, 158, 0.2)" : riskMap[risiko].bgColor,
              color: isCalculating ? "#8b949e" : riskMap[risiko].color
            }}>
              {isCalculating ? "..." :  riskMap[risiko].label}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
        <div className="card animate-fade-in delay-3">
          <div className="card-title">
            <Gauge size={16} />
            {isCalculating ? "ANALYZING SENSOR..." : "TEKANAN TUMIT"}
          </div>
          
          <div className="gauge-container">
            <div className="gauge">
              <div className="gauge-bg"></div>
              <div
                className="needle"
                style={{ transform: `rotate(${angle}deg)` }}
              ></div>
              <div className="gauge-value">
                <h3>{finalPressure.toFixed(1)}</h3>
                <p>mmHg</p>
              </div>
            </div>
            
            <div className="gauge-minmax">
              <span>0</span>
              <span>100</span>
            </div>

            <div className={`status-badge ${isCalculating ? "" : (tekananTinggi ? "danger" : "safe")}`} style={{ border: isCalculating ? "1px solid #30363d" : undefined, color: isCalculating ? "#8b949e" : undefined, background: isCalculating ? "transparent" : undefined }}>
              {isCalculating ? "Calculating..." : (tekananTinggi ? "Tekanan Tinggi" : "Aman")}
            </div>
            <p className="limit-text">Batas Aman: &lt; 35 mmHg</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="card animate-fade-in delay-4">
            <div className="card-title">
              <Clock size={16} />
              WAKTU REPOSISI TERAKHIR
            </div>
            
            <div className="timer-display">
              <h1>{waktuReposisi}</h1>
              <div className="timer-box">
                <span>Timer Reposisi</span>
                <b>{formatTimer(timerReposisi)}</b>
                <p>Posisi: {servoStatus} {tahapReposisi ? `(${tahapReposisi})` : ""}</p>
              </div>
            </div>
          </div>

          <div className="card animate-fade-in delay-5">
            <div className="card-title">
              <BellRing size={16} />
              ALARM / NOTIFIKASI
            </div>

            {isCalculating ? (
              <div className="notif-box" style={{ background: "transparent", border: "1px dashed #30363d" }}>
                <div className="icon-circle" style={{ background: "#161b22", color: "#8b949e" }}>
                  <Loader size={24} className="animate-spin" />
                </div>
                <div className="notif-content">
                  <h3>Menganalisis Status</h3>
                  <p>Mohon tunggu...</p>
                </div>
              </div>
            ) : (
              <div className={`notif-box ${tekananTinggi ? "red" : "green"}`}>
                <div className="icon-circle">
                  {tekananTinggi ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
                </div>
                <div className="notif-content">
                  <h3>{tekananTinggi ? "ALERT" : "AMAN"}</h3>
                  <p>
                    {tekananTinggi
                      ? `Tekanan mencapai ${finalPressure.toFixed(1)} mmHg`
                      : "Tekanan dalam batas normal"}
                  </p>
                </div>
              </div>
            )}

            <div className="notif-box" style={{ background: "rgba(21, 128, 61, 0.06)", border: "1px solid rgba(21, 128, 61, 0.16)" }}>
              <div className="icon-circle" style={{ background: "rgba(21, 128, 61, 0.12)", color: "#15803d" }}>
                <Info size={24} />
              </div>
              <div className="notif-content">
                <h3>Reposisi Otomatis</h3>
                <p>
                  {prosesReposisi
                    ? `Servo sedang di ${servoStatus}`
                    : "Menunggu tekanan tinggi"}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(15, 23, 42, 0.04)", padding: "12px 16px", borderRadius: "8px", marginTop: "16px", fontSize: "14px", color: "var(--text-main)" }}>
              <span>Jumlah Reposisi</span>
              <b style={{ color: "var(--accent-color)" }}>{jumlahReposisi} kali</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

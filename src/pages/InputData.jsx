import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFirebase } from "../context/FirebaseContext";
import { IdCard, ActivitySquare, ArrowRight } from "lucide-react";
import { createEmptyPatient } from "../context/FirebaseContext";

export default function InputData() {
  const { patient, setPatient, addPatient, updatePatientRecord, simpanPasienAktif } = useFirebase();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditingPatient = Boolean(location.state?.editing);
  const patientFromNavigation = location.state?.patient;

  useEffect(() => {
    if (isEditingPatient && patientFromNavigation) {
      setPatient(patientFromNavigation);
    }
  }, [isEditingPatient, patientFromNavigation, setPatient]);

  const getSelectClassName = (value) => (value ? "" : "select-placeholder");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatient({ ...patient, [name]: value });
  };

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

  const bradenScore = hitungBraden();
  const hasilRisiko = tentukanRisikoDanDurasi(bradenScore);

  const isFormValid = () => {
    return (
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
  };

  const handleKosongkan = () => {
    setPatient({
      nama: "",
      umur: "",
      jenisKelamin: "",
      persepsiSensori: "",
      kelembapan: "",
      aktivitas: "",
      mobilitas: "",
      nutrisi: "",
      gesekan: "",
    });
  };

  const buatDataPasienLengkap = () => {
    const skor = hitungBraden();
    const hasil = tentukanRisikoDanDurasi(skor);

    return {
      nama: patient.nama,
      jenisKelamin: patient.jenisKelamin,
      umur: patient.umur,

      persepsiSensori: patient.persepsiSensori,
      kelembapan: patient.kelembapan,
      aktivitas: patient.aktivitas,
      mobilitas: patient.mobilitas,
      nutrisi: patient.nutrisi,
      gesekan: patient.gesekan,

      skorBraden: skor,
      bradenScore: skor,

      risiko: hasil.risiko,
      risk: hasil.risk,

      durasiReposisiDetik: hasil.durasiReposisiDetik,
      keteranganDurasi: hasil.keteranganDurasi,
    };
  };

  const simpanKeFirebase = async () => {
    const patientData = buatDataPasienLengkap();

    if (patient.id) {
      await updatePatientRecord(patient.id, patientData);
    } else {
      await addPatient(patientData);
    }

    return patientData;
  };

  const handleLihatRisiko = async () => {
    if (!isFormValid()) {
      alert("Lengkapi semua data sebelum melihat monitoring!");
      return;
    }

    try {
      const patientData = buatDataPasienLengkap();
      const updatedContext = { ...patient, ...patientData };
      setPatient(updatedContext);
      await simpanPasienAktif(updatedContext);
      
      navigate("/monitoring");
    } catch (error) {
      console.error(error);
      alert("Gagal melihat monitoring");
    }
  };

  const handleSimpan = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      alert("Lengkapi semua data sebelum menyimpan!");
      return;
    }

    try {
      await simpanKeFirebase();

      setPatient(createEmptyPatient());

      navigate("/patients");
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan data ke Firebase");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Masukkan Data Pasien</h1>
        <p>Masukkan data pasien dan lakukan penilaian Skala Braden.</p>
      </div>

      <form onSubmit={handleSimpan}>
        <div className="form-grid">
          <div className="card">
            <div className="card-title">
              <IdCard size={16} />
              Identitas
            </div>

            <div className="form-group">
              <label>Nama Pasien</label>
              <input
                name="nama"
                placeholder="Masukkan nama pasien"
                value={patient.nama}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ marginTop: "16px" }}>
              <label>Umur</label>
              <input
                type="number"
                name="umur"
                placeholder="Masukkan umur pasien"
                value={patient.umur}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ marginTop: "16px" }}>
              <label>Jenis Kelamin</label>
              <select
                name="jenisKelamin"
                className={getSelectClassName(patient.jenisKelamin)}
                value={patient.jenisKelamin}
                onChange={handleChange}
              >
                <option value="">Pilih jenis kelamin</option>
                <option value="Female">Perempuan</option>
                <option value="Male">Laki-laki</option>
              </select>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <ActivitySquare size={16} />
              Skala Braden
            </div>

            <div className="form-grid" style={{ gap: "16px" }}>
              <div className="form-group">
                <label>Persepsi Sensori</label>
                <select
                  name="persepsiSensori"
                  className={getSelectClassName(patient.persepsiSensori)}
                  value={patient.persepsiSensori}
                  onChange={handleChange}
                >
                  <option value="">Pilih persepsi sensori</option>
                  <option value="1">1 - Sepenuhnya Terbatas</option>
                  <option value="2">2 - Sangat Terbatas</option>
                  <option value="3">3 - Sedikit Terbatas</option>
                  <option value="4">4 - Tidak Ada Gangguan</option>
                </select>
              </div>

              <div className="form-group">
                <label>Kelembapan</label>
                <select
                  name="kelembapan"
                  className={getSelectClassName(patient.kelembapan)}
                  value={patient.kelembapan}
                  onChange={handleChange}
                >
                  <option value="">Pilih tingkat kelembapan</option>
                  <option value="1">1 - Selalu Lembab</option>
                  <option value="2">2 - Sering Lembab</option>
                  <option value="3">3 - Kadang Lembab</option>
                  <option value="4">4 - Jarang Lembab</option>
                </select>
              </div>

              <div className="form-group">
                <label>Aktivitas</label>
                <select
                  name="aktivitas"
                  className={getSelectClassName(patient.aktivitas)}
                  value={patient.aktivitas}
                  onChange={handleChange}
                >
                  <option value="">Pilih tingkat aktivitas</option>
                  <option value="1">1 - Tidak Bisa Berdiri / Terbatas di Tempat Tidur</option>
                  <option value="2">2 - Tidak Bisa Duduk / Terbatas di Kursi</option>
                  <option value="3">3 - Jalan Sering</option>
                  <option value="4">4 - Jalan Sering</option>
                </select>
              </div>

              <div className="form-group">
                <label>Mobilitas</label>
                <select
                  name="mobilitas"
                  className={getSelectClassName(patient.mobilitas)}
                  value={patient.mobilitas}
                  onChange={handleChange}
                >
                  <option value="">Pilih tingkat mobilitas</option>
                  <option value="1">1 - Sepenuhnya Imobil</option>
                  <option value="2">2 - Sangat Terbatas</option>
                  <option value="3">3 - Sedikit Terbatas</option>
                  <option value="4">4 - Tidak Ada Batasan</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nutrisi</label>
                <select
                  name="nutrisi"
                  className={getSelectClassName(patient.nutrisi)}
                  value={patient.nutrisi}
                  onChange={handleChange}
                >
                  <option value="">Pilih kondisi nutrisi</option>
                  <option value="1">1 - Sangat Buruk / Makan sangat sedikit</option>
                  <option value="2">2 - Buruk / Makan kurang</option>
                  <option value="3">3 - Cukup / Makan cukup</option>
                  <option value="4">4 - Baik / Makan baik</option>
                </select>
              </div>

              <div className="form-group">
                <label>Gesekan / Gaya Geser</label>
                <select
                  name="gesekan"
                  className={getSelectClassName(patient.gesekan)}
                  value={patient.gesekan}
                  onChange={handleChange}
                >
                  <option value="">Pilih kondisi gesekan/ gaya geser</option>
                  <option value="1">1 - Masalah</option>
                  <option value="2">2 - Potensi masalah</option>
                  <option value="3">3 - Tidak ada masalah yang terlihat</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="assessment-result">
          <div>
            <h3>Hasil Penilaian</h3>
            <h2>
              Total Skor Braden: <span>{bradenScore}</span>
            </h2>
            <p>
              Risiko: <b>{hasilRisiko.risiko}</b> | Durasi Reposisi:{" "}
              <b>{hasilRisiko.keteranganDurasi}</b>
            </p>
          </div>

          <div className="result-actions">
            <button type="button" className="btn-outline" onClick={handleKosongkan}>
              Kosongkan
            </button>

            <button type="button" className="btn-outline" onClick={handleLihatRisiko}>
              Monitor Risiko
            </button>

            <button
              type="submit"
              className="btn-primary"
              style={{ padding: "10px 20px" }}
            >
              {patient.id ? "Simpan Perubahan" : "Simpan Data"} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
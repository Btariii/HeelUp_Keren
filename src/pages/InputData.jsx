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
        <h1>Input Patient Data</h1>
        <p>Enter patient details and conduct Braden Scale assessment.</p>
      </div>

      <form onSubmit={handleSimpan}>
        <div className="form-grid">
          <div className="card">
            <div className="card-title">
              <IdCard size={16} />
              Identity
            </div>

            <div className="form-group">
              <label>Patient Name</label>
              <input
                name="nama"
                placeholder="Enter full name"
                value={patient.nama}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ marginTop: "16px" }}>
              <label>Age</label>
              <input
                type="number"
                name="umur"
                placeholder="Years"
                value={patient.umur}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ marginTop: "16px" }}>
              <label>Gender</label>
              <select
                name="jenisKelamin"
                className={getSelectClassName(patient.jenisKelamin)}
                value={patient.jenisKelamin}
                onChange={handleChange}
              >
                <option value="">Select gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <ActivitySquare size={16} />
              Braden Scale
            </div>

            <div className="form-grid" style={{ gap: "16px" }}>
              <div className="form-group">
                <label>Sensory Perception</label>
                <select
                  name="persepsiSensori"
                  className={getSelectClassName(patient.persepsiSensori)}
                  value={patient.persepsiSensori}
                  onChange={handleChange}
                >
                  <option value="">Select sensory perception</option>
                  <option value="1">1 - Completely Limited</option>
                  <option value="2">2 - Very Limited</option>
                  <option value="3">3 - Slightly Limited</option>
                  <option value="4">4 - No Impairment</option>
                </select>
              </div>

              <div className="form-group">
                <label>Moisture</label>
                <select
                  name="kelembapan"
                  className={getSelectClassName(patient.kelembapan)}
                  value={patient.kelembapan}
                  onChange={handleChange}
                >
                  <option value="">Select moisture level</option>
                  <option value="1">1 - Always Moist</option>
                  <option value="2">2 - Often Moist</option>
                  <option value="3">3 - Occasionally Moist</option>
                  <option value="4">4 - Rarely Moist</option>
                </select>
              </div>

              <div className="form-group">
                <label>Activity</label>
                <select
                  name="aktivitas"
                  className={getSelectClassName(patient.aktivitas)}
                  value={patient.aktivitas}
                  onChange={handleChange}
                >
                  <option value="">Select activity level</option>
                  <option value="1">1 - Bedfast / Confined to bed</option>
                  <option value="2">2 - Chairfast / Confined to chair</option>
                  <option value="3">3 - Walks occasionally</option>
                  <option value="4">4 - Walks frequently</option>
                </select>
              </div>

              <div className="form-group">
                <label>Mobility</label>
                <select
                  name="mobilitas"
                  className={getSelectClassName(patient.mobilitas)}
                  value={patient.mobilitas}
                  onChange={handleChange}
                >
                  <option value="">Select mobility level</option>
                  <option value="1">1 - Completely Immobile</option>
                  <option value="2">2 - Very Limited</option>
                  <option value="3">3 - Slightly Limited</option>
                  <option value="4">4 - No Limit</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nutrition</label>
                <select
                  name="nutrisi"
                  className={getSelectClassName(patient.nutrisi)}
                  value={patient.nutrisi}
                  onChange={handleChange}
                >
                  <option value="">Select nutrition condition</option>
                  <option value="1">1 - Very Poor / Makan sangat sedikit</option>
                  <option value="2">2 - Poor / Makan kurang</option>
                  <option value="3">3 - Enough / Makan cukup</option>
                  <option value="4">4 - Good / Makan baik</option>
                </select>
              </div>

              <div className="form-group">
                <label>Friction / Shear</label>
                <select
                  name="gesekan"
                  className={getSelectClassName(patient.gesekan)}
                  value={patient.gesekan}
                  onChange={handleChange}
                >
                  <option value="">Select friction/shear condition</option>
                  <option value="1">1 - Problem</option>
                  <option value="2">2 - Potential problem</option>
                  <option value="3">3 - No apparent problem</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="assessment-result">
          <div>
            <h3>Assessment Result</h3>
            <h2>
              Total Braden Score: <span>{bradenScore}</span>
            </h2>
            <p>
              Risk: <b>{hasilRisiko.risiko}</b> | Reposition duration:{" "}
              <b>{hasilRisiko.keteranganDurasi}</b>
            </p>
          </div>

          <div className="result-actions">
            <button type="button" className="btn-outline" onClick={handleKosongkan}>
              Reset
            </button>

            <button type="button" className="btn-outline" onClick={handleLihatRisiko}>
              Monitor Risk
            </button>

            <button
              type="submit"
              className="btn-primary"
              style={{ padding: "10px 20px" }}
            >
              {patient.id ? "Save Update" : "Save Record"} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
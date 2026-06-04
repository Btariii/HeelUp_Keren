import { createContext, useContext, useEffect, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  push,
  set,
  remove,
  update,
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAcCbH6MltXtOpCNgJjQnSL2S7odl0r_LA",
  authDomain: "tumithebat.firebaseapp.com",
  databaseURL:
    "https://tumithebat-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tumithebat",
  storageBucket: "tumithebat.firebasestorage.app",
  messagingSenderId: "339694970123",
  appId: "1:339694970123:web:6a780efed4b7e40dc0ae0e",
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

const FirebaseContext = createContext(null);

export const useFirebase = () => useContext(FirebaseContext);

export const createEmptyPatient = () => ({
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

function getRecordTimestamp(record) {
  return new Date(record.updatedAt || record.createdAt || 0).getTime();
}

function normalizePatientRecord(id, record = {}) {
  return {
    id,
    patientGroupId: record.patientGroupId || id,
    version: Number(record.version || 1),
    isCurrent: record.isCurrent ?? true,
    previousRecordId: record.previousRecordId || null,
    supersededBy: record.supersededBy || null,
    archivedAt: record.archivedAt || null,
    ...record,
  };
}

function buildPatientRecord(patientData, metadata) {
  const skorBraden = Number(metadata.skorBraden);

  return {
    ...patientData,
    patientGroupId: metadata.patientGroupId,
    version: metadata.version,
    isCurrent: metadata.isCurrent,
    previousRecordId: metadata.previousRecordId || null,
    supersededBy: metadata.supersededBy || null,
    archivedAt: metadata.archivedAt || null,
    skorBraden,
    bradenScore: skorBraden,
    risiko: metadata.risiko,
    risk: metadata.risk,
    durasiReposisiDetik: metadata.durasiReposisiDetik,
    keteranganDurasi: metadata.keteranganDurasi,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
  };
}

export const FirebaseProvider = ({ children }) => {
  const [pressure, setPressure] = useState(0);
  const [servoStatus, setServoStatus] = useState("DIAM");
  const [prosesReposisi, setProsesReposisi] = useState(false);
  const [timerReposisi, setTimerReposisi] = useState(0);
  const [tahapReposisi, setTahapReposisi] = useState(0);
  const [jumlahReposisi, setJumlahReposisi] = useState(0);
  const [lastReposition, setLastReposition] = useState(new Date());

  const [patient, setPatient] = useState({
    ...createEmptyPatient(),
  });

  const [patientsList, setPatientsList] = useState([]);
  const [activePatient, setActivePatient] = useState(null);

  const prevReposisi = useRef(0);

  useEffect(() => {
    const sensorRef = ref(database, "sensor");

    const unsubscribeSensor = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const jumlahBaru = Number(data.jumlahReposisi || 0);

      setPressure(Number(data.tekanan || 0));
      setServoStatus(data.servoStatus || "DIAM");
      setProsesReposisi(Boolean(data.prosesReposisi));
      setTimerReposisi(Number(data.timerReposisi || 0));
      setTahapReposisi(Number(data.tahapReposisi || 0));
      setJumlahReposisi(jumlahBaru);

      if (jumlahBaru > prevReposisi.current) {
        setLastReposition(new Date());
        prevReposisi.current = jumlahBaru;
      }
    });

    const patientsRef = ref(database, "patients");

    const unsubscribePatients = onValue(patientsRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const list = Object.keys(data)
          .map((key) => normalizePatientRecord(key, data[key]))
          .sort((a, b) => {
            const currentDifference = Number(Boolean(b.isCurrent)) - Number(Boolean(a.isCurrent));

            if (currentDifference !== 0) {
              return currentDifference;
            }

            return getRecordTimestamp(b) - getRecordTimestamp(a);
          });

        setPatientsList(list);
      } else {
        setPatientsList([]);
      }
    });

    const activePatientRef = ref(database, "pasien");

    const unsubscribeActivePatient = onValue(activePatientRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setActivePatient(data);
      } else {
        setActivePatient(null);
      }
    });

    return () => {
      unsubscribeSensor();
      unsubscribePatients();
      unsubscribeActivePatient();
    };
  }, []);

  function hitungSkorBraden(dataPasien) {
    return (
      Number(dataPasien.persepsiSensori || 0) +
      Number(dataPasien.kelembapan || 0) +
      Number(dataPasien.aktivitas || 0) +
      Number(dataPasien.mobilitas || 0) +
      Number(dataPasien.nutrisi || 0) +
      Number(dataPasien.gesekan || 0)
    );
  }

  function tentukanRisikoDanDurasi(skorBraden) {
    if (skorBraden <= 12) {
      return {
        risiko: "TINGGI",
        risk: "HIGH",
        durasiReposisiDetik: 60,
        keteranganDurasi: "1 menit tiap posisi",
      };
    }

    return {
      risiko: "RENDAH",
      risk: "LOW",
      durasiReposisiDetik: 180,
      keteranganDurasi: "3 menit tiap posisi",
   };
  }

  async function simpanPasienAktif(patientData) {
    const skorBraden = hitungSkorBraden(patientData);
    const hasil = tentukanRisikoDanDurasi(skorBraden);

    const dataLengkap = {
      ...patientData,
      skorBraden,
      risiko: hasil.risiko,
      durasiReposisiDetik: hasil.durasiReposisiDetik,
      updatedAt: new Date().toISOString(),
    };

    await set(ref(database, "pasien"), dataLengkap);

    return dataLengkap;
  }

  const addPatient = async (patientData) => {
    const skorBraden = hitungSkorBraden(patientData);
    const hasil = tentukanRisikoDanDurasi(skorBraden);
    const now = new Date().toISOString();

    const patientsRef = ref(database, "patients");
    const newPatientRef = push(patientsRef);
    const patientGroupId = newPatientRef.key;

    const dataLengkap = buildPatientRecord(patientData, {
      patientGroupId,
      version: 1,
      isCurrent: true,
      previousRecordId: null,
      supersededBy: null,
      archivedAt: null,
      skorBraden,
      risiko: hasil.risiko,
      risk: hasil.risk,
      durasiReposisiDetik: hasil.durasiReposisiDetik,
      keteranganDurasi: hasil.keteranganDurasi,
      createdAt: now,
      updatedAt: now,
    });

    await set(newPatientRef, dataLengkap);
    await set(ref(database, "pasien"), dataLengkap);

    return dataLengkap;
  };

  const updatePatientRecord = async (id, patientData) => {
    const skorBraden = hitungSkorBraden(patientData);
    const hasil = tentukanRisikoDanDurasi(skorBraden);
    const now = new Date().toISOString();
    const existingRecord = patientsList.find((record) => record.id === id);
    const patientGroupId = patientData.patientGroupId || existingRecord?.patientGroupId || id;
    const nextVersion = Number(existingRecord?.version || patientData.version || 1) + 1;

    const patientsRef = ref(database, "patients");
    const newPatientRef = push(patientsRef);

    const dataLengkap = buildPatientRecord(patientData, {
      patientGroupId,
      version: nextVersion,
      isCurrent: true,
      previousRecordId: id,
      supersededBy: null,
      archivedAt: null,
      skorBraden,
      risiko: hasil.risiko,
      risk: hasil.risk,
      durasiReposisiDetik: hasil.durasiReposisiDetik,
      keteranganDurasi: hasil.keteranganDurasi,
      createdAt: existingRecord?.createdAt || now,
      updatedAt: now,
    });

    await set(newPatientRef, dataLengkap);

    await update(ref(database, `patients/${id}`), {
      isCurrent: false,
      supersededBy: newPatientRef.key,
      archivedAt: now,
      updatedAt: now,
    });

    await set(ref(database, "pasien"), dataLengkap);

    return dataLengkap;
  };
  const deletePatientRecord = async (id) => {
    const patientRef = ref(database, `patients/${id}`);
    await remove(patientRef);
  };

  const value = {
    pressure,
    servoStatus,
    prosesReposisi,
    timerReposisi,
    tahapReposisi,
    jumlahReposisi,
    lastReposition,

    patient,
    setPatient,
    patientsList,
    activePatient,

    hitungSkorBraden,
    tentukanRisikoDanDurasi,
    simpanPasienAktif,

    addPatient,
    updatePatientRecord,
    deletePatientRecord,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
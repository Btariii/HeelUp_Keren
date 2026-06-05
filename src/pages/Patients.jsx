import { Eye, EyeOff, Search, Edit2, Trash2, X } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebase } from "../context/FirebaseContext";

export default function Patients() {
  const { patientsList, setPatient, deletePatientRecord } = useFirebase();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [viewPatient, setViewPatient] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const formatGender = (g) => {
    if (!g) return "-";
    if (typeof g !== "string") return g;
    const low = g.toLowerCase();
    if (low === "m" || low === "male") return "Laki-laki";
    if (low === "f" || low === "female") return "Perempuan";
    return g.charAt(0).toUpperCase() + g.slice(1);
  };

  // --- tambahkan mapping risiko di sini ---
const riskMap = {
  HIGH: { label: "Tinggi", className: "high" },
  //MEDIUM: { label: "Sedang", className: "medium" }//
  LOW: { label: "Rendah", className: "low" },
};

  const formatRiskLabel = (r) => {
    if (!r) return "Rendah";
    const s = String(r).toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const groupedPatients = useMemo(() => {
    const groups = new Map();

    patientsList.forEach((patient) => {
      const groupId = patient.patientGroupId || patient.id;

      if (!groups.has(groupId)) {
        groups.set(groupId, []);
      }

      groups.get(groupId).push(patient);
    });

    return Array.from(groups.entries())
      .map(([groupId, records]) => {
        const sortedRecords = [...records].sort((a, b) => {
          const versionDifference = Number(a.version || 1) - Number(b.version || 1);

          if (versionDifference !== 0) {
            return versionDifference;
          }

          return new Date(a.updatedAt || a.createdAt || 0).getTime() - new Date(b.updatedAt || b.createdAt || 0).getTime();
        });

        const currentRecord =
          sortedRecords.find((record) => record.isCurrent) ||
          sortedRecords[sortedRecords.length - 1] ||
          sortedRecords[0];

        const historyRecords = sortedRecords.filter((record) => record.id !== currentRecord.id);

        return {
          groupId,
          currentRecord,
          historyRecords,
          records: sortedRecords,
        };
      })
      .filter((group) => {
        const matchSearch = group.records.some((record) =>
          record.nama?.toLowerCase().includes(search.toLowerCase()),
        );
        const matchFilter = filter === "All" || group.currentRecord.risk === filter.toUpperCase();

        return matchSearch && matchFilter;
      })
      .sort((a, b) => {
        const currentTimeA = new Date(a.currentRecord.updatedAt || a.currentRecord.createdAt || 0).getTime();
        const currentTimeB = new Date(b.currentRecord.updatedAt || b.currentRecord.createdAt || 0).getTime();

        return currentTimeB - currentTimeA;
      });
  }, [filter, patientsList, search]);

  const toggleGroupHistory = (groupId) => {
    setExpandedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  };

  const handleEdit = (p) => {
    setPatient(p);
    navigate("/dashboard", { state: { editing: true, patient: p } });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data pasien ini?")) {
      await deletePatientRecord(id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Daftar Pasien</h1>
        <p>Manajemen data pasien dan pemantauan risiko luka tekan.</p>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Cari nama pasien..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          <div 
            className={`pill ${filter === "All" ? "active" : ""}`}
            onClick={() => setFilter("All")}
          >
            <div className="pill-dot all"></div> Semua
          </div>
          <div 
            className={`pill ${filter === "tinggi" ? "active" : ""}`}
            onClick={() => setFilter("Tinggi")}
          >
            <div className="pill-dot high"></div> Tinggi
          </div>
          <div 
            className={`pill ${filter === "Rendah" ? "active" : ""}`}
            onClick={() => setFilter("Rendah")}
          >
            <div className="pill-dot low"></div> Rendah
          </div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Jenis Kelamin</th>
              <th>Umur</th>
              <th>Risiko Luka Tekan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {groupedPatients.map((group) => {
              const isExpanded = Boolean(expandedGroups[group.groupId]);
              const hasHistory = group.historyRecords.length > 0;

              return (
                <Fragment key={group.groupId}>
                  <tr key={group.currentRecord.id} className="patient-row-current">
                    <td>
                      <div className="patient-name-cell">
                        <div className="initials">{getInitials(group.currentRecord.nama || "")}</div>
                        <div className="patient-name-stack">
                          <span>{group.currentRecord.nama}</span>
                          {hasHistory ? (
                            <span className="record-note">
                              {group.historyRecords.length} versi lama
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td>{formatGender(group.currentRecord.jenisKelamin)}</td>
                    <td>{group.currentRecord.umur} thn</td>
                    <td>
                      <div className={`risk-tag ${riskMap[group.currentRecord.risk].className}`}>
                        <div className={`pill-dot ${riskMap[group.currentRecord.risk].className}`}></div>
                        {riskMap[group.currentRecord.risk].label}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button type="button" className="btn-icon" onClick={() => setViewPatient(group.currentRecord)}>
                          <Eye size={16} />
                        </button>
                        <button type="button" className="btn-icon" onClick={() => handleEdit(group.currentRecord)}>
                          <Edit2 size={16} />
                        </button>
                        <button type="button" className="btn-icon" onClick={() => handleDelete(group.currentRecord.id)}>
                          <Trash2 size={16} />
                        </button>
                        {hasHistory ? (
                          <button
                            type="button"
                            className="history-toggle"
                            onClick={() => toggleGroupHistory(group.groupId)}
                          >
                            {isExpanded ? <EyeOff size={14} /> : <Eye size={14} />}
                            {isExpanded ? "Sembunyikan" : "Lihat Versi Lama"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>

                  {isExpanded
                    ? group.historyRecords.map((historyRecord) => (
                        <tr key={historyRecord.id} className="patient-history-row">
                          <td>
                            <div className="patient-name-cell">
                              <div className="initials muted">{getInitials(historyRecord.nama || "")}</div>
                              <div className="patient-name-stack">
                                <span>{historyRecord.nama}</span>
                                <span className="record-note">
                                  {group.historyRecords.length} versi lama
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>{formatGender(historyRecord.jenisKelamin)}</td>
                          <td>{historyRecord.umur} thn</td>
                          <td>
                            <div className={`risk-tag ${historyRecord.risk === "HIGH" ? "high" : historyRecord.risk === "MEDIUM" ? "medium" : "low"}`}>
                              <div className={`pill-dot ${historyRecord.risk === "HIGH" ? "high" : historyRecord.risk === "MEDIUM" ? "medium" : "low"}`}></div>
                              {formatRiskLabel(historyRecord.risk)}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <button type="button" className="history-row-btn" onClick={() => setViewPatient(historyRecord)}>
                                Lihat versi lama
                              </button>
                              <button type="button" className="btn-icon" onClick={() => handleDelete(historyRecord.id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        
        <div className="pagination">
          <div>Tampilan 1-{groupedPatients.length} dari {groupedPatients.length} pasien</div>
          <div className="page-controls">
            <button className="page-btn">Sebelum</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">Selanjutnya</button>
          </div>
        </div>
      </div>

      {viewPatient && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: "400px", position: "relative" }}>
            <button className="btn-icon" style={{ position: "absolute", top: "16px", right: "16px", border: "none" }} onClick={() => setViewPatient(null)}>
              <X size={20} />
            </button>
            <h2 style={{ color: "var(--text-bright)", marginBottom: "20px", fontSize: "20px" }}>Detail Pasien</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", color: "var(--text-main)", fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Nama</span>
                <b>{viewPatient.nama}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Umur</span>
                <b>{viewPatient.umur} tahun</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Jenis Kelamin</span>
                <b>{viewPatient.jenisKelamin}</b>
              </div>
              <hr style={{ borderColor: "var(--border-color)", margin: "12px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Skor Braden</span>
                <b>{viewPatient.bradenScore}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)" }}>Risiko Luka Tekan</span>
                <div className={`risk-tag ${viewPatient.risk === "HIGH" ? "high" : "low"}`}>
                  {viewPatient.risk || "LOW"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

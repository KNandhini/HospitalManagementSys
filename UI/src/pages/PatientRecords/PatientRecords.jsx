import { useEffect, useMemo, useState } from "react";
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from "../../api/patientApi";
import PatientFormModal from "./PatientFormModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
// Styles come from the shared src/styles/common.css, imported once in main.jsx —
// no page-specific stylesheet needed here.

// Shown if the API call fails (e.g. backend not running yet) so the
// screen is still demoable. Remove once the backend is wired up.
const DEMO_PATIENTS = [
  {
    patientId: 1,
    mrn: "IME-2026-000101",
    firstName: "Ramesh",
    lastName: "Kumar",
    dateOfBirth: "1985-01-12",
    gender: "Male",
    mobileNumber: "9876543210",
    city: "Chennai",
    state: "Tamil Nadu",
    bloodGroup: "B+",
    status: "Active",
  },
  {
    patientId: 2,
    mrn: "IME-2026-000102",
    firstName: "Priya",
    lastName: "Sundaram",
    dateOfBirth: "1992-06-24",
    gender: "Female",
    mobileNumber: "9876501234",
    city: "Chennai",
    state: "Tamil Nadu",
    bloodGroup: "O+",
    status: "Active",
  },
  {
    patientId: 3,
    mrn: "IME-2026-000103",
    firstName: "Arun",
    lastName: "Raj",
    dateOfBirth: "1978-11-02",
    gender: "Male",
    mobileNumber: "9123456780",
    city: "Coimbatore",
    state: "Tamil Nadu",
    bloodGroup: "A-",
    status: "Inactive",
  },
];

function calcAge(dob) {
  if (!dob) return "—";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "—";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function initials(first, last) {
  return `${(first || "?")[0] || ""}${(last || "")[0] || ""}`.toUpperCase();
}

function statusBadgeClass(status) {
  if (status === "Active") return "badge-success";
  if (status === "Inactive") return "badge-warning";
  if (status === "Deceased") return "badge-danger";
  return "badge-muted";
}

export default function PatientRecords() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [activePatient, setActivePatient] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadPatients = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await getPatients();
      setPatients(res.data || []);
    } catch (err) {
      console.warn("Could not load patients from API, showing demo data:", err?.message);
      setPatients(DEMO_PATIENTS);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const filtered = useMemo(() => {
    let list = patients;
    if (statusFilter) {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter((p) => {
        const fullName = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
        return (
          fullName.includes(q) ||
          (p.mobileNumber || "").includes(q) ||
          (p.mrn || "").toLowerCase().includes(q) ||
          (p.city || "").toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [patients, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = patients.length;
    const active = patients.filter((p) => p.status === "Active").length;
    const inactive = patients.filter((p) => p.status === "Inactive").length;
    return { total, active, inactive };
  }, [patients]);

  const openCreate = () => {
    setModalMode("create");
    setActivePatient(null);
    setModalOpen(true);
  };

  const openEdit = (patient) => {
    setModalMode("edit");
    setActivePatient(patient);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (modalMode === "edit" && activePatient) {
        const res = await updatePatient(activePatient.patientId, formData);
        setPatients((prev) =>
          prev.map((p) =>
            p.patientId === activePatient.patientId ? { ...p, ...formData, ...res?.data } : p
          )
        );
      } else {
        const res = await createPatient(formData);
        const created = res?.data || {
          ...formData,
          patientId: Date.now(),
          mrn: `TEMP-${Date.now()}`,
        };
        setPatients((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Save patient failed:", err);
      alert(
        err?.response?.data?.message ||
          "Could not save the patient record. Please check the form and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePatient(deleteTarget.patientId);
      setPatients((prev) => prev.filter((p) => p.patientId !== deleteTarget.patientId));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete patient failed:", err);
      alert(err?.response?.data?.message || "Could not delete this patient record.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="app-page">
      <div className="app-header">
        <div>
          <h1>Patient records</h1>
          <p>Search, register, and manage patient demographics.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + New patient
        </button>
      </div>

      {loadError && (
        <div className="app-duplicate-warning" style={{ marginBottom: "1.25rem" }}>
          <span>ℹ️</span>
          <span>
            Could not reach the patients API — showing sample data so you can preview the screen.
            Connect the backend to see live records.
          </span>
        </div>
      )}

      <div className="app-stats">
        <div className="app-stat-card">
          <div className="app-stat-label">Total patients</div>
          <div className="app-stat-value">{stats.total}</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-label">Active</div>
          <div className="app-stat-value" style={{ color: "var(--color-success)" }}>{stats.active}</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-label">Inactive</div>
          <div className="app-stat-value" style={{ color: "var(--color-warning)" }}>{stats.inactive}</div>
        </div>
      </div>

      <div className="app-toolbar">
        <div className="app-search">
          <span className="app-search-icon">🔍</span>
          <input
            placeholder="Search by name, phone, MRN, or city…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="app-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Deceased">Deceased</option>
        </select>
      </div>

      {loading ? (
        <div className="app-loading">Loading patient records…</div>
      ) : filtered.length === 0 ? (
        <div className="app-empty">
          <div className="app-empty-icon">🗂️</div>
          <h3>No patients found</h3>
          <p>Try a different search, or register a new patient.</p>
        </div>
      ) : (
        <>
          {/* ── Desktop table (≥860px) ── */}
          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Age / gender</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Blood group</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.patientId}>
                    <td>
                      <div className="app-name-cell">
                        <div className="app-avatar">{initials(p.firstName, p.lastName)}</div>
                        <div>
                          <div className="app-name-main">
                            {p.firstName} {p.lastName}
                          </div>
                          <div className="app-name-sub">{p.mrn}</div>
                        </div>
                      </div>
                    </td>
                    <td>{calcAge(p.dateOfBirth)} yrs · {p.gender}</td>
                    <td>{p.mobileNumber}</td>
                    <td>{p.city}</td>
                    <td>{p.bloodGroup || "—"}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(p.status)}`}>{p.status}</span>
                    </td>
                    <td>
                      <div className="app-actions-cell">
                        <button className="btn btn-secondary btn-icon" onClick={() => openEdit(p)} aria-label="Edit">
                          ✎
                        </button>
                        <button
                          className="btn btn-secondary btn-icon"
                          onClick={() => setDeleteTarget(p)}
                          aria-label="Delete"
                          style={{ color: "var(--color-danger)" }}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile / tablet cards (<860px) ── */}
          <div className="app-cards">
            {filtered.map((p) => (
              <div className="app-card" key={p.patientId}>
                <div className="app-card-top">
                  <div className="app-card-info">
                    <div className="app-avatar">{initials(p.firstName, p.lastName)}</div>
                    <div>
                      <div className="app-name-main">
                        {p.firstName} {p.lastName}
                      </div>
                      <div className="app-name-sub">{p.mrn}</div>
                    </div>
                  </div>
                  <span className={`badge ${statusBadgeClass(p.status)}`}>{p.status}</span>
                </div>
                <div className="app-card-body">
                  <div>
                    <div className="app-card-field-label">Age / gender</div>
                    <div className="app-card-field-value">{calcAge(p.dateOfBirth)} yrs · {p.gender}</div>
                  </div>
                  <div>
                    <div className="app-card-field-label">Phone</div>
                    <div className="app-card-field-value">{p.mobileNumber}</div>
                  </div>
                  <div>
                    <div className="app-card-field-label">City</div>
                    <div className="app-card-field-value">{p.city}</div>
                  </div>
                  <div>
                    <div className="app-card-field-label">Blood group</div>
                    <div className="app-card-field-value">{p.bloodGroup || "—"}</div>
                  </div>
                </div>
                <div className="app-card-actions">
                  <button className="btn btn-secondary" onClick={() => openEdit(p)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ color: "var(--color-danger)" }}
                    onClick={() => setDeleteTarget(p)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <PatientFormModal
        open={modalOpen}
        mode={modalMode}
        initialData={activePatient}
        existingPatients={patients}
        saving={saving}
        onCancel={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete patient record?"
        message={
          deleteTarget
            ? `This will permanently remove ${deleteTarget.firstName} ${deleteTarget.lastName} (${deleteTarget.mrn}) from the system. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

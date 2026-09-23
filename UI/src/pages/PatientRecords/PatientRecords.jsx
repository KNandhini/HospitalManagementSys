import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  getPatients,
  searchPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from "../../api/patientApi";
import PatientFormModal from "./PatientFormModal";
import { getErrorMessage } from "../../utils/getErrorMessage";
// Styles come from the shared src/styles/common.css, imported once in main.jsx —
// no page-specific stylesheet needed here.

/**
 * Always returns an array, no matter what the API actually sent back —
 * a plain array, an envelope like { success, message, data: [...], executionTimeMs },
 * { patients: [...] }, null, or a single object.
 */
function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.patients)) return payload.patients;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

/**
 * The API wraps every single-object response in { success, message, data,
 * executionTimeMs }. This unwraps that envelope to get the actual patient
 * object, while still tolerating an API that returns the patient directly.
 */
function unwrapPatient(payload) {
  if (!payload) return null;
  if (payload.patientId) return payload; // already unwrapped
  if (payload.data && payload.data.patientId) return payload.data; // envelope
  return payload.data || payload;
}

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
  // Master list — loaded once, used to reset instantly when filters clear.
  const [allPatients, setAllPatients] = useState([]);
  // Currently displayed list — either allPatients or a search result.
  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [activePatient, setActivePatient] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadPatients = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await getPatients();
      const list = toArray(res?.data);
      setAllPatients(list);
      setPatients(list);
    } catch (err) {
      console.error("Could not load patients from API:", err);
      // No demo-data fallback — show an empty list plus a clear error,
      // so it's never ambiguous whether what's on screen is real data.
      setAllPatients([]);
      setPatients([]);
      setLoadError(true);
      Swal.fire({
        icon: "error",
        title: "Couldn't load patients",
        text: getErrorMessage(err, "Could not reach the server. Please try again."),
        confirmButtonColor: "var(--color-primary, #12715A)",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // Debounced call to GET /patient/search whenever the search box or
  // status filter changes — same pattern as DoctorRecords' searchDoctors.
  // When every filter is cleared, reset instantly to the cached master
  // list. On a search error, show the real error and fall back to
  // filtering whatever real data is already in allPatients — never to
  // hardcoded/demo data.
  useEffect(() => {
    const hasQuery = searchTerm.trim() || statusFilter;

    if (!hasQuery) {
      setPatients(allPatients);
      setLoadError(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await searchPatients(searchTerm.trim(), statusFilter);
        setPatients(toArray(res?.data));
        setLoadError(false);
      } catch (err) {
        console.error("Patient search failed:", err);
        setLoadError(true);
        setPatients(allPatients);
        Swal.fire({
          icon: "error",
          title: "Search failed",
          text: getErrorMessage(err, "Could not reach the server. Showing the last loaded list."),
          confirmButtonColor: "var(--color-primary, #12715A)",
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, allPatients]);

  // Client-side re-filter of the current `patients` list — safety net for
  // the offline fallback path above, and covers the case where the search
  // API doesn't filter by every field the search box matches on.
  const filtered = useMemo(() => {
    let list = Array.isArray(patients) ? patients : [];
    if (statusFilter) {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter((p) => {
        const fullName = (p.fullName || `${p.firstName || ""} ${p.lastName || ""}`).toLowerCase();
        return (
          fullName.includes(q) ||
          (p.mobileNumber || "").includes(q) ||
          (p.mrn || p.patientCode || "").toLowerCase().includes(q) ||
          (p.city || "").toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [patients, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const list = Array.isArray(allPatients) ? allPatients : [];
    const total = list.length;
    const active = list.filter((p) => p.status === "Active").length;
    const inactive = list.filter((p) => p.status === "Inactive").length;
    return { total, active, inactive };
  }, [allPatients]);

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
        const updated = unwrapPatient(res?.data);
        const merge = (p) =>
          p.patientId === activePatient.patientId ? { ...p, ...formData, ...updated } : p;
        setAllPatients((prev) => (Array.isArray(prev) ? prev : []).map(merge));
        setPatients((prev) => (Array.isArray(prev) ? prev : []).map(merge));
      } else {
        const res = await createPatient(formData);
        const created = unwrapPatient(res?.data);
        if (!created) {
          // No fabricated temp row — if the API didn't confirm the new
          // patient, treat it as a failure rather than faking a record.
          throw new Error("The server did not confirm the new patient was created.");
        }
        setAllPatients((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
        setPatients((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Save patient failed:", err);
      Swal.fire({
        icon: "error",
        title: "Couldn't save patient",
        text: getErrorMessage(err, "Could not save the patient record. Please check the form and try again."),
        confirmButtonColor: "var(--color-primary, #12715A)",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete is a self-contained SweetAlert2 flow: confirm -> delete ->
  // success toast, all triggered directly from the button click.
  const handleDeleteClick = async (patient) => {
    const displayName = patient.fullName || `${patient.firstName || ""} ${patient.lastName || ""}`.trim();
    const code = patient.mrn || patient.patientCode;

    const result = await Swal.fire({
      icon: "warning",
      title: "Delete patient record?",
      html: `This will permanently remove <strong>${displayName}</strong> (${code}) from the system. This cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "var(--color-danger, #dc2626)",
      cancelButtonColor: "var(--color-secondary, #6b7280)",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Deleting…",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await deletePatient(patient.patientId);
      const remove = (p) => p.patientId !== patient.patientId;
      setAllPatients((prev) => (Array.isArray(prev) ? prev : []).filter(remove));
      setPatients((prev) => (Array.isArray(prev) ? prev : []).filter(remove));
      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: `${displayName} has been removed.`,
        confirmButtonColor: "var(--color-primary, #12715A)",
        timer: 1800,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error("Delete patient failed:", err);
      Swal.fire({
        icon: "error",
        title: "Couldn't delete patient",
        text: getErrorMessage(err, "Could not delete this patient record."),
        confirmButtonColor: "var(--color-primary, #12715A)",
      });
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
      ) : loadError && filtered.length === 0 ? (
        <div className="app-empty">
          <div className="app-empty-icon">⚠️</div>
          <h3>Couldn't load patients</h3>
          <p>There was a problem reaching the server. Try again.</p>
          <button className="btn btn-secondary" onClick={loadPatients} style={{ marginTop: 12 }}>
            Retry
          </button>
        </div>
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
                            {p.fullName || `${p.firstName || ""} ${p.lastName || ""}`}
                          </div>
                          <div className="app-name-sub">{p.mrn || p.patientCode}</div>
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
                          onClick={() => handleDeleteClick(p)}
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
                        {p.fullName || `${p.firstName || ""} ${p.lastName || ""}`}
                      </div>
                      <div className="app-name-sub">{p.mrn || p.patientCode}</div>
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
                    onClick={() => handleDeleteClick(p)}
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
        existingPatients={allPatients}
        saving={saving}
        onCancel={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
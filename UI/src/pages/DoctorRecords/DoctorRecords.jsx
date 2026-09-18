import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  getDoctors,
  searchDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from "../../api/doctorApi";
import DoctorFormModal from "./DoctorFormModal";
import "../../styles.css";

/**
 * Different endpoints return different shapes:
 *  - GET /doctors and GET /doctors/{id}  -> firstName, lastName, ... (DoctorResponseDto)
 *  - GET /doctors/search                 -> fullName only, no firstName/lastName (DoctorSearchResultDto)
 *
 * Without this, anything rendered from search results shows a blank name,
 * a "?" avatar, and — worse — gets silently dropped by the client-side
 * filter below, because that filter reads firstName/lastName which don't
 * exist on search results. Normalizing every doctor object to always have
 * both firstName/lastName AND fullName, right where it enters state, means
 * every other part of this component can rely on a single consistent shape.
 */
function normalizeDoctor(d) {
  if (!d) return d;

  let firstName = d.firstName || "";
  let lastName = d.lastName || "";

  if (!firstName && !lastName && d.fullName) {
    const parts = d.fullName.trim().split(/\s+/);
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ") || "";
  }

  const fullName = d.fullName || `${firstName} ${lastName}`.trim();

  return {
    ...d,
    firstName,
    lastName,
    fullName,
    yearsOfExperience: d.yearsOfExperience ?? null,
  };
}

const normalizeDoctors = (list) => (list || []).map(normalizeDoctor);

// Pulls the most useful message out of an axios error — prefers the
// backend's own message, falls back to something readable if the API
// never responded at all (network/timeout/CORS).
function getErrorMessage(err, fallback) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

function initials(first, last) {
  return `${(first || "?")[0] || ""}${(last || "")[0] || ""}`.toUpperCase();
}

function statusBadgeClass(status) {
  if (status === "Active") return "badge-success";
  if (status === "OnLeave") return "badge-warning";
  if (status === "Inactive" || status === "Retired") return "badge-muted";
  return "badge-muted";
}

export default function DoctorRecords() {
  // Master list — loaded once, used to reset filters instantly and to
  // populate the specialization dropdown with the FULL set of options
  // (not just whatever happens to be in the currently filtered view).
  const [allDoctors, setAllDoctors] = useState([]);
  // Currently displayed list — either allDoctors or the result of a search.
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [activeDoctor, setActiveDoctor] = useState(null);
  const [saving, setSaving] = useState(false);

  // No demo/hardcoded fallback — if the API call fails, the screen shows
  // a real empty state and the actual error, via a SweetAlert2 popup,
  // instead of quietly substituting fake data.
  const loadDoctors = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await getDoctors();
      const normalized = normalizeDoctors(res.data);
      setAllDoctors(normalized);
      setDoctors(normalized);
    } catch (err) {
      console.error("Could not load doctors from API:", err);
      setAllDoctors([]);
      setDoctors([]);
      setLoadError(true);
      Swal.fire({
        icon: "error",
        title: "Couldn't load doctors",
        text: getErrorMessage(err, "Could not reach the server. Please try again."),
        confirmButtonColor: "var(--color-primary, #12715A)",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  // Debounced call to GET /doctors/search (backed by sp_Doctor_Search)
  // whenever the search box or filters change. When every filter is
  // cleared, reset instantly to the cached master list. On a search
  // error, show the real error and fall back to filtering whatever real
  // data is already in allDoctors — never to hardcoded demo data.
  useEffect(() => {
    const hasQuery = searchTerm.trim() || specializationFilter || statusFilter;

    if (!hasQuery) {
      setDoctors(allDoctors);
      setLoadError(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await searchDoctors(searchTerm.trim(), specializationFilter, statusFilter);
        setDoctors(normalizeDoctors(res.data));
        setLoadError(false);
      } catch (err) {
        console.error("Doctor search failed:", err);
        setLoadError(true);
        setDoctors(allDoctors);
        Swal.fire({
          icon: "error",
          title: "Search failed",
          text: getErrorMessage(err, "Could not reach the server. Showing the last loaded list."),
          confirmButtonColor: "var(--color-primary, #12715A)",
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, specializationFilter, statusFilter, allDoctors]);

  // Client-side re-filter of the current `doctors` list (safety net for
  // the offline fallback path above). Since every doctor object is
  // normalized on the way into state, fullName is always reliable here.
  const filtered = useMemo(() => {
    let list = doctors;
    if (statusFilter) list = list.filter((d) => d.status === statusFilter);
    if (specializationFilter) list = list.filter((d) => d.specialization === specializationFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter((d) => {
        return (
          (d.fullName || "").toLowerCase().includes(q) ||
          (d.mobileNumber || "").includes(q) ||
          (d.doctorCode || "").toLowerCase().includes(q) ||
          (d.medicalLicenseNumber || "").toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [doctors, searchTerm, specializationFilter, statusFilter]);

  // Built from the master list, not the filtered `doctors` — so the
  // dropdown always shows every specialization, not just whatever
  // happens to be in the current filtered view.
  const specializations = useMemo(
    () => [...new Set(allDoctors.map((d) => d.specialization).filter(Boolean))].sort(),
    [allDoctors]
  );

  const stats = useMemo(() => {
    const total = allDoctors.length;
    const active = allDoctors.filter((d) => d.status === "Active").length;
    const onLeave = allDoctors.filter((d) => d.status === "OnLeave").length;
    return { total, active, onLeave };
  }, [allDoctors]);

  const openCreate = () => {
    setModalMode("create");
    setActiveDoctor(null);
    setModalOpen(true);
  };

  const openEdit = (doctor) => {
    setModalMode("edit");
    setActiveDoctor(doctor);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (modalMode === "edit" && activeDoctor) {
        const res = await updateDoctor(activeDoctor.doctorId, formData);
        const updated = normalizeDoctor({ ...activeDoctor, ...formData, ...res?.data });
        setAllDoctors((prev) => prev.map((d) => (d.doctorId === activeDoctor.doctorId ? updated : d)));
        setDoctors((prev) => prev.map((d) => (d.doctorId === activeDoctor.doctorId ? updated : d)));
        setModalOpen(false);
        Swal.fire({
          icon: "success",
          title: "Doctor updated",
          text: `Dr. ${updated.fullName}'s details were saved.`,
          confirmButtonColor: "var(--color-primary, #12715A)",
          timer: 2000,
          timerProgressBar: true,
        });
      } else {
        const res = await createDoctor(formData);
        if (!res?.data) {
          // No fallback fake record — if the API didn't actually return
          // the created doctor, treat it as a failure rather than
          // inventing a temporary/fake row in the table.
          throw new Error("The server did not confirm the new doctor was created.");
        }
        const created = normalizeDoctor(res.data);
        setAllDoctors((prev) => [created, ...prev]);
        setDoctors((prev) => [created, ...prev]);
        setModalOpen(false);
        Swal.fire({
          icon: "success",
          title: "Doctor added",
          text: `Dr. ${created.fullName} was added successfully.`,
          confirmButtonColor: "var(--color-primary, #12715A)",
          timer: 2000,
          timerProgressBar: true,
        });
      }
    } catch (err) {
      console.error("Save doctor failed:", err);
      Swal.fire({
        icon: "error",
        title: "Couldn't save doctor",
        text: getErrorMessage(err, "Please check the form and try again."),
        confirmButtonColor: "var(--color-primary, #12715A)",
      });
    } finally {
      setSaving(false);
    }
  };

  // Shows the confirmation itself via SweetAlert2 (no separate modal
  // component/state needed), then performs the deactivate if confirmed.
  const handleDeleteClick = async (doctor) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Deactivate doctor?",
      html: `This will set <strong>Dr. ${doctor.fullName}</strong> (${doctor.doctorCode}) to Inactive.
             Their record and appointment history are kept — this does not permanently delete anything.`,
      showCancelButton: true,
      confirmButtonText: "Deactivate",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "var(--color-primary, #12715A)",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await deleteDoctor(doctor.doctorId);
      // sp_Doctor_Delete is a soft delete (sets Status = 'Inactive'), so
      // reflect that in both lists instead of removing the row entirely.
      const markInactive = (d) => (d.doctorId === doctor.doctorId ? { ...d, status: "Inactive" } : d);
      setAllDoctors((prev) => prev.map(markInactive));
      setDoctors((prev) => prev.map(markInactive));
      Swal.fire({
        icon: "success",
        title: "Doctor deactivated",
        text: `Dr. ${doctor.fullName} was set to Inactive.`,
        confirmButtonColor: "var(--color-primary, #12715A)",
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error("Delete doctor failed:", err);
      Swal.fire({
        icon: "error",
        title: "Couldn't deactivate doctor",
        text: getErrorMessage(err, "Please try again."),
        confirmButtonColor: "var(--color-primary, #12715A)",
      });
    }
  };

  return (
    <div className="app-page">
      <div className="app-header">
        <div>
          <h1>Doctors</h1>
          <p>Search, add, and manage doctor profiles and schedules.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add doctor
        </button>
      </div>

      <div className="app-stats">
        <div className="app-stat-card">
          <div className="app-stat-label">Total doctors</div>
          <div className="app-stat-value">{stats.total}</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-label">Active</div>
          <div className="app-stat-value" style={{ color: "var(--color-success)" }}>{stats.active}</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-label">On leave</div>
          <div className="app-stat-value" style={{ color: "var(--color-warning)" }}>{stats.onLeave}</div>
        </div>
      </div>

      <div className="app-toolbar">
        <div className="app-search">
          <span className="app-search-icon">🔍</span>
          <input
            placeholder="Search by name, phone, code, or license…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="app-filter-select"
          value={specializationFilter}
          onChange={(e) => setSpecializationFilter(e.target.value)}
        >
          <option value="">All specializations</option>
          {specializations.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="app-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="OnLeave">On leave</option>
          <option value="Inactive">Inactive</option>
          <option value="Retired">Retired</option>
        </select>
      </div>

      {loading ? (
        <div className="app-loading">Loading doctors…</div>
      ) : loadError && filtered.length === 0 ? (
        <div className="app-empty">
          <div className="app-empty-icon">⚠️</div>
          <h3>Couldn't load doctors</h3>
          <p>There was a problem reaching the server. Try again.</p>
          <button className="btn btn-secondary" onClick={loadDoctors} style={{ marginTop: 12 }}>
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="app-empty">
          <div className="app-empty-icon">🩺</div>
          <h3>No doctors found</h3>
          <p>Try a different search, or add a new doctor.</p>
        </div>
      ) : (
        <>
          {/* ── Desktop table (≥860px) ── */}
          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Department</th>
                  <th>Phone</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.doctorId}>
                    <td>
                      <div className="app-name-cell">
                        <div className="app-avatar">{initials(d.firstName, d.lastName)}</div>
                        <div>
                          <div className="app-name-main">Dr. {d.fullName}</div>
                          <div className="app-name-sub">{d.doctorCode}</div>
                        </div>
                      </div>
                    </td>
                    <td>{d.specialization}</td>
                    <td>{d.department || "—"}</td>
                    <td>{d.mobileNumber}</td>
                    <td>{d.yearsOfExperience != null ? `${d.yearsOfExperience} yrs` : "—"}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(d.status)}`}>{d.status}</span>
                    </td>
                    <td>
                      <div className="app-actions-cell">
                        <button className="btn btn-secondary btn-icon" onClick={() => openEdit(d)} aria-label="Edit">
                          ✎
                        </button>
                        <button
                          className="btn btn-secondary btn-icon"
                          onClick={() => handleDeleteClick(d)}
                          aria-label="Deactivate"
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
            {filtered.map((d) => (
              <div className="app-card" key={d.doctorId}>
                <div className="app-card-top">
                  <div className="app-card-info">
                    <div className="app-avatar">{initials(d.firstName, d.lastName)}</div>
                    <div>
                      <div className="app-name-main">Dr. {d.fullName}</div>
                      <div className="app-name-sub">{d.doctorCode}</div>
                    </div>
                  </div>
                  <span className={`badge ${statusBadgeClass(d.status)}`}>{d.status}</span>
                </div>
                <div className="app-card-body">
                  <div>
                    <div className="app-card-field-label">Specialization</div>
                    <div className="app-card-field-value">{d.specialization}</div>
                  </div>
                  <div>
                    <div className="app-card-field-label">Phone</div>
                    <div className="app-card-field-value">{d.mobileNumber}</div>
                  </div>
                  <div>
                    <div className="app-card-field-label">Department</div>
                    <div className="app-card-field-value">{d.department || "—"}</div>
                  </div>
                  <div>
                    <div className="app-card-field-label">Experience</div>
                    <div className="app-card-field-value">
                      {d.yearsOfExperience != null ? `${d.yearsOfExperience} yrs` : "—"}
                    </div>
                  </div>
                </div>
                <div className="app-card-actions">
                  <button className="btn btn-secondary" onClick={() => openEdit(d)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ color: "var(--color-danger)" }}
                    onClick={() => handleDeleteClick(d)}
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <DoctorFormModal
        open={modalOpen}
        mode={modalMode}
        initialData={activeDoctor}
        existingDoctors={allDoctors}
        saving={saving}
        onCancel={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
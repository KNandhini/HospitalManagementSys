import { useEffect, useMemo, useRef, useState } from "react";
import "../../styles.css";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other", "PreferNotToSay"];
const MARITAL = ["Single", "Married", "Divorced", "Widowed"];
const CONTACT_METHODS = ["Call", "SMS", "Email", "WhatsApp"];
const RELATIONSHIPS = ["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"];
const PAYER_TYPES = ["SelfPay", "Insurance", "GovtScheme"];
const STATUSES = ["Active", "Inactive", "Deceased"];

const EMPTY_FORM = {
  profilePhoto: "", // data URL (base64) of the uploaded/captured photo

  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  maritalStatus: "",
  bloodGroup: "",
  preferredLanguage: "",
  nationalId: "",

  mobileNumber: "",
  alternatePhone: "",
  email: "",
  preferredContactMethod: "",

  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",

  emergencyContactName: "",
  emergencyRelationship: "",
  emergencyPhone: "",

  insuranceProvider: "",
  policyNumber: "",
  policyValidTill: "",
  payerType: "",

  knownAllergies: "",
  chronicConditions: "",
  currentMedications: "",

  // ── Administrative / System Fields ──
  referringDoctor: "",
  status: "Active",
};

const REQUIRED_FIELDS = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "gender",
  "mobileNumber",
  "addressLine1",
  "city",
  "state",
  "postalCode",
  "emergencyContactName",
  "emergencyRelationship",
  "emergencyPhone",
];

// Human-readable labels used to build field-specific error messages,
// e.g. "City is required" instead of a generic "This field is required".
const FIELD_LABELS = {
  firstName: "First name",
  lastName: "Last name",
  dateOfBirth: "Date of birth",
  gender: "Gender",
  mobileNumber: "Mobile number",
  addressLine1: "Address line 1",
  city: "City",
  state: "State",
  postalCode: "Postal code",
  emergencyContactName: "Emergency contact name",
  emergencyRelationship: "Emergency contact relationship",
  emergencyPhone: "Emergency contact phone",
  email: "Email",
};

function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

/**
 * Validates an email address and returns an error message string, or null if valid.
 *
 * Rules:
 *  - Must match the basic "something@something.tld" shape.
 *  - Must NOT have the same domain label repeated back-to-back, e.g.
 *    "name@example.com.com" or "name@example.in.in" are rejected.
 *  - Legitimate compound TLDs are allowed since their labels differ:
 *    "name@example.com.au", "name@example.co.in", "name@example.edu.in", "name@example.com".
 */
function validateEmail(rawEmail) {
  const email = rawEmail.trim();
  if (!email) return null; // email is optional; required-ness is handled separately

  const basicShape = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!basicShape.test(email)) {
    return "Enter a valid email address, e.g. name@example.com";
  }

  const domain = email.split("@")[1];
  const labels = domain.split(".");

  for (let i = 0; i < labels.length - 1; i++) {
    if (labels[i].toLowerCase() === labels[i + 1].toLowerCase()) {
      return `Domain can't repeat ".${labels[i].toLowerCase()}" twice in a row`;
    }
  }

  // Final label (the actual TLD) should be letters only, 2+ characters.
  const tld = labels[labels.length - 1];
  if (!/^[A-Za-z]{2,}$/.test(tld)) {
    return "Enter a valid email domain (e.g. .com, .in, .co.in, .com.au)";
  }

  return null;
}

/**
 * Formats a date value for read-only display in the Administrative section.
 * Accepts ISO strings, Date objects, or falsy values.
 */
function formatDisplayDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function PatientFormModal({
  open,
  mode = "create", // "create" | "edit"
  initialData,
  existingPatients = [],
  saving = false,
  onCancel,
  onSave,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // ── Photo picker state ──────────────────────────────────────────────
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialData) {
      setForm({
        ...EMPTY_FORM,
        ...initialData,
        knownAllergies: Array.isArray(initialData.knownAllergies)
          ? initialData.knownAllergies.join(", ")
          : initialData.knownAllergies || "",
        chronicConditions: Array.isArray(initialData.chronicConditions)
          ? initialData.chronicConditions.join(", ")
          : initialData.chronicConditions || "",
        referringDoctor: initialData.referringDoctor || "",
        status: initialData.status || "Active",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setPhotoMenuOpen(false);
    setCameraOpen(false);
  }, [open, mode, initialData]);

  // Start/stop the camera stream whenever the camera modal opens/closes.
  useEffect(() => {
    if (!cameraOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    let cancelled = false;
    setCameraError("");

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        setCameraError(
          "Couldn't access the camera. Check that you've allowed camera permission and that the page is served over HTTPS."
        );
        console.error(err);
      });

    return () => {
      cancelled = true;
    };
  }, [cameraOpen]);

  // Stop the camera if the whole modal unmounts while it's open.
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const age = useMemo(() => calcAge(form.dateOfBirth), [form.dateOfBirth]);

  // Simple client-side duplicate hint — real dedupe should also happen server-side.
  const duplicateMatch = useMemo(() => {
    if (!form.mobileNumber && !(form.firstName && form.lastName && form.dateOfBirth)) {
      return null;
    }
    return existingPatients.find((p) => {
      if (mode === "edit" && initialData && p.patientId === initialData.patientId) {
        return false;
      }
      const phoneMatch =
        form.mobileNumber && p.mobileNumber === form.mobileNumber.trim();
      const nameDobMatch =
        form.firstName &&
        form.lastName &&
        form.dateOfBirth &&
        p.firstName?.toLowerCase() === form.firstName.trim().toLowerCase() &&
        p.lastName?.toLowerCase() === form.lastName.trim().toLowerCase() &&
        p.dateOfBirth === form.dateOfBirth;
      return phoneMatch || nameDobMatch;
    });
  }, [form.mobileNumber, form.firstName, form.lastName, form.dateOfBirth, existingPatients, mode, initialData]);

  if (!open) return null;

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    for (const field of REQUIRED_FIELDS) {
      if (!String(form[field] || "").trim()) {
        next[field] = `${FIELD_LABELS[field] || field} is required`;
      }
    }

    if (form.mobileNumber && !/^[0-9+\-\s()]{7,15}$/.test(form.mobileNumber.trim())) {
      next.mobileNumber = "Enter a valid phone number";
    }

    const emailError = validateEmail(form.email || "");
    if (emailError) next.email = emailError;

    if (form.postalCode && !/^[0-9A-Za-z\- ]{3,10}$/.test(form.postalCode.trim())) {
      next.postalCode = `${FIELD_LABELS.postalCode} must be a valid postal code`;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      knownAllergies: form.knownAllergies
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      chronicConditions: form.chronicConditions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    onSave(payload);
  };

  // ── Photo picker handlers ───────────────────────────────────────────
  const handleUploadClick = () => {
    setPhotoMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, profilePhoto: reader.result }));
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // allow re-selecting the same file later
  };

  const handleTakePhotoClick = () => {
    setPhotoMenuOpen(false);
    setCameraOpen(true);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setForm((f) => ({ ...f, profilePhoto: dataUrl }));
    setCameraOpen(false);
  };

  const handleRemovePhoto = () => {
    setPhotoMenuOpen(false);
    setForm((f) => ({ ...f, profilePhoto: "" }));
  };

  return (
    <div className="app-modal-overlay" onMouseDown={onCancel}>
      <div className="app-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="app-modal-header">
          <h2>{mode === "edit" ? "Edit patient" : "Register new patient"}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="app-modal-body">
            {duplicateMatch && (
              <div className="app-duplicate-warning">
                <span>⚠️</span>
                <span>
                  A patient with this {duplicateMatch.mobileNumber === form.mobileNumber ? "phone number" : "name and date of birth"} already
                  exists: <strong>{duplicateMatch.firstName} {duplicateMatch.lastName}</strong>
                  {duplicateMatch.mrn ? ` (MRN ${duplicateMatch.mrn})` : ""}. Double check before saving a new record.
                </span>
              </div>
            )}

           

            {/* ── Photo ── */}
            <div className="app-section">
              <div className="app-section-title">Photo</div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setPhotoMenuOpen((v) => !v)}
                  aria-label="Add or change patient photo"
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    border: "1px solid var(--color-border, #D9D9D9)",
                    background: form.profilePhoto
                      ? `url(${form.profilePhoto}) center/cover no-repeat`
                      : "var(--color-surface-muted, #F2F2F2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: 22,
                    color: "var(--color-text-muted, #8A8A8A)",
                  }}
                >
                  {!form.profilePhoto && "＋"}
                </button>

                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {form.profilePhoto ? "Photo added" : "No photo added"}
                  </div>
                  <button
                    type="button"
                    style={{
                      padding: 0,
                      marginTop: 2,
                      background: "none",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--color-primary, #12715A)",
                      cursor: "pointer",
                    }}
                    onClick={() => setPhotoMenuOpen((v) => !v)}
                  >
                    {form.profilePhoto ? "Change photo" : "Add photo"}
                  </button>
                </div>

                {photoMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: 80,
                      left: 0,
                      zIndex: 20,
                      background: "#fff",
                      border: "1px solid #D9D9D9",
                      borderRadius: 8,
                      boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                      minWidth: 200,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleUploadClick}
                      style={menuItemStyle}
                    >
                      📁 Upload from device
                    </button>
                    <button
                      type="button"
                      onClick={handleTakePhotoClick}
                      style={menuItemStyle}
                    >
                      📷 Take a photo
                    </button>
                    {form.profilePhoto && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        style={{ ...menuItemStyle, color: "#B3261E" }}
                      >
                        🗑 Remove photo
                      </button>
                    )}
                  </div>
                )}

                {/* Hidden file input used for "Upload from device".
                    On mobile browsers, adding capture="environment" here instead
                    would skip this custom camera UI and hand off straight to the
                    device's native camera app; we use getUserMedia below instead
                    so the capture UI stays consistent across devices. */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* ── Camera capture modal ── */}
            {cameraOpen && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 50,
                }}
                onMouseDown={() => setCameraOpen(false)}
              >
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 16,
                    width: 420,
                    maxWidth: "90vw",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 10 }}>Take a photo</div>

                  {cameraError ? (
                    <div style={{ color: "#B3261E", fontSize: 13, marginBottom: 10 }}>
                      {cameraError}
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: "100%", borderRadius: 8, background: "#000" }}
                    />
                  )}
                  <canvas ref={canvasRef} style={{ display: "none" }} />

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setCameraOpen(false)}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleCapture}
                      disabled={!!cameraError}
                    >
                      Capture
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Personal Information ── */}
            <div className="app-section">
              <div className="app-section-title">Personal information</div>
              <div className="app-form-grid">
                <div className="field">
                  <label>First name<span className="required">*</span></label>
                  <input
                    value={form.firstName}
                    onChange={update("firstName")}
                    maxLength={50}
                    className={errors.firstName ? "has-error" : ""}
                  />
                  {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                </div>
                <div className="field">
                  <label>Middle name</label>
                  <input value={form.middleName} onChange={update("middleName")} maxLength={50} />
                </div>
                <div className="field">
                  <label>Last name<span className="required">*</span></label>
                  <input
                    value={form.lastName}
                    onChange={update("lastName")}
                    maxLength={50}
                    className={errors.lastName ? "has-error" : ""}
                  />
                  {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                </div>
                <div className="field">
                  <label>
                    Date of birth<span className="required">*</span>
                    {age !== null && (
                      <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}> · {age} yrs</span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={update("dateOfBirth")}
                    className={errors.dateOfBirth ? "has-error" : ""}
                  />
                  {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
                </div>
                <div className="field">
                  <label>Gender<span className="required">*</span></label>
                  <select value={form.gender} onChange={update("gender")} className={errors.gender ? "has-error" : ""}>
                    <option value="">Select</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g === "PreferNotToSay" ? "Prefer not to say" : g}
                      </option>
                    ))}
                  </select>
                  {errors.gender && <span className="error-text">{errors.gender}</span>}
                </div>
                <div className="field">
                  <label>Marital status</label>
                  <select value={form.maritalStatus} onChange={update("maritalStatus")}>
                    <option value="">Select</option>
                    {MARITAL.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Blood group</label>
                  <select value={form.bloodGroup} onChange={update("bloodGroup")}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Preferred language</label>
                  <input value={form.preferredLanguage} onChange={update("preferredLanguage")} maxLength={30} />
                </div>
                <div className="field span-2">
                  <label>National ID / Aadhaar / SSN</label>
                  <input
                    value={form.nationalId}
                    onChange={update("nationalId")}
                    maxLength={50}
                    placeholder="Stored securely and masked in lists"
                  />
                </div>
              </div>
            </div>

            {/* ── Contact Details ── */}
            <div className="app-section">
              <div className="app-section-title">Contact details</div>
              <div className="app-form-grid">
                <div className="field">
                  <label>Mobile number<span className="required">*</span></label>
                  <input
                    value={form.mobileNumber}
                    onChange={update("mobileNumber")}
                    maxLength={15}
                    className={errors.mobileNumber ? "has-error" : ""}
                  />
                  {errors.mobileNumber && <span className="error-text">{errors.mobileNumber}</span>}
                </div>
                <div className="field">
                  <label>Alternate phone</label>
                  <input value={form.alternatePhone} onChange={update("alternatePhone")} maxLength={15} />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    maxLength={100}
                    className={errors.email ? "has-error" : ""}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>
                <div className="field">
                  <label>Preferred contact method</label>
                  <select value={form.preferredContactMethod} onChange={update("preferredContactMethod")}>
                    <option value="">Select</option>
                    {CONTACT_METHODS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Address ── */}
            <div className="app-section">
              <div className="app-section-title">Address</div>
              <div className="app-form-grid">
                <div className="field span-2">
                  <label>Address line 1<span className="required">*</span></label>
                  <input
                    value={form.addressLine1}
                    onChange={update("addressLine1")}
                    maxLength={150}
                    className={errors.addressLine1 ? "has-error" : ""}
                  />
                  {errors.addressLine1 && <span className="error-text">{errors.addressLine1}</span>}
                </div>
                <div className="field span-2">
                  <label>Address line 2</label>
                  <input value={form.addressLine2} onChange={update("addressLine2")} maxLength={150} />
                </div>
                <div className="field">
                  <label>City<span className="required">*</span></label>
                  <input
                    value={form.city}
                    onChange={update("city")}
                    maxLength={50}
                    className={errors.city ? "has-error" : ""}
                  />
                  {errors.city && <span className="error-text">{errors.city}</span>}
                </div>
                <div className="field">
                  <label>State<span className="required">*</span></label>
                  <input
                    value={form.state}
                    onChange={update("state")}
                    maxLength={50}
                    className={errors.state ? "has-error" : ""}
                  />
                  {errors.state && <span className="error-text">{errors.state}</span>}
                </div>
                <div className="field">
                  <label>Postal code<span className="required">*</span></label>
                  <input
                    value={form.postalCode}
                    onChange={update("postalCode")}
                    maxLength={10}
                    className={errors.postalCode ? "has-error" : ""}
                  />
                  {errors.postalCode && <span className="error-text">{errors.postalCode}</span>}
                </div>
                <div className="field">
                  <label>Country</label>
                  <input value={form.country} onChange={update("country")} maxLength={50} />
                </div>
              </div>
            </div>

            {/* ── Emergency Contact ── */}
            <div className="app-section">
              <div className="app-section-title">Emergency contact</div>
              <div className="app-form-grid">
                <div className="field">
                  <label>Contact name<span className="required">*</span></label>
                  <input
                    value={form.emergencyContactName}
                    onChange={update("emergencyContactName")}
                    maxLength={100}
                    className={errors.emergencyContactName ? "has-error" : ""}
                  />
                  {errors.emergencyContactName && <span className="error-text">{errors.emergencyContactName}</span>}
                </div>
                <div className="field">
                  <label>Relationship<span className="required">*</span></label>
                  <select
                    value={form.emergencyRelationship}
                    onChange={update("emergencyRelationship")}
                    className={errors.emergencyRelationship ? "has-error" : ""}
                  >
                    <option value="">Select</option>
                    {RELATIONSHIPS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {errors.emergencyRelationship && <span className="error-text">{errors.emergencyRelationship}</span>}
                </div>
                <div className="field span-2">
                  <label>Phone number<span className="required">*</span></label>
                  <input
                    value={form.emergencyPhone}
                    onChange={update("emergencyPhone")}
                    maxLength={15}
                    className={errors.emergencyPhone ? "has-error" : ""}
                  />
                  {errors.emergencyPhone && <span className="error-text">{errors.emergencyPhone}</span>}
                </div>
              </div>
            </div>

            {/* ── Insurance / Billing ── */}
            <div className="app-section">
              <div className="app-section-title">Insurance / billing</div>
              <div className="app-form-grid">
                <div className="field">
                  <label>Insurance provider</label>
                  <input value={form.insuranceProvider} onChange={update("insuranceProvider")} maxLength={100} />
                </div>
                <div className="field">
                  <label>Policy number</label>
                  <input value={form.policyNumber} onChange={update("policyNumber")} maxLength={50} />
                </div>
                <div className="field">
                  <label>Policy valid till</label>
                  <input type="date" value={form.policyValidTill} onChange={update("policyValidTill")} />
                </div>
                <div className="field">
                  <label>Payer type</label>
                  <select value={form.payerType} onChange={update("payerType")}>
                    <option value="">Select</option>
                    {PAYER_TYPES.map((p) => (
                      <option key={p} value={p}>
                        {p === "SelfPay" ? "Self-pay" : p === "GovtScheme" ? "Government scheme" : p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
 {/* ── Administrative / System Fields ── */}
            <div className="app-section">
              <div className="app-section-title">Administrative</div>
              <div className="app-form-grid">
                <div className="field">
                  <label>Patient ID / MRN</label>
                  <input
                    value={
                      mode === "edit"
                        ? initialData?.mrn || "—"
                        : "Auto-generated on save"
                    }
                    readOnly
                    disabled
                    style={{
                      background: "var(--color-surface-alt)",
                      color: "var(--color-text-muted)",
                      cursor: "not-allowed",
                    }}
                  />
                </div>
                <div className="field">
                  <label>Registration date</label>
                  <input
                    value={
                      mode === "edit"
                        ? formatDisplayDate(initialData?.registrationDate) || "—"
                        : "Set automatically on save"
                    }
                    readOnly
                    disabled
                    style={{
                      background: "var(--color-surface-alt)",
                      color: "var(--color-text-muted)",
                      cursor: "not-allowed",
                    }}
                  />
                </div>
                <div className="field">
                  <label>Registered by</label>
                  <input
                    value={
                      mode === "edit"
                        ? initialData?.registeredBy || "—"
                        : "Current staff user"
                    }
                    readOnly
                    disabled
                    style={{
                      background: "var(--color-surface-alt)",
                      color: "var(--color-text-muted)",
                      cursor: "not-allowed",
                    }}
                  />
                </div>
                <div className="field">
                  <label>Referring doctor</label>
                  <input
                    value={form.referringDoctor}
                    onChange={update("referringDoctor")}
                    maxLength={150}
                    placeholder="Optional"
                  />
                </div>
                <div className="field">
                  <label>Status</label>
                  <select value={form.status} onChange={update("status")}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {/* ── Clinical Context ── */}
            <div className="app-section">
              <div className="app-section-title">Clinical context (optional)</div>
              <div className="app-form-grid">
                <div className="field span-2">
                  <label>Known allergies</label>
                  <input
                    value={form.knownAllergies}
                    onChange={update("knownAllergies")}
                    placeholder="Comma-separated, e.g. Penicillin, Peanuts"
                  />
                </div>
                <div className="field span-2">
                  <label>Chronic conditions</label>
                  <input
                    value={form.chronicConditions}
                    onChange={update("chronicConditions")}
                    placeholder="Comma-separated, e.g. Diabetes, Hypertension"
                  />
                </div>
                <div className="field span-2">
                  <label>Current medications</label>
                  <textarea value={form.currentMedications} onChange={update("currentMedications")} maxLength={1000} />
                </div>
              </div>
            </div>
          </div>

          <div className="app-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Register patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const menuItemStyle = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "10px 14px",
  background: "none",
  border: "none",
  borderBottom: "1px solid #EEE",
  cursor: "pointer",
  fontSize: 14,
};
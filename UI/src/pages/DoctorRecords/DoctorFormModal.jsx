import { useEffect, useMemo, useRef, useState } from "react";

const GENDERS = ["Male", "Female", "Other", "PreferNotToSay"];
const STATUSES = ["Active", "Inactive", "OnLeave", "Retired"];
const CONTACT_METHODS = ["Call", "SMS", "Email", "WhatsApp"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EMPTY_FORM = {
  photoUrl: "",

  // Personal
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  nationalId: "",

  // Professional
  specialization: "",
  qualification: "",
  medicalLicenseNumber: "",
  registrationCouncil: "",
  yearsOfExperience: "",
  department: "",
  designation: "",

  // Contact
  mobileNumber: "",
  alternatePhone: "",
  email: "",
  preferredContactMethod: "",

  // Address
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",

  // Practice / scheduling
  consultationFee: "",
  availableDays: [],
  availableTimeFrom: "",
  availableTimeTo: "",
  maxPatientsPerDay: "",
  joiningDate: "",

  // Bio / misc
  bio: "",
  languagesSpoken: "",

  // Administrative
  status: "Active",
};

const REQUIRED_FIELDS = [
  "firstName",
  "lastName",
  "gender",
  "dateOfBirth",
  "specialization",
  "qualification",
  "medicalLicenseNumber",
  "mobileNumber",
  "joiningDate",
  "availableTimeFrom",
  "availableTimeTo",
];

const FIELD_LABELS = {
  firstName: "First name",
  lastName: "Last name",
  gender: "Gender",
  dateOfBirth: "Date of birth",
  specialization: "Specialization",
  qualification: "Qualification",
  medicalLicenseNumber: "Medical license number",
  mobileNumber: "Mobile number",
  joiningDate: "Joining date",
  availableTimeFrom: "Available time from",
  availableTimeTo: "Available time to",
  email: "Email",
};

function validateEmail(rawEmail) {
  const email = rawEmail.trim();

  if (!email) return null;

  const basicShape = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!basicShape.test(email)) {
    return "Enter a valid email address, e.g. name@example.com";
  }

  const domain = email.split("@")[1];
  const labels = domain.split(".");

  for (let i = 0; i < labels.length - 1; i++) {
    if (
      labels[i].toLowerCase() ===
      labels[i + 1].toLowerCase()
    ) {
      return `Domain can't repeat ".${labels[
        i
      ].toLowerCase()}" twice in a row`;
    }
  }

  const tld = labels[labels.length - 1];

  if (!/^[A-Za-z]{2,}$/.test(tld)) {
    return "Enter a valid email domain (e.g. .com, .in, .co.in)";
  }

  return null;
}

function formatDisplayDate(value) {
  if (!value) return null;

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return null;

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toDateInputValue(value) {
  if (!value) return "";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "";

  return d.toISOString().slice(0, 10);
}

/*
|--------------------------------------------------------------------------
| PHOTO URL FIX
|--------------------------------------------------------------------------
|
| Supports:
|
| 1. data:image/jpeg;base64,/9j/....
|
| 2. data\:image/jpeg;base64,/9j/....
|
| 3. /9j/....                  <-- Base64 only
|
*/

function getPhotoUrl(photoUrl) {
    debugger;
  if (!photoUrl) {
    return "";
  }

  let photo = String(photoUrl).trim();

  // Remove quotes if API/database returns them
  if (
    photo.startsWith('"') &&
    photo.endsWith('"')
  ) {
    photo = photo.slice(1, -1);
  }

  // Fix:
  // data\:image/jpeg
  // into:
  // data:image/jpeg
  photo = photo.replace(
    /^data\\:/,
    "data:"
  );

  // Fix escaped slashes if present
  photo = photo.replace(
    /^data:\\?\/\\?\/+/,
    "data:"
  );

  // Already a complete image data URL
  if (photo.startsWith("data:image/")) {
    return photo;
  }

  // Backend returned Base64 only
  return `data:image/jpeg;base64,${photo}`;
}

export default function DoctorFormModal({
  open,
  mode = "create",
  initialData,
  existingDoctors = [],
  saving = false,
  onCancel,
  onSave,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  /*
  |--------------------------------------------------------------------------
  | LOAD DOCTOR DATA FOR EDIT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialData) {
      const photo = getPhotoUrl(
        initialData.photoUrl
      );

      console.log(
        "================================="
      );

      console.log(
        "DOCTOR EDIT DATA"
      );

      console.log(
        "initialData:",
        initialData
      );

      console.log(
        "API photoUrl:",
        initialData.photoUrl
      );

      console.log(
        "FINAL photoUrl:",
        photo
      );

      console.log(
        "Photo length:",
        photo.length
      );

      console.log(
        "================================="
      );

      setForm({
        ...EMPTY_FORM,

        ...initialData,

        /*
        IMPORTANT:
        Explicitly bind API photoUrl
        to form.photoUrl
        */
        photoUrl: photo,

        dateOfBirth:
          toDateInputValue(
            initialData.dateOfBirth
          ),

        joiningDate:
          toDateInputValue(
            initialData.joiningDate
          ),

        availableDays:
          Array.isArray(
            initialData.availableDays
          )
            ? initialData.availableDays
            : typeof initialData.availableDays ===
                "string" &&
              initialData.availableDays
            ? initialData.availableDays
                .split(",")
                .map((d) => d.trim())
            : [],

        languagesSpoken:
          Array.isArray(
            initialData.languagesSpoken
          )
            ? initialData.languagesSpoken.join(
                ", "
              )
            : initialData.languagesSpoken ||
              "",
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        availableDays: [],
      });
    }

    setErrors({});
  }, [
    open,
    mode,
    initialData,
  ]);

  /*
  |--------------------------------------------------------------------------
  | DUPLICATE CHECK
  |--------------------------------------------------------------------------
  */

  const duplicateMatch = useMemo(() => {
    if (
      !form.mobileNumber &&
      !form.medicalLicenseNumber
    ) {
      return null;
    }

    return existingDoctors.find((d) => {
      if (
        mode === "edit" &&
        initialData &&
        d.doctorId ===
          initialData.doctorId
      ) {
        return false;
      }

      const phoneMatch =
        form.mobileNumber &&
        d.mobileNumber ===
          form.mobileNumber.trim();

      const licenseMatch =
        form.medicalLicenseNumber &&
        d.medicalLicenseNumber
          ?.toLowerCase() ===
          form.medicalLicenseNumber
            .trim()
            .toLowerCase();

      return (
        phoneMatch ||
        licenseMatch
      );
    });
  }, [
    form.mobileNumber,
    form.medicalLicenseNumber,
    existingDoctors,
    mode,
    initialData,
  ]);

  if (!open) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | UPDATE FIELD
  |--------------------------------------------------------------------------
  */

  const update = (field) => (e) => {
    const value = e.target.value;

    setForm((f) => ({
      ...f,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((er) => ({
        ...er,
        [field]: undefined,
      }));
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DAYS
  |--------------------------------------------------------------------------
  */

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,

      availableDays:
        f.availableDays.includes(day)
          ? f.availableDays.filter(
              (d) => d !== day
            )
          : [
              ...f.availableDays,
              day,
            ],
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | PHOTO UPLOAD
  |--------------------------------------------------------------------------
  */

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith("image/")
    ) {
      alert(
        "Please select an image file."
      );
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      const result =
        reader.result;

      console.log(
        "New uploaded image:",
        result
      );

      setForm((f) => ({
        ...f,
        photoUrl: result,
      }));
    };

    reader.onerror = () => {
      console.error(
        "Failed to read image"
      );
    };

    reader.readAsDataURL(file);

    e.target.value = "";
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const validate = () => {
    const next = {};

    for (const field of REQUIRED_FIELDS) {
      if (
        !String(
          form[field] || ""
        ).trim()
      ) {
        next[field] = `${
          FIELD_LABELS[field] ||
          field
        } is required`;
      }
    }

    if (
      form.mobileNumber &&
      !/^[0-9+\-\s()]{7,15}$/.test(
        form.mobileNumber.trim()
      )
    ) {
      next.mobileNumber =
        "Enter a valid phone number";
    }

    const emailError =
      validateEmail(
        form.email || ""
      );

    if (emailError) {
      next.email = emailError;
    }

    if (
      form.yearsOfExperience &&
      Number(
        form.yearsOfExperience
      ) < 0
    ) {
      next.yearsOfExperience =
        "Must be 0 or more";
    }

    if (
      form.consultationFee &&
      Number(
        form.consultationFee
      ) < 0
    ) {
      next.consultationFee =
        "Must be 0 or more";
    }

    if (
      form.availableTimeFrom &&
      form.availableTimeTo &&
      form.availableTimeFrom >=
        form.availableTimeTo
    ) {
      next.availableTimeTo =
        "Must be later than the start time";
    }

    setErrors(next);

    return (
      Object.keys(next).length === 0
    );
  };

  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const payload = {
      ...form,

      yearsOfExperience:
        form.yearsOfExperience
          ? Number(
              form.yearsOfExperience
            )
          : null,

      consultationFee:
        form.consultationFee
          ? Number(
              form.consultationFee
            )
          : null,

      maxPatientsPerDay:
        form.maxPatientsPerDay
          ? Number(
              form.maxPatientsPerDay
            )
          : null,

      languagesSpoken:
        form.languagesSpoken
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
    };

    console.log(
      "Saving doctor:"
    );

    console.log(
      "Photo being saved:",
      payload.photoUrl
    );

    onSave(payload);
  };

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="app-modal-overlay"
      onMouseDown={onCancel}
    >
      <div
        className="app-modal"
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >
        {/* HEADER */}

        <div className="app-modal-header">
          <h2>
            {mode === "edit"
              ? "Edit doctor"
              : "Add new doctor"}
          </h2>

          <button
            className="btn btn-ghost btn-icon"
            onClick={onCancel}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
        >
          <div className="app-modal-body">

            {/* ==================================================
                PHOTO
            ================================================== */}

            <div className="app-section">
              <div className="app-section-title">
                Photo
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                {/* IMAGE */}

                <button
                  type="button"
                  onClick={
                    handleUploadClick
                  }
                  aria-label="Add or change doctor photo"
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    border:
                      "1px solid var(--color-border)",
                    background:
                      "var(--color-surface-alt)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",
                    cursor: "pointer",
                    padding: 0,
                    overflow: "hidden",
                  }}
                >
                  {form.photoUrl ? (
                    <img
                      src={
                        form.photoUrl
                      }
                      alt={`${form.firstName || "Doctor"} photo`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                      onLoad={() => {
                        console.log(
                          "IMAGE LOADED SUCCESSFULLY"
                        );
                      }}
                      onError={(e) => {
                        console.error(
                          "IMAGE FAILED TO LOAD"
                        );

                        console.error(
                          "photoUrl:",
                          form.photoUrl
                        );

                        console.error(
                          "photo length:",
                          form.photoUrl?.length
                        );
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: 22,
                        color:
                          "var(--color-text-muted)",
                      }}
                    >
                      ＋
                    </span>
                  )}
                </button>

                {/* PHOTO TEXT */}

                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {form.photoUrl
                      ? "Photo added"
                      : "No photo added"}
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleUploadClick
                    }
                    style={{
                      padding: 0,
                      marginTop: 2,
                      background:
                        "none",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 600,
                      color:
                        "var(--color-primary)",
                      cursor:
                        "pointer",
                    }}
                  >
                    {form.photoUrl
                      ? "Change photo"
                      : "Upload photo"}
                  </button>
                </div>

                {/* HIDDEN FILE INPUT */}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{
                    display: "none",
                  }}
                  onChange={
                    handleFileChange
                  }
                />
              </div>
            </div>

            {/* ==================================================
                PERSONAL INFORMATION
            ================================================== */}

            <div className="app-section">
              <div className="app-section-title">
                Personal information
              </div>

              <div className="app-form-grid">

                <div className="field">
                  <label>
                    First name
                    <span className="required">
                      *
                    </span>
                  </label>

                  <input
                    value={
                      form.firstName
                    }
                    onChange={update(
                      "firstName"
                    )}
                    maxLength={50}
                    className={
                      errors.firstName
                        ? "has-error"
                        : ""
                    }
                  />

                  {errors.firstName && (
                    <span className="error-text">
                      {
                        errors.firstName
                      }
                    </span>
                  )}
                </div>

                <div className="field">
                  <label>
                    Middle name
                  </label>

                  <input
                    value={
                      form.middleName
                    }
                    onChange={update(
                      "middleName"
                    )}
                    maxLength={50}
                  />
                </div>

                <div className="field">
                  <label>
                    Last name
                    <span className="required">
                      *
                    </span>
                  </label>

                  <input
                    value={
                      form.lastName
                    }
                    onChange={update(
                      "lastName"
                    )}
                    maxLength={50}
                    className={
                      errors.lastName
                        ? "has-error"
                        : ""
                    }
                  />

                  {errors.lastName && (
                    <span className="error-text">
                      {
                        errors.lastName
                      }
                    </span>
                  )}
                </div>

                <div className="field">
                  <label>
                    Gender
                    <span className="required">
                      *
                    </span>
                  </label>

                  <select
                    value={form.gender}
                    onChange={update(
                      "gender"
                    )}
                    className={
                      errors.gender
                        ? "has-error"
                        : ""
                    }
                  >
                    <option value="">
                      Select
                    </option>

                    {GENDERS.map(
                      (g) => (
                        <option
                          key={g}
                          value={g}
                        >
                          {g ===
                          "PreferNotToSay"
                            ? "Prefer not to say"
                            : g}
                        </option>
                      )
                    )}
                  </select>

                  {errors.gender && (
                    <span className="error-text">
                      {errors.gender}
                    </span>
                  )}
                </div>

                <div className="field">
                  <label>
                    Date of birth
                    <span className="required">
                      *
                    </span>
                  </label>

                  <input
                    type="date"
                    value={
                      form.dateOfBirth
                    }
                    onChange={update(
                      "dateOfBirth"
                    )}
                    className={
                      errors.dateOfBirth
                        ? "has-error"
                        : ""
                    }
                  />

                  {errors.dateOfBirth && (
                    <span className="error-text">
                      {
                        errors.dateOfBirth
                      }
                    </span>
                  )}
                </div>

                <div className="field">
                  <label>
                    National ID
                  </label>

                  <input
                    value={
                      form.nationalId
                    }
                    onChange={update(
                      "nationalId"
                    )}
                    maxLength={50}
                  />
                </div>

              </div>
            </div>

            {/* ==================================================
                PROFESSIONAL DETAILS
            ================================================== */}

            <div className="app-section">
              <div className="app-section-title">
                Professional details
              </div>

              <div className="app-form-grid">

                <div className="field">
                  <label>
                    Specialization
                    <span className="required">
                      *
                    </span>
                  </label>

                  <input
                    value={
                      form.specialization
                    }
                    onChange={update(
                      "specialization"
                    )}
                    maxLength={100}
                    placeholder="e.g. Cardiology"
                    className={
                      errors.specialization
                        ? "has-error"
                        : ""
                    }
                  />

                  {errors.specialization && (
                    <span className="error-text">
                      {
                        errors.specialization
                      }
                    </span>
                  )}
                </div>

                <div className="field">
                  <label>
                    Qualification
                    <span className="required">
                      *
                    </span>
                  </label>

                  <input
                    value={
                      form.qualification
                    }
                    onChange={update(
                      "qualification"
                    )}
                    maxLength={150}
                    placeholder="e.g. MBBS, MD"
                    className={
                      errors.qualification
                        ? "has-error"
                        : ""
                    }
                  />

                  {errors.qualification && (
                    <span className="error-text">
                      {
                        errors.qualification
                      }
                    </span>
                  )}
                </div>

                <div className="field">
                  <label>
                    Medical license number
                    <span className="required">
                      *
                    </span>
                  </label>

                  <input
                    value={
                      form.medicalLicenseNumber
                    }
                    onChange={update(
                      "medicalLicenseNumber"
                    )}
                    maxLength={50}
                    className={
                      errors.medicalLicenseNumber
                        ? "has-error"
                        : ""
                    }
                  />

                  {errors.medicalLicenseNumber && (
                    <span className="error-text">
                      {
                        errors.medicalLicenseNumber
                      }
                    </span>
                  )}
                </div>

                <div className="field">
                  <label>
                    Registration council
                  </label>

                  <input
                    value={
                      form.registrationCouncil
                    }
                    onChange={update(
                      "registrationCouncil"
                    )}
                    maxLength={150}
                    placeholder="e.g. Medical Council of India"
                  />
                </div>

                <div className="field">
                  <label>
                    Years of experience
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.yearsOfExperience
                    }
                    onChange={update(
                      "yearsOfExperience"
                    )}
                    className={
                      errors.yearsOfExperience
                        ? "has-error"
                        : ""
                    }
                  />

                  {errors.yearsOfExperience && (
                    <span className="error-text">
                      {
                        errors.yearsOfExperience
                      }
                    </span>
                  )}
                </div>

                <div className="field">
                  <label>
                    Department
                  </label>

                  <input
                    value={
                      form.department
                    }
                    onChange={update(
                      "department"
                    )}
                    maxLength={100}
                  />
                </div>

                <div className="field">
                  <label>
                    Designation
                  </label>

                  <input
                    value={
                      form.designation
                    }
                    onChange={update(
                      "designation"
                    )}
                    maxLength={100}
                    placeholder="e.g. Senior Consultant"
                  />
                </div>

              </div>
            </div>

            {/* ==================================================
                CONTACT DETAILS
            ================================================== */}

            <div className="app-section">
              <div className="app-section-title">
                Contact details
              </div>

              <div className="app-form-grid">

                <div className="field">
                  <label>
                    Mobile number
                    <span className="required">
                      *
                    </span>
                  </label>

                  <input
                    value={
                      form.mobileNumber
                    }
                    onChange={update(
                      "mobileNumber"
                    )}
                    maxLength={15}
                    className={
                      errors.mobileNumber
                        ? "has-error"
                        : ""
                    }
                  />

                  {errors.mobileNumber && (
                    <span className="error-text">
                      {
                        errors.mobileNumber
                      }
                    </span>
                  )}
                </div>

                <div className="field">
                  <label>
                    Alternate phone
                  </label>

                  <input
                    value={
                      form.alternatePhone
                    }
                    onChange={update(
                      "alternatePhone"
                    )}
                    maxLength={15}
                  />
                </div>

                <div className="field">
                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={update(
                      "email"
                    )}
                    maxLength={100}
                    className={
                      errors.email
                        ? "has-error"
                        : ""
                    }
                  />

                  {errors.email && (
                    <span className="error-text">
                      {errors.email}
                    </span>
                  )}
                </div>

                <div className="field">
                  <label>
                    Preferred contact method
                  </label>

                  <select
                    value={
                      form.preferredContactMethod
                    }
                    onChange={update(
                      "preferredContactMethod"
                    )}
                  >
                    <option value="">
                      Select
                    </option>

                    {CONTACT_METHODS.map(
                      (c) => (
                        <option
                          key={c}
                          value={c}
                        >
                          {c}
                        </option>
                      )
                    )}
                  </select>
                </div>

              </div>
            </div>

            {/* ==================================================
                ADDRESS
            ================================================== */}

            <div className="app-section">
              <div className="app-section-title">
                Address
              </div>

              <div className="app-form-grid">

                <div className="field span-2">
                  <label>
                    Address line 1
                  </label>

                  <input
                    value={
                      form.addressLine1
                    }
                    onChange={update(
                      "addressLine1"
                    )}
                    maxLength={150}
                  />
                </div>

                <div className="field span-2">
                  <label>
                    Address line 2
                  </label>

                  <input
                    value={
                      form.addressLine2
                    }
                    onChange={update(
                      "addressLine2"
                    )}
                    maxLength={150}
                  />
                </div>

                <div className="field">
                  <label>
                    City
                  </label>

                  <input
                    value={form.city}
                    onChange={update(
                      "city"
                    )}
                    maxLength={50}
                  />
                </div>

                <div className="field">
                  <label>
                    State
                  </label>

                  <input
                    value={form.state}
                    onChange={update(
                      "state"
                    )}
                    maxLength={50}
                  />
                </div>

                <div className="field">
                  <label>
                    Postal code
                  </label>

                  <input
                    value={
                      form.postalCode
                    }
                    onChange={update(
                      "postalCode"
                    )}
                    maxLength={10}
                  />
                </div>

                <div className="field">
                  <label>
                    Country
                  </label>

                  <input
                    value={form.country}
                    onChange={update(
                      "country"
                    )}
                    maxLength={50}
                  />
                </div>

              </div>
            </div>

            {/* ==================================================
                PRACTICE / SCHEDULING
            ================================================== */}

            <div className="app-section">
              <div className="app-section-title">
                Practice &amp; scheduling
              </div>

              <div className="app-form-grid">

                <div className="field">
                  <label>
                    Consultation fee
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.consultationFee
                    }
                    onChange={update(
                      "consultationFee"
                    )}
                    className={
                      errors.consultationFee
                        ? "has-error"
                        : ""
                    }
                  />

                  {errors.consultationFee && (
                    <span className="error-text">
                      {
                        errors.consultationFee
                      }
                    </span>
                  )}
                </div>

                <div className="field">
                  <label>
                    Max patients per day
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.maxPatientsPerDay
                    }
                    onChange={update(
                      "maxPatientsPerDay"
                    )}
                  />
                </div>

                <div className="field">
                  <label>
                    Available time from
                    <span className="required">
                      *
                    </span>
                  </label>

                  <input
                    type="time"
                    value={
                      form.availableTimeFrom
                    }
                    onChange={update(
                      "availableTimeFrom"
                    )}
                    className={
                      errors.availableTimeFrom
                        ? "has-error"
                        : ""
                    }
                  />

                  {errors.availableTimeFrom && (
                    <span className="error-text">
                      {
                        errors.availableTimeFrom
                      }
                    </span>
                  )}
                </div>

                <div className="field">
                  <label>
                    Available time to
                    <span className="required">
                      *
                    </span>
                  </label>

                  <input
                    type="time"
                    value={
                      form.availableTimeTo
                    }
                    onChange={update(
                      "availableTimeTo"
                    )}
                    className={
                      errors.availableTimeTo
                        ? "has-error"
                        : ""
                    }
                  />

                  {errors.availableTimeTo && (
                    <span className="error-text">
                      {
                        errors.availableTimeTo
                      }
                    </span>
                  )}
                </div>

                <div className="field">
                  <label>
                    Joining date
                    <span className="required">
                      *
                    </span>
                  </label>

                  <input
                    type="date"
                    value={
                      form.joiningDate
                    }
                    onChange={update(
                      "joiningDate"
                    )}
                    className={
                      errors.joiningDate
                        ? "has-error"
                        : ""
                    }
                  />

                  {errors.joiningDate && (
                    <span className="error-text">
                      {errors.joiningDate}
                    </span>
                  )}
                </div>

                <div className="field span-2">
                  <label>
                    Available days
                  </label>

                  <div className="app-day-picker">
                    {DAYS.map(
                      (day) => (
                        <button
                          type="button"
                          key={day}
                          onClick={() =>
                            toggleDay(
                              day
                            )
                          }
                          className={`app-day-chip ${
                            form.availableDays.includes(
                              day
                            )
                              ? "selected"
                              : ""
                          }`}
                        >
                          {day}
                        </button>
                      )
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* ==================================================
                ADMINISTRATIVE
            ================================================== */}

            <div className="app-section">
              <div className="app-section-title">
                Administrative
              </div>

              <div className="app-form-grid">

                <div className="field">
                  <label>
                    Doctor code
                  </label>

                  <input
                    value={
                      mode === "edit"
                        ? initialData?.doctorCode ||
                          "—"
                        : "Auto-generated on save"
                    }
                    readOnly
                    disabled
                    className="app-readonly-field"
                  />
                </div>

                <div className="field">
                  <label>
                    Registration date
                  </label>

                  <input
                    value={
                      mode === "edit"
                        ? formatDisplayDate(
                            initialData?.registrationDate
                          ) || "—"
                        : "Set automatically on save"
                    }
                    readOnly
                    disabled
                    className="app-readonly-field"
                  />
                </div>

                <div className="field">
                  <label>
                    Registered by
                  </label>

                  <input
                    value={
                      mode === "edit"
                        ? initialData?.registeredBy ||
                          "—"
                        : "Current staff user"
                    }
                    readOnly
                    disabled
                    className="app-readonly-field"
                  />
                </div>

                <div className="field">
                  <label>
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={update(
                      "status"
                    )}
                  >
                    {STATUSES.map(
                      (s) => (
                        <option
                          key={s}
                          value={s}
                        >
                          {s}
                        </option>
                      )
                    )}
                  </select>
                </div>

              </div>
            </div>

            {/* ==================================================
                BIO / LANGUAGES
            ================================================== */}

            <div className="app-section">
              <div className="app-section-title">
                Bio &amp; languages (optional)
              </div>

              <div className="app-form-grid">

                <div className="field span-2">
                  <label>
                    Languages spoken
                  </label>

                  <input
                    value={
                      form.languagesSpoken
                    }
                    onChange={update(
                      "languagesSpoken"
                    )}
                    placeholder="Comma-separated, e.g. English, Tamil, Hindi"
                  />
                </div>

                <div className="field span-2">
                  <label>
                    Bio
                  </label>

                  <textarea
                    value={form.bio}
                    onChange={update(
                      "bio"
                    )}
                    maxLength={1000}
                  />
                </div>

              </div>
            </div>

          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <div className="app-modal-footer">

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving
                ? "Saving…"
                : mode === "edit"
                ? "Save changes"
                : "Add doctor"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}
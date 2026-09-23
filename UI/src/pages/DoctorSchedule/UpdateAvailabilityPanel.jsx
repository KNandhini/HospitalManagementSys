import { useEffect, useMemo, useState } from "react";

const SLOT_DURATIONS = [15, 20, 30, 45, 60];

function pad(n) {
  return String(n).padStart(2, "0");
}

function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function timeOptions() {
  const opts = [];
  for (let mins = 6 * 60; mins <= 23 * 60 + 30; mins += 30) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const period = h >= 12 ? "PM" : "AM";
    const display = h % 12 === 0 ? 12 : h % 12;
    opts.push({ value: `${pad(h)}:${pad(m)}`, label: `${display}:${pad(m)} ${period}` });
  }
  return opts;
}

const TIME_OPTIONS = timeOptions();

function formatDateLabel(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  const todayISO = toISODate(new Date());
  const tomorrowISO = toISODate(addDays(new Date(), 1));
  const base = d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  if (iso === todayISO) return `${base} (Today)`;
  if (iso === tomorrowISO) return `${base} (Tomorrow)`;
  return base;
}

function formatTimeLabel(value) {
  return TIME_OPTIONS.find((t) => t.value === value)?.label || value;
}

function minutesBetween(from, to) {
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  return th * 60 + tm - (fh * 60 + fm);
}

/*
|--------------------------------------------------------------------------
| Read A Schedule Block Coming From The API
|--------------------------------------------------------------------------
|
| Handles both camelCase and PascalCase field names, and strips seconds
| off "HH:mm:ss" time values so they match the <select> options below.
|
*/

function extractDatePart(value) {
  if (!value) return "";
  return String(value).split("T")[0];
}

function normalizeTimeValue(value) {
  if (!value) return "";
  const parts = String(value).split(":");
  const h = parts[0]?.padStart(2, "0") ?? "00";
  const m = parts[1]?.padStart(2, "0") ?? "00";
  return `${h}:${m}`;
}

function readBlock(block) {
  const scheduleId = block.scheduleId ?? block.ScheduleId ?? null;
  const dateFrom = extractDatePart(block.dateFrom ?? block.DateFrom);
  const dateTo = extractDatePart(block.dateTo ?? block.DateTo) || dateFrom;
  const timeFrom = normalizeTimeValue(block.timeFrom ?? block.TimeFrom);
  const timeTo = normalizeTimeValue(block.timeTo ?? block.TimeTo);
  const slotDurationMinutes =
    block.slotDurationMinutes ?? block.SlotDurationMinutes ?? 30;
  const appointmentTypes =
    block.appointmentTypes ?? block.AppointmentTypes ?? [];
  const repeatWeekly = block.repeatWeekly ?? block.RepeatWeekly ?? false;
  const reason = block.reason ?? block.Reason ?? "";
  const status = block.status ?? block.Status ?? "Active";

  return {
    scheduleId,
    dateFrom,
    dateTo,
    timeFrom,
    timeTo,
    slotDurationMinutes,
    appointmentTypes,
    repeatWeekly,
    reason,
    status,
  };
}

export default function UpdateAvailabilityPanel({
  open,
  doctor,
  onClose,
  onSubmit,
  saving,
  getBookedCount, // (dateFrom, dateTo, timeFrom, timeTo) => number
  scheduleBlocks = [], // existing DoctorSchedule rows, from the page
}) {
  const tomorrow = toISODate(addDays(new Date(), 1));

  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [preset, setPreset] = useState("tomorrow");
  const [status, setStatus] = useState("Active"); // "Active" = available, "OnLeave" = on leave
  const [dateFrom, setDateFrom] = useState(tomorrow);
  const [dateTo, setDateTo] = useState(tomorrow);
  const [timeFrom, setTimeFrom] = useState("10:00");
  const [timeTo, setTimeTo] = useState("16:00");
  const [slotDuration, setSlotDuration] = useState(30);
  const [types, setTypes] = useState(new Set(["in-person"]));
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [reason, setReason] = useState(
    "I will be available from 10 AM to 4 PM tomorrow."
  );

  /*
  |--------------------------------------------------------------------------
  | Only offer active blocks to edit
  |--------------------------------------------------------------------------
  */

  const activeBlocks = useMemo(
    () =>
      (scheduleBlocks || [])
        .map(readBlock)
        .filter(
          (block) =>
            block.status === "Active" || block.status === "OnLeave"
        )
        .sort((a, b) =>
          `${a.dateFrom}${a.timeFrom}`.localeCompare(
            `${b.dateFrom}${b.timeFrom}`
          )
        ),
    [scheduleBlocks]
  );

  const resetToNew = () => {
    setSelectedScheduleId(null);
    setPreset("tomorrow");
    setStatus("Active");
    setDateFrom(tomorrow);
    setDateTo(tomorrow);
    setTimeFrom("10:00");
    setTimeTo("16:00");
    setSlotDuration(30);
    setTypes(new Set(["in-person"]));
    setRepeatWeekly(false);
    setReason("I will be available from 10 AM to 4 PM tomorrow.");
  };

  const selectBlock = (block) => {
    setSelectedScheduleId(block.scheduleId);
    setPreset("custom");
    setStatus(block.status || "Active");
    setDateFrom(block.dateFrom);
    setDateTo(block.dateTo);
    setTimeFrom(block.timeFrom);
    setTimeTo(block.timeTo);
    setSlotDuration(block.slotDurationMinutes || 30);
    setTypes(
      new Set(
        block.appointmentTypes.length
          ? block.appointmentTypes
          : ["in-person"]
      )
    );
    setRepeatWeekly(block.repeatWeekly);
    setReason(block.reason);
  };

  /*
  |--------------------------------------------------------------------------
  | Every time the panel opens fresh, start on "Add New" rather than
  | whatever was left selected from the last time it was open.
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (open) {
      resetToNew();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleStatus = (next) => {
    setStatus(next);

    if (next === "OnLeave") {
      /*
      |--------------------------------------------------------------------------
      | Leave doesn't need a time window — cover the whole day so it
      | blocks every slot on the selected date(s) automatically.
      |--------------------------------------------------------------------------
      */

      setTimeFrom("00:00");
      setTimeTo("23:59");
    } else if (
      status === "OnLeave" &&
      timeFrom === "00:00" &&
      timeTo === "23:59"
    ) {
      // Switching back to Available from a full-day leave selection —
      // restore a sensible default time window instead of leaving 00:00–23:59.
      setTimeFrom("10:00");
      setTimeTo("16:00");
    }
  };

  const applyPreset = (key) => {
    setPreset(key);
    const today = new Date();
    if (key === "today") {
      const iso = toISODate(today);
      setDateFrom(iso);
      setDateTo(iso);
    } else if (key === "tomorrow") {
      const iso = toISODate(addDays(today, 1));
      setDateFrom(iso);
      setDateTo(iso);
    } else if (key === "week") {
      const start = startOfWeek(today);
      setDateFrom(toISODate(start));
      setDateTo(toISODate(addDays(start, 6)));
    }
    // "custom" leaves the date inputs as-is for manual editing
  };

  const toggleType = (key) => {
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalSlots = useMemo(() => {
    const span = minutesBetween(timeFrom, timeTo);
    return span > 0 ? Math.floor(span / slotDuration) : 0;
  }, [timeFrom, timeTo, slotDuration]);

  const bookedExisting = useMemo(
    () => (getBookedCount ? getBookedCount(dateFrom, dateTo, timeFrom, timeTo) : 0),
    [getBookedCount, dateFrom, dateTo, timeFrom, timeTo]
  );

  const availableAfter = Math.max(totalSlots - bookedExisting, 0);

  if (!open) return null;

  const isEditing = selectedScheduleId !== null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      scheduleId: selectedScheduleId,
      doctorId: doctor.doctorId,
      status,
      dateFrom,
      dateTo,
      timeFrom,
      timeTo,
      slotDurationMinutes: slotDuration,
      appointmentTypes: Array.from(types),
      repeatWeekly,
      reason,
    });
  };

  return (
    <aside className="hh-panel">
      <div className="hh-panel-header">
        <div>
          <div className="hh-panel-title">
            {isEditing ? "Update Availability" : "Add Availability"}
          </div>
          <div className="hh-panel-subtitle">
            {isEditing
              ? "Editing an existing slot. Change the fields below and save."
              : "Pick an existing slot below to edit it, or fill this in to add a new one."}
          </div>
        </div>
        <button type="button" className="hh-panel-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="hh-panel-form">
        <div className="hh-panel-body">
          {/* ==============================================================
              EXISTING AVAILABILITY
          =============================================================== */}

          <div className="hh-panel-section">
            <div className="hh-panel-label-row">Your Availability</div>

            {activeBlocks.length === 0 ? (
              <div className="hh-panel-hint">
                No existing availability yet. Fill in the form below to add one.
              </div>
            ) : (
              <div className="hh-panel-preset-row">
                {activeBlocks.map((block) => {
                  const label =
                    block.dateFrom === block.dateTo
                      ? formatDateLabel(block.dateFrom)
                      : `${formatDateLabel(block.dateFrom)} – ${formatDateLabel(block.dateTo)}`;

                  const active = selectedScheduleId === block.scheduleId;

                  return (
                    <button
                      type="button"
                      key={block.scheduleId}
                      className={`hh-panel-preset ${active ? "active" : ""}`}
                      onClick={() => selectBlock(block)}
                      title={block.reason}
                    >
                      {label}, {formatTimeLabel(block.timeFrom)}–
                      {formatTimeLabel(block.timeTo)}
                      {block.repeatWeekly ? " (weekly)" : ""}
                      {block.status === "OnLeave" ? " (On Leave)" : ""}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              className={`hh-panel-preset ${!isEditing ? "active" : ""}`}
              style={{ marginTop: 8 }}
              onClick={resetToNew}
            >
              + Add New Availability
            </button>
          </div>

          <div className="hh-panel-section">
            <div className="hh-panel-label-row">Status</div>
            <div className="hh-panel-preset-row">
              <button
                type="button"
                className={`hh-panel-preset ${status === "Active" ? "active" : ""}`}
                onClick={() => toggleStatus("Active")}
              >
                Available
              </button>
              <button
                type="button"
                className={`hh-panel-preset ${status === "OnLeave" ? "active" : ""}`}
                onClick={() => toggleStatus("OnLeave")}
              >
                On Leave
              </button>
            </div>
            {status === "OnLeave" && (
              <div className="hh-panel-hint">
                This marks the selected date/time as On Leave — it will
                show as unavailable on the grid even during your normal
                working hours.
              </div>
            )}
          </div>

          <div className="hh-panel-section">
            <div className="hh-panel-label-row">
              <IconCalendar /> Select Date Range
            </div>
            <div className="hh-panel-date-row">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setPreset("custom");
                  setDateFrom(e.target.value);
                }}
              />
              <span className="hh-panel-date-sep">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setPreset("custom");
                  setDateTo(e.target.value);
                }}
              />
            </div>
            <div className="hh-panel-preset-row">
              {[
                ["today", "Today"],
                ["tomorrow", "Tomorrow"],
                ["week", "This Week"],
                ["custom", "Custom Range"],
              ].map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  className={`hh-panel-preset ${preset === key ? "active" : ""}`}
                  onClick={() => applyPreset(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {status !== "OnLeave" && (
            <div className="hh-panel-section">
              <div className="hh-panel-label-row">
                <IconClock /> Time Range
              </div>
              <div className="hh-panel-time-row">
                <div className="field">
                  <label>From</label>
                  <select value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)}>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>To</label>
                  <select value={timeTo} onChange={(e) => setTimeTo(e.target.value)}>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {status !== "OnLeave" && (
            <div className="hh-panel-section">
              <div className="hh-panel-label-row">Slot Duration</div>
              <select value={slotDuration} onChange={(e) => setSlotDuration(Number(e.target.value))}>
                {SLOT_DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} minutes
                  </option>
                ))}
              </select>
            </div>
          )}

          {status !== "OnLeave" && (
            <div className="hh-panel-section">
              <div className="hh-panel-label-row">Appointment Type</div>
              <div className="hh-panel-type-row">
                <label className="hh-panel-checkbox">
                  <input
                    type="checkbox"
                    checked={types.has("in-person")}
                    onChange={() => toggleType("in-person")}
                  />
                  In-person
                </label>
                <label className="hh-panel-checkbox">
                  <input
                    type="checkbox"
                    checked={types.has("online")}
                    onChange={() => toggleType("online")}
                  />
                  Online
                </label>
              </div>
            </div>
          )}

          <div className="hh-panel-section">
            <div className="hh-panel-label-row">Repeat</div>
            <label className="hh-panel-checkbox">
              <input
                type="checkbox"
                checked={repeatWeekly}
                onChange={(e) => setRepeatWeekly(e.target.checked)}
              />
              Repeat weekly
            </label>
            <div className="hh-panel-hint">Applies this schedule to all upcoming weeks.</div>
          </div>

          <div className="hh-panel-section">
            <div className="hh-panel-label-row">Reason for Update</div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 500))}
              rows={3}
              maxLength={500}
            />
            <div className="hh-panel-charcount">{reason.length}/500</div>
          </div>

          {bookedExisting > 0 && (
            <div className="hh-panel-impact">
              <div className="hh-panel-impact-title">
                <IconAlert /> Impact on Existing Appointments
              </div>
              <div className="hh-panel-impact-text">
                This time range has {bookedExisting} booked appointment{bookedExisting !== 1 ? "s" : ""}.
              </div>
              <button type="button" className="hh-panel-impact-link">
                View affected appointments ›
              </button>
            </div>
          )}

          <div className="hh-panel-summary">
            <SummaryRow label="Date" value={
              dateFrom === dateTo ? formatDateLabel(dateFrom) : `${formatDateLabel(dateFrom)} – ${formatDateLabel(dateTo)}`
            } />
            {status === "OnLeave" ? (
              <SummaryRow label="Time" value="All day" strong />
            ) : (
              <>
                <SummaryRow label="Time" value={`${formatTimeLabel(timeFrom)} – ${formatTimeLabel(timeTo)}`} />
                <SummaryRow label="Slot Duration" value={`${slotDuration} minutes`} />
                <SummaryRow label="Total Slots" value={totalSlots} />
                <SummaryRow label="Booked (existing)" value={bookedExisting} />
                <SummaryRow label="Available (after update)" value={availableAfter} strong />
              </>
            )}
          </div>
        </div>

        <div className="hh-panel-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <IconCalendarCheck />{" "}
            {saving
              ? status === "OnLeave"
                ? "Saving Leave…"
                : isEditing
                ? "Updating…"
                : "Adding…"
              : status === "OnLeave"
              ? "Mark as On Leave"
              : isEditing
              ? "Update Availability"
              : "Add Availability"}
          </button>
        </div>
      </form>
    </aside>
  );
}

function SummaryRow({ label, value, strong }) {
  return (
    <div className="hh-panel-summary-row">
      <span>{label}</span>
      <span className={strong ? "hh-panel-summary-strong" : ""}>{value}</span>
    </div>
  );
}

function IconCalendar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.8h17M8 3v3.6M16 3v3.6" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5 2 20.5h20L12 3.5Z" />
      <path d="M12 10v4.5M12 17.5h.01" />
    </svg>
  );
}

function IconCalendarCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.8h17M8 3v3.6M16 3v3.6" />
      <path d="m8.5 14.5 2 2 4.5-4.5" />
    </svg>
  );
}
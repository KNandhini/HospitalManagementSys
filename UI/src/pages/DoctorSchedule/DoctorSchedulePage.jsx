import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";
import Swal from "sweetalert2";

import TopHeader from "../../components/layout/TopHeader";
import UpdateAvailabilityPanel from "./UpdateAvailabilityPanel";

import {
  createDoctorSchedule,
  updateDoctorSchedule,
  getDoctorSchedule,
} from "../../api/doctorscheduleApi";

import "../../styles.css";

/*
|--------------------------------------------------------------------------
| Get Doctor From Local Storage
|--------------------------------------------------------------------------
*/

function getStoredDoctor() {
  try {
    const storedDoctor =
      localStorage.getItem("doctor");

    if (!storedDoctor) {
      return null;
    }

    return JSON.parse(storedDoctor);
  } catch (error) {
    console.error(
      "Failed to read doctor from localStorage:",
      error
    );

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| Normalize Doctor
|--------------------------------------------------------------------------
*/

function normalizeDoctor(doctor) {
  if (!doctor) {
    return null;
  }

  let availableDays =
    doctor.availableDays ??
    doctor.AvailableDays ??
    [];

  if (typeof availableDays === "string") {
    availableDays = availableDays
      .split(",")
      .map((day) => day.trim())
      .filter(Boolean);
  }

  if (!Array.isArray(availableDays)) {
    availableDays = [];
  }

  /*
  |--------------------------------------------------------------------------
  | Convert full day names to short names
  |--------------------------------------------------------------------------
  */

  const dayMap = {
    Sunday: "Sun",
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
  };

  availableDays = availableDays.map(
    (day) => dayMap[day] || day
  );

  return {
    ...doctor,

    /*
    |--------------------------------------------------------------------------
    | Doctor ID
    |--------------------------------------------------------------------------
    */

    doctorId:
      doctor.doctorId ??
      doctor.DoctorId ??
      doctor.id ??
      doctor.Id ??
      null,

    /*
    |--------------------------------------------------------------------------
    | Name
    |--------------------------------------------------------------------------
    */

    firstName:
      doctor.firstName ??
      doctor.FirstName ??
      "",

    lastName:
      doctor.lastName ??
      doctor.LastName ??
      "",

    /*
    |--------------------------------------------------------------------------
    | Specialization
    |--------------------------------------------------------------------------
    */

    specialization:
      doctor.specialization ??
      doctor.Specialization ??
      "",

    /*
    |--------------------------------------------------------------------------
    | Qualification
    |--------------------------------------------------------------------------
    */

    qualification:
      doctor.qualification ??
      doctor.Qualification ??
      "",

    /*
    |--------------------------------------------------------------------------
    | Experience
    |--------------------------------------------------------------------------
    */

    yearsOfExperience:
      doctor.yearsOfExperience ??
      doctor.YearsOfExperience ??
      doctor.experience ??
      doctor.Experience ??
      0,

    /*
    |--------------------------------------------------------------------------
    | Mobile
    |--------------------------------------------------------------------------
    */

    mobileNumber:
      doctor.mobileNumber ??
      doctor.MobileNumber ??
      doctor.phoneNumber ??
      doctor.PhoneNumber ??
      doctor.phone ??
      doctor.Phone ??
      "",

    /*
    |--------------------------------------------------------------------------
    | Photo
    |--------------------------------------------------------------------------
    */

    photoUrl:
      doctor.photoUrl ??
      doctor.PhotoUrl ??
      "",

    /*
    |--------------------------------------------------------------------------
    | Available Days
    |--------------------------------------------------------------------------
    */

    availableDays,

    /*
    |--------------------------------------------------------------------------
    | Default Available Time
    |--------------------------------------------------------------------------
    */

    availableTimeFrom:
      doctor.availableTimeFrom ??
      doctor.AvailableTimeFrom ??
      doctor.availableFrom ??
      doctor.AvailableFrom ??
      "09:00",

    availableTimeTo:
      doctor.availableTimeTo ??
      doctor.AvailableTimeTo ??
      doctor.availableTo ??
      doctor.AvailableTo ??
      "20:00",
  };
}

/*
|--------------------------------------------------------------------------
| Shift Configuration
|--------------------------------------------------------------------------
*/

const SHIFTS = [
  {
    label: "Morning",
    start: "09:00",
    end: "12:00",
  },
  {
    label: "Midday",
    start: "12:00",
    end: "13:00",
  },
  {
    label: "Afternoon",
    start: "13:00",
    end: "17:00",
  },
  {
    label: "Evening",
    start: "17:00",
    end: "24:00",
  },
];

/*
|--------------------------------------------------------------------------
| Weekday Keys
|--------------------------------------------------------------------------
*/

const WEEKDAY_KEYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

/*
|--------------------------------------------------------------------------
| Status Labels
|--------------------------------------------------------------------------
*/

const STATUS_LABELS = {
  Available: "Available",
  Booked: "Booked",
  OnLeave: "On Leave",
  NotAvailable: "Not Available",
};

/*
|--------------------------------------------------------------------------
| Helper Functions
|--------------------------------------------------------------------------
*/

function pad(n) {
  return String(n).padStart(2, "0");
}

/*
|--------------------------------------------------------------------------
| Convert Date To YYYY-MM-DD
|--------------------------------------------------------------------------
*/

function toISODate(date) {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}`;
}

/*
|--------------------------------------------------------------------------
| Add Days
|--------------------------------------------------------------------------
*/

function addDays(date, n) {
  const d = new Date(date);

  d.setDate(d.getDate() + n);

  return d;
}

/*
|--------------------------------------------------------------------------
| Start Of Week - Monday
|--------------------------------------------------------------------------
*/

function startOfWeek(date) {
  const d = new Date(date);

  const day = d.getDay();

  /*
  Sunday = 0
  Monday = 1
  */

  const diff =
    day === 0
      ? -6
      : 1 - day;

  d.setDate(
    d.getDate() + diff
  );

  return d;
}

/*
|--------------------------------------------------------------------------
| Time To Minutes
|--------------------------------------------------------------------------
*/

function timeToMinutes(time) {
  if (!time) {
    return 0;
  }

  /*
  Supports:
  10:00
  10:00:00
  */

  const parts = String(time).split(":");

  const hours =
    Number(parts[0]) || 0;

  const minutes =
    Number(parts[1]) || 0;

  return (
    hours * 60 +
    minutes
  );
}

/*
|--------------------------------------------------------------------------
| Minutes To Time
|--------------------------------------------------------------------------
*/

function minutesToTime(mins) {
  return `${pad(
    Math.floor(mins / 60)
  )}:${pad(mins % 60)}`;
}

/*
|--------------------------------------------------------------------------
| Format Slot Label
|--------------------------------------------------------------------------
*/

function formatSlotLabel(mins) {
  const h = Math.floor(mins / 60);

  const m = mins % 60;

  const period =
    h >= 12 ? "PM" : "AM";

  const display =
    h % 12 === 0
      ? 12
      : h % 12;

  return `${display}:${pad(
    m
  )} ${period}`;
}

/*
|--------------------------------------------------------------------------
| Format Day
|--------------------------------------------------------------------------
*/

function formatDayLabel(date) {
  return date.toLocaleDateString(
    undefined,
    {
      weekday: "short",
    }
  );
}

/*
|--------------------------------------------------------------------------
| Demo Booking Generator
|--------------------------------------------------------------------------
|
| NOTE:
| This is only temporary demo booking data.
|
| Replace this later with actual Appointment API data.
|
*/

function seededBooked(
  dateISO,
  mins
) {
  let h = 0;

  const str =
    `${dateISO}-${mins}`;

  for (
    let i = 0;
    i < str.length;
    i++
  ) {
    h =
      (h * 31 +
        str.charCodeAt(i)) |
      0;
  }

  return (
    Math.abs(h) % 100 < 38
  );
}

/*
|--------------------------------------------------------------------------
| Extract Date
|--------------------------------------------------------------------------
*/

function extractDatePart(
  dateTimeStr
) {
  if (!dateTimeStr) {
    return "";
  }

  return String(
    dateTimeStr
  ).split("T")[0];
}

/*
|--------------------------------------------------------------------------
| Check Whether Schedule Block Applies To Date
|--------------------------------------------------------------------------
*/

function isScheduleBlockOnDate(
  block,
  iso,
  expectedStatus
) {
  const dateFrom =
    extractDatePart(
      block.dateFrom ??
        block.DateFrom
    );

  const dateTo =
    extractDatePart(
      block.dateTo ??
        block.DateTo
    ) || dateFrom;

  const repeatWeekly =
    block.repeatWeekly ??
    block.RepeatWeekly ??
    false;

  const status =
    block.status ??
    block.Status;

  if (
    status !==
    expectedStatus
  ) {
    return false;
  }

  if (!dateFrom) {
    return false;
  }

  /*
  |--------------------------------------------------------------------------
  | Weekly Schedule
  |--------------------------------------------------------------------------
  */

  if (repeatWeekly) {
    const scheduleDay =
      new Date(
        `${dateFrom}T00:00:00`
      ).getDay();

    const currentDay =
      new Date(
        `${iso}T00:00:00`
      ).getDay();

    return (
      scheduleDay ===
        currentDay &&
      iso >= dateFrom
    );
  }

  /*
  |--------------------------------------------------------------------------
  | One-time / Date Range Schedule
  |--------------------------------------------------------------------------
  */

  return (
    iso >= dateFrom &&
    iso <= dateTo
  );
}

/*
|--------------------------------------------------------------------------
| Build Week Schedule
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| DoctorSchedule Active = AVAILABLE
|
| Example:
|
| dateFrom  = 2026-09-23
| timeFrom  = 10:00
| timeTo    = 11:00
| repeatWeekly = true
|
| Result:
|
| Wed 23 Sep
| 10:00 AM -> Available
| 10:30 AM -> Available
|
|--------------------------------------------------------------------------
*/

function buildWeekSchedule(
  weekStart,
  doctor,
  scheduleBlocks
) {
  const days = Array.from(
    { length: 7 },
    (_, i) =>
      addDays(
        weekStart,
        i
      )
  );

  const schedule = {};

  days.forEach((date) => {
    const iso =
      toISODate(date);

    schedule[iso] = {};

    SHIFTS.forEach(
      (shift) => {
        /*
        |--------------------------------------------------------------------------
        | Create 30-minute display slots
        |--------------------------------------------------------------------------
        */

        const slotTimes = [];

        for (
          let mins =
            timeToMinutes(
              shift.start
            );

          mins <
          timeToMinutes(
            shift.end
          );

          mins += 30
        ) {
          slotTimes.push(mins);
        }

        slotTimes.forEach(
          (mins) => {
            const time =
              minutesToTime(
                mins
              );

            /*
            |--------------------------------------------------------------------------
            | FIRST:
            | Is this slot covered by an On Leave block?
            | (leave overrides everything else, including normal hours)
            |--------------------------------------------------------------------------
            */

            const leaveSchedule =
              scheduleBlocks.find(
                (block) => {
                  if (
                    !isScheduleBlockOnDate(
                      block,
                      iso,
                      "OnLeave"
                    )
                  ) {
                    return false;
                  }

                  const timeFrom =
                    block.timeFrom ??
                    block.TimeFrom;

                  const timeTo =
                    block.timeTo ??
                    block.TimeTo;

                  const fromMin =
                    timeToMinutes(
                      timeFrom
                    );

                  const toMin =
                    timeToMinutes(
                      timeTo
                    );

                  return (
                    mins >=
                      fromMin &&
                    mins <= toMin
                  );
                }
              );

            if (
              leaveSchedule
            ) {
              schedule[iso][
                time
              ] = "OnLeave";

              return;
            }

            /*
            |--------------------------------------------------------------------------
            | SECOND:
            | Check backend DoctorSchedule
            |--------------------------------------------------------------------------
            */

            const activeSchedule =
              scheduleBlocks.find(
                (block) => {
                  if (
                    !isScheduleBlockOnDate(
                      block,
                      iso,
                      "Active"
                    )
                  ) {
                    return false;
                  }

                  const timeFrom =
                    block.timeFrom ??
                    block.TimeFrom;

                  const timeTo =
                    block.timeTo ??
                    block.TimeTo;

                  const fromMin =
                    timeToMinutes(
                      timeFrom
                    );

                  const toMin =
                    timeToMinutes(
                      timeTo
                    );

                  /*
                  |--------------------------------------------------------------------------
                  | Inclusive end: a block "10:00 AM - 1:30 PM" should
                  | highlight the 1:30 PM cell too, not stop at 1:00 PM.
                  |--------------------------------------------------------------------------
                  */

                  return (
                    mins >=
                      fromMin &&
                    mins <= toMin
                  );
                }
              );

            /*
            |--------------------------------------------------------------------------
            | BACKEND SAYS ACTIVE
            |
            | Therefore:
            |
            | Available
            |--------------------------------------------------------------------------
            */

            if (
              activeSchedule
            ) {
              schedule[iso][
                time
              ] = "Available";

              return;
            }

            /*
            |--------------------------------------------------------------------------
            | OTHERWISE:
            | Check Doctor's Default Availability
            |--------------------------------------------------------------------------
            */

            const weekdayKey =
              WEEKDAY_KEYS[
                date.getDay()
              ];

            const working =
              doctor.availableDays.includes(
                weekdayKey
              );

            const doctorFrom =
              timeToMinutes(
                doctor.availableTimeFrom
              );

            const doctorTo =
              timeToMinutes(
                doctor.availableTimeTo
              );

            /*
            |--------------------------------------------------------------------------
            | Outside normal availability
            |--------------------------------------------------------------------------
            */

            if (
              !working ||
              mins <
                doctorFrom ||
              mins >=
                doctorTo
            ) {
              schedule[iso][
                time
              ] =
                "NotAvailable";

              return;
            }

            /*
            |--------------------------------------------------------------------------
            | DEMO BOOKING
            |
            | Remove this when Appointment API is available.
            |--------------------------------------------------------------------------
            */

            if (
              seededBooked(
                iso,
                mins
              )
            ) {
              schedule[iso][
                time
              ] = "Booked";

              return;
            }

            /*
            |--------------------------------------------------------------------------
            | Normal Available
            |--------------------------------------------------------------------------
            */

            schedule[iso][
              time
            ] = "Available";
          }
        );
      }
    );
  });

  return {
    days,
    schedule,
  };
}

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

export default function DoctorSchedulePage() {
  /*
  |--------------------------------------------------------------------------
  | Doctor
  |--------------------------------------------------------------------------
  */

  const [doctor] =
    useState(() => {
      const storedDoctor =
        getStoredDoctor();

      return normalizeDoctor(
        storedDoctor
      );
    });

  /*
  |--------------------------------------------------------------------------
  | Week
  |--------------------------------------------------------------------------
  */

  const [weekStart, setWeekStart] =
    useState(() =>
      startOfWeek(
        new Date()
      )
    );

  /*
  |--------------------------------------------------------------------------
  | Selected Day
  |--------------------------------------------------------------------------
  */

  const [
    selectedDayISO,
    setSelectedDayISO,
  ] = useState(() =>
    toISODate(
      new Date()
    )
  );

  /*
  |--------------------------------------------------------------------------
  | Panel
  |--------------------------------------------------------------------------
  */

  const [
    panelOpen,
    setPanelOpen,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Saving
  |--------------------------------------------------------------------------
  */

  const [
    saving,
    setSaving,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Schedule Blocks
  |--------------------------------------------------------------------------
  */

  const [
    scheduleBlocks,
    setScheduleBlocks,
  ] = useState([]);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  const [
    loadingSchedule,
    setLoadingSchedule,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Doctor ID
  |--------------------------------------------------------------------------
  */

  const doctorId =
    doctor?.doctorId ||
    localStorage.getItem(
      "doctorId"
    );

  /*
  |--------------------------------------------------------------------------
  | Fetch Schedule
  |--------------------------------------------------------------------------
  */

  const fetchSchedule =
    useCallback(
      async () => {
        if (!doctorId) {
          console.error(
            "Doctor ID not found"
          );

          return;
        }

        const dateFromISO =
          toISODate(
            weekStart
          );

        const dateToISO =
          toISODate(
            addDays(
              weekStart,
              6
            )
          );

        setLoadingSchedule(
          true
        );

        try {
          const res =
            await getDoctorSchedule(
              doctorId,
              dateFromISO,
              dateToISO
            );

          /*
          |--------------------------------------------------------------------------
          | Support multiple API response formats
          |--------------------------------------------------------------------------
          */

          let data = [];

          if (
            Array.isArray(
              res?.data
            )
          ) {
            data =
              res.data;
          } else if (
            Array.isArray(
              res?.data?.data
            )
          ) {
            data =
              res.data.data;
          } else if (
            Array.isArray(
              res?.data?.result
            )
          ) {
            data =
              res.data.result;
          } else if (
            Array.isArray(
              res?.data?.items
            )
          ) {
            data =
              res.data.items;
          } else if (
            res?.data &&
            typeof res.data ===
              "object" &&
            res.data.scheduleId
          ) {
            /*
            |--------------------------------------------------------------------------
            | API returned one schedule object
            |--------------------------------------------------------------------------
            */

            data = [
              res.data,
            ];
          }

          setScheduleBlocks(
            data
          );
        } catch (err) {
          console.error(
            "Failed to fetch doctor schedule:",
            err
          );

          setScheduleBlocks(
            []
          );
        } finally {
          setLoadingSchedule(
            false
          );
        }
      },
      [
        doctorId,
        weekStart,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Fetch On Page Load / Week Change
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  /*
  |--------------------------------------------------------------------------
  | Build Schedule
  |--------------------------------------------------------------------------
  */

  const {
    days,
    schedule,
  } = useMemo(() => {
    if (!doctor) {
      return {
        days: [],
        schedule: {},
      };
    }

    return buildWeekSchedule(
      weekStart,
      doctor,
      scheduleBlocks
    );
  }, [
    weekStart,
    doctor,
    scheduleBlocks,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const stats =
    useMemo(() => {
      let booked = 0;

      let available = 0;

      const onLeaveDays =
        new Set();

      Object.entries(
        schedule
      ).forEach(
        ([iso, slots]) => {
          Object.entries(
            slots
          ).forEach(
            ([, status]) => {
              if (
                status ===
                "Booked"
              ) {
                booked++;
              }

              if (
                status ===
                "Available"
              ) {
                available++;
              }

              if (
                status ===
                "OnLeave"
              ) {
                onLeaveDays.add(
                  iso
                );
              }
            }
          );
        }
      );

      const total =
        booked +
        available;

      return {
        totalAppointments:
          booked,

        bookedSlots:
          booked,

        bookedPct:
          total
            ? Math.round(
                (booked /
                  total) *
                  100
              )
            : 0,

        availableSlots:
          available,

        availablePct:
          total
            ? Math.round(
                (available /
                  total) *
                  100
              )
            : 0,

        onLeaveCount:
          onLeaveDays.size,
      };
    }, [schedule]);

  /*
  |--------------------------------------------------------------------------
  | Get Booked Count
  |--------------------------------------------------------------------------
  */

  const getBookedCount = (
    dateFromISO,
    dateToISO,
    timeFrom,
    timeTo
  ) => {
    let count = 0;

    const from =
      new Date(
        `${dateFromISO}T00:00:00`
      );

    const to =
      new Date(
        `${dateToISO}T00:00:00`
      );

    const fromMin =
      timeToMinutes(
        timeFrom
      );

    const toMin =
      timeToMinutes(
        timeTo
      );

    for (
      let d =
        new Date(from);

      d <= to;

      d = addDays(
        d,
        1
      )
    ) {
      const iso =
        toISODate(d);

      const daySlots =
        schedule[iso];

      if (!daySlots) {
        continue;
      }

      Object.entries(
        daySlots
      ).forEach(
        ([time, status]) => {
          const mins =
            timeToMinutes(
              time
            );

          if (
            status ===
              "Booked" &&
            mins >=
              fromMin &&
            mins < toMin
          ) {
            count++;
          }
        }
      );
    }

    return count;
  };

  /*
  |--------------------------------------------------------------------------
  | Update Availability
  |--------------------------------------------------------------------------
  |
  | The panel only collects a date range / time range / reason - it has
  | no concept of picking an existing schedule row to edit. So this is
  | an upsert:
  |
  | - If a schedule block already exists for the exact same date range,
  |   update that row (PUT /DoctorSchedule/{scheduleId}).
  |
  | - Otherwise create a brand new row (POST /DoctorSchedule).
  |
  |--------------------------------------------------------------------------
  */

  const handleUpdateAvailability =
    async (payload) => {
      if (!doctorId) {
        Swal.fire({
          icon: "error",
          title:
            "Doctor ID not found",
          text:
            "Please login again.",
          confirmButtonColor:
            "var(--color-primary)",
        });

        return;
      }

      setSaving(true);

      try {
        /*
        |--------------------------------------------------------------------------
        | The panel now tells us exactly which row to touch:
        |
        | - payload.scheduleId set   -> the user picked an existing slot,
        |                                update that exact row.
        | - payload.scheduleId null  -> "Add New Availability" was used,
        |                                create a fresh row.
        |--------------------------------------------------------------------------
        */

        if (payload.scheduleId) {
          await updateDoctorSchedule(
            payload.scheduleId,
            payload
          );
        } else {
          await createDoctorSchedule(
            payload
          );
        }

        await fetchSchedule();

        setPanelOpen(false);

        Swal.fire({
          icon: "success",

          title:
            payload.status ===
            "OnLeave"
              ? "Marked as on leave"
              : payload.scheduleId
              ? "Availability updated"
              : "Availability added",

          text:
            payload.dateFrom ===
            payload.dateTo
              ? `Your schedule was updated for ${payload.dateFrom}.`
              : `Your schedule was updated for ${payload.dateFrom} – ${payload.dateTo}.`,

          confirmButtonColor:
            "var(--color-primary)",

          timer: 2000,

          timerProgressBar: true,
        });
      } catch (err) {
        console.error(
          "Update availability failed:",
          err
        );

        Swal.fire({
          icon: "error",

          title:
            "Couldn't update availability",

          text:
            err?.response
              ?.data?.message ||
            err?.message ||
            "Please try again.",

          confirmButtonColor:
            "var(--color-primary)",
        });
      } finally {
        setSaving(false);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | No Doctor
  |
  | IMPORTANT:
  | This comes AFTER all hooks.
  |--------------------------------------------------------------------------
  */

  if (!doctor) {
    return (
      <div className="app-empty">
        <h2>
          Doctor information not found
        </h2>

        <p>
          Doctor details are not
          available in local
          storage.
        </p>

        <Link
          to="/login"
          className="btn btn-primary"
        >
          Login Again
        </Link>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Week Range
  |--------------------------------------------------------------------------
  */

  const rangeLabel =
    days.length === 7
      ? `${days[0].toLocaleDateString(
          undefined,
          {
            day: "numeric",
            month: "short",
          }
        )} – ${days[6].toLocaleDateString(
          undefined,
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          }
        )}`
      : "";

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="hh-shell">
      <div className="hh-shell-main">

        <TopHeader
          doctor={doctor}
          notificationCount={3}
        />

        <div className="hh-shell-body">

          <div
            className={`hh-schedule-content ${
              panelOpen
                ? "with-panel"
                : ""
            }`}
          >

            {/* ==========================================================
                BACK
            =========================================================== */}

            <Link
              to="/dashboard"
              className="hh-back-link"
            >
              ← Back to Schedule
            </Link>

            {/* ==========================================================
                HEADER
            =========================================================== */}

            <div
              className="app-header"
              style={{
                marginTop: 6,
              }}
            >
              <div>
                <h1>
                  My Schedule
                </h1>

                <p>
                  View and manage
                  your availability,
                  appointments and
                  update your
                  schedule.
                </p>
              </div>
            </div>

            {/* ==========================================================
                DOCTOR BAR
            =========================================================== */}

            <div className="hh-doctor-bar">

              <div className="hh-doctor-summary">

                {doctor.photoUrl ? (
                  <img
                    src={
                      doctor.photoUrl
                    }
                    alt={`${doctor.firstName} ${doctor.lastName}`}
                    className="hh-doctor-photo"
                  />
                ) : (
                  <span className="hh-doctor-photo hh-doctor-photo-initials">
                    {doctor.firstName?.[0] ||
                      ""}
                    {doctor.lastName?.[0] ||
                      ""}
                  </span>
                )}

                <div>

                  <div className="hh-doctor-name">
                    Dr.{" "}
                    {doctor.firstName}{" "}
                    {doctor.lastName}
                  </div>

                  <div className="hh-doctor-role">
                    {
                      doctor.specialization
                    }
                  </div>

                  <div className="hh-doctor-meta">

                    <span>
                      🎓{" "}
                      {doctor.qualification ||
                        "Qualification not available"}
                    </span>

                    <span>
                      🕒{" "}
                      {doctor.yearsOfExperience ||
                        0}
                      + Years Experience
                    </span>

                    <span>
                      📞{" "}
                      {doctor.mobileNumber ||
                        "Mobile number not available"}
                    </span>

                  </div>

                </div>

              </div>

              {/* ========================================================
                  RIGHT SIDE
              ========================================================= */}

              <div className="hh-doctor-bar-right">

                {/* ======================================================
                    WEEK NAVIGATION
                ======================================================= */}

                <div className="hh-week-nav">

                  <span className="hh-week-nav-icon">
                    🗓️
                  </span>

                  <span className="hh-week-nav-label">
                    {rangeLabel}

                    {loadingSchedule
                      ? " (loading…)"
                      : ""}
                  </span>

                  <button
                    className="btn btn-secondary btn-icon"
                    onClick={() =>
                      setWeekStart(
                        (w) =>
                          addDays(
                            w,
                            -7
                          )
                      )
                    }
                    aria-label="Previous week"
                  >
                    ‹
                  </button>

                  <button
                    className="btn btn-secondary btn-icon"
                    onClick={() =>
                      setWeekStart(
                        (w) =>
                          addDays(
                            w,
                            7
                          )
                      )
                    }
                    aria-label="Next week"
                  >
                    ›
                  </button>

                </div>

                {/* ======================================================
                    WEEK TOGGLE
                ======================================================= */}

                <div className="sched-view-toggle">

                  <button className="active">
                    Week
                  </button>

                </div>

                {/* ======================================================
                    UPDATE AVAILABILITY
                ======================================================= */}

                <button
                  className="btn btn-primary"
                  onClick={() =>
                    setPanelOpen(
                      true
                    )
                  }
                >
                  🗓️ Update
                  Availability
                </button>

              </div>

            </div>

            {/* ==========================================================
                STATISTICS
            =========================================================== */}

            <div className="app-stats">

              <StatCard
                icon="📅"
                label="Total Appointments"
                value={
                  stats.totalAppointments
                }
                sub="+12% than last week"
                tone="success"
              />

              <StatCard
                icon="✅"
                label="Booked Slots"
                value={
                  stats.bookedSlots
                }
                sub={`${stats.bookedPct}% of total slots`}
                tone="accent"
              />

              <StatCard
                icon="⏰"
                label="Available Slots"
                value={
                  stats.availableSlots
                }
                sub={`${stats.availablePct}% of total slots`}
                tone="primary"
              />

              <StatCard
                icon="🧍"
                label="On Leave"
                value={
                  stats.onLeaveCount
                }
                sub="This week"
                tone="warning"
              />

            </div>

            {/* ==========================================================
                DAY TABS
            =========================================================== */}

            <div className="hh-day-tabs">

              {days.map(
                (date) => {
                  const iso =
                    toISODate(
                      date
                    );

                  return (
                    <button
                      key={iso}
                      className={`hh-day-tab ${
                        iso ===
                        selectedDayISO
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedDayISO(
                          iso
                        )
                      }
                    >

                      <span className="hh-day-tab-name">
                        {formatDayLabel(
                          date
                        )}
                      </span>

                      <span className="hh-day-tab-date">
                        {date.getDate()}{" "}
                        {date.toLocaleDateString(
                          undefined,
                          {
                            month:
                              "short",
                          }
                        )}
                      </span>

                    </button>
                  );
                }
              )}

            </div>

            {/* ==========================================================
                WEEK GRID
            =========================================================== */}

            <div className="hh-week-grid-wrap">

              <div className="hh-week-grid">

                {/* ======================================================
                    GRID HEADER
                ======================================================= */}

                <div className="hh-week-grid-headrow">

                  <div className="hh-week-grid-timecol" />

                  {days.map(
                    (date) => {
                      const iso =
                        toISODate(
                          date
                        );

                      return (
                        <div
                          key={iso}
                          className={`hh-week-grid-daycol-head ${
                            iso ===
                            selectedDayISO
                              ? "active"
                              : ""
                          }`}
                        >

                          <div>
                            {formatDayLabel(
                              date
                            )}
                          </div>

                          <div className="hh-week-grid-daynum">
                            {date.getDate()}{" "}
                            {date.toLocaleDateString(
                              undefined,
                              {
                                month:
                                  "short",
                              }
                            )}
                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

                {/* ======================================================
                    SHIFTS
                ======================================================= */}

                {SHIFTS.map(
                  (shift) => {

                    const slotTimes =
                      [];

                    for (
                      let m =
                        timeToMinutes(
                          shift.start
                        );

                      m <
                      timeToMinutes(
                        shift.end
                      );

                      m += 30
                    ) {
                      slotTimes.push(
                        m
                      );
                    }

                    return (
                      <div
                        className="hh-week-shift"
                        key={
                          shift.label
                        }
                      >

                        {/* =================================================
                            SHIFT LABEL
                        ================================================== */}

                        <div className="hh-week-shift-label">

                          {shift.label}{" "}

                          (
                          {formatSlotLabel(
                            timeToMinutes(
                              shift.start
                            )
                          )}{" "}
                          –{" "}
                          {formatSlotLabel(
                            timeToMinutes(
                              shift.end
                            )
                          )}
                          )

                        </div>

                        {/* =================================================
                            TIME SLOTS
                        ================================================== */}

                        {slotTimes.map(
                          (mins) => (
                            <div
                              className="hh-week-grid-row"
                              key={mins}
                            >

                              <div className="hh-week-grid-timecol">
                                {formatSlotLabel(
                                  mins
                                )}
                              </div>

                              {days.map(
                                (
                                  date
                                ) => {

                                  const iso =
                                    toISODate(
                                      date
                                    );

                                  const time =
                                    minutesToTime(
                                      mins
                                    );

                                  const status =
                                    schedule[
                                      iso
                                    ]?.[
                                      time
                                    ] ||
                                    "NotAvailable";

                                  return (
                                    <div
                                      key={
                                        iso
                                      }
                                      className={`hh-week-grid-daycol ${
                                        iso ===
                                        selectedDayISO
                                          ? "active"
                                          : ""
                                      }`}
                                    >

                                      <span
                                        className={`hh-status-pill hh-status-${status}`}
                                      >
                                        {
                                          STATUS_LABELS[
                                            status
                                          ]
                                        }
                                      </span>

                                    </div>
                                  );
                                }
                              )}

                            </div>
                          )
                        )}

                      </div>
                    );
                  }
                )}

              </div>

            </div>

            {/* ==========================================================
                LEGEND
            =========================================================== */}

            <div className="hh-legend-bar">

              <div className="hh-legend-items">

                <LegendDot
                  status="Available"
                />

                Available

                <LegendDot
                  status="Booked"
                />

                Booked

                <LegendDot
                  status="OnLeave"
                />

                On Leave

                <LegendDot
                  status="NotAvailable"
                />

                Not Available

              </div>

              <button className="btn btn-secondary">
                👁 View Appointment
                Details
              </button>

            </div>

          </div>

          {/* ============================================================
              UPDATE AVAILABILITY PANEL
          ============================================================= */}

          <UpdateAvailabilityPanel
            open={panelOpen}
            doctor={doctor}
            saving={saving}
            onClose={() =>
              setPanelOpen(false)
            }
            onSubmit={
              handleUpdateAvailability
            }
            getBookedCount={
              getBookedCount
            }
            scheduleBlocks={
              scheduleBlocks
            }
          />

        </div>

      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Stat Card
|--------------------------------------------------------------------------
*/

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
}) {
  return (
    <div
      className={`app-stat-card hh-stat-card hh-stat-${tone}`}
    >

      <div className="hh-stat-icon">
        {icon}
      </div>

      <div className="app-stat-label">
        {label}
      </div>

      <div className="app-stat-value">
        {value}
      </div>

      <div className="hh-stat-sub">
        {sub}
      </div>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Legend Dot
|--------------------------------------------------------------------------
*/

function LegendDot({
  status,
}) {
  return (
    <span
      className={`hh-legend-dot hh-status-${status}`}
    />
  );
}
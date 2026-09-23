export default function TopHeader({ doctor, notificationCount = 0 }) {
  const initials = `${(doctor.firstName || "?")[0] || ""}${(doctor.lastName || "")[0] || ""}`.toUpperCase();

  return (
    <header className="hh-topheader">
      <div className="hh-topheader-search">
        <IconSearch />
        <input placeholder="Search patients, doctors, MRN…" />
      </div>

      <div className="hh-topheader-right">
        <button className="hh-topheader-bell" aria-label="Notifications">
          <IconBell />
          {notificationCount > 0 && <span className="hh-topheader-badge">{notificationCount}</span>}
        </button>

        <button className="hh-topheader-profile">
          {doctor.photoUrl ? (
            <img src={doctor.photoUrl} alt="" className="hh-topheader-avatar" />
          ) : (
            <span className="hh-topheader-avatar hh-topheader-avatar-initials">{initials}</span>
          )}
          <div className="hh-topheader-profile-text">
            <div className="hh-topheader-name">
              Dr. {doctor.firstName} {doctor.lastName}
            </div>
            <div className="hh-topheader-role">{doctor.specialization}</div>
          </div>
          <IconChevronDown />
        </button>
      </div>
    </header>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8.5a6 6 0 0 0-12 0c0 5.5-2 7-2 7h16s-2-1.5-2-7Z" />
      <path d="M10.3 20a1.9 1.9 0 0 0 3.4 0" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

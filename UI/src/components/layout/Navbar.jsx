/*import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/appointments", label: "Appointments" },
  { to: "/patients", label: "Patients" },
  { to: "/doctors", label: "Doctors" },   // ← add this
  { to: "/myschedule", label: "My Schedule" }, // ← add this
];

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const { pathname } = useLocation();

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.85rem 1.5rem",
        background: "var(--color-primary)",
        color: "#fff",
        boxShadow: "var(--shadow-sm)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        flexWrap: "wrap",
        gap: "0.75rem",
      }}
    >
      <Link
        to="/"
        style={{
          fontWeight: 700,
          fontSize: "1.15rem",
          letterSpacing: "-0.01em",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.9rem",
          }}
        >
          ⚕
        </span>
        HealthHub
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        {user ? (
          <>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  background:
                    pathname === link.to ? "rgba(255,255,255,0.18)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={logoutUser}
              className="btn"
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "#fff",
                marginLeft: "0.25rem",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="btn" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
*/
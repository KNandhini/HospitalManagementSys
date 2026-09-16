import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logoutUser } = useAuth();

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 1.5rem",
        background: "#0d6efd",
        color: "#fff",
      }}
    >
      <Link to="/" style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
        HealthHub
      </Link>
      <div style={{ display: "flex", gap: "1rem" }}>
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/appointments">Appointments</Link>
            <Link to="/patients">Patients</Link>
            <button onClick={logoutUser} style={{ cursor: "pointer" }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

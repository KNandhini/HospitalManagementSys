import { useEffect, useState } from "react";
import { getAppointments } from "../../api/appointmentApi";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAppointments()
      .then((res) => setAppointments(res.data))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Welcome{user ? `, ${user.name}` : ""}</h1>
      <h3>Upcoming Appointments</h3>
      {loading ? (
        <p>Loading...</p>
      ) : appointments.length === 0 ? (
        <p>No upcoming appointments.</p>
      ) : (
        <ul>
          {appointments.map((a) => (
            <li key={a.id}>
              {a.date} — Dr. {a.doctorName} ({a.department})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

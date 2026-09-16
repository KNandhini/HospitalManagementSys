import { useEffect, useState } from "react";
import { getAppointments, cancelAppointment } from "../../api/appointmentApi";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);

  const loadAppointments = () => {
    getAppointments().then((res) => setAppointments(res.data));
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancel = async (id) => {
    await cancelAppointment(id);
    loadAppointments();
  };

  return (
    <div>
      <h1>Appointments</h1>
      <ul>
        {appointments.map((a) => (
          <li key={a.id}>
            {a.date} — Dr. {a.doctorName}{" "}
            <button onClick={() => handleCancel(a.id)}>Cancel</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

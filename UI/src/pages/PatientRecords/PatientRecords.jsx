import { useEffect, useState } from "react";
import { getPatients } from "../../api/patientApi";

export default function PatientRecords() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    getPatients().then((res) => setPatients(res.data));
  }, []);

  return (
    <div>
      <h1>Patient Records</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Name</th>
            <th style={{ textAlign: "left" }}>Age</th>
            <th style={{ textAlign: "left" }}>Condition</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.age}</td>
              <td>{p.condition}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

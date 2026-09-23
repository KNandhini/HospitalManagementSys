import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Appointments from "../pages/Appointments/Appointments";
import PatientRecords from "../pages/PatientRecords/PatientRecords";
import ProtectedRoute from "../components/common/ProtectedRoute";
import DoctorRecords from "../pages/DoctorRecords/DoctorRecords";
import DoctorSchedulePage from "../pages/DoctorSchedule/DoctorSchedulePage";
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <Appointments />
          </ProtectedRoute>
        }
      />
      <Route path="/patients" element={<PatientRecords />} />
      <Route path="/doctors" element={<DoctorRecords />} />
      <Route path="/myschedule" element={<DoctorSchedulePage />} />
    </Routes>
  );
}

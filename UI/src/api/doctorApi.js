import axiosInstance from "./axiosInstance";

export const getDoctors = () => axiosInstance.get("/Doctor");

export const getDoctorById = (id) => axiosInstance.get(`/Doctor/${id}`);

export const getDoctorAvailability = (id) =>
  axiosInstance.get(`/Doctor/${id}/availability`);

// ── Add these ──
export const searchDoctors = (query, specialization, status) =>
  axiosInstance.get("/Doctor/search", {
    params: { q: query, specialization, status },
  });

export const createDoctor = (data) => axiosInstance.post("/Doctor", data);

export const updateDoctor = (id, data) =>
  axiosInstance.put(`/Doctor/${id}`, data);

export const deleteDoctor = (id) => axiosInstance.delete(`/Doctor/${id}`);
export const updateDoctorSchedule = (scheduleId, data) =>
  axiosInstance.put(`/DoctorSchedule/${scheduleId}`, data);
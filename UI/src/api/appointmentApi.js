import axiosInstance from "./axiosInstance";

export const getAppointments = () => axiosInstance.get("/appointments");

export const bookAppointment = (data) =>
  axiosInstance.post("/appointments", data);

export const cancelAppointment = (id) =>
  axiosInstance.delete(`/appointments/${id}`);

export const rescheduleAppointment = (id, data) =>
  axiosInstance.put(`/appointments/${id}`, data);

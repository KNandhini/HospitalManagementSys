import axiosInstance from "./axiosInstance";

export const getDoctors = () => axiosInstance.get("/doctors");

export const getDoctorById = (id) => axiosInstance.get(`/doctors/${id}`);

export const getDoctorAvailability = (id) =>
  axiosInstance.get(`/doctors/${id}/availability`);

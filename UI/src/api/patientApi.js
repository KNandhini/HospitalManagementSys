import axiosInstance from "./axiosInstance";

export const getPatients = () => axiosInstance.get("/patients");

export const getPatientById = (id) => axiosInstance.get(`/patients/${id}`);

export const createPatient = (data) => axiosInstance.post("/patients", data);

export const updatePatient = (id, data) =>
  axiosInstance.put(`/patients/${id}`, data);

export const deletePatient = (id) => axiosInstance.delete(`/patients/${id}`);

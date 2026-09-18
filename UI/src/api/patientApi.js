import axiosInstance from "./axiosInstance";

export const getPatients = () => axiosInstance.get("/patients");

// Server-side search by name, phone, MRN, or national ID.
// Backend should match query against these fields and return PatientSearchResultDTO[].
export const searchPatients = (query) =>
  axiosInstance.get("/patients/search", { params: { q: query } });

export const getPatientById = (id) => axiosInstance.get(`/patients/${id}`);

export const createPatient = (data) => axiosInstance.post("/patients", data);

export const updatePatient = (id, data) =>
  axiosInstance.put(`/patients/${id}`, data);

export const deletePatient = (id) => axiosInstance.delete(`/patients/${id}`);

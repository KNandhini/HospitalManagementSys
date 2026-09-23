import axiosInstance from "./axiosInstance";

export const getPatients = () => axiosInstance.get("/Patient");

// Server-side search by name, phone, MRN, or national ID.
// Backend should match query against these fields and return PatientSearchResultDTO[].
// src/api/patientApi.js
export const searchPatients = (q, status) =>
  axiosInstance.get("/Patient/search", {
    params: {
      q: q || undefined,
      status: status || undefined,
    },
  });

export const getPatientById = (id) => axiosInstance.get(`/Patient/${id}`);

export const createPatient = (data) => axiosInstance.post("/Patient", data);

export const updatePatient = (id, data) =>
  axiosInstance.put(`/Patient/${id}`, data);

export const deletePatient = (id) => axiosInstance.delete(`/Patient/${id}`);

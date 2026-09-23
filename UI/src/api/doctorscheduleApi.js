import axiosInstance from "./axiosInstance";

export const createDoctorSchedule = (data) =>
  axiosInstance.post(
    "/DoctorSchedule",
    data
  );

export const updateDoctorSchedule = (
  scheduleId,
  data
) =>
  axiosInstance.put(
    `/DoctorSchedule/${scheduleId}`,
    data
  );

export const getDoctorSchedule = (
  doctorId,
  dateFrom,
  dateTo
) =>
  axiosInstance.get(
    `/DoctorSchedule/doctor/${doctorId}`,
    {
      params: {
        dateFrom,
        dateTo,
      },
    }
  );

export const deleteDoctorSchedule = (
  scheduleId
) =>
  axiosInstance.delete(
    `/DoctorSchedule/${scheduleId}`
  );
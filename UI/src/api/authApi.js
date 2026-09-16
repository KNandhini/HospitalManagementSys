import axiosInstance from "./axiosInstance";

export const login = (credentials) =>
  axiosInstance.post("/auth/login", credentials);

export const signup = (data) => axiosInstance.post("/auth/signup", data);

export const logout = () => axiosInstance.post("/auth/logout");

export const getCurrentUser = () => axiosInstance.get("/auth/me");

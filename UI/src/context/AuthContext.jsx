import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("hh_token");
    if (!token) {
      setLoading(false);
      return;
    }
    getCurrentUser()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("hh_token"))
      .finally(() => setLoading(false));
  }, []);

  const loginUser = (userData, token) => {
    localStorage.setItem("hh_token", token);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem("hh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

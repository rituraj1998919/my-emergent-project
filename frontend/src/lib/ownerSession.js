import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { API_URL } from "./site";

const TOKEN_KEY = "irsmakup_owner_token";
export const useOwnerSession = () => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [checking, setChecking] = useState(!!token);
  const updateToken = useCallback(value => {
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
    setToken(value); setChecking(false);
  }, []);
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(response => response, error => {
      if (error.response?.status === 401 && error.config?.headers?.Authorization) {
        updateToken(""); toast.error("Session expired. Please log in again.");
      }
      return Promise.reject(error);
    });
    const sync = event => { if (event.key === TOKEN_KEY) setToken(event.newValue || ""); };
    window.addEventListener("storage", sync);
    return () => { axios.interceptors.response.eject(interceptor); window.removeEventListener("storage", sync); };
  }, [updateToken]);
  useEffect(() => {
    if (!token) { setChecking(false); return; }
    let active = true;
    setChecking(true);
    axios.get(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .catch(error => { if (active && error.response?.status !== 401) toast.error("Could not check your session. Please try again."); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [token]);
  return { token, updateToken, checking };
};
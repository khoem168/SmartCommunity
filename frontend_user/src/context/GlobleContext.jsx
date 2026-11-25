import { useEffect, useState, createContext, useContext } from "react";
import {
  fetchCurrentUser,
  googleLoginRequest,
  loginRequest,
  verifyTwoFactorRequest,
  pollTelegramApprovalRequest,
  passkeyLoginRequest,
  logoutRequest,
  registerRequest,
  updateProfileRequest,
} from "../services/authService";
import { disconnectSocket, getSocket } from "../services/realtimeService";
import { getAuthToken } from "../services/api";

const context = createContext();
// eslint-disable-next-line react-refresh/only-export-components
export const useGlobleContext = () => useContext(context);

const GlobleContext = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!getAuthToken()) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetchCurrentUser();
        setUser(response.user);
      } catch {
        logoutRequest();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    socket.emit("join:user", user.id);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const savedTheme =
      typeof window !== "undefined"
        ? window.localStorage.getItem("smartCommunityTheme")
        : null;
    if (savedTheme === "light" || savedTheme === "dark") {
      document.documentElement.dataset.theme = savedTheme;
      return;
    }
    document.documentElement.dataset.theme = user.darkMode ? "dark" : "light";
  }, [user]);

  // Returns the user, or { twoFactorRequired, challengeToken } when the
  // account needs its authenticator code (see completeTwoFactor).
  const loginUser = async (credentials) => {
    const response = await loginRequest(credentials);
    if (response.twoFactorRequired || response.telegramApprovalRequired) return response;
    setUser(response.user);
    return response.user;
  };

  const loginWithPasskey = async (options) => {
    const response = await passkeyLoginRequest(options);
    setUser(response.user);
    return response.user;
  };

  const completeTwoFactor = async (details) => {
    const response = await verifyTwoFactorRequest(details);
    setUser(response.user);
    return response;
  };

  const pollTelegramApproval = async (details) => {
    const response = await pollTelegramApprovalRequest(details);
    if (response?.status === "approved" && response.user) {
      setUser(response.user);
    }
    return response;
  };

  const refreshUser = async () => {
    const response = await fetchCurrentUser();
    setUser(response.user);
    return response.user;
  };

  const googleLogin = async (credentials) => {
    const response = await googleLoginRequest(credentials);
    if (response.twoFactorRequired || response.telegramApprovalRequired) return response;
    setUser(response.user);
    return response.user;
  };

  const registerUser = async (userData) => {
    const response = await registerRequest(userData);
    setUser(response.token ? response.user : null);
    return response;
  };

  const updateUser = async (updates) => {
    const response = await updateProfileRequest(updates);
    setUser(response.user);
    return response.user;
  };

  const deleteAccount = () => {
    disconnectSocket();
    logoutRequest();
    setUser(null);
  };

  const logout = () => {
    disconnectSocket();
    logoutRequest();
    setUser(null);
  };

  return (
    <context.Provider
      value={{
        user,
        isLoading,
        loginUser,
        completeTwoFactor,
        pollTelegramApproval,
        loginWithPasskey,
        googleLogin,
        refreshUser,
        registerUser,
        updateUser,
        deleteAccount,
        logout,
      }}
    >
      {children}
    </context.Provider>
  );
};

export default GlobleContext;

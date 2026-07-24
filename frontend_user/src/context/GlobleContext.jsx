import { useEffect, useState, createContext, useContext } from "react";
import {
  fetchCurrentUser,
  googleLoginRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  updateProfileRequest,
} from "../services/authService";
import { disconnectSocket, getSocket } from "../services/realtimeService";

const context = createContext();
// eslint-disable-next-line react-refresh/only-export-components
export const useGlobleContext = () => useContext(context);

const GlobleContext = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
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

  const loginUser = async (credentials) => {
    const response = await loginRequest(credentials);
    setUser(response.user);
    return response.user;
  };

  const refreshUser = async () => {
    const response = await fetchCurrentUser();
    setUser(response.user);
    return response.user;
  };

  const googleLogin = async (credentials) => {
    const response = await googleLoginRequest(credentials);
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

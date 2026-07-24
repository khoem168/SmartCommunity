import { io } from "socket.io-client";
import { getAuthToken } from "./api";

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: true,
      transports: ["websocket", "polling"],
      auth: { token: getAuthToken() },
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = undefined;
};

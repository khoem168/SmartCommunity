import { io } from "socket.io-client";
import { API_BASE_URL, getAuthToken } from "./api";

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  return new URL(API_BASE_URL, window.location.origin).origin;
};

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: true,
      // Must match the server: "/socket.io/" is not routed to the API on Vercel.
      addTrailingSlash: false,
      transports: ["websocket"],
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

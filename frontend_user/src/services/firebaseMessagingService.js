import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";

const TOKEN_KEY = "smartCommunityFirebaseToken";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseClientConfigured = () =>
  Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    import.meta.env.VITE_FIREBASE_VAPID_KEY,
  );

const getFirebaseMessaging = async () => {
  if (!isFirebaseClientConfigured()) {
    throw new Error("Firebase browser configuration has not been added yet.");
  }
  if (!(await isSupported())) {
    throw new Error(
      "Firebase notifications are not supported in this browser.",
    );
  }
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getMessaging(app);
};

export const enableFirebasePush = async () => {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    throw new Error("Browser notifications are not supported on this device.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }
  const serviceWorkerRegistration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
  );
  const messaging = await getFirebaseMessaging();
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration,
  });
  if (!token) throw new Error("Firebase did not return a browser token.");
  window.localStorage.setItem(TOKEN_KEY, token);
  return token;
};

export const getStoredFirebaseToken = () =>
  typeof window === "undefined"
    ? ""
    : window.localStorage.getItem(TOKEN_KEY) || "";

export const clearStoredFirebaseToken = () => {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
};

export const listenForForegroundPush = async (callback) => {
  if (!isFirebaseClientConfigured() || !(await isSupported())) return () => {};
  const messaging = await getFirebaseMessaging();
  return onMessage(messaging, callback);
};

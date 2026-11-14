import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Used by standalone Vite development; vercel dev routes these at ingress.
    proxy: {
      "/api": "http://localhost:4000",
      "/uploads": "http://localhost:4000",
      "/socket.io": { target: "http://localhost:4000", ws: true },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react-core",
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
              priority: 40,
            },
            {
              name: "ant-design",
              test: /node_modules[\\/](antd|@ant-design|antd-style|@emotion|rc-[^\\/]+)[\\/]/,
              priority: 35,
              entriesAware: true,
              maxSize: 320 * 1024,
            },
            {
              name: "charts",
              test: /node_modules[\\/](recharts|d3-|victory-vendor)[\\/]/,
              priority: 30,
              entriesAware: true,
            },
            {
              name: "firebase",
              test: /node_modules[\\/](@firebase|firebase)[\\/]/,
              priority: 25,
              entriesAware: true,
            },
            {
              name: "realtime",
              test: /node_modules[\\/](socket\.io-client|engine\.io-client|@socket\.io)[\\/]/,
              priority: 25,
            },
          ],
        },
      },
    },
  },
});

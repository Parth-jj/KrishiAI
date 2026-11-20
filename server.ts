import http from "http";
import path from "path";
import express from "express";
import { createServer as createViteServer, ViteDevServer } from "vite";
import dotenv from "dotenv";
import { createApiApp } from "./server/app.js";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = createApiApp();
  const httpServer = http.createServer(app);
  const rawEnvPort = Number(process.env.PORT);
  const nginxPort = Number(process.env.NGINX_PORT);
  const defaultAppPort = Number(process.env.DEFAULT_APP_PORT) || 3000;
  const PORT =
    process.env.NODE_ENV !== "production"
      ? defaultAppPort
      : rawEnvPort && rawEnvPort !== nginxPort
        ? rawEnvPort
        : defaultAppPort;

  let vite: ViteDevServer | undefined;

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true" ? { server: httpServer } : false,
        watch: process.env.DISABLE_HMR === "true" ? null : { ignored: ["**/.data/**"] },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[AI Farmer Advisory Server] Running on http://0.0.0.0:${PORT}`);
  });

  const shutdown = async () => {
    if (vite) {
      await vite.close().catch(() => {});
    }
    httpServer.close(() => {
      process.exit(0);
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

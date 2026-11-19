import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer, ViteDevServer } from "vite";
import dotenv from "dotenv";

import { authRouter } from "./server/routes/auth.js";
import { farmsRouter } from "./server/routes/farms.js";
import { queriesRouter } from "./server/routes/queries.js";
import { adminRouter } from "./server/routes/admin.js";
import { weatherRouter } from "./server/routes/weather.js";
import { evaluationRouter } from "./server/routes/evaluation.js";
import { initializeKnowledgeBase } from "./server/ragEngine.js";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
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

  // Initialize RAG knowledge base
  initializeKnowledgeBase();

  // Middleware for parsing JSON and urlencoded data
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "AI-Based Farmer Query and Advisory System",
      ragGrounded: true,
      timestamp: new Date().toISOString()
    });
  });

  // Mount API Routers
  app.use("/api/auth", authRouter);
  app.use("/api/farms", farmsRouter);
  app.use("/api/queries", queriesRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/weather", weatherRouter);
  app.use("/api/evaluation", evaluationRouter);

  // Serve generated report & presentation files with explicit MIME types
  const downloadableAssets: Record<string, { mime: string; disposition: string }> = {
    "/KrishiAI_Mini_Project_Report.docx": {
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      disposition: 'attachment; filename="KrishiAI_Mini_Project_Report.docx"',
    },
    "/KrishiAI_Seminar_Presentation.pptx": {
      mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      disposition: 'attachment; filename="KrishiAI_Seminar_Presentation.pptx"',
    },
    "/KrishiAI_Mini_Project_Report.pdf": {
      mime: "application/pdf",
      disposition: 'inline; filename="KrishiAI_Mini_Project_Report.pdf"',
    },
  };

  app.get(Object.keys(downloadableAssets), (req, res, next) => {
    const meta = downloadableAssets[req.path];
    if (!meta) return next();
    const filePath = path.join(process.cwd(), "public", req.path.replace(/^\//, ""));
    res.setHeader("Content-Type", meta.mime);
    res.setHeader("Content-Disposition", meta.disposition);
    return res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) next();
    });
  });

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
    app.get("*", (req, res) => {
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

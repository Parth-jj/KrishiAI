import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
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
  const PORT = 3000;

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

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AI Farmer Advisory Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

import express from "express";
import path from "path";
import dotenv from "dotenv";

import { authRouter } from "./routes/auth.js";
import { farmsRouter } from "./routes/farms.js";
import { queriesRouter } from "./routes/queries.js";
import { adminRouter } from "./routes/admin.js";
import { weatherRouter } from "./routes/weather.js";
import { evaluationRouter } from "./routes/evaluation.js";
import { voiceCallsRouter } from "./routes/voiceCalls.js";
import { initializeKnowledgeBase } from "./ragEngine.js";

dotenv.config();

let ragInitialized = false;

export function createApiApp(): express.Express {
  const app = express();

  if (!ragInitialized) {
    initializeKnowledgeBase();
    ragInitialized = true;
  }

  // Parse JSON (capturing rawBody for HMAC webhook verification) and urlencoded payloads
  app.use(
    express.json({
      limit: "15mb",
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString("utf8");
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "AI-Based Farmer Query and Advisory System",
      ragGrounded: true,
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routers
  app.use("/api/auth", authRouter);
  app.use("/api/farms", farmsRouter);
  app.use("/api/queries", queriesRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/weather", weatherRouter);
  app.use("/api/evaluation", evaluationRouter);
  app.use("/api/voice-calls", voiceCallsRouter);

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

  // Ensure unmatched /api/* routes always return JSON instead of SPA HTML
  app.all("/api/*", (_req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  return app;
}

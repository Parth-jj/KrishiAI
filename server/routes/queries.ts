import express, { Request, Response } from "express";
import { db, QueryRecord } from "../db.js";
import { authenticateUser } from "./auth.js";
import { extractQueryContext, retrieveRelevantKnowledge } from "../ragEngine.js";
import { GeminiLLMProvider, FarmProfileContext } from "../llmService.js";

export const queriesRouter = express.Router();
const llmProvider = new GeminiLLMProvider();

const TOP_K = parseInt(process.env.TOP_K_DOCUMENTS || "3", 10);

// POST /api/queries - Process query through complete 7-stage RAG pipeline
queriesRouter.post("/", authenticateUser, async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const user = (req as any).user;
    const { question, selectedCrop, language = "en" } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Farmer question cannot be empty." });
    }

    const farm = db.getFarmByUserId(user.id);
    const activeCrop = selectedCrop || farm?.crop || undefined;

    // Stage 1 & 2: Language Detection & Context Extraction
    const extractedContext = extractQueryContext(question, activeCrop);
    if (language && language !== "en") {
      extractedContext.language = language;
    }

    // Stage 3: Vector Knowledge Retrieval
    const retrievedChunks = await retrieveRelevantKnowledge(
      question,
      extractedContext.crop,
      extractedContext.category,
      TOP_K
    );

    // Stage 4: Construct Farm Context
    const farmContext: FarmProfileContext = {
      farmerName: user.name,
      state: farm?.state || "Andhra Pradesh",
      district: farm?.district || "Guntur",
      village: farm?.village,
      farmSizeAcres: farm?.farmSizeAcres,
      crop: activeCrop || extractedContext.crop || "Paddy",
      sowingDate: farm?.sowingDate,
      soilType: farm?.soilType,
      preferredLanguage: language || user.preferredLanguage || "en"
    };

    // Stage 5: LLM Structured Advisory Generation
    const advisory = await llmProvider.generateAdvisory(
      question,
      extractedContext,
      retrievedChunks,
      farmContext,
      language
    );

    // Stage 6: Safety & Quality Post-Validation
    // Ensure expert disclaimer is included
    if (!advisory.precautions.some(p => p.toLowerCase().includes("kvk") || p.toLowerCase().includes("officer") || p.toLowerCase().includes("expert"))) {
      advisory.precautions.push("If symptoms persist beyond 5-7 days after treatment, contact your Mandal Agricultural Officer or Krishi Vigyan Kendra (KVK) scientist.");
    }

    // Stage 7: Save to Database
    const savedQuery = db.saveQuery({
      userId: user.id,
      farmerName: user.name,
      question,
      selectedCrop: activeCrop,
      detectedCrop: advisory.crop || extractedContext.crop || "General Agriculture",
      detectedIntent: extractedContext.category,
      confidence: advisory.confidence,
      advisory,
      extractedContext,
      retrievedChunks,
      language: language || "en"
    });

    const latencyMs = Date.now() - startTime;

    return res.status(201).json({
      success: true,
      queryId: savedQuery.id,
      data: savedQuery,
      pipelineExecution: {
        latencyMs,
        detectedLanguage: extractedContext.language,
        extractedCrop: extractedContext.crop,
        extractedIntent: extractedContext.category,
        retrievedCount: retrievedChunks.length,
        topSimilarity: retrievedChunks[0]?.similarityScore || 0,
        modelUsed: advisory.engineUsed || "gemini-4-hydrogen (ICAR-Grounded RAG)"
      }
    });
  } catch (err: any) {
    console.error("[Queries Route Error]:", err);
    return res.status(500).json({ error: err.message || "Failed to process agricultural query." });
  }
});

// GET /api/queries - Get conversation history for current user
queriesRouter.get("/", authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const queries = db.getQueriesByUserId(user.id);
    return res.json({ queries });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to retrieve queries." });
  }
});

// GET /api/queries/:id - Get specific query by ID
queriesRouter.get("/:id", authenticateUser, (req: Request, res: Response) => {
  try {
    const query = db.getQueryById(req.params.id);
    if (!query) {
      return res.status(404).json({ error: "Query record not found." });
    }
    return res.json({ query });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to retrieve query." });
  }
});

// POST /api/queries/translate - Translate structured advisory solutions and answers into target language
queriesRouter.post("/translate", async (req: Request, res: Response) => {
  try {
    const { advisory, targetLanguage = "en" } = req.body;
    if (!advisory) {
      return res.status(400).json({ error: "Advisory object is required." });
    }

    const translatedAdvisory = await llmProvider.translateAdvisory(advisory, targetLanguage);
    return res.json({ success: true, advisory: translatedAdvisory });
  } catch (err: any) {
    console.error("[Advisory Translation Error]:", err);
    return res.status(500).json({ error: err.message || "Failed to translate advisory." });
  }
});

// POST /api/queries/feedback - Submit feedback on advisory
queriesRouter.post("/feedback", authenticateUser, (req: Request, res: Response) => {
  try {
    const { queryId, isUseful, rating, comment } = req.body;
    if (!queryId || typeof isUseful !== "boolean") {
      return res.status(400).json({ error: "Query ID and isUseful boolean are required." });
    }

    const success = db.saveFeedback(queryId, {
      isUseful,
      rating: rating ? Number(rating) : undefined,
      comment: comment || "",
      submittedAt: new Date().toISOString()
    });

    if (!success) {
      return res.status(404).json({ error: "Query record not found to attach feedback." });
    }

    return res.json({ message: "Thank you! Your feedback has been recorded for evaluation." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to submit feedback." });
  }
});

import express, { Request, Response } from "express";
import crypto from "crypto";
import { db } from "../db.js";
import { authenticateUser } from "./auth.js";
import { 
  addDocumentToKnowledgeBase, 
  removeDocumentFromKnowledgeBase, 
  initializeKnowledgeBase, 
  getAllChunks 
} from "../ragEngine.js";
import { KnowledgeDocument } from "../knowledgeData.js";

export const adminRouter = express.Router();

// Middleware to ensure user is admin
function requireAdminRole(req: Request, res: Response, next: express.NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin / Knowledge Manager privileges required." });
  }
  next();
}

// GET /api/admin/statistics - Overview metrics for admin dashboard
adminRouter.get("/statistics", authenticateUser, requireAdminRole, (req: Request, res: Response) => {
  try {
    const allUsers = db.getAllUsers();
    const farmers = allUsers.filter(u => u.role === "farmer");
    const allQueries = db.getAllQueries();
    const allDocs = db.getAllDocuments();
    const allChunks = getAllChunks();

    // Calculate queries today
    const today = new Date().toISOString().split("T")[0];
    const queriesToday = allQueries.filter(q => q.createdAt.startsWith(today)).length;

    // Feedback statistics
    const queriesWithFeedback = allQueries.filter(q => q.feedback !== undefined);
    const positiveFeedback = queriesWithFeedback.filter(q => q.feedback?.isUseful === true).length;
    const avgFeedbackScore = queriesWithFeedback.length > 0
      ? (positiveFeedback / queriesWithFeedback.length) * 100
      : 95.0; // Default high baseline

    // Low confidence queries
    const lowConfidenceQueries = allQueries.filter(q => q.confidence === "low");

    // Most queried crops
    const cropCounts: Record<string, number> = {};
    for (const q of allQueries) {
      const crop = q.detectedCrop || q.selectedCrop || "Unspecified";
      cropCounts[crop] = (cropCounts[crop] || 0) + 1;
    }
    const topCrops = Object.entries(cropCounts)
      .map(([crop, count]) => ({ crop, count }))
      .sort((a, b) => b.count - a.count);

    // Query categories breakdown
    const categoryCounts: Record<string, number> = {};
    for (const q of allQueries) {
      const cat = q.detectedIntent || "general_agriculture";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
    const categoriesBreakdown = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return res.json({
      totalFarmers: farmers.length,
      totalQueries: allQueries.length,
      queriesToday,
      totalDocuments: allDocs.length,
      totalIndexedChunks: allChunks.length,
      averageSatisfactionRate: parseFloat(avgFeedbackScore.toFixed(1)),
      lowConfidenceCount: lowConfidenceQueries.length,
      topCrops,
      categoriesBreakdown
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to generate admin statistics" });
  }
});

// GET /api/admin/documents - List all knowledge base documents
adminRouter.get("/documents", authenticateUser, requireAdminRole, (req: Request, res: Response) => {
  try {
    const docs = db.getAllDocuments();
    const chunks = getAllChunks();
    
    // Add chunk counts to document metadata
    const docsWithMeta = docs.map(doc => {
      const docChunks = chunks.filter(c => c.documentId === doc.id);
      return {
        ...doc,
        chunkCount: docChunks.length
      };
    });

    return res.json({ documents: docsWithMeta });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to list documents" });
  }
});

// POST /api/admin/documents - Ingest and index new agricultural document
adminRouter.post("/documents", authenticateUser, requireAdminRole, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, source, crop, category, language = "en", pageNumber, content, referenceUrl } = req.body;

    if (!title || !content || !crop) {
      return res.status(400).json({ error: "Title, content, and target crop are required." });
    }

    const docId = `doc-custom-${crypto.randomUUID().slice(0, 8)}`;
    const newDoc: KnowledgeDocument = {
      id: docId,
      title,
      source: source || "Krishi Vigyan Kendra Extension Bulletin",
      crop,
      category: category || "crop_disease",
      language,
      pageNumber: pageNumber ? Number(pageNumber) : 1,
      content,
      author: user.name,
      createdAt: new Date().toISOString(),
      referenceUrl
    };

    // Save document to DB
    db.saveDocument(newDoc);

    // Chunk and index in vector knowledge base
    const createdChunks = addDocumentToKnowledgeBase(newDoc);

    return res.status(201).json({
      message: `Document successfully ingested and split into ${createdChunks.length} searchable chunks.`,
      document: newDoc,
      chunksCreated: createdChunks.length
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to ingest document" });
  }
});

// GET /api/admin/documents/:id/chunks - Inspect indexed chunks for a document
adminRouter.get("/documents/:id/chunks", authenticateUser, requireAdminRole, (req: Request, res: Response) => {
  try {
    const docId = req.params.id;
    const doc = db.getDocumentById(docId);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    const allChunks = getAllChunks();
    const docChunks = allChunks.filter(c => c.documentId === docId);

    return res.json({ document: doc, chunks: docChunks });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to retrieve document chunks" });
  }
});

// DELETE /api/admin/documents/:id - Delete document and remove chunks
adminRouter.delete("/documents/:id", authenticateUser, requireAdminRole, (req: Request, res: Response) => {
  try {
    const docId = req.params.id;
    const deleted = db.deleteDocument(docId);
    if (!deleted) {
      return res.status(404).json({ error: "Document not found" });
    }

    removeDocumentFromKnowledgeBase(docId);
    return res.json({ message: "Document and associated vector chunks removed successfully." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to delete document" });
  }
});

// POST /api/admin/reindex - Rebuild entire vector index from all documents
adminRouter.post("/reindex", authenticateUser, requireAdminRole, (req: Request, res: Response) => {
  try {
    const allDocs = db.getAllDocuments();
    initializeKnowledgeBase(allDocs);
    const chunks = getAllChunks();
    return res.json({
      message: `Successfully re-indexed knowledge base. Total documents: ${allDocs.length}, Total chunks: ${chunks.length}.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to reindex knowledge base" });
  }
});

// GET /api/admin/queries - Audit and monitor all farmer queries with filters
adminRouter.get("/queries", authenticateUser, requireAdminRole, (req: Request, res: Response) => {
  try {
    const { confidence, crop, hasFeedback } = req.query;
    let queries = db.getAllQueries();

    if (confidence && typeof confidence === "string") {
      queries = queries.filter(q => q.confidence === confidence);
    }
    if (crop && typeof crop === "string" && crop !== "all") {
      queries = queries.filter(q => (q.detectedCrop || q.selectedCrop) === crop);
    }
    if (hasFeedback === "true") {
      queries = queries.filter(q => q.feedback !== undefined);
    } else if (hasFeedback === "negative") {
      queries = queries.filter(q => q.feedback?.isUseful === false);
    }

    return res.json({ queries });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to fetch queries audit log" });
  }
});

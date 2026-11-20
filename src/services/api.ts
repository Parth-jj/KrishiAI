import {
  QueryRecord,
  WeatherData,
  AdminStats,
  KnowledgeDocument,
  EvaluationItem,
  EvaluationRunResult,
  VoiceCallConfigStatus,
  VoiceCallRecord
} from "../types/index.js";
import { parseApiJson, safeStorageGet } from "../utils/errorHelpers.js";

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };
  const activeToken = token || safeStorageGet("agri_auth_token");
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }
  return headers;
}

export const api = {
  // Query operations
  async askQuery(question: string, selectedCrop?: string, language?: string): Promise<{ data: QueryRecord; pipelineExecution: any }> {
    const res = await fetch("/api/queries", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ question, selectedCrop, language })
    });
    const result = await parseApiJson(res, "Failed to process question");
    if (!res.ok) throw new Error(result.error || "Failed to process question");
    return result;
  },

  async getQueries(): Promise<QueryRecord[]> {
    const res = await fetch("/api/queries", {
      headers: getHeaders()
    });
    const result = await parseApiJson(res, "Failed to fetch queries");
    if (!res.ok) throw new Error(result.error || "Failed to fetch queries");
    return result.queries || [];
  },

  async translateAdvisory(advisory: any, targetLanguage: string): Promise<any> {
    const res = await fetch("/api/queries/translate", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ advisory, targetLanguage })
    });
    const result = await parseApiJson(res, "Failed to translate advisory");
    if (!res.ok) throw new Error(result.error || "Failed to translate advisory");
    return result.advisory;
  },

  async submitFeedback(queryId: string, isUseful: boolean, comment?: string, rating?: number): Promise<void> {
    const res = await fetch("/api/queries/feedback", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ queryId, isUseful, comment, rating })
    });
    const result = await parseApiJson(res, "Failed to submit feedback");
    if (!res.ok) throw new Error(result.error || "Failed to submit feedback");
  },

  // Weather operations
  async getWeather(options?: { district?: string; state?: string; lat?: number; lon?: number } | string, stateParam?: string): Promise<WeatherData> {
    const params = new URLSearchParams();
    
    if (typeof options === "string") {
      if (options) params.append("district", options);
      if (stateParam) params.append("state", stateParam);
    } else if (options) {
      if (options.lat !== undefined && options.lon !== undefined) {
        params.append("lat", options.lat.toString());
        params.append("lon", options.lon.toString());
      }
      if (options.district) params.append("district", options.district);
      if (options.state) params.append("state", options.state);
    }

    const res = await fetch(`/api/weather?${params.toString()}`);
    const result = await parseApiJson(res, "Failed to fetch weather data");
    if (!res.ok) throw new Error(result.error || "Failed to fetch weather data");
    return result;
  },

  async searchLocations(query: string): Promise<Array<{ name: string; district: string; state: string; country: string; latitude: number; longitude: number }>> {
    if (!query || query.trim().length < 2) return [];
    const res = await fetch(`/api/weather/search?q=${encodeURIComponent(query.trim())}`);
    const result = await parseApiJson(res, "Failed to search locations");
    if (!res.ok) return [];
    return result.results || [];
  },

  // Admin operations
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch("/api/admin/statistics", {
      headers: getHeaders()
    });
    const result = await parseApiJson(res, "Failed to fetch admin stats");
    if (!res.ok) throw new Error(result.error || "Failed to fetch admin stats");
    return result;
  },

  async getDocuments(): Promise<KnowledgeDocument[]> {
    const res = await fetch("/api/admin/documents", {
      headers: getHeaders()
    });
    const result = await parseApiJson(res, "Failed to fetch documents");
    if (!res.ok) throw new Error(result.error || "Failed to fetch documents");
    return result.documents || [];
  },

  async ingestDocument(doc: Partial<KnowledgeDocument>): Promise<{ document: KnowledgeDocument; chunksCreated: number }> {
    const res = await fetch("/api/admin/documents", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(doc)
    });
    const result = await parseApiJson(res, "Failed to ingest document");
    if (!res.ok) throw new Error(result.error || "Failed to ingest document");
    return result;
  },

  async deleteDocument(id: string): Promise<void> {
    const res = await fetch(`/api/admin/documents/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    const result = await parseApiJson(res, "Failed to delete document");
    if (!res.ok) throw new Error(result.error || "Failed to delete document");
  },

  async reindexKnowledgeBase(): Promise<string> {
    const res = await fetch("/api/admin/reindex", {
      method: "POST",
      headers: getHeaders()
    });
    const result = await parseApiJson(res, "Failed to reindex knowledge base");
    if (!res.ok) throw new Error(result.error || "Failed to reindex knowledge base");
    return result.message;
  },

  async getAdminQueries(filter?: { confidence?: string; crop?: string; hasFeedback?: string }): Promise<QueryRecord[]> {
    const params = new URLSearchParams();
    if (filter?.confidence) params.append("confidence", filter.confidence);
    if (filter?.crop) params.append("crop", filter.crop);
    if (filter?.hasFeedback) params.append("hasFeedback", filter.hasFeedback);

    const res = await fetch(`/api/admin/queries?${params.toString()}`, {
      headers: getHeaders()
    });
    const result = await parseApiJson(res, "Failed to fetch admin queries");
    if (!res.ok) throw new Error(result.error || "Failed to fetch admin queries");
    return result.queries || [];
  },

  // Evaluation operations
  async getEvaluationDataset(): Promise<EvaluationItem[]> {
    const res = await fetch("/api/evaluation/dataset");
    const result = await parseApiJson(res, "Failed to fetch evaluation dataset");
    if (!res.ok) throw new Error(result.error || "Failed to fetch evaluation dataset");
    return result.dataset || [];
  },

  async runEvaluationBenchmark(): Promise<EvaluationRunResult> {
    const res = await fetch("/api/evaluation/run", {
      method: "POST",
      headers: getHeaders()
    });
    const result = await parseApiJson(res, "Failed to run evaluation");
    if (!res.ok) throw new Error(result.error || "Failed to run evaluation");
    return result.result;
  },

  // Sarvam AI Voice Call operations
  async getVoiceCallConfig(): Promise<VoiceCallConfigStatus> {
    const res = await fetch("/api/voice-calls/config");
    const result = await parseApiJson(res, "Failed to load voice call configuration");
    if (!res.ok) throw new Error(result.error || "Failed to load voice call configuration");
    return result;
  },

  async initiateVoiceCall(payload: {
    mobileNumber: string;
    preferredLanguage: string;
    callConsent: boolean;
    transcriptConsent: boolean;
  }): Promise<{ callToken: string; call: VoiceCallRecord }> {
    const res = await fetch("/api/voice-calls/outbound", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const result = await parseApiJson(res, "Failed to initiate AI voice call");
    if (!res.ok) {
      const err: any = new Error(result.error || "Failed to initiate AI voice call");
      err.code = result.code;
      err.missingVariables = result.missingVariables;
      err.retryAfterSeconds = result.retryAfterSeconds;
      err.call = result.call;
      err.callToken = result.callToken;
      throw err;
    }
    return { callToken: result.callToken, call: result.call };
  },

  async getVoiceCallStatus(callId: string, callToken?: string | null): Promise<VoiceCallRecord> {
    const headers: Record<string, string> = { ...(getHeaders() as Record<string, string>) };
    if (callToken) headers["X-Call-Token"] = callToken;
    const res = await fetch(`/api/voice-calls/${encodeURIComponent(callId)}/status`, { headers });
    const result = await parseApiJson(res, "Failed to fetch voice call status");
    if (!res.ok) throw new Error(result.error || "Failed to fetch voice call status");
    return result.call;
  },

  async switchVoiceCallLanguage(
    callId: string,
    language: string,
    callToken?: string | null
  ): Promise<VoiceCallRecord> {
    const headers: Record<string, string> = { ...(getHeaders() as Record<string, string>) };
    if (callToken) headers["X-Call-Token"] = callToken;
    const res = await fetch(`/api/voice-calls/${encodeURIComponent(callId)}/language`, {
      method: "POST",
      headers,
      body: JSON.stringify({ language })
    });
    const result = await parseApiJson(res, "Failed to switch call language");
    if (!res.ok) throw new Error(result.error || "Failed to switch call language");
    return result.call;
  },

  async endVoiceCall(callId: string, callToken?: string | null): Promise<{ call: VoiceCallRecord; providerNote?: string }> {
    const headers: Record<string, string> = { ...(getHeaders() as Record<string, string>) };
    if (callToken) headers["X-Call-Token"] = callToken;
    const res = await fetch(`/api/voice-calls/${encodeURIComponent(callId)}/end`, {
      method: "POST",
      headers
    });
    const result = await parseApiJson(res, "Failed to end voice call");
    if (!res.ok) throw new Error(result.error || "Failed to end voice call");
    return { call: result.call, providerNote: result.providerNote };
  },

  async getVoiceCallHistory(): Promise<VoiceCallRecord[]> {
    const res = await fetch("/api/voice-calls/history", {
      headers: getHeaders()
    });
    const result = await parseApiJson(res, "Failed to load call history");
    if (!res.ok) throw new Error(result.error || "Failed to load call history");
    return result.calls || [];
  }
};

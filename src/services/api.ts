import { QueryRecord, WeatherData, AdminStats, KnowledgeDocument, EvaluationItem, EvaluationRunResult } from "../types/index.js";

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };
  const activeToken = token || localStorage.getItem("agri_auth_token");
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
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to process question");
    return result;
  },

  async getQueries(): Promise<QueryRecord[]> {
    const res = await fetch("/api/queries", {
      headers: getHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to fetch queries");
    return result.queries || [];
  },

  async translateAdvisory(advisory: any, targetLanguage: string): Promise<any> {
    const res = await fetch("/api/queries/translate", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ advisory, targetLanguage })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to translate advisory");
    return result.advisory;
  },

  async submitFeedback(queryId: string, isUseful: boolean, comment?: string, rating?: number): Promise<void> {
    const res = await fetch("/api/queries/feedback", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ queryId, isUseful, comment, rating })
    });
    const result = await res.json();
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
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to fetch weather data");
    return result;
  },

  async searchLocations(query: string): Promise<Array<{ name: string; district: string; state: string; country: string; latitude: number; longitude: number }>> {
    if (!query || query.trim().length < 2) return [];
    const res = await fetch(`/api/weather/search?q=${encodeURIComponent(query.trim())}`);
    const result = await res.json();
    if (!res.ok) return [];
    return result.results || [];
  },

  // Admin operations
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch("/api/admin/statistics", {
      headers: getHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to fetch admin stats");
    return result;
  },

  async getDocuments(): Promise<KnowledgeDocument[]> {
    const res = await fetch("/api/admin/documents", {
      headers: getHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to fetch documents");
    return result.documents || [];
  },

  async ingestDocument(doc: Partial<KnowledgeDocument>): Promise<{ document: KnowledgeDocument; chunksCreated: number }> {
    const res = await fetch("/api/admin/documents", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(doc)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to ingest document");
    return result;
  },

  async deleteDocument(id: string): Promise<void> {
    const res = await fetch(`/api/admin/documents/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to delete document");
  },

  async reindexKnowledgeBase(): Promise<string> {
    const res = await fetch("/api/admin/reindex", {
      method: "POST",
      headers: getHeaders()
    });
    const result = await res.json();
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
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to fetch admin queries");
    return result.queries || [];
  },

  // Evaluation operations
  async getEvaluationDataset(): Promise<EvaluationItem[]> {
    const res = await fetch("/api/evaluation/dataset");
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to fetch evaluation dataset");
    return result.dataset || [];
  },

  async runEvaluationBenchmark(): Promise<EvaluationRunResult> {
    const res = await fetch("/api/evaluation/run", {
      method: "POST",
      headers: getHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to run evaluation");
    return result.result;
  }
};

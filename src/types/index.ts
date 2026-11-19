export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'farmer' | 'admin';
  preferredLanguage: string;
  createdAt: string;
}

export interface Farm {
  id: string;
  userId: string;
  state: string;
  district: string;
  village: string;
  farmSizeAcres: number;
  crop: string;
  sowingDate?: string;
  soilType: string;
  irrigationSource: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeChunk {
  chunkId: string;
  documentId: string;
  title: string;
  source: string;
  crop: string;
  category: string;
  language: string;
  pageNumber?: number;
  chunkIndex: number;
  text: string;
  createdAt: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  source: string;
  crop: string;
  category: string;
  language: string;
  pageNumber?: number;
  content: string;
  author: string;
  createdAt: string;
  referenceUrl?: string;
  chunkCount?: number;
}

export interface StructuredAdvisory {
  crop: string;
  problem: string;
  likely_causes: string[];
  recommendations: Array<{
    title: string;
    description: string;
    type: 'chemical' | 'biological' | 'agronomic' | 'prevention';
    dosage?: string;
  }>;
  precautions: string[];
  follow_up_questions: string[];
  confidence: 'low' | 'medium' | 'high';
  confidence_reasoning?: string;
  sources: Array<{
    title: string;
    source: string;
    relevance: string;
    pageNumber?: number;
  }>;
  summary_in_preferred_language?: string;
  engineUsed?: string;
}

export interface QueryRecord {
  id: string;
  userId: string;
  farmerName: string;
  question: string;
  selectedCrop?: string;
  detectedCrop: string;
  detectedIntent: string;
  confidence: 'low' | 'medium' | 'high';
  advisory: StructuredAdvisory;
  extractedContext: {
    crop: string | null;
    problem: string;
    symptoms: string[];
    growthStage?: string;
    category: string;
    confidence: 'low' | 'medium' | 'high';
    language: string;
  };
  retrievedChunks: Array<{
    chunk: KnowledgeChunk;
    similarityScore: number;
    rank: number;
  }>;
  language: string;
  feedback?: {
    isUseful: boolean;
    rating?: number;
    comment?: string;
    submittedAt: string;
  };
  createdAt: string;
}

export interface LocationInfo {
  name: string;
  district: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  isLiveGps: boolean;
}

export interface HourlyForecastItem {
  time: string;
  hour: string;
  tempC: number;
  humidityPct: number;
  rainProbabilityPct: number;
  condition: string;
  icon: string;
  windSpeedKmh: number;
  uvIndex?: number;
}

export interface DailyForecastItem {
  day: string;
  date: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  icon: string;
  rainProbability: number;
  precipitationMm: number;
  uvIndexMax: number;
  windSpeedMaxKmh: number;
}

export interface AgriculturalAdvice {
  sprayCondition: 'Optimal' | 'Caution' | 'Unfavorable';
  sprayNote: string;
  sprayWindow?: string;
  irrigationAdvice: string;
  irrigationUrgency?: 'Low' | 'Moderate' | 'High' | 'Delay (Rain Expected)';
  diseaseRiskAlert: string;
  diseaseRiskLevel?: 'Low' | 'Moderate' | 'Severe';
  fieldWorkCondition?: string;
  thermalStressLevel?: 'Low' | 'Moderate' | 'High';
}

export interface WeatherData {
  location: LocationInfo;
  current: {
    tempC: number;
    feelsLikeC?: number;
    humidityPct: number;
    rainProbabilityPct: number;
    precipitationMm?: number;
    windSpeedKmh: number;
    windDirectionDeg?: number;
    windGustsKmh?: number;
    uvIndex?: number;
    surfacePressureHpa?: number;
    soilMoisturePct?: number;
    condition: string;
    icon: string;
    isDay?: boolean;
    lastUpdated?: string;
  };
  hourly?: HourlyForecastItem[];
  forecast: DailyForecastItem[];
  agriculturalAdvice: AgriculturalAdvice;
}

export interface AdminStats {
  totalFarmers: number;
  totalQueries: number;
  queriesToday: number;
  totalDocuments: number;
  totalIndexedChunks: number;
  averageSatisfactionRate: number;
  lowConfidenceCount: number;
  topCrops: Array<{ crop: string; count: number }>;
  categoriesBreakdown: Array<{ category: string; count: number }>;
}

export interface EvaluationItem {
  id: string;
  question: string;
  crop: string;
  intent: string;
  expectedKeywords: string[];
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface EvaluationRunResult {
  runId: string;
  timestamp: string;
  totalQuestions: number;
  intentAccuracy: number;
  cropAccuracy: number;
  retrievalHitRate: number;
  averageSimilarityScore: number;
  averageLatencyMs: number;
  f1Score: number;
  precision: number;
  recall: number;
  details: Array<{
    questionId: string;
    question: string;
    expectedCrop: string;
    detectedCrop: string;
    cropCorrect: boolean;
    expectedIntent: string;
    detectedIntent: string;
    intentCorrect: boolean;
    retrievedSources: string[];
    topScore: number;
    latencyMs: number;
  }>;
}

export type VoiceCallStatus =
  | "Initiating"
  | "Ringing"
  | "Connected"
  | "Conversation Active"
  | "Completed"
  | "Failed";

export interface VoiceCallLanguageSpec {
  code: string;
  shortCode: string;
  name: string;
  nativeName: string;
  sttModel: string;
  ttsModel: string;
  ttsSupportedNatively: boolean;
  ttsEffectiveLanguageCode: string;
  recommendedSpeaker: string;
  notes?: string;
}

export interface VoiceCallTranscriptTurn {
  role: "farmer" | "assistant" | "system";
  text: string;
  language?: string;
  timestamp: string;
}

export interface VoiceCallRecord {
  callId: string;
  sessionId: string;
  userId: string;
  farmerName: string;
  phoneMasked: string;
  status: VoiceCallStatus;
  selectedLanguage: string;
  selectedLanguageName?: string;
  selectedLanguageNative?: string;
  ttsSupportedNatively?: boolean;
  languageNote?: string;
  callConsent: boolean;
  transcriptConsent: boolean;
  sarvamAttemptId?: string;
  sarvamInteractionId?: string;
  startedAt: string;
  connectedAt?: string;
  endedAt?: string;
  updatedAt: string;
  durationSeconds?: number;
  summary?: string;
  topicsDiscussed: string[];
  failureReason?: string;
  transcript?: VoiceCallTranscriptTurn[];
}

export interface VoiceCallConfigStatus {
  configured: boolean;
  missingVariables: string[];
  models: {
    stt: string;
    tts: string;
    llm: string;
  };
  webhookSecretConfigured: boolean;
  toolSecretConfigured: boolean;
  vobizHangupConfigured: boolean;
  agentPhoneConfigured: boolean;
  activeConcurrentCalls: number;
  maxConcurrentCalls: number;
  languages: VoiceCallLanguageSpec[];
}


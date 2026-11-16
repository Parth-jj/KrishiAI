import crypto from "crypto";
import { KnowledgeDocument, INITIAL_KNOWLEDGE_DOCS } from "./knowledgeData.js";
import { StructuredAdvisoryResponse } from "./llmService.js";
import { ExtractedQueryContext, RetrievalResult } from "./ragEngine.js";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: 'farmer' | 'admin';
  preferredLanguage: string;
  createdAt: string;
}

export interface FarmRecord {
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

export interface QueryRecord {
  id: string;
  userId: string;
  farmerName: string;
  question: string;
  selectedCrop?: string;
  detectedCrop: string;
  detectedIntent: string;
  confidence: 'low' | 'medium' | 'high';
  advisory: StructuredAdvisoryResponse;
  extractedContext: ExtractedQueryContext;
  retrievedChunks: RetrievalResult[];
  language: string;
  feedback?: {
    isUseful: boolean;
    rating?: number;
    comment?: string;
    submittedAt: string;
  };
  createdAt: string;
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

// Password hashing using Node.js crypto
export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, "agri_salt_2026", 1000, 32, "sha256").toString("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Initial Evaluation Dataset (30 standardized test questions for academic benchmark)
export const EVALUATION_DATASET: EvaluationItem[] = [
  {
    id: "eval-01",
    question: "My paddy crop leaves are turning yellow with brown lesions. What should I do?",
    crop: "Paddy",
    intent: "crop_disease",
    expectedKeywords: ["blast", "tricyclazole", "nitrogen", "spray"],
    language: "en",
    difficulty: "easy"
  },
  {
    id: "eval-02",
    question: "Brown patches appearing in circular pattern in paddy field at water level, plants drying rapidly.",
    crop: "Paddy",
    intent: "pest_management",
    expectedKeywords: ["bph", "hopper", "pymetrozine", "alley"],
    language: "en",
    difficulty: "medium"
  },
  {
    id: "eval-03",
    question: "Paddy seedling leaves have rusty bronze pigmentation and stunted growth 25 days after transplanting.",
    crop: "Paddy",
    intent: "nutrient_deficiency",
    expectedKeywords: ["zinc", "khaira", "zinc sulphate", "urea"],
    language: "en",
    difficulty: "easy"
  },
  {
    id: "eval-04",
    question: "Cotton flowers are twisted like rosettes and green bolls have holes inside with caterpillars.",
    crop: "Cotton",
    intent: "pest_management",
    expectedKeywords: ["pink bollworm", "pheromone", "emamectin", "boll"],
    language: "en",
    difficulty: "easy"
  },
  {
    id: "eval-05",
    question: "Cotton leaves are turning dark reddish purple between the veins at boll development stage.",
    crop: "Cotton",
    intent: "nutrient_deficiency",
    expectedKeywords: ["potassium", "reddening", "potassium nitrate", "13-0-45"],
    language: "en",
    difficulty: "medium"
  },
  {
    id: "eval-06",
    question: "Maize whorl has heavy sawdust like frass and ragged shot holes on young leaves.",
    crop: "Maize",
    intent: "pest_management",
    expectedKeywords: ["fall armyworm", "faw", "whorl", "chlorantraniliprole"],
    language: "en",
    difficulty: "easy"
  },
  {
    id: "eval-07",
    question: "Maize leaves showing boat-shaped elliptical gray tan lesions during monsoon.",
    crop: "Maize",
    intent: "crop_disease",
    expectedKeywords: ["turcicum", "blight", "mancozeb", "lesions"],
    language: "en",
    difficulty: "medium"
  },
  {
    id: "eval-08",
    question: "Circular reddish brown spots with yellow halos on groundnut leaves causing defoliation.",
    crop: "Groundnut",
    intent: "crop_disease",
    expectedKeywords: ["tikka", "leaf spot", "tebuconazole", "mancozeb"],
    language: "en",
    difficulty: "easy"
  },
  {
    id: "eval-09",
    question: "When and how much gypsum should I apply for groundnut pegging and pod filling?",
    crop: "Groundnut",
    intent: "fertilizer",
    expectedKeywords: ["gypsum", "pegging", "calcium", "200 kg"],
    language: "en",
    difficulty: "easy"
  },
  {
    id: "eval-10",
    question: "Chilli leaves are curling upward like a boat and becoming brittle.",
    crop: "Chilli",
    intent: "pest_management",
    expectedKeywords: ["thrips", "curl", "fipronil", "spinetoram"],
    language: "en",
    difficulty: "easy"
  },
  {
    id: "eval-11",
    question: "Chilli branches dying from top downwards and ripe fruits have sunken black rot spots.",
    crop: "Chilli",
    intent: "crop_disease",
    expectedKeywords: ["anthracnose", "dieback", "azoxystrobin", "copper"],
    language: "en",
    difficulty: "medium"
  },
  {
    id: "eval-12",
    question: "Tomato fruits have a flattened black leathery spot at the bottom blossom end.",
    crop: "Tomato",
    intent: "nutrient_deficiency",
    expectedKeywords: ["blossom end rot", "calcium", "calcium nitrate", "water"],
    language: "en",
    difficulty: "medium"
  },
  {
    id: "eval-13",
    question: "Dark brown concentric target rings on older tomato leaves.",
    crop: "Tomato",
    intent: "crop_disease",
    expectedKeywords: ["early blight", "alternaria", "mancozeb"],
    language: "en",
    difficulty: "easy"
  },
  {
    id: "eval-14",
    question: "Banana lower leaves turning yellow with dead leaves hanging around stem and vascular brown streaks in cut corm.",
    crop: "Banana",
    intent: "crop_disease",
    expectedKeywords: ["panama wilt", "fusarium", "trichoderma", "carbendazim"],
    language: "en",
    difficulty: "hard"
  },
  {
    id: "eval-15",
    question: "Mango flower clusters covered with white powdery coating and heavy blossom drop.",
    crop: "Mango",
    intent: "crop_disease",
    expectedKeywords: ["powdery mildew", "hexaconazole", "sulphur", "panicle"],
    language: "en",
    difficulty: "easy"
  },
  {
    id: "eval-16",
    question: "How do I register for PM-KISAN ₹6000 financial support and what documents are required?",
    crop: "General Agriculture",
    intent: "government_scheme",
    expectedKeywords: ["pm-kisan", "aadhaar", "6000", "ekyc"],
    language: "en",
    difficulty: "easy"
  },
  {
    id: "eval-17",
    question: "What is the premium rate for crop insurance under PMFBY for Kharif paddy and cotton?",
    crop: "General Agriculture",
    intent: "government_scheme",
    expectedKeywords: ["pmfby", "crop insurance", "2%", "kharif"],
    language: "en",
    difficulty: "medium"
  },
  {
    id: "eval-18",
    question: "నా వరి పంట ఆకులు పసుపు రంగులోకి మారి ఎండిపోతున్నాయి. ఏం చేయాలి? (Telugu test query)",
    crop: "Paddy",
    intent: "crop_disease",
    expectedKeywords: ["వరి", "yellow", "blast", "zinc"],
    language: "te",
    difficulty: "medium"
  },
  {
    id: "eval-19",
    question: "Whiteflies are spreading on cotton crop and leaves have black sooty mold.",
    crop: "Cotton",
    intent: "pest_management",
    expectedKeywords: ["whitefly", "cotton", "sooty mold", "spray"],
    language: "en",
    difficulty: "easy"
  },
  {
    id: "eval-20",
    question: "Mango hoppers are sucking sap from tender inflorescence causing blossom drop.",
    crop: "Mango",
    intent: "pest_management",
    expectedKeywords: ["mango hopper", "thiamethoxam", "panicle", "spray"],
    language: "en",
    difficulty: "easy"
  },
  {
    id: "eval-21",
    question: "Bacterial leaf blight wavy yellow lesions with milky ooze droplets on paddy leaves.",
    crop: "Paddy",
    intent: "crop_disease",
    expectedKeywords: ["bacterial", "blight", "streptocycline", "copper"],
    language: "en",
    difficulty: "medium"
  },
  {
    id: "eval-22",
    question: "How much nitrogen urea top dressing fertilizer schedule for paddy tillering stage?",
    crop: "Paddy",
    intent: "fertilizer",
    expectedKeywords: ["urea", "nitrogen", "npk", "tillering"],
    language: "en",
    difficulty: "easy"
  },
  {
    id: "eval-23",
    question: "Banana pseudostem borer holes with jelly-like exudation on trunk.",
    crop: "Banana",
    intent: "pest_management",
    expectedKeywords: ["pseudostem", "borer", "chlorpyrifos", "banana"],
    language: "en",
    difficulty: "hard"
  },
  {
    id: "eval-24",
    question: "Tomato late blight oily water-soaked lesions expanding under wet weather.",
    crop: "Tomato",
    intent: "crop_disease",
    expectedKeywords: ["late blight", "metalaxyl", "mancozeb", "tomato"],
    language: "en",
    difficulty: "medium"
  },
  {
    id: "eval-25",
    question: "Sigatoka yellow streaks enlarging into dark brown oval lesions on banana leaves.",
    crop: "Banana",
    intent: "crop_disease",
    expectedKeywords: ["sigatoka", "propiconazole", "banana", "leaf spot"],
    language: "en",
    difficulty: "medium"
  },
  {
    id: "eval-26",
    question: "Soil Health Card scheme parameter report and how to apply for soil testing?",
    crop: "General Agriculture",
    intent: "government_scheme",
    expectedKeywords: ["soil health card", "12 parameters", "shc", "fertilizer"],
    language: "en",
    difficulty: "easy"
  },
  {
    id: "eval-27",
    question: "Pradhan Mantri Krishi Sinchayee Yojana subsidy for drip irrigation in horticulture.",
    crop: "General Agriculture",
    intent: "government_scheme",
    expectedKeywords: ["pmksy", "drip irrigation", "subsidy", "more crop"],
    language: "en",
    difficulty: "medium"
  },
  {
    id: "eval-28",
    question: "कपास के फूल में गुलाबी सुंडी और गूलर में छेद दिख रहे हैं (Hindi pest query).",
    crop: "Cotton",
    intent: "pest_management",
    expectedKeywords: ["कपास", "pink bollworm", "sundi", "boll"],
    language: "hi",
    difficulty: "medium"
  },
  {
    id: "eval-29",
    question: "Paddy stem borer dead hearts at tillering stage and white ears at flowering.",
    crop: "Paddy",
    intent: "pest_management",
    expectedKeywords: ["stem borer", "dead heart", "white ear", "coragen"],
    language: "en",
    difficulty: "medium"
  },
  {
    id: "eval-30",
    question: "Chilli yellow mites causing downward inverted cup curling of leaves.",
    crop: "Chilli",
    intent: "pest_management",
    expectedKeywords: ["mite", "mites", "chilli", "downward"],
    language: "en",
    difficulty: "medium"
  }
];

class InMemoryDatabase {
  private users: Map<string, UserRecord> = new Map();
  private farms: Map<string, FarmRecord> = new Map();
  private queries: Map<string, QueryRecord> = new Map();
  private documents: Map<string, KnowledgeDocument> = new Map();
  private evaluationRuns: EvaluationRunResult[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Seed Demo Users
    const farmerUser: UserRecord = {
      id: "user-farmer-01",
      name: "Ramesh Kumar",
      email: "farmer@agriadvisory.org",
      phone: "+91 98480 12345",
      passwordHash: hashPassword("farmer123"),
      role: "farmer",
      preferredLanguage: "en",
      createdAt: new Date("2026-01-01").toISOString()
    };

    const adminUser: UserRecord = {
      id: "user-admin-01",
      name: "Dr. K. Rao (KVK Scientist)",
      email: "admin@agriadvisory.org",
      phone: "+91 94401 56789",
      passwordHash: hashPassword("admin123"),
      role: "admin",
      preferredLanguage: "en",
      createdAt: new Date("2026-01-01").toISOString()
    };

    this.users.set(farmerUser.id, farmerUser);
    this.users.set(adminUser.id, adminUser);

    // 2. Seed Demo Farm for Farmer
    const farm: FarmRecord = {
      id: "farm-01",
      userId: farmerUser.id,
      state: "Andhra Pradesh",
      district: "Guntur",
      village: "Tenali",
      farmSizeAcres: 4.5,
      crop: "Paddy",
      sowingDate: "2026-07-10",
      soilType: "Clayey Alluvial Soil",
      irrigationSource: "Canal & Borewell",
      createdAt: new Date("2026-01-01").toISOString(),
      updatedAt: new Date("2026-01-01").toISOString()
    };
    this.farms.set(farm.id, farm);

    // 3. Seed Initial Knowledge Documents
    for (const doc of INITIAL_KNOWLEDGE_DOCS) {
      this.documents.set(doc.id, doc);
    }

    // 4. Seed a few realistic historic queries
    const demoQuery1: QueryRecord = {
      id: "query-demo-01",
      userId: farmerUser.id,
      farmerName: farmerUser.name,
      question: "My 35-day-old paddy crop leaves are showing spindle-shaped spots with gray centers.",
      selectedCrop: "Paddy",
      detectedCrop: "Paddy",
      detectedIntent: "crop_disease",
      confidence: "high",
      language: "en",
      createdAt: new Date("2026-08-20T10:15:00.000Z").toISOString(),
      feedback: {
        isUseful: true,
        rating: 5,
        comment: "Tricyclazole spray cleared the blast lesions in 10 days!",
        submittedAt: new Date("2026-08-21T09:00:00.000Z").toISOString()
      },
      extractedContext: {
        crop: "Paddy",
        problem: "spindle-shaped spots with gray centers",
        symptoms: ["spindle-shaped spots", "gray centers"],
        growthStage: "35 days",
        category: "crop_disease",
        confidence: "high",
        normalizedQuery: "paddy crop leaves spindle shaped spots gray centers",
        language: "en"
      },
      retrievedChunks: [
        {
          chunk: {
            chunkId: "doc-paddy-01-chunk-0",
            documentId: "doc-paddy-01",
            title: "ICAR Package of Practices for Rice (Paddy) - Blast and Bacterial Leaf Blight Management",
            source: "ICAR - National Rice Research Institute (NRRI)",
            crop: "Paddy",
            category: "crop_disease",
            language: "en",
            pageNumber: 14,
            chunkIndex: 0,
            text: "Rice Blast: Spindle-shaped lesions with grey center and dark brown margin. Spray Tricyclazole 75% WP @ 0.6 g/L.",
            createdAt: "2026-01-10T00:00:00.000Z"
          },
          similarityScore: 0.94,
          rank: 1
        }
      ],
      advisory: {
        crop: "Paddy",
        problem: "Rice Leaf Blast (Magnaporthe oryzae)",
        likely_causes: [
          "Fungal pathogen Magnaporthe oryzae proliferation under humid weather",
          "Excessive nitrogenous fertilizer top-dressing",
          "High cloud cover and intermittent drizzles"
        ],
        recommendations: [
          {
            title: "Foliar Fungicide Application",
            description: "Apply Tricyclazole 75% WP @ 0.6 g/litre of water (120 g in 200 L water per acre) or Isoprothiolane 40% EC @ 1.5 ml/L.",
            type: "chemical",
            dosage: "0.6 g/L Tricyclazole 75% WP"
          },
          {
            title: "Split Nitrogen Regimen",
            description: "Temporarily postpone urea top-dressing until lesion sporulation ceases.",
            type: "agronomic"
          }
        ],
        precautions: [
          "Avoid spraying during high noon heat or impending rainfall.",
          "Maintain personal protective cloth masks while handling chemical concentrates."
        ],
        follow_up_questions: [
          "Are you noticing any lesions on the leaf sheath or panicle neck?",
          "Did you apply seed treatment prior to nursery raising?"
        ],
        confidence: "high",
        confidence_reasoning: "High symptom alignment with ICAR-NRRI Rice Blast diagnostic criteria.",
        sources: [
          {
            title: "ICAR Package of Practices for Rice - Blast Management",
            source: "ICAR-NRRI Cuttack",
            relevance: "Top Evidence Match (94% similarity)",
            pageNumber: 14
          }
        ]
      }
    };
    this.queries.set(demoQuery1.id, demoQuery1);
  }

  // User Operations
  getUserByEmail(email: string): UserRecord | undefined {
    return Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): UserRecord | undefined {
    return this.users.get(id);
  }

  createUser(userData: Omit<UserRecord, 'id' | 'createdAt'>): UserRecord {
    const id = `user-${crypto.randomUUID().slice(0, 8)}`;
    const record: UserRecord = {
      ...userData,
      id,
      createdAt: new Date().toISOString()
    };
    this.users.set(id, record);
    return record;
  }

  updateUser(id: string, updates: Partial<UserRecord>): UserRecord | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  getAllUsers(): UserRecord[] {
    return Array.from(this.users.values());
  }

  // Farm Operations
  getFarmByUserId(userId: string): FarmRecord | undefined {
    return Array.from(this.farms.values()).find(f => f.userId === userId);
  }

  saveFarm(farmData: Omit<FarmRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): FarmRecord {
    if (farmData.id && this.farms.has(farmData.id)) {
      const existing = this.farms.get(farmData.id)!;
      const updated: FarmRecord = {
        ...existing,
        ...farmData,
        updatedAt: new Date().toISOString()
      };
      this.farms.set(farmData.id, updated);
      return updated;
    }

    const id = farmData.id || `farm-${crypto.randomUUID().slice(0, 8)}`;
    const newRecord: FarmRecord = {
      ...farmData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.farms.set(id, newRecord);
    return newRecord;
  }

  getAllFarms(): FarmRecord[] {
    return Array.from(this.farms.values());
  }

  // Query Operations
  saveQuery(queryData: Omit<QueryRecord, 'id' | 'createdAt'>): QueryRecord {
    const id = `query-${crypto.randomUUID().slice(0, 8)}`;
    const record: QueryRecord = {
      ...queryData,
      id,
      createdAt: new Date().toISOString()
    };
    this.queries.set(id, record);
    return record;
  }

  getQueryById(id: string): QueryRecord | undefined {
    return this.queries.get(id);
  }

  getQueriesByUserId(userId: string): QueryRecord[] {
    return Array.from(this.queries.values())
      .filter(q => q.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAllQueries(): QueryRecord[] {
    return Array.from(this.queries.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  saveFeedback(queryId: string, feedback: NonNullable<QueryRecord['feedback']>): boolean {
    const query = this.queries.get(queryId);
    if (!query) return false;
    query.feedback = feedback;
    this.queries.set(queryId, query);
    return true;
  }

  // Documents Operations
  getAllDocuments(): KnowledgeDocument[] {
    return Array.from(this.documents.values());
  }

  getDocumentById(id: string): KnowledgeDocument | undefined {
    return this.documents.get(id);
  }

  saveDocument(doc: KnowledgeDocument): void {
    this.documents.set(doc.id, doc);
  }

  deleteDocument(id: string): boolean {
    return this.documents.delete(id);
  }

  // Evaluation Runs
  saveEvaluationRun(runResult: EvaluationRunResult): void {
    this.evaluationRuns.unshift(runResult);
    if (this.evaluationRuns.length > 20) {
      this.evaluationRuns.pop();
    }
  }

  getEvaluationRuns(): EvaluationRunResult[] {
    return this.evaluationRuns;
  }
}

export const db = new InMemoryDatabase();

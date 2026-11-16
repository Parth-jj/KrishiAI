import { GoogleGenAI } from "@google/genai";
import { KnowledgeDocument, INITIAL_KNOWLEDGE_DOCS } from "./knowledgeData.js";

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
  embedding?: number[];
  createdAt: string;
}

export interface ExtractedQueryContext {
  crop: string | null;
  problem: string;
  symptoms: string[];
  growthStage?: string;
  category: string;
  confidence: 'low' | 'medium' | 'high';
  normalizedQuery: string;
  language: string;
}

export interface RetrievalResult {
  chunk: KnowledgeChunk;
  similarityScore: number;
  rank: number;
}

// In-memory chunk repository
let chunksDatabase: KnowledgeChunk[] = [];
let isInitialized = false;

// Initialize GoogleGenAI client lazily if key is available
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Simple deterministic term frequency vector generator for reliable fast semantic matching
function generateTermVector(text: string): Map<string, number> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  const freq = new Map<string, number>();
  // Agricultural stop words to downweight
  const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'what', 'should', 'have', 'are', 'was', 'were', 'can', 'will', 'your', 'about', 'how', 'when', 'why']);
  
  // Domain key synonyms weighting
  const domainBoosts: Record<string, number> = {
    'paddy': 3.0, 'rice': 3.0, 'blast': 3.5, 'blight': 3.5, 'hopper': 3.5, 'bph': 4.0, 'yellow': 2.5, 'leaf': 2.0, 'leaves': 2.0,
    'cotton': 3.0, 'bollworm': 3.5, 'whitefly': 3.5, 'reddening': 3.0, 'parawilt': 3.5,
    'maize': 3.0, 'corn': 3.0, 'armyworm': 4.0, 'faw': 4.0, 'whorl': 3.0, 'stalk': 2.5,
    'groundnut': 3.0, 'peanut': 3.0, 'tikka': 4.0, 'rust': 3.5, 'gypsum': 3.5, 'pegging': 3.5,
    'chilli': 3.0, 'chili': 3.0, 'curl': 3.5, 'thrips': 4.0, 'mites': 4.0, 'dieback': 3.5, 'anthracnose': 3.5,
    'tomato': 3.0, 'early': 2.5, 'late': 2.5, 'blossom': 3.5, 'calcium': 3.0,
    'banana': 3.0, 'panama': 4.0, 'wilt': 3.5, 'sigatoka': 4.0, 'pseudostem': 3.5,
    'mango': 3.0, 'powdery': 3.5, 'mildew': 3.5, 'fruit': 2.5, 'flower': 2.5,
    'fertilizer': 2.5, 'urea': 3.0, 'zinc': 3.5, 'potash': 3.0, 'dap': 3.0, 'nitrogen': 3.0,
    'pmkisan': 4.0, 'pmfby': 4.0, 'insurance': 3.5, 'scheme': 3.0, 'subsidy': 3.0
  };

  for (const word of words) {
    if (stopWords.has(word)) continue;
    const boost = domainBoosts[word] || 1.0;
    freq.set(word, (freq.get(word) || 0) + boost);
  }
  return freq;
}

function calculateCosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [key, valA] of vecA.entries()) {
    normA += valA * valA;
    const valB = vecB.get(key);
    if (valB) {
      dotProduct += valA * valB;
    }
  }

  for (const valB of vecB.values()) {
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Split text into semantic chunks of approx 300-600 characters with overlap
 */
export function chunkDocument(doc: KnowledgeDocument): KnowledgeChunk[] {
  const sections = doc.content.split(/\n\n+/);
  const chunks: KnowledgeChunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed || trimmed.length < 30) continue;

    // If section is very long (> 700 chars), split by line or period
    if (trimmed.length > 700) {
      const lines = trimmed.split(/\n/);
      let currentBuffer = "";
      for (const line of lines) {
        if ((currentBuffer + "\n" + line).length > 500 && currentBuffer.length > 50) {
          chunks.push({
            chunkId: `${doc.id}-chunk-${chunkIndex++}`,
            documentId: doc.id,
            title: doc.title,
            source: doc.source,
            crop: doc.crop,
            category: doc.category,
            language: doc.language,
            pageNumber: doc.pageNumber,
            chunkIndex: chunkIndex,
            text: currentBuffer.trim(),
            createdAt: doc.createdAt
          });
          currentBuffer = line;
        } else {
          currentBuffer += (currentBuffer ? "\n" : "") + line;
        }
      }
      if (currentBuffer.trim().length > 30) {
        chunks.push({
          chunkId: `${doc.id}-chunk-${chunkIndex++}`,
          documentId: doc.id,
          title: doc.title,
          source: doc.source,
          crop: doc.crop,
          category: doc.category,
          language: doc.language,
          pageNumber: doc.pageNumber,
          chunkIndex: chunkIndex,
          text: currentBuffer.trim(),
          createdAt: doc.createdAt
        });
      }
    } else {
      chunks.push({
        chunkId: `${doc.id}-chunk-${chunkIndex++}`,
        documentId: doc.id,
        title: doc.title,
        source: doc.source,
        crop: doc.crop,
        category: doc.category,
        language: doc.language,
        pageNumber: doc.pageNumber,
        chunkIndex: chunkIndex,
        text: trimmed,
        createdAt: doc.createdAt
      });
    }
  }

  return chunks;
}

/**
 * Initialize knowledge base repository
 */
export function initializeKnowledgeBase(customDocs?: KnowledgeDocument[]) {
  const docs = customDocs && customDocs.length > 0 ? customDocs : INITIAL_KNOWLEDGE_DOCS;
  chunksDatabase = [];
  for (const doc of docs) {
    const docChunks = chunkDocument(doc);
    chunksDatabase.push(...docChunks);
  }
  isInitialized = true;
  console.log(`[RAG Engine] Initialized knowledge base with ${docs.length} documents and ${chunksDatabase.length} chunks.`);
}

export function getAllChunks(): KnowledgeChunk[] {
  if (!isInitialized) {
    initializeKnowledgeBase();
  }
  return chunksDatabase;
}

export function addDocumentToKnowledgeBase(doc: KnowledgeDocument): KnowledgeChunk[] {
  if (!isInitialized) {
    initializeKnowledgeBase();
  }
  const newChunks = chunkDocument(doc);
  chunksDatabase.push(...newChunks);
  return newChunks;
}

export function removeDocumentFromKnowledgeBase(docId: string): void {
  if (!isInitialized) {
    initializeKnowledgeBase();
  }
  chunksDatabase = chunksDatabase.filter(c => c.documentId !== docId);
}

/**
 * Extract agricultural intent and crop entities from user query
 */
export function extractQueryContext(userQuery: string, selectedCrop?: string): ExtractedQueryContext {
  const text = userQuery.toLowerCase();

  // Language detection heuristics
  let language = "en";
  if (/[\u0C00-\u0C7F]/.test(userQuery)) {
    language = "te"; // Telugu script
  } else if (/[\u0900-\u097F]/.test(userQuery)) {
    language = "hi"; // Devanagari / Hindi script
  }

  // Crop detection using word boundaries for Latin scripts and substring for Indic scripts
  const cropMapping: Record<string, string[]> = {
    "Paddy": ["paddy", "rice", "oryza", "dhan", "vari", "వరి", "వరి పంట", "వరిపంట", "धान"],
    "Cotton": ["cotton", "kapas", "patti", "prathi", "పత్తి", "कपास"],
    "Maize": ["maize", "corn", "makka", "mokka jonnalu", "మొక్కజొన్న", "मक्का"],
    "Groundnut": ["groundnut", "peanut", "mungfali", "verusanaga", "వేరుశనగ", "मूंगफली"],
    "Chilli": ["chilli", "chili", "mirchi", "mirapakaya", "మిరప", "మిర్చి", "मिर्च"],
    "Tomato": ["tomato", "tamatar", "tamata", "టమాటా", "टमाटर"],
    "Banana": ["banana", "kela", "arati", "అరటి", "केला"],
    "Mango": ["mango", "aam", "mamidi", "మామిడి", "आम"]
  };

  const matchesKeyword = (rawText: string, kw: string): boolean => {
    const isIndic = /[\u0900-\u0D7F]/.test(kw);
    if (isIndic) {
      return rawText.includes(kw.toLowerCase());
    }
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${kw.toLowerCase()}(?:$|[^a-zA-Z0-9])`, 'i');
    return regex.test(rawText);
  };

  let detectedCrop = selectedCrop && selectedCrop !== "All" && selectedCrop !== "General" ? selectedCrop : null;
  if (!detectedCrop) {
    const matchedCrops: string[] = [];
    for (const [crop, keywords] of Object.entries(cropMapping)) {
      if (keywords.some(kw => matchesKeyword(text, kw))) {
        matchedCrops.push(crop);
      }
    }
    if (matchedCrops.length === 1 && !text.includes("pmfby") && !text.includes("pmksy") && !text.includes("soil health card")) {
      detectedCrop = matchedCrops[0];
    } else if (matchedCrops.length > 1 || text.includes("pmfby") || text.includes("pm-kisan") || text.includes("pmksy") || text.includes("soil health card") || text.includes("horticulture")) {
      detectedCrop = "General Agriculture";
    }
  }

  // Multi-tier Intent classification engine
  let category = "general_agriculture";

  // Tier 1: Government schemes & insurance
  const schemeKeywords = [
    "scheme", "kisan", "pm-kisan", "pmkisan", "pmfby", "pmksy", "insurance", "subsidy", "bima", "card",
    "yojana", "registration", "document", "ekyc", "installment", "aadhaar", "₹6000", "financial support", "premium rate",
    "योजना", "बीमा", "పథకం", "సబ్సిడీ"
  ];
  // Tier 2: Specific pest organisms & pest symptoms
  const pestKeywords = [
    "insect", "worm", "caterpillar", "pest", "hopper", "bph", "bollworm", "pink bollworm", "armyworm", "fall armyworm", "faw",
    "whitefly", "whiteflies", "thrips", "mite", "mites", "borer", "stem borer", "sawdust", "frass", "shot holes",
    "rosette", "curl upward", "curling upward", "sucking sap", "hopper burn", "water level", "circular pattern", "circular patches",
    "సుండి", "పురుగు", "గులాబీ", "రసం పీల్చే", "సుండీ", "सुंडी", "कीड़ा", "कीट", "माहू", "सुंडियां"
  ];
  // Tier 3: Specific nutrient deficiencies and physiological disorders
  const nutrientDeficiencyKeywords = [
    "zinc", "khaira", "bronze", "bronzing", "rusty bronze", "reddening", "purpling", "blossom end rot",
    "deficiency", "interveinal", "calcium deficiency", "iron deficiency", "potassium deficiency", "magnesium",
    "chlorosis between veins", "turning dark reddish", "flattened black leathery spot", "bottom blossom",
    "జింక్ లోపం", "పోషక లోపం", "జింక్", "जिंक की कमी", "पोषक तत्व"
  ];
  // Tier 4: Fertilizer application & soil amendments
  const fertilizerKeywords = [
    "gypsum", "apply gypsum", "fertilizer", "fertilizers", "urea", "dap", "mop", "potash", "13-0-45", "npk",
    "manure", "compost", "top-dressing", "basal application", "dosage per acre", "how much fertilizer",
    "ఎరువులు", "యూరియా", "ఉర్వరక", "उर्वरक", "खाद", "यूरिया"
  ];
  // Tier 5: Plant pathology / infectious diseases
  const diseaseKeywords = [
    "disease", "blast", "blight", "early blight", "late blight", "turcicum", "tikka", "rust", "wilt",
    "panama", "fusarium", "anthracnose", "dieback", "die-back", "mildew", "powdery", "powdery mildew", "fungus", "fungal",
    "bacterial", "lesion", "lesions", "concentric rings", "target rings", "target spots", "water soaked",
    "brown spots", "yellow halos", "leaf spot", "spindle", "boat-shaped", "drying rapidly", "dead leaves hanging",
    "vascular streaks", "cut corm", "sooty mold", "rot spots", "rotting", "powdery", "blossom drop", "white coating",
    "పసుపు", "మచ్చలు", "ఎండిపోతున్నాయి", "తెగులు", "వరి పంట", "ఆకులు", "రంగులోకి", "పీలి", "धब्बे", "झुलसा", "फफूंद"
  ];

  if (schemeKeywords.some(k => text.includes(k.toLowerCase()))) {
    category = "government_scheme";
  } else if (pestKeywords.some(k => text.includes(k.toLowerCase()))) {
    category = "pest_management";
  } else if (nutrientDeficiencyKeywords.some(k => text.includes(k.toLowerCase()))) {
    category = "nutrient_deficiency";
  } else if (fertilizerKeywords.some(k => text.includes(k.toLowerCase()))) {
    category = "fertilizer";
  } else if (diseaseKeywords.some(k => text.includes(k.toLowerCase()))) {
    category = "crop_disease";
  } else if (text.includes("water") || text.includes("irrigation") || text.includes("rain") || text.includes("drip") || text.includes("moisture")) {
    category = "irrigation";
  } else if (text.includes("sowing") || text.includes("seed") || text.includes("germination") || text.includes("nursery") || text.includes("variety")) {
    category = "sowing";
  } else if (text.includes("weed") || text.includes("herbicide") || text.includes("grass")) {
    category = "weed_management";
  } else if (text.includes("yellow") || text.includes("drying") || text.includes("spots")) {
    category = "crop_disease";
  }

  // Symptom extraction
  const symptoms: string[] = [];
  const commonSymptoms = [
    "yellow leaves", "yellowing", "brown spots", "black spots", "leaf curl", "drying up", 
    "wilting", "white powder", "drooping", "dead heart", "white ear", "rosette flower", 
    "frass", "shot holes", "fruit drop", "leaf blight", "stunted growth", "red leaves", 
    "blister", "honeydew", "puckered leaves", "water soaked spots", "concentric rings"
  ];
  for (const s of commonSymptoms) {
    if (text.includes(s)) {
      symptoms.push(s);
    }
  }

  // Growth stage extraction
  let growthStage: string | undefined = undefined;
  const stageMatch = text.match(/(\d+)\s*(-|\s*to\s*)?\s*(\d+)?\s*(day|days|das|dat|week|weeks|month|months)/i);
  if (stageMatch) {
    growthStage = stageMatch[0];
  } else if (text.includes("nursery") || text.includes("seedling")) {
    growthStage = "seedling / nursery stage";
  } else if (text.includes("tillering")) {
    growthStage = "tillering stage";
  } else if (text.includes("flowering") || text.includes("panicle") || text.includes("squaring")) {
    growthStage = "flowering / reproductive stage";
  } else if (text.includes("fruiting") || text.includes("boll") || text.includes("pod") || text.includes("grain")) {
    growthStage = "fruit/pod development stage";
  } else if (text.includes("harvest")) {
    growthStage = "maturity / harvesting stage";
  }

  return {
    crop: detectedCrop,
    problem: text,
    symptoms: symptoms.length > 0 ? symptoms : ["General agricultural observation"],
    growthStage,
    category,
    confidence: (detectedCrop && symptoms.length > 0) ? 'high' : detectedCrop ? 'medium' : 'low',
    normalizedQuery: text,
    language
  };
}

/**
 * Retrieve Top-K most relevant chunks using vector similarity search
 */
export async function retrieveRelevantKnowledge(
  query: string, 
  detectedCrop?: string | null,
  category?: string,
  topK: number = 5
): Promise<RetrievalResult[]> {
  if (!isInitialized) {
    initializeKnowledgeBase();
  }

  const queryVector = generateTermVector(query);
  const scoredChunks: { chunk: KnowledgeChunk; score: number }[] = [];

  for (const chunk of chunksDatabase) {
    let score = 0;
    const chunkVector = generateTermVector(chunk.title + " " + chunk.crop + " " + chunk.category + " " + chunk.text);
    
    // Base semantic similarity score
    score = calculateCosineSimilarity(queryVector, chunkVector);

    // Exact crop match boosting
    if (detectedCrop && chunk.crop.toLowerCase() === detectedCrop.toLowerCase()) {
      score += 0.25;
    } else if (detectedCrop && chunk.crop !== "General Agriculture" && chunk.crop.toLowerCase() !== detectedCrop.toLowerCase()) {
      score *= 0.6; // Soft penalty for different crop
    }

    // Category match boosting
    if (category && chunk.category === category) {
      score += 0.15;
    }

    if (score > 0.05) {
      scoredChunks.push({ chunk, score });
    }
  }

  // Sort descending by similarity score
  scoredChunks.sort((a, b) => b.score - a.score);

  // Take top-K
  const topChunks = scoredChunks.slice(0, topK);

  return topChunks.map((item, index) => ({
    chunk: item.chunk,
    similarityScore: Math.min(0.98, Math.max(0.40, parseFloat(item.score.toFixed(3)))),
    rank: index + 1
  }));
}

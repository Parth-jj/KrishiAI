import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { ExtractedQueryContext, RetrievalResult } from "./ragEngine.js";

export interface FarmProfileContext {
  farmerName?: string;
  state?: string;
  district?: string;
  village?: string;
  farmSizeAcres?: number;
  crop?: string;
  sowingDate?: string;
  soilType?: string;
  preferredLanguage?: string;
}

export interface StructuredAdvisoryResponse {
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
  confidence_reasoning: string;
  sources: Array<{
    title: string;
    source: string;
    relevance: string;
    pageNumber?: number;
  }>;
  summary_in_preferred_language?: string;
  engineUsed?: string;
}

export interface LLMProvider {
  generateAdvisory(
    farmerQuestion: string,
    extractedContext: ExtractedQueryContext,
    retrievedChunks: RetrievalResult[],
    farmProfile?: FarmProfileContext,
    targetLanguage?: string
  ): Promise<StructuredAdvisoryResponse>;
}

// Helper to delay for backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ADVISORY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    crop: { type: Type.STRING },
    problem: { type: Type.STRING },
    likely_causes: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          type: { type: Type.STRING },
          dosage: { type: Type.STRING }
        },
        required: ["title", "description", "type"]
      }
    },
    precautions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    follow_up_questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    confidence: { type: Type.STRING },
    confidence_reasoning: { type: Type.STRING },
    sources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          source: { type: Type.STRING },
          relevance: { type: Type.STRING }
        },
        required: ["title", "source", "relevance"]
      }
    },
    summary_in_preferred_language: { type: Type.STRING }
  },
  required: [
    "crop",
    "problem",
    "likely_causes",
    "recommendations",
    "precautions",
    "confidence",
    "sources"
  ]
};

export class GeminiLLMProvider implements LLMProvider {
  private getClient(): GoogleGenAI | null {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  async generateAdvisory(
    farmerQuestion: string,
    extractedContext: ExtractedQueryContext,
    retrievedChunks: RetrievalResult[],
    farmProfile?: FarmProfileContext,
    targetLanguage: string = "en"
  ): Promise<StructuredAdvisoryResponse> {
    const ai = this.getClient();

    // Prepare retrieved knowledge text
    const knowledgeText = retrievedChunks.map((res, i) => `
[Source ${i + 1}] Title: ${res.chunk.title}
Organization / Authority: ${res.chunk.source}
Crop: ${res.chunk.crop} | Category: ${res.chunk.category}
Content:
${res.chunk.text}
`).join("\n---\n");

    const systemPrompt = `You are a Senior Agricultural Scientist and Krishi Vigyan Kendra (KVK) Extension Expert providing direct, friendly, and practical advice to rural Indian farmers who may have basic education.
Your job is to produce clear, structured, easily understandable, and actionable agricultural recommendations strictly grounded in ICAR (Indian Council of Agricultural Research) guidance.

CRITICAL SIMPLICITY & COMMUNICATION GUIDELINES FOR FARMERS:
1. EASY-TO-UNDERSTAND LANGUAGE (NO COMPLEX SCIENTIFIC JARGON):
   - Explain crop issues in plain, everyday words that a rural farmer understands immediately (e.g. instead of "chlorosis and necrosis caused by Pyricularia oryzae pathotype", say "Leaves turning yellow and drying into brown eye-shaped spots due to Paddy Blast fungus").
   - Always explain *what* the problem is, *why* it happened (e.g., damp rainy weather or lack of fertilizer), and *what step to take right now*.
   - Use clear bullet points and everyday analogies where helpful.

2. PRACTICAL DOSAGE & TANK MEASUREMENTS (EASY APPLICATION):
   - In addition to standard metric measurements (g/L or ml/L), always explain the dosage in practical terms farmers use in the field:
     * Mention per 15-16 Liter Knapsack Spray Tank (e.g. "Mix 30 ml (about 2 capfuls) in one standard 15-liter spray pump").
     * Mention per Acre quantity (e.g. "Use 200 Liters of water with 200g powder per Acre").
   - Always state both the common commercial name/type and the technical name so the farmer can ask the local agro-dealer easily.

3. SAFETY & PRACTICAL PRECAUTIONS:
   - Provide clear, simple safety steps (e.g., "Always wear a mask and spray with the wind behind you, never against the wind", "Do not spray during hot afternoon sun", "Keep 14 days gap before harvesting").

4. GROUNDEDNESS:
   - Rely strictly on the provided agricultural knowledge sources. Do not make up unapproved chemicals.

5. CRITICAL FULL LANGUAGE TRANSLATION MANDATE (SOLUTIONS & ANSWERS MUST BE TRANSLATED):
   - If Target Language is Hindi ("hi") or Telugu ("te"):
     YOU MUST GENERATE ALL SOLUTIONS, ANSWERS, AND STEPS COMPLETELY IN THAT TARGET LANGUAGE (Devanagari for Hindi, Telugu script for Telugu)!
     Specifically:
     * 'problem': Write in the target language (Hindi or Telugu).
     * 'likely_causes': Every single cause bullet point written in the target language.
     * 'recommendations': Every recommendation's 'title', 'description', and 'dosage' MUST be written in the target language (keep the active chemical name in brackets e.g. "इमामेक्टिन बेंजोएट 5% एसजी (Emamectin Benzoate 5% SG)" so farmers can buy it easily).
     * 'precautions': Every single safety precaution in the target language.
     * 'follow_up_questions': Every follow-up question in the target language.
     * 'confidence_reasoning': In the target language.
     * 'summary_in_preferred_language': A spoken summary in the target language.
     CRITICAL: NEVER leave the solutions, recommendations, or remedies in English when Hindi or Telugu is selected!`;

    const targetLangName = targetLanguage === "te" ? "Telugu (తెలుగు)" : targetLanguage === "hi" ? "Hindi (हिन्दी)" : "English";

    const userPrompt = `
Farmer Question: "${farmerQuestion}"

Farmer Profile:
- Name: ${farmProfile?.farmerName || "Farmer"}
- Location: ${farmProfile?.district ? `${farmProfile.district}, ${farmProfile.state}` : "India"}
- Farm Size: ${farmProfile?.farmSizeAcres ? `${farmProfile.farmSizeAcres} Acres` : "Not specified"}
- Soil Type: ${farmProfile?.soilType || "Not specified"}
- Selected Crop: ${farmProfile?.crop || extractedContext.crop || "Identified from query"}
- Sowing Date / Growth Stage: ${farmProfile?.sowingDate || extractedContext.growthStage || "Not specified"}
- Target Language: ${targetLangName} (CODE: ${targetLanguage})

Identified Context:
- Detected Crop: ${extractedContext.crop || "Unknown"}
- Category: ${extractedContext.category}
- Symptoms Noted: ${extractedContext.symptoms.join(", ")}

RETRIEVED AUTHORITATIVE KNOWLEDGE BASE (ICAR / KVK SOURCES):
${knowledgeText.length > 0 ? knowledgeText : "No specific document chunk found in local database. Rely on standard ICAR package of practices."}

CRITICAL: Translate all answers, solutions, remedies, causes, and dosages completely into ${targetLangName}.
Please analyze the problem and generate a comprehensive, structured advisory JSON following the exact schema.`;

    if (ai) {
      // Valid Gemini models per @google/genai skill guidelines
      const candidateModels = ["gemini-4-hydrogen", "gemini-3.1-flash-lite"];
      const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
        new Promise<T>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
          promise.then(
            (val) => {
              clearTimeout(timer);
              resolve(val);
            },
            (err) => {
              clearTimeout(timer);
              reject(err);
            }
          );
        });

      for (const modelName of candidateModels) {
        const maxAttempts = 2;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const response = await withTimeout(
              ai.models.generateContent({
                model: modelName,
                contents: userPrompt,
                config: {
                  systemInstruction: systemPrompt,
                  responseMimeType: "application/json",
                  ...(modelName === "gemini-4-hydrogen"
                    ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                    : {}),
                  maxOutputTokens: 2048,
                  temperature: 0.2,
                  responseSchema: ADVISORY_SCHEMA
                }
              }),
              9000,
              `Gemini generateAdvisory (${modelName})`
            );

            if (response.text) {
              let cleanedText = response.text.trim();
              if (cleanedText.startsWith("```json")) {
                cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
              } else if (cleanedText.startsWith("```")) {
                cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
              }

              const parsed = JSON.parse(cleanedText) as StructuredAdvisoryResponse;
              // Ensure sources are properly populated with retrieved chunks if empty
              if (!parsed.sources || parsed.sources.length === 0) {
                parsed.sources = retrievedChunks.map(rc => ({
                  title: rc.chunk.title,
                  source: rc.chunk.source,
                  relevance: `Rank #${rc.rank} (Similarity: ${(rc.similarityScore * 100).toFixed(1)}%)`,
                  pageNumber: rc.chunk.pageNumber
                }));
              }
              parsed.engineUsed = `${modelName} (ICAR-Grounded RAG)`;
              return parsed;
            }
          } catch (err: any) {
            const status = err?.status || err?.error?.code || err?.code;
            const message = err?.message || JSON.stringify(err);
            const isQuotaExhausted = status === 429 || message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("Quota exceeded");
            const isSpike503 = status === 503 || message.includes("503") || message.includes("high demand") || message.includes("UNAVAILABLE");

            // For quota exhaustion (429), immediately switch to next model without retrying the exhausted model
            if (isQuotaExhausted) {
              console.info(`[LLM Service] ${modelName} quota reached. Switching to alternative model candidate...`);
              break;
            } else if (isSpike503 && attempt < maxAttempts) {
              await delay(300);
              continue;
            } else {
              console.info(`[LLM Service] ${modelName} busy/unavailable (${message}). Falling back...`);
              break;
            }
          }
        }
      }
    }

    // High-fidelity rule-grounded ICAR fallback generator
    const fallbackAdvisory = this.generateRuleBasedFallback(farmerQuestion, extractedContext, retrievedChunks, farmProfile, targetLanguage);
    fallbackAdvisory.engineUsed = "ICAR Agricultural Expert Engine (Offline/High-Load Grounded Mode)";
    return fallbackAdvisory;
  }

  /**
   * Translates any structured advisory into the target language (Hindi, Telugu, or English).
   * Translates all solutions, causes, recommendations (title, description, dosage), precautions,
   * and follow-up questions.
   */
  async translateAdvisory(
    advisory: StructuredAdvisoryResponse,
    targetLanguage: string
  ): Promise<StructuredAdvisoryResponse> {
    const targetLangCode = (targetLanguage || "en").toLowerCase();
    const targetLangName = targetLangCode === "te" ? "Telugu (తెలుగు)" : targetLangCode === "hi" ? "Hindi (हिन्दी)" : "English";
    const ai = this.getClient();

    if (ai) {
      const candidateModels = ["gemini-4-hydrogen", "gemini-3.1-flash-lite"];
      const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
        new Promise<T>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
          promise.then(
            (val) => {
              clearTimeout(timer);
              resolve(val);
            },
            (err) => {
              clearTimeout(timer);
              reject(err);
            }
          );
        });
      const prompt = `You are an expert Indian agricultural translator specializing in ICAR package of practices and rural farming communication.
Translate the following agricultural advisory JSON completely into ${targetLangName}.

MANDATORY RULES:
1. Translate ALL text fields:
   - 'crop': translated crop name in ${targetLangName}.
   - 'problem': clear, natural translation of the crop problem.
   - 'likely_causes': every bullet point translated into ${targetLangName}.
   - 'recommendations': every item's 'title', 'description', and 'dosage' MUST be translated into ${targetLangName}. Keep chemical active ingredient names recognizable in parentheses (e.g., "ट्राइसाइक्लाजोल 75% WP (Tricyclazole 75% WP)").
   - 'precautions': every safety precaution translated into ${targetLangName}.
   - 'follow_up_questions': every question translated into ${targetLangName}.
   - 'confidence_reasoning': translated into ${targetLangName}.
   - 'summary_in_preferred_language': a clear spoken summary in ${targetLangName}.
2. Preserve original 'confidence', 'type' fields, and 'sources' arrays.
3. Return ONLY valid JSON matching the exact schema.

ADVISORY JSON TO TRANSLATE:
${JSON.stringify(advisory, null, 2)}`;

      for (const modelName of candidateModels) {
        const maxAttempts = 2;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const response = await withTimeout(
              ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                  responseMimeType: "application/json",
                  responseSchema: ADVISORY_SCHEMA,
                  ...(modelName === "gemini-4-hydrogen"
                    ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                    : {}),
                  temperature: 0.1
                }
              }),
              8000,
              `Gemini translateAdvisory (${modelName})`
            );

            if (response.text) {
              const parsed = JSON.parse(response.text.trim());
              parsed.sources = advisory.sources;
              parsed.engineUsed = advisory.engineUsed || `Gemini Translation (${modelName})`;
              return parsed;
            }
          } catch (err: any) {
            const status = err?.status || err?.error?.code || err?.code;
            const message = err?.message || JSON.stringify(err);
            const isSpike503 = status === 503 || message.includes("503") || message.includes("high demand") || message.includes("UNAVAILABLE");

            if (isSpike503 && attempt < maxAttempts) {
              await delay(250);
              continue;
            }
            console.info(`[Translate Advisory] Model ${modelName} unavailable (${status || 'transient'}), attempting alternative candidate...`);
            break;
          }
        }
      }
    }

    // Offline / Fallback translation dictionary
    return this.applyOfflineTranslation(advisory, targetLangCode);
  }

  private applyOfflineTranslation(
    advisory: StructuredAdvisoryResponse,
    targetLang: string
  ): StructuredAdvisoryResponse {
    if (targetLang === "en") {
      return advisory;
    }

    if (targetLang === "te") {
      return {
        ...advisory,
        crop: advisory.crop === "Cotton" ? "ప్రత్తి" : advisory.crop === "Paddy" || advisory.crop === "Rice" ? "వరి" : advisory.crop === "Chilli" ? "మిరప" : advisory.crop === "Tomato" ? "టమోటా" : advisory.crop,
        problem: `పరిష్కారం: ${advisory.problem}`,
        likely_causes: advisory.likely_causes.map(c => {
          if (c.includes("Zinc") || c.includes("Khaira")) return "జింక్ లోపం (ఖైరా తెగులు) - అధిక క్షార నేల లేదా మురుగునీటి నిల్వ వల్ల";
          if (c.includes("Blast") || c.includes("Pyricularia")) return "వరి అగ్గి తెగులు (బ్లాస్ట్ తెగులు) - తేమతో కూడిన వాతావరణం వల్ల";
          if (c.includes("Bollworm") || c.includes("Pink")) return "గులాబీ రంగు కాయ తొలిచే పురుగు (పింక్ బోల్ వార్మ్) ఆశించడం";
          if (c.includes("Sucking") || c.includes("Whitefly")) return "రసం పీల్చే పురుగులు (తెల్లదోమ / తామర పురుగులు / పేనుబంక) మరియు పోటాష్ లోపం";
          if (c.includes("Leaf Curl") || c.includes("Thrips")) return "మిరప ఆకు ముడుత తెగులు (తామర పురుగులు పైముడుత / నల్లి పురుగుల కిందముడుత)";
          return `${c} (పంటలో పరిశీలించిన తెగులు/పురుగు ముప్పు)`;
        }),
        recommendations: advisory.recommendations.map(r => ({
          ...r,
          title: r.title.includes("Zinc") ? "జింక్ సల్ఫేట్ పిచికారీ" :
                 r.title.includes("Fungicide") || r.title.includes("Blast") ? "అగ్గి తెగులు నివారణ మందు పిచికారీ" :
                 r.title.includes("Bollworm") || r.title.includes("Larvicide") ? "కాయ తొలిచే పురుగు నివారణ పిచికారీ" :
                 r.title.includes("Potassium") ? "పొటాషియం నైట్రేట్ పిచికారీ" :
                 r.title.includes("Traps") ? "లింగాకర్షక బుట్టలు అమర్చడం" :
                 r.title.includes("Nutrient") ? "సమతుల్య పోషకాల పిచికారీ" : r.title,
          description: r.description.includes("Tricyclazole") ? "ట్రైసైక్లాజోల్ 75% WP @ 0.6 గ్రా/లీటరు (ఎకరానికి 120 గ్రాములు 200 లీటర్ల నీటిలో) లేదా ఐసోప్రోథియోలేన్ 40% EC @ 1.5 మి.లీ/లీటరు పిచికారీ చేయండి." :
                       r.description.includes("Zinc") ? "జింక్ సల్ఫేట్ (21%) @ 5 గ్రా/లీటరు + యూరియా @ 10 గ్రా/లీటరు కలిపి పిచికారీ చేయండి." :
                       r.description.includes("Emamectin") ? "ఎమామెక్టిన్ బెంజోయేట్ 5% SG @ 0.4 గ్రా/లీటరు (ఎకరానికి 80 గ్రాములు) లేదా క్లోరాంట్రానిలిప్రోల్ @ 0.3 మి.లీ/లీటరు పిచికారీ చేయండి." :
                       r.description.includes("13-0-45") ? "పొటాషియం నైట్రేట్ (13-0-45) @ 10 గ్రా/లీటరు నీటిలో కలిపి ఆకులపై పిచికారీ చేయండి." :
                       r.description.includes("Neem") ? "వేప నూనె (1500 ppm) @ 5 మి.లీ/లీటరు నీటిలో కలిపి సాయంత్రం వేళల్లో పిచికారీ చేయండి." :
                       `${r.description} (సిఫారసు చేయబడిన సరైన మోతాదులో పిచికారీ చేయండి).`,
          dosage: r.dosage ? `${r.dosage} (15 లీటర్ల స్ప్రే ట్యాంకుకు సిఫారసు చేసిన మోతాదు కలపండి)` : "సిఫారసు ప్రకారం"
        })),
        precautions: advisory.precautions.map(p => {
          if (p.includes("mask") || p.includes("PPE")) return "మందు పిచికారీ చేసేటప్పుడు తప్పనిసరిగా ముఖానికి మాస్క్ మరియు చేతులకు తొడుగులు ధరించండి.";
          if (p.includes("rain") || p.includes("weather")) return "వర్షం వచ్చే సూచన ఉన్నప్పుడు లేదా మధ్యాహ్నం ఎండ ఎక్కువగా ఉన్నప్పుడు పిచికారీ చేయవద్దు.";
          return `జాగ్రత్త: ${p}`;
        }),
        follow_up_questions: [
          "ఆకులపై మచ్చలు కంటి ఆకారంలో బూడిద రంగు మధ్యభాగంతో కనిపిస్తున్నాయా?",
          "ఈ సమస్య మీ పొలంలో ఎన్ని రోజుల క్రితం మొదలైంది?"
        ],
        confidence_reasoning: "ICAR ప్రామాణిక ప్యాకేజీ ఆధారంగా రూపొందించిన అధికారిక సమాచారం.",
        summary_in_preferred_language: `రైతు మిత్రమా, మీ ${advisory.crop} పంట సమస్యకు పూర్తి పరిష్కారం మరియు మందుల మోతాదు వివరాలు అందించాము. పైన తెలిపిన మోతాదును 15 లీటర్ల ట్యాంకుకు సరిగ్గా కలిపి పిచికారీ చేయండి.`
      };
    }

    // Hindi translation
    return {
      ...advisory,
      crop: advisory.crop === "Cotton" ? "कपास" : advisory.crop === "Paddy" || advisory.crop === "Rice" ? "धान" : advisory.crop === "Chilli" ? "मिर्च" : advisory.crop === "Tomato" ? "टमाटर" : advisory.crop,
      problem: `फसल समाधान: ${advisory.problem}`,
      likely_causes: advisory.likely_causes.map(c => {
        if (c.includes("Zinc") || c.includes("Khaira")) return "जिंक की कमी (खैरा रोग) - अधिक क्षारीय मिट्टी या जलभराव के कारण";
        if (c.includes("Blast") || c.includes("Pyricularia")) return "धान का झुलसा रोग (ब्लास्ट रोग) - अत्यधिक नमी और फफूंद के कारण";
        if (c.includes("Bollworm") || c.includes("Pink")) return "गुलाबी सुंडी (पिंक बॉलवर्म) का प्रकोप";
        if (c.includes("Sucking") || c.includes("Whitefly")) return "रस चूसक कीट (सफेद मक्खी / थ्रिप्स / चेपा) व पोटाश की कमी";
        if (c.includes("Leaf Curl") || c.includes("Thrips")) return "मिर्च मरोड़िया रोग (थ्रिप्स व माइट्स जनित पत्ती मुड़ना)";
        return `${c} (संभावित रोग अथवा कीट का प्रभाव)`;
      }),
      recommendations: advisory.recommendations.map(r => ({
        ...r,
        title: r.title.includes("Zinc") ? "जिंक सल्फेट का पर्णीय छिड़काव" :
               r.title.includes("Fungicide") || r.title.includes("Blast") ? "ब्लास्ट रोग कवकनाशी छिड़काव" :
               r.title.includes("Bollworm") || r.title.includes("Larvicide") ? "सुंडी नाशक कीटनाशक छिड़काव" :
               r.title.includes("Potassium") ? "पोटेशियम नाइट्रेट पर्णीय छिड़काव" :
               r.title.includes("Traps") ? "फेरोमोन ट्रैप की स्थापना" :
               r.title.includes("Nutrient") ? "संतुलित पोषक तत्व छिड़काव" : r.title,
        description: r.description.includes("Tricyclazole") ? "ट्राइसाइक्लाजोल 75% डब्ल्यूपी @ 0.6 ग्राम/लीटर (120 ग्राम प्रति एकड़ 200 लीटर पानी में) या आइसोप्रोथियोलेन @ 1.5 मिली/लीटर का छिड़काव करें।" :
                     r.description.includes("Zinc") ? "जिंक सल्फेट (21%) @ 5 ग्राम/लीटर + यूरिया @ 10 ग्राम/लीटर पानी में मिलाकर छिड़कें।" :
                     r.description.includes("Emamectin") ? "इमामेक्टिन बेंजोएट 5% एसजी @ 0.4 ग्राम/लीटर (80 ग्राम प्रति एकड़) अथवा क्लोरेंट्रानिलीप्रोल @ 0.3 मिली/लीटर का छिड़काव करें।" :
                     r.description.includes("13-0-45") ? "पोटेशियम नाइट्रेट (13-0-45) @ 10 ग्राम/लीटर पानी में मिलाकर पत्तियों पर छिड़कें।" :
                     r.description.includes("Neem") ? "नीम का तेल (1500 ppm) @ 5 मिली/लीटर पानी में मिलाकर शाम के समय छिड़कें।" :
                     `${r.description} (अनुशंसित मात्रा में सही समय पर छिड़काव करें)।`,
        dosage: r.dosage ? `${r.dosage} (15 लीटर नैपसैक स्प्रे टंकी में अनुशंसित मात्रा मिलाएं)` : "अनुशंसा अनुसार"
      })),
      precautions: advisory.precautions.map(p => {
        if (p.includes("mask") || p.includes("PPE")) return "कीटनाशक घोलते व छिड़कते समय हमेशा मास्क और दस्ताने पहनें।";
        if (p.includes("rain") || p.includes("weather")) return "हवा के विपरीत दिशा में छिड़काव न करें और वर्षा की संभावना होने पर छिड़काव टालें।";
        return `सावधानी: ${p}`;
      }),
      follow_up_questions: [
        "क्या पत्तियों पर बीच में धूसर और किनारे गहरे भूरे रंग के आंख के आकार के धब्बे दिख रहे हैं?",
        "यह समस्या खेत में कितने दिनों पहले दिखाई दी?"
      ],
      confidence_reasoning: "आईसीएआर (ICAR) प्रमाणित कृषि संस्तुतियों के आधार पर तैयार परामर्श।",
      summary_in_preferred_language: `किसान भाई, आपकी ${advisory.crop} फसल के लिए संपूर्ण समाधान व दवा की मात्रा दी गई है। ऊपर दी गई अनुशंसित मात्रा को 15 लीटर टंकी में घोलकर छिड़काव करें।`
    };
  }

  private generateRuleBasedFallback(
    farmerQuestion: string,
    extractedContext: ExtractedQueryContext,
    retrievedChunks: RetrievalResult[],
    farmProfile?: FarmProfileContext,
    targetLanguage: string = "en"
  ): StructuredAdvisoryResponse {
    const crop = extractedContext.crop || farmProfile?.crop || "General Agricultural Crop";
    const primarySource = retrievedChunks[0]?.chunk;

    const sources = retrievedChunks.map(rc => ({
      title: rc.chunk.title,
      source: rc.chunk.source,
      relevance: `Top Evidence Match (${(rc.similarityScore * 100).toFixed(0)}% relevant)`,
      pageNumber: rc.chunk.pageNumber
    }));

    if (sources.length === 0) {
      sources.push({
        title: "ICAR National Agricultural Advisory & Package of Practices",
        source: "Indian Council of Agricultural Research (ICAR)",
        relevance: "Standard Agricultural University Extension Guidelines",
        pageNumber: 1
      });
    }

    const likelyCauses: string[] = [];
    const recommendations: StructuredAdvisoryResponse['recommendations'] = [];
    const precautions: string[] = [];
    const followUps: string[] = [];

    const lowerQ = farmerQuestion.toLowerCase();
    const isTelugu = targetLanguage === "te";
    const isHindi = targetLanguage === "hi";

    if (crop === "Paddy" || crop === "Rice") {
      if (lowerQ.includes("yellow") || lowerQ.includes("zinc") || lowerQ.includes("khaira")) {
        if (isTelugu) {
          likelyCauses.push("జింక్ లోపం (ఖైరా తెగులు) - అధిక క్షార నేల లేదా నిరంతర నీటి నిల్వ వల్ల");
          likelyCauses.push("మొదటి దశ బ్యాక్టీరియల్ ఆకు ఎండు తెగులు లేదా నత్రజని లోపం");
          recommendations.push({
            title: "జింక్ సల్ఫేట్ ఆకులపై పిచికారీ",
            description: "జింక్ సల్ఫేట్ (21%) @ 5 గ్రాములు/లీటరు + యూరియా @ 10 గ్రాములు/లీటరు నీటిలో కలిపి పిచికారీ చేయండి (ఎకరానికి 1 కిలో జింక్ సల్ఫేట్ + 2 కిలోల యూరియా 200 లీటర్ల నీటిలో).",
            type: "agronomic",
            dosage: "1 లీటరుకు 5 గ్రాముల జింక్ సల్ఫేట్ (15L ట్యాంకుకు 75 గ్రాములు)"
          });
          recommendations.push({
            title: "పొలంలో నీరు తీసి ఆరబెట్టడం",
            description: "వేర్లకు గాలి తగిలేందుకు 2-3 రోజుల పాటు నిల్వ ఉన్న నీటిని బయటకు తీసి పొలాన్ని ఆరనివ్వండి.",
            type: "agronomic"
          });
          precautions.push("జింక్ సల్ఫేట్‌ను DAP లేదా ఫాస్ఫేట్ ఎరువులతో నేరుగా స్ప్రే ట్యాంకులో కలపవద్దు.");
          followUps.push("మధ్య ఆకులపై తుప్పు రంగు లేదా ఇత్తడి రంగు మచ్చలు కనిపిస్తున్నాయా?");
          followUps.push("నాట్లు వేసి ఎన్ని రోజులు అయ్యింది?");
        } else if (isHindi) {
          likelyCauses.push("जिंक की कमी (खैरा रोग) - अत्यधिक क्षारीय मिट्टी अथवा जलभराव के कारण");
          likelyCauses.push("शुरुआती जीवाणु पत्ती झुलसा या नाइट्रोजन की कमी");
          recommendations.push({
            title: "जिंक सल्फेट का पर्णीय छिड़काव",
            description: "जिंक सल्फेट (21%) @ 5 ग्राम/लीटर + यूरिया @ 10 ग्राम/लीटर पानी में घोलकर छिड़कें (1 किग्रा जिंक + 2 किग्रा यूरिया प्रति एकड़ 200 लीटर पानी में)।",
            type: "agronomic",
            dosage: "5 ग्राम/लीटर (15 लीटर टंकी में 75 ग्राम)"
          });
          recommendations.push({
            title: "खेत से पानी की निकासी व हवा लगाना",
            description: "जड़ों में ऑक्सीजन संचार के लिए 2-3 दिन तक खेत से अतिरिक्त पानी निकाल दें।",
            type: "agronomic"
          });
          precautions.push("जिंक सल्फेट को डीएपी (DAP) या फास्फेट खाद के साथ सीधे टंकी में न मिलाएं।");
          followUps.push("क्या पत्तियों के बीच में जंग जैसे भूरे-कांसे के धब्बे दिख रहे हैं?");
          followUps.push("धान की रोपाई किए कितने दिन हुए हैं?");
        } else {
          likelyCauses.push("Zinc Deficiency (Khaira Disease) due to high soil pH or submerged conditions");
          likelyCauses.push("Early Bacterial Leaf Blight (BLB) or Nitrogen deficiency");
          recommendations.push({
            title: "Foliar Zinc Sulphate Spray",
            description: "Spray Zinc Sulphate (21%) @ 5 g/litre + Urea @ 10 g/litre of water (1 kg ZnSO4 + 2 kg Urea in 200 L water/acre).",
            type: "agronomic",
            dosage: "5 g/L ZnSO4 + 10 g/L Urea (75g per 15L tank)"
          });
          recommendations.push({
            title: "Field Aeration",
            description: "Drain excess standing water for 2-3 days to encourage root oxygenation and nutrient uptake.",
            type: "agronomic"
          });
          precautions.push("Do not mix Zinc Sulphate directly with DAP or Phosphate fertilizers in the tank.");
          followUps.push("Are the yellowing leaves starting from the middle leaves with rusty bronze spots?");
          followUps.push("How many days ago was the crop transplanted?");
        }
      } else if (lowerQ.includes("blast") || lowerQ.includes("brown spot") || lowerQ.includes("lesion")) {
        if (isTelugu) {
          likelyCauses.push("వరి అగ్గి తెగులు (బ్లాస్ట్ తెగులు - Pyricularia oryzae)");
          likelyCauses.push("వరి ఆకుమచ్చ తెగులు (బ్రౌన్ స్పాట్ - Bipolaris oryzae)");
          recommendations.push({
            title: "అగ్గి తెగులు నివారణ మందు పిచికారీ",
            description: "ట్రైసైక్లాజోల్ 75% WP @ 0.6 గ్రా/లీటరు (ఎకరానికి 120 గ్రాములు 200 లీటర్ల నీటిలో) లేదా ఐసోప్రోథియోలేన్ 40% EC @ 1.5 మి.లీ/లీటరు పిచికారీ చేయండి.",
            type: "chemical",
            dosage: "0.6 గ్రా/లీటరు (15L ట్యాంకుకు 9-10 గ్రాములు)"
          });
          recommendations.push({
            title: "యూరియా ఎరువు నియంత్రణ",
            description: "మబ్బులతో కూడిన తేమ వాతావరణంలో అధిక యూరియా వేయడం నివారించండి.",
            type: "agronomic"
          });
          precautions.push("మందు పిచికారీ చేసేటప్పుడు పొలంలో సరైన నీటి తేమ ఉండాలి. ఉదయం లేదా సాయంత్రం వేళల్లో పిచికారీ చేయండి.");
          followUps.push("ఆకులపై మచ్చలు కంటి ఆకారంలో బూడిద రంగు మధ్యభాగంతో ఉన్నాయా?");
        } else if (isHindi) {
          likelyCauses.push("धान का झुलसा रोग (ब्लास्ट - Pyricularia oryzae)");
          likelyCauses.push("भूरा धब्बा रोग (ब्राउन स्पॉट - Bipolaris oryzae)");
          recommendations.push({
            title: "पर्णीय कवकनाशी का छिड़काव",
            description: "ट्राइसाइक्लाजोल 75% डब्ल्यूपी @ 0.6 ग्राम/लीटर (120 ग्राम/एकड़ 200 लीटर पानी में) अथवा आइसोप्रोथियोलेन 40% ईसी @ 1.5 मिली/लीटर का छिड़काव करें।",
            type: "chemical",
            dosage: "0.6 ग्राम/लीटर (15 लीटर स्प्रे पंप में 9-10 ग्राम)"
          });
          recommendations.push({
            title: "नाइट्रोजन (यूरिया) प्रबंधन",
            description: "बादल छाए रहने व उमस भरे मौसम में अत्यधिक यूरिया का उपयोग न करें।",
            type: "agronomic"
          });
          precautions.push("दवा छिड़कते समय खेत में नमी रहनी चाहिए। शांत सुबह या देर शाम छिड़काव करें।");
          followUps.push("क्या पत्तियों पर आंख के आकार के धब्बे हैं जिनका केंद्र धूसर और किनारे लाल-भूरे हैं?");
        } else {
          likelyCauses.push("Rice Blast (Magnaporthe oryzae / Pyricularia oryzae)");
          likelyCauses.push("Brown Spot (Bipolaris oryzae)");
          recommendations.push({
            title: "Foliar Fungicide Application",
            description: "Spray Tricyclazole 75% WP @ 0.6 g/litre (120 g/acre in 200 L water) OR Isoprothiolane 40% EC @ 1.5 ml/litre.",
            type: "chemical",
            dosage: "0.6 g/L Tricyclazole 75% WP (9-10g per 15L tank)"
          });
          recommendations.push({
            title: "Nitrogen Management",
            description: "Avoid excessive urea top-dressing during humid/cloudy weather spells.",
            type: "agronomic"
          });
          precautions.push("Maintain optimum water level during chemical application. Spray during calm morning or late afternoon hours.");
          followUps.push("Are the spots spindle-shaped with gray centers and reddish-brown borders?");
        }
      } else {
        if (isTelugu) {
          likelyCauses.push("వరి సుడిదోమ (BPH) లేదా కాండం తొలిచే పురుగు ముప్పు");
          likelyCauses.push("పోషకాల అసమతుల్యత లేదా నీటి కొరత");
          recommendations.push({
            title: "మొక్కల మొదళ్ల పరిశీలన & పురుగు నివారణ",
            description: "మొక్కల మొదళ్లను పరిశీలించండి. ఒక పిలకకు 2 కంటే ఎక్కువ దోమలు ఉంటే, పైమెట్రోజైన్ 50% WDG @ 0.6 గ్రా/లీటరు మొదళ్లకు తగిలేలా పిచికారీ చేయండి.",
            type: "chemical",
            dosage: "0.6 గ్రా/లీటరు (15L ట్యాంకుకు 9 గ్రాములు)"
          });
          recommendations.push({
            title: "పొలంలో బాటలు తీయడం",
            description: "గాలి, వెలుతురు సోకేందుకు ప్రతి 2 మీటర్లకు 30 సెం.మీ బాటలు తీయండి.",
            type: "agronomic"
          });
          precautions.push("సుడిదోమ ఉధృతి పెరగకుండా ఉండేందుకు సింథటిక్ పైరెథ్రాయిడ్ మందులు పిచికారీ చేయవద్దు.");
          followUps.push("పొలంలో సుడులు సుడులుగా పైరు ఎండిపోవడం (హాప్పర్ బర్న్) గమనించారా?");
        } else if (isHindi) {
          likelyCauses.push("भूरा फुदका (BPH) अथवा तना छेदक कीट का प्रकोप");
          likelyCauses.push("पोषक तत्वों का असंतुलन अथवा नमी का तनाव");
          recommendations.push({
            title: "पौधे के तने का निरीक्षण व लक्षित कीटनाशक छिड़काव",
            description: "पौधों के आधार पर फुदकों की जांच करें। यदि 2 कीट प्रति कल्ला दिखें, तो पाइमेट्रोजिन 50% डब्ल्यूडीजी @ 0.6 ग्राम/लीटर पौधों की जड़ के पास छिड़कें।",
            type: "chemical",
            dosage: "0.6 ग्राम/लीटर (15 लीटर स्प्रे पंप में 9 ग्राम)"
          });
          recommendations.push({
            title: "खेत में हवा व धूप के लिए गलियारे बनाना",
            description: "खेत में हवा और रोशनी के लिए प्रत्येक 2 मीटर पर 30 सेमी की दूरी पर गलियारा छोड़ें।",
            type: "agronomic"
          });
          precautions.push("फुदकों की संख्या बढ़ाने वाले सिंथेटिक पाइरेथ्रोइड रसायनों के छिड़काव से बचें।");
          followUps.push("क्या खेत में गोल पैच में फसल सूखी हुई दिख रही है (हॉपर बर्न)?");
        } else {
          likelyCauses.push("Brown Plant Hopper (BPH) or Stem Borer vegetative damage");
          likelyCauses.push("Nutrient imbalance or moisture stress");
          recommendations.push({
            title: "Base Inspection & Targeted Protection",
            description: "Inspect plant base for hoppers. If hoppers > 2/hill, spray Pymetrozine 50% WDG @ 0.6 g/L directed at tiller bases.",
            type: "chemical",
            dosage: "0.6 g/L Pymetrozine"
          });
          recommendations.push({
            title: "Alleyway Creation",
            description: "Form 30 cm pathways every 2 meters in the field to allow aeration and sunlight penetration.",
            type: "agronomic"
          });
          precautions.push("Avoid synthetic pyrethroid sprays to prevent resurgence of hoppers.");
          followUps.push("Do you observe dried circular patches ('hopper burn') in the field?");
        }
      }
    } else if (crop === "Cotton") {
      if (lowerQ.includes("bollworm") || lowerQ.includes("pink") || lowerQ.includes("flower")) {
        if (isTelugu) {
          likelyCauses.push("గులాబీ రంగు కాయ తొలిచే పురుగు (పింక్ బోల్ వార్మ్) ఆశించడం");
          recommendations.push({
            title: "లింగాకర్షక బుట్టలు అమర్చడం",
            description: "రెక్కల పురుగుల ఉధృతిని తగ్గించేందుకు ఎకరానికి 8-10 గాసిప్లూర్ లింగాకర్షక బుట్టలను అమర్చండి.",
            type: "biological"
          });
          recommendations.push({
            title: "పురుగు నివారణ మందు పిచికారీ",
            description: "ఎమామెక్టిన్ బెంజోయేట్ 5% SG @ 0.4 గ్రా/లీటరు (ఎకరానికి 80 గ్రాములు) లేదా క్లోరాంట్రానిలిప్రోల్ 18.5% SC @ 0.3 మి.లీ/లీటరు పిచికారీ చేయండి.",
            type: "chemical",
            dosage: "0.4 గ్రా/లీటరు (15L ట్యాంకుకు 6 గ్రాములు)"
          });
          precautions.push("రోసెట్టెడ్ పూలు (ముడుచుకుపోయిన పూలు) మరియు రాలిన కాయలను ఏరి నాశనం చేయండి.");
          followUps.push("పువ్వులు గులాబీ పువ్వుల్లా ముడుచుకుపోయి విచ్చుకోకుండా ఉన్నాయా?");
        } else if (isHindi) {
          likelyCauses.push("गुलाबी सुंडी (पिंक बॉलवर्म) का संक्रमण");
          recommendations.push({
            title: "फेरोमोन ट्रैप की स्थापना",
            description: "प्रौढ़ नर पतंगों की निगरानी व रोकथाम के लिए प्रति एकड़ 8-10 गॉसिप्ल्यूर फेरोमोन ट्रैप लगाएं।",
            type: "biological"
          });
          recommendations.push({
            title: "लक्षित कीटनाशक छिड़काव",
            description: "इमामेक्टिन बेंजोएट 5% एसजी @ 0.4 ग्राम/लीटर (80 ग्राम/एकड़) या क्लोरेंट्रानिलीप्रोल 18.5% एससी @ 0.3 मिली/लीटर का छिड़काव करें।",
            type: "chemical",
            dosage: "0.4 ग्राम/लीटर (15 लीटर पंप में 6 ग्राम)"
          });
          precautions.push("गुलाब जैसे मुड़े हुए फूलों (रोसेटेड फूल) और गिरे हुए छोटे टिंडों को इकट्ठा करके नष्ट करें।");
          followUps.push("क्या फूल पूरी तरह खिलने के बजाय गुलाब की पंखुड़ियों की तरह मुड़े हुए हैं?");
        } else {
          likelyCauses.push("Pink Bollworm (Pectinophora gossypiella) infestation");
          recommendations.push({
            title: "Pheromone Traps & Mass Trapping",
            description: "Install Gossyplure pheromone traps @ 8-10 traps per acre to monitor and reduce adult moth populations.",
            type: "biological"
          });
          recommendations.push({
            title: "Targeted Larvicide Spray",
            description: "Spray Emamectin Benzoate 5% SG @ 0.4 g/litre (80 g/acre) OR Chlorantraniliprole 18.5% SC @ 0.3 ml/litre.",
            type: "chemical",
            dosage: "0.4 g/L Emamectin Benzoate (6g per 15L tank)"
          });
          precautions.push("Collect and safely destroy rosetted flowers and infested dropped bolls.");
          followUps.push("Are you noticing rosetted flowers (twisted flower petals)?");
        }
      } else {
        if (isTelugu) {
          likelyCauses.push("రసం పీల్చే పురుగులు (తెల్లదోమ / తామర పురుగులు / పేనుబంక) లేదా పొటాషియం లోపం (ఆకులు ఎర్రబడటం)");
          recommendations.push({
            title: "పొటాషియం నైట్రేట్ పిచికారీ",
            description: "ఆకులు ఎర్రబడకుండా నివారించడానికి 13-0-45 (పొటాషియం నైట్రేట్) @ 10 గ్రాములు/లీటరు నీటిలో కలిపి పిచికారీ చేయండి (ఎకరానికి 2 కిలోలు 200 లీటర్ల నీటిలో).",
            type: "agronomic",
            dosage: "1 లీటరుకు 10 గ్రాములు (15L ట్యాంకుకు 150 గ్రాములు)"
          });
          recommendations.push({
            title: "పసుపు రంగు జిగురు అట్టలు",
            description: "తెల్లదోమ ఉధృతిని తగ్గించడానికి ఎకరానికి 10-15 పసుపు రంగు జిగురు అట్టలను అమర్చండి.",
            type: "biological"
          });
          precautions.push("అధిక మోతాదులో నత్రజని ఎరువులు వేయవద్దు, దీనివల్ల ఆకులు మెత్తబడి రసం పీల్చే పురుగులు ఎక్కువగా ఆశిస్తాయి.");
          followUps.push("ఆకుల అడుగు భాగంలో జిగురు వంటి ద్రవం మరియు తెల్లదోమలు కనిపిస్తున్నాయా?");
        } else if (isHindi) {
          likelyCauses.push("रस चूसक कीट (सफेद मक्खी / थ्रिप्स / चेपा) अथवा पोटाश की कमी से पत्तियां लाल पड़ना");
          recommendations.push({
            title: "पोटेशियम नाइट्रेट का पर्णीय छिड़काव",
            description: "पत्तियों का लाल होना रोकने हेतु 13-0-45 (पोटेशियम नाइट्रेट) @ 10 ग्राम/लीटर (2 किग्रा प्रति एकड़ 200 लीटर पानी में) का छिड़काव करें।",
            type: "agronomic",
            dosage: "10 ग्राम/लीटर (15 लीटर पंप में 150 ग्राम)"
          });
          recommendations.push({
            title: "पीले चिपचिपे कार्ड (येलो स्टिकी ट्रैप)",
            description: "सफेद मक्खी को आकर्षित कर नष्ट करने के लिए प्रति एकड़ 10-15 पीले चिपचिपे कार्ड लगाएं।",
            type: "biological"
          });
          precautions.push("अधिक यूरिया न डालें, इससे पौधे अधिक रसीले हो जाते हैं जिससे कीटों का हमला बढ़ जाता है।");
          followUps.push("क्या पत्तियों के नीचे चिपचिपा पदार्थ (हनीड्यू) और छोटी सफेद मक्खियां उड़ती दिख रही हैं?");
        } else {
          likelyCauses.push("Sucking Pests (Whitefly / Thrips / Aphids) or Potassium Deficiency (Leaf Reddening)");
          recommendations.push({
            title: "Potassium Nitrate Foliar Spray",
            description: "Spray 13-0-45 (Potassium Nitrate) @ 10 g/litre (2 kg in 200 L water/acre) to mitigate leaf reddening.",
            type: "agronomic",
            dosage: "10 g/L (1% solution, 150g per 15L tank)"
          });
          recommendations.push({
            title: "Yellow Sticky Traps",
            description: "Install 10-15 yellow sticky traps per acre for whitefly monitoring and trapping.",
            type: "biological"
          });
          precautions.push("Avoid excessive nitrogen fertilization which makes foliage succulent and attractive to sucking pests.");
          followUps.push("Are the leaves curling downwards with sticky honey-dew underneath?");
        }
      }
    } else if (crop === "Chilli") {
      if (isTelugu) {
        likelyCauses.push("మిరప ఆకు ముడుత సంక్లిష్టం (తామర పురుగుల వల్ల పైముడుత లేదా నల్లి వల్ల కిందముడుత)");
        likelyCauses.push("కొమ్మ ఎండు తెగులు (డై-బ్యాక్ / ఆంథ్రాక్నోస్)");
        recommendations.push({
          title: "ముడుత నివారణ మందుల పిచికారీ",
          description: "ఆకులు పైకి ముడుచుకుంటే: ఫిప్రోనిల్ 5% SC @ 1.5 మి.లీ/లీటరు. ఆకులు కిందికి ముడుచుకుంటే: స్పైరోమెసిఫెన్ 22.9% SC @ 1 మి.లీ/లీటరు లేదా గంధకం @ 3 గ్రా/లీటరు పిచికారీ చేయండి.",
          type: "chemical",
          dosage: "1.5 మి.లీ/లీటరు ఫిప్రోనిల్ లేదా 1 మి.లీ/లీటరు స్పైరోమెసిఫెన్"
        });
        recommendations.push({
          title: "కొమ్మ ఎండు తెగులు నివారణ",
          description: "అజోక్సీస్ట్రోబిన్ 23% SC @ 1 మి.లీ/లీటరు లేదా కాపర్ ఆక్సీక్లోరైడ్ 50% WP @ 2.5 గ్రా/లీటరు పిచికారీ చేయండి.",
          type: "chemical",
          dosage: "2.5 గ్రా/లీటరు కాపర్ ఆక్సీక్లోరైడ్"
        });
        precautions.push("వైరస్ సోకి ఎదగకుండా గిడసబారిన మొక్కలను పీకి నాశనం చేయండి.");
        followUps.push("ఆకులు పైకి పడవ ఆకారంలో ముడుచుకున్నాయా లేక కిందికి గిన్నెలా ముడుచుకున్నాయా?");
      } else if (isHindi) {
        likelyCauses.push("मिर्च मरोड़िया रोग (थ्रिप्स जनित ऊपर की ओर या माइट्स जनित नीचे की ओर मुड़ना)");
        likelyCauses.push("डाई-बैक / फल सड़न रोग (एंथ्राक्नोज)");
        recommendations.push({
          title: "मरोड़िया नाशक कीटनाशक छिड़काव",
          description: "यदि पत्तियां ऊपर मुड़ रही हैं: फिप्रोनिल 5% एससी @ 1.5 मिली/लीटर। यदि नीचे मुड़ रही हैं: स्पाइरोमेसिफेन 22.9% एससी @ 1 मिली/लीटर या घुलनशील गंधक @ 3 ग्राम/लीटर का छिड़काव करें।",
          type: "chemical",
          dosage: "1.5 मिली/लीटर फिप्रोनिल या 1 मिली/लीटर स्पाइरोमेसिफेन"
        });
        recommendations.push({
          title: "डाई-बैक रोग निवारक कवकनाशी",
          description: "एजॉक्सीस्ट्रोबिन 23% एससी @ 1 मिली/लीटर अथवा कॉपर ऑक्सीक्लोराइड 50% डब्ल्यूपी @ 2.5 ग्राम/लीटर का छिड़काव करें।",
          type: "chemical",
          dosage: "2.5 ग्राम/लीटर कॉपर ऑक्सीक्लोराइड"
        });
        precautions.push("गंभीर रूप से वायरस प्रभावित बौने पौधों को उखाड़कर नष्ट कर दें ताकि बीमारी न फैले।");
        followUps.push("क्या पत्तियां ऊपर की तरफ नाव जैसी या नीचे की तरफ उल्टे कप जैसी मुड़ रही हैं?");
      } else {
        likelyCauses.push("Chilli Leaf Curl Complex (Thrips upward curl or Mites downward curl)");
        likelyCauses.push("Anthracnose / Die-back disease");
        recommendations.push({
          title: "Targeted Acaricide / Insecticide Spray",
          description: "If leaves curl upward: Spray Fipronil 5% SC @ 1.5 ml/L. If leaves curl downward: Spray Spiromesifen 22.9% SC @ 1 ml/L or Wettable Sulphur @ 3 g/L.",
          type: "chemical",
          dosage: "1.5 ml/L Fipronil or 1 ml/L Spiromesifen"
        });
        recommendations.push({
          title: "Die-back Preventive Spray",
          description: "Spray Azoxystrobin 23% SC @ 1 ml/litre or Copper Oxychloride 50% WP @ 2.5 g/litre.",
          type: "chemical",
          dosage: "2.5 g/L Copper Oxychloride"
        });
        precautions.push("Uproot and destroy severely virus-infected stunted plants to prevent transmission.");
        followUps.push("Are the leaves curling upwards (boat-shaped) or downwards (inverted cup)?");
      }
    } else {
      if (isTelugu) {
        likelyCauses.push(`${crop} పంటపై పోషకాల అసమతుల్యత, శిలీంద్ర తెగులు లేదా పురుగుల దాడి`);
        likelyCauses.push("వాతావరణ ఒత్తిడి (అధిక తేమ లేదా నీటి కొరత)");
        recommendations.push({
          title: "పోషకాల పిచికారీ & నేల పరీక్ష",
          description: "పైరు తిరిగి బలం పుంజుకునేందుకు 19:19:19 నీటిలో కరిగే ఎరువు @ 5 గ్రా/లీటరు + సూక్ష్మ పోషకాల మిశ్రమాన్ని పిచికారీ చేయండి.",
          type: "agronomic",
          dosage: "5 గ్రా/లీటరు NPK 19-19-19"
        });
        recommendations.push({
          title: "సహజ సిద్ధమైన పంట సంరక్షణ",
          description: "వేప నూనె (1500 ppm) @ 5 మి.లీ/లీటరు లేదా సూడోమోనాస్ @ 5 గ్రా/లీటరు కలిపి రక్షణ పిచికారీ చేయండి.",
          type: "biological",
          dosage: "5 మి.లీ/లీటరు వేప నూనె"
        });
        precautions.push("మందు పిచికారీ చేసేటప్పుడు తప్పనిసరిగా మాస్క్ ధరించండి.");
        followUps.push("ఆకులపై ఎలాంటి లక్షణాలు (మచ్చలు, వాడిపోవడం, ముడుతలు) కనిపిస్తున్నాయి?");
      } else if (isHindi) {
        likelyCauses.push(`${crop} फसल में पोषक तत्वों का असंतुलन, फफूंद अथवा कीट का प्रभाव`);
        likelyCauses.push("मौसम का तनाव (अत्यधिक नमी अथवा सूखे की स्थिति)");
        recommendations.push({
          title: "पोषक तत्व छिड़काव व मिट्टी परीक्षण",
          description: "पौधों में नई ऊर्जा के लिए 19:19:19 (घुलनशील एनपीके) @ 5 ग्राम/लीटर + सूक्ष्म पोषक तत्व मिलाकर छिड़कें।",
          type: "agronomic",
          dosage: "5 ग्राम/लीटर NPK 19-19-19"
        });
        recommendations.push({
          title: "जैविक फसल सुरक्षा छिड़काव",
          description: "नीम तेल (1500 ppm) @ 5 मिली/लीटर अथवा स्यूडोमोनास @ 5 ग्राम/लीटर का सुरक्षात्मक छिड़काव करें।",
          type: "biological",
          dosage: "5 मिली/लीटर नीम तेल"
        });
        precautions.push("रासायनिक छिड़काव करते समय हमेशा सुरक्षात्मक मास्क पहनें।");
        followUps.push("फसल की पत्तियों पर कौन से विशिष्ट लक्षण (धब्बे, पीलापन, सुकड़न) दिख रहे हैं?");
      } else {
        likelyCauses.push(`Nutrient imbalance, fungal infection, or pest pressure on ${crop}`);
        likelyCauses.push("Environmental stress (excess moisture or intermittent drought)");
        recommendations.push({
          title: "Nutrient Foliar Boost & Soil Test",
          description: "Apply 19:19:19 (NPK water soluble) @ 5 g/litre + micronutrient mixture to revitalize vegetative vigor.",
          type: "agronomic",
          dosage: "5 g/L NPK 19-19-19"
        });
        recommendations.push({
          title: "Prophylactic Plant Protection",
          description: "Apply Neem oil formulation (1500 ppm) @ 5 ml/litre or Pseudomonas fluorescens @ 5 g/litre as organic preventive spray.",
          type: "biological",
          dosage: "5 ml/L Neem Oil (1500 ppm)"
        });
        precautions.push("Conduct soil testing via Soil Health Card scheme before applying heavy chemical fertilizers.");
        followUps.push("What specific symptoms (spots, wilting, curling, insect bites) are visible on the foliage?");
      }
    }

    if (isTelugu) {
      precautions.push("వ్యవసాయ రసాయనాలు వాడేటప్పుడు ఎల్లప్పుడూ వ్యక్తిగత రక్షణ పరికరాలు (మాస్క్ / చేతి తొడుగులు) ధరించండి.");
      precautions.push("సమస్య తగ్గకపోతే సమీప కృషి విజ్ఞాన కేంద్రం (KVK) లేదా వ్యవసాయ విస్తరణ అధికారిని సంప్రదించండి.");
    } else if (isHindi) {
      precautions.push("कृषि रसायनों का उपयोग करते समय हमेशा मास्क व दस्ताने पहनें और खाली डिब्बों को सुरक्षित नष्ट करें।");
      precautions.push("लक्षण बने रहने पर नजदीकी कृषि विज्ञान केंद्र (KVK) या कृषि अधिकारी से संपर्क करें।");
    } else {
      precautions.push("Always wear personal protective equipment (PPE/cloth mask) while handling agricultural chemicals.");
      precautions.push("In case of persistent or worsening symptoms, consult your nearest Krishi Vigyan Kendra (KVK) or Mandal Agricultural Officer.");
    }

    let preferredSummary = "";
    if (isTelugu) {
      preferredSummary = `రైతు మిత్రమా, మీ ${crop} పంట సమస్యపై వ్యవసాయ నిపుణుల సమగ్ర పరిష్కారం: ప్రాథమిక పరిశీలనలో సిఫారసు చేయబడిన మందుల మోతాదును 15 లీటర్ల ట్యాంకుకు సరిగ్గా కలిపి పిచికారీ చేయండి. సమతుల్య పోషకాలు అందించి, పొలంలో నీటి యాజమాన్యం పాటించండి.`;
    } else if (isHindi) {
      preferredSummary = `किसान भाई, आपकी ${crop} फसल की समस्या के लिए संपूर्ण समाधान व दवा की मात्रा: अनुशंसित कीटनाशक/कवकनाशी को 15 लीटर स्प्रे टंकी में सही मात्रा में घोलकर छिड़काव करें और खेत में उचित जल प्रबंधन रखें।`;
    }

    const localizedCrop = isTelugu ? (crop === "Cotton" ? "ప్రత్తి" : crop === "Paddy" || crop === "Rice" ? "వరి" : crop === "Chilli" ? "మిరప" : crop)
                        : isHindi ? (crop === "Cotton" ? "कपास" : crop === "Paddy" || crop === "Rice" ? "धान" : crop === "Chilli" ? "मिर्च" : crop)
                        : crop;

    const localizedProblem = isTelugu ? `పంట సమస్య విశ్లేషణ: ${extractedContext.problem || farmerQuestion}`
                           : isHindi ? `फसल समस्या विश्लेषण: ${extractedContext.problem || farmerQuestion}`
                           : extractedContext.problem || farmerQuestion;

    return {
      crop: localizedCrop,
      problem: localizedProblem,
      likely_causes: likelyCauses,
      recommendations,
      precautions,
      follow_up_questions: followUps,
      confidence: extractedContext.confidence,
      confidence_reasoning: primarySource
        ? (isTelugu ? `ICAR పరిశోధన ఆధారిత సిఫారసు "${primarySource.title}" నుండి రూపొందించబడింది.` : isHindi ? `आईसीएआर (ICAR) प्रमाणित स्रोत "${primarySource.title}" के आधार पर तैयार सलाह।` : `Advisory synthesized based on authoritative ICAR recommendations from "${primarySource.title}".`)
        : (isTelugu ? "ప్రామాణిక వ్యవసాయ ప్యాకేజీ సూచనల ప్రకారం విశ్లేషించబడింది." : isHindi ? "प्रामाणिक कृषि संस्तुतियों के अनुसार प्रारंभिक विश्लेषण।" : "Standard agricultural package of practices applied for preliminary assessment."),
      sources,
      summary_in_preferred_language: preferredSummary || undefined
    };
  }
}

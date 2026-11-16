import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Sprout, 
  Search, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  History, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Flame, 
  Compass, 
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext.js";
import { useLanguage } from "../context/LanguageContext.js";
import { api } from "../services/api.js";
import { QueryRecord, LocationInfo } from "../types/index.js";
import { WeatherCard } from "./WeatherCard.js";
import { QueryPipelineVisualizer } from "./QueryPipelineVisualizer.js";
import { AdvisoryCard } from "./AdvisoryCard.js";

const CROPS = [
  "All",
  "Paddy",
  "Cotton",
  "Maize",
  "Groundnut",
  "Chilli",
  "Tomato",
  "Banana",
  "Mango",
  "General"
];

interface CropPrompt {
  id: string;
  icon: string;
  en: string;
  te: string;
  hi: string;
  shortLabel: { en: string; te: string; hi: string };
}

const EASY_SAMPLE_QUESTIONS_BY_CROP: Record<string, CropPrompt[]> = {
  "Paddy": [
    {
      id: "paddy-blast",
      icon: "🌾",
      shortLabel: { en: "Yellow Leaves & Spots", te: "పసుపు ఆకులు & మచ్చలు", hi: "पीली पत्तियां व धब्बे" },
      en: "My paddy leaves are turning yellow with brown boat-shaped spots and drying at tips.",
      te: "నా వరి పంట ఆకులు పసుపు రంగులోకి మారి, మధ్యలో గోధుమ రంగు మచ్చలు వచ్చి ఎండిపోతున్నాయి.",
      hi: "धान की पत्तियां पीली पड़ रही हैं और उन पर भूरे रंग के धब्बे दिख रहे हैं।"
    },
    {
      id: "paddy-bph",
      icon: "🦗",
      shortLabel: { en: "Round Dry Patches (Hopper)", te: "సుడిదోమ గుండ్రని మచ్చలు", hi: "सफेद/भूरे फुदके कीट" },
      en: "Round dried patches looking like burnt spots are appearing in the center of my paddy field.",
      te: "వరి చేను మధ్యలో గుండ్రంగా ఎండిపోయినట్లు మాడిపోయిన మచ్చలు (సుడిదోమ) కనిపిస్తున్నాయి.",
      hi: "धान के खेत में बीच-बीच में गोल जले हुए जैसे सूखे धब्बे (माहो/फुदका) दिखाई दे रहे हैं।"
    },
    {
      id: "paddy-zinc",
      icon: "🧪",
      shortLabel: { en: "Rusty Leaves & Slow Growth", te: "తుప్పు రంగు ఆకులు", hi: "जंग जैसे धब्बे (जिंक कमी)" },
      en: "Young paddy seedlings look rusty brown, short and not growing after transplanting.",
      te: "వరి నాటిన తర్వాత మొక్కలు పెరగకుండా, ఆకులపై తుప్పు రంగు మచ్చలు వస్తున్నాయి.",
      hi: "धान रोपाई के बाद पौधे छोटे हैं और पत्तियों पर जंग जैसा कत्थई रंग दिख रहा है।"
    }
  ],
  "Cotton": [
    {
      id: "cotton-bollworm",
      icon: "🐛",
      shortLabel: { en: "Worm in Flower & Bolls", te: "గులాబీ రంగు కాయ పురుగు", hi: "गुलाबी सुंडी/कीड़ा" },
      en: "Cotton flowers are closed like small roses and green bolls have small worm entry holes.",
      te: "పత్తి పూలు రోజా పువ్వులా ముడుచుకుపోయి, కాయలకు చిన్న రంధ్రాలు పడుతున్నాయి.",
      hi: "कपास के फूल गुलाब जैसे मुड़ रहे हैं और गूलर/टिंडे में कीड़े के छेद दिख रहे हैं।"
    },
    {
      id: "cotton-reddening",
      icon: "🍂",
      shortLabel: { en: "Leaves Turning Red", te: "పత్తి ఆకులు ఎర్రబడటం", hi: "पत्तियों का लाल होना" },
      en: "Cotton leaves are turning dark red between veins during boll formation stage.",
      te: "పత్తి కాయ దశలో ఆకులు ఈనెల మధ్య ఎర్ర రంగులోకి మారుతున్నాయి.",
      hi: "कपास की पत्तियां नसों के बीच से लाल या बैंगनी रंग की हो रही हैं।"
    },
    {
      id: "cotton-whitefly",
      icon: "🪰",
      shortLabel: { en: "Sticky White Flies", te: "తెల్లదోమ & ఆకు ముడత", hi: "सफेद मक्खी व चिपचिपापन" },
      en: "Tiny white flies are flying when shaking plants, and leaves are sticky and curling down.",
      te: "చెట్లను కదిలిస్తే తెల్లటి పురుగులు ఎగురుతున్నాయి, ఆకులు జిగురుగా మారి కిందికి ముడుచుకుంటున్నాయి.",
      hi: "पौधे हिलाने पर छोटी सफेद मक्खी उड़ती है और पत्तियां चिपचिपी होकर मुड़ रही हैं।"
    }
  ],
  "Chilli": [
    {
      id: "chilli-thrips",
      icon: "🌶️",
      shortLabel: { en: "Leaves Curling Up (Boat)", te: "పైముడత (దోమ)", hi: "ऊपर की ओर पत्ती मुड़ना" },
      en: "Chilli leaf tips are curling upwards like a boat and plants look small and pale.",
      te: "మిరప ఆకుల అంచులు పైకి దోనెలా ముడుచుకుపోయి మొక్క ఎదుగుదల ఆగిపోయింది.",
      hi: "मिर्च की पत्तियां नाव की तरह ऊपर की तरफ मुड़ रही हैं और पौधे बढ़ नहीं रहे।"
    },
    {
      id: "chilli-anthracnose",
      icon: "⚫",
      shortLabel: { en: "Black Spots on Ripe Fruit", te: "కాయ కుళ్ళు & నల్ల మచ్చలు", hi: "काले गोल धब्बे (सड़न)" },
      en: "Branch tips are drying and ripe red chillies have circular sunken black rot spots.",
      te: "కొమ్మల చివర్లు ఎండిపోతున్నాయి, పండిన మిరపకాయలపై గుండ్రని నల్లటి కుళ్ళు మచ్చలు ఉన్నాయి.",
      hi: "मिर्च की टहनियां ऊपर से सूख रही हैं और पकी मिर्च पर काले गोल धब्बे सड़ रहे हैं।"
    },
    {
      id: "chilli-mites",
      icon: "🌱",
      shortLabel: { en: "Leaves Curling Down", te: "కింది ముడత (నల్లి)", hi: "नीचे की ओर पत्ती मुड़ना" },
      en: "Chilli leaves are thick, dark green and curling downwards like an inverted cup.",
      te: "మిరప ఆకులు ముదురు ఆకుపచ్చగా మారి, బొప్పాయి ఆకులా కిందికి ముడుచుకుపోతున్నాయి.",
      hi: "मिर्च की पत्तियां नीचे की तरफ मुड़ रही हैं और मोटी व उल्टी कटोरी जैसी दिख रही हैं।"
    }
  ],
  "Maize": [
    {
      id: "maize-faw",
      icon: "🌽",
      shortLabel: { en: "Worm in Central Cone", te: "కత్తెర పురుగు", hi: "सैनिक कीट / फॉल आर्मीवर्म" },
      en: "Caterpillar eating central leaf cone with sawdust-like powder on maize leaves.",
      te: "మొక్కజొన్న సుడులలో పురుగు ఉండి రంపపు పొట్టు లాంటి పదార్థం కనిపిస్తోంది.",
      hi: "मक्के की पत्तियों के बीच में कीड़ा लकड़ी के बुरादे जैसा पाउडर छोड़ते हुए पत्ते खा रहा है।"
    },
    {
      id: "maize-blight",
      icon: "📄",
      shortLabel: { en: "Long Gray Leaf Streaks", te: "ఆకు ఎండు తెగులు", hi: "पत्तियों पर लंबे धब्बे" },
      en: "Long cigar-shaped gray patches spreading on maize leaves from bottom to top.",
      te: "మొక్కజొన్న ఆకులపై పొడవాటి బూడిద రంగు మచ్చలు ఏర్పడి ఆకులు ఎండిపోతున్నాయి.",
      hi: "मक्के की निचली पत्तियों पर लंबे भूरे-धूसर धब्बे बनकर पूरे पत्ते पर फैल रहे हैं।"
    }
  ],
  "Tomato": [
    {
      id: "tomato-blight",
      icon: "🍅",
      shortLabel: { en: "Round Leaf Rings", te: "ఆకు మచ్చ తెగులు", hi: "गोल छल्लेदार धब्बे" },
      en: "Dark brown target-like circular rings appearing on bottom tomato leaves.",
      te: "టమోటా కింది ఆకులపై గుండ్రని వలయాల వంటి నల్లటి మచ్చలు వచ్చి రాలిపోతున్నాయి.",
      hi: "टमाटर की निचली पत्तियों पर गोल घेरेदार भूरे-काले धब्बे बनकर पत्ते सूख रहे हैं।"
    },
    {
      id: "tomato-ber",
      icon: "🟤",
      shortLabel: { en: "Black Flat Spot on Fruit Bottom", te: "కాయ కింది భాగం నల్లబడటం", hi: "टमाटर के नीचे काला धब्बा" },
      en: "The bottom tip of green tomato fruits is turning black, flat and leathery.",
      te: "పచ్చి టమోటా కాయ కింది భాగం నల్లగా మారి చదునుగా ఎండిపోతోంది.",
      hi: "हरे टमाटर के निचले सिरे पर चपटा काला चमड़े जैसा धब्बा बन रहा है।"
    }
  ],
  "Groundnut": [
    {
      id: "groundnut-tikka",
      icon: "🥜",
      shortLabel: { en: "Tikka Dark Spots", te: "టిక్కా ఆకుమచ్చ తెగులు", hi: "टिक्का पत्ती धब्बा" },
      en: "Groundnut leaves have circular dark brown spots with yellow halos and are dropping prematurely.",
      te: "వేరుశనగ ఆకులపై పసుపు రంగు వలయంతో కూడిన ముదురు గోధుమ రంగు టిక్కా మచ్చలు వచ్చి ఆకులు రాలుతున్నాయి.",
      hi: "मूंगफली की पत्तियों पर पीले घेरे वाले गहरे भूरे टिक्का धब्बे बन रहे हैं और पत्तियां गिर रही हैं।"
    },
    {
      id: "groundnut-gypsum",
      icon: "🪨",
      shortLabel: { en: "Gypsum & Pod Filling", te: "జిప్సం వేయడం & కాయ ఊరడం", hi: "जिप्सम व दाना भराव" },
      en: "When and how much gypsum should I apply for proper groundnut pod development and oil content?",
      te: "వేరుశనగ కాయలు బాగా ఊరడానికి జిప్సం ఎప్పుడు, ఎకరానికి ఎంత మోతాదులో వేయాలి?",
      hi: "मूंगफली में दाना भराव और खाली छिलके रोकने के लिए जिप्सम कब और कितना डालें?"
    }
  ],
  "Banana": [
    {
      id: "banana-panama",
      icon: "🍌",
      shortLabel: { en: "Panama Wilt Yellow Leaves", te: "పనామా విల్ట్ / ఆకులు పసుపుబారడం", hi: "पनामा विल्ट (उकठा)" },
      en: "Lower banana leaves are turning yellow from margins and hanging like a dead skirt around the stem.",
      te: "అరటి చెట్టు కింది ఆకులు అంచుల నుండి పసుపు రంగులోకి మారి కాండం చుట్టూ ఎండిపోయి వేలాడుతున్నాయి.",
      hi: "केले की निचली पत्तियां किनारों से पीली पड़कर तने के पास लटक रही हैं।"
    },
    {
      id: "banana-sigatoka",
      icon: "🍂",
      shortLabel: { en: "Sigatoka Leaf Spot", te: "సిగటోకా ఆకుమచ్చ తెగులు", hi: "सिगाटोका पत्ती धब्बा" },
      en: "Small dark brown oval spots with grey center along leaf veins spreading across banana leaves.",
      te: "అరటి ఆకులపై ఈనెల వెంట బూడిద రంగు కేంద్రంతో కూడిన గోధుమ రంగు సిగటోకా మచ్చలు వ్యాపిస్తున్నాయి.",
      hi: "केले के पत्तों पर नसों के साथ अंडाकार भूरे धब्बे फैलकर पत्तों को सुखा रहे हैं।"
    }
  ],
  "Mango": [
    {
      id: "mango-hopper",
      icon: "🥭",
      shortLabel: { en: "Hopper & Flower Drop", te: "తేనెమంచు పురుగు & పూత రాలడం", hi: "भुनगा कीट व बौर झड़ना" },
      en: "Mango hoppers are sucking flower sap, flowers are turning black and dropping with sticky honey dew.",
      te: "మామిడి పూతపై తేనెమంచు పురుగులు చేరి పూత నల్లబడి రాలిపోతోంది, జిగురు కారుతోంది.",
      hi: "आम के बौर पर भुनगा कीट रस चूस रहे हैं, फूल काले होकर झड़ रहे हैं और चिपचिपा रस टपक रहा है।"
    },
    {
      id: "mango-mildew",
      icon: "⚪",
      shortLabel: { en: "Powdery Mildew on Blossom", te: "బూడిద తెగులు", hi: "सफेद चूर्ण फफूंद (बौर)" },
      en: "White powdery fungal coating on mango flowers and panicles preventing fruit formation.",
      te: "మామిడి పూత మరియు కొమ్మలపై తెల్లటి బూడిద లాంటి పొర ఏర్పడి పిందె కట్టడం లేదు.",
      hi: "आम के बौर पर सफेद पाउडर जैसा फफूंद जम गया है जिससे फल नहीं बन पा रहे हैं।"
    }
  ],
  "General": [
    {
      id: "gen-soil-health",
      icon: "🧪",
      shortLabel: { en: "Soil Test & Fertilizer", te: "నేల పరీక్ష & ఎరువులు", hi: "मृदा परीक्षण व खाद" },
      en: "How do I test my soil health card parameters and apply balanced NPK nutrients?",
      te: "నా పొలం నేల పరీక్ష వివరాల ప్రకారం సమతుల్య ఎరువులు ఎలా వాడాలి?",
      hi: "सॉइल हेल्थ कार्ड के अनुसार संतुलित खाद और उर्वरक का उपयोग कैसे करें?"
    },
    {
      id: "gen-pmfby",
      icon: "🛡️",
      shortLabel: { en: "Crop Insurance Claim", te: "పంట బీమా క్లెయిమ్", hi: "फसल बीमा क्लेम (PMFBY)" },
      en: "How to apply and claim PMFBY crop insurance compensation after unexpected rains or pest loss?",
      te: "అకాల వర్షాలు లేదా తెగుళ్ళ వల్ల పంట నష్టం జరిగితే పీఎం ఫసల్ బీమా ఎలా క్లెయిమ్ చేయాలి?",
      hi: "अचानक बारिश या कीट से फसल नुकसान होने पर प्रधानमंत्री फसल बीमा योजना में क्लेम कैसे करें?"
    }
  ],
  "All": [
    {
      id: "all-yellow-leaves",
      icon: "🌾",
      shortLabel: { en: "Yellowing Leaves & Spots", te: "పసుపు ఆకులు & మచ్చలు", hi: "पीली पत्तियां व धब्बे" },
      en: "My crop leaves are turning yellow with brown spots and drying at edges. What should I spray?",
      te: "నా పంట ఆకులు పసుపు రంగులోకి మారి ఎండిపోతున్నాయి, నేను ఏ మందు పిచికారీ చేయాలి?",
      hi: "मेरी फसल की पत्तियां पीली पड़ रही हैं और सूख रही हैं, कौन सी दवा का छिड़काव करें?"
    },
    {
      id: "all-insect-holes",
      icon: "🐛",
      shortLabel: { en: "Insect Eating Leaves & Fruits", te: "పురుగుల నష్టం", hi: "कीट द्वारा नुकसान" },
      en: "Insects are making holes in leaves and fruits. How much medicine should I mix in my spray tank?",
      te: "పురుగులు ఆకులను, కాయలను తింటున్నాయి. ఒక స్ప్రే ట్యాంకులో ఎంత మందు కలపాలి?",
      hi: "कीड़े पत्तियों और फलों में छेद कर रहे हैं। एक स्प्रे टंकी में कितनी दवा मिलानी चाहिए?"
    },
    {
      id: "all-scheme",
      icon: "🏛️",
      shortLabel: { en: "PM-KISAN ₹6000 Scheme", te: "పీఎం కిసాన్ పథకం", hi: "पीएम किसान योजना" },
      en: "How do I get PM-KISAN ₹6000 bank support and check my installment status?",
      te: "పీఎం కిసాన్ ₹6000 సహాయం ఎలా పొందాలి మరియు విడత డబ్బులు ఎలా చెక్ చేసుకోవాలి?",
      hi: "पीएम किसान ₹6000 की किस्त का स्टेटस कैसे देखें और कैसे आवेदन करें?"
    }
  ]
};

export const FarmerDashboard: React.FC = () => {
  const { user, farm } = useAuth();
  const { t, language } = useLanguage();

  const [selectedCrop, setSelectedCrop] = useState<string>(farm?.crop || "Paddy");
  const [question, setQuestion] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [pipelineStage, setPipelineStage] = useState<'idle' | 'extracting' | 'retrieving' | 'generating' | 'validating' | 'completed'>('idle');
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [activeQuery, setActiveQuery] = useState<QueryRecord | null>(null);
  const [recentQueries, setRecentQueries] = useState<QueryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeLocation, setActiveLocation] = useState<LocationInfo | null>(null);

  // Sync farm crop when available
  useEffect(() => {
    if (farm?.crop) {
      setSelectedCrop(farm.crop);
    }
  }, [farm]);

  // Load user's query history on start
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const list = await api.getQueries();
      setRecentQueries(list);
      if (list.length > 0 && !activeQuery) {
        setActiveQuery(list[0]);
      }
    } catch (err) {
      console.warn("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Voice speech-to-text handler
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser. Please use Chrome/Edge or type your question.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    if (language === 'te') {
      recognition.lang = 'te-IN';
    } else if (language === 'hi') {
      recognition.lang = 'hi-IN';
    } else {
      recognition.lang = 'en-IN';
    }

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Handle Query Submission
  const handleSubmitQuery = async (queryText?: string) => {
    const textToAsk = (queryText || question).trim();
    if (!textToAsk) return;

    setErrorMsg(null);
    setPipelineStage('extracting');
    setPipelineData(null);

    // Smooth scroll down to visualizer/advisory area
    setTimeout(() => {
      const visualizerEl = document.getElementById("query-pipeline-visualizer");
      if (visualizerEl) {
        visualizerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    // Simulate animated pipeline stages for educational UX
    const t1 = setTimeout(() => setPipelineStage('retrieving'), 250);
    const t2 = setTimeout(() => setPipelineStage('generating'), 600);

    try {
      const cropForQuery = selectedCrop === "All" ? undefined : selectedCrop;
      const result = await api.askQuery(textToAsk, cropForQuery, language);
      clearTimeout(t1);
      clearTimeout(t2);

      setPipelineStage('completed');
      setPipelineData(result.pipelineExecution);
      setActiveQuery(result.data);
      setRecentQueries(prev => [result.data, ...prev.filter(q => q.id !== result.data.id)]);
      setQuestion("");

      setTimeout(() => {
        const advisoryEl = document.getElementById("active-advisory-container");
        if (advisoryEl) {
          advisoryEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      setPipelineStage('idle');
      setErrorMsg(err.message || "Failed to process query. Please try again.");
    }
  };

  // Select a Previous Advisory and Scroll to Explanation
  const handleSelectPreviousAdvisory = (q: QueryRecord) => {
    setActiveQuery(q);
    setPipelineStage('completed');
    setPipelineData({
      extractedCrop: q.detectedCrop,
      extractedIntent: q.detectedIntent || q.extractedContext?.problem || "Diagnosis",
      retrievedCount: q.retrievedChunks?.length || 0,
      topSimilarity: q.retrievedChunks?.[0]?.similarityScore || 0.94,
      modelUsed: q.advisory?.engineUsed || 'Gemini 3.7 Flash',
      latencyMs: 320
    });

    // Direct scroll to advisory explanation card
    setTimeout(() => {
      const advisoryEl = document.getElementById("active-advisory-container") || document.getElementById("advisory-card");
      if (advisoryEl) {
        advisoryEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  };

  const rawPrompts = EASY_SAMPLE_QUESTIONS_BY_CROP[selectedCrop] || EASY_SAMPLE_QUESTIONS_BY_CROP["All"] || [];
  const currentLangKey = (language === "te" || language === "hi" ? language : "en") as "en" | "te" | "hi";

  return (
    <div id="farmer-dashboard-view" className="space-y-6">
      
      {/* Welcome Banner with Farm summary */}
      <div className="bg-[#2D5A27] text-white rounded-[28px] p-6 sm:p-8 shadow-md border border-[#1E3D1A] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#8BC34A]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1E3D1A] border border-[#3E7A37] text-xs font-bold text-[#FFD700] mb-2 shadow-xs">
              <Sprout className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>Evidence-Based Agricultural Advisory (ICAR RAG)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t("farmerGreeting")}, {user?.name || "Farmer"}!
            </h1>
            <p className="text-sm text-[#E0E7D9] mt-1 max-w-2xl">
              Ask any question regarding crop diseases, pest attacks, fertilizers, or government schemes in natural language.
            </p>
          </div>

          {farm && (
            <div className="bg-[#1E3D1A]/90 backdrop-blur-xs border border-[#3E7A37] rounded-2xl p-4 text-xs space-y-1.5 min-w-[220px] shadow-sm">
              <div className="text-[11px] text-[#FFD700] uppercase font-bold tracking-wider">Registered Farm</div>
              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#8BC34A]" />
                {farm.district}, {farm.state}
              </div>
              <div className="text-[#E0E7D9] flex items-center justify-between">
                <span>Crop: <strong className="text-white">{farm.crop}</strong></span>
                <span>Size: <strong className="text-white">{farm.farmSizeAcres} Ac</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weather Module */}
      <WeatherCard 
        district={farm?.district || "Guntur"} 
        state={farm?.state || "Andhra Pradesh"} 
        crop={selectedCrop}
        onLocationChange={(loc) => setActiveLocation(loc)}
      />

      {/* Main Query Section */}
      <div id="ask-question-box" className="bg-white rounded-[28px] border-2 border-[#E0E7D9] p-5 sm:p-7 shadow-sm">
        
        {/* Crop Selection Bar */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-[#2D5A27] uppercase tracking-wider mb-2">
            {t("cropLabel")}
          </label>
          <div className="flex flex-wrap gap-2">
            {CROPS.map(crop => (
              <motion.button
                key={crop}
                onClick={() => setSelectedCrop(crop)}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedCrop === crop
                    ? "bg-[#2D5A27] text-[#FFD700] shadow-sm border border-[#1E3D1A]"
                    : "bg-[#F0F4ED] text-[#2D5A27] hover:bg-[#E0E7D9] hover:text-[#1A2E1A] border border-[#D0DBC7]"
                }`}
              >
                {crop}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Natural Language Question Input */}
        <div className="relative mb-4">
          <textarea
            id="farmer-question-input"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitQuery();
              }
            }}
            placeholder={t("askQuestionPlaceholder")}
            className="w-full rounded-2xl border-2 border-[#8BC34A] bg-[#FBFEFA] p-4 pr-28 text-sm text-[#1A2E1A] placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-[#8BC34A]/20 transition resize-none leading-relaxed shadow-inner"
          />

          {/* Action buttons inside textarea */}
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <motion.button
              id="voice-mic-btn"
              type="button"
              onClick={handleVoiceInput}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={isListening ? t("voiceListening") : t("voiceInput")}
              className={`p-2.5 rounded-full transition cursor-pointer shadow-xs ${
                isListening
                  ? "bg-rose-500 text-white animate-ping"
                  : "bg-[#F0F4ED] hover:bg-[#E0E7D9] text-[#2D5A27]"
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </motion.button>

            <motion.button
              id="submit-query-btn"
              type="button"
              onClick={() => handleSubmitQuery()}
              whileHover={question.trim() ? { scale: 1.05, y: -1 } : {}}
              whileTap={question.trim() ? { scale: 0.95 } : {}}
              disabled={!question.trim() || pipelineStage !== 'idle' && pipelineStage !== 'completed'}
              className="px-5 py-2.5 rounded-full bg-[#FFD700] hover:bg-[#F2C94C] disabled:opacity-50 text-[#2D5A27] text-xs font-black shadow-md flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>{t("askButton")}</span>
              <Send className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* Quick Diagnostic Prompts */}
        <div>
          <div className="text-[11px] font-bold text-[#558B2F] uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2D5A27]" />
              <span>{t("sampleQuestions")} ({selectedCrop})</span>
            </span>
            <span className="text-[10px] text-stone-500 font-normal">
              {language === 'te' ? 'సమస్యను ఎంచుకోవడానికి నొక్కండి' : language === 'hi' ? 'समस्या चुनने के लिए टैप करें' : 'Tap any problem to ask instantly'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {rawPrompts.map((prompt) => {
              const fullQuery = prompt[currentLangKey] || prompt.en;
              const shortTitle = prompt.shortLabel[currentLangKey] || prompt.shortLabel.en;
              const isProcessing = pipelineStage !== 'idle' && pipelineStage !== 'completed';
              return (
                <motion.button
                  key={prompt.id}
                  id={`quick-prompt-${prompt.id}`}
                  disabled={isProcessing}
                  onClick={() => {
                    setQuestion(fullQuery);
                    handleSubmitQuery(fullQuery);
                  }}
                  whileHover={!isProcessing ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isProcessing ? { scale: 0.97 } : {}}
                  className={`text-left bg-[#FBFEFA] hover:bg-[#F1F8E9] text-[#2D5A27] border-2 border-[#D0DBC7] hover:border-[#8BC34A] rounded-2xl p-3 transition-all cursor-pointer shadow-2xs flex flex-col justify-between group ${
                    isProcessing ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{prompt.icon}</span>
                      <span className="text-xs font-black text-[#1A2E1A] group-hover:text-[#2D5A27]">
                        {shortTitle}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#4A5D4E] line-clamp-2 leading-relaxed font-medium">
                      {fullQuery}
                    </p>
                  </div>
                  <div className="mt-2.5 pt-1.5 border-t border-[#E0E7D9] flex items-center justify-between text-[10px] font-bold text-[#558B2F]">
                    <span>{language === 'te' ? 'సలహా అడగండి' : language === 'hi' ? 'सलाह पूछें' : 'Get Remedy'}</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Query Pipeline Visualizer */}
      <QueryPipelineVisualizer 
        stage={pipelineStage} 
        pipelineData={pipelineData} 
      />

      {/* Active Advisory Card */}
      {activeQuery && (
        <div id="active-advisory-container">
          <AdvisoryCard
            queryId={activeQuery.id}
            question={activeQuery.question}
            advisory={activeQuery.advisory}
            retrievedChunks={activeQuery.retrievedChunks}
            onAskFollowUp={(fq) => {
              setQuestion(fq);
              handleSubmitQuery(fq);
            }}
          />
        </div>
      )}

      {/* Recent Queries Drawer / List */}
      <div id="recent-queries-section" className="bg-white rounded-[28px] border border-[#E0E7D9] p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E0E7D9]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#2D5A27]" />
            <h3 className="text-sm font-bold text-[#1A2E1A]">
              {t("recentQueries")}
            </h3>
          </div>
          <span className="text-xs text-[#558B2F] font-bold">
            {recentQueries.length} Advisories Recorded
          </span>
        </div>

        {recentQueries.length === 0 ? (
          <div className="text-center py-8 text-stone-400 text-xs">
            {t("noQueries")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentQueries.map(q => (
              <motion.div
                key={q.id}
                id={`previous-advisory-item-${q.id}`}
                onClick={() => handleSelectPreviousAdvisory(q)}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition flex flex-col justify-between ${
                  activeQuery?.id === q.id
                    ? "bg-[#F1F8E9] border-[#8BC34A] shadow-md ring-2 ring-[#8BC34A]/40"
                    : "bg-[#FBFEFA] hover:bg-[#F0F4ED] border-[#E0E7D9]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFD700]/30 text-[#2D5A27] border border-[#FFD700]/50">
                      {q.detectedCrop}
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium">
                      {new Date(q.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#1A2E1A] line-clamp-1 mb-1">
                    {q.advisory?.problem || q.question}
                  </h4>
                  <p className="text-[11px] text-[#2D5A27]/80 line-clamp-2 leading-relaxed">
                    "{q.question}"
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E0E7D9] text-[11px]">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    q.confidence === 'high' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFF9C4] text-[#F57F17]'
                  }`}>
                    {q.confidence?.toUpperCase()} CONFIDENCE
                  </span>
                  <span className="text-[#2D5A27] font-bold flex items-center gap-0.5">
                    View Advisory <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

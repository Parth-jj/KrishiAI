import { CropGuideItem } from "./cropGuides.js";

export const CROP_GUIDES_DATA: CropGuideItem[] = [
  {
    id: "paddy",
    name: "Paddy / Rice (धान / వరి)",
    icon: "🌾",
    scientificName: "Oryza sativa",
    popularVarieties: ["BPT 5204 (Samba Mahsuri)", "MTU 1010", "Swarna (MTU 7029)", "RNR 15048 (Telangana Sona)", "Pusa Basmati 1121"],
    idealSoil: "Clayey loam, heavy alluvial soil with good water retention capacity (pH 5.5 - 7.0)",
    criticalStages: ["Nursery (0-25 days)", "Tillering (25-45 days)", "Panicle Initiation (50-65 days)", "Flowering & Grain Filling (75-105 days)"],
    sprayGuides: [
      {
        id: "paddy-blast",
        problemName: "Blast Disease (Neck & Leaf Blast)",
        regionalName: {
          hi: "धान का झुलसा रोग (ब्लास्ट)",
          te: "వరి అగ్గి తెగులు (బ్లాస్ట్ తెగులు)"
        },
        type: "disease",
        stage: "Tillering to Heading",
        symptoms: [
          "Spindle-shaped (diamond-like) eye spots with grey/whitish centers and dark brown margins on leaves",
          "Blackening and rotting of neck node below the panicle causing empty, chaffy white ears"
        ],
        visualIndicators: "Eye-shaped spots with ash-coloured center on leaves or dark brown ring at the neck node",
        organicRemedy: {
          title: "Pseudomonas fluorescens + Neem Spray",
          dosage: "10 g or 10 ml per liter of water (150 g/pump)",
          instructions: "Spray during evening hours or early morning when morning dew starts to dry. Repeat after 7-10 days."
        },
        chemicalRemedy: {
          activeIngredient: "Tricyclazole 75% WP or Azoxystrobin 18.2% + Difenoconazole 11.4% SC",
          perLiterDosage: "0.6 g / liter (Tricyclazole) OR 1.0 ml / liter (Combo)",
          perPumpDosage: "9 g to 10 g per 15L Knapsack Tank (or 15 ml liquid combo)",
          waitingPeriodDays: 21,
          safetyNote: "Do not apply excess nitrogen fertilizer (urea). Avoid spraying when rain is forecasted within 4 hours."
        },
        preventiveTips: [
          "Avoid excess urea application during cloudy, humid weather.",
          "Maintain balanced potassium (MOP) dosage to boost plant disease resistance.",
          "Treat seed with Carbendazim 2g/kg or Trichoderma viride 5g/kg before nursery sowing."
        ]
      },
      {
        id: "paddy-stem-borer",
        problemName: "Yellow Stem Borer (Dead Heart & White Ear)",
        regionalName: {
          hi: "तना छेदक सुंडी (सफेद बाली)",
          te: "వరి కాండం తొలుచు పురుగు (తెల్ల కంకి)"
        },
        type: "pest",
        stage: "Tillering to Panicle Emergence",
        symptoms: [
          "Drying of central shoot in young plants (Dead Heart) that easily pulls out",
          "Erect, completely bleached white empty panicles at heading stage (White Earhead)"
        ],
        visualIndicators: "Central shoot drying up and easily pulled out; empty bleached panicles with hole at base",
        organicRemedy: {
          title: "Pheromone Traps + Trichogramma Egg Parasitoids",
          dosage: "Install 4 to 5 Pheromone Traps per acre with Scirpophaga lure",
          instructions: "Release Trichogramma japonicum egg parasitoid cards @ 20,000/acre at 30 & 40 days after transplanting."
        },
        chemicalRemedy: {
          activeIngredient: "Chlorantraniliprole 18.5% SC (Rynaxypyr) or Cartap Hydrochloride 50% SP",
          perLiterDosage: "0.3 ml / liter (Chlorantraniliprole) OR 2.0 g / liter (Cartap)",
          perPumpDosage: "5 ml per 15L tank (Chlorantraniliprole) OR 30 g per 15L tank",
          waitingPeriodDays: 14,
          safetyNote: "Ensure water level in field is 2-3 cm during spray. Use standard flood jet or hollow cone nozzle directed towards base."
        },
        preventiveTips: [
          "Clip seedling tip before transplanting to eliminate egg masses.",
          "Avoid excessive standing water in early vegetative stage; allow intermittent aeration."
        ]
      },
      {
        id: "paddy-bph",
        problemName: "Brown Plant Hopper (BPH / Hopper Burn)",
        regionalName: {
          hi: "भूरा माहू / तेला (हॉपर बर्न)",
          te: "వరి సుడి దోమ (హాపర్ బర్న్)"
        },
        type: "pest",
        stage: "Maximum Tillering to Milking",
        symptoms: [
          "Circular patches of plants turning golden-yellow, then brownish-black and drying rapidly like burnt crop",
          "Heavy clustering of small brown nymphs and adults sucking sap at the lower base of tillers"
        ],
        visualIndicators: "Circular drying 'hopper burn' patches starting from middle of the field; tiny brown insects at stem base",
        organicRemedy: {
          title: "Neem Oil 10,000 ppm + Field Aeration (Alley Formation)",
          dosage: "3 ml per liter of water (45-50 ml per 15L tank)",
          instructions: "Drain standing water immediately for 3-4 days. Create walking alleyways (paya) every 2 meters for sunlight penetration."
        },
        chemicalRemedy: {
          activeIngredient: "Trifluflumezopyrim 10% SC or Pymetrozine 50% WDG",
          perLiterDosage: "0.5 ml / liter (Trifluflumezopyrim) OR 0.6 g / liter (Pymetrozine)",
          perPumpDosage: "7.5 ml per 15L tank (Trifluflumezopyrim) OR 10 g per 15L tank",
          waitingPeriodDays: 19,
          safetyNote: "Direct spray strictly to the base of the plant clumps, NOT the top foliage. Strictly avoid synthetic pyrethroids (Cypermethrin) which trigger hopper flare-up."
        },
        preventiveTips: [
          "Practice alternate wetting and drying (AWD) water management.",
          "Form 30 cm alley ways (Paya / Galli) for every 2 meters during transplanting to reduce humidity inside canopy."
        ]
      },
      {
        id: "paddy-sheath-blight",
        problemName: "Sheath Blight Disease",
        regionalName: {
          hi: "तना/पत्ती आवरण झुलसा रोग",
          te: "వరి పొడ తెగులు (షీత్ బ్లైట్)"
        },
        type: "disease",
        stage: "Active Tillering to Booting",
        symptoms: [
          "Snake-skin like or green-grey oval lesions starting just above water level on the leaf sheath",
          "Lesions enlarge, coalesce with irregular brown borders, and travel up to upper leaves and flag leaf"
        ],
        visualIndicators: "Banded/irregular marbled lesions on lower leaf sheath near water surface",
        organicRemedy: {
          title: "Trichoderma viride Soil & Foliar Drench",
          dosage: "10 g per liter of water",
          instructions: "Spray directed at the lower stem area in the morning hours."
        },
        chemicalRemedy: {
          activeIngredient: "Hexaconazole 5% SC or Validamycin 3% L",
          perLiterDosage: "2.0 ml / liter (Hexaconazole) OR 2.5 ml / liter (Validamycin)",
          perPumpDosage: "30 ml to 40 ml per 15L Knapsack Tank",
          waitingPeriodDays: 15,
          safetyNote: "Target the base of the crop canopy thoroughly. Use 200 liters of water per acre."
        },
        preventiveTips: [
          "Remove weed hosts (Echinochloa grass) from bunds.",
          "Avoid excessive nitrogenous fertilizer application."
        ]
      }
    ]
  },
  {
    id: "cotton",
    name: "Cotton (कपास / పత్తి)",
    icon: "☁️",
    scientificName: "Gossypium hirsutum",
    popularVarieties: ["Bollgard II hybrids", "RCH 659", "Bhakti", "Kaveri Jadoo", "Mallika BG-II"],
    idealSoil: "Deep black cotton soils (Vertisols) or well-drained fertile loams (pH 6.5 - 8.0)",
    criticalStages: ["Seedling (0-30 days)", "Squaring (35-55 days)", "Flowering & Boll Formation (60-100 days)", "Boll Maturation & Bursting (100-150 days)"],
    sprayGuides: [
      {
        id: "cotton-pbw",
        problemName: "Pink Bollworm (PBW)",
        regionalName: {
          hi: "गुलाबी सुंडी (पिंक बॉलवर्म)",
          te: "పత్తి గులాబీ రంగు పురుగు (పింక్ బోల్‌వార్మ్)"
        },
        type: "pest",
        stage: "Squaring, Flowering & Green Boll Stage (45-120 days)",
        symptoms: [
          "Rosetted flowers ('Gulabi phool') that fail to open properly due to larva feeding inside petals",
          "Premature dropping of squares and green bolls with invisible entry holes that seal up",
          "Stained lint and drilled hollowed seeds inside opened bolls"
        ],
        visualIndicators: "Rosetted flower petals tied with silk; small pinkish caterpillar inside green bolls; stained dirty lint",
        organicRemedy: {
          title: "Pectino-lure Pheromone Traps + Neem 10,000 ppm",
          dosage: "Install 8 pheromone traps per acre + Neem Oil @ 3 ml/L",
          instructions: "Change pheromone septa every 21 days. Check trap catch weekly. If catch exceeds 8 moths/trap/day, start spray immediately."
        },
        chemicalRemedy: {
          activeIngredient: "Emamectin Benzoate 5% SG or Chlorantraniliprole 18.5% SC",
          perLiterDosage: "0.5 g / liter (Emamectin) OR 0.3 ml / liter (Chlorantraniliprole)",
          perPumpDosage: "8 g per 15L tank (Emamectin) OR 5 ml per 15L tank",
          waitingPeriodDays: 14,
          safetyNote: "Rotate active chemistries to avoid resistance buildup. Never use identical chemical class repeatedly."
        },
        preventiveTips: [
          "Maintain non-Bt cotton refuge crop rows around main field.",
          "Install pheromone traps early at 45 days after sowing (DAS).",
          "Destroy crop residues and avoid ratoon cotton to break pest lifecycle."
        ]
      },
      {
        id: "cotton-sucking-pests",
        problemName: "Sucking Pest Complex (Whitefly, Jassids & Thrips)",
        regionalName: {
          hi: "सफेद मक्खी, हरा तेला और थ्रिप्स",
          te: "తెల్లదోమ, పచ్చదోమ & తామర పురుగులు"
        },
        type: "pest",
        stage: "Vegetative to Boll Development",
        symptoms: [
          "Downward curling and yellowing of leaf edges giving hopper burn appearance (Jassids)",
          "Silvery shiny patches on underside of leaves (Thrips)",
          "Sticky honeydew secretions with black sooty mold on top leaf surfaces (Whitefly)"
        ],
        visualIndicators: "Leaf edges curling downwards/yellowing; cloud of tiny white flies flying when shaking plants",
        organicRemedy: {
          title: "Yellow & Blue Sticky Traps + Verticillium lecanii",
          dosage: "10 Yellow + 10 Blue sticky cards per acre + Verticillium @ 5 g/L",
          instructions: "Place sticky traps at canopy height. Spray biological solution in evening when humidity is high."
        },
        chemicalRemedy: {
          activeIngredient: "Diafenthiuron 50% WP or Flonicamid 50% WG",
          perLiterDosage: "1.2 g / liter (Diafenthiuron) OR 0.4 g / liter (Flonicamid)",
          perPumpDosage: "18 g to 20 g per 15L tank (Diafenthiuron) OR 6 g per 15L tank (Flonicamid)",
          waitingPeriodDays: 20,
          safetyNote: "Flonicamid specifically targets sucking insects while sparing beneficial predatory insects (spiders, ladybird beetles)."
        },
        preventiveTips: [
          "Avoid excessive early nitrogen application which makes leaves succulent.",
          "Intercrop with cowpea or maize (1 row for every 10 cotton rows) to attract natural predatory ladybird beetles."
        ]
      },
      {
        id: "cotton-grey-mildew",
        problemName: "Grey Mildew (Dahiya Disease)",
        regionalName: {
          hi: "दहिया रोग / धूसर फफूंदी",
          te: "పత్తి దహియా తెగులు (బూడిద తెగులు)"
        },
        type: "disease",
        stage: "Boll formation and maturity stage",
        symptoms: [
          "White or pale-grey powdery frost-like angular spots on the lower surface of leaves",
          "Corresponding upper leaf surface shows pale yellow angular spots delimited by leaf veins, followed by leaf fall"
        ],
        visualIndicators: "White flour/curd-like powdery growth on underside of lower leaves; early defoliation",
        organicRemedy: {
          title: "Wettable Sulphur 80% WDG",
          dosage: "2.5 g to 3.0 g per liter of water (40 g per 15L tank)",
          instructions: "Spray thoroughly covering the underside of mature lower leaves."
        },
        chemicalRemedy: {
          activeIngredient: "Kresoxim-methyl 44.3% SC or Azoxystrobin 23% SC",
          perLiterDosage: "1.0 ml / liter of water",
          perPumpDosage: "15 ml per 15L tank",
          waitingPeriodDays: 14,
          safetyNote: "Ensure full coverage of lower canopy. Spray when morning humidity drops."
        },
        preventiveTips: [
          "Ensure wider spacing (90x60 cm or 120x45 cm) for good aeration.",
          "Avoid dense overcrowding and waterlogging."
        ]
      }
    ]
  },
  {
    id: "chilli",
    name: "Chilli / Pepper (मिर्च / మిరప)",
    icon: "🌶️",
    scientificName: "Capsicum annuum",
    popularVarieties: ["Guntur Sannam (S4)", "Byadgi", "Teja", "Armoor", "US-341", "Devanur Deluxe"],
    idealSoil: "Well-drained sandy loam or clay loam rich in organic matter (pH 6.0 - 7.5)",
    criticalStages: ["Nursery (0-35 days)", "Vegetative (35-65 days)", "Flowering & Fruit Set (65-100 days)", "Harvesting / Picking (100-180 days)"],
    sprayGuides: [
      {
        id: "chilli-thrips-mites",
        problemName: "Black Thrips & Murda Complex (Leaf Curl / Gemini Virus)",
        regionalName: {
          hi: "मिर्च का मरोड़िया रोग एवं काली थ्रिप्स",
          te: "మిరప బొబ్బర తెగులు (నల్ల తామర పురుగులు)"
        },
        type: "pest",
        stage: "Vegetative, Flowering and Pod formation",
        symptoms: [
          "Upward boat-shaped curling of leaves with roughening (Thrips)",
          "Downward inverted cup-shaped leaf curling with elongated petioles (Mites)",
          "Flower dropping, deformed small crinkled chillies, and stunted bushy plant growth"
        ],
        visualIndicators: "Upper leaves curled like boat/cup with scratched brown streaks on underside; tiny black crawling thrips inside flowers",
        organicRemedy: {
          title: "Neem Seed Kernel Extract (NSKE 5%) + Sticky Traps",
          dosage: "50 ml / liter OR Neem oil 10,000 ppm @ 3 ml/L + 25 Blue/Yellow sticky traps/acre",
          instructions: "Spray biological formula early morning. Thoroughly wet flower buds and leaf undersides."
        },
        chemicalRemedy: {
          activeIngredient: "Spinetoram 11.7% SC or Broflanilide 300 g/L SC",
          perLiterDosage: "0.9 ml / liter (Spinetoram) OR 0.1 ml / liter (Broflanilide)",
          perPumpDosage: "13.5 ml per 15L tank (Spinetoram) OR 1.5 ml per 15L tank (Broflanilide)",
          waitingPeriodDays: 7,
          safetyNote: "For severe black thrips (Thrips parvispinus), ensure dual spray cycle separated by 5 days. Add non-ionic spreader/sticker (0.5 ml/L)."
        },
        preventiveTips: [
          "Grow 2-3 border rows of maize or sorghum as windbreaks to block thrips migration.",
          "Install 20-30 blue sticky traps per acre for continuous monitoring."
        ]
      },
      {
        id: "chilli-dieback",
        problemName: "Dieback & Anthracnose (Fruit Rot)",
        regionalName: {
          hi: "डाईबैक एवं फल सड़न रोग (एंथ्रेक्नोज़)",
          te: "మిరప కొమ్మ ఎండు తెగులు & కాయ కుళ్ళు తెగులు"
        },
        type: "disease",
        stage: "Flowering to Fruit Maturity",
        symptoms: [
          "Drying and necrosis of tender twigs starting from top and progressing downwards (Dieback)",
          "Circular, sunken, water-soaked dark spots with concentric rings of black dots on ripe red pods"
        ],
        visualIndicators: "Twigs turning white/straw-colored drying top-down; rotten sunken black spots on ripe pods",
        organicRemedy: {
          title: "Trichoderma viride + Copper Hydroxide 77% WP",
          dosage: "2.0 g per liter of water (30 g per 15L tank)",
          instructions: "Spray at start of flowering and repeat after pod set."
        },
        chemicalRemedy: {
          activeIngredient: "Azoxystrobin 18.2% + Difenoconazole 11.4% SC or Captan 70% + Hexaconazole 5% WP",
          perLiterDosage: "1.0 ml / liter (Azoxy combo) OR 1.5 g / liter (Captan combo)",
          perPumpDosage: "15 ml per 15L tank (Azoxy combo) OR 25 g per 15L tank",
          waitingPeriodDays: 10,
          safetyNote: "Collect and burn infected dried twigs and rotten dropped fruits before spraying."
        },
        preventiveTips: [
          "Treat seeds with Thiram 3g/kg before nursery bed sowing.",
          "Avoid excessive overhead sprinkling; prefer drip irrigation to keep canopy dry."
        ]
      }
    ]
  },
  {
    id: "wheat",
    name: "Wheat (गेहूं / గోధుమ)",
    icon: "🌾",
    scientificName: "Triticum aestivum",
    popularVarieties: ["HD 2967", "HD 3086 (Pusa Gautami)", "PBW 550", "DBW 187 (Karan Vandana)", "DBW 222"],
    idealSoil: "Well-drained fertile clay-loam or medium texture alluvial soil (pH 6.5 - 7.5)",
    criticalStages: ["CRI - Crown Root Initiation (20-25 days)", "Tillering (40-45 days)", "Jointing & Booting (60-70 days)", "Flowering & Milking (85-105 days)"],
    sprayGuides: [
      {
        id: "wheat-yellow-rust",
        problemName: "Yellow / Stripe Rust (Peela Ratawa)",
        regionalName: {
          hi: "पीला रतुआ / धारीदार रतुआ",
          te: "గోధుమ పసుపు తుప్పు తెగులు"
        },
        type: "disease",
        stage: "Tillering to Earhead emergence (cool, humid weather)",
        symptoms: [
          "Bright yellow powdery pustules arranged in parallel straight stripes on leaf blades",
          "Yellow powder easily rubs off onto fingers when leaves are touched"
        ],
        visualIndicators: "Long parallel bright yellow powdery stripes along the leaf length",
        organicRemedy: {
          title: "Early Detection & Resistant Variety Selection",
          dosage: "Grow resistant cultivars (DBW 187, DBW 222, PBW 725)",
          instructions: "Inspect northern borders and shaded tree areas weekly during December to February."
        },
        chemicalRemedy: {
          activeIngredient: "Propiconazole 25% EC (Tilt)",
          perLiterDosage: "1.0 ml / liter of water",
          perPumpDosage: "15 ml per 15L Knapsack tank (200 ml in 200 L water/acre)",
          waitingPeriodDays: 30,
          safetyNote: "Start spraying immediately upon observing the first yellow foci patch in the field. Do not delay."
        },
        preventiveTips: [
          "Avoid early sowing of susceptible varieties.",
          "Monitor field regularly when temperatures range between 10°C - 20°C with high humidity."
        ]
      },
      {
        id: "wheat-aphid",
        problemName: "Wheat Aphids (Mahoon / Chepa)",
        regionalName: {
          hi: "गेहूं का माहू / चेपा",
          te: "గోధుమ పేనుబంక పురుగు"
        },
        type: "pest",
        stage: "Earhead emergence to Dough stage",
        symptoms: [
          "Colonies of tiny green/brown wingless insects clustered on earheads and flag leaves",
          "Sucking sap from developing grains, turning them shrivelled and light weight"
        ],
        visualIndicators: "Dense green cluster of aphids on earheads; honeydew stickiness",
        organicRemedy: {
          title: "Neem formulation 1500 ppm or Soap water spray",
          dosage: "4 ml / liter of water",
          instructions: "Spray when ladybird beetle predators are absent."
        },
        chemicalRemedy: {
          activeIngredient: "Thiamethoxam 25% WG",
          perLiterDosage: "0.25 g / liter of water",
          perPumpDosage: "4 g per 15L Knapsack tank (50 g / acre)",
          waitingPeriodDays: 21,
          safetyNote: "Spray during afternoon hours when pollinators have reduced activity."
        },
        preventiveTips: [
          "Avoid late sowing which exposes crop to peak aphid multiplication in February-March.",
          "Conserve Coccinellid predatory ladybird beetles in the field."
        ]
      }
    ]
  },
  {
    id: "tomato",
    name: "Tomato (टमाटर / టమాటా)",
    icon: "🍅",
    scientificName: "Solanum lycopersicum",
    popularVarieties: ["Arka Rakshak", "Arka Samrat", "Abhinav", "Saaho (Syngenta 3251)", "Pusa Ruby"],
    idealSoil: "Well-drained rich loam with high organic matter (pH 6.0 - 7.0)",
    criticalStages: ["Nursery (0-25 days)", "Vegetative (25-45 days)", "Flowering & Fruit Set (45-75 days)", "Fruiting & Harvesting (75-120 days)"],
    sprayGuides: [
      {
        id: "tomato-early-late-blight",
        problemName: "Early & Late Blight",
        regionalName: {
          hi: "टमाटर का अगेती एवं पछेती झुलसा",
          te: "టమాటా ముందస్తు & ఆలస్యపు మాడు తెగులు"
        },
        type: "disease",
        stage: "Vegetative to Harvest",
        symptoms: [
          "Early Blight: Target-board concentric brown rings on lower older leaves surrounded by yellow halo",
          "Late Blight: Large water-soaked oily greenish-black patches on leaves and fruits during cold fog/rain"
        ],
        visualIndicators: "Concentric target rings on leaves or dark greasy rotting on green tomato fruits",
        organicRemedy: {
          title: "Copper Oxychloride 50% WP (COC) or Bordeaux Mixture (1%)",
          dosage: "2.5 g / liter of water (35-40 g per 15L pump)",
          instructions: "Apply before cloudy/foggy weather sets in."
        },
        chemicalRemedy: {
          activeIngredient: "Famoxadone 16.6% + Cymoxanil 22.1% SC or Dimethomorph 50% WP",
          perLiterDosage: "1.0 ml / liter (Famoxadone combo) OR 1.0 g / liter (Dimethomorph)",
          perPumpDosage: "15 ml / 15L tank OR 15 g / 15L tank",
          waitingPeriodDays: 7,
          safetyNote: "Alternate with Mancozeb 75% WP (2 g/L) to manage resistance. Ensure complete foliage coverage."
        },
        preventiveTips: [
          "Stake plants to prevent foliage and fruit from touching wet soil.",
          "Prune lower bottom leaves (up to 20 cm above ground) to improve air circulation."
        ]
      },
      {
        id: "tomato-pinworm-tuta",
        problemName: "Tomato Leaf Miner / Pinworm (Tuta absoluta)",
        regionalName: {
          hi: "टमाटर की पत्ती सुरंगक / पिनवर्म",
          te: "టమాటా ఆకు తొలుచు పురుగు (టుటా అబ్సొల్యూటా)"
        },
        type: "pest",
        stage: "All stages from vegetative to harvest",
        symptoms: [
          "Broad white blotchy mines and windowed transparent patches on leaves with dark frass",
          "Pinhead-sized entry holes near fruit calyx with rotting inside the tomato"
        ],
        visualIndicators: "Paper-white transparent blotches on leaves; pinholes on green tomatoes",
        organicRemedy: {
          title: "Tuta Pheromone Traps + Bacillus thuringiensis (Bt)",
          dosage: "8-10 traps/acre + Bt kurstaki @ 2 g/L",
          instructions: "Install pheromone lures immediately after transplanting."
        },
        chemicalRemedy: {
          activeIngredient: "Chlorantraniliprole 18.5% SC or Spinosad 45% SC",
          perLiterDosage: "0.3 ml / liter (Chlorantraniliprole) OR 0.35 ml / liter (Spinosad)",
          perPumpDosage: "5 ml per 15L tank (Chlorantraniliprole) OR 5.5 ml per 15L tank (Spinosad)",
          waitingPeriodDays: 5,
          safetyNote: "Always add a surfactant/sticker to penetrate waxy leaf cuticle. Observe 5 days PHI before picking."
        },
        preventiveTips: [
          "Remove and safely destroy infested fruit and leaves showing mines.",
          "Use insect-proof nylon nets (40-50 mesh) in nurseries."
        ]
      }
    ]
  },
  {
    id: "maize",
    name: "Maize / Corn (मक्का / మొక్కజొన్న)",
    icon: "🌽",
    scientificName: "Zea mays",
    popularVarieties: ["Pioneer 3396", "DKC 9108", "NK 6240", "Kaveri 50", "DHM 117"],
    idealSoil: "Deep, well-drained fertile sandy loam to clay loam (pH 6.5 - 7.5)",
    criticalStages: ["Seedling (0-20 days)", "Knee-high (25-35 days)", "Tasseling & Silking (45-60 days)", "Grain Fill (65-85 days)"],
    sprayGuides: [
      {
        id: "maize-faw",
        problemName: "Fall Armyworm (FAW - Spodoptera frugiperda)",
        regionalName: {
          hi: "मक्के का फॉल आर्मीवर्म / लश्करी सुंडी",
          te: "మొక్కజొన్న కత్తెర పురుగు (ఫాల్ ఆర్మీవార్మ్)"
        },
        type: "pest",
        stage: "Seedling to Tasseling (10-45 DAS)",
        symptoms: [
          "Shot holes and pinholes on leaves unfolding from central whorl",
          "Ragged leaf tearing with heavy sawdust-like brown faecal frass packed inside whorl",
          "Central growing point chewed off leading to stunted dead whorl"
        ],
        visualIndicators: "Heavy sawdust frass inside central whorl; caterpillar with inverted 'Y' mark on head and 4 raised dots on 8th segment",
        organicRemedy: {
          title: "Metarhizium rileyi or Neem Cake Whorl Application",
          dosage: "5 g / liter OR drop pinch of dry sand + lime (9:1) directly into central whorl",
          instructions: "Target the application directly inside the central leaf funnel/whorl where caterpillar hides."
        },
        chemicalRemedy: {
          activeIngredient: "Chlorantraniliprole 18.5% SC or Emamectin Benzoate 5% SG",
          perLiterDosage: "0.4 ml / liter (Chlorantraniliprole) OR 0.5 g / liter (Emamectin)",
          perPumpDosage: "6 ml per 15L tank OR 8 g per 15L tank",
          waitingPeriodDays: 14,
          safetyNote: "Direct the spray nozzle straight down into the central leaf whorl. Standard surface spray is ineffective."
        },
        preventiveTips: [
          "Seed treatment with Cyantraniliprole 19.8% + Thiamethoxam 19.8% FS (4 ml/kg seed).",
          "Intercrop with desmodium or cowpea (Push-Pull technique)."
        ]
      }
    ]
  }
];

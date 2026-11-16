/**
 * Authoritative Agricultural Knowledge Base
 * Sourced from ICAR (Indian Council of Agricultural Research), State Agricultural Universities (SAUs),
 * Krishi Vigyan Kendras (KVKs), and Government of India Agricultural Portals (agricoop.nic.in, agritech.tnau.ac.in).
 */

export interface KnowledgeDocument {
  id: string;
  title: string;
  source: string;
  crop: string;
  category: 'crop_disease' | 'pest_management' | 'fertilizer' | 'nutrient_deficiency' | 'irrigation' | 'sowing' | 'seed_selection' | 'weed_management' | 'harvesting' | 'crop_management' | 'weather_related' | 'government_scheme' | 'general_agriculture';
  language: string;
  pageNumber?: number;
  content: string;
  createdAt: string;
  author: string;
  referenceUrl?: string;
}

export const INITIAL_KNOWLEDGE_DOCS: KnowledgeDocument[] = [
  // 1. PADDY / RICE
  {
    id: "doc-paddy-01",
    title: "ICAR Package of Practices for Rice (Paddy) - Blast and Bacterial Leaf Blight Management",
    source: "ICAR - National Rice Research Institute (NRRI) & TNAU Agritech Portal",
    crop: "Paddy",
    category: "crop_disease",
    language: "en",
    pageNumber: 14,
    author: "Division of Crop Protection, ICAR-NRRI Cuttack",
    createdAt: "2026-01-10T00:00:00.000Z",
    content: `Rice Blast (Magnaporthe oryzae / Pyricularia oryzae):
Symptoms: Spindle-shaped or eye-shaped lesions with greyish center and dark brown or reddish-brown margin on leaf blades. Can attack leaf (Leaf Blast), node (Node Blast), or neck of panicle (Neck Blast leading to chaffy grains).
Favorable Conditions: High relative humidity (>90%), intermittent drizzles, cloudy weather, high doses of Nitrogen fertilizer (>120 kg N/ha), and night temperatures of 20-24°C.
Management & Recommendations:
1. Cultural: Avoid excessive nitrogenous fertilizers. Apply nitrogen in 3-4 splits (basal, tillering, panicle initiation).
2. Resistant Varieties: Cultivate resistant varieties like IR-64, Swarna Sub-1, MTU 1010, RGL 2537.
3. Chemical Treatment:
   - Seed treatment with Tricyclazole 75% WP @ 2 g/kg seed or Carbendazim 50% WP @ 2 g/kg seed.
   - Foliar Spray: Spray Tricyclazole 75% WP @ 0.6 g/litre of water (120 g/acre in 200 L water) OR Isoprothiolane 40% EC @ 1.5 ml/litre OR Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/litre upon early symptom noticing. Repeat after 12-15 days if cloudy/wet weather persists.
Precautions: Do not spray during peak noon heat or imminent rains. Maintain 5 cm standing water layer in paddy field during spraying.`
  },
  {
    id: "doc-paddy-02",
    title: "Bacterial Leaf Blight (BLB) & Brown Leaf Spot in Paddy",
    source: "Directorate of Rice Research (ICAR-IIRR) Hyderabad",
    crop: "Paddy",
    category: "crop_disease",
    language: "en",
    pageNumber: 22,
    author: "ICAR - Indian Institute of Rice Research",
    createdAt: "2026-01-12T00:00:00.000Z",
    content: `Bacterial Leaf Blight (Xanthomonas oryzae pv. oryzae):
Symptoms: Water-soaked translucent streaks from leaf tips or margins progressing downwards into yellow-to-straw-colored wavy blighted lesions. Milky bacterial ooze droplets visible on cut leaves placed in clear water (turbidity test).
Management:
1. Agronomic: Drain excess water from fields for 3-4 days if severe. Avoid clipping seedlings during transplantation.
2. Nitrogen Regulation: Postpone top-dressing of Urea until blight subsides; apply Potash (MOP) @ 15-20 kg/acre to bolster plant cell wall resistance.
3. Spray Treatment: Copper Hydroxide 77% WP @ 2 g/litre + Streptocycline (Streptomycin sulphate + Tetracycline) @ 0.1 g/litre (6 g in 60 L water per half acre). Repeat after 10 days.
4. Bio-control: Foliar spray of Pseudomonas fluorescens @ 5 g/litre or 1 kg/acre in 200 L water.`
  },
  {
    id: "doc-paddy-03",
    title: "Paddy Insect Pest Management: Brown Plant Hopper (BPH) & Stem Borer",
    source: "ICAR - Indian Agricultural Research Institute (IARI)",
    crop: "Paddy",
    category: "pest_management",
    language: "en",
    pageNumber: 8,
    author: "Division of Entomology, ICAR-IARI",
    createdAt: "2026-01-15T00:00:00.000Z",
    content: `Brown Plant Hopper (Nilaparvata lugens) - 'Hopper Burn':
Symptoms: Both nymphs and adults suck sap from base of tillers causing plants to dry up in circular patches ('hopper burn'), appearing as dried brownish patches across field.
Economic Threshold Level (ETL): 1-2 hoppers per hill in tillering stage; 2-5 hoppers per hill at flowering stage.
Management:
1. Create alleyways ('alley formation' or 'padas') of 30 cm after every 2 meters to allow sunlight and aerate crop canopy.
2. Drain field water intermittently (alternate wetting and drying - AWD) to disrupt hopper multiplication.
3. Chemical Control (direct spray towards base of the plants):
   - Pymetrozine 50% WDG @ 0.6 g/litre (120 g/acre) OR Triflumezopyrim 10% SC @ 0.5 ml/litre (94 ml/acre) OR Dinotefuran 20% SG @ 0.4 g/litre (80 g/acre).
   - Avoid synthetic pyrethroids (Cypermethrin/Deltamethrin) as they induce resurgence of BPH.
Stem Borer (Scirpophaga incertulas):
Symptoms: 'Dead hearts' at vegetative stage (central shoot dries and easily pulls out) and 'White ears' (empty chaffy white panicles) at reproductive stage.
Control: Cartap Hydrochloride 4G @ 7-8 kg/acre broadcast in standing water or Chlorantraniliprole 18.5% SC (Coragen) @ 0.3 ml/litre (60 ml/acre in 200 L water).`
  },
  {
    id: "doc-paddy-04",
    title: "Nutrient Deficiencies (Zinc & Nitrogen) and Fertilizer Schedule for Paddy",
    source: "Department of Agriculture & Farmers Welfare, Ministry of Agriculture, GoI",
    crop: "Paddy",
    category: "nutrient_deficiency",
    language: "en",
    pageNumber: 5,
    author: "Soil Health Division, GoI",
    createdAt: "2026-01-18T00:00:00.000Z",
    content: `Zinc Deficiency ('Khaira Disease' in Paddy):
Symptoms: Rusty brown or bronze pigmentation appearing on leaves 2-3 weeks after transplanting. Interveinal chlorosis starting from middle leaves, stunted growth, reduced tillering. Common in alkaline and submerged soils.
Correction:
- Soil Application: Zinc Sulphate (21% Zn) @ 10-12 kg/acre at final puddling.
- Foliar Correction (Standing Crop): Dissolve Zinc Sulphate (21% or 33%) @ 5 g/litre + 10 g Urea/litre of water (or 1 kg ZnSO4 + 2 kg Urea in 200 litres water per acre). Spray twice at 7-10 day interval.
Fertilizer Schedule for Medium Duration Rice (NPK 120:60:60 kg/ha):
- Basal: Entire P2O5 (SSP 150 kg/acre or DAP 50 kg/acre) + 25% Nitrogen (Urea 25 kg/acre) + 50% Potash (MOP 20 kg/acre).
- Tillering Stage (20-25 DAT): 50% Nitrogen (Urea 45 kg/acre).
- Panicle Initiation Stage (40-45 DAT): 25% Nitrogen (Urea 25 kg/acre) + Remaining 50% Potash (MOP 20 kg/acre).`
  },

  // 2. COTTON
  {
    id: "doc-cotton-01",
    title: "ICAR-CICR Advisory on Pink Bollworm and Whitefly Management in Cotton",
    source: "ICAR - Central Institute for Cotton Research (CICR) Nagpur",
    crop: "Cotton",
    category: "pest_management",
    language: "en",
    pageNumber: 12,
    author: "Crop Protection Section, ICAR-CICR",
    createdAt: "2026-01-20T00:00:00.000Z",
    content: `Pink Bollworm (Pectinophora gossypiella):
Symptoms: Rosetted flowers (petals twisted into rosette), premature boll opening, stained lint, hole bored in developing bolls plugged with excreta.
Monitoring: Install Pheromone Traps @ 2 traps/acre with Gossyplure lure; monitor moth catch weekly. ETL is 8 moths/trap/night for 3 consecutive days or 10% rosette flowers / green boll damage.
Control Measures:
1. Install pheromone traps for mass trapping @ 8-10 traps/acre.
2. At 60-90 DAS: Spray Neem oil (1500 ppm Azadirachtin) @ 5 ml/litre or Profenofos 50% EC @ 2 ml/litre.
3. At 90-120 DAS: Emamectin Benzoate 5% SG @ 0.4 g/litre (80 g/acre) OR Chlorantraniliprole 18.5% SC @ 0.3 ml/litre (60 ml/acre).
4. Do not extend cotton ratoon crop beyond January to break the pest life cycle.
Whitefly (Bemisia tabaci) & Cotton Leaf Curl Virus (CLCuD):
Symptoms: Yellowing of leaves, downward curling, sticky honey dew excretion leading to black sooty mold. Whitefly transmits Leaf Curl Virus.
Control: Install yellow sticky traps @ 10-15 traps/acre. Spray Diafenthiuron 50% WP @ 1.2 g/litre OR Pyriproxyfen 10% EC @ 2 ml/litre OR Spiromesifen 22.9% SC @ 1 ml/litre.`
  },
  {
    id: "doc-cotton-02",
    title: "Nutrient Deficiencies (Potassium & Magnesium) and Parawilt in Cotton",
    source: "Prof. Jayashankar Telangana State Agricultural University (PJTSAU)",
    crop: "Cotton",
    category: "nutrient_deficiency",
    language: "en",
    pageNumber: 18,
    author: "Agronomy Department, PJTSAU",
    createdAt: "2026-01-22T00:00:00.000Z",
    content: `Potassium Deficiency & Reddening of Cotton Leaves:
Symptoms: Yellowish-bronze chlorosis between veins, leaf margins curling downward, transforming into dark reddish-purple tint during peak boll development stage when K demand is high.
Correction: Foliar spray of Potassium Nitrate (13-0-45) @ 10 g/litre (2 kg in 200 L water per acre) or Sulphate of Potash (0-0-50) @ 10 g/litre at 60, 75, and 90 DAS.
Magnesium Deficiency (Reddening in Lower Leaves):
Symptoms: Interveinal purplish-red discoloration on older leaves while veins remain green.
Correction: Foliar spray of Magnesium Sulphate (MgSO4) @ 10 g/litre (1%) twice at 15-day intervals during squaring and boll formation.
Parawilt / Sudden Drooping of Cotton:
Symptoms: Sudden wilting and leaf drooping 24-48 hours after heavy rainfall or irrigation followed by bright sunshine.
Management: Drain water immediately. Spray Cobalt Chloride @ 10 ppm (10 mg/L) or Copper Oxychloride 50% WP @ 3 g/litre + Urea 10 g/litre to roots and base.`
  },

  // 3. MAIZE
  {
    id: "doc-maize-01",
    title: "ICAR-IIMR Integrated Management of Fall Armyworm (FAW) in Maize",
    source: "ICAR - Indian Institute of Maize Research (IIMR) Ludhiana",
    crop: "Maize",
    category: "pest_management",
    language: "en",
    pageNumber: 6,
    author: "Entomology Division, ICAR-IIMR",
    createdAt: "2026-01-25T00:00:00.000Z",
    content: `Fall Armyworm (Spodoptera frugiperda):
Symptoms: Elongated papery feeding windows on leaves, ragged shot holes, extensive faecal pellets (sawdust-like frass) inside the central whorl of maize plants. Larvae feed aggressively on growing shoot apex.
Integrated Management:
1. Early Sowing: Synchronized sowing within the village to prevent continuous pest food supply.
2. Intercropping: Maize + Cowpea or Pigeonpea (2:1 or 4:1) to boost natural predators.
3. Egg/Larval scouting: Install Pheromone traps @ 4 traps/acre.
4. Chemical / Biopesticide Whorl Application:
   - Early vegetative stage (1-20 days): Spray Bacillus thuringiensis (Bt) kurstaki @ 2 g/litre OR Azadirachtin 1500 ppm @ 5 ml/litre.
   - Mid vegetative stage (20-40 days): Chlorantraniliprole 18.5% SC @ 0.4 ml/litre directed into whorl OR Emamectin Benzoate 5% SG @ 0.4 g/litre (80 g/acre) OR Spinetoram 11.7% SC @ 0.5 ml/litre.
   - Apply sand + lime mixture (9:1) or dry soil in the whorls to physically suffocate young larvae.`
  },
  {
    id: "doc-maize-02",
    title: "Turcicum Leaf Blight, Stalk Rot & Zinc Nutrition in Maize",
    source: "ICAR - Indian Agricultural Research Institute (IARI)",
    crop: "Maize",
    category: "crop_disease",
    language: "en",
    pageNumber: 15,
    author: "Plant Pathology Department, ICAR",
    createdAt: "2026-01-28T00:00:00.000Z",
    content: `Turcicum Leaf Blight (Exserohilum turcicum):
Symptoms: Long, elliptical, grayish-green to tan lesions (boat-shaped) on leaves, coalescing and giving a burnt appearance to the foliage. Reduces photosynthesis drastically during grain filling.
Management: Spray Mancozeb 75% WP @ 2.5 g/litre OR Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/litre upon first appearance of boat-shaped lesions.
Post-Flowering Stalk Rot (Macrophomina phaseolina / Fusarium):
Symptoms: Premature drying of plants, internal pith decay, stalk disintegration, rotting of lower internodes.
Prevention: Avoid moisture stress during silking and grain filling; ensure balanced N:K ratio (avoid excess Nitrogen with zero Potassium).
Zinc Deficiency in Maize ('White Bud'):
Symptoms: Broad bleached band of white/light yellow tissue on both sides of midrib on younger leaves while leaf tip and margins remain green.
Correction: Foliar spray of Zinc Sulphate @ 5 g/litre + Urea 10 g/litre at 20 and 35 days after sowing.`
  },

  // 4. GROUNDNUT (PEANUT)
  {
    id: "doc-groundnut-01",
    title: "Tikka Leaf Spot, Rust, and Gypsum Requirement in Groundnut",
    source: "ICAR - Directorate of Groundnut Research (DGR) Junagadh",
    crop: "Groundnut",
    category: "crop_disease",
    language: "en",
    pageNumber: 9,
    author: "Agronomy & Pathology Section, ICAR-DGR",
    createdAt: "2026-02-01T00:00:00.000Z",
    content: `Tikka Leaf Spot (Early & Late Leaf Spot - Cercospora arachidicola / Cercosporidium personatum):
Symptoms:
- Early Spot: Circular reddish-brown spots with prominent bright yellow halo around them.
- Late Spot: Nearly circular small black spots without yellow halos, predominantly on lower leaf surfaces causing severe defoliation.
Rust (Puccinia arachidis):
Symptoms: Small orange-brown pustules on underside of leaves, bursting to release rusty brown spores.
Combined Tikka & Rust Chemical Management:
- Spray Tebuconazole 25.9% EC @ 1 ml/litre OR Hexaconazole 5% EC @ 2 ml/litre OR Mancozeb 75% WP @ 2 g/litre + Carbendazim 50% WP @ 1 g/litre in 200 litres water per acre at 40 and 60 DAS.
Gypsum Application (Critical for Pod Filling and Shell Formation):
Groundnut requires Calcium for peg development and pod shell hardening (prevents 'pops' or empty shells) and Sulphur for oil synthesis.
Recommendation: Apply Gypsum @ 200 kg/acre at 40-45 DAS (pegging initiation stage). Broadcast near root zone and incorporate lightly with hoeing followed by light irrigation.`
  },

  // 5. CHILLI
  {
    id: "doc-chilli-01",
    title: "Chilli Leaf Curl Complex (Thrips, Mites & Virus) and Anthracnose/Die-back",
    source: "ICAR - Indian Institute of Horticultural Research (IIHR) Bengaluru",
    crop: "Chilli",
    category: "pest_management",
    language: "en",
    pageNumber: 21,
    author: "Division of Vegetable Crops, ICAR-IIHR",
    createdAt: "2026-02-03T00:00:00.000Z",
    content: `Chilli Leaf Curl Complex Diagnosis:
1. Thrips (Scirtothrips dorsalis): Leaves curl upward (boat-shaped cup upward), brittle, bronzed underside, crinkled margins.
   - Management: Fipronil 5% SC @ 1.5 ml/litre OR Spinetoram 11.7% SC @ 1 ml/litre OR Acetamiprid 20% SP @ 0.3 g/litre.
2. Yellow Mites (Polyphagotarsonemus latus): Leaves curl downward (inverted cup), thickened, elongated like rat-tail, dark green and brittle.
   - Management: Spiromesifen 22.9% SC @ 1 ml/litre OR Diafenthiuron 50% WP @ 1.2 g/litre OR Wettable Sulphur 80% WP @ 3 g/litre.
3. Chilli Leaf Curl Gemini Virus (Transmitted by Whiteflies): Severe puckering, stunted bushy growth, yellow mosaic.
   - Management: Roguing infected plants; install yellow sticky traps; control whiteflies with Pyriproxyfen 10% EC @ 1.5 ml/litre.
Anthracnose & Fruit Rot (Die-back) (Colletotrichum capsici):
Symptoms: Tips of branches die downwards (die-back). Circular sunken black lesions with concentric rings of acervuli on ripe fruits.
Management: Spray Azoxystrobin 23% SC @ 1 ml/litre OR Tebuconazole 50% + Trifloxystrobin 25% WG (Nativo) @ 0.6 g/litre OR Copper Oxychloride 50% WP @ 2.5 g/litre.`
  },

  // 6. TOMATO
  {
    id: "doc-tomato-01",
    title: "Tomato Early & Late Blight, Leaf Curl, and Blossom End Rot Management",
    source: "ICAR - Indian Agricultural Research Institute (IARI)",
    crop: "Tomato",
    category: "crop_disease",
    language: "en",
    pageNumber: 17,
    author: "Division of Horticulture, ICAR",
    createdAt: "2026-02-05T00:00:00.000Z",
    content: `Early Blight (Alternaria solani):
Symptoms: Dark brown concentric rings forming a 'target-board' pattern on older leaves, yellowing halos, stem cankers, collar rot.
Control: Mancozeb 75% WP @ 2.5 g/litre OR Chlorothalonil 75% WP @ 2 g/litre OR Difenoconazole 25% EC @ 0.5 ml/litre.
Late Blight (Phytophthora infestans):
Symptoms: Large water-soaked oily grayish-green lesions rapidly expanding under cool, wet weather; white downy mildew fluff on leaf underside; dark brown sunken firm rot on fruits.
Control: Metalaxyl 8% + Mancozeb 64% WP (Ridomil MZ) @ 2.5 g/litre OR Dimethomorph 50% WP @ 1 g/litre + Mancozeb @ 2 g/litre.
Blossom End Rot (Physiological - Calcium Deficiency & Water Fluctuations):
Symptoms: Water-soaked spot at blossom end of fruit turning dark brown, leathery and flat.
Correction: Maintain uniform soil moisture (avoid extreme dry-wet cycles); foliar spray of Calcium Nitrate @ 5 g/litre + Boron @ 1 g/litre during fruit set.`
  },

  // 7. BANANA
  {
    id: "doc-banana-01",
    title: "Panama Wilt, Sigatoka Leaf Spot, and Pseudostem Borer in Banana",
    source: "ICAR - National Research Centre for Banana (NRCB) Tiruchirappalli",
    crop: "Banana",
    category: "crop_disease",
    language: "en",
    pageNumber: 11,
    author: "ICAR - NRC for Banana",
    createdAt: "2026-02-08T00:00:00.000Z",
    content: `Panama Wilt (Fusarium oxysporum f. sp. cubense / TR4):
Symptoms: Yellowing of lower leaves beginning from margins, buckling of petiole at junction of pseudostem ('skirt of dead leaves' hanging down), longitudinal splitting of pseudostem base, vascular discoloration (reddish-brown streaks in cut corm).
Management:
- Plant disease-free tissue culture suckers or resistant Cavendish varieties.
- Apply Trichoderma viride or T. harzianum @ 50 g mixed with 5 kg FYM per pit at planting.
- Sucker dip in Carbendazim 0.1% (1 g/L) before planting; drench affected plant basin with Carbendazim 50% WP @ 2 g/litre.
Sigatoka Leaf Spot (Mycosphaerella musicola / fijiensis):
Symptoms: Small yellow streaks parallel to leaf veins enlarging into oval dark brown lesions with grayish centers, causing premature leaf drying.
Control: Spray Mineral Oil (Banana spray oil) @ 10 ml/L + Propiconazole 25% EC @ 1 ml/litre OR Trifloxystrobin + Tebuconazole @ 0.6 g/litre. Remove and burn severely spotted lower leaves.
Pseudostem Borer (Odoiporus longicollis):
Control: Swab stem with Chlorpyrifos 20% EC @ 2.5 ml/L; inject stem with Monocrotophos / Chlorpyrifos or insert Beauveria bassiana biocontrol traps.`
  },

  // 8. MANGO
  {
    id: "doc-mango-01",
    title: "Mango Hopper, Powdery Mildew, Anthracnose, and Fruit Drop Management",
    source: "ICAR - Central Institute for Subtropical Horticulture (CISH) Lucknow",
    crop: "Mango",
    category: "pest_management",
    language: "en",
    pageNumber: 25,
    author: "Crop Protection Division, ICAR-CISH",
    createdAt: "2026-02-10T00:00:00.000Z",
    content: `Mango Hopper (Idioscopus clypealis / Amritodus atkinsoni):
Symptoms: Nymphs and adults suck sap from tender inflorescence/panicles and flush leaves, causing floral drying and heavy blossom drop. Secrete honeydew attracting sooty mold on panicles and fruits.
Management:
- First Spray (at panicle emergence stage): Thiamethoxam 25% WG @ 0.3 g/litre OR Imidacloprid 17.8% SL @ 0.4 ml/litre.
- Second Spray (after fruit set when mustard-size): Buprofezin 25% SC @ 1 ml/litre OR Chlorpyrifos 20% EC @ 2 ml/litre.
Powdery Mildew (Oidium mangiferae):
Symptoms: White powdery fungal growth covering panicles, flowers, and fruitlets, resulting in failure of fruit set and blossom drop.
Control: Spray Hexaconazole 5% EC @ 1 ml/litre OR Wettable Sulphur 80% WP @ 3 g/litre OR Dinocap 48% EC @ 1 ml/litre at panicle emergence.
Mango Anthracnose (Colletotrichum gloeosporioides):
Symptoms: Black tear-stain lesions on leaves, twig die-back, dark spots on expanding mango fruits leading to post-harvest rotting.
Control: Prune dried twigs and spray Copper Oxychloride @ 3 g/litre or Azoxystrobin @ 1 ml/litre.`
  },

  // GOVERNMENT AGRICULTURAL SCHEMES
  {
    id: "doc-govt-01",
    title: "Government of India Agricultural Schemes: PM-KISAN, PMFBY Crop Insurance & Soil Health Card",
    source: "Ministry of Agriculture & Farmers Welfare, Government of India (pmkisan.gov.in / pmfby.gov.in)",
    crop: "General Agriculture",
    category: "government_scheme",
    language: "en",
    pageNumber: 1,
    author: "Department of Agriculture & Farmers Welfare (DA&FW)",
    createdAt: "2026-02-12T00:00:00.000Z",
    content: `1. Pradhan Mantri Kisan Samman Nidhi (PM-KISAN):
- Financial benefit of ₹6,000 per year transferred directly to landholding farmer families in 3 equal four-monthly installments of ₹2,000 each.
- Eligibility: All landholding farmer families with cultivable land in their names (subject to exclusion criteria like institutional landholders, income tax payers).
- Mandatory: Aadhaar seeding with bank account, eKYC completion on pmkisan.gov.in portal.

2. Pradhan Mantri Fasal Bima Yojana (PMFBY) - Crop Insurance:
- Premium Rate: Only 2% of sum insured for Kharif crops (Paddy, Cotton, Maize, Groundnut), 1.5% for Rabi crops (Wheat, Mustard), and 5% for Annual Horticultural/Commercial crops (Chilli, Tomato, Banana, Mango).
- Coverage: Prevented sowing, mid-season localized adversity (hailstorm, cloudburst, landslide, flood), post-harvest losses (up to 14 days), yield deficit based on Crop Cutting Experiments (CCEs).
- Claim Intimation: Must be reported within 72 hours of localized calamity via Crop Insurance App or toll-free 14447.

3. Soil Health Card Scheme (SHC):
- Provides farmers with comprehensive soil nutrient status report (12 parameters: N, P, K, S, Zn, Fe, Cu, Mn, Bo, pH, EC, Organic Carbon) every 3 years with customized fertilizer dosage recommendations to reduce input costs.

4. Pradhan Mantri Krishi Sinchayee Yojana (PMKSY) - 'Per Drop More Crop':
- Subsidies up to 45-55% for small and marginal farmers on Drip Irrigation and Sprinkler systems.`
  }
];

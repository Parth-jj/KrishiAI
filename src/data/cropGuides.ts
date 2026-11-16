export interface SprayRemedy {
  id: string;
  problemName: string;
  regionalName: {
    hi: string;
    te: string;
  };
  type: 'disease' | 'pest' | 'nutrition' | 'weed';
  stage: string;
  symptoms: string[];
  visualIndicators: string;
  organicRemedy: {
    title: string;
    dosage: string;
    instructions: string;
  };
  chemicalRemedy: {
    activeIngredient: string;
    perLiterDosage: string;
    perPumpDosage: string; // for standard 15L-16L knapsack sprayer
    waitingPeriodDays: number;
    safetyNote: string;
  };
  preventiveTips: string[];
}

export interface CropGuideItem {
  id: string;
  name: string;
  icon: string;
  scientificName: string;
  popularVarieties: string[];
  idealSoil: string;
  criticalStages: string[];
  sprayGuides: SprayRemedy[];
}

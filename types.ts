
export interface AnalysisResult {
  summary: string;
  whatItMeans: string;
  deadlinesAndCosts: string[];
  actionChecklist: string[];
  glossary: Array<{ term: string; meaning: string }>;
}

export interface TranslationHistoryItem {
  id: string;
  timestamp: number;
  originalText: string;
  result: AnalysisResult;
}

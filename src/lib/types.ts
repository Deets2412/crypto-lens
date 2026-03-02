// ============================================================
// AI Debrief — Type Definitions
// ============================================================

export interface NewsArticle {
  id: string;
  title: string;
  body: string;
  url: string;
  imageurl: string;
  source: string;
  published_on: number;
}

export interface FilteredArticle extends NewsArticle {
  passedFilter: boolean;
  filterReason?: string;
}

export interface SummarizedArticle extends FilteredArticle {
  plainEnglishSummary: string;
}

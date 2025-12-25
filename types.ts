
export type LinkProvider = 
  | 'short.gy' 
  | 'bit.ly' 
  | 'tinyurl.com' 
  | 'is.gd' 
  | 't.co' 
  | 'rebrandly.com' 
  | 'buff.ly'
  | 't2mio.com';

export interface ShortenedLink {
  id: string;
  originalUrl: string;
  shortUrl: string;
  alias: string;
  summary: string;
  provider: LinkProvider;
  createdAt: number;
  expiresAt?: number; // Optional now, since we are removing auto-expiration
}

export interface SmartSuggestion {
  alias: string;
  description: string;
}

export interface GeminiAnalysisResponse {
  suggestions: SmartSuggestion[];
  summary: string;
}

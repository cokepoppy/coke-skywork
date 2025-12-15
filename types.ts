export interface Message {
  role: 'user' | 'model';
  content: string;
  isError?: boolean;
  groundingMetadata?: GroundingMetadata;
}

export interface GroundingMetadata {
  groundingChunks?: {
    web?: {
      uri: string;
      title: string;
    };
  }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview', // For "Deep Thinking" simulation
}

export enum SearchMode {
  OFF = 'off',
  ON = 'on'
}

// PPT Generation Types
export interface SlideDeck {
  topic: string;
  theme?: string;
  generatedImage?: string; // Base64 image data
}
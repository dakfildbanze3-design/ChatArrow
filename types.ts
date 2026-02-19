
export type Role = 'user' | 'model';

export interface GroundingUrl {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
  images?: string[]; // Array de strings base64 ou URLs
  groundingUrls?: GroundingUrl[]; // Fontes vindas do Google Search
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  category?: string;
  systemInstruction?: string;
  lastUpdated: Date;
}

export interface ChatState {
  currentId: string;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentSystemInstruction?: string;
  activeCategory?: string;
  conversations: Conversation[];
}

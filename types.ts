
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
  usage?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  model?: string;
  responseTime?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  category?: string;
  systemInstruction?: string;
  lastUpdated: Date;
}

export interface AppSettings {
  account: {
    name: string;
    photo: string;
    email: string;
  };
  ai: {
    language: 'Português' | 'Inglês';
    style: 'Formal' | 'Casual' | 'Técnico' | 'Motivador';
    length: 'Curta' | 'Média' | 'Longa';
    emojis: boolean;
    personality: 'Conselheiro' | 'Professor' | 'Programador' | 'Amigo' | 'Coach' | 'Engraçado';
  };
  model: {
    default: string;
    mode: 'Criativo' | 'Preciso';
    memory: boolean;
  };
  privacy: {
    saveHistory: boolean;
  };
  appearance: {
    theme: 'Claro' | 'Escuro';
    primaryColor: string;
    fontSize: number;
  };
  notifications: {
    newResponse: boolean;
    push: boolean;
    sounds: boolean;
  };
  plan: 'Free' | 'Premium';
  advanced: {
    showTokens: boolean;
    showTime: boolean;
    showModel: boolean;
  };
}

export interface ChatState {
  currentId: string;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentSystemInstruction?: string;
  activeCategory?: string;
  conversations: Conversation[];
  settings: AppSettings;
  showSettings: boolean;
}

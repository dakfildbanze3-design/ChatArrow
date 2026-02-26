
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
  plan: string;
  subscription?: Subscription;
  advanced: {
    showTokens: boolean;
    showTime: boolean;
    showModel: boolean;
  };
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration_days: number;
  features: string[];
  description: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  price: number;
  payment_method: 'mpesa' | 'emola';
  status: 'pending' | 'paid' | 'failed';
  transaction_reference: string;
  phone_number: string;
  created_at: Date;
  expires_at: Date | null;
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
  isAnalyzingImage?: boolean;
}

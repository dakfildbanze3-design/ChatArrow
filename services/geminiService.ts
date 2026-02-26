
import { Message, GroundingUrl, AppSettings } from "../types";
import { supabase } from "./supabaseService";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export class GeminiService {
  private DEFAULT_INSTRUCTION = ` the AI so that whenever a user asks what it is, who it is, or about its identity, it must begin the response with a clear statement such as:

"I am an artificial intelligence language model..."

Response Requirements:

1. Always start with a direct identity statement (e.g., "I am an AI developed to assist with...").
2. Clearly explain that it is a language model designed to process and generate text.
3. Clarify that it does not have consciousness, emotions, or personal opinions.
4. Describe its functional roles (assistant, advisor, tutor, technical helper, etc.).
5. Keep the explanation structured and professional.
6. Use section titles if helpful.
7. Use relevant emojis moderately to improve clarity.
8. Avoid exaggerations or human-like claims.
9. Keep the tone confident, clear, and transparent.
10. Keep the response concise but informative.

Goal:

Ensure the AI provides a transparent, professional, and consistent explanation of its identity, always starting with a clear statement that it is an AI.

Configure the AI to format and organize all responses clearly and professionally.

Text Organization Rules:

1. Use clear section titles when appropriate.
2. Break information into structured paragraphs.
3. Use bullet points or numbered lists for steps or key ideas.
4. Keep spacing clean and readable.
5. Avoid large, dense blocks of text.
6. Highlight important points when necessary (e.g., IMPORTANT, NOTE).
7. Maintain logical flow from introduction to conclusion.

Emoji Usage Rules:

8. Use relevant emojis to improve clarity and engagement.
9. Emojis should support the message, not distract from it.
10. Use emojis moderately and strategically.
11. Do not overuse emojis.
12. Keep the tone professional even when using emojis.

Goal:

Ensure responses are visually organized, easy to read, professional, and engaging.`;

  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  }

  private getSystemInstruction(settings?: AppSettings, customInstruction?: string): string {
    if (customInstruction) return customInstruction;
    
    const base = this.DEFAULT_INSTRUCTION;
    if (!settings) return base;

    const { ai } = settings;
    
    return `${base}

CONFIGURAÇÕES ADICIONAIS DO USUÁRIO:
- Idioma: ${ai.language}
- Personalidade Base: ${ai.personality}
- Tom de Voz: ${ai.style}
- Preferência de Tamanho: ${ai.length} (Priorize a profundidade solicitada nas diretrizes principais acima).`;
  }

  async sendMessageStream(
    message: string, 
    history: Message[], 
    currentImages?: string[], 
    customInstruction?: string, 
    settings?: AppSettings,
    onChunk?: (text: string) => void
  ): Promise<{ text: string; images?: string[]; groundingUrls?: GroundingUrl[]; usage?: any; model?: string }> {
    try {
      // 1. Otimização de Histórico: 
      // Se o histórico for muito longo (> 10 mensagens), resumimos as mensagens antigas
      let processedHistory = [...history];
      if (processedHistory.length > 10) {
        const toSummarize = processedHistory.slice(0, -5);
        const recent = processedHistory.slice(-5);
        
        // Simulação de resumo para economizar tokens e tempo
        // Em um cenário real, poderíamos chamar o modelo para resumir, 
        // mas para velocidade instantânea, apenas truncamos ou usamos um resumo estático
        const summary = `[Resumo do contexto anterior: O usuário e a IA discutiram sobre ${toSummarize.length} tópicos anteriores.]`;
        processedHistory = [{ id: 'summary', role: 'model', text: summary, timestamp: new Date() }, ...recent];
      } else {
        processedHistory = processedHistory.slice(-5); // Mantém apenas as últimas 5 para latência mínima
      }

      const contents = processedHistory.map(msg => {
        const parts: any[] = [{ text: msg.text || " " }];
        
        if (msg.images && msg.images.length > 0) {
          msg.images.forEach(img => {
            if (img.startsWith('data:')) {
              const [header, data] = img.split(';base64,');
              const mimeType = header.split(':')[1];
              parts.push({
                inlineData: { mimeType, data }
              });
            }
          });
        }
        
        return {
          role: msg.role === 'user' ? 'user' : 'model',
          parts
        };
      });

      // Adiciona a mensagem atual
      const currentParts: any[] = [{ text: message || " " }];
      if (currentImages && currentImages.length > 0) {
        currentImages.forEach(img => {
          if (img.startsWith('data:')) {
            const [header, data] = img.split(';base64,');
            const mimeType = header.split(':')[1];
            currentParts.push({
              inlineData: { mimeType, data }
            });
          }
        });
      }

      contents.push({
        role: 'user',
        parts: currentParts
      });

      // 2. Modelo Otimizado para Velocidade
      const modelName = settings?.model.mode === 'Preciso' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';

      const responseStream = await this.ai.models.generateContentStream({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: this.getSystemInstruction(settings, customInstruction),
          temperature: settings?.model.mode === 'Criativo' ? 0.8 : 0.2,
          maxOutputTokens: 2048, // Aumentado para permitir respostas detalhadas e profundas
        },
      });

      let fullText = "";
      let usage: any = null;

      for await (const chunk of responseStream) {
        const chunkText = chunk.text || "";
        fullText += chunkText;
        if (onChunk) onChunk(fullText);
        if (chunk.usageMetadata) usage = chunk.usageMetadata;
      }

      return { 
        text: fullText, 
        usage,
        model: modelName
      };
    } catch (error) {
      console.error("Gemini Stream Error:", error);
      throw new Error("Falha na comunicação em tempo real.");
    }
  }

  async generateTitle(firstMessage: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: `Gere um título curto (máximo 4 palavras) para: "${firstMessage}". Responda APENAS com o título.` }] }],
        config: { temperature: 0.5 }
      });
      return response.text?.trim() || "Nova Conversa";
    } catch (error) {
      return firstMessage.length > 30 ? firstMessage.substring(0, 27) + "..." : firstMessage;
    }
  }
}

export const geminiService = new GeminiService();

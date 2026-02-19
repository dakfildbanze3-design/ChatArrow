
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, GroundingUrl } from "../types";

export class GeminiService {
  private DEFAULT_INSTRUCTION = `Você é um assistente inteligente, claro e organizado.

Regras:
- Responda de forma curta e direta.
- Use alguns emojis quando fizer sentido 😊
- Não escreva textos muito longos.
- Organize a resposta com pequenas divisões (---).
- Seja claro, útil e objetivo.
- Você DEVE dividir temas diferentes usando títulos de Markdown (## Título do Tema).
- Se o usuário pedir para gerar uma imagem, responda confirmando o que irá criar.
- Nunca use balões de fala.`;

  constructor() {}

  private isImageRequest(text: string): boolean {
    const keywords = ['gerar imagem', 'crie uma imagem', 'desenhe', 'mostre uma imagem', 'foto de', 'imagem de', 'generate image', 'create image'];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  async sendMessage(message: string, history: Message[], customInstruction?: string): Promise<{ text: string; images?: string[]; groundingUrls?: GroundingUrl[] }> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let images: string[] = [];
      let responseText = "";
      let groundingUrls: GroundingUrl[] = [];

      // Se for pedido de imagem, gerar imagens primeiro
      if (this.isImageRequest(message)) {
        const countMatch = message.match(/\b(1|2|3)\b/);
        const count = countMatch ? parseInt(countMatch[0]) : 1;
        
        const imagePromises = Array.from({ length: Math.min(count, 3) }).map(() => 
          ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: message }] }
          })
        );

        const results = await Promise.all(imagePromises);
        results.forEach(res => {
          for (const part of res.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            }
          }
        });
        
        responseText = images.length > 0 
          ? `Com certeza! Gereis ${images.length} imagem(ns) baseada(s) no seu pedido: "${message}".`
          : "Tentei gerar as imagens, mas não consegui no momento.";
      }

      // Chamada para o modelo de texto com Google Search Grounding
      const textResponse: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        })).concat([{ role: 'user', parts: [{ text: message }] }]),
        config: {
          systemInstruction: customInstruction || this.DEFAULT_INSTRUCTION,
          temperature: 0.7,
          tools: [{ googleSearch: {} }] // Ativa busca no Google
        }
      });

      // Extrair metadados de grounding (URLs)
      const groundingChunks = textResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        groundingUrls = groundingChunks
          .filter(chunk => chunk.web)
          .map(chunk => ({
            title: chunk.web?.title || 'Fonte',
            uri: chunk.web?.uri || ''
          }))
          .filter(item => item.uri !== '');
      }

      return { 
        text: images.length > 0 ? responseText : (textResponse.text || "Sem resposta."), 
        images: images.length > 0 ? images : undefined,
        groundingUrls: groundingUrls.length > 0 ? groundingUrls : undefined
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Falha na comunicação com a IA.");
    }
  }
}

export const geminiService = new GeminiService();

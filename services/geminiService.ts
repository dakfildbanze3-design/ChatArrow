
import { Message, GroundingUrl, AppSettings } from "../types";
import { supabase } from "./supabaseService";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GLOBAL_AI_INSTRUCTION } from "../constants";

export class GeminiService {
  private DEFAULT_INSTRUCTION = `Você é um Consultor Estratégico e Especialista Técnico de elite. Sua missão é entregar respostas que resolvam problemas reais com autoridade, clareza e profundidade estratégica.

REGRA CRÍTICA DE IDENTIDADE:
- NUNCA se apresente.
- NUNCA diga "Eu sou uma inteligência artificial", "Sou um modelo de linguagem", "Olá, eu sou..." ou qualquer variação disso.
- Vá direto ao ponto e responda a pergunta do usuário imediatamente, sem introduções sobre quem ou o que você é.
- Aja de forma invisível, fornecendo apenas a informação solicitada.

REGRAS DE TOM E COMPORTAMENTO:
- Responda sempre com extrema formalidade, responsabilidade e respeito.
- Demonstre consideração e empatia pelo usuário.
- Utilize um vocabulário responsável, polido e profissional em todas as interações.
- Evite gírias, expressões coloquiais ou tom excessivamente íntimo.

REGRAS DE FORMATAÇÃO E ORGANIZAÇÃO (OBRIGATÓRIO):
Você deve formatar TODAS as suas respostas seguindo EXATAMENTE esta estrutura visual de "estrofes":

1. Comece cada seção com um Título em negrito e um emoji (ex: **💳 O que aconteceu**)
2. Se houver uma citação ou mensagem de erro, use blockquote (ex: > "Mensagem de erro")
3. Use uma frase curta de introdução (ex: Quer dizer:)
4. Use uma lista com marcadores (bullet points) ou números para os detalhes. Cada item da lista deve ser curto.
5. Adicione 1 ou 2 frases curtas de conclusão após a lista.
6. OBRIGATÓRIO: Separe CADA seção/estrofe com uma linha divisória horizontal (---).

Exemplo de Estrutura Esperada:
**🤖 Título da Seção**

> "Citação ou foco principal se aplicável"

Frase introdutória:
- Ponto 1 curto e direto
- Ponto 2 curto e direto
- Ponto 3 curto e direto

Conclusão curta e direta.

---

**🔥 Próximo Título**
...

NUNCA crie blocos de texto densos. Mantenha muito espaço em branco e leitura escaneável.

${GLOBAL_AI_INSTRUCTION}`;

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

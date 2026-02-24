
import { Message, GroundingUrl, AppSettings } from "../types";
import { supabase } from "./supabaseService";

export class GeminiService {
  private DEFAULT_INSTRUCTION = `Você é um assistente inteligente, claro e organizado.

Regras:
- Responda de forma curta e direta.
- ESTRUTURA OBRIGATÓRIA: Comece com uma explicação curta, depois insira o comando [IMAGE: descrição] para gerar pelo menos 3 imagens reais, e finalize com uma conclusão ou mais detalhes. As imagens devem ficar no meio do texto.
- Use alguns emojis quando fizer sentido 😊
- Não escreva textos muito longos.
- Organize a resposta com pequenas divisões (---).
- Seja claro, útil e objetivo.
- Você DEVE dividir temas diferentes usando títulos de Markdown (## Título do Tema).
- Se o usuário pedir para gerar uma imagem, responda confirmando o que irá criar.
- Nunca use balões de fala.`;

  constructor() {}

  private async callGemini(payload: any): Promise<any> {
    const { data, error } = await supabase.functions.invoke('EU', {
      body: payload
    });

    if (error) {
      console.error('Supabase Function Error:', error);
      throw new Error(error.message || 'Erro ao chamar a função Gemini.');
    }

    return data;
  }

  private getSystemInstruction(settings?: AppSettings, customInstruction?: string): string {
    if (customInstruction) return customInstruction;
    if (!settings) return this.DEFAULT_INSTRUCTION;

    const { ai, model } = settings;
    
    return `Você é uma inteligência artificial personalizada com as seguinte configurações:

Idioma: ${ai.language}
Personalidade: ${ai.personality}
Tom: ${ai.style}
Formato: Markdown organizado
Tamanho da resposta: ${ai.length}
Uso de emojis: ${ai.emojis ? 'Permitido' : 'Proibido'}
Modo: ${model.mode}

REGRAS DE SEGURANÇA E MODERAÇÃO (CRÍTICO):
1. Você NUNCA deve gerar conteúdo sexualmente explícito, violento, discriminatório, ilegal ou prejudicial.
2. Mantenha sempre um tom respeitoso e profissional, independentemente da personalidade escolhida.
3. Se o usuário solicitar algo inapropriado, recuse educadamente e redirecione para um tópico seguro.
4. Não emita opiniões polêmicas ou ofensivas.

REGRAS OBRIGATÓRIAS:

1. Sempre responda no idioma escolhido.
2. Adapte sua personalidade ao papel selecionado.
3. Se for Conselheiro, ofereça orientação estratégica.
4. Se for Professor, explique passo a passo.
5. Se for Programador, use código quando necessário.
6. Se for Coach, motive e incentive.
7. Se modo for Preciso, seja direto e técnico.
8. Se modo for Criativo, seja inovador e expansivo.
9. Respeite o tamanho configurado.
10. Organize visualmente as respostas.
11. Use emojis apenas conforme permitido.
12. Evite textos confusos ou desorganizados.
13. SEJA EXTREMAMENTE CONCISO. Não gere textos longos.
14. Responda ESTRITAMENTE o que foi perguntado. Não adicione informações extras não solicitadas.
15. ESTRUTURA OBRIGATÓRIA: Comece com uma explicação curta, depois insira o comando [IMAGE: descrição] para gerar pelo menos 3 imagens reais, e finalize com uma conclusão ou mais detalhes. As imagens devem ficar no meio do texto.
16. Sempre que possível, forneça exemplos práticos e novas ideias.

Objetivo: entregar respostas curtas, claras, organizadas, inteligentes, úteis e seguras.`;
  }

  private isImageRequest(text: string): boolean {
    const keywords = ['gerar imagem', 'crie uma imagem', 'desenhe', 'mostre uma imagem', 'foto de', 'imagem de', 'generate image', 'create image', 'me mostre um', 'me mostre uma'];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  async sendMessage(message: string, history: Message[], currentImages?: string[], customInstruction?: string, settings?: AppSettings): Promise<{ text: string; images?: string[]; groundingUrls?: GroundingUrl[]; usage?: any; model?: string }> {
    try {
      let images: string[] = [];
      let groundingUrls: GroundingUrl[] = [];

      // Chamada para o modelo de texto com Google Search Grounding e Histórico Completo
      const contents = history.map(msg => {
        const parts: any[] = [{ text: msg.text || " " }];
        
        // Inclui imagens no histórico para manter o contexto visual
        if (msg.images && msg.images.length > 0) {
          msg.images.forEach(img => {
            if (img.startsWith('data:')) {
              const [header, data] = img.split(';base64,');
              const mimeType = header.split(':')[1];
              parts.push({
                inlineData: {
                  mimeType: mimeType,
                  data: data
                }
              });
            }
          });
        }
        
        return {
          role: msg.role === 'user' ? 'user' : 'model',
          parts
        };
      });

      // Adiciona a mensagem atual do usuário com suas imagens
      const currentParts: any[] = [{ text: message || " " }];
      if (currentImages && currentImages.length > 0) {
        currentImages.forEach(img => {
          if (img.startsWith('data:')) {
            const [header, data] = img.split(';base64,');
            const mimeType = header.split(':')[1];
            currentParts.push({
              inlineData: {
                mimeType: mimeType,
                data: data
              }
            });
          }
        });
      }

      contents.push({
        role: 'user',
        parts: currentParts
      });

      const modelName = settings?.model.mode === 'Preciso' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';

      const payload = {
        model: modelName,
        contents: contents,
        generationConfig: {
          temperature: settings?.model.mode === 'Criativo' ? 0.9 : 0.2, // Lower temperature for faster/more stable responses
          topP: 0.8,
          topK: 20,
          maxOutputTokens: 1024, // Limit output for speed
        },
        systemInstruction: {
          parts: [{ text: this.getSystemInstruction(settings, customInstruction) + "\n\nIMPORTANTE: Responda o mais rápido possível. Seja extremamente conciso e direto." }]
        },
        // Remove googleSearch if speed is priority? No, keep it but maybe optimize.
        // For now, let's keep it but the user asked for speed.
      };

      const textResponse = await this.callGemini(payload);

      let responseText = textResponse.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta.";

      // Detectar se a IA quer gerar imagens via tags [IMAGE: ...] ou se o usuário pediu
      const imageTagMatches = Array.from(responseText.matchAll(/\[IMAGE:\s*(.*?)\]/gi));
      const userWantsImage = this.isImageRequest(message);
      
      if (imageTagMatches.length > 0 || userWantsImage) {
        try {
          let prompts: string[] = [];
          
          if (imageTagMatches.length > 0) {
            prompts = imageTagMatches.map(match => match[1]);
            while (prompts.length < 3) {
              prompts.push(prompts[prompts.length - 1]);
            }
          } else {
            const countMatch = message.match(/\b(1|2|3|4|5)\b/);
            const count = Math.max(3, countMatch ? parseInt(countMatch[0]) : 3);
            prompts = Array(count).fill(message);
          }

          const imagePromises = prompts.slice(0, 6).map(prompt => 
            this.callGemini({
              model: 'gemini-2.5-flash-image',
              contents: [{ role: 'user', parts: [{ text: prompt }] }]
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
        } catch (imgError) {
          console.error("Erro ao gerar imagens:", imgError);
        }
        
        const firstMatch = responseText.match(/\[IMAGE:\s*(.*?)\]/i);
        if (firstMatch) {
          responseText = responseText.replace(/\[IMAGE:\s*(.*?)\]/i, "|||IMAGES_PLACEHOLDER|||");
          responseText = responseText.replace(/\[IMAGE:\s*(.*?)\]/gi, "");
        } else {
          responseText = responseText.replace(/\[IMAGE:\s*(.*?)\]/gi, "").trim();
        }
        
        if (userWantsImage && !imageTagMatches.length && images.length > 0) {
          responseText = `Com certeza! Gereis ${images.length} imagens baseadas no seu pedido para ilustrar melhor.\n\n|||IMAGES_PLACEHOLDER|||`;
        }
      }

      const groundingChunks = textResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        groundingUrls = groundingChunks
          .filter((chunk: any) => chunk.web)
          .map((chunk: any) => ({
            title: chunk.web?.title || 'Fonte',
            uri: chunk.web?.uri || ''
          }))
          .filter((item: any) => item.uri !== '');
      }

      return { 
        text: responseText, 
        images: images.length > 0 ? images : undefined,
        groundingUrls: groundingUrls.length > 0 ? groundingUrls : undefined,
        usage: textResponse.usageMetadata,
        model: modelName
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Falha na comunicação com a IA.");
    }
  }

  async generateTitle(firstMessage: string): Promise<string> {
    try {
      const response = await this.callGemini({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: `Gere um título curto (máximo 4 palavras) e criativo para uma conversa que começa com: "${firstMessage}". Responda APENAS com o título, sem aspas ou pontuação final.` }] }],
        generationConfig: {
          temperature: 0.5,
        }
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Nova Conversa";
    } catch (error) {
      console.error("Error generating title:", error);
      return firstMessage.length > 30 ? firstMessage.substring(0, 27) + "..." : firstMessage;
    }
  }
}

export const geminiService = new GeminiService();


import { createClient, User } from '@supabase/supabase-js';
import { Conversation, Message } from '../types';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://gjhgaiaqqvotterthwuo.supabase.co';
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqaGdhaWFxcXZvdHRlcnRod3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MDEzNTIsImV4cCI6MjA4NjI3NzM1Mn0.KDlSGnRnnlsX_7yCZBo17p5KeROxP4xK7YA0IFf5K4M';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const supabaseService = {
  async getCurrentUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  },

  async fetchConversations(): Promise<Conversation[]> {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('Erro ao buscar conversas:', error);
      return [];
    }

    const conversationsWithMessages = await Promise.all(
      (data || []).map(async (conv) => {
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('timestamp', { ascending: true });

        return {
          id: conv.id,
          title: conv.title,
          category: conv.category,
          systemInstruction: conv.system_instruction,
          lastUpdated: new Date(conv.last_updated),
          messages: (messages || []).map(m => ({
            id: m.id,
            role: m.role,
            text: m.text,
            images: m.images,
            groundingUrls: m.grounding_urls,
            timestamp: new Date(m.timestamp)
          }))
        };
      })
    );

    return conversationsWithMessages;
  },

  async upsertConversation(conv: Conversation): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) return; // Não salva se não estiver logado

    const { error: convError } = await supabase
      .from('conversations')
      .upsert({
        id: conv.id,
        title: conv.title,
        category: conv.category,
        system_instruction: conv.systemInstruction,
        last_updated: new Date().toISOString(),
        user_id: user.id
      });

    if (convError) {
      console.error('Erro ao salvar conversa:', convError);
      throw new Error(`Falha ao salvar conversa: ${convError.message}`);
    }

    const { error: deleteError } = await supabase.from('messages').delete().eq('conversation_id', conv.id);
    if (deleteError) {
      console.error('Erro ao limpar mensagens antigas:', deleteError);
      throw new Error(`Falha ao atualizar mensagens: ${deleteError.message}`);
    }
    
    if (conv.messages.length > 0) {
      const { error: msgError } = await supabase
        .from('messages')
        .insert(
          conv.messages.map(m => ({
            id: m.id,
            conversation_id: conv.id,
            role: m.role,
            text: m.text,
            images: m.images || [],
            grounding_urls: m.groundingUrls || [],
            timestamp: m.timestamp.toISOString()
          }))
        );

      if (msgError) {
        console.error('Erro ao salvar mensagens:', msgError);
        throw new Error(`Falha ao salvar mensagens: ${msgError.message}`);
      }
    }
  },

  async deleteConversation(id: string): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) return;

    await supabase.from('messages').delete().eq('conversation_id', id);
    await supabase.from('conversations').delete().eq('id', id);
  }
};

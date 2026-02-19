
import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { MessageItem } from './components/MessageItem';
import { ChatInput } from './components/ChatInput';
import { Sidebar } from './components/Sidebar';
import { Message, ChatState, Conversation } from './types';
import { geminiService } from './services/geminiService';
import { supabaseService } from './services/supabaseService';
import { ArrowDown } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<ChatState>({
    currentId: crypto.randomUUID(),
    messages: [],
    isLoading: false,
    error: null,
    currentSystemInstruction: undefined,
    activeCategory: undefined,
    conversations: []
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Carregar conversas do Supabase no início
  useEffect(() => {
    const loadData = async () => {
      const history = await supabaseService.fetchConversations();
      setState(prev => ({ ...prev, conversations: history }));
    };
    loadData();
  }, []);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages, state.isLoading]);

  const saveToBackend = async (currentChat: Partial<Conversation>) => {
    const existingIdx = state.conversations.findIndex(c => c.id === state.currentId);
    
    const conversationData: Conversation = {
      id: state.currentId,
      title: currentChat.title || state.conversations[existingIdx]?.title || 'Nova Conversa',
      messages: currentChat.messages || state.messages,
      category: currentChat.category || state.activeCategory,
      systemInstruction: currentChat.systemInstruction || state.currentSystemInstruction,
      lastUpdated: new Date()
    };

    // Update local state first for responsiveness
    setState(prev => {
      let updatedConversations = [...prev.conversations];
      if (existingIdx !== -1) {
        updatedConversations[existingIdx] = conversationData;
      } else if (conversationData.messages.length > 0) {
        updatedConversations = [conversationData, ...updatedConversations];
      }
      return { ...prev, conversations: updatedConversations };
    });

    // Save to Supabase
    if (conversationData.messages.length > 0) {
      try {
        await supabaseService.upsertConversation(conversationData);
      } catch (err) {
        console.error('Erro crítico ao salvar no Supabase:', err);
        setState(prev => ({
          ...prev,
          error: `Erro ao sincronizar com banco de dados: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
        }));
      }
    }
  };

  const handleNewChat = () => {
    setState(prev => ({
      ...prev,
      currentId: crypto.randomUUID(),
      messages: [],
      isLoading: false,
      error: null,
      currentSystemInstruction: undefined,
      activeCategory: undefined
    }));
  };

  const handleStartThemedChat = (instruction: string, categoryName: string) => {
    setState(prev => ({
      ...prev,
      currentId: crypto.randomUUID(),
      messages: [],
      isLoading: false,
      error: null,
      currentSystemInstruction: instruction,
      activeCategory: categoryName
    }));
  };

  const handleLoadConversation = (conv: Conversation) => {
    setState(prev => ({
      ...prev,
      currentId: conv.id,
      messages: conv.messages,
      activeCategory: conv.category,
      currentSystemInstruction: conv.systemInstruction,
      isLoading: false,
      error: null
    }));
    
    // Pequeno delay para garantir que o DOM atualizou antes do scroll
    setTimeout(scrollToBottom, 100);
  };

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: new Date(),
    };

    const newMessages = [...state.messages, userMessage];
    
    setState(prev => ({
      ...prev,
      messages: newMessages,
      isLoading: true,
      error: null,
    }));

    // Se for a primeira mensagem, define o título
    const title = state.messages.length === 0 
      ? (text.length > 40 ? text.substring(0, 37) + '...' : text)
      : undefined;

    try {
      const result = await geminiService.sendMessage(
        text, 
        state.messages.concat(userMessage),
        state.currentSystemInstruction
      );
      
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: result.text,
        images: result.images,
        groundingUrls: result.groundingUrls,
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, aiMessage];

      setState(prev => ({
        ...prev,
        messages: finalMessages,
        isLoading: false,
      }));

      // Persistir no Supabase
      await saveToBackend({ messages: finalMessages, title });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro na comunicação.',
      }));
    }
  };

  return (
    <div className="flex h-screen bg-black text-white selection:bg-white/20 overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNewChat={handleNewChat}
        onStartThemedChat={handleStartThemedChat}
        conversations={state.conversations}
        onLoadConversation={handleLoadConversation}
        activeChatId={state.currentId}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)} 
          activeCategory={state.activeCategory}
        />
        
        <main 
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-0 flex flex-col"
        >
          {state.messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center animate-in fade-in zoom-in duration-700">
              <div className="text-center px-6">
                <h2 className="text-[28px] font-medium text-white/90 tracking-tight">
                  Em que posso ser útil hoje?
                </h2>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-8 w-full">
              {state.messages.map((msg) => (
                <MessageItem key={msg.id} message={msg} />
              ))}

              {state.isLoading && (
                <div className="flex items-center gap-2 text-gray-500 text-xs italic mb-8 animate-pulse ml-2">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  Consultando Gemini & Google Search...
                </div>
              )}

              {state.error && (
                <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-sm rounded-2xl mb-8 mx-2 text-center">
                  {state.error}
                </div>
              )}
            </div>
          )}
        </main>

        <div className="w-full">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            disabled={state.isLoading} 
          />
        </div>
      </div>

      <button 
        onClick={scrollToBottom}
        className={`fixed bottom-32 right-6 p-3 bg-zinc-900 border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-zinc-800 transition-all shadow-2xl hidden md:block ${state.messages.length > 3 ? 'opacity-100' : 'opacity-0'}`}
      >
        <ArrowDown className="w-5 h-5" />
      </button>
    </div>
  );
};

export default App;

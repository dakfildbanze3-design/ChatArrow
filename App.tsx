
import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { MessageItem } from './components/MessageItem';
import { ChatInput } from './components/ChatInput';
import { Sidebar } from './components/Sidebar';
import { Settings } from './components/Settings';
import { Auth } from './components/Auth';
import { Billing } from './components/Billing';
import { Message, ChatState, Conversation, AppSettings } from './types';
import { geminiService } from './services/geminiService';
import { supabaseService, supabase } from './services/supabaseService';
import { ArrowDown } from 'lucide-react';
import { User } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [state, setState] = useState<ChatState>({
    currentId: crypto.randomUUID(),
    messages: [],
    isLoading: false,
    error: null,
    currentSystemInstruction: undefined,
    activeCategory: undefined,
    conversations: [],
    showSettings: false,
    settings: {
      account: {
        name: 'Convidado',
        photo: 'https://ui-avatars.com/api/?name=Guest&background=333&color=fff',
        email: ''
      },
      ai: {
        language: 'Português',
        style: 'Casual',
        length: 'Média',
        emojis: true,
        personality: 'Amigo'
      },
      model: {
        default: 'Gemini 3 Flash',
        mode: 'Criativo',
        memory: true
      },
      privacy: {
        saveHistory: true
      },
      appearance: {
        theme: 'Escuro',
        primaryColor: '#3b82f6',
        fontSize: 16
      },
      notifications: {
        newResponse: true,
        push: true,
        sounds: true
      },
      plan: 'Free',
      advanced: {
        showTokens: false,
        showTime: false,
        showModel: false
      }
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Verificar sessão inicial e escutar mudanças
  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      
      if (currentUser) {
        if (isMounted) {
          // Só atualiza e carrega se o usuário mudou ou se for um evento de login/refresh
          setUser(prevUser => {
            if (prevUser?.id !== currentUser.id) {
              updateUserSettings(currentUser);
              loadData();
            }
            return currentUser;
          });
          setIsAuthLoading(false);
        }
      } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        if (isMounted) {
          setUser(null);
          setIsAuthLoading(false);
          // Resetar estado apenas se deslogar manualmente ou se não houver sessão inicial
          setState(prev => ({
            ...prev,
            conversations: [],
            settings: {
              ...prev.settings,
              account: {
                name: 'Convidado',
                photo: 'https://ui-avatars.com/api/?name=Guest&background=333&color=fff',
                email: ''
              }
            }
          }));
        }
      } else {
        // Para outros eventos sem sessão (como falha no refresh), garantimos que o loading pare
        if (isMounted) setIsAuthLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const updateUserSettings = (user: User) => {
    const email = user.email || user.user_metadata.email || '';
    const name = user.user_metadata.full_name || email.split('@')[0] || 'Usuário';
    
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        account: {
          name,
          photo: user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${name}&background=333&color=fff`,
          email
        },
        plan: 'Premium' // Assumindo premium para logados por enquanto
      }
    }));
  };

  const loadData = async () => {
    const history = await supabaseService.fetchConversations();
    setState(prev => ({ ...prev, conversations: history }));
  };

  // Sincronizar estado com o Hash da URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#settings') {
        setState(prev => ({ ...prev, showSettings: true }));
        setShowBilling(false);
      } else if (hash === '#billing') {
        setShowBilling(true);
        setState(prev => ({ ...prev, showSettings: false }));
      } else {
        setState(prev => ({ ...prev, showSettings: false }));
        setShowBilling(false);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Verificar no carregamento inicial

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleCloseSettings = () => {
    setState(prev => ({ ...prev, showSettings: false }));
    if (window.location.hash === '#settings') window.location.hash = '';
  };

  const handleCloseBilling = () => {
    setShowBilling(false);
    if (window.location.hash === '#billing') window.location.hash = '';
  };

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
    // Só salva se estiver logado
    if (!user) return;

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

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setState(prev => ({ ...prev, settings: newSettings }));
  };

  const handleSendMessage = async (text: string, images?: string[]) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      images,
      timestamp: new Date(),
    };

    const newMessages = [...state.messages, userMessage];
    
    setState(prev => ({
      ...prev,
      messages: newMessages,
      isLoading: true,
      error: null,
    }));

    // Se for a primeira mensagem, gera um título criativo com IA
    const titlePromise = state.messages.length === 0 
      ? geminiService.generateTitle(text)
      : Promise.resolve(undefined);

    try {
      const startTime = Date.now();
      const result = await geminiService.sendMessage(
        text, 
        state.messages, // Passa apenas o histórico anterior
        images, // Passa as imagens da mensagem atual
        state.currentSystemInstruction,
        state.settings // Passa as configurações do usuário
      );
      const endTime = Date.now();
      
      const title = await titlePromise;

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: result.text,
        images: result.images,
        groundingUrls: result.groundingUrls,
        timestamp: new Date(),
        usage: result.usage,
        model: result.model,
        responseTime: endTime - startTime
      };

      const finalMessages = [...newMessages, aiMessage];

      setState(prev => ({
        ...prev,
        messages: finalMessages,
        isLoading: false,
      }));

      // Persistir no Supabase (se logado)
      if (user) {
        await saveToBackend({ messages: finalMessages, title });
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro na comunicação.',
      }));
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-black text-zinc-900 dark:text-white selection:bg-blue-500/20 overflow-hidden transition-colors duration-300">
      {isAuthLoading ? (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-black flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium animate-pulse">Restaurando sessão...</p>
          </div>
        </div>
      ) : (
        <>
          {showAuth && !user && (
            <Auth 
              onClose={() => setShowAuth(false)} 
              onLoginSuccess={() => setShowAuth(false)} 
            />
          )}

          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            onNewChat={handleNewChat}
            onStartThemedChat={handleStartThemedChat}
            conversations={state.conversations}
            onLoadConversation={handleLoadConversation}
            activeChatId={state.currentId}
            onOpenSettings={() => window.location.hash = 'settings'}
            onOpenBilling={() => window.location.hash = 'billing'}
            user={user}
            onLoginClick={() => setShowAuth(true)}
          />

          {state.showSettings && (
            <Settings 
              settings={state.settings}
              onUpdate={handleUpdateSettings}
              onClose={handleCloseSettings}
              onOpenBilling={() => window.location.hash = 'billing'}
            />
          )}

          {showBilling && (
            <Billing 
              onClose={handleCloseBilling} 
              currentPlan={state.settings.plan} 
            />
          )}

          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black">
            <Header 
              onMenuClick={() => setIsSidebarOpen(true)} 
              activeCategory={state.activeCategory}
              user={user}
              onLoginClick={() => setShowAuth(true)}
              currentScreen={state.showSettings ? 'Configurações' : showBilling ? 'Faturamento' : undefined}
            />
            
            <main 
              ref={scrollRef}
              className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-0 flex flex-col"
            >
              {state.messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center animate-in fade-in zoom-in duration-700">
                  <div className="text-center px-6">
                    <h2 className="text-[28px] font-medium text-zinc-900 dark:text-white/90 tracking-tight">
                      {user ? `Olá, ${state.settings.account.name.split(' ')[0]}` : 'Em que posso ser útil hoje?'}
                    </h2>
                    {!user && (
                      <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm">
                        Faça login para salvar suas conversas
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto py-8 w-full">
                  {state.messages.map((msg) => (
                    <MessageItem key={msg.id} message={msg} settings={state.settings} />
                  ))}

                  {state.isLoading && (
                    <div className="flex items-center gap-2 text-zinc-400 dark:text-gray-500 text-xs italic mb-8 animate-pulse ml-2">
                      <div className="flex gap-1">
                        <span className="w-1 h-1 bg-zinc-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 bg-zinc-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 bg-zinc-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      Consultando Gemini & Google Search...
                    </div>
                  )}

                  {state.error && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-sm rounded-2xl mb-8 mx-2 text-center">
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
        </>
      )}
    </div>
  );
};

export default App;

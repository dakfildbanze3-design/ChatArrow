
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
import { paymentService } from './services/paymentService';
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
        }
      }
    }));
  };

  const loadData = async () => {
    const history = await supabaseService.fetchConversations();
    const subscription = await paymentService.getActiveSubscription();
    
    setState(prev => ({ 
      ...prev, 
      conversations: history,
      settings: {
        ...prev.settings,
        plan: subscription ? subscription.plan_name : 'Free',
        subscription: subscription || undefined
      }
    }));
  };

  // Sincronizar estado com o Hash da URL
  useEffect(() => {
    // Limpar hash ao carregar para garantir que o app sempre abra no chat
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }

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
    // Não chamamos handleHashChange() aqui para ignorar hash no carregamento inicial

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
    
    // 1. Atualização imediata do UI com a mensagem do usuário
    setState(prev => ({
      ...prev,
      messages: newMessages,
      isLoading: true,
      isAnalyzingImage: !!(images && images.length > 0),
      error: null,
    }));

    // 2. Gerar título em background se for a primeira mensagem
    const titlePromise = state.messages.length === 0 
      ? geminiService.generateTitle(text)
      : Promise.resolve(undefined);

    try {
      const startTime = Date.now();
      
      // Criar placeholder para a mensagem da IA que será atualizada via stream
      const aiMessageId = crypto.randomUUID();
      const initialAiMessage: Message = {
        id: aiMessageId,
        role: 'model',
        text: '',
        timestamp: new Date(),
        model: state.settings.model.mode === 'Preciso' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview'
      };

      setState(prev => ({
        ...prev,
        messages: [...newMessages, initialAiMessage]
      }));

      // 3. Chamar streaming
      const result = await geminiService.sendMessageStream(
        text, 
        state.messages,
        images,
        state.currentSystemInstruction,
        state.settings,
        (currentFullText) => {
          // Atualização progressiva do texto (Streaming)
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(m => 
              m.id === aiMessageId ? { ...m, text: currentFullText } : m
            )
          }));
        }
      );

      const endTime = Date.now();
      const title = await titlePromise;

      // 4. Finalizar mensagem com metadados
      const finalAiMessage: Message = {
        ...initialAiMessage,
        text: result.text,
        usage: result.usage,
        model: result.model,
        responseTime: endTime - startTime,
        timestamp: new Date()
      };

      const finalMessages = [...newMessages, finalAiMessage];

      setState(prev => ({
        ...prev,
        messages: finalMessages,
        isLoading: false,
        isAnalyzingImage: false,
      }));

      // 5. Persistir no Supabase em background (sem await para não bloquear o usuário)
      if (user) {
        saveToBackend({ messages: finalMessages, title }).catch(err => 
          console.error("Erro ao salvar histórico em background:", err)
        );
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isAnalyzingImage: false,
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
              subscription={state.settings.subscription}
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
                    <div className="flex flex-col gap-2 mb-8 ml-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center">
                          <svg 
                            width="24" 
                            height="24" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="1.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="text-white animate-pulse"
                          >
                            <path d="M12 3L2 21H22L12 3Z" />
                            <path d="M12 3V21" />
                            <path d="M2 21L12 12L22 21" />
                          </svg>
                        </div>
                      </div>
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

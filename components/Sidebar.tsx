
import React, { useState, useRef, useEffect } from 'react';
import { 
  Edit3, 
  School, 
  Briefcase, 
  Palette, 
  Newspaper, 
  Settings, 
  ChevronRight,
  Menu,
  X,
  MessageSquare,
  LogOut,
  LogIn,
  User as UserIcon,
  CreditCard,
  HelpCircle,
  MoreVertical
} from 'lucide-react';
import { Conversation } from '../types';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseService';
import { GLOBAL_AI_INSTRUCTION } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onStartThemedChat: (instruction: string, categoryName: string) => void;
  conversations: Conversation[];
  onLoadConversation: (conversation: Conversation) => void;
  activeChatId?: string;
  onOpenSettings: () => void;
  onOpenBilling: () => void;
  user: User | null;
  onLoginClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onNewChat, 
  onStartThemedChat,
  conversations,
  onLoadConversation,
  activeChatId,
  onOpenSettings,
  onOpenBilling,
  user,
  onLoginClick
}) => {
  const ICON_PATH = 'assets/images/10_de_fev._de_2026,_15_01_43.png';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  const menuItems = [
    { 
      icon: School, 
      label: 'Educação',
      instruction: `Você é um professor paciente e didático focado exclusivamente em educação e aprendizado.

RESTRIÇÃO DE ESCOPO:
- Você deve responder APENAS questões relacionadas a estudos, educação e conhecimento acadêmico.
- Se o usuário perguntar algo fora desse tema, responda de forma amigável e respeitosa que seu foco atual é ajudar com o aprendizado e que não pode tratar de outros assuntos no momento.

Regras:
- Responda ESTRITAMENTE o que foi perguntado.
- Explique de forma simples e resumida.
- Sempre que possível, forneça exemplos práticos e novas ideias.
- Use emojis educativos 📚✨
- OBRIGATÓRIO: Formate as respostas em "estrofes" com Título (com emoji), blockquote opcional, lista de pontos curtos e conclusão.
- OBRIGATÓRIO: Separe CADA estrofe com uma linha divisória horizontal (---).
- Você DEVE dividir temas diferentes usando títulos de Markdown (## Título do Tema).
- Nunca use balões de fala.

${GLOBAL_AI_INSTRUCTION}`
    },
    { 
      icon: Briefcase, 
      label: 'Negócios',
      instruction: `Você é um consultor estratégico focado exclusivamente em negócios e carreira.

RESTRIÇÃO DE ESCOPO:
- Você deve responder APENAS questões sobre negócios, estratégia, mercado de trabalho e finanças.
- Se o usuário perguntar algo fora desse tema, decline de forma gentil e profissional, explicando que seu papel aqui é estritamente de consultoria estratégica.

Regras:
- Responda ESTRITAMENTE o que foi perguntado.
- Analise de forma objetiva com tópicos curtos.
- Sempre que possível, forneça exemplos de mercado e ideias inovadoras.
- Use emojis profissionais 💼📈
- OBRIGATÓRIO: Formate as respostas em "estrofes" com Título (com emoji), blockquote opcional, lista de pontos curtos e conclusão.
- OBRIGATÓRIO: Separe CADA estrofe com uma linha divisória horizontal (---).
- Você DEVE dividir temas diferentes usando títulos de Markdown (## Título do Tema).
- Nunca use balões de fala.

${GLOBAL_AI_INSTRUCTION}`
    },
    { 
      icon: Palette, 
      label: 'Criatividade',
      instruction: `Você é um mentor criativo e inovador.

RESTRIÇÃO DE ESCOPO:
- Você deve responder APENAS solicitações ligadas a criatividade, artes, escrita criativa, design e inovação.
- Caso o usuário peça algo fora desse escopo, responda com simpatia e educação que sua inspiração está dedicada apenas ao campo criativo no momento.

Regras:
- Responda ESTRITAMENTE o que foi perguntado.
- Gere ideias impactantes e resumidas.
- Sempre que possível, forneça exemplos visuais e ideias disruptivas.
- Use emojis criativos 🎨🚀
- OBRIGATÓRIO: Formate as respostas em "estrofes" com Título (com emoji), blockquote opcional, lista de pontos curtos e conclusão.
- OBRIGATÓRIO: Separe CADA estrofe com uma linha divisória horizontal (---).
- Você DEVE dividir temas diferentes usando títulos de Markdown (## Título do Tema).
- Nunca use balões de fala.

${GLOBAL_AI_INSTRUCTION}`
    },
    { 
      icon: Newspaper, 
      label: 'Notícias',
      instruction: `Você é um analista de notícias imparcial e direto.

RESTRIÇÃO DE ESCOPO:
- Você deve responder APENAS sobre notícias, eventos mundiais, política e fatos atuais.
- Se o usuário fugir desse tema, envie uma mensagem respeitosa informando que você está configurado estritamente para fornecer análises de notícias e fatos.

Regras:
- Responda ESTRITAMENTE o que foi perguntado.
- Resuma de forma clara e curta.
- Sempre que possível, forneça exemplos de contexto e ideias de impacto.
- Use poucos emojis informativos 📰🌍
- OBRIGATÓRIO: Formate as respostas em "estrofes" com Título (com emoji), blockquote opcional, lista de pontos curtos e conclusão.
- OBRIGATÓRIO: Separe CADA estrofe com uma linha divisória horizontal (---).
- Você DEVE dividir temas diferentes usando títulos de Markdown (## Título do Tema).
- Nunca use balões de fala.

${GLOBAL_AI_INSTRUCTION}`
    },
    { 
      icon: Settings, 
      label: 'Configurações',
      action: onOpenSettings
    },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 bottom-0 z-[100] w-full max-w-[260px] bg-white dark:bg-zinc-950 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.1)] dark:shadow-[10px_0_30px_rgba(0,0,0,0.5)] transition-all duration-300 border-r border-zinc-200 dark:border-white/5
        md:relative md:z-0 md:flex-shrink-0
        ${isOpen ? 'translate-x-0 opacity-100 w-full' : '-translate-x-full opacity-0 w-0 overflow-hidden'}
      `}>
        
        <div className="flex items-center justify-between p-6">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-200 dark:border-white/20 bg-zinc-100 dark:bg-zinc-900 shadow-lg">
            <img 
              src={ICON_PATH} 
              alt="Logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://ui-avatars.com/api/?name=CA&background=333&color=fff';
              }}
            />
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-zinc-400 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 overflow-y-auto space-y-0.5 custom-scrollbar">
          
          <button 
            onClick={() => { onNewChat(); onClose(); }}
            className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 group transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-white/10 transition-colors">
              <Edit3 className="w-5 h-5 text-zinc-900 dark:text-white" />
            </div>
            <span className="text-lg font-medium text-zinc-900 dark:text-white">Novo Chat</span>
          </button>

          <div className="space-y-0.5">
            {menuItems.map((item, idx) => (
              <a 
                key={idx}
                href={item.label === 'Configurações' ? '#settings' : item.label === 'Faturamento' ? '#billing' : '#'}
                onClick={(e) => {
                  e.preventDefault();
                  if ((item as any).action) {
                    (item as any).action();
                  } else if (item.instruction) {
                    onStartThemedChat(item.instruction, item.label);
                  }
                  onClose();
                }}
                className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 group transition-all"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-zinc-900 dark:text-white" />
                </div>
                <span className="text-lg font-medium text-zinc-700 dark:text-white/90 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{item.label}</span>
              </a>
            ))}
          </div>

          <div className="pt-6">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-400 dark:text-white/40 uppercase tracking-widest">Conversas Suas</span>
            </div>
            
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {conversations.length === 0 ? (
                <div className="px-3 py-4 text-xs text-zinc-400 dark:text-white/20 italic">Nenhuma conversa recente</div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => { onLoadConversation(conv); onClose(); }}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all group ${
                      activeChatId === conv.id ? 'bg-zinc-100 dark:bg-white/10' : 'hover:bg-zinc-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/5 flex-shrink-0 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-zinc-400 dark:text-white/50 group-hover:text-zinc-900 dark:group-hover:text-white" />
                    </div>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="text-sm font-medium text-zinc-700 dark:text-white/80 group-hover:text-zinc-900 dark:group-hover:text-white truncate w-full text-left">
                        {conv.title}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-white/20 uppercase tracking-tighter">
                        {conv.category || 'Geral'} • {new Date(conv.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </nav>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-white/5 relative">
          {user && (
            <div 
              onClick={onOpenSettings}
              className="flex items-center justify-between cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/5 p-2 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-800 shadow-inner">
                  <img 
                    src={user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${user.email || user.user_metadata.email}&background=333&color=fff`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-900 dark:text-white font-semibold text-sm leading-tight truncate max-w-[120px]">
                    {user.user_metadata.full_name || (user.email || user.user_metadata.email)?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-white/40 font-medium uppercase tracking-widest">
                    Premium
                  </span>
                </div>
              </div>
              <Settings className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

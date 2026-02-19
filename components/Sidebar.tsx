
import React from 'react';
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
  MessageSquare
} from 'lucide-react';
import { Conversation } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onStartThemedChat: (instruction: string, categoryName: string) => void;
  conversations: Conversation[];
  onLoadConversation: (conversation: Conversation) => void;
  activeChatId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onNewChat, 
  onStartThemedChat,
  conversations,
  onLoadConversation,
  activeChatId
}) => {
  const ICON_PATH = 'assets/images/10_de_fev._de_2026,_15_01_43.png';

  const menuItems = [
    { 
      icon: School, 
      label: 'Educação',
      instruction: `Você é um professor paciente e didático focado exclusivamente em educação e aprendizado.

RESTRIÇÃO DE ESCOPO:
- Você deve responder APENAS questões relacionadas a estudos, educação e conhecimento acadêmico.
- Se o usuário perguntar algo fora desse tema, responda de forma amigável e respeitosa que seu foco atual é ajudar com o aprendizado e que não pode tratar de outros assuntos no momento.

Regras:
- Explique de forma simples e resumida.
- Use exemplos curtos e emojis educativos 📚✨
- Não escreva textos longos.
- Organize com pequenas divisões (---).
- Você DEVE dividir temas diferentes usando títulos de Markdown (## Título do Tema).
- Nunca use balões de fala.`
    },
    { 
      icon: Briefcase, 
      label: 'Negócios',
      instruction: `Você é um consultor estratégico focado exclusivamente em negócios e carreira.

RESTRIÇÃO DE ESCOPO:
- Você deve responder APENAS questões sobre negócios, estratégia, mercado de trabalho e finanças.
- Se o usuário perguntar algo fora desse tema, decline de forma gentil e profissional, explicando que seu papel aqui é estritamente de consultoria estratégica.

Regras:
- Analise de forma objetiva com tópicos curtos.
- Use emojis profissionais 💼📈
- Não escreva respostas longas.
- Separe ideias com linhas (---).
- Seja prático e direto ao ponto.
- Você DEVE dividir temas diferentes usando títulos de Markdown (## Título do Tema).
- Nunca use balões de fala.`
    },
    { 
      icon: Palette, 
      label: 'Criatividade',
      instruction: `Você é um mentor criativo e inovador.

RESTRIÇÃO DE ESCOPO:
- Você deve responder APENAS solicitações ligadas a criatividade, artes, escrita criativa, design e inovação.
- Caso o usuário peça algo fora desse escopo, responda com simpatia e educação que sua inspiração está dedicada apenas ao campo criativo no momento.

Regras:
- Gere ideias impactantes e resumidas.
- Use emojis criativos 🎨🚀
- Não escreva textos muito longos.
- Organize com pequenas divisões (---).
- Seja original e envolvente.
- Você DEVE dividir temas diferentes usando títulos de Markdown (## Título do Tema).
- Nunca use balões de fala.`
    },
    { 
      icon: Newspaper, 
      label: 'Notícias',
      instruction: `Você é um analista de notícias imparcial e direto.

RESTRIÇÃO DE ESCOPO:
- Você deve responder APENAS sobre notícias, eventos mundiais, política e fatos atuais.
- Se o usuário fugir desse tema, envie uma mensagem respeitosa informando que você está configurado estritamente para fornecer análises de notícias e fatos.

Regras:
- Resuma de forma clara e curta.
- Use poucos emojis informativos 📰🌍
- Não escreva textos longos.
- Separe os tópicos com (---).
- Seja neutro e objetivo.
- Você DEVE dividir temas diferentes usando títulos de Markdown (## Título do Tema).
- Nunca use balões de fala.`
    },
    { icon: Settings, label: 'Configurações' },
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
        fixed top-0 left-0 bottom-0 z-[100] w-full max-w-[300px] bg-zinc-950 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.5)] transition-all duration-300
        md:relative md:z-0 md:flex-shrink-0
        ${isOpen ? 'translate-x-0 opacity-100 w-full' : '-translate-x-full opacity-0 w-0 overflow-hidden'}
      `}>
        
        <div className="flex items-center justify-between p-6">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 bg-zinc-900 shadow-lg">
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
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 overflow-y-auto space-y-4 custom-scrollbar">
          
          <button 
            onClick={() => { onNewChat(); onClose(); }}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 group transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-medium text-white">Novo Chat</span>
          </button>

          <div className="space-y-1">
            {menuItems.map((item, idx) => (
              <button 
                key={idx}
                onClick={() => {
                  if (item.instruction) {
                    onStartThemedChat(item.instruction, item.label);
                  }
                  onClose();
                }}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 group transition-all"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-lg font-medium text-white/90 group-hover:text-white transition-colors">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-6">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-white/40 uppercase tracking-widest">Conversas Suas</span>
            </div>
            
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {conversations.length === 0 ? (
                <div className="px-3 py-4 text-xs text-white/20 italic">Nenhuma conversa recente</div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => { onLoadConversation(conv); onClose(); }}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all group ${
                      activeChatId === conv.id ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-white/50 group-hover:text-white" />
                    </div>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="text-sm font-medium text-white/80 group-hover:text-white truncate w-full text-left">
                        {conv.title}
                      </span>
                      <span className="text-[10px] text-white/20 uppercase tracking-tighter">
                        {conv.category || 'Geral'} • {new Date(conv.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </nav>

        <div className="p-6 bg-zinc-900/30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-zinc-800 shadow-inner">
               <img 
                src={ICON_PATH} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://ui-avatars.com/api/?name=Dakfild&background=333&color=fff';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-base leading-tight">Dakfild</span>
              <span className="text-xs text-white/40 font-medium uppercase tracking-widest">Premium User</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

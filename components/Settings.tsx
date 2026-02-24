
import React from 'react';
import { 
  X, 
  User, 
  Bot, 
  Cpu, 
  Lock, 
  Palette, 
  Bell, 
  CreditCard, 
  Zap, 
  LogOut, 
  Trash2,
  ChevronRight,
  Globe,
  MessageSquare,
  Smile,
  Type,
  Sun,
  Moon,
  Check
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
  onClose: () => void;
  onOpenBilling: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, onClose, onOpenBilling }) => {
  const updateNested = (section: keyof AppSettings, key: string, value: any) => {
    onUpdate({
      ...settings,
      [section]: {
        ...(settings[section] as any),
        [key]: value
      }
    });
  };

  const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-4 px-2">
        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-white/60">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-400 dark:text-white/40 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
        {children}
      </div>
    </div>
  );

  const Item = ({ label, value, onClick, icon: Icon, color }: { label: string, value?: string, onClick?: () => void, icon?: any, color?: string }) => (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group text-left border-b border-zinc-100 dark:border-white/5 last:border-0"
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className={`w-4 h-4 ${color || 'text-zinc-400 dark:text-white/60'}`} />}
        <span className={`text-[15px] ${color || 'text-zinc-700 dark:text-white/80'} group-hover:text-zinc-900 dark:group-hover:text-white transition-colors`}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-zinc-400 dark:text-white/40">{value}</span>}
        <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-white/20 group-hover:text-zinc-500 dark:group-hover:text-white/40 transition-colors" />
      </div>
    </button>
  );

  const Toggle = ({ label, enabled, onToggle }: { label: string, enabled: boolean, onToggle: () => void }) => (
    <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-white/5 last:border-0">
      <span className="text-[15px] text-zinc-700 dark:text-white/80">{label}</span>
      <button 
        onClick={onToggle}
        className={`w-10 h-5 rounded-full transition-all relative ${enabled ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}
      >
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${enabled ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );

  const Select = ({ label, options, current, onSelect }: { label: string, options: string[], current: string, onSelect: (val: any) => void }) => (
    <div className="p-4 border-b border-zinc-100 dark:border-white/5 last:border-0">
      <span className="text-xs text-zinc-400 dark:text-white/30 uppercase tracking-widest mb-3 block">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              current === opt 
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' 
                : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-white/60 hover:bg-zinc-200 dark:hover:bg-white/10'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-50 dark:bg-black flex flex-col md:flex-row overflow-hidden transition-colors duration-300">
      {/* Sidebar Navigation (Desktop) */}
      <div className="w-full md:w-80 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-white/5 flex flex-col">
        <div className="p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold italic text-zinc-900 dark:text-white tracking-tight">Configurações</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-colors md:hidden">
            <X className="w-6 h-6 text-zinc-900 dark:text-white" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
            <User className="w-5 h-5" />
            <span className="font-medium">Geral</span>
          </button>
          <button className="flex items-center gap-3 w-full p-3 rounded-xl text-zinc-500 dark:text-white/60 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all">
            <Bot className="w-5 h-5" />
            <span className="font-medium">Preferências da IA</span>
          </button>
          <button className="flex items-center gap-3 w-full p-3 rounded-xl text-zinc-500 dark:text-white/60 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all">
            <Palette className="w-5 h-5" />
            <span className="font-medium">Aparência</span>
          </button>
        </div>

        <div className="p-6 border-t border-zinc-100 dark:border-white/5">
          <button className="flex items-center gap-3 w-full p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 transition-all">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair da Conta</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-black custom-scrollbar">
        <div className="max-w-3xl mx-auto p-6 md:p-12">
          <div className="hidden md:flex justify-end mb-8">
            <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6 text-zinc-400 dark:text-white" />
            </button>
          </div>

          <Section title="1. Conta" icon={User}>
            <div className="p-6 flex items-center gap-4 border-b border-zinc-100 dark:border-white/5">
              <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-white/10 overflow-hidden">
                <img src={settings.account.photo} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-zinc-900 dark:text-white">{settings.account.name}</h4>
                <p className="text-sm text-zinc-400 dark:text-white/40">{settings.account.email}</p>
              </div>
            </div>
            <Item label="Alterar Nome" value={settings.account.name} />
            <Item label="Alterar Senha" />
            <Item label="Excluir Conta" color="text-red-500" icon={Trash2} />
          </Section>

          <Section title="2. Preferências da IA" icon={Bot}>
            <Select 
              label="🗣️ Idioma da IA" 
              options={['Português', 'Inglês']} 
              current={settings.ai.language}
              onSelect={(val) => updateNested('ai', 'language', val)}
            />
            <Select 
              label="🎭 Estilo de Resposta" 
              options={['Formal', 'Casual', 'Técnico', 'Motivador']} 
              current={settings.ai.style}
              onSelect={(val) => updateNested('ai', 'style', val)}
            />
            <Select 
              label="📏 Tamanho das Respostas" 
              options={['Curta', 'Média', 'Longa']} 
              current={settings.ai.length}
              onSelect={(val) => updateNested('ai', 'length', val)}
            />
            <Select 
              label="🧠 Personalidade da IA" 
              options={['Conselheiro', 'Professor', 'Programador', 'Amigo', 'Coach', 'Engraçado']} 
              current={settings.ai.personality}
              onSelect={(val) => updateNested('ai', 'personality', val)}
            />
            <Toggle 
              label="😄 Permitir Emojis" 
              enabled={settings.ai.emojis} 
              onToggle={() => updateNested('ai', 'emojis', !settings.ai.emojis)} 
            />
          </Section>

          <Section title="3. Modelo da IA" icon={Cpu}>
            <Item label="Modelo Padrão" value={settings.model.default} />
            <Select 
              label="Modo de Operação" 
              options={['Criativo', 'Preciso']} 
              current={settings.model.mode}
              onSelect={(val) => updateNested('model', 'mode', val)}
            />
            <Toggle 
              label="Memória Ativa (Salvar contexto?)" 
              enabled={settings.model.memory} 
              onToggle={() => updateNested('model', 'memory', !settings.model.memory)} 
            />
          </Section>

          <Section title="4. Privacidade" icon={Lock}>
            <Toggle 
              label="Salvar Histórico de Conversas" 
              enabled={settings.privacy.saveHistory} 
              onToggle={() => updateNested('privacy', 'saveHistory', !settings.privacy.saveHistory)} 
            />
            <Item label="Limpar Histórico" color="text-red-400" />
            <Item label="Exportar Conversas" />
            <Item label="Apagar Todos os Dados" color="text-red-500" />
          </Section>

          <Section title="5. Aparência" icon={Palette}>
            <Toggle 
              label="Modo Escuro" 
              enabled={settings.appearance.theme === 'Escuro'} 
              onToggle={() => updateNested('appearance', 'theme', settings.appearance.theme === 'Escuro' ? 'Claro' : 'Escuro')} 
            />
            <Item label="Cor Principal" value={settings.appearance.primaryColor} />
            <Item label="Tamanho da Fonte" value={`${settings.appearance.fontSize}px`} />
          </Section>

          <Section title="6. Notificações" icon={Bell}>
            <Toggle 
              label="Aviso de Novas Respostas" 
              enabled={settings.notifications.newResponse} 
              onToggle={() => updateNested('notifications', 'newResponse', !settings.notifications.newResponse)} 
            />
            <Toggle 
              label="Notificações Push" 
              enabled={settings.notifications.push} 
              onToggle={() => updateNested('notifications', 'push', !settings.notifications.push)} 
            />
            <Toggle 
              label="Sons" 
              enabled={settings.notifications.sounds} 
              onToggle={() => updateNested('notifications', 'sounds', !settings.notifications.sounds)} 
            />
          </Section>

          <Section title="7. Plano" icon={CreditCard}>
            <div className="p-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl m-4 text-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold">Plano {settings.plan}</h4>
                  <p className="text-sm opacity-80">Acesso total às ferramentas</p>
                </div>
                <Zap className="w-6 h-6 fill-white" />
              </div>
              <button 
                onClick={onOpenBilling}
                className="w-full py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-white/90 transition-colors"
              >
                Gerenciar Assinatura
              </button>
            </div>
            <Item label="Ver Limites de Uso" />
            <Item label="Histórico de Consumo" />
          </Section>

          <Section title="⚡ Modo Avançado" icon={Zap}>
            <Toggle 
              label="Mostrar Tokens Usados" 
              enabled={settings.advanced.showTokens} 
              onToggle={() => updateNested('advanced', 'showTokens', !settings.advanced.showTokens)} 
            />
            <Toggle 
              label="Mostrar Tempo de Resposta" 
              enabled={settings.advanced.showTime} 
              onToggle={() => updateNested('advanced', 'showTime', !settings.advanced.showTime)} 
            />
            <Toggle 
              label="Mostrar Modelo Usado" 
              enabled={settings.advanced.showModel} 
              onToggle={() => updateNested('advanced', 'showModel', !settings.advanced.showModel)} 
            />
          </Section>
        </div>
      </div>
    </div>
  );
};

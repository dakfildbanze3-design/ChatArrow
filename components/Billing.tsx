import React from 'react';
import { X, Check, Zap, Star, Shield, Crown } from 'lucide-react';

interface BillingProps {
  onClose: () => void;
  currentPlan: string;
}

export const Billing: React.FC<BillingProps> = ({ onClose, currentPlan }) => {
  const plans = [
    {
      name: 'Free',
      price: 'R$ 0',
      period: '/mês',
      description: 'Para quem está começando a explorar IA.',
      features: [
        'Acesso ao modelo básico',
        '10 mensagens por dia',
        'Histórico de 3 dias',
        'Suporte da comunidade'
      ],
      current: currentPlan === 'Free',
      icon: Star,
      accent: 'text-zinc-400'
    },
    {
      name: 'Pro',
      price: 'R$ 29,90',
      period: '/mês',
      description: 'Para uso diário com mais recursos.',
      features: [
        'Acesso ao modelo avançado',
        'Mensagens ilimitadas',
        'Geração de imagens (50/mês)',
        'Histórico ilimitado',
        'Suporte prioritário'
      ],
      current: currentPlan === 'Pro',
      popular: true,
      icon: Zap,
      accent: 'text-blue-500'
    },
    {
      name: 'Premium',
      price: 'R$ 59,90',
      period: '/mês',
      description: 'Poder total para profissionais.',
      features: [
        'Modelos de última geração (Gemini 1.5 Pro)',
        'Geração de imagens ilimitada',
        'Respostas mais rápidas',
        'Acesso antecipado a novos recursos',
        'Suporte VIP 24/7'
      ],
      current: currentPlan === 'Premium',
      icon: Crown,
      accent: 'text-purple-500'
    }
  ];

  return (
    <div className="fixed inset-0 z-[250] bg-white/95 dark:bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-24">
        <div className="flex justify-between items-start mb-16 md:mb-24">
          <div className="animate-in slide-in-from-left-8 duration-700">
            <h2 className="text-5xl md:text-8xl font-bold text-zinc-900 dark:text-white tracking-tighter mb-6">
              Planos<span className="text-blue-500">.</span>
            </h2>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
              Escolha a potência ideal para suas conversas e criações. Sem contratos, cancele quando quiser.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-4 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-all hover:rotate-90 duration-300"
          >
            <X className="w-8 h-8 text-zinc-400" />
          </button>
        </div>

        <div className="flex md:grid md:grid-cols-3 gap-16 md:gap-24 overflow-x-auto md:overflow-x-visible pb-12 snap-x snap-mandatory scroll-px-6">
          {plans.map((plan, idx) => (
            <div 
              key={plan.name}
              style={{ animationDelay: `${idx * 100}ms` }}
              className="shrink-0 w-[300px] md:w-auto snap-center flex flex-col animate-in slide-in-from-bottom-8 duration-700 fill-mode-both"
            >
              <div className="mb-8">
                <div className={`mb-6 ${plan.accent}`}>
                  <plan.icon className="w-12 h-12" />
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{plan.name}</h3>
                  {plan.popular && (
                    <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed min-h-[40px]">
                  {plan.description}
                </p>
              </div>

              <div className="mb-10">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-zinc-900 dark:text-white tracking-tighter">{plan.price}</span>
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">{plan.period}</span>
                </div>
              </div>

              <div className="flex-1 mb-12">
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-300 group">
                      <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-150 ${plan.accent.replace('text-', 'bg-')}`} />
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`group relative w-full py-4 rounded-full font-bold text-lg transition-all overflow-hidden ${
                  plan.current 
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default' 
                    : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-[1.02] active:scale-[0.98]'
                }`}
                disabled={plan.current}
              >
                <span className="relative z-10">{plan.current ? 'Plano Atual' : 'Começar Agora'}</span>
                {!plan.current && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-24 pt-12 border-t border-zinc-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 animate-in fade-in duration-1000">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-100 dark:bg-white/5 rounded-2xl">
              <Shield className="w-6 h-6 text-zinc-400" />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-white">Pagamento Seguro</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Garantia de reembolso de 7 dias sem perguntas.</p>
            </div>
          </div>
          <div className="flex gap-6 text-xs font-medium text-zinc-400 uppercase tracking-widest">
            <button className="hover:text-zinc-900 dark:hover:text-white transition-colors">Termos</button>
            <button className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacidade</button>
            <button className="hover:text-zinc-900 dark:hover:text-white transition-colors">Ajuda</button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Check, Zap, Star, Shield, Crown, CreditCard, Loader2, Smartphone, ArrowLeft, Calendar, Clock, AlertCircle } from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { supabaseService } from '../services/supabaseService';
import { Subscription } from '../types';

interface BillingProps {
  onClose: () => void;
  currentPlan: string;
  subscription?: Subscription;
}

export const Billing: React.FC<BillingProps> = ({ onClose, currentPlan, subscription }) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<Subscription | null>(null);
  const [showOperators, setShowOperators] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedOperator, setSelectedOperator] = useState<'mpesa' | 'emola' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const daysRemaining = subscription?.expires_at 
    ? Math.ceil((subscription.expires_at.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 3;

  const validatePhoneNumber = (number: string, operator: 'mpesa' | 'emola'): string | null => {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.length !== 9) {
      return 'O número deve ter exatamente 9 dígitos.';
    }

    if (operator === 'mpesa') {
      if (!['84', '85'].includes(cleanNumber.substring(0, 2))) {
        return 'Para M-Pesa, o número deve começar com 84 ou 85.';
      }
    } else if (operator === 'emola') {
      if (!['86', '87'].includes(cleanNumber.substring(0, 2))) {
        return 'Para e-Mola, o número deve começar com 86 ou 87.';
      }
    }

    return null;
  };

  const handlePlanClick = (plan: any) => {
    if (plan.current) return;
    setSelectedPlan(plan);
    setShowOperators(true);
  };

  const handleOperatorSelect = (operator: 'mpesa' | 'emola') => {
    setSelectedOperator(operator);
    setPhoneError(null);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !selectedOperator || !phoneNumber) return;
    
    const error = validatePhoneNumber(phoneNumber, selectedOperator);
    if (error) {
      setPhoneError(error);
      return;
    }

    setPhoneError(null);
    setIsProcessing(selectedPlan.name);
    
    try {
      const user = await supabaseService.getCurrentUser();
      
      // Limpa o preço para garantir que seja um número válido (ex: "MZN 1.500" -> 1500)
      const rawPrice = selectedPlan.price.replace('MZN ', '').replace('.', '').replace(',', '.');
      const numericAmount = parseFloat(rawPrice);
      
      const sub = await paymentService.initiateSubscription({
        amount: numericAmount,
        planName: selectedPlan.name,
        customerEmail: user?.email || 'usuario@exemplo.com',
        phoneNumber: phoneNumber,
        paymentMethod: selectedOperator
      });

      setPaymentSuccess(sub);
    } catch (err) {
      console.error('Erro no pagamento:', err);
      alert('Erro ao processar pagamento: ' + (err instanceof Error ? err.message : 'Tente novamente.'));
    } finally {
      setIsProcessing(null);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: 'MZN 0',
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
      price: 'MZN 1.500',
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
      accent: 'text-emerald-500'
    },
    {
      name: 'Premium',
      price: 'MZN 3.000',
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
      accent: 'text-emerald-600'
    }
  ];

  return (
    <div className="fixed inset-0 z-[250] bg-white dark:bg-zinc-950 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        <div className="flex justify-between items-start mb-12 md:mb-16">
          <div className="animate-in slide-in-from-left-8 duration-700">
            {paymentSuccess ? (
              <>
                <h2 className="text-3xl md:text-5xl font-bold text-emerald-600 dark:text-emerald-500 tracking-tighter mb-4">
                  Sucesso<span className="text-zinc-900 dark:text-white">!</span>
                </h2>
                <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
                  Pagamento confirmado! Seu plano <strong>{paymentSuccess.plan_name}</strong> está ativo.
                </p>
              </>
            ) : subscription && !showOperators ? (
              <>
                <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tighter mb-6">
                  Sua Conta<span className="text-emerald-500">.</span>
                </h2>
                <div className="flex flex-col gap-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[5px] max-w-md">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-2 bg-emerald-500 text-white rounded-[5px]">
                        <Crown className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Plano {subscription.plan_name}</h3>
                        <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Assinatura Ativa</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-zinc-900 p-4 rounded-[5px] border border-zinc-200 dark:border-white/5">
                        <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">
                          <Clock className="w-3 h-3" />
                          Restam
                        </div>
                        <div className="text-xl font-bold text-zinc-900 dark:text-white">{daysRemaining} dias</div>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 p-4 rounded-[5px] border border-zinc-200 dark:border-white/5">
                        <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">
                          <Calendar className="w-3 h-3" />
                          Expira em
                        </div>
                        <div className="text-sm font-bold text-zinc-900 dark:text-white">
                          {subscription.expires_at?.toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {isExpiringSoon && (
                      <div className="mt-4 flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-[5px] text-orange-600 dark:text-orange-400">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-xs font-bold leading-tight">Sua assinatura expira em breve! Renove agora para não perder o acesso.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : showOperators ? (
              <>
                <button 
                  onClick={() => { setShowOperators(false); setSelectedOperator(null); }}
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 mb-4 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-sm font-medium">Voltar aos planos</span>
                </button>
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tighter mb-4">
                  Pagamento<span className="text-emerald-500">.</span>
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
                  Selecione a operadora e insira seu número para pagar <strong>{selectedPlan?.price}</strong>.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tighter mb-6">
                  Planos<span className="text-emerald-500">.</span>
                </h2>
                <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
                  Escolha a potência ideal para suas conversas e criações. Sem contratos, cancele quando quiser.
                </p>
              </>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-4 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-all hover:rotate-90 duration-300"
          >
            <X className="w-8 h-8 text-zinc-400" />
          </button>
        </div>

        {paymentSuccess ? (
          <div className="max-w-md animate-in fade-in zoom-in duration-700">
            <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 p-8 rounded-[5px] text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Assinatura Ativada!</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                  Seu plano <strong>{paymentSuccess.plan_name}</strong> está ativo até {paymentSuccess.expires_at?.toLocaleDateString()}.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-[5px] font-bold text-base transition-all shadow-lg shadow-emerald-500/20"
              >
                Começar a usar
              </button>
            </div>
          </div>
        ) : showOperators ? (
          <div className="max-w-2xl">
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'mpesa', name: 'M-Pesa', activeColor: 'bg-[#E61C2E] border-[#E61C2E] text-white', inactiveColor: 'bg-[#E61C2E]/10 border-transparent text-[#E61C2E]' },
                  { id: 'emola', name: 'e-Mola', activeColor: 'bg-[#FF6B00] border-[#FF6B00] text-white', inactiveColor: 'bg-[#FF6B00]/10 border-transparent text-[#FF6B00]' }
                ].map((op) => (
                  <button
                    key={op.id}
                    onClick={() => handleOperatorSelect(op.id as 'mpesa' | 'emola')}
                    className={`group relative p-4 rounded-[5px] border-2 flex flex-col items-center gap-3 ${
                      selectedOperator === op.id 
                        ? op.activeColor
                        : op.inactiveColor
                    }`}
                  >
                    <div className={`p-3 rounded-full ${selectedOperator === op.id ? 'bg-white/20' : 'bg-current/10'}`}>
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold">
                      {op.name}
                    </span>
                  </button>
                ))}
              </div>

              {selectedOperator && (
                <div className="space-y-6">
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Número de Telefone</label>
                    <input 
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        if (phoneError) setPhoneError(null);
                      }}
                      placeholder="Ex: 84XXXXXXX"
                      className={`w-full bg-transparent border-b-2 ${phoneError ? 'border-red-500' : 'border-zinc-200 dark:border-white/10'} px-0 py-2 text-2xl font-bold focus:border-emerald-500 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-800`}
                      autoFocus
                    />
                    {phoneError && (
                      <p className="text-red-500 text-[10px] font-bold mt-1">
                        {phoneError}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleSubscribe}
                    disabled={!!isProcessing}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-[5px] font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-emerald-500/20"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processando...</span>
                      </>
                    ) : (
                      <span>Fazer Pagamento</span>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-zinc-500 font-medium">
                    {isProcessing ? 'Aguardando confirmação do pagamento...' : 'Você receberá uma notificação no seu celular para autorizar o pagamento.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex md:grid md:grid-cols-3 gap-8 overflow-x-auto md:overflow-x-visible pb-12 snap-x snap-mandatory scroll-px-6">
            {plans.map((plan, idx) => (
              <div 
                key={plan.name}
                style={{ animationDelay: `${idx * 100}ms` }}
                className="shrink-0 w-[260px] md:w-auto snap-center flex flex-col animate-in slide-in-from-bottom-8 duration-700 fill-mode-both bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-[5px] border border-zinc-200 dark:border-white/5"
              >
                <div className="mb-6">
                  <div className={`mb-4 ${plan.accent}`}>
                    <plan.icon className="w-8 h-8" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">{plan.name}</h3>
                    {plan.popular && (
                      <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-bold uppercase tracking-widest rounded-[2px]">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed min-h-[32px]">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tighter">{plan.price}</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">{plan.period}</span>
                  </div>
                </div>

                <div className="flex-1 mb-8">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300 group">
                        <div className={`mt-1 w-1 h-1 rounded-full shrink-0 transition-transform group-hover:scale-150 ${plan.accent.replace('text-', 'bg-')}`} />
                        <span className="leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handlePlanClick(plan)}
                  className={`group relative w-full py-3 rounded-[5px] font-bold text-sm transition-all overflow-hidden flex items-center justify-center gap-2 ${
                    plan.current 
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default' 
                      : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                  disabled={plan.current}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="relative z-10">
                    {plan.current ? 'Plano Atual' : 'Escolher Plano'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-20 pt-12 border-t border-zinc-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 animate-in fade-in duration-1000">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-emerald-500/10 rounded-[5px]">
              <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
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

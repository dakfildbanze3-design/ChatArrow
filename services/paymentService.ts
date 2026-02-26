
import { supabase } from './supabaseService';
import { Subscription } from '../types';

export interface DebitPaymentRequest {
  amount: number;
  planName: string;
  customerEmail: string;
  phoneNumber: string;
  paymentMethod: 'mpesa' | 'emola';
}

export const paymentService = {
  /**
   * Inicia o processo de subscrição: cria o registro pendente e chama a Edge Function.
   */
  async initiateSubscription(request: DebitPaymentRequest): Promise<Subscription> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // 1. Criar registro pendente na tabela subscriptions
    const cleanAmount = typeof request.amount === 'string' 
      ? parseFloat(String(request.amount).replace(/[^\d,.]/g, '').replace(',', '.')) 
      : request.amount;

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_name: request.planName,
        price: cleanAmount,
        payment_method: request.paymentMethod,
        phone_number: request.phoneNumber,
        status: 'pending',
        transaction_reference: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      })
      .select()
      .single();

    if (subError) {
      console.error('Erro ao criar subscrição:', subError);
      throw new Error('Falha ao registrar intenção de pagamento no banco de dados.');
    }

    // 2. Chamar a Edge Function para processar o pagamento
    try {
      const functionUrl = 'https://gjhgaiaqqvotterthwuo.supabase.co/functions/v1/debito';
      console.log(`[PaymentService] Chamando Edge Function em ${functionUrl} para subscrição ${subscription.id}`);

      const { data: { session } } = await supabase.auth.getSession();
      
      const paymentPayload = {
        subscriptionId: subscription.id,
        method: request.paymentMethod,
        phoneNumber: String(request.phoneNumber).replace(/\s/g, ''),
        amount: Math.round(Number(cleanAmount))
      };

      console.log('[PaymentService] Enviando JSON para faturamento:', JSON.stringify(paymentPayload, null, 2));
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify(paymentPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[PaymentService] Erro retornado pela Edge Function:', errorData);
        await this.updateSubscriptionStatus(subscription.id, 'failed');
        throw new Error(errorData.error || errorData.message || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('[PaymentService] Resposta da Edge Function:', data);

      // Busca a subscrição atualizada para ter a data de expiração correta
      const { data: updatedSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscription.id)
        .single();

      return {
        ...(updatedSub || subscription),
        created_at: new Date((updatedSub || subscription).created_at),
        expires_at: (updatedSub || subscription).expires_at ? new Date((updatedSub || subscription).expires_at) : null
      };
    } catch (err) {
      console.error('[PaymentService] Erro crítico na chamada da Edge Function:', err);
      await this.updateSubscriptionStatus(subscription.id, 'failed');
      
      if (err instanceof Error && (err.message === 'Failed to fetch' || err.message.includes('NetworkError'))) {
        throw new Error('Não foi possível conectar ao servidor de pagamento. Verifique sua conexão ou se a função está ativa.');
      }
      
      throw err;
    }
  },

  async updateSubscriptionStatus(id: string, status: 'paid' | 'failed'): Promise<void> {
    const expiresAt = status === 'paid' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;
    
    await supabase
      .from('subscriptions')
      .update({ 
        status, 
        expires_at: expiresAt 
      })
      .eq('id', id);
  },

  /**
   * Busca a subscrição ativa do usuário.
   */
  async getActiveSubscription(): Promise<Subscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      ...data,
      created_at: new Date(data.created_at),
      expires_at: new Date(data.expires_at)
    };
  }
};

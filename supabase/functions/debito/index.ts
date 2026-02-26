// supabase/functions/debito/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Lidar com CORS para chamadas do navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Inicializa o cliente Supabase com a chave de serviço para poder atualizar o banco
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { subscriptionId, method, phoneNumber, amount } = await req.json()
    const debitoApiKey = Deno.env.get('DEBITO_API_KEY')

    if (!debitoApiKey) {
      throw new Error('Configuração ausente: DEBITO_API_KEY não encontrada nos segredos.')
    }

    console.log(`Iniciando pagamento via ${method} (${phoneNumber}) no valor de ${amount} MZN`)

    /**
     * INTEGRAÇÃO COM GATEWAY DEBITO (Moçambique)
     * URL: https://api.debito.co.mz/v1/c2b
     */
    const gatewayResponse = await fetch('https://api.debito.co.mz/v1/c2b', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${debitoApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: phoneNumber,
        amount: amount,
        method: method, // 'mpesa' ou 'emola'
        reference: subscriptionId
      })
    })

    const gatewayData = await gatewayResponse.json()

    if (!gatewayResponse.ok) {
      console.error('Erro no Gateway Debito:', gatewayData)
      
      await supabaseClient
        .from('subscriptions')
        .update({ status: 'failed' })
        .eq('id', subscriptionId)

      throw new Error(gatewayData.message || gatewayData.error || 'Falha na comunicação com o gateway Debito.')
    }

    /**
     * NOTA: Em um cenário real de Mobile Money, o pagamento geralmente é assíncrono.
     * O gateway enviaria um Webhook para outra função sua.
     * Para fins de demonstração, vamos assumir que o STK Push foi enviado com sucesso.
     */
    
    // Atualizamos para 'paid' apenas se o gateway confirmar o sucesso imediato (ou aguardamos webhook)
    const { error: updateError } = await supabaseClient
      .from('subscriptions')
      .update({ 
        status: 'paid',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', subscriptionId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Pedido de pagamento enviado com sucesso! Verifique seu celular.',
        gatewayRef: gatewayData.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Erro na Edge Function:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

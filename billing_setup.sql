-- 1. Criar tabela de planos (opcional, mas recomendado para gestão dinâmica)
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'MZN',
  duration_days INTEGER DEFAULT 30,
  features TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de subscrições
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('mpesa', 'emola')),
  status TEXT CHECK (status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
  transaction_reference TEXT UNIQUE,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Garantir que o usuário tenha apenas uma subscrição ativa por vez (lógica simplificada)
  CONSTRAINT unique_active_subscription UNIQUE (user_id, status) WHERE (status = 'paid')
);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança
-- Usuários podem ver seus próprios pagamentos
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem criar intenções de pagamento
CREATE POLICY "Users can create own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Apenas o sistema (Edge Functions) pode atualizar o status (via service_role)
-- No RLS, isso é implícito se não houver política de UPDATE para usuários normais.

-- Todos podem ver os planos
CREATE POLICY "Anyone can view plans" ON plans
  FOR SELECT USING (true);

-- 5. Função SQL para verificar se o usuário é Premium
CREATE OR REPLACE FUNCTION is_premium(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE subscriptions.user_id = $1
      AND status = 'paid'
      AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Inserir planos iniciais
INSERT INTO plans (name, price, description, features) VALUES
('Pro', 1500, 'Para uso diário com mais recursos.', '{"Acesso ao modelo avançado", "Mensagens ilimitadas", "Geração de imagens (50/mês)", "Histórico ilimitado"}'),
('Premium', 3000, 'Poder total para profissionais.', '{"Modelos de última geração", "Geração de imagens ilimitada", "Respostas mais rápidas", "Suporte VIP 24/7"}')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 1. CRIAR TABELAS
-- ==========================================

-- Tabela de Perfis (Profiles) - Armazena dados do usuário e configurações
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  settings JSONB DEFAULT '{"ai": {"style": "Casual", "length": "Média", "emojis": true, "language": "Português", "personality": "Amigo"}, "model": {"mode": "Criativo", "memory": true, "default": "Gemini 3 Flash"}, "privacy": {"saveHistory": true}, "advanced": {"showTime": false, "showModel": false, "showTokens": false}, "appearance": {"theme": "Escuro", "fontSize": 16, "primaryColor": "#3b82f6"}, "notifications": {"push": true, "sounds": true, "newResponse": true}}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Planos (Plans) - Para não ter planos "chumbados" no código
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'MZN',
  period TEXT DEFAULT '/mês',
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  popular BOOLEAN DEFAULT false,
  icon TEXT,
  accent TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Assinaturas (Subscriptions)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  payment_method TEXT,
  phone_number TEXT,
  status TEXT DEFAULT 'pending',
  transaction_reference TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Conversas (Conversations)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  system_instruction TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Mensagens (Messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  text TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  grounding_urls JSONB DEFAULT '[]'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. HABILITAR RLS (Row Level Security)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. POLÍTICAS DE SEGURANÇA (RLS POLICIES)
-- ==========================================

-- PROFILES
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid()::text = id::text);

-- PLANS
CREATE POLICY "Qualquer pessoa pode ver os planos ativos" ON public.plans FOR SELECT USING (active = true);

-- SUBSCRIPTIONS
CREATE POLICY "Usuários podem ver suas próprias assinaturas" ON public.subscriptions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Usuários podem inserir suas próprias assinaturas" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Usuários podem atualizar suas próprias assinaturas" ON public.subscriptions FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Service Role pode gerenciar todas as assinaturas" ON public.subscriptions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- CONVERSATIONS
CREATE POLICY "Usuários podem ver suas próprias conversas" ON public.conversations FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Usuários podem inserir suas próprias conversas" ON public.conversations FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Usuários podem atualizar suas próprias conversas" ON public.conversations FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Usuários podem deletar suas próprias conversas" ON public.conversations FOR DELETE USING (auth.uid()::text = user_id::text);

-- MESSAGES
CREATE POLICY "Usuários podem ver mensagens de suas conversas" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id::text = messages.conversation_id::text AND conversations.user_id::text = auth.uid()::text)
);
CREATE POLICY "Usuários podem inserir mensagens em suas conversas" ON public.messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id::text = messages.conversation_id::text AND conversations.user_id::text = auth.uid()::text)
);
CREATE POLICY "Usuários podem atualizar mensagens de suas conversas" ON public.messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id::text = messages.conversation_id::text AND conversations.user_id::text = auth.uid()::text)
);
CREATE POLICY "Usuários podem deletar mensagens de suas conversas" ON public.messages FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id::text = messages.conversation_id::text AND conversations.user_id::text = auth.uid()::text)
);

-- ==========================================
-- 4. TRIGGERS E FUNÇÕES (Automação)
-- ==========================================

-- Função para criar perfil automaticamente quando um usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que dispara a função acima após a criação de um usuário na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 5. INSERIR DADOS INICIAIS (Planos)
-- ==========================================
INSERT INTO public.plans (name, price, description, features, popular, icon, accent) VALUES
('Free', 0, 'Para quem está começando a explorar IA.', '["Acesso ao modelo básico", "10 mensagens por dia", "Histórico de 3 dias", "Suporte da comunidade"]'::jsonb, false, 'Star', 'text-zinc-400')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.plans (name, price, description, features, popular, icon, accent) VALUES
('Pro', 1500, 'Para uso diário com mais recursos.', '["Acesso ao modelo avançado", "Mensagens ilimitadas", "Geração de imagens (50/mês)", "Histórico ilimitado", "Suporte prioritário"]'::jsonb, true, 'Zap', 'text-emerald-500')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.plans (name, price, description, features, popular, icon, accent) VALUES
('Premium', 3000, 'Poder total para profissionais.', '["Modelos de última geração (Gemini 1.5 Pro)", "Geração de imagens ilimitada", "Respostas mais rápidas", "Acesso antecipado a novos recursos", "Suporte VIP 24/7"]'::jsonb, false, 'Crown', 'text-emerald-600')
ON CONFLICT (name) DO NOTHING;

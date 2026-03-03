-- Habilitar RLS em todas as tabelas
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela 'conversations'
-- Usuários só podem ver, inserir, atualizar e deletar suas próprias conversas
CREATE POLICY "Usuários podem ver suas próprias conversas" 
ON public.conversations FOR SELECT 
USING (auth.uid() = user_id::uuid);

CREATE POLICY "Usuários podem inserir suas próprias conversas" 
ON public.conversations FOR INSERT 
WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Usuários podem atualizar suas próprias conversas" 
ON public.conversations FOR UPDATE 
USING (auth.uid() = user_id::uuid);

CREATE POLICY "Usuários podem deletar suas próprias conversas" 
ON public.conversations FOR DELETE 
USING (auth.uid() = user_id::uuid);

-- Políticas para a tabela 'messages'
-- Mensagens pertencem a uma conversa, então verificamos se o usuário é dono da conversa
CREATE POLICY "Usuários podem ver mensagens de suas conversas" 
ON public.messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id::uuid = auth.uid()
  )
);

CREATE POLICY "Usuários podem inserir mensagens em suas conversas" 
ON public.messages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id::uuid = auth.uid()
  )
);

CREATE POLICY "Usuários podem atualizar mensagens de suas conversas" 
ON public.messages FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id::uuid = auth.uid()
  )
);

CREATE POLICY "Usuários podem deletar mensagens de suas conversas" 
ON public.messages FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id::uuid = auth.uid()
  )
);

-- Políticas para a tabela 'subscriptions'
-- Usuários só podem ver, inserir e atualizar suas próprias assinaturas
CREATE POLICY "Usuários podem ver suas próprias assinaturas" 
ON public.subscriptions FOR SELECT 
USING (auth.uid() = user_id::uuid);

CREATE POLICY "Usuários podem inserir suas próprias assinaturas" 
ON public.subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Usuários podem atualizar suas próprias assinaturas" 
ON public.subscriptions FOR UPDATE 
USING (auth.uid() = user_id::uuid);

CREATE POLICY "Usuários podem deletar suas próprias assinaturas" 
ON public.subscriptions FOR DELETE 
USING (auth.uid() = user_id::uuid);

-- Permitir que a Edge Function (Service Role) gerencie assinaturas
CREATE POLICY "Service Role pode gerenciar todas as assinaturas" 
ON public.subscriptions FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

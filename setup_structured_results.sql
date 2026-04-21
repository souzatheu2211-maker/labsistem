-- 1. Criação da tabela de resultados individuais (Dados Estruturados)
-- Esta tabela armazena o valor real coletado para cada parâmetro do exame.
CREATE TABLE IF NOT EXISTS public.service_exam_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_exam_id UUID REFERENCES public.service_exams(id) ON DELETE CASCADE,
  parameter_name TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ativação do Row Level Security (RLS)
-- Garante que a tabela siga as regras de segurança do Supabase.
ALTER TABLE public.service_exam_results ENABLE ROW LEVEL SECURITY;

-- 3. Criação da política de acesso
-- Permite que técnicos e administradores gerenciem os resultados.
CREATE POLICY "service_exam_results_access" ON public.service_exam_results
FOR ALL TO authenticated USING (true) WITH CHECK (true);
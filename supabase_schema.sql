-- Tabela de Campos de Exames (Sub-itens)
CREATE TABLE IF NOT EXISTS public.exam_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    internal_name TEXT NOT NULL,
    unit TEXT,
    reference_value TEXT,
    field_type TEXT DEFAULT 'number', -- number, text, select, boolean, title
    options JSONB, -- Para campos do tipo select
    category TEXT, -- Ex: ERITROGRAMA, EXAME FISICO
    order_index INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    is_highlight BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajuste na tabela de exames do atendimento para suportar JSONB
ALTER TABLE public.service_exams ADD COLUMN IF NOT EXISTS structured_results JSONB DEFAULT '{}';

-- Políticas de RLS para a nova tabela
ALTER TABLE public.exam_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON public.exam_fields FOR ALL TO authenticated USING (true);

-- Inserção de exemplo: Campos do Hemograma (Eritrograma)
-- Nota: Isso é apenas um exemplo, você poderá configurar todos via interface.
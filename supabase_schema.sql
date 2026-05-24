-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'tecnico',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    birth_date DATE NOT NULL,
    gender TEXT,
    phone TEXT,
    address TEXT,
    observations TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Exams Table
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Services Table (Atendimentos)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    is_emergency BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pendente',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Service Exams Table (Exames do Atendimento)
CREATE TABLE IF NOT EXISTS public.service_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'aguardando',
    result_value TEXT,
    updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Pre-Reports Table (Modelos de Laudo)
CREATE TABLE IF NOT EXISTS public.pre_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    name TEXT,
    content TEXT,
    sector TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_reports ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Allow authenticated users to do everything for now)
-- In a production app, these should be more restrictive based on roles.
CREATE POLICY "Allow all for authenticated users" ON public.profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.patients FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.exams FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.services FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.service_exams FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.pre_reports FOR ALL TO authenticated USING (true);

-- Function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    CASE 
      WHEN NEW.email = 'theu@lab.com' THEN 'admin'
      ELSE 'tecnico'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user profiles
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Instructions for the user:
-- 1. Go to your Supabase Dashboard.
-- 2. Open the SQL Editor.
-- 3. Paste this entire script and run it.
-- 4. When you sign up with the email 'theu@lab.com', you will automatically be assigned the 'admin' role.

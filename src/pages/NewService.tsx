"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, PlusCircle, AlertCircle, CheckCircle2, Loader2, User, FlaskConical } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const NewService = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [patients, setPatients] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [isEmergency, setIsEmergency] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (search.length > 2) {
      searchPatients();
    } else {
      setPatients([]);
    }
  }, [search]);

  const fetchExams = async () => {
    const { data } = await supabase.from('exams').select('*').order('name');
    setExams(data || []);
  };

  const searchPatients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('patients')
      .select('*')
      .or(`full_name.ilike.%${search}%,cpf.ilike.%${search}%`)
      .limit(5);
    setPatients(data || []);
    setLoading(false);
  };

  const toggleExam = (examId: string) => {
    setSelectedExams(prev => 
      prev.includes(examId) ? prev.filter(id => id !== examId) : [...prev, examId]
    );
  };

  const handleFinish = async () => {
    if (!selectedPatient || selectedExams.length === 0) {
      showError('Selecione um paciente e pelo menos um exame.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Criar o Atendimento (Service)
      const { data: service, error: sError } = await supabase
        .from('services')
        .insert([{
          patient_id: selectedPatient.id,
          is_emergency: isEmergency,
          status: 'pendente',
          created_by: user?.id
        }])
        .select()
        .single();

      if (sError) throw sError;

      // 2. Criar os Exames do Atendimento (Service Exams)
      const serviceExams = selectedExams.map(examId => ({
        service_id: service.id,
        exam_id: examId,
        status: 'aguardando'
      }));

      const { error: seError } = await supabase
        .from('service_exams')
        .insert(serviceExams);

      if (seError) throw seError;

      showSuccess('Atendimento encaminhado para a rotina!');
      navigate('/rotina');
    } catch (error: any) {
      showError(error.message || 'Erro ao criar atendimento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
              <PlusCircle className="w-6 h-6 text-blue-400" />
              Novo Atendimento
            </h1>
            <p className="text-blue-300/50 text-sm mt-1 font-medium">Inicie um novo processo laboratorial para um paciente</p>
          </div>
          {selectedPatient && (
            <Button 
              variant="ghost" 
              onClick={() => { setSelectedPatient(null); setSelectedExams([]); }}
              className="text-red-400 hover:bg-red-500/10 font-bold uppercase text-[10px]"
            >
              Trocar Paciente
            </Button>
          )}
        </div>

        {/* Passo 1: Seleção de Paciente */}
        {!selectedPatient ? (
          <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm">
            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white">1</span>
              Identificação do Paciente
            </h3>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-blue-300/30" />
              <Input 
                placeholder="Pesquisar por Nome ou CPF..." 
                className="bg-blue-900/20 border-blue-500/10 h-12 pl-12 rounded-2xl text-white font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {loading && <Loader2 className="absolute right-4 top-3.5 h-5 w-5 text-blue-400 animate-spin" />}
            </div>
            
            {patients.length > 0 && (
              <div className="mt-4 space-y-2">
                {patients.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setSelectedPatient(p)}
                    className="w-full flex items-center justify-between p-4 bg-blue-900/10 border border-white/5 rounded-xl hover:border-blue-500/50 transition-all group"
                  >
                    <div className="text-left">
                      <p className="text-sm font-bold text-white uppercase">{p.full_name}</p>
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">CPF: {p.cpf}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-[2rem] p-6 flex items-center gap-4 animate-in zoom-in duration-500">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Paciente Selecionado</p>
              <h3 className="text-lg font-bold text-white uppercase">{selectedPatient.full_name}</h3>
            </div>
          </div>
        )}

        {/* Passo 2: Seleção de Exames */}
        {selectedPatient && (
          <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white">2</span>
                Seleção de Exames
              </h3>
              <div className="flex items-center space-x-2 bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">
                <AlertCircle className={cn("w-4 h-4 text-red-400", isEmergency && "animate-pulse")} />
                <Label className="text-[10px] font-black text-red-400 uppercase cursor-pointer">Emergência</Label>
                <Switch checked={isEmergency} onCheckedChange={setIsEmergency} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {exams.map(exam => (
                <button
                  key={exam.id}
                  onClick={() => toggleExam(exam.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all text-left flex items-center justify-between group",
                    selectedExams.includes(exam.id) 
                      ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40" 
                      : "bg-blue-900/10 border-white/5 text-blue-300/60 hover:border-blue-500/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <FlaskConical className={cn("w-4 h-4", selectedExams.includes(exam.id) ? "text-white" : "text-blue-500/50")} />
                    <span className="text-[10px] font-black uppercase tracking-tight">{exam.name}</span>
                  </div>
                  {selectedExams.includes(exam.id) && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
              <div className="text-blue-300/40">
                <p className="text-[10px] font-black uppercase tracking-widest">Total Selecionado</p>
                <p className="text-xl font-bold text-white">{selectedExams.length} Exames</p>
              </div>
              <Button 
                onClick={handleFinish}
                disabled={submitting || selectedExams.length === 0}
                className="bg-emerald-600 hover:bg-emerald-500 rounded-xl px-10 h-12 font-black uppercase text-xs gap-2 shadow-lg shadow-emerald-900/20"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Finalizar Atendimento'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NewService;
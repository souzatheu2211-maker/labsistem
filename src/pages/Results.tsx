"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  FileCheck, 
  Search, 
  FileText, 
  Loader2, 
  ChevronRight, 
  Save, 
  FlaskConical,
  ClipboardCheck
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const Results = () => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  
  const [parameters, setParameters] = useState<any[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingServices();
  }, []);

  const fetchPendingServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        patients (full_name, cpf, gender),
        service_exams (
          id,
          status,
          exam_id,
          exams (name)
        )
      `)
      .order('created_at', { ascending: false });

    if (!error) setServices(data || []);
    setLoading(false);
  };

  const handleSelectExam = async (se: any) => {
    setSelectedExam(se);
    
    // Buscar referências configuradas para este exame
    const { data: refs } = await supabase
      .from('reference_values')
      .select('*')
      .eq('exam_id', se.exam_id)
      .order('created_at');

    setParameters(refs || []);

    // Buscar resultados já salvos, se existirem
    const { data: existingResults } = await supabase
      .from('service_exam_results')
      .select('*')
      .eq('service_exam_id', se.id);

    const initialValues: Record<string, string> = {};
    refs?.forEach(r => {
      const saved = existingResults?.find(er => er.parameter_name === r.parameter);
      initialValues[r.parameter] = saved?.value || '';
    });
    setValues(initialValues);
  };

  const handleValueChange = (param: string, val: string) => {
    setValues(prev => ({ ...prev, [param]: val }));
  };

  const handleSaveResult = async () => {
    if (!selectedExam) return;
    setSubmitting(true);
    try {
      // 1. Salvar resultados estruturados
      const resultsToInsert = Object.entries(values).map(([param, val]) => ({
        service_exam_id: selectedExam.id,
        parameter_name: param,
        value: val
      }));

      // Limpar antigos e inserir novos
      await supabase.from('service_exam_results').delete().eq('service_exam_id', selectedExam.id);
      const { error: resError } = await supabase.from('service_exam_results').insert(resultsToInsert);
      
      if (resError) throw resError;

      // 2. Atualizar status do exame
      const { error: examError } = await supabase
        .from('service_exams')
        .update({ status: 'finalizado' })
        .eq('id', selectedExam.id);

      if (examError) throw examError;

      showSuccess('Resultados estruturados salvos!');
      
      // Verificar se todos os exames do atendimento foram finalizados
      const updatedExams = selectedService.service_exams.map((se: any) => 
        se.id === selectedExam.id ? { ...se, status: 'finalizado' } : se
      );
      
      if (updatedExams.every((se: any) => se.status === 'finalizado')) {
        await supabase.from('services').update({ status: 'finalizado' }).eq('id', selectedService.id);
      }

      setSelectedExam(null);
      fetchPendingServices();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServices = services.filter(s => 
    s.patients?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.patients?.cpf.includes(search)
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
              <FileCheck className="w-6 h-6 text-blue-400" />
              Lançamento Estruturado
            </h1>
            <p className="text-blue-300/50 text-sm mt-1 font-medium">Insira os valores baseados nas referências do sistema</p>
          </div>
          {selectedService && (
            <Button variant="ghost" onClick={() => { setSelectedService(null); setSelectedExam(null); }} className="text-blue-400 hover:bg-blue-500/10 font-bold uppercase text-[10px]">
              Voltar para a Fila
            </Button>
          )}
        </div>

        {!selectedService ? (
          <>
            <div className="relative">
              <Search className="absolute left-4 top-3 h-4 w-4 text-blue-300/30" />
              <Input 
                placeholder="Buscar paciente na fila..." 
                className="bg-blue-950/40 border-white/5 h-10 pl-10 rounded-xl text-white font-bold text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Carregando atendimentos...</p>
              </div>
            ) : filteredServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                  <button 
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={cn(
                      "bg-blue-950/30 border p-6 rounded-[2rem] backdrop-blur-sm hover:border-blue-500/30 transition-all text-left group",
                      service.status === 'finalizado' ? "border-emerald-500/20" : "border-white/5"
                    )}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                        service.status === 'finalizado' ? "bg-emerald-500 text-white" : "bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white"
                      )}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase line-clamp-1">{service.patients?.full_name}</h3>
                        <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">CPF: {service.patients?.cpf}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {service.service_exams?.map((se: any) => (
                        <div key={se.id} className="flex items-center justify-between text-[9px] font-black uppercase tracking-tight">
                          <span className="text-blue-300/40">{se.exams?.name}</span>
                          <span className={cn(se.status === 'finalizado' ? "text-emerald-400" : "text-amber-400")}>
                            {se.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 opacity-20">
                <FileText className="w-12 h-12 mb-4" />
                <p className="font-bold uppercase tracking-widest text-xs">Nenhum atendimento encontrado</p>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in zoom-in duration-500">
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-[2rem] p-6">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Paciente</p>
                <h3 className="text-lg font-bold text-white uppercase">{selectedService.patients?.full_name}</h3>
                <p className="text-[10px] text-blue-300/60 font-bold uppercase mt-1">Sexo: {selectedService.patients?.gender}</p>
              </div>
              
              <div className="space-y-2">
                {selectedService.service_exams?.map((se: any) => (
                  <button
                    key={se.id}
                    onClick={() => handleSelectExam(se)}
                    className={cn(
                      "w-full p-4 rounded-2xl border transition-all flex items-center justify-between group",
                      selectedExam?.id === se.id 
                        ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40" 
                        : "bg-blue-950/30 border-white/5 text-blue-300/60 hover:border-blue-500/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <FlaskConical className={cn("w-4 h-4", selectedExam?.id === se.id ? "text-white" : "text-blue-500/50")} />
                      <span className="text-[10px] font-black uppercase tracking-tight">{se.exams?.name}</span>
                    </div>
                    {se.status === 'finalizado' ? <ClipboardCheck className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8">
              {selectedExam ? (
                <div className="bg-blue-950/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">{selectedExam.exams?.name}</h3>
                      <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Preenchimento de Parâmetros</p>
                    </div>
                    <Button 
                      onClick={handleSaveResult}
                      disabled={submitting}
                      className="bg-emerald-600 hover:bg-emerald-500 rounded-xl gap-2 font-bold uppercase text-[10px] px-8 h-11 shadow-lg shadow-emerald-900/20"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Finalizar Exame</>}
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {parameters.length > 0 ? (
                      parameters.map((param) => (
                        <div key={param.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 bg-blue-900/10 rounded-2xl border border-white/5">
                          <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">Parâmetro</label>
                            <p className="text-sm font-bold text-white uppercase">{param.parameter}</p>
                          </div>
                          <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">Resultado ({param.unit})</label>
                            <Input 
                              value={values[param.parameter] || ''}
                              onChange={(e) => handleValueChange(param.parameter, e.target.value)}
                              className="bg-blue-900/20 border-blue-500/20 h-10 rounded-xl text-white font-bold text-xs"
                              placeholder="Valor..."
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-blue-300/30 uppercase tracking-widest block mb-1">Referência</label>
                            <p className="text-[10px] text-blue-300/50 font-medium italic">
                              {selectedService.patients?.gender === 'masculino' ? param.male_ref : 
                               selectedService.patients?.gender === 'feminino' ? param.female_ref : 
                               param.general_ref} {param.unit}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                        <p className="text-blue-300/20 font-bold uppercase text-xs tracking-widest">
                          Nenhuma referência cadastrada para este exame.<br/>
                          Configure em Configurações > Cadastro de Exames.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-[500px] flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                  <FlaskConical className="w-16 h-16 mb-4" />
                  <p className="font-bold uppercase tracking-widest text-sm">Selecione um exame ao lado para lançar os resultados</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Results;
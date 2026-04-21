"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileCheck, Search, FileText, Loader2, ChevronRight, Save, X, FlaskConical } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const Results = () => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [resultValue, setResultValue] = useState('');
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
        patients (full_name, cpf),
        service_exams (
          id,
          status,
          result_value,
          exam_id,
          exams (name)
        )
      `)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });

    if (!error) setServices(data || []);
    setLoading(false);
  };

  const handleSelectExam = async (se: any) => {
    setSelectedExam(se);
    
    // Tentar buscar um pré-laudo para este exame
    const { data: preReport } = await supabase
      .from('pre_reports')
      .where('exam_id', 'eq', se.exam_id)
      .maybeSingle();

    setResultValue(se.result_value || preReport?.content || '');
  };

  const handleSaveResult = async () => {
    if (!selectedExam) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('service_exams')
        .update({ 
          result_value: resultValue,
          status: 'finalizado'
        })
        .eq('id', selectedExam.id);

      if (error) throw error;

      showSuccess('Resultado lançado com sucesso!');
      
      // Verificar se todos os exames do atendimento foram finalizados
      const allFinished = selectedService.service_exams.every((se: any) => 
        se.id === selectedExam.id ? true : se.status === 'finalizado'
      );

      if (allFinished) {
        await supabase
          .from('services')
          .update({ status: 'finalizado' })
          .eq('id', selectedService.id);
        
        setSelectedService(null);
        fetchPendingServices();
      } else {
        // Atualizar estado local
        const updatedExams = selectedService.service_exams.map((se: any) => 
          se.id === selectedExam.id ? { ...se, status: 'finalizado', result_value: resultValue } : se
        );
        setSelectedService({ ...selectedService, service_exams: updatedExams });
      }

      setSelectedExam(null);
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
              Lançamento de Resultados
            </h1>
            <p className="text-blue-300/50 text-sm mt-1 font-medium">Insira os valores dos exames para finalizar os laudos</p>
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
                placeholder="Buscar paciente na fila de resultados..." 
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
                    className="bg-blue-950/30 border border-white/5 p-6 rounded-[2rem] backdrop-blur-sm hover:border-blue-500/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
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
                <p className="font-bold uppercase tracking-widest text-xs">Nenhum atendimento pendente de resultados</p>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in zoom-in duration-500">
            {/* Lista de Exames do Atendimento */}
            <div className="space-y-4">
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-[2rem] p-6">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Paciente</p>
                <h3 className="text-lg font-bold text-white uppercase">{selectedService.patients?.full_name}</h3>
              </div>
              
              <div className="space-y-2">
                {selectedService.service_exams?.map((se: any) => (
                  <button
                    key={se.id}
                    onClick={() => handleSelectExam(se)}
                    className={cn(
                      "w-full p-4 rounded-2xl border transition-all flex items-center justify-between group",
                      selectedExam?.id === se.id 
                        ? "bg-blue-600 border-blue-400 text-white" 
                        : "bg-blue-950/30 border-white/5 text-blue-300/60 hover:border-blue-500/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <FlaskConical className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-tight">{se.exams?.name}</span>
                    </div>
                    {se.status === 'finalizado' ? <FileCheck className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor de Resultado */}
            <div className="lg:col-span-2">
              {selectedExam ? (
                <div className="bg-blue-950/40 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-right duration-500">
                  <div className="bg-blue-900/20 border-b border-white/5 p-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white uppercase tracking-tight">{selectedExam.exams?.name}</h3>
                      <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Lançamento de Valores</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        onClick={handleSaveResult}
                        disabled={submitting}
                        className="bg-emerald-600 hover:bg-emerald-500 rounded-xl gap-2 font-bold uppercase text-[10px] px-6"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Salvar Resultado</>}
                      </Button>
                    </div>
                  </div>
                  <div className="p-8">
                    <Textarea 
                      value={resultValue}
                      onChange={(e) => setResultValue(e.target.value)}
                      className="bg-black/20 border-white/5 min-h-[400px] rounded-2xl text-blue-50 font-mono text-sm p-6 resize-none focus:ring-blue-500/30 leading-relaxed"
                      placeholder="Digite ou edite o laudo aqui..."
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-32 opacity-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                  <FlaskConical className="w-16 h-16 mb-4" />
                  <p className="font-bold uppercase tracking-widest text-sm">Selecione um exame ao lado para lançar o resultado</p>
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
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  FileCheck, 
  Search, 
  FileText, 
  Loader2, 
  ChevronRight, 
  Save, 
  FlaskConical,
  Type,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';
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
  
  // Estados do Editor
  const [template, setTemplate] = useState('');
  const [parameters, setParameters] = useState<string[]>([]);
  const [manualText, setManualText] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
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
      .order('created_at', { ascending: false });

    if (!error) setServices(data || []);
    setLoading(false);
  };

  // Extrai os rótulos próximos aos (?) para ajudar no preenchimento
  const getParamLabels = (text: string) => {
    const parts = text.split('(?)');
    return parts.slice(0, -1).map(part => {
      const lines = part.trim().split('\n');
      const lastLine = lines[lines.length - 1].trim();
      const label = lastLine.split(/[:.]/).pop()?.trim() || lastLine.slice(-20).trim();
      return label || "Valor";
    });
  };

  const handleSelectExam = async (se: any) => {
    setSelectedExam(se);
    setIsManualMode(!!se.result_value);
    
    const { data: preReport } = await supabase
      .from('pre_reports')
      .select('content')
      .eq('exam_id', se.exam_id)
      .maybeSingle();

    const baseTemplate = preReport?.content || '';
    setTemplate(baseTemplate);

    if (se.result_value) {
      setManualText(se.result_value);
    } else {
      setManualText(baseTemplate);
      const count = (baseTemplate.match(/\(\?\)/g) || []).length;
      setParameters(new Array(count).fill(''));
    }
  };

  // Monta o laudo final em tempo real
  const finalReport = useMemo(() => {
    if (isManualMode) return manualText;
    
    let result = template;
    parameters.forEach(param => {
      result = result.replace('(?)', param || '___');
    });
    return result;
  }, [template, parameters, manualText, isManualMode]);

  const handleParamChange = (index: number, value: string) => {
    const newParams = [...parameters];
    newParams[index] = value;
    setParameters(newParams);
  };

  const handleSaveResult = async () => {
    if (!selectedExam) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('service_exams')
        .update({ 
          result_value: finalReport,
          status: 'finalizado'
        })
        .eq('id', selectedExam.id);

      if (error) throw error;

      showSuccess('Resultado salvo com sucesso!');
      
      // Atualiza estado local
      const updatedExams = selectedService.service_exams.map((se: any) => 
        se.id === selectedExam.id ? { ...se, status: 'finalizado', result_value: finalReport } : se
      );
      
      const allFinished = updatedExams.every((se: any) => se.status === 'finalizado');
      if (allFinished) {
        await supabase.from('services').update({ status: 'finalizado' }).eq('id', selectedService.id);
      }

      setSelectedService({ ...selectedService, service_exams: updatedExams });
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

  const paramLabels = useMemo(() => getParamLabels(template), [template]);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
              <FileCheck className="w-6 h-6 text-blue-400" />
              Lançamento de Resultados
            </h1>
            <p className="text-blue-300/50 text-sm mt-1 font-medium">Preencha os valores e visualize o laudo em tempo real</p>
          </div>
          {selectedService && (
            <Button 
              variant="ghost" 
              onClick={() => { setSelectedService(null); setSelectedExam(null); }} 
              className="text-blue-400 hover:bg-blue-500/10 font-bold uppercase text-[10px] gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para a Fila
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
            {/* Sidebar de Exames */}
            <div className="lg:col-span-3 space-y-4">
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
                        ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40" 
                        : "bg-blue-950/30 border-white/5 text-blue-300/60 hover:border-blue-500/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <FlaskConical className={cn("w-4 h-4", selectedExam?.id === se.id ? "text-white" : "text-blue-500/50")} />
                      <span className="text-[10px] font-black uppercase tracking-tight">{se.exams?.name}</span>
                    </div>
                    {se.status === 'finalizado' ? <FileCheck className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor e Preview */}
            <div className="lg:col-span-9">
              {selectedExam ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  
                  {/* Caixinha de Resultados (Inputs) */}
                  <div className="space-y-4">
                    <div className="bg-blue-950/40 border border-white/10 rounded-[2.5rem] p-8 shadow-xl">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                          Preenchimento de Valores
                        </h3>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setIsManualMode(!isManualMode)}
                          className={cn("h-9 w-9 rounded-xl", isManualMode ? "text-amber-400 bg-amber-400/10" : "text-blue-400 hover:bg-blue-500/10")}
                          title={isManualMode ? "Voltar para automático" : "Editar texto manualmente"}
                        >
                          {isManualMode ? <RotateCcw className="w-5 h-5" /> : <Type className="w-5 h-5" />}
                        </Button>
                      </div>

                      {isManualMode ? (
                        <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                          <p className="text-[10px] font-bold text-amber-400 uppercase leading-relaxed text-center">
                            Modo de edição manual ativado.<br/>Altere o texto diretamente no quadro ao lado.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-5 max-h-[550px] overflow-y-auto pr-4 custom-scrollbar">
                          {parameters.map((param, idx) => (
                            <div key={idx} className="space-y-2 group">
                              <label className="text-[10px] font-black text-blue-300/40 uppercase tracking-widest ml-1 group-focus-within:text-blue-400 transition-colors">
                                {paramLabels[idx] || `Campo ${idx + 1}`}
                              </label>
                              <Input 
                                value={param}
                                onChange={(e) => handleParamChange(idx, e.target.value)}
                                className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white font-bold text-sm focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                placeholder="Digite o valor..."
                                autoFocus={idx === 0}
                              />
                            </div>
                          ))}
                          {parameters.length === 0 && (
                            <div className="text-center py-12 opacity-20">
                              <FlaskConical className="w-12 h-12 mx-auto mb-4" />
                              <p className="text-[10px] font-bold uppercase tracking-widest">Este modelo não possui campos automáticos.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quadro do Laudo (Preview) */}
                  <div className="space-y-4">
                    <div className="bg-blue-950/60 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-full">
                      <div className="bg-blue-900/30 border-b border-white/5 p-6 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white uppercase tracking-tight">{selectedExam.exams?.name}</h3>
                          <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Visualização do Laudo</p>
                        </div>
                        <Button 
                          onClick={handleSaveResult}
                          disabled={submitting}
                          className="bg-emerald-600 hover:bg-emerald-500 rounded-xl gap-2 font-bold uppercase text-[10px] px-8 h-11 shadow-lg shadow-emerald-900/20"
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Salvar Resultado</>}
                        </Button>
                      </div>
                      
                      <div className="p-8 flex-grow bg-black/20">
                        <Textarea 
                          value={finalReport}
                          onChange={(e) => isManualMode && setManualText(e.target.value)}
                          readOnly={!isManualMode}
                          className={cn(
                            "w-full min-h-[500px] bg-transparent border-none text-blue-50 font-mono text-sm p-0 resize-none leading-relaxed focus:ring-0",
                            !isManualMode && "cursor-default"
                          )}
                          placeholder="O laudo aparecerá aqui..."
                        />
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="h-[600px] flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
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
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Search, 
  FileText, 
  FlaskConical, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2,
  RefreshCw,
  ChevronRight,
  Edit3,
  AlertCircle,
  History
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
  
  // Estados do Editor de Laudo
  const [template, setTemplate] = useState('');
  const [values, setValues] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualContent, setManualContent] = useState('');

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
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

      if (error) throw error;
      setServices(data || []);
      
      // Se houver um serviço selecionado, atualiza ele também
      if (selectedService) {
        const updated = data?.find(s => s.id === selectedService.id);
        if (updated) setSelectedService(updated);
      }
    } catch (err: any) {
      showError('Erro ao sincronizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedService]);

  useEffect(() => {
    fetchServices();
  }, []);

  // Extração de labels mais inteligente
  const fieldLabels = useMemo(() => {
    if (!template) return [];
    return template.split('(?)').slice(0, -1).map(part => {
      const lines = part.trim().split('\n');
      const lastLine = lines[lines.length - 1].trim();
      // Remove caracteres de formatação comuns em laudos
      return lastLine.replace(/[:._\-\*]/g, '').trim() || "Parâmetro";
    });
  }, [template]);

  const handleSelectExam = async (se: any) => {
    setSelectedExam(se);
    setManualMode(false);
    
    try {
      // 1. Busca o modelo base
      const { data: preReport } = await supabase
        .from('pre_reports')
        .select('content')
        .eq('exam_id', se.exam_id)
        .maybeSingle();

      const baseContent = preReport?.content || "Modelo não configurado.";
      setTemplate(baseContent);

      // 2. Se já existe um resultado salvo, entramos em modo manual para não perder dados
      if (se.result_value && se.result_value !== baseContent) {
        setManualContent(se.result_value);
        setManualMode(true);
      } else {
        // 3. Caso contrário, prepara os campos dinâmicos
        const placeholderCount = (baseContent.match(/\(\?\)/g) || []).length;
        setValues(new Array(placeholderCount).fill(''));
      }
    } catch (err: any) {
      showError('Erro ao carregar modelo: ' + err.message);
    }
  };

  const previewContent = useMemo(() => {
    if (manualMode) return manualContent;
    let result = template;
    values.forEach(val => {
      result = result.replace('(?)', val || '______');
    });
    return result;
  }, [template, values, manualMode, manualContent]);

  const handleSave = async () => {
    if (!selectedExam) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('service_exams')
        .update({ 
          result_value: previewContent,
          status: 'finalizado',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedExam.id);

      if (error) throw error;

      showSuccess('Resultado processado!');
      
      // Verifica se todos os exames do atendimento foram concluídos
      const currentExams = selectedService.service_exams.map((se: any) => 
        se.id === selectedExam.id ? { ...se, status: 'finalizado' } : se
      );
      
      if (currentExams.every((se: any) => se.status === 'finalizado')) {
        await supabase.from('services').update({ status: 'finalizado' }).eq('id', selectedService.id);
      }

      setSelectedExam(null);
      await fetchServices();
    } catch (err: any) {
      showError('Falha ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredServices = services.filter(s => 
    s.patients?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.patients?.cpf.includes(search)
  );

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
        
        {/* Header Minimalista */}
        <div className="flex items-center justify-between bg-blue-950/20 p-6 rounded-[2rem] border border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/20 rounded-2xl text-blue-400">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-tight">Estação de Resultados</h1>
              <p className="text-blue-300/40 text-[10px] font-bold uppercase tracking-widest">
                {selectedService ? `Editando: ${selectedService.patients?.full_name}` : 'Fila de processamento laboratorial'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={fetchServices} className="text-blue-400 hover:bg-blue-500/10 rounded-xl h-12 w-12">
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </Button>
            {selectedService && (
              <Button 
                variant="outline" 
                onClick={() => { setSelectedService(null); setSelectedExam(null); }}
                className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10 rounded-xl font-black uppercase text-[10px] px-6 h-12 gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Sair do Atendimento
              </Button>
            )}
          </div>
        </div>

        {!selectedService ? (
          /* LISTA DE ATENDIMENTOS (FILA) */
          <div className="space-y-6">
            <div className="relative group">
              <Search className="absolute left-5 top-4 h-5 w-5 text-blue-300/20 group-focus-within:text-blue-400 transition-colors" />
              <Input 
                placeholder="Filtrar fila por nome ou CPF..." 
                className="bg-blue-950/40 border-white/5 h-14 pl-14 rounded-[1.5rem] text-white font-bold placeholder:text-blue-300/10 focus:ring-blue-500/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-40">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Sincronizando Fila...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredServices.map(service => (
                  <button 
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={cn(
                      "bg-blue-950/30 border p-6 rounded-[2.5rem] backdrop-blur-sm hover:border-blue-500/40 transition-all text-left group relative",
                      service.status === 'finalizado' ? "border-emerald-500/20" : "border-white/5"
                    )}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter",
                        service.status === 'finalizado' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {service.status}
                      </div>
                    </div>
                    
                    <h3 className="text-sm font-bold text-white uppercase mb-1 truncate">{service.patients?.full_name}</h3>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-6">CPF: {service.patients?.cpf}</p>
                    
                    <div className="space-y-2 border-t border-white/5 pt-4">
                      {service.service_exams?.map((se: any) => (
                        <div key={se.id} className="flex items-center justify-between text-[9px] font-black uppercase">
                          <span className="text-blue-300/30 truncate max-w-[150px]">{se.exams?.name}</span>
                          <div className={cn("w-1.5 h-1.5 rounded-full", se.status === 'finalizado' ? "bg-emerald-500" : "bg-amber-500 animate-pulse")}></div>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* WORKSTATION (EDITOR) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-right duration-500">
            
            {/* Sidebar de Exames */}
            <div className="lg:col-span-3 space-y-3">
              <div className="bg-blue-900/20 border border-white/5 rounded-[2rem] p-6 mb-4">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Paciente em Foco</p>
                <h3 className="text-lg font-bold text-white uppercase leading-tight">{selectedService.patients?.full_name}</h3>
              </div>
              
              <div className="space-y-2">
                {selectedService.service_exams?.map((se: any) => (
                  <button
                    key={se.id}
                    onClick={() => handleSelectExam(se)}
                    className={cn(
                      "w-full p-5 rounded-2xl border transition-all flex items-center justify-between group",
                      selectedExam?.id === se.id 
                        ? "bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-900/40" 
                        : "bg-blue-950/40 border-white/5 text-blue-300/40 hover:border-blue-500/30"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <FlaskConical className={cn("w-5 h-5", selectedExam?.id === se.id ? "text-white" : "text-blue-500/30")} />
                      <span className="text-[10px] font-black uppercase tracking-tight">{se.exams?.name}</span>
                    </div>
                    {se.status === 'finalizado' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <ChevronRight className="w-4 h-4 opacity-20" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Central */}
            <div className="lg:col-span-9">
              {selectedExam ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  
                  {/* Painel de Entrada */}
                  <div className="bg-blue-950/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-3">
                        <Edit3 className="w-5 h-5" /> Lançamento de Dados
                      </h3>
                      <Button 
                        variant="ghost" 
                        onClick={() => setManualMode(!manualMode)}
                        className={cn("text-[9px] font-black uppercase gap-2 rounded-xl", manualMode ? "text-amber-400 bg-amber-400/10" : "text-blue-300/30")}
                      >
                        {manualMode ? <AlertCircle className="w-4 h-4" /> : <History className="w-4 h-4" />}
                        {manualMode ? 'Modo Manual Ativo' : 'Alternar Modo'}
                      </Button>
                    </div>
                    
                    <div className="space-y-6 flex-grow overflow-y-auto pr-4 custom-scrollbar max-h-[600px]">
                      {manualMode ? (
                        <div className="space-y-4">
                          <p className="text-[10px] font-bold text-amber-400/60 uppercase text-center bg-amber-400/5 p-4 rounded-xl border border-amber-400/10">
                            Você está editando o texto final diretamente. Use com cautela.
                          </p>
                          <Textarea 
                            value={manualContent}
                            onChange={(e) => setManualContent(e.target.value)}
                            className="bg-blue-900/20 border-white/5 min-h-[400px] rounded-2xl text-white font-mono text-sm p-6 resize-none"
                          />
                        </div>
                      ) : (
                        values.map((val, idx) => (
                          <div key={idx} className="space-y-2 group">
                            <label className="text-[10px] font-black text-blue-300/30 uppercase tracking-widest ml-1 group-focus-within:text-blue-400 transition-colors">
                              {fieldLabels[idx] || `Campo ${idx + 1}`}
                            </label>
                            <Input 
                              value={val}
                              onChange={(e) => {
                                const newVals = [...values];
                                newVals[idx] = e.target.value;
                                setValues(newVals);
                              }}
                              className="bg-blue-900/20 border-blue-500/10 h-14 rounded-2xl text-white font-bold text-base focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                              placeholder="Digite o valor..."
                              autoFocus={idx === 0}
                            />
                          </div>
                        ))
                      )}
                      
                      {!manualMode && values.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 opacity-20">
                          <AlertCircle className="w-12 h-12 mb-4" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum campo dinâmico detectado no modelo.</p>
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full mt-10 bg-emerald-600 hover:bg-emerald-500 h-14 rounded-2xl font-black uppercase text-xs gap-3 shadow-xl shadow-emerald-900/20 transition-all active:scale-95"
                    >
                      {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> Finalizar e Salvar Resultado</>}
                    </Button>
                  </div>

                  {/* Painel de Preview */}
                  <div className="bg-blue-950/60 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
                    <div className="bg-blue-900/30 border-b border-white/5 p-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white uppercase tracking-tight">{selectedExam.exams?.name}</h3>
                          <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Visualização em Tempo Real</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
                          <FileText className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-10 flex-grow bg-black/30">
                      <div className="w-full h-full bg-transparent text-blue-50 font-mono text-sm leading-relaxed whitespace-pre-wrap opacity-80">
                        {previewContent}
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="h-[700px] flex flex-col items-center justify-center opacity-10 border-4 border-dashed border-white/5 rounded-[3rem]">
                  <FlaskConical className="w-24 h-24 mb-6" />
                  <p className="font-black uppercase tracking-[0.3em] text-lg">Selecione um exame para iniciar</p>
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
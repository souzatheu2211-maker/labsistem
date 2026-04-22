"use client";

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Search, 
  FlaskConical, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2,
  RefreshCw,
  ChevronRight,
  Edit3,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const ResultEntry = () => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  
  // Estados do Editor de Laudo
  const [template, setTemplate] = useState('');
  const [fieldValues, setFieldValues] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
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
    } catch (err: any) {
      showError('Erro ao carregar fila: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para extrair os nomes dos campos que vêm antes de cada (?)
  const getFieldLabels = (text: string) => {
    if (!text) return [];
    const parts = text.split('(?)');
    // Pegamos o texto que antecede cada (?) para servir de label (ex: "Glicose: ")
    return parts.slice(0, -1).map(part => {
      const lines = part.trim().split('\n');
      const lastLine = lines[lines.length - 1].trim();
      return lastLine.replace(/[:._]/g, '').trim() || "Valor";
    });
  };

  const handleSelectExam = async (se: any) => {
    setSelectedExam(se);
    
    try {
      // Busca o modelo de laudo (pre_report) para este exame
      const { data: preReport } = await supabase
        .from('pre_reports')
        .select('content')
        .eq('exam_id', se.exam_id)
        .maybeSingle();

      const content = preReport?.content || "Modelo não encontrado para este exame.";
      setTemplate(content);

      // Conta quantos (?) existem no modelo
      const placeholderCount = (content.match(/\(\?\)/g) || []).length;
      
      // Se já houver um resultado salvo, poderíamos tentar extrair os valores, 
      // mas por agora vamos iniciar limpo para garantir a funcionalidade.
      setFieldValues(new Array(placeholderCount).fill(''));
      
    } catch (err: any) {
      showError('Erro ao carregar modelo: ' + err.message);
    }
  };

  // Gera o laudo final substituindo os (?) pelos valores digitados em tempo real
  const previewContent = useMemo(() => {
    let result = template;
    fieldValues.forEach(val => {
      // Substitui apenas a primeira ocorrência de (?) a cada iteração
      result = result.replace('(?)', val || '______');
    });
    return result;
  }, [template, fieldValues]);

  const handleValueChange = (index: number, val: string) => {
    const newValues = [...fieldValues];
    newValues[index] = val;
    setFieldValues(newValues);
  };

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

      showSuccess('Resultado salvo com sucesso!');
      
      // Atualiza o status do atendimento pai se todos os exames estiverem prontos
      const { data: allExams } = await supabase
        .from('service_exams')
        .select('status')
        .eq('service_id', selectedService.id);
      
      if (allExams?.every(e => e.status === 'finalizado')) {
        await supabase.from('services').update({ status: 'finalizado' }).eq('id', selectedService.id);
      }

      setSelectedExam(null);
      fetchServices();
    } catch (err: any) {
      showError('Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredServices = services.filter(s => 
    s.patients?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.patients?.cpf.includes(search)
  );

  const labels = useMemo(() => getFieldLabels(template), [template]);

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* Cabeçalho da Página */}
        <div className="flex items-center justify-between bg-blue-950/20 p-6 rounded-[2rem] border border-white/5">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
              <Edit3 className="w-6 h-6 text-blue-400" />
              Lançamento de Resultados
            </h1>
            <p className="text-blue-300/50 text-sm mt-1 font-medium">
              {selectedService ? `Paciente: ${selectedService.patients?.full_name}` : 'Selecione um paciente na fila para processar os exames'}
            </p>
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
                <ArrowLeft className="w-4 h-4" /> Voltar para Fila
              </Button>
            )}
          </div>
        </div>

        {!selectedService ? (
          /* FILA DE PACIENTES (ROTINA) */
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-5 top-4 h-5 w-5 text-blue-300/20" />
              <Input 
                placeholder="Buscar por nome ou CPF na fila..." 
                className="bg-blue-950/40 border-white/5 h-14 pl-14 rounded-[1.5rem] text-white font-bold placeholder:text-blue-300/10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-40"><Loader2 className="w-12 h-12 text-blue-500 animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredServices.map(service => (
                  <button 
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={cn(
                      "bg-blue-950/30 border p-6 rounded-[2.5rem] backdrop-blur-sm hover:border-blue-500/30 transition-all text-left group relative",
                      service.status === 'finalizado' ? "border-emerald-500/20" : "border-white/5"
                    )}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase truncate max-w-[150px]">{service.patients?.full_name}</h3>
                        <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">CPF: {service.patients?.cpf}</p>
                      </div>
                    </div>
                    <div className="space-y-2 border-t border-white/5 pt-4">
                      {service.service_exams?.map((se: any) => (
                        <div key={se.id} className="flex items-center justify-between text-[9px] font-black uppercase tracking-tight">
                          <span className="text-blue-300/30 truncate max-w-[120px]">{se.exams?.name}</span>
                          <span className={cn(se.status === 'finalizado' ? "text-emerald-400" : "text-amber-400")}>
                            {se.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ESTAÇÃO DE TRABALHO (EDITOR) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in zoom-in duration-500">
            
            {/* Coluna 1: Lista de Exames do Paciente */}
            <div className="lg:col-span-3 space-y-3">
              <div className="bg-blue-900/20 border border-blue-500/20 rounded-[2rem] p-6 mb-4">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Paciente Selecionado</p>
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

            {/* Coluna 2 e 3: Área de Lançamento e Preview */}
            <div className="lg:col-span-9">
              {selectedExam ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  
                  {/* Painel de Inputs (Centro) */}
                  <div className="bg-blue-950/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-10 flex items-center gap-3">
                      <Edit3 className="w-5 h-5" /> Lançar Resultados
                    </h3>
                    
                    <div className="space-y-6 flex-grow overflow-y-auto pr-4 custom-scrollbar max-h-[600px]">
                      {fieldValues.map((val, idx) => (
                        <div key={idx} className="space-y-2 group">
                          <label className="text-[10px] font-black text-blue-300/30 uppercase tracking-widest ml-1 group-focus-within:text-blue-400 transition-colors">
                            {labels[idx] || `Parâmetro ${idx + 1}`}
                          </label>
                          <Input 
                            value={val}
                            onChange={(e) => handleValueChange(idx, e.target.value)}
                            className="bg-blue-900/20 border-blue-500/10 h-14 rounded-2xl text-white font-bold text-base focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                            placeholder="Digite o valor..."
                            autoFocus={idx === 0}
                          />
                        </div>
                      ))}
                      {fieldValues.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 opacity-20">
                          <AlertCircle className="w-12 h-12 mb-4" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">Este modelo não possui campos dinâmicos (?) para preenchimento.</p>
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full mt-10 bg-emerald-600 hover:bg-emerald-500 h-14 rounded-2xl font-black uppercase text-xs gap-3 shadow-xl shadow-emerald-900/20 transition-all active:scale-95"
                    >
                      {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar e Finalizar Exame</>}
                    </Button>
                  </div>

                  {/* Painel de Preview (Direita) */}
                  <div className="bg-blue-950/60 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
                    <div className="bg-blue-900/30 border-b border-white/5 p-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white uppercase tracking-tight">{selectedExam.exams?.name}</h3>
                          <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Visualização do Laudo Oficial</p>
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
                  <p className="font-black uppercase tracking-[0.3em] text-lg">Selecione um exame para iniciar o lançamento</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ResultEntry;
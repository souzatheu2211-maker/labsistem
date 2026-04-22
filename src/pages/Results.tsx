"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  Edit3
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
  const [values, setValues] = useState<string[]>([]);
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
      showError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para identificar os nomes dos campos antes dos (?)
  const getFieldLabels = (text: string) => {
    if (!text) return [];
    const parts = text.split('(?)');
    return parts.slice(0, -1).map(part => {
      const lines = part.trim().split('\n');
      const lastLine = lines[lines.length - 1].trim();
      return lastLine.replace(/[:._]/g, '').trim() || "Campo";
    });
  };

  const handleSelectExam = async (se: any) => {
    setSelectedExam(se);
    
    // Busca o modelo de laudo (pre_report) para este exame
    const { data: preReport } = await supabase
      .from('pre_reports')
      .select('content')
      .eq('exam_id', se.exam_id)
      .maybeSingle();

    const content = preReport?.content || "Modelo não encontrado para este exame.";
    setTemplate(content);

    // Se já tiver resultado, tenta extrair ou limpa
    const placeholderCount = (content.match(/\(\?\)/g) || []).length;
    setValues(new Array(placeholderCount).fill(''));
  };

  // Gera o laudo final substituindo os (?) pelos valores digitados
  const previewContent = useMemo(() => {
    let result = template;
    values.forEach(val => {
      result = result.replace('(?)', val || '______');
    });
    return result;
  }, [template, values]);

  const handleValueChange = (index: number, val: string) => {
    const newValues = [...values];
    newValues[index] = val;
    setValues(newValues);
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
      
      // Atualiza status do atendimento se todos exames estiverem prontos
      const updatedExams = selectedService.service_exams.map((se: any) => 
        se.id === selectedExam.id ? { ...se, status: 'finalizado' } : se
      );
      
      if (updatedExams.every((se: any) => se.status === 'finalizado')) {
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

  const fieldLabels = useMemo(() => getFieldLabels(template), [template]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* Cabeçalho Dinâmico */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
              <FlaskConical className="w-6 h-6 text-blue-400" />
              Central de Resultados
            </h1>
            <p className="text-blue-300/50 text-sm mt-1 font-medium">
              {selectedService ? `Atendimento: ${selectedService.patients?.full_name}` : 'Gerencie e lance os resultados dos exames'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={fetchServices} className="text-blue-400 hover:bg-blue-500/10 rounded-xl">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            {selectedService && (
              <Button 
                variant="ghost" 
                onClick={() => { setSelectedService(null); setSelectedExam(null); }}
                className="text-blue-400 hover:bg-blue-500/10 font-bold uppercase text-[10px] gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar à Fila
              </Button>
            )}
          </div>
        </div>

        {!selectedService ? (
          /* FILA DE ATENDIMENTOS */
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-blue-300/30" />
              <Input 
                placeholder="Buscar paciente na fila por nome ou CPF..." 
                className="bg-blue-950/40 border-white/5 h-12 pl-12 rounded-2xl text-white font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-50">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando com banco de dados...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map(service => (
                  <button 
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={cn(
                      "bg-blue-950/30 border p-6 rounded-[2.5rem] backdrop-blur-sm hover:border-blue-500/30 transition-all text-left group relative overflow-hidden",
                      service.status === 'finalizado' ? "border-emerald-500/20" : "border-white/5"
                    )}
                  >
                    <div className="flex items-center gap-4 mb-6">
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
                          <span className="text-blue-300/30">{se.exams?.name}</span>
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
          /* EDITOR DE RESULTADOS */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in zoom-in duration-500">
            
            {/* Coluna 1: Lista de Exames do Paciente */}
            <div className="lg:col-span-3 space-y-3">
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-[2rem] p-6 mb-6">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Paciente Selecionado</p>
                <h3 className="text-lg font-bold text-white uppercase leading-tight">{selectedService.patients?.full_name}</h3>
              </div>
              
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
                  {se.status === 'finalizado' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </div>

            {/* Coluna 2 e 3: Editor e Preview */}
            <div className="lg:col-span-9">
              {selectedExam ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  
                  {/* CAIXINHA DE RESULTADOS */}
                  <div className="bg-blue-950/40 border border-white/10 rounded-[2.5rem] p-8 shadow-xl h-fit">
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                      <Edit3 className="w-4 h-4" /> Lançamento de Valores
                    </h3>
                    
                    <div className="space-y-5 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                      {values.map((val, idx) => (
                        <div key={idx} className="space-y-2">
                          <label className="text-[10px] font-black text-blue-300/40 uppercase tracking-widest ml-1">
                            {fieldLabels[idx] || `Campo ${idx + 1}`}
                          </label>
                          <Input 
                            value={val}
                            onChange={(e) => handleValueChange(idx, e.target.value)}
                            className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white font-bold text-sm focus:ring-blue-500/50"
                            placeholder="Digite o resultado..."
                            autoFocus={idx === 0}
                          />
                        </div>
                      ))}
                      {values.length === 0 && (
                        <div className="text-center py-12 opacity-20">
                          <p className="text-[10px] font-bold uppercase tracking-widest">Este modelo não possui campos dinâmicos.</p>
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full mt-8 bg-emerald-600 hover:bg-emerald-500 h-12 rounded-xl font-black uppercase text-xs gap-2 shadow-lg shadow-emerald-900/20"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Finalizar e Salvar</>}
                    </Button>
                  </div>

                  {/* QUADRO DE PRE-LAUDO (PREVIEW) */}
                  <div className="bg-blue-950/60 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
                    <div className="bg-blue-900/30 border-b border-white/5 p-6">
                      <h3 className="text-sm font-bold text-white uppercase tracking-tight">{selectedExam.exams?.name}</h3>
                      <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest">Visualização em Tempo Real</p>
                    </div>
                    <div className="p-8 flex-grow bg-black/20">
                      <Textarea 
                        value={previewContent}
                        readOnly
                        className="w-full min-h-[500px] bg-transparent border-none text-blue-50 font-mono text-sm p-0 resize-none leading-relaxed focus:ring-0 cursor-default"
                      />
                    </div>
                  </div>

                </div>
              ) : (
                <div className="h-[600px] flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                  <FlaskConical className="w-16 h-16 mb-4" />
                  <p className="font-bold uppercase tracking-widest text-sm">Selecione um exame ao lado para começar</p>
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
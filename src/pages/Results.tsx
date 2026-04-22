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

const Results = () => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  
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

  const getFieldLabels = (text: string) => {
    if (!text) return [];
    const parts = text.split('(?)');
    return parts.slice(0, -1).map(part => {
      const lines = part.trim().split('\n');
      const lastLine = lines[lines.length - 1].trim();
      return lastLine.replace(/[:._]/g, '').trim() || "Valor";
    });
  };

  const handleSelectExam = async (se: any) => {
    setSelectedExam(se);
    try {
      const { data: preReport } = await supabase
        .from('pre_reports')
        .select('content')
        .eq('exam_id', se.exam_id)
        .maybeSingle();

      const content = preReport?.content || "Modelo não encontrado.";
      setTemplate(content);
      const placeholderCount = (content.match(/\(\?\)/g) || []).length;
      setFieldValues(new Array(placeholderCount).fill(''));
    } catch (err: any) {
      showError('Erro ao carregar modelo.');
    }
  };

  const previewContent = useMemo(() => {
    let result = template;
    fieldValues.forEach(val => {
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
    if (!selectedExam || !selectedService) return;
    setIsSaving(true);
    try {
      // 1. Atualizar o exame individual
      const { error: examError } = await supabase
        .from('service_exams')
        .update({ 
          result_value: previewContent,
          status: 'finalizado',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedExam.id);

      if (examError) throw examError;

      // 2. Verificar se todos os exames deste atendimento foram finalizados
      const { data: allExams } = await supabase
        .from('service_exams')
        .select('status')
        .eq('service_id', selectedService.id);

      const allFinished = allExams?.every(e => e.status === 'finalizado');

      if (allFinished) {
        // 3. Atualizar o status global do atendimento para 'finalizado'
        await supabase
          .from('services')
          .update({ status: 'finalizado' })
          .eq('id', selectedService.id);
        
        showSuccess('Atendimento completo e enviado para impressão!');
      } else {
        showSuccess('Resultado do exame salvo!');
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
        <div className="flex items-center justify-between bg-blue-950/20 p-6 rounded-[2rem] border border-white/5">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
              <Edit3 className="w-6 h-6 text-blue-400" />
              Resultados
            </h1>
            <p className="text-blue-300/50 text-sm mt-1 font-medium">Lançamento e conferência de exames</p>
          </div>
          {selectedService && (
            <Button variant="outline" onClick={() => { setSelectedService(null); setSelectedExam(null); }} className="border-blue-500/20 text-blue-400 rounded-xl font-black uppercase text-[10px] px-6 h-12 gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          )}
        </div>

        {!selectedService ? (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-5 top-4 h-5 w-5 text-blue-300/20" />
              <Input placeholder="Buscar na fila..." className="bg-blue-950/40 border-white/5 h-14 pl-14 rounded-[1.5rem] text-white font-bold" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredServices.map(service => (
                <button key={service.id} onClick={() => setSelectedService(service)} className="bg-blue-950/30 border border-white/5 p-6 rounded-[2.5rem] hover:border-blue-500/30 transition-all text-left group">
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
                        <span className={cn(se.status === 'finalizado' ? "text-emerald-400" : "text-amber-400")}>{se.status}</span>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in zoom-in duration-500">
            <div className="lg:col-span-3 space-y-3">
              <div className="bg-blue-900/20 border border-blue-500/20 rounded-[2rem] p-6 mb-4">
                <h3 className="text-lg font-bold text-white uppercase leading-tight">{selectedService.patients?.full_name}</h3>
              </div>
              {selectedService.service_exams?.map((se: any) => (
                <button key={se.id} onClick={() => handleSelectExam(se)} className={cn("w-full p-5 rounded-2xl border transition-all flex items-center justify-between group", selectedExam?.id === se.id ? "bg-blue-600 border-blue-400 text-white shadow-xl" : "bg-blue-950/40 border-white/5 text-blue-300/40")}>
                  <div className="flex items-center gap-4">
                    <FlaskConical className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-tight">{se.exams?.name}</span>
                  </div>
                  {se.status === 'finalizado' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                </button>
              ))}
            </div>
            <div className="lg:col-span-9">
              {selectedExam ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="bg-blue-950/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
                    <div className="space-y-6 flex-grow overflow-y-auto pr-4 max-h-[600px]">
                      {fieldValues.map((val, idx) => (
                        <div key={idx} className="space-y-2">
                          <label className="text-[10px] font-black text-blue-300/30 uppercase tracking-widest ml-1">{labels[idx] || `Parâmetro ${idx + 1}`}</label>
                          <Input value={val} onChange={(e) => handleValueChange(idx, e.target.value)} className="bg-blue-900/20 border-blue-500/10 h-14 rounded-2xl text-white font-bold text-base" placeholder="Digite o valor..." />
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="w-full mt-10 bg-emerald-600 hover:bg-emerald-500 h-14 rounded-2xl font-black uppercase text-xs gap-3 shadow-xl">
                      {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Resultado</>}
                    </Button>
                  </div>
                  <div className="bg-blue-950/60 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
                    <div className="bg-blue-900/30 border-b border-white/5 p-8">
                      <h3 className="text-lg font-bold text-white uppercase tracking-tight">{selectedExam.exams?.name}</h3>
                    </div>
                    <div className="p-10 flex-grow bg-black/30">
                      <div className="w-full h-full text-blue-50 font-mono text-sm leading-relaxed whitespace-pre-wrap opacity-80">{previewContent}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[700px] flex flex-col items-center justify-center opacity-10 border-4 border-dashed border-white/5 rounded-[3rem]">
                  <FlaskConical className="w-24 h-24 mb-6" />
                  <p className="font-black uppercase tracking-[0.3em] text-lg">Selecione um exame</p>
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
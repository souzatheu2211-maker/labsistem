"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Search, 
  FlaskConical, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2,
  Edit3,
  FileText
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const Results = () => {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  
  const [templateFields, setTemplateFields] = useState<any[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        patients (full_name, cpf),
        service_exams (
          id, status, exam_template_id,
          exam_templates (name, code)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) console.error("Erro ao buscar serviços:", error);
    setServices(data || []);
    setLoading(false);
  };

  const handleSelectExam = async (se: any) => {
    setSelectedExam(se);
    
    // 1. Buscar campos do template
    const { data: fields } = await supabase
      .from('exam_template_fields')
      .select('*')
      .eq('template_id', se.exam_template_id)
      .order('order_index');
    
    setTemplateFields(fields || []);

    // 2. Buscar resultados já existentes se houver
    const { data: existingResult } = await supabase
      .from('exam_results')
      .select(`*, exam_result_values (*)`)
      .eq('service_exam_id', se.id)
      .maybeSingle();

    if (existingResult) {
      const values: Record<string, string> = {};
      existingResult.exam_result_values.forEach((rv: any) => {
        values[rv.field_id] = rv.value;
      });
      setFieldValues(values);
    } else {
      setFieldValues({});
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Criar ou buscar o registro principal do resultado
      let resultId;
      const { data: existingResult } = await supabase
        .from('exam_results')
        .select('id')
        .eq('service_exam_id', selectedExam.id)
        .maybeSingle();

      if (existingResult) {
        resultId = existingResult.id;
      } else {
        const { data: newResult, error: rError } = await supabase
          .from('exam_results')
          .insert([{ service_exam_id: selectedExam.id }])
          .select()
          .single();
        if (rError) throw rError;
        resultId = newResult.id;
      }

      // 2. Salvar cada valor individualmente
      const valuesToInsert = templateFields.map(field => ({
        exam_result_id: resultId,
        field_id: field.id,
        value: fieldValues[field.id] || '',
        unit: field.unit,
        reference_value: field.reference_value,
        status: 'finalizado'
      }));

      // Upsert dos valores (deletar antigos e inserir novos para simplificar)
      await supabase.from('exam_result_values').delete().eq('exam_result_id', resultId);
      const { error: vError } = await supabase.from('exam_result_values').insert(valuesToInsert);
      if (vError) throw vError;

      // 3. Atualizar status do service_exam
      await supabase.from('service_exams').update({ status: 'finalizado' }).eq('id', selectedExam.id);

      showSuccess('Resultados salvos com sucesso!');
      fetchServices();
      setSelectedExam(null);
    } catch (err: any) {
      showError(err.message || 'Erro ao salvar resultados.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-8">
        <div className="flex items-center justify-between bg-blue-950/20 p-6 rounded-[2rem] border border-white/5">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <Edit3 className="w-6 h-6 text-blue-400" />
              Lançamento de Resultados
            </h1>
          </div>
          {selectedService && (
            <Button variant="outline" onClick={() => { setSelectedService(null); setSelectedExam(null); }} className="border-blue-500/20 text-blue-400 rounded-xl font-black uppercase text-[10px] px-6 h-12 gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          )}
        </div>

        {!selectedService ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map(service => (
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
                      <span className="text-blue-300/30">{se.exam_templates?.name}</span>
                      <span className={cn(se.status === 'finalizado' ? "text-emerald-400" : "text-amber-400")}>{se.status}</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-3 space-y-3">
              {selectedService.service_exams?.map((se: any) => (
                <button key={se.id} onClick={() => handleSelectExam(se)} className={cn("w-full p-5 rounded-2xl border transition-all flex items-center justify-between group", selectedExam?.id === se.id ? "bg-blue-600 border-blue-400 text-white shadow-xl" : "bg-blue-950/40 border-white/5 text-blue-300/40")}>
                  <div className="flex items-center gap-4">
                    <FlaskConical className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-tight">{se.exam_templates?.name}</span>
                  </div>
                  {se.status === 'finalizado' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                </button>
              ))}
            </div>
            <div className="lg:col-span-9">
              {selectedExam ? (
                <div className="bg-blue-950/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {templateFields.map((field) => (
                      <div key={field.id} className={cn("space-y-2", field.field_type === 'title' && "col-span-2 mt-6 first:mt-0")}>
                        {field.field_type === 'title' ? (
                          <h4 className="text-blue-400 font-black uppercase text-xs border-b border-blue-500/20 pb-2">{field.label}</h4>
                        ) : (
                          <>
                            <div className="flex justify-between items-center px-1">
                              <label className="text-[10px] font-black text-blue-300/50 uppercase tracking-widest">{field.label}</label>
                              {field.unit && <span className="text-[8px] text-blue-500 font-bold">{field.unit}</span>}
                            </div>
                            <Input 
                              value={fieldValues[field.id] || ''} 
                              onChange={e => setFieldValues({...fieldValues, [field.id]: e.target.value})}
                              className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white font-bold"
                              placeholder={field.reference_value ? `Ref: ${field.reference_value}` : ''}
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleSave} disabled={isSaving} className="w-full mt-10 bg-emerald-600 hover:bg-emerald-500 h-14 rounded-2xl font-black uppercase text-xs gap-3 shadow-xl">
                    {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> Finalizar Laudo</>}
                  </Button>
                </div>
              ) : (
                <div className="h-[600px] flex flex-col items-center justify-center opacity-10 border-4 border-dashed border-white/5 rounded-[3rem]">
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
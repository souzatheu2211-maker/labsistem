"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Settings, Plus, Trash2, Loader2, Search, Save, ChevronRight, ListTree } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const SettingsPage = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) fetchFields(selectedTemplate.id);
  }, [selectedTemplate]);

  const fetchTemplates = async () => {
    const { data } = await supabase.from('exam_templates').select('*').order('name');
    setTemplates(data || []);
    setLoading(false);
  };

  const fetchFields = async (tid: string) => {
    const { data } = await supabase
      .from('exam_template_fields')
      .select('*')
      .eq('template_id', tid)
      .order('order_index');
    setFields(data || []);
  };

  const addField = () => {
    const newField = {
      template_id: selectedTemplate.id,
      label: '',
      internal_name: '',
      unit: '',
      reference_value: '',
      field_type: 'number',
      order_index: fields.length,
      is_new: true
    };
    setFields([...fields, newField]);
  };

  const handleSaveFields = async () => {
    setSubmitting(true);
    try {
      for (const field of fields) {
        const { is_new, ...fieldData } = field;
        if (is_new) {
          await supabase.from('exam_template_fields').insert([fieldData]);
        } else {
          await supabase.from('exam_template_fields').update(fieldData).eq('id', field.id);
        }
      }
      showSuccess('Template atualizado!');
      fetchFields(selectedTemplate.id);
    } catch (err) {
      showError('Erro ao salvar campos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-400" />
              Configuração de Templates
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 bg-blue-950/30 border border-white/5 rounded-[2rem] p-6">
            <Input 
              placeholder="Buscar template..." 
              className="bg-blue-900/20 border-blue-500/10 h-10 mb-6 rounded-xl text-white text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between group",
                    selectedTemplate?.id === t.id ? "bg-blue-600 border-blue-400 text-white" : "bg-blue-900/10 border-white/5 text-blue-300/60"
                  )}
                >
                  <span className="text-[10px] font-black uppercase">{t.name}</span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8">
            {selectedTemplate ? (
              <div className="bg-blue-950/40 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <h3 className="text-lg font-bold text-white uppercase">{selectedTemplate.name}</h3>
                  <div className="flex gap-3">
                    <Button onClick={addField} variant="outline" className="border-blue-500/20 text-blue-400 rounded-xl text-[10px] font-black uppercase">
                      <Plus className="w-4 h-4 mr-2" /> Add Campo
                    </Button>
                    <Button onClick={handleSaveFields} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-500 rounded-xl text-[10px] font-black uppercase px-6">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 bg-blue-900/10 p-4 rounded-2xl border border-white/5 items-end">
                      <div className="col-span-4 space-y-1">
                        <label className="text-[8px] font-black text-blue-400 uppercase">Label</label>
                        <Input 
                          value={field.label} 
                          onChange={e => {
                            const newFields = [...fields];
                            newFields[index].label = e.target.value;
                            newFields[index].internal_name = e.target.value.toLowerCase().replace(/\s+/g, '_');
                            setFields(newFields);
                          }}
                          className="bg-blue-950 border-white/10 h-9 text-[10px] text-white"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[8px] font-black text-blue-400 uppercase">Tipo</label>
                        <Select value={field.field_type} onValueChange={val => {
                          const newFields = [...fields];
                          newFields[index].field_type = val;
                          setFields(newFields);
                        }}>
                          <SelectTrigger className="bg-blue-950 border-white/10 h-9 text-[10px] text-white"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-blue-950 border-white/10 text-white">
                            <SelectItem value="number">Numérico</SelectItem>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="title">Título</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[8px] font-black text-blue-400 uppercase">Unidade</label>
                        <Input value={field.unit} onChange={e => {
                          const newFields = [...fields];
                          newFields[index].unit = e.target.value;
                          setFields(newFields);
                        }} className="bg-blue-950 border-white/10 h-9 text-[10px] text-white" />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <label className="text-[8px] font-black text-blue-400 uppercase">Referência</label>
                        <Input value={field.reference_value} onChange={e => {
                          const newFields = [...fields];
                          newFields[index].reference_value = e.target.value;
                          setFields(newFields);
                        }} className="bg-blue-950 border-white/10 h-9 text-[10px] text-white" />
                      </div>
                      <div className="col-span-1">
                        <Button variant="ghost" size="icon" onClick={async () => {
                          if (field.id) await supabase.from('exam_template_fields').delete().eq('id', field.id);
                          setFields(fields.filter((_, i) => i !== index));
                        }} className="text-red-400 hover:bg-red-500/10 h-9 w-9"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center opacity-10 border-4 border-dashed border-white/5 rounded-[3rem]">
                <ListTree className="w-24 h-24 mb-6" />
                <p className="font-black uppercase tracking-widest">Selecione um template</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
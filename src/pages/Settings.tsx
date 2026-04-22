"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Settings, 
  Users, 
  FileText, 
  Plus, 
  Trash2,
  Loader2,
  Search,
  GripVertical,
  ChevronRight,
  Edit3,
  FlaskConical,
  Save,
  UserPlus
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Dados Gerais
  const [exams, setExams] = useState<any[]>([]);
  const [preReports, setPreReports] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  // Estados de Edição/Criação
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportItems, setReportItems] = useState<any[]>([]);
  const [newExam, setNewExam] = useState({ name: '', code: '' });
  const [newReport, setNewReport] = useState({ name: '', exam_id: '' });
  const [newItem, setNewItem] = useState({ parameter: '', unit: '', ref_male: '', ref_female: '', ref_general: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [exRes, preRes, profRes] = await Promise.all([
      supabase.from('exams').select('*').order('name'),
      supabase.from('pre_reports').select('*, exams(name)').order('name'),
      supabase.from('profiles').select('*').order('first_name')
    ]);
    setExams(exRes.data || []);
    setPreReports(preRes.data || []);
    setProfiles(profRes.data || []);
    setLoading(false);
  };

  // --- GESTÃO DE EXAMES ---
  const handleAddExam = async () => {
    if (!newExam.name) return showError('Nome do exame é obrigatório.');
    setSubmitting(true);
    const { error } = await supabase.from('exams').insert([newExam]);
    if (error) showError(error.message);
    else {
      showSuccess('Exame cadastrado!');
      setNewExam({ name: '', code: '' });
      fetchData();
    }
    setSubmitting(false);
  };

  // --- GESTÃO DE PRÉ-LAUDOS ---
  const handleAddReport = async () => {
    if (!newReport.name || !newReport.exam_id) return showError('Preencha todos os campos.');
    setSubmitting(true);
    const { error } = await supabase.from('pre_reports').insert([newReport]);
    if (error) showError(error.message);
    else {
      showSuccess('Modelo criado!');
      setNewReport({ name: '', exam_id: '' });
      fetchData();
    }
    setSubmitting(false);
  };

  const loadReportItems = async (report: any) => {
    setSelectedReport(report);
    const { data } = await supabase
      .from('pre_report_items')
      .select('*')
      .eq('pre_report_id', report.id)
      .order('line_order');
    setReportItems(data || []);
  };

  const handleAddItem = async () => {
    if (!newItem.parameter) return showError('Parâmetro é obrigatório.');
    setSubmitting(true);
    const { error } = await supabase.from('pre_report_items').insert([{
      ...newItem,
      pre_report_id: selectedReport.id,
      line_order: reportItems.length
    }]);
    if (error) showError(error.message);
    else {
      showSuccess('Item adicionado!');
      setNewItem({ parameter: '', unit: '', ref_male: '', ref_female: '', ref_general: '' });
      loadReportItems(selectedReport);
    }
    setSubmitting(false);
  };

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabase.from('pre_report_items').delete().eq('id', id);
    if (!error) loadReportItems(selectedReport);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
            <Settings className="w-6 h-6 text-blue-400" />
            Configurações Avançadas
          </h1>
          <p className="text-blue-300/50 text-sm mt-1 font-medium">Gerencie a base de dados e modelos do laboratório</p>
        </div>

        <Tabs defaultValue="exams" className="w-full">
          <TabsList className="bg-blue-950/40 border border-white/5 p-1 rounded-2xl h-14 mb-8">
            <TabsTrigger value="exams" className="rounded-xl px-6 data-[state=active]:bg-blue-600 font-bold uppercase text-[10px] gap-2">
              <FlaskConical className="w-4 h-4" /> Exames
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-xl px-6 data-[state=active]:bg-blue-600 font-bold uppercase text-[10px] gap-2">
              <FileText className="w-4 h-4" /> Pré-Laudos
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl px-6 data-[state=active]:bg-blue-600 font-bold uppercase text-[10px] gap-2">
              <Users className="w-4 h-4" /> Usuários
            </TabsTrigger>
          </TabsList>

          {/* ABA: EXAMES */}
          <TabsContent value="exams" className="space-y-6">
            <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8">
              <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">Cadastrar Novo Exame</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  placeholder="Nome do Exame (Ex: Hemograma)" 
                  value={newExam.name}
                  onChange={e => setNewExam({...newExam, name: e.target.value})}
                  className="bg-blue-900/20 border-white/10 text-white"
                />
                <Input 
                  placeholder="Código (Opcional)" 
                  value={newExam.code}
                  onChange={e => setNewExam({...newExam, code: e.target.value})}
                  className="bg-blue-900/20 border-white/10 text-white"
                />
                <Button onClick={handleAddExam} disabled={submitting} className="bg-blue-600 hover:bg-blue-500 font-bold uppercase text-xs">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Exame'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map(ex => (
                <div key={ex.id} className="bg-blue-900/10 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white uppercase">{ex.name}</p>
                    <p className="text-[9px] text-blue-400 font-bold uppercase">{ex.code || 'Sem código'}</p>
                  </div>
                  <FlaskConical className="w-4 h-4 text-blue-500/30" />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ABA: PRÉ-LAUDOS */}
          <TabsContent value="reports" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-6">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Novo Modelo</h3>
                <div className="space-y-3">
                  <Input 
                    placeholder="Nome do Modelo" 
                    value={newReport.name}
                    onChange={e => setNewReport({...newReport, name: e.target.value})}
                    className="bg-blue-900/20 border-white/10 text-white text-xs"
                  />
                  <select 
                    className="w-full bg-blue-900/20 border border-white/10 rounded-xl h-10 px-3 text-xs text-white outline-none"
                    value={newReport.exam_id}
                    onChange={e => setNewReport({...newReport, exam_id: e.target.value})}
                  >
                    <option value="">Vincular ao Exame...</option>
                    {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                  </select>
                  <Button onClick={handleAddReport} className="w-full bg-blue-600 text-[10px] font-black uppercase">Criar Modelo</Button>
                </div>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {preReports.map(report => (
                  <button
                    key={report.id}
                    onClick={() => loadReportItems(report)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group",
                      selectedReport?.id === report.id ? "bg-blue-600 border-blue-400 text-white" : "bg-blue-900/10 border-white/5 text-blue-300/60"
                    )}
                  >
                    <div>
                      <p className="text-[10px] font-black uppercase">{report.name}</p>
                      <p className="text-[8px] opacity-50 uppercase">{report.exams?.name}</p>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8">
              {selectedReport ? (
                <div className="bg-blue-950/40 border border-white/10 rounded-[2.5rem] p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-white uppercase">{selectedReport.name}</h3>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-500 text-[10px] font-black uppercase gap-2">
                          <Plus className="w-4 h-4" /> Add Parâmetro
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-blue-950 border-white/10 text-white">
                        <DialogHeader><DialogTitle className="text-blue-400 uppercase font-black">Novo Parâmetro</DialogTitle></DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                          <div className="col-span-2"><Input placeholder="Nome do Parâmetro" value={newItem.parameter} onChange={e => setNewItem({...newItem, parameter: e.target.value})} className="bg-blue-900/20 border-white/10" /></div>
                          <Input placeholder="Unidade" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="bg-blue-900/20 border-white/10" />
                          <Input placeholder="Ref. Geral" value={newItem.ref_general} onChange={e => setNewItem({...newItem, ref_general: e.target.value})} className="bg-blue-900/20 border-white/10" />
                          <Input placeholder="Ref. Masc" value={newItem.ref_male} onChange={e => setNewItem({...newItem, ref_male: e.target.value})} className="bg-blue-900/20 border-white/10" />
                          <Input placeholder="Ref. Fem" value={newItem.ref_female} onChange={e => setNewItem({...newItem, ref_female: e.target.value})} className="bg-blue-900/20 border-white/10" />
                        </div>
                        <Button onClick={handleAddItem} className="bg-blue-600 w-full font-black uppercase">Salvar Item</Button>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-2">
                    {reportItems.map(item => (
                      <div key={item.id} className="bg-blue-900/20 border border-white/5 p-4 rounded-xl flex items-center justify-between group">
                        <div className="grid grid-cols-3 gap-4 flex-grow">
                          <div><p className="text-[8px] text-blue-400 uppercase">Parâmetro</p><p className="text-xs font-bold text-white uppercase">{item.parameter}</p></div>
                          <div><p className="text-[8px] text-blue-400 uppercase">Referência</p><p className="text-[10px] text-blue-100">{item.ref_general || `${item.ref_male}/${item.ref_female}`}</p></div>
                          <div><p className="text-[8px] text-blue-400 uppercase">Unidade</p><p className="text-[10px] text-blue-100">{item.unit || '-'}</p></div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="text-red-400/20 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/5 rounded-[2.5rem] py-20">
                  <FileText className="w-16 h-16 mb-4" />
                  <p className="font-bold uppercase tracking-widest text-sm">Selecione um modelo para editar</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ABA: USUÁRIOS */}
          <TabsContent value="users">
            <div className="bg-blue-950/30 border border-white/5 rounded-[2.5rem] p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Equipe do Laboratório</h3>
                <Button variant="outline" className="border-blue-500/30 text-blue-400 text-[10px] font-black uppercase gap-2">
                  <UserPlus className="w-4 h-4" /> Convidar Usuário
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map(p => (
                  <div key={p.id} className="bg-blue-900/10 border border-white/5 p-6 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      {p.first_name?.[0]}{p.last_name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white uppercase">{p.first_name} {p.last_name}</p>
                      <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest">{p.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
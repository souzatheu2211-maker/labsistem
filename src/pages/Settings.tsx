"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Settings, 
  Users, 
  FileText, 
  Plus, 
  UserCircle, 
  Shield, 
  Trash2,
  Loader2,
  Save,
  GripVertical,
  ChevronRight
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
  const [employees, setEmployees] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estados para Pré-Modelos
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [preReports, setPreReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportItems, setReportItems] = useState<any[]>([]);

  const [newReportName, setNewReportName] = useState('');
  const [newItem, setNewItem] = useState({ parameter: '', ref_male: '', ref_female: '', ref_general: '', unit: '', line_order: 0 });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [empRes, examRes] = await Promise.all([
        supabase.from('profiles').select('*').order('first_name'),
        supabase.from('exams').select('*').order('name')
      ]);
      setEmployees(empRes.data || []);
      setExams(examRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreReports = async (examId: string) => {
    const { data } = await supabase
      .from('pre_reports')
      .select('*')
      .eq('exam_id', examId)
      .order('order_index');
    setPreReports(data || []);
    setSelectedReport(null);
    setReportItems([]);
  };

  const fetchReportItems = async (reportId: string) => {
    const { data } = await supabase
      .from('pre_report_items')
      .select('*')
      .eq('pre_report_id', reportId)
      .order('line_order');
    setReportItems(data || []);
  };

  const handleAddReport = async () => {
    if (!newReportName) return showError('Nome do modelo é obrigatório.');
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('pre_reports')
        .insert([{ name: newReportName, exam_id: selectedExam.id }])
        .select()
        .single();

      if (error) throw error;
      showSuccess('Modelo criado!');
      setNewReportName('');
      fetchPreReports(selectedExam.id);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.parameter) return showError('Parâmetro é obrigatório.');
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('pre_report_items')
        .insert([{ ...newItem, pre_report_id: selectedReport.id, line_order: reportItems.length }]);

      if (error) throw error;
      showSuccess('Linha adicionada ao modelo!');
      setNewItem({ parameter: '', ref_male: '', ref_female: '', ref_general: '', unit: '', line_order: 0 });
      fetchReportItems(selectedReport.id);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await supabase.from('pre_report_items').delete().eq('id', id);
      fetchReportItems(selectedReport.id);
      showSuccess('Linha removida.');
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
            <Settings className="w-6 h-6 text-blue-400" />
            Configurações do Sistema
          </h1>
          <p className="text-blue-300/50 text-sm mt-1 font-medium">Gerencie modelos de laudos e equipe técnica</p>
        </div>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="bg-blue-950/40 border border-white/5 p-1 rounded-2xl h-14 mb-8">
            <TabsTrigger value="templates" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase text-[10px] tracking-widest gap-2">
              <FileText className="w-4 h-4" /> Modelos de Laudos (Pré-Laudos)
            </TabsTrigger>
            <TabsTrigger value="employees" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase text-[10px] tracking-widest gap-2">
              <Users className="w-4 h-4" /> Equipe Técnica
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="animate-in fade-in slide-in-from-top duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Coluna 1: Exames */}
              <div className="lg:col-span-3 bg-blue-950/30 border border-white/5 rounded-[2rem] p-6 backdrop-blur-sm">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">1. Selecione o Exame</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {exams.map(exam => (
                    <button
                      key={exam.id}
                      onClick={() => { setSelectedExam(exam); fetchPreReports(exam.id); }}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border transition-all text-[10px] font-bold uppercase",
                        selectedExam?.id === exam.id ? "bg-blue-600 border-blue-400 text-white" : "bg-blue-900/10 border-white/5 text-blue-300/60 hover:border-blue-500/30"
                      )}
                    >
                      {exam.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coluna 2: Modelos do Exame */}
              <div className="lg:col-span-3 bg-blue-950/30 border border-white/5 rounded-[2rem] p-6 backdrop-blur-sm">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">2. Modelos (Templates)</h3>
                {selectedExam ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Nome do Modelo..." 
                        value={newReportName} 
                        onChange={e => setNewReportName(e.target.value)}
                        className="bg-blue-900/20 border-white/10 h-9 text-[10px] rounded-lg"
                      />
                      <Button onClick={handleAddReport} size="sm" className="bg-blue-600 h-9 px-3 rounded-lg"><Plus className="w-4 h-4" /></Button>
                    </div>
                    <div className="space-y-2">
                      {preReports.map(report => (
                        <button
                          key={report.id}
                          onClick={() => { setSelectedReport(report); fetchReportItems(report.id); }}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between group",
                            selectedReport?.id === report.id ? "bg-blue-500/20 border-blue-500 text-blue-100" : "bg-blue-900/5 border-white/5 text-blue-300/40 hover:border-blue-500/20"
                          )}
                        >
                          <span className="text-[10px] font-black uppercase">{report.name}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[9px] text-blue-300/20 uppercase font-bold text-center py-10">Selecione um exame primeiro</p>
                )}
              </div>

              {/* Coluna 3: Itens do Modelo */}
              <div className="lg:col-span-6 bg-blue-950/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">3. Estrutura do Laudo: {selectedReport?.name}</h3>
                  {selectedReport && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-500 rounded-xl gap-2 font-bold uppercase text-[10px] h-9">
                          <Plus className="w-4 h-4" /> Adicionar Linha
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-blue-950 border-white/10 text-white max-w-md">
                        <DialogHeader><DialogTitle className="uppercase tracking-widest font-black text-blue-400">Nova Linha no Modelo</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-blue-300/50">Parâmetro / Descrição</label>
                            <Input value={newItem.parameter} onChange={e => setNewItem({...newItem, parameter: e.target.value})} className="bg-blue-900/20 border-white/10 rounded-xl" placeholder="Ex: Hemoglobina" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-blue-300/50">Ref. Masculino</label>
                              <Input value={newItem.ref_male} onChange={e => setNewItem({...newItem, ref_male: e.target.value})} className="bg-blue-900/20 border-white/10 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-blue-300/50">Ref. Feminino</label>
                              <Input value={newItem.ref_female} onChange={e => setNewItem({...newItem, ref_female: e.target.value})} className="bg-blue-900/20 border-white/10 rounded-xl" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-blue-300/50">Unidade</label>
                              <Input value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="bg-blue-900/20 border-white/10 rounded-xl" placeholder="g/dL" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-blue-300/50">Ref. Geral</label>
                              <Input value={newItem.ref_general} onChange={e => setNewItem({...newItem, ref_general: e.target.value})} className="bg-blue-900/20 border-white/10 rounded-xl" />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddItem} disabled={submitting} className="bg-blue-600 hover:bg-blue-500 w-full rounded-xl font-bold uppercase text-xs">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Linha'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                <div className="space-y-2">
                  {reportItems.map((item) => (
                    <div key={item.id} className="bg-blue-900/20 border border-white/5 p-3 rounded-xl flex items-center gap-4 group hover:border-blue-500/30 transition-all">
                      <GripVertical className="w-4 h-4 text-blue-300/10" />
                      <div className="grid grid-cols-4 gap-4 flex-grow">
                        <div className="col-span-1"><p className="text-[8px] font-black text-blue-400 uppercase mb-0.5">Parâmetro</p><p className="text-[10px] font-bold text-white uppercase truncate">{item.parameter}</p></div>
                        <div className="col-span-1"><p className="text-[8px] font-black text-blue-400 uppercase mb-0.5">Masc/Fem</p><p className="text-[9px] text-blue-100 truncate">{item.ref_male || '-'} / {item.ref_female || '-'}</p></div>
                        <div className="col-span-1"><p className="text-[8px] font-black text-blue-400 uppercase mb-0.5">Geral</p><p className="text-[9px] text-blue-100 truncate">{item.ref_general || '-'}</p></div>
                        <div className="col-span-1"><p className="text-[8px] font-black text-blue-400 uppercase mb-0.5">Unid.</p><p className="text-[9px] text-blue-100">{item.unit || '-'}</p></div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="text-red-400/20 hover:text-red-400 h-8 w-8"><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  ))}
                  {!selectedReport && <p className="text-center py-20 text-blue-300/10 font-black uppercase text-xs tracking-widest">Selecione um modelo para editar a estrutura</p>}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="employees" className="animate-in fade-in slide-in-from-top duration-500">
            <div className="bg-blue-950/30 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((emp) => (
                  <div key={emp.id} className="bg-blue-900/20 border border-white/5 p-5 rounded-2xl flex items-center gap-4 group hover:border-blue-500/30 transition-all">
                    <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400"><UserCircle className="w-8 h-8" /></div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-white uppercase">{emp.first_name} {emp.last_name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Shield className={cn("w-3 h-3", emp.role === 'admin' ? "text-amber-400" : "text-blue-400")} />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{emp.role}</span>
                      </div>
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
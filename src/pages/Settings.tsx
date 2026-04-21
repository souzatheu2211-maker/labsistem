"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Settings, 
  Users, 
  FlaskConical, 
  FileText, 
  Plus, 
  UserCircle, 
  Shield, 
  Trash2,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const SettingsPage = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [preReports, setPreReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estados dos formulários
  const [newExam, setNewExam] = useState({ name: '', code: '', description: '' });
  const [newPreReport, setNewPreReport] = useState({ name: '', content: '', exam_id: '' });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [empRes, examRes, preRes] = await Promise.all([
        supabase.from('profiles').select('*').order('first_name'),
        supabase.from('exams').select('*').order('name'),
        supabase.from('pre_reports').select('*, exams(name)').order('name')
      ]);
      
      setEmployees(empRes.data || []);
      setExams(examRes.data || []);
      setPreReports(preRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async () => {
    if (!newExam.name) return showError('O nome do exame é obrigatório.');
    setSubmitting(true);
    try {
      const { error } = await supabase.from('exams').insert([newExam]);
      if (error) throw error;
      showSuccess('Exame cadastrado com sucesso!');
      setNewExam({ name: '', code: '', description: '' });
      fetchAllData();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePreReport = async () => {
    if (!newPreReport.name || !newPreReport.exam_id) return showError('Nome e Exame são obrigatórios.');
    setSubmitting(true);
    try {
      const { error } = await supabase.from('pre_reports').insert([newPreReport]);
      if (error) throw error;
      showSuccess('Modelo de pré-laudo cadastrado!');
      setNewPreReport({ name: '', content: '', exam_id: '' });
      fetchAllData();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (table: string, id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      showSuccess('Item removido com sucesso.');
      fetchAllData();
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
            <Settings className="w-6 h-6 text-blue-400" />
            Configurações do Sistema
          </h1>
          <p className="text-blue-300/50 text-sm mt-1 font-medium">Gerencie funcionários, exames e modelos de laudos</p>
        </div>

        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="bg-blue-950/40 border border-white/5 p-1 rounded-2xl h-14 mb-8">
            <TabsTrigger value="employees" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase text-[10px] tracking-widest gap-2">
              <Users className="w-4 h-4" /> Funcionários
            </TabsTrigger>
            <TabsTrigger value="exams" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase text-[10px] tracking-widest gap-2">
              <FlaskConical className="w-4 h-4" /> Cadastro de Exames
            </TabsTrigger>
            <TabsTrigger value="pre-reports" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase text-[10px] tracking-widest gap-2">
              <FileText className="w-4 h-4" /> Pré-Laudos
            </TabsTrigger>
          </TabsList>

          {/* ABA FUNCIONÁRIOS */}
          <TabsContent value="employees" className="animate-in fade-in slide-in-from-top duration-500">
            <div className="bg-blue-950/30 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Gestão de Equipe</h3>
              </div>

              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.map((emp) => (
                    <div key={emp.id} className="bg-blue-900/20 border border-white/5 p-5 rounded-2xl flex items-center gap-4 group hover:border-blue-500/30 transition-all">
                      <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
                        <UserCircle className="w-8 h-8" />
                      </div>
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
              )}
            </div>
          </TabsContent>

          {/* ABA EXAMES */}
          <TabsContent value="exams" className="animate-in fade-in slide-in-from-top duration-500">
            <div className="bg-blue-950/30 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Catálogo de Exames</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-bold uppercase text-xs">
                      <Plus className="w-4 h-4" /> Novo Exame
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-blue-950 border-white/10 text-white">
                    <DialogHeader>
                      <DialogTitle className="uppercase tracking-widest font-black text-blue-400">Cadastrar Novo Exame</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-blue-300/50">Nome do Exame</label>
                        <Input 
                          value={newExam.name} 
                          onChange={e => setNewExam({...newExam, name: e.target.value})}
                          className="bg-blue-900/20 border-white/10 rounded-xl" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-blue-300/50">Código (Opcional)</label>
                        <Input 
                          value={newExam.code} 
                          onChange={e => setNewExam({...newExam, code: e.target.value})}
                          className="bg-blue-900/20 border-white/10 rounded-xl" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-blue-300/50">Descrição</label>
                        <Textarea 
                          value={newExam.description} 
                          onChange={e => setNewExam({...newExam, description: e.target.value})}
                          className="bg-blue-900/20 border-white/10 rounded-xl resize-none" 
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateExam} disabled={submitting} className="bg-blue-600 hover:bg-blue-500 w-full rounded-xl font-bold uppercase text-xs">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Exame'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exams.map((exam) => (
                    <div key={exam.id} className="bg-blue-900/20 border border-white/5 p-5 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
                      <div>
                        <p className="text-sm font-bold text-white uppercase">{exam.name}</p>
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{exam.code || 'SEM CÓDIGO'}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete('exams', exam.id)}
                        className="text-red-400/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ABA PRÉ-LAUDOS */}
          <TabsContent value="pre-reports" className="animate-in fade-in slide-in-from-top duration-500">
            <div className="bg-blue-950/30 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Modelos de Pré-Laudos</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-bold uppercase text-xs">
                      <Plus className="w-4 h-4" /> Novo Modelo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-blue-950 border-white/10 text-white max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="uppercase tracking-widest font-black text-blue-400">Criar Modelo de Laudo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-blue-300/50">Vincular ao Exame</label>
                        <Select onValueChange={val => setNewPreReport({...newPreReport, exam_id: val})}>
                          <SelectTrigger className="bg-blue-900/20 border-white/10 rounded-xl">
                            <SelectValue placeholder="Selecione o exame..." />
                          </SelectTrigger>
                          <SelectContent className="bg-blue-950 border-white/10 text-white">
                            {exams.map(e => (
                              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-blue-300/50">Nome do Modelo</label>
                        <Input 
                          value={newPreReport.name} 
                          onChange={e => setNewPreReport({...newPreReport, name: e.target.value})}
                          placeholder="Ex: Hemograma Padrão"
                          className="bg-blue-900/20 border-white/10 rounded-xl" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-blue-300/50">Conteúdo do Laudo (Template)</label>
                        <Textarea 
                          value={newPreReport.content} 
                          onChange={e => setNewPreReport({...newPreReport, content: e.target.value})}
                          placeholder="Digite o texto base do laudo aqui..."
                          className="bg-blue-900/20 border-white/10 rounded-xl min-h-[200px] resize-none" 
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreatePreReport} disabled={submitting} className="bg-blue-600 hover:bg-blue-500 w-full rounded-xl font-bold uppercase text-xs">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Modelo'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {preReports.map((report) => (
                    <div key={report.id} className="bg-blue-900/20 border border-white/5 p-6 rounded-2xl group hover:border-blue-500/30 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm font-bold text-white uppercase">{report.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <FlaskConical className="w-3 h-3 text-blue-400" />
                            <span className="text-[10px] text-blue-300/50 font-bold uppercase tracking-widest">Exame: {report.exams?.name}</span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete('pre_reports', report.id)}
                          className="text-red-400/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] text-blue-100/40 line-clamp-3 italic">"{report.content}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
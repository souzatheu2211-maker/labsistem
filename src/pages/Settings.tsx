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
  Search,
  Save,
  X
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

  // Estados para Pré-Laudos
  const [searchPreReport, setSearchPreReport] = useState('');
  const [selectedPreReport, setSelectedPreReport] = useState<any>(null);
  const [editContent, setEditContent] = useState('');

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

  const handleSelectPreReport = (report: any) => {
    setSelectedPreReport(report);
    setEditContent(report.content);
    setSearchPreReport('');
  };

  const handleUpdatePreReport = async () => {
    if (!selectedPreReport) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('pre_reports')
        .update({ content: editContent })
        .eq('id', selectedPreReport.id);

      if (error) throw error;
      showSuccess('Modelo de laudo atualizado com sucesso!');
      fetchAllData();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setSubmitting(false);
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
      if (selectedPreReport?.id === id) setSelectedPreReport(null);
      fetchAllData();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const filteredPreReports = preReports.filter(r => 
    r.name.toLowerCase().includes(searchPreReport.toLowerCase()) ||
    r.exams?.name.toLowerCase().includes(searchPreReport.toLowerCase())
  );

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

        <Tabs defaultValue="pre-reports" className="w-full">
          <TabsList className="bg-blue-950/40 border border-white/5 p-1 rounded-2xl h-14 mb-8">
            <TabsTrigger value="pre-reports" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase text-[10px] tracking-widest gap-2">
              <FileText className="w-4 h-4" /> Pré-Laudos
            </TabsTrigger>
            <TabsTrigger value="exams" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase text-[10px] tracking-widest gap-2">
              <FlaskConical className="w-4 h-4" /> Cadastro de Exames
            </TabsTrigger>
            <TabsTrigger value="employees" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase text-[10px] tracking-widest gap-2">
              <Users className="w-4 h-4" /> Funcionários
            </TabsTrigger>
          </TabsList>

          {/* ABA PRÉ-LAUDOS (REFORMULADA) */}
          <TabsContent value="pre-reports" className="animate-in fade-in slide-in-from-top duration-500">
            <div className="space-y-6">
              {/* Barra de Pesquisa */}
              <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-6 backdrop-blur-sm relative z-30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest">Buscar Modelo de Laudo</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="text-blue-400 hover:text-blue-300 text-[10px] font-black uppercase gap-2">
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
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 h-5 w-5 text-blue-300/30" />
                  <Input 
                    placeholder="Digite o nome do exame ou modelo..." 
                    className="bg-blue-900/20 border-blue-500/10 h-12 pl-12 rounded-2xl text-white font-bold"
                    value={searchPreReport}
                    onChange={(e) => setSearchPreReport(e.target.value)}
                    autoFocus
                  />
                  
                  {searchPreReport && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-blue-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto z-50">
                      {filteredPreReports.length > 0 ? (
                        filteredPreReports.map(report => (
                          <button
                            key={report.id}
                            onClick={() => handleSelectPreReport(report)}
                            className="w-full text-left px-6 py-4 hover:bg-blue-900/40 border-b border-white/5 last:border-none transition-colors group"
                          >
                            <p className="text-sm font-bold text-white uppercase">{report.name}</p>
                            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{report.exams?.name}</p>
                          </button>
                        ))
                      ) : (
                        <div className="px-6 py-4 text-blue-300/30 text-xs font-bold uppercase">Nenhum modelo encontrado</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Editor de Visualização */}
              {selectedPreReport ? (
                <div className="bg-blue-950/40 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in fade-in duration-500">
                  <div className="bg-blue-900/20 border-b border-white/5 p-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white uppercase tracking-tight">{selectedPreReport.name}</h3>
                      <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Editando Modelo Base</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="ghost" 
                        onClick={() => setSelectedPreReport(null)}
                        className="text-blue-300/40 hover:text-white gap-2 font-bold uppercase text-[10px]"
                      >
                        <X className="w-4 h-4" /> Fechar
                      </Button>
                      <Button 
                        onClick={handleUpdatePreReport}
                        disabled={submitting}
                        className="bg-emerald-600 hover:bg-emerald-500 rounded-xl gap-2 font-bold uppercase text-[10px] px-6"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Salvar Alterações</>}
                      </Button>
                    </div>
                  </div>
                  <div className="p-8">
                    <Textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="bg-black/20 border-white/5 min-h-[500px] rounded-2xl text-blue-50 font-mono text-sm p-6 resize-none focus:ring-blue-500/30 leading-relaxed"
                      placeholder="Conteúdo do laudo..."
                    />
                    <div className="mt-4 flex justify-end">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleDelete('pre_reports', selectedPreReport.id)}
                        className="text-red-400/40 hover:text-red-400 hover:bg-red-500/10 gap-2 font-bold uppercase text-[10px]"
                      >
                        <Trash2 className="w-4 h-4" /> Excluir este Modelo
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 opacity-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                  <FileText className="w-16 h-16 mb-4" />
                  <p className="font-bold uppercase tracking-widest text-sm">Selecione um modelo acima para visualizar ou editar</p>
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
"use client";

import React, { useEffect, useState, useRef } from 'react';
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
  X,
  Maximize2,
  Minimize2
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
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const SettingsPage = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [preReports, setPreReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [searchExam, setSearchExam] = useState('');
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [editContent, setEditContent] = useState('');

  const [newExam, setNewExam] = useState({ name: '', code: '', description: '' });
  
  const quillRef = useRef<any>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (selectedExam && editorContainerRef.current && !quillRef.current) {
      // Configuração para preservar formatação ao colar
      const quill = new Quill(editorContainerRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
          ],
          clipboard: {
            matchVisual: false // Evita que o Quill tente "adivinhar" a formatação visual e mude o HTML
          }
        },
        placeholder: 'Cole seu laudo aqui ou digite o modelo... Use (?) para campos variáveis.'
      });

      quill.on('text-change', () => {
        setEditContent(quill.root.innerHTML);
      });

      quillRef.current = quill;

      const existingReport = preReports.find(r => r.exam_id === selectedExam.id);
      if (existingReport) {
        quill.root.innerHTML = existingReport.content;
        setEditContent(existingReport.content);
      }
    }

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, [selectedExam]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [empRes, examRes, preRes] = await Promise.all([
        supabase.from('profiles').select('*').order('first_name'),
        supabase.from('exams').select('*').order('name'),
        supabase.from('pre_reports').select('*')
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

  const handleSelectExam = (exam: any) => {
    quillRef.current = null;
    setSelectedExam(exam);
    setSearchExam('');
  };

  const handleSavePreReport = async () => {
    if (!selectedExam) return;
    setSubmitting(true);
    try {
      const existingReport = preReports.find(r => r.exam_id === selectedExam.id);
      
      if (existingReport) {
        const { error } = await supabase
          .from('pre_reports')
          .update({ content: editContent })
          .eq('id', existingReport.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pre_reports')
          .insert([{ 
            name: selectedExam.name, 
            content: editContent, 
            exam_id: selectedExam.id 
          }]);
        if (error) throw error;
      }

      showSuccess('Modelo de laudo salvo com sucesso!');
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

  const handleDeleteExam = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este exame? Isso removerá também o modelo de laudo vinculado.')) return;
    try {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Exame removido.');
      if (selectedExam?.id === id) {
        setSelectedExam(null);
        quillRef.current = null;
      }
      fetchAllData();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const filteredExams = exams.filter(e => 
    e.name.toLowerCase().includes(searchExam.toLowerCase())
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

          <TabsContent value="pre-reports" className="animate-in fade-in slide-in-from-top duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-6 backdrop-blur-sm">
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Selecione um Exame</h3>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-300/30" />
                    <Input 
                      placeholder="Filtrar exames..." 
                      className="bg-blue-900/20 border-blue-500/10 h-10 pl-10 rounded-xl text-white text-xs"
                      value={searchExam}
                      onChange={(e) => setSearchExam(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredExams.map(exam => (
                      <button
                        key={exam.id}
                        onClick={() => handleSelectExam(exam)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl border transition-all group",
                          selectedExam?.id === exam.id 
                            ? "bg-blue-600 border-blue-400 text-white shadow-lg" 
                            : "bg-blue-900/10 border-white/5 text-blue-300/60 hover:border-blue-500/30"
                        )}
                      >
                        <p className="text-[10px] font-black uppercase tracking-tight">{exam.name}</p>
                        <p className="text-[8px] opacity-50 font-bold uppercase">{preReports.some(r => r.exam_id === exam.id) ? 'Modelo Configurado' : 'Sem Modelo'}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8">
                {selectedExam ? (
                  <div className={cn(
                    "bg-blue-950/40 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col",
                    isExpanded ? "fixed inset-4 z-[100] bg-blue-950" : "h-full min-h-[600px]"
                  )}>
                    <div className="bg-blue-900/20 border-b border-white/5 p-6 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">{selectedExam.name}</h3>
                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Editor de Modelo Base</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="ghost" 
                          onClick={() => setIsExpanded(!isExpanded)}
                          className="text-blue-300/40 hover:text-white gap-2 font-bold uppercase text-[10px]"
                        >
                          {isExpanded ? <><Minimize2 className="w-4 h-4" /> Minimizar</> : <><Maximize2 className="w-4 h-4" /> Expandir</>}
                        </Button>
                        {!isExpanded && (
                          <Button 
                            variant="ghost" 
                            onClick={() => { setSelectedExam(null); quillRef.current = null; }}
                            className="text-blue-300/40 hover:text-white gap-2 font-bold uppercase text-[10px]"
                          >
                            <X className="w-4 h-4" /> Fechar
                          </Button>
                        )}
                        <Button 
                          onClick={handleSavePreReport}
                          disabled={submitting}
                          className="bg-emerald-600 hover:bg-emerald-500 rounded-xl gap-2 font-bold uppercase text-[10px] px-6"
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Salvar Modelo</>}
                        </Button>
                      </div>
                    </div>
                    <div className="flex-grow p-4 bg-white text-black overflow-hidden flex flex-col">
                      <div ref={editorContainerRef} className="flex-grow overflow-y-auto" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[600px] opacity-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                    <FileText className="w-16 h-16 mb-4" />
                    <p className="font-bold uppercase tracking-widest text-sm">Selecione um exame ao lado para editar seu laudo</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

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
                        onClick={() => handleDeleteExam(exam.id)}
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
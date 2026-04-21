"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Settings, 
  Users, 
  FlaskConical, 
  Plus, 
  UserCircle, 
  Shield, 
  Trash2,
  Loader2,
  Save
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

  // Estados para Referências
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [references, setReferences] = useState<any[]>([]);
  const [newRef, setNewRef] = useState({ parameter: '', male_ref: '', female_ref: '', general_ref: '', unit: '' });

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

  const fetchReferences = async (examId: string) => {
    const { data } = await supabase
      .from('reference_values')
      .select('*')
      .eq('exam_id', examId)
      .order('created_at');
    setReferences(data || []);
  };

  const handleSelectExam = (exam: any) => {
    setSelectedExam(exam);
    fetchReferences(exam.id);
  };

  const handleAddReference = async () => {
    if (!newRef.parameter) return showError('Nome do parâmetro é obrigatório.');
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reference_values')
        .insert([{ ...newRef, exam_id: selectedExam.id }]);

      if (error) throw error;
      showSuccess('Referência adicionada!');
      setNewRef({ parameter: '', male_ref: '', female_ref: '', general_ref: '', unit: '' });
      fetchReferences(selectedExam.id);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRef = async (id: string) => {
    try {
      await supabase.from('reference_values').delete().eq('id', id);
      fetchReferences(selectedExam.id);
      showSuccess('Referência removida.');
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
            Configurações Técnicas
          </h1>
          <p className="text-blue-300/50 text-sm mt-1 font-medium">Gerencie valores de referência e equipe</p>
        </div>

        <Tabs defaultValue="references" className="w-full">
          <TabsList className="bg-blue-950/40 border border-white/5 p-1 rounded-2xl h-14 mb-8">
            <TabsTrigger value="references" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase text-[10px] tracking-widest gap-2">
              <FlaskConical className="w-4 h-4" /> Valores de Referência
            </TabsTrigger>
            <TabsTrigger value="employees" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase text-[10px] tracking-widest gap-2">
              <Users className="w-4 h-4" /> Funcionários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="references" className="animate-in fade-in slide-in-from-top duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Lista de Exames */}
              <div className="lg:col-span-4 bg-blue-950/30 border border-white/5 rounded-[2rem] p-6 backdrop-blur-sm">
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-6">Selecione o Exame</h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {exams.map(exam => (
                    <button
                      key={exam.id}
                      onClick={() => handleSelectExam(exam)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border transition-all group",
                        selectedExam?.id === exam.id 
                          ? "bg-blue-600 border-blue-400 text-white" 
                          : "bg-blue-900/10 border-white/5 text-blue-300/60 hover:border-blue-500/30"
                      )}
                    >
                      <p className="text-xs font-bold uppercase">{exam.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gestão de Parâmetros */}
              <div className="lg:col-span-8">
                {selectedExam ? (
                  <div className="bg-blue-950/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{selectedExam.name}</h3>
                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Configuração de Parâmetros e Referências</p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-bold uppercase text-[10px]">
                            <Plus className="w-4 h-4" /> Novo Parâmetro
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-blue-950 border-white/10 text-white max-w-md">
                          <DialogHeader>
                            <DialogTitle className="uppercase tracking-widest font-black text-blue-400">Adicionar Parâmetro</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-blue-300/50">Nome do Parâmetro</label>
                              <Input value={newRef.parameter} onChange={e => setNewRef({...newRef, parameter: e.target.value})} className="bg-blue-900/20 border-white/10 rounded-xl" placeholder="Ex: Hemoglobina" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-blue-300/50">Ref. Masculino</label>
                                <Input value={newRef.male_ref} onChange={e => setNewRef({...newRef, male_ref: e.target.value})} className="bg-blue-900/20 border-white/10 rounded-xl" placeholder="13.5 - 17.5" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-blue-300/50">Ref. Feminino</label>
                                <Input value={newRef.female_ref} onChange={e => setNewRef({...newRef, female_ref: e.target.value})} className="bg-blue-900/20 border-white/10 rounded-xl" placeholder="12.0 - 15.5" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-blue-300/50">Ref. Geral</label>
                                <Input value={newRef.general_ref} onChange={e => setNewRef({...newRef, general_ref: e.target.value})} className="bg-blue-900/20 border-white/10 rounded-xl" placeholder="Opcional" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-blue-300/50">Unidade</label>
                                <Input value={newRef.unit} onChange={e => setNewRef({...newRef, unit: e.target.value})} className="bg-blue-900/20 border-white/10 rounded-xl" placeholder="g/dL" />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleAddReference} disabled={submitting} className="bg-blue-600 hover:bg-blue-500 w-full rounded-xl font-bold uppercase text-xs">
                              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Parâmetro'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="space-y-3">
                      {references.map(ref => (
                        <div key={ref.id} className="bg-blue-900/20 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
                          <div className="grid grid-cols-4 gap-8 flex-grow">
                            <div>
                              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Parâmetro</p>
                              <p className="text-xs font-bold text-white uppercase">{ref.parameter}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Masculino</p>
                              <p className="text-xs font-bold text-blue-100">{ref.male_ref || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Feminino</p>
                              <p className="text-xs font-bold text-blue-100">{ref.female_ref || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Unidade</p>
                              <p className="text-xs font-bold text-blue-100">{ref.unit}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteRef(ref.id)} className="text-red-400/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {references.length === 0 && (
                        <div className="text-center py-12 opacity-20">
                          <p className="font-bold uppercase tracking-widest text-xs">Nenhum parâmetro configurado</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-32 opacity-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                    <FlaskConical className="w-16 h-16 mb-4" />
                    <p className="font-bold uppercase tracking-widest text-sm">Selecione um exame para configurar as referências</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="employees" className="animate-in fade-in slide-in-from-top duration-500">
            <div className="bg-blue-950/30 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
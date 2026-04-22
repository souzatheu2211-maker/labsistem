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
  FlaskConical,
  UserPlus
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [exams, setExams] = useState<any[]>([]);
  const [preReports, setPreReports] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  // Estados para novos cadastros
  const [newExam, setNewExam] = useState({ name: '', code: '' });
  const [newReport, setNewReport] = useState({ name: '', exam_id: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [exRes, preRes, profRes] = await Promise.all([
        supabase.from('exams').select('*').order('name'),
        supabase.from('pre_reports').select('*, exams(name)').order('name'),
        supabase.from('profiles').select('*').order('first_name')
      ]);
      setExams(exRes.data || []);
      setPreReports(preRes.data || []);
      setProfiles(profRes.data || []);
    } catch (e) {
      showError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExam = async () => {
    if (!newExam.name) return showError('Nome do exame é obrigatório.');
    setSubmitting(true);
    const { error } = await supabase.from('exams').insert([newExam]);
    if (error) showError(error.message);
    else {
      showSuccess('Exame adicionado ao catálogo!');
      setNewExam({ name: '', code: '' });
      fetchData();
    }
    setSubmitting(false);
  };

  const handleAddReport = async () => {
    if (!newReport.name || !newReport.exam_id) return showError('Nome e Exame são obrigatórios.');
    setSubmitting(true);
    const { error } = await supabase.from('pre_reports').insert([newReport]);
    if (error) showError(error.message);
    else {
      showSuccess('Modelo de laudo cadastrado!');
      setNewReport({ name: '', exam_id: '' });
      fetchData();
    }
    setSubmitting(false);
  };

  const handleDeleteReport = async (id: string) => {
    const { error } = await supabase.from('pre_reports').delete().eq('id', id);
    if (error) showError(error.message);
    else {
      showSuccess('Modelo removido.');
      fetchData();
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
            <Settings className="w-6 h-6 text-blue-400" />
            Configurações
          </h1>
        </div>

        <Tabs defaultValue="exams" className="w-full">
          <TabsList className="bg-blue-950/40 border border-white/5 p-1 rounded-2xl h-14 mb-8">
            <TabsTrigger value="exams" className="rounded-xl px-6 data-[state=active]:bg-blue-600 font-bold uppercase text-[10px] gap-2">
              <FlaskConical className="w-4 h-4" /> Catálogo de Exames
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-xl px-6 data-[state=active]:bg-blue-600 font-bold uppercase text-[10px] gap-2">
              <FileText className="w-4 h-4" /> Modelos de Laudo
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl px-6 data-[state=active]:bg-blue-600 font-bold uppercase text-[10px] gap-2">
              <Users className="w-4 h-4" /> Usuários
            </TabsTrigger>
          </TabsList>

          {/* ABA: EXAMES */}
          <TabsContent value="exams" className="space-y-6">
            <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8">
              <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">Novo Exame no Catálogo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  placeholder="Nome do Exame" 
                  value={newExam.name}
                  onChange={e => setNewExam({...newExam, name: e.target.value})}
                  className="bg-blue-900/20 border-white/10 text-white"
                />
                <Input 
                  placeholder="Código" 
                  value={newExam.code}
                  onChange={e => setNewExam({...newExam, code: e.target.value})}
                  className="bg-blue-900/20 border-white/10 text-white"
                />
                <Button onClick={handleAddExam} disabled={submitting} className="bg-blue-600 font-bold uppercase text-xs">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cadastrar Exame'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exams.map(ex => (
                <div key={ex.id} className="bg-blue-900/10 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                  <span className="text-sm font-bold text-white uppercase">{ex.name}</span>
                  <span className="text-[10px] text-blue-400 font-bold uppercase">{ex.code}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ABA: MODELOS DE LAUDO */}
          <TabsContent value="reports" className="space-y-6">
            <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8">
              <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">Cadastrar Novo Modelo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  placeholder="Nome do Modelo" 
                  value={newReport.name}
                  onChange={e => setNewReport({...newReport, name: e.target.value})}
                  className="bg-blue-900/20 border-white/10 text-white"
                />
                <select 
                  className="bg-blue-900/20 border border-white/10 rounded-xl px-3 text-sm text-white outline-none"
                  value={newReport.exam_id}
                  onChange={e => setNewReport({...newReport, exam_id: e.target.value})}
                >
                  <option value="">Vincular ao Exame...</option>
                  {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
                <Button onClick={handleAddReport} disabled={submitting} className="bg-blue-600 font-bold uppercase text-xs">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Modelo'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {preReports.map(report => (
                <div key={report.id} className="bg-blue-900/10 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-white uppercase">{report.name}</p>
                    <p className="text-[10px] text-blue-400 uppercase">Exame: {report.exams?.name}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteReport(report.id)} className="text-red-400/50 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ABA: USUÁRIOS */}
          <TabsContent value="users">
            <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Equipe Técnica</h3>
                <Button variant="outline" className="border-blue-500/30 text-blue-400 text-[10px] font-black uppercase gap-2">
                  <UserPlus className="w-4 h-4" /> Convidar
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profiles.map(p => (
                  <div key={p.id} className="bg-blue-900/10 border border-white/5 p-4 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      {p.first_name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white uppercase">{p.first_name} {p.last_name}</p>
                      <p className="text-[9px] text-blue-400 uppercase">{p.role}</p>
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
"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, User, FlaskConical, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate } from 'react-router-dom';
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';

const NewService = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [isEmergency, setIsEmergency] = useState(false);

  const mockPatients = [
    { id: 1, nome: 'João Silva', cpf: '123.456.789-00', idade: '45 anos' },
    { id: 2, nome: 'Maria Oliveira', cpf: '987.654.321-11', idade: '32 anos' },
  ];

  const availableExams = [
    "Hemograma Completo", "Glicose", "Colesterol Total", "Creatinina", "Ureia", "TGO/TGP", "TSH", "Vitamina D"
  ];

  const toggleExam = (exam: string) => {
    setSelectedExams(prev => 
      prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam]
    );
  };

  const handleFinish = () => {
    showSuccess('Atendimento encaminhado para a rotina!');
    navigate('/rotina');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <PlusCircle className="w-6 h-6 text-blue-400" />
            Novo Atendimento
          </h1>
          <p className="text-blue-300/50 text-sm mt-1">Inicie um novo processo laboratorial para um paciente</p>
        </div>

        {/* Passo 1: Buscar Paciente */}
        <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-blue-100 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px]">1</span>
            Identificação do Paciente
          </h3>
          
          <div className="relative mb-6">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-blue-300/30" />
            <Input 
              placeholder="Pesquisar por Nome ou CPF..." 
              className="bg-blue-900/20 border-blue-500/10 h-12 pl-12 rounded-2xl text-white placeholder:text-blue-300/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {search && !selectedPatient && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top duration-300">
              {mockPatients.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className="w-full flex items-center justify-between p-4 bg-blue-900/10 border border-white/5 rounded-2xl hover:bg-blue-600/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold">
                      {p.nome.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{p.nome}</p>
                      <p className="text-[10px] text-blue-300/40 uppercase">CPF: {p.cpf} • {p.idade}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          )}

          {selectedPatient && (
            <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-between animate-in zoom-in duration-300">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-sm font-bold text-white">{selectedPatient.nome}</p>
                  <p className="text-[10px] text-blue-300/60 uppercase">Paciente Selecionado</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)} className="text-blue-400 hover:text-blue-300">Trocar</Button>
            </div>
          )}
        </div>

        {/* Passo 2: Seleção de Exames */}
        {selectedPatient && (
          <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-blue-100 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px]">2</span>
                Seleção de Exames
              </h3>
              <div className="flex items-center space-x-2 bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">
                <AlertCircle className={cn("w-4 h-4 text-red-400", isEmergency && "animate-pulse")} />
                <Label htmlFor="emergency" className="text-[10px] font-bold text-red-400 uppercase cursor-pointer">Emergência</Label>
                <Switch id="emergency" checked={isEmergency} onCheckedChange={setIsEmergency} />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableExams.map(exam => (
                <button
                  key={exam}
                  onClick={() => toggleExam(exam)}
                  className={cn(
                    "p-3 rounded-xl border text-xs font-medium transition-all text-left flex items-center justify-between",
                    selectedExams.includes(exam) 
                      ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40" 
                      : "bg-blue-900/10 border-white/5 text-blue-300/60 hover:border-blue-500/30"
                  )}
                >
                  {exam}
                  {selectedExams.includes(exam) && <CheckCircle2 className="w-3 h-3" />}
                </button>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
              <div className="text-left">
                <p className="text-[10px] text-blue-300/40 uppercase font-bold">Total de Exames</p>
                <p className="text-xl font-bold text-white">{selectedExams.length}</p>
              </div>
              <Button 
                disabled={selectedExams.length === 0}
                onClick={handleFinish}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-8 h-12 gap-2 shadow-lg shadow-blue-900/40 group"
              >
                Finalizar Atendimento
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

import { PlusCircle } from 'lucide-react';
export default NewService;
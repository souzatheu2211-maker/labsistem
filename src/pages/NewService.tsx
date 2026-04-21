"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, PlusCircle, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
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

  const patients: any[] = []; // Dados fakes removidos
  const exams: string[] = []; // Dados fakes removidos

  const handleFinish = () => {
    showSuccess('Atendimento encaminhado para a rotina!');
    navigate('/rotina');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
            <PlusCircle className="w-6 h-6 text-blue-400" />
            Novo Atendimento
          </h1>
          <p className="text-blue-300/50 text-sm mt-1 font-medium">Inicie um novo processo laboratorial para um paciente</p>
        </div>

        <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm">
          <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white">1</span>
            Identificação do Paciente
          </h3>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-blue-300/30" />
            <Input 
              placeholder="Pesquisar por Nome ou CPF..." 
              className="bg-blue-900/20 border-blue-500/10 h-12 pl-12 rounded-2xl text-white font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {search && patients.length === 0 && (
            <p className="text-center py-6 text-blue-300/20 font-bold uppercase text-xs tracking-widest">Nenhum paciente encontrado</p>
          )}
        </div>

        {selectedPatient && (
          <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white">2</span>
                Seleção de Exames
              </h3>
              <div className="flex items-center space-x-2 bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">
                <AlertCircle className={cn("w-4 h-4 text-red-400", isEmergency && "animate-pulse")} />
                <Label className="text-[10px] font-black text-red-400 uppercase cursor-pointer">Emergência</Label>
                <Switch checked={isEmergency} onCheckedChange={setIsEmergency} />
              </div>
            </div>
            <div className="text-center py-12 opacity-20">
              <p className="font-bold uppercase tracking-widest">Nenhum exame disponível</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NewService;
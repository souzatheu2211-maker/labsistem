"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  UserPlus, 
  Search, 
  Edit3, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2,
  User,
  MapPin,
  FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';

const Patients = () => {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const patients: any[] = []; // Dados fakes removidos

  const handleSave = () => {
    showSuccess('Paciente cadastrado com sucesso!');
    setStep(1);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
            <div className="p-2 bg-blue-600/20 rounded-xl">
              <UserPlus className="w-6 h-6 text-blue-400" />
            </div>
            Cadastro de Pacientes
          </h1>
          <p className="text-blue-300/50 text-sm mt-1 font-medium">Gerencie e registre novos pacientes no sistema</p>
        </div>

        <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-6 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-blue-300/30" />
            <Input 
              placeholder="Buscar paciente por nome ou CPF..." 
              className="bg-blue-900/20 border-blue-500/10 h-12 pl-12 rounded-2xl text-white placeholder:text-blue-300/20 font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {searchQuery && patients.length === 0 && (
            <p className="text-center py-6 text-blue-300/20 font-bold uppercase text-xs tracking-widest">Nenhum paciente encontrado</p>
          )}
        </div>

        <div className="bg-blue-950/40 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="flex border-b border-white/5 bg-blue-900/10">
            {[
              { s: 1, label: 'Dados Pessoais', icon: User },
              { s: 2, label: 'Endereço & Contato', icon: MapPin },
              { s: 3, label: 'Observações', icon: FileText }
            ].map((item) => (
              <div key={item.s} className={cn("flex-1 flex items-center justify-center gap-3 py-5 text-[10px] font-black uppercase tracking-widest transition-all", step === item.s ? "text-blue-400 bg-blue-600/5 border-b-2 border-blue-500" : "text-blue-300/20")}>
                <item.icon className={cn("w-4 h-4", step === item.s ? "animate-pulse" : "")} />
                <span className="hidden md:inline">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="p-8 md:p-12">
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right duration-500">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase ml-1 tracking-widest">Nome Completo</label>
                  <Input className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase ml-1 tracking-widest">CPF</label>
                  <Input className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase ml-1 tracking-widest">Data de Nascimento</label>
                  <Input type="date" className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase ml-1 tracking-widest">Sexo</label>
                  <Select defaultValue="masculino">
                    <SelectTrigger className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-950 border-white/10 text-white">
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right duration-500">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase ml-1 tracking-widest">Telefone / WhatsApp</label>
                  <Input className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase ml-1 tracking-widest">Endereço</label>
                  <Input className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white font-bold" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-right duration-500">
                <label className="text-[10px] font-black text-blue-400 uppercase ml-1 tracking-widest">Observações Clínicas</label>
                <Textarea className="bg-blue-900/20 border-blue-500/10 min-h-[150px] rounded-2xl text-white font-bold resize-none" />
              </div>
            )}

            <div className="mt-12 flex items-center justify-between pt-8 border-t border-white/5">
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 1} className="text-blue-300/40 hover:text-blue-100 font-bold uppercase text-xs">Anterior</Button>
              {step < 3 ? (
                <Button onClick={() => setStep(s => s + 1)} className="bg-blue-600 hover:bg-blue-500 rounded-xl px-8 font-bold uppercase text-xs">Próximo</Button>
              ) : (
                <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 rounded-xl px-8 font-bold uppercase text-xs">Finalizar</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Patients;
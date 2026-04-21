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
  Phone,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';

const Patients = () => {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock de pacientes para a busca
  const mockPatients = [
    { id: 1, nome: 'João Silva', cpf: '123.456.789-00', tel: '(71) 99999-0000' },
    { id: 2, nome: 'Maria Oliveira', cpf: '987.654.321-11', tel: '(71) 88888-1111' },
  ];

  const handleSave = () => {
    showSuccess('Paciente cadastrado com sucesso!');
    setStep(1);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        
        {/* Cabeçalho da Página */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-50 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-xl">
                <UserPlus className="w-6 h-6 text-blue-400 animate-pulse" />
              </div>
              Cadastro de Pacientes
            </h1>
            <p className="text-blue-300/50 text-sm mt-1">Gerencie e registre novos pacientes no sistema</p>
          </div>
        </div>

        {/* Barra de Busca e Lista */}
        <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-6 backdrop-blur-sm">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-blue-300/30" />
            <Input 
              placeholder="Buscar paciente por nome ou CPF..." 
              className="bg-blue-900/20 border-blue-500/10 h-12 pl-12 rounded-2xl text-white placeholder:text-blue-300/20 focus:ring-blue-500/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {searchQuery && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top duration-300">
              {mockPatients.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-blue-900/10 border border-white/5 rounded-2xl hover:bg-blue-900/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold">
                      {p.nome.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-100">{p.nome}</p>
                      <p className="text-[10px] text-blue-300/40 uppercase tracking-wider">CPF: {p.cpf} • {p.tel}</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-xl gap-2">
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulário em Etapas */}
        <div className="bg-blue-950/40 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {/* Stepper Header */}
          <div className="flex border-b border-white/5 bg-blue-900/10">
            {[
              { s: 1, label: 'Dados Pessoais', icon: User },
              { s: 2, label: 'Endereço & Contato', icon: MapPin },
              { s: 3, label: 'Observações', icon: FileText }
            ].map((item) => (
              <div 
                key={item.s}
                className={cn(
                  "flex-1 flex items-center justify-center gap-3 py-5 text-xs font-bold uppercase tracking-widest transition-all",
                  step === item.s ? "text-blue-400 bg-blue-600/5 border-b-2 border-blue-500" : "text-blue-300/20"
                )}
              >
                <item.icon className={cn("w-4 h-4", step === item.s ? "animate-bounce" : "")} />
                <span className="hidden md:inline">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="p-8 md:p-12">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-blue-300/40 uppercase ml-1">Nome Completo</label>
                    <Input placeholder="Ex: João da Silva" className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-blue-300/40 uppercase ml-1">CPF</label>
                    <Input placeholder="000.000.000-00" className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-blue-300/40 uppercase ml-1">Data de Nascimento</label>
                    <Input type="date" className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-blue-300/40 uppercase ml-1">Sexo</label>
                    <Select defaultValue="masculino">
                      <SelectTrigger className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-blue-950 border-white/10 text-white">
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-blue-300/40 uppercase ml-1">Telefone / WhatsApp</label>
                    <Input placeholder="(00) 00000-0000" className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-blue-300/40 uppercase ml-1">Endereço</label>
                    <Input placeholder="Rua, Número, Bairro" className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white" />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-blue-300/40 uppercase ml-1">Observações Clínicas</label>
                  <Textarea 
                    placeholder="Alergias, condições prévias, etc..." 
                    className="bg-blue-900/20 border-blue-500/10 min-h-[150px] rounded-2xl text-white resize-none" 
                  />
                </div>
              </div>
            )}

            {/* Navegação do Form */}
            <div className="mt-12 flex items-center justify-between pt-8 border-t border-white/5">
              <Button 
                variant="ghost" 
                onClick={() => setStep(s => s - 1)}
                disabled={step === 1}
                className="text-blue-300/40 hover:text-blue-100 hover:bg-blue-900/30 rounded-xl gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              {step < 3 ? (
                <Button 
                  onClick={() => setStep(s => s + 1)}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-8 gap-2 group"
                >
                  Próximo Passo
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSave}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-8 gap-2 shadow-lg shadow-emerald-900/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Finalizar Cadastro
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Patients;
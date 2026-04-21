"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  UserPlus, 
  Search, 
  User,
  MapPin,
  FileText,
  Loader2
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
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const Patients = () => {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);

  // Estado do formulário
  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    birth_date: '',
    gender: 'masculino',
    phone: '',
    address: '',
    observations: ''
  });

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchPatients();
    } else {
      setPatients([]);
    }
  }, [searchQuery]);

  const searchPatients = async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .or(`full_name.ilike.%${searchQuery}%,cpf.ilike.%${searchQuery}%`)
      .limit(5);
    
    if (!error) setPatients(data || []);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value }));
  };

  const handleSave = async () => {
    // Validação de campos obrigatórios
    if (!formData.full_name || !formData.cpf || !formData.birth_date) {
      showError('Nome, CPF e Data de Nascimento são obrigatórios.');
      setStep(1); // Volta para o primeiro passo onde estão esses campos
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('patients')
        .insert([
          { 
            ...formData,
            created_by: user?.id 
          }
        ]);

      if (error) throw error;

      showSuccess('Paciente cadastrado com sucesso!');
      setFormData({
        full_name: '',
        cpf: '',
        birth_date: '',
        gender: 'masculino',
        phone: '',
        address: '',
        observations: ''
      });
      setStep(1);
      setSearchQuery('');
    } catch (error: any) {
      showError(error.message || 'Erro ao salvar paciente.');
    } finally {
      setLoading(false);
    }
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
          
          {searchQuery && patients.length > 0 && (
            <div className="mt-4 space-y-2">
              {patients.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-blue-900/10 border border-white/5 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-white uppercase">{p.full_name}</p>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">CPF: {p.cpf}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 font-bold uppercase text-[10px]">Ver Detalhes</Button>
                </div>
              ))}
            </div>
          )}

          {searchQuery && searchQuery.length > 2 && patients.length === 0 && (
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
                  <label className="text-[10px] font-black text-blue-400 uppercase ml-1 tracking-widest flex items-center gap-1">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white font-bold" 
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase ml-1 tracking-widest flex items-center gap-1">
                    CPF <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white font-bold" 
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase ml-1 tracking-widest flex items-center gap-1">
                    Data de Nascimento <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    type="date" 
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleInputChange}
                    className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase ml-1 tracking-widest">Sexo</label>
                  <Select value={formData.gender} onValueChange={handleSelectChange}>
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
                  <Input 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase ml-1 tracking-widest">Endereço</label>
                  <Input 
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="bg-blue-900/20 border-blue-500/10 h-12 rounded-xl text-white font-bold" 
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-right duration-500">
                <label className="text-[10px] font-black text-blue-400 uppercase ml-1 tracking-widest">Observações Clínicas</label>
                <Textarea 
                  name="observations"
                  value={formData.observations}
                  onChange={handleInputChange}
                  className="bg-blue-900/20 border-blue-500/10 min-h-[150px] rounded-2xl text-white font-bold resize-none" 
                />
              </div>
            )}

            <div className="mt-12 flex items-center justify-between pt-8 border-t border-white/5">
              <Button 
                variant="ghost" 
                onClick={() => setStep(s => s - 1)} 
                disabled={step === 1 || loading} 
                className="text-blue-300/40 hover:text-blue-100 font-bold uppercase text-xs"
              >
                Anterior
              </Button>
              {step < 3 ? (
                <Button 
                  onClick={() => setStep(s => s + 1)} 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 rounded-xl px-8 font-bold uppercase text-xs"
                >
                  Próximo
                </Button>
              ) : (
                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-500 rounded-xl px-8 font-bold uppercase text-xs gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Finalizar Cadastro'}
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
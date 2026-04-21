"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Calendar as CalendarIcon, Clock, User, FlaskConical, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Routine = () => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    fetchServices();
    
    // Realtime subscription para atualizar a fila automaticamente
    const channel = supabase
      .channel('routine-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => fetchServices())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        patients (full_name, cpf),
        service_exams (
          id,
          status,
          exams (name)
        )
      `)
      .order('created_at', { ascending: false });

    if (!error) setServices(data || []);
    setLoading(false);
  };

  const filteredServices = services.filter(s => 
    s.patients?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.patients?.cpf.includes(search)
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
              <Clock className="w-6 h-6 text-blue-400" />
              Rotina Diária
            </h1>
            <p className="text-blue-300/50 text-sm mt-1 font-medium">Fila de atendimentos e status de processamento</p>
          </div>
          <div className="bg-blue-900/20 border border-white/5 px-4 py-2 rounded-xl flex items-center gap-2 text-blue-100">
            <CalendarIcon className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR })}
            </span>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-3 h-4 w-4 text-blue-300/30" />
          <Input 
            placeholder="Buscar por Nome ou CPF..." 
            className="bg-blue-950/40 border-white/5 h-10 pl-10 rounded-xl text-white font-bold text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Carregando fila...</p>
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredServices.map((service) => (
              <div 
                key={service.id} 
                className={cn(
                  "bg-blue-950/30 border rounded-[2rem] p-6 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-blue-500/30",
                  service.is_emergency ? "border-red-500/20 bg-red-500/5" : "border-white/5"
                )}
              >
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                    service.is_emergency ? "bg-red-500/20 text-red-400" : "bg-blue-600/20 text-blue-400"
                  )}>
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-white uppercase">{service.patients?.full_name}</h3>
                      {service.is_emergency && (
                        <span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">Emergência</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-blue-300/40 uppercase tracking-widest">
                      <span>CPF: {service.patients?.cpf}</span>
                      <span className="w-1 h-1 rounded-full bg-white/10"></span>
                      <span>Entrada: {format(new Date(service.created_at), "HH:mm")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 max-w-md">
                  {service.service_exams?.map((se: any) => (
                    <div key={se.id} className="flex items-center gap-2 bg-blue-900/20 border border-white/5 px-3 py-1.5 rounded-lg">
                      <FlaskConical className="w-3 h-3 text-blue-400" />
                      <span className="text-[9px] font-black text-blue-100 uppercase tracking-tight">{se.exams?.name}</span>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        se.status === 'finalizado' ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                      )}></div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Status Geral</p>
                    <div className={cn(
                      "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                      service.status === 'pendente' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    )}>
                      {service.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm min-h-[400px] flex items-center justify-center">
            <div className="text-center opacity-20">
              <Clock className="w-12 h-12 mx-auto mb-4" />
              <p className="font-bold uppercase tracking-widest">Fila de espera vazia</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Routine;
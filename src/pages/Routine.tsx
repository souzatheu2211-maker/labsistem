"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Input } from "@/components/ui/input";

const Routine = () => {
  const [search, setSearch] = useState('');
  const queue: any[] = []; // Dados fakes removidos

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
            <span className="text-xs font-bold uppercase tracking-widest">15 de Outubro, 2023</span>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-3 h-4 w-4 text-blue-300/30" />
          <Input 
            placeholder="Buscar por Registro, Nome ou CPF..." 
            className="bg-blue-950/40 border-white/5 h-10 pl-10 rounded-xl text-white font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm min-h-[400px] flex items-center justify-center">
          <div className="text-center opacity-20">
            <Clock className="w-12 h-12 mx-auto mb-4" />
            <p className="font-bold uppercase tracking-widest">Fila de espera vazia</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Routine;
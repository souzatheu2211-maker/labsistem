"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileCheck, Search, FileText } from 'lucide-react';
import { Input } from "@/components/ui/input";

const Results = () => {
  const [search, setSearch] = useState('');
  const queue: any[] = []; // Dados fakes removidos

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
            <FileCheck className="w-6 h-6 text-blue-400" />
            Lançamento de Resultados
          </h1>
          <p className="text-blue-300/50 text-sm mt-1 font-medium">Selecione um paciente para inserir os valores dos exames</p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-3 h-4 w-4 text-blue-300/30" />
          <Input 
            placeholder="Buscar paciente na fila..." 
            className="bg-blue-950/40 border-white/5 h-10 pl-10 rounded-xl text-white font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]">
          <div className="col-span-full flex flex-col items-center justify-center opacity-20">
            <FileText className="w-12 h-12 mb-4" />
            <p className="font-bold uppercase tracking-widest">Nenhum atendimento pendente</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Results;
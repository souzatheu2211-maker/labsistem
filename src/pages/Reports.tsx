"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Printer, FileText, Download, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Reports = () => {
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
            <Printer className="w-6 h-6 text-blue-400" />
            Impressão de Laudos
          </h1>
          <p className="text-blue-300/50 text-sm mt-1 font-medium">Busque o paciente para visualizar e baixar os laudos finalizados</p>
        </div>

        <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-blue-300/30" />
            <Input 
              placeholder="Pesquisar por Nome ou CPF..." 
              className="bg-blue-900/20 border-blue-500/10 h-12 pl-12 rounded-2xl text-white placeholder:text-blue-300/20 font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {!selectedPatient ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <User className="w-16 h-16 mb-4" />
            <p className="text-lg font-bold uppercase tracking-widest">Nenhum paciente selecionado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 animate-in fade-in zoom-in duration-500">
            {/* Lista de laudos aparecerá aqui após integração */}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Reports;
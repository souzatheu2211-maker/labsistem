"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Calendar as CalendarIcon, Edit3, Trash2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

const Routine = () => {
  const [search, setSearch] = useState('');

  const mockQueue = [
    { id: 1, reg: '01', nome: 'João Silva', cpf: '123.456.789-00', status: 'Pendente', exames: 4, examesProntos: 2, emergency: true },
    { id: 2, reg: '02', nome: 'Maria Oliveira', cpf: '987.654.321-11', status: 'Liberado', exames: 2, examesProntos: 2, emergency: false },
    { id: 3, reg: '03', nome: 'Carlos Souza', cpf: '456.789.123-22', status: 'Cancelado', exames: 3, examesProntos: 0, emergency: false },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-400" />
              Rotina Diária
            </h1>
            <p className="text-blue-300/50 text-sm mt-1">Fila de atendimentos e status de processamento</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-blue-900/20 border border-white/5 px-4 py-2 rounded-xl flex items-center gap-2 text-blue-100">
              <CalendarIcon className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">15 de Outubro, 2023</span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-3 h-4 w-4 text-blue-300/30" />
            <Input 
              placeholder="Buscar por Registro, Nome ou CPF..." 
              className="bg-blue-950/40 border-white/5 h-10 pl-10 rounded-xl text-white placeholder:text-blue-300/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela de Fila */}
        <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-900/20 border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-bold text-blue-300/40 uppercase tracking-widest">Reg</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-blue-300/40 uppercase tracking-widest">Paciente</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-blue-300/40 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-blue-300/40 uppercase tracking-widest">Progresso</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-blue-300/40 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mockQueue.map((item) => (
                  <tr 
                    key={item.id} 
                    className={cn(
                      "group transition-colors",
                      item.status === 'Cancelado' ? "opacity-40 grayscale" : "hover:bg-blue-600/5"
                    )}
                  >
                    <td className="px-6 py-4">
                      <span className="text-lg font-black text-blue-500/50 group-hover:text-blue-400 transition-colors">#{item.reg}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                            {item.nome}
                            {item.emergency && <AlertCircle className="w-3 h-3 text-red-500 animate-pulse" />}
                          </p>
                          <p className="text-[10px] text-blue-300/40 uppercase">CPF: {item.cpf}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter",
                        item.status === 'Pendente' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                        item.status === 'Liberado' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                        item.status === 'Cancelado' && "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      )}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <div className="flex justify-between text-[10px] font-bold text-blue-300/40 mb-1 uppercase">
                          <span>{item.examesProntos}/{item.exames}</span>
                          <span>{Math.round((item.examesProntos / item.exames) * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-blue-900/30 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-1000",
                              item.status === 'Liberado' ? "bg-emerald-500" : "bg-blue-500"
                            )}
                            style={{ width: `${(item.examesProntos / item.exames) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-blue-400 hover:bg-blue-400/10">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-400/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Routine;
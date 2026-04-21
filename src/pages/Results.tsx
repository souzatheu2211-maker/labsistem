"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, FileText, Save, Edit3, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';

const Results = () => {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [results, setResults] = useState<any>({});

  const mockQueue = [
    { id: 1, reg: '01', nome: 'João Silva', exames: ['Hemograma', 'Glicose', 'Creatinina'], status: 'Pendente' },
    { id: 2, reg: '02', nome: 'Maria Oliveira', exames: ['TSH', 'Vitamina D'], status: 'Pendente' },
  ];

  const handleSaveResult = (exame: string) => {
    setResults(prev => ({ ...prev, [exame]: { ...prev[exame], saved: true } }));
    showSuccess(`Resultado de ${exame} salvo!`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        {!selectedPatient ? (
          <>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-400" />
                Lançamento de Resultados
              </h1>
              <p className="text-blue-300/50 text-sm mt-1">Selecione um paciente para inserir os valores dos exames</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockQueue.map(p => (
                <div key={p.id} className="bg-blue-950/30 border border-white/5 p-6 rounded-[2rem] backdrop-blur-sm hover:border-blue-500/30 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-2xl font-black text-blue-500/20 group-hover:text-blue-500/40 transition-colors">#{p.reg}</span>
                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 uppercase text-[10px]">{p.status}</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{p.nome}</h3>
                  <p className="text-[10px] text-blue-300/40 uppercase tracking-widest mb-6">{p.exames.length} exames pendentes</p>
                  
                  <Button 
                    onClick={() => setSelectedPatient(p)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-11 gap-2 shadow-lg shadow-blue-900/40"
                  >
                    Lançar Resultados
                  </Button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-right duration-500">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedPatient(null)}
              className="mb-6 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-xl gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para a Fila
            </Button>

            <div className="bg-blue-950/30 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedPatient.nome}</h2>
                  <p className="text-[10px] text-blue-300/40 uppercase tracking-widest">Registro #{selectedPatient.reg} • Lançamento de Valores</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-xl">
                  {selectedPatient.nome.charAt(0)}
                </div>
              </div>

              <div className="space-y-4">
                {selectedPatient.exames.map((exame: string) => (
                  <div 
                    key={exame} 
                    className={cn(
                      "p-6 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6",
                      results[exame]?.saved 
                        ? "bg-emerald-500/5 border-emerald-500/20" 
                        : "bg-blue-900/10 border-white/5"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl",
                        results[exame]?.saved ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-600/20 text-blue-400"
                      )}>
                        {results[exame]?.saved ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{exame}</p>
                        <p className="text-[10px] text-blue-300/40 uppercase">Referência: 70 - 99 mg/dL</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Input 
                          placeholder="Valor" 
                          className="bg-blue-950/50 border-white/10 w-32 h-11 rounded-xl text-center font-bold text-white"
                          value={results[exame]?.value || ''}
                          onChange={(e) => setResults((prev: any) => ({ ...prev, [exame]: { ...prev[exame], value: e.target.value } }))}
                        />
                      </div>
                      <Button 
                        onClick={() => handleSaveResult(exame)}
                        className={cn(
                          "h-11 px-6 rounded-xl gap-2 transition-all",
                          results[exame]?.saved 
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                            : "bg-blue-600 hover:bg-blue-500 text-white"
                        )}
                      >
                        {results[exame]?.saved ? <Edit3 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {results[exame]?.saved ? 'Editar' : 'Salvar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Results;
"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Printer, FileText, Download, User, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format, differenceInYears } from 'date-fns';

const Reports = () => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (search.length > 2) {
      const timer = setTimeout(() => searchPatients(), 500);
      return () => clearTimeout(timer);
    } else {
      setPatients([]);
    }
  }, [search]);

  const searchPatients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('patients')
      .select('*')
      .or(`full_name.ilike.%${search}%,cpf.ilike.%${search}%`)
      .limit(5);
    setPatients(data || []);
    setLoading(false);
  };

  const handleSelectPatient = async (patient: any) => {
    setSelectedPatient(patient);
    setPatients([]);
    setSearch('');
    
    const { data } = await supabase
      .from('services')
      .select(`
        *,
        service_exams (
          *,
          exams (name)
        )
      `)
      .eq('patient_id', patient.id)
      .eq('status', 'finalizado')
      .order('created_at', { ascending: false });
    
    setServices(data || []);
  };

  const generatePDF = async (service: any) => {
    setGenerating(true);
    try {
      const element = document.getElementById(`report-content-${service.id}`);
      if (!element) {
        throw new Error("Elemento do laudo não encontrado.");
      }

      // Pequeno delay para garantir renderização
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 794, // Largura aproximada de um A4 em pixels (96dpi)
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Ajusta a imagem para preencher a página A4
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Laudo_${selectedPatient.full_name.replace(/\s+/g, '_')}.pdf`);
      
      showSuccess('Laudo gerado com sucesso!');
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      showError('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

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

        <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm relative z-30">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-blue-300/30" />
            <Input 
              placeholder="Pesquisar por Nome ou CPF..." 
              className="bg-blue-900/20 border-blue-500/10 h-12 pl-12 rounded-2xl text-white placeholder:text-blue-300/20 font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {loading && <Loader2 className="absolute right-4 top-3.5 h-5 w-5 text-blue-400 animate-spin" />}
          </div>

          {patients.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-blue-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              {patients.map(p => (
                <button 
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className="w-full flex items-center justify-between p-4 hover:bg-blue-900/40 border-b border-white/5 last:border-none transition-all"
                >
                  <div className="text-left">
                    <p className="text-sm font-bold text-white uppercase">{p.full_name}</p>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">CPF: {p.cpf}</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedPatient && (
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-[2rem] p-6 flex items-center justify-between animate-in zoom-in duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Paciente Selecionado</p>
                <h3 className="text-lg font-bold text-white uppercase">{selectedPatient.full_name}</h3>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setSelectedPatient(null)} className="text-red-400 hover:bg-red-500/10 font-bold uppercase text-[10px]">Trocar</Button>
          </div>
        )}

        <div className="space-y-6">
          {services.length > 0 ? (
            services.map(service => (
              <div key={service.id} className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm group hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-white font-bold uppercase tracking-tight">Atendimento #{service.id.slice(0, 8)}</h3>
                    <p className="text-blue-300/40 text-[10px] font-black uppercase tracking-widest">Finalizado em {format(new Date(service.created_at), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                  <Button 
                    onClick={() => generatePDF(service)}
                    disabled={generating}
                    className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-bold uppercase text-[10px] px-6"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Baixar Laudo PDF</>}
                  </Button>
                </div>

                {/* Container do Laudo (Fora da tela mas visível para o html2canvas) */}
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                  <div 
                    id={`report-content-${service.id}`}
                    className="bg-white text-black p-0 relative"
                    style={{ width: '210mm', height: '297mm', overflow: 'hidden', fontFamily: '"Times New Roman", Times, serif' }}
                  >
                    {/* Timbre de Fundo */}
                    <img 
                      src="/src/assets/timbre.png" 
                      className="w-full h-full absolute top-0 left-0 object-fill z-0" 
                      alt="Timbre" 
                      crossOrigin="anonymous"
                    />
                    
                    {/* Logo no Canto Superior Direito */}
                    <img 
                      src="/src/assets/logo.png" 
                      className="absolute top-8 right-8 w-24 h-auto z-10 grayscale brightness-0 opacity-20" 
                      alt="Logo" 
                      crossOrigin="anonymous"
                    />

                    {/* Conteúdo do Laudo */}
                    <div className="relative z-10 px-[25mm] pt-[55mm] pb-[40mm]">
                      
                      {/* Cabeçalho do Paciente */}
                      <div className="border-b-2 border-black pb-4 mb-8 grid grid-cols-2 gap-y-2 text-[12pt]">
                        <div className="col-span-2"><strong>NOME:</strong> {selectedPatient.full_name.toUpperCase()}</div>
                        <div><strong>CPF:</strong> {selectedPatient.cpf}</div>
                        <div><strong>REGISTRO:</strong> #{service.id.slice(0, 8).toUpperCase()}</div>
                        <div><strong>DN:</strong> {format(new Date(selectedPatient.birth_date), "dd/MM/yyyy")}</div>
                        <div><strong>IDADE:</strong> {differenceInYears(new Date(), new Date(selectedPatient.birth_date))} ANOS</div>
                        <div><strong>DATA:</strong> {format(new Date(service.created_at), "dd/MM/yyyy")}</div>
                      </div>

                      {/* Exames */}
                      <div className="space-y-8">
                        {service.service_exams.map((se: any) => (
                          <div key={se.id} className="break-inside-avoid">
                            <h2 className="text-[14pt] font-bold border-b border-gray-300 mb-3 uppercase tracking-wide">{se.exams?.name}</h2>
                            <div className="whitespace-pre-wrap text-[12pt] leading-relaxed">
                              {/* Renderização do resultado */}
                              {se.result_value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.service_exams.map((se: any) => (
                    <div key={se.id} className="flex items-center gap-3 bg-blue-900/20 p-4 rounded-2xl border border-white/5">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <span className="text-[10px] font-black text-white uppercase tracking-tight">{se.exams?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : selectedPatient ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <FileText className="w-16 h-16 mb-4" />
              <p className="text-lg font-bold uppercase tracking-widest">Nenhum laudo finalizado para este paciente</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <User className="w-16 h-16 mb-4" />
              <p className="text-lg font-bold uppercase tracking-widest">Busque um paciente acima</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
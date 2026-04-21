"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Search,
  Printer,
  FileText,
  Download,
  User,
  Loader2,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format, differenceInYears } from "date-fns";

const Reports = () => {
  const [search, setSearch] = useState("");
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
      .from("patients")
      .select("*")
      .or(`full_name.ilike.%${search}%,cpf.ilike.%${search}%`)
      .limit(5);

    setPatients(data || []);
    setLoading(false);
  };

  const handleSelectPatient = async (patient: any) => {
    setSelectedPatient(patient);
    setPatients([]);
    setSearch("");

    const { data } = await supabase
      .from("services")
      .select(`
        *,
        service_exams (
          *,
          exams (name)
        )
      `)
      .eq("patient_id", patient.id)
      .eq("status", "finalizado")
      .order("created_at", { ascending: false });

    setServices(data || []);
  };

  // Função para ordenar exames logicamente (ex: Colesterol Total antes de Frações)
  const sortExams = (exams: any[]) => {
    const order = ["HEMOGRAMA", "GLICOSE", "COLESTEROL TOTAL", "COLESTEROL HDL", "COLESTEROL LDL", "TRIGLICERIDEOS", "UREIA", "CREATININA"];
    return [...exams].sort((a, b) => {
      const nameA = a.exams?.name.toUpperCase() || "";
      const nameB = b.exams?.name.toUpperCase() || "";
      
      const indexA = order.findIndex(item => nameA.includes(item));
      const indexB = order.findIndex(item => nameB.includes(item));
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return nameA.localeCompare(nameB);
    });
  };

  const generatePDF = async (service: any) => {
    setGenerating(true);
    try {
      const reportElement = document.getElementById(`report-container-${service.id}`);
      if (!reportElement) throw new Error("Elemento não encontrado");

      // Aguarda carregamento de imagens
      await new Promise(r => setTimeout(r, 800));

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        windowWidth: 794 // A4 width at 96dpi
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfImgHeight = (imgProps.height * pageWidth) / imgProps.width;

      let heightLeft = pdfImgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pageWidth, pdfImgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, pdfImgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Laudo_${selectedPatient.full_name.replace(/\s+/g, "_")}_${format(new Date(service.created_at), "ddMMyy")}.pdf`);
      showSuccess("Laudo gerado com sucesso!");
    } catch (err) {
      console.error(err);
      showError("Erro ao gerar PDF.");
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
          <p className="text-blue-300/50 text-sm mt-1 font-medium">Selecione o atendimento para gerar o documento oficial</p>
        </div>

        {/* BUSCA */}
        <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm relative z-30">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-blue-300/30" />
            <Input
              placeholder="Pesquisar paciente por Nome ou CPF..."
              className="bg-blue-900/20 border-blue-500/10 h-12 pl-12 rounded-2xl text-white font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {loading && <Loader2 className="absolute right-4 top-3.5 h-5 w-5 text-blue-400 animate-spin" />}
          </div>

          {patients.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-blue-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              {patients.map((p) => (
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

        {/* LISTA DE ATENDIMENTOS (CLEAN) */}
        <div className="grid grid-cols-1 gap-4">
          {services.map((service) => (
            <div key={service.id} className="bg-blue-950/30 border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/10 rounded-xl text-blue-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold uppercase text-sm">Atendimento de {format(new Date(service.created_at), "dd/MM/yyyy")}</h3>
                  <p className="text-blue-300/40 text-[10px] font-black uppercase tracking-widest">Registro: #{service.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              
              <Button 
                onClick={() => generatePDF(service)}
                disabled={generating}
                className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-bold uppercase text-[10px] px-6"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Gerar PDF</>}
              </Button>

              {/* ESTRUTURA DO LAUDO (FORA DA TELA) */}
              <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                <div id={`report-container-${service.id}`} style={{ width: "210mm", background: "#ffffff", color: "#000000" }}>
                  {/* Simulamos as páginas para o html2canvas capturar tudo de uma vez */}
                  {/* O jsPDF cuidará de quebrar as páginas a cada 297mm */}
                  <div style={{ padding: "0", position: "relative" }}>
                    
                    {/* Renderizamos o conteúdo de forma contínua, mas com o cabeçalho repetindo a cada 'página' visual */}
                    {/* Para simplificar e garantir precisão, vamos usar um layout que o html2canvas entenda bem */}
                    <div style={{ width: "100%", position: "relative" }}>
                      
                      {/* Cabeçalho e Timbre (Fixo no topo da primeira página, mas vamos repetir logicamente se necessário) */}
                      {/* Como o html2canvas captura o elemento inteiro, vamos organizar os exames e garantir que o cabeçalho do paciente esteja no topo */}
                      
                      <div style={{ padding: "20mm", paddingTop: "0" }}>
                        {/* Timbre */}
                        <img src="/src/assets/timbre.png" style={{ width: "100%", height: "42mm", objectFit: "cover", marginBottom: "0" }} />
                        
                        {/* Logo Canto Superior Direito */}
                        <img src="/src/assets/logo.png" style={{ position: "absolute", top: "10mm", right: "10mm", width: "35mm", filter: "grayscale(100%) brightness(0)" }} />

                        {/* Cabeçalho do Paciente (Justinho) */}
                        <div style={{ 
                          borderBottom: "1px solid black", 
                          padding: "2mm 0", 
                          marginBottom: "6mm", 
                          fontFamily: '"Times New Roman", serif', 
                          fontSize: "12pt",
                          lineHeight: "1.2"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div style={{ flex: 1 }}><strong>NOME:</strong> {selectedPatient.full_name.toUpperCase()}</div>
                            <div style={{ width: "60mm" }}><strong>REGISTRO:</strong> #{service.id.slice(0, 8).toUpperCase()}</div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1mm" }}>
                            <div style={{ flex: 1 }}><strong>CPF:</strong> {selectedPatient.cpf}</div>
                            <div style={{ width: "40mm" }}><strong>DN:</strong> {format(new Date(selectedPatient.birth_date), "dd/MM/yyyy")}</div>
                            <div style={{ width: "20mm" }}><strong>IDADE:</strong> {differenceInYears(new Date(), new Date(selectedPatient.birth_date))} ANOS</div>
                          </div>
                        </div>

                        {/* Exames */}
                        <div style={{ fontFamily: '"Times New Roman", serif' }}>
                          {sortExams(service.service_exams).map((se: any) => (
                            <div key={se.id} style={{ marginBottom: "8mm", pageBreakInside: "avoid" }}>
                              <div style={{ fontSize: "14pt", fontWeight: "bold", marginBottom: "3mm", textTransform: "uppercase", borderBottom: "0.5px solid #eee" }}>
                                {se.exams?.name}
                              </div>
                              <div style={{ fontSize: "12pt", whiteSpace: "pre-wrap", lineHeight: "1.4" }}>
                                {se.result_value?.split('\n').map((line: string, i: number) => {
                                  // Lógica para diminuir fonte de valores de referência
                                  const isRef = line.toLowerCase().includes("referência") || line.toLowerCase().includes("ref:") || line.toLowerCase().includes("valor:");
                                  return (
                                    <div key={i} style={{ fontSize: isRef ? "8.5pt" : "12pt", color: isRef ? "#444" : "#000" }}>
                                      {line}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {services.length === 0 && selectedPatient && (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <FileText className="w-16 h-16 mb-4" />
              <p className="text-lg font-bold uppercase tracking-widest">Nenhum laudo finalizado</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
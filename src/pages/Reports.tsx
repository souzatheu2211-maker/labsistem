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

  // Função para categorizar exames por setor
  const getSector = (examName: string) => {
    const name = examName.toUpperCase();
    if (name.includes("HEMOGRAMA") || name.includes("SANGUE") || name.includes("ERITRO") || name.includes("LEUCO")) return "HEMATOLOGIA";
    if (name.includes("GLICOSE") || name.includes("COLESTEROL") || name.includes("TRIGLI") || name.includes("UREIA") || name.includes("CREATININA") || name.includes("TGO") || name.includes("TGP")) return "BIOQUÍMICA";
    if (name.includes("URINA") || name.includes("EAS")) return "URINÁLISE";
    if (name.includes("FEZES") || name.includes("PARASITO")) return "PARASITOLOGIA";
    if (name.includes("PSA") || name.includes("BETA") || name.includes("TSH") || name.includes("T4")) return "IMUNOLOGIA / HORMÔNIOS";
    return "OUTROS";
  };

  const generatePDF = async (service: any) => {
    setGenerating(true);
    try {
      const reportElement = document.getElementById(`report-container-${service.id}`);
      if (!reportElement) throw new Error("Elemento não encontrado");

      // Aguarda carregamento de imagens
      await new Promise(r => setTimeout(r, 1000));

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

      // Adiciona a primeira página
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, pdfImgHeight);
      heightLeft -= pageHeight;

      // Adiciona páginas extras se necessário
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

  // Agrupar exames por setor para renderização
  const groupedExams = (exams: any[]) => {
    const groups: { [key: string]: any[] } = {};
    exams.forEach(se => {
      const sector = getSector(se.exams?.name || "");
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(se);
    });
    return groups;
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

        {/* LISTA DE ATENDIMENTOS */}
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
                  <div style={{ width: "100%", position: "relative" }}>
                    
                    {/* Timbre de Fundo (Repetido logicamente se necessário, mas aqui renderizamos um bloco contínuo) */}
                    {/* Para garantir que o timbre apareça em todas as páginas, vamos renderizar o conteúdo em blocos de 297mm */}
                    
                    <div style={{ padding: "0", position: "relative" }}>
                      {/* Timbre Background */}
                      <img src="/src/assets/timbre.png" style={{ width: "100%", height: "auto", display: "block" }} />
                      
                      {/* Conteúdo sobreposto ao timbre */}
                      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", padding: "0 20mm" }}>
                        
                        {/* Cabeçalho do Paciente (Justinho abaixo da linha do timbre) */}
                        <div style={{ 
                          marginTop: "33mm", // Ajuste preciso para ficar abaixo da linha do timbre
                          padding: "1mm 0", 
                          fontFamily: '"Times New Roman", serif', 
                          fontSize: "11pt",
                          lineHeight: "1.2",
                          display: "flex",
                          flexDirection: "column",
                          gap: "1px"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div style={{ flex: 1 }}><strong>NOME:</strong> {selectedPatient.full_name.toUpperCase()}</div>
                            <div style={{ width: "60mm" }}><strong>REGISTRO:</strong> #{service.id.slice(0, 8).toUpperCase()}</div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div style={{ flex: 1 }}><strong>CPF:</strong> {selectedPatient.cpf}</div>
                            <div style={{ width: "40mm" }}><strong>DN:</strong> {format(new Date(selectedPatient.birth_date), "dd/MM/yyyy")}</div>
                            <div style={{ width: "20mm" }}><strong>IDADE:</strong> {differenceInYears(new Date(), new Date(selectedPatient.birth_date))} ANOS</div>
                          </div>
                        </div>

                        {/* Exames por Setor */}
                        <div style={{ marginTop: "8mm", fontFamily: '"Times New Roman", serif' }}>
                          {Object.entries(groupedExams(service.service_exams)).map(([sector, exams]) => (
                            <div key={sector} style={{ marginBottom: "10mm", pageBreakInside: "avoid" }}>
                              <div style={{ 
                                fontSize: "10pt", 
                                fontWeight: "bold", 
                                textAlign: "center", 
                                textDecoration: "underline", 
                                marginBottom: "4mm",
                                textTransform: "uppercase"
                              }}>
                                {sector}
                              </div>
                              
                              {exams.map((se: any) => (
                                <div key={se.id} style={{ marginBottom: "6mm", pageBreakInside: "avoid" }}>
                                  <div style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "2mm", textTransform: "uppercase" }}>
                                    {se.exams?.name}
                                  </div>
                                  <div style={{ fontSize: "11pt", whiteSpace: "pre-wrap", lineHeight: "1.3" }}>
                                    {se.result_value?.split('\n').map((line: string, i: number) => {
                                      const isRef = line.toLowerCase().includes("referência") || line.toLowerCase().includes("ref:") || line.toLowerCase().includes("valor:");
                                      return (
                                        <div key={i} style={{ fontSize: isRef ? "8pt" : "11pt", color: isRef ? "#444" : "#000" }}>
                                          {line}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
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
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
  CheckCircle2
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
      .select(
        `
        *,
        service_exams (
          *,
          exams (name)
        )
      `
      )
      .eq("patient_id", patient.id)
      .eq("status", "finalizado")
      .order("created_at", { ascending: false });

    setServices(data || []);
  };

  const generatePDF = async (service: any) => {
    setGenerating(true);

    try {
      const element = document.getElementById(
        `report-content-${service.id}`
      );

      if (!element) throw new Error("Laudo não encontrado");

      // Aguarda um pouco para garantir que as imagens (timbre/logo) carreguem
      await new Promise((r) => setTimeout(r, 500));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        windowWidth: 794 // Largura aproximada de um A4 em pixels (96dpi)
      });

      const imgData = canvas.toDataURL("image/png");

      // Criar PDF A4
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
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, pdfImgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(
        `Laudo_${selectedPatient.full_name.replace(/\s+/g, "_")}.pdf`
      );

      showSuccess("Laudo gerado com sucesso!");
    } catch (err) {
      console.error(err);
      showError("Erro ao gerar PDF. Verifique se o timbre carregou corretamente.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
              <Printer className="w-6 h-6 text-blue-400" />
              Impressão de Laudos
            </h1>
            <p className="text-blue-300/50 text-sm mt-1 font-medium">
              Gere PDFs profissionais com timbre e formatação oficial
            </p>
          </div>
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
            {loading && (
              <Loader2 className="absolute right-4 top-3.5 h-5 w-5 text-blue-400 animate-spin" />
            )}
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
                    <p className="text-sm font-bold text-white uppercase">
                      {p.full_name}
                    </p>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                      CPF: {p.cpf}
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PACIENTE SELECIONADO */}
        {selectedPatient && (
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-[2rem] p-6 flex items-center justify-between animate-in zoom-in duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black text-blue-400 uppercase tracking-widest">
                  Paciente Selecionado
                </p>
                <h3 className="text-lg font-bold text-white uppercase">
                  {selectedPatient.full_name}
                </h3>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => setSelectedPatient(null)}
              className="text-red-400 hover:bg-red-500/10 font-bold uppercase text-[10px]"
            >
              Trocar
            </Button>
          </div>
        )}

        {/* LISTA DE ATENDIMENTOS */}
        <div className="space-y-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm group hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white font-bold uppercase tracking-tight">
                    Atendimento #{service.id.slice(0, 8)}
                  </h3>
                  <p className="text-blue-300/40 text-[10px] font-black uppercase tracking-widest">
                    Finalizado em{" "}
                    {format(new Date(service.created_at), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>

                <Button
                  onClick={() => generatePDF(service)}
                  disabled={generating}
                  className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-bold uppercase text-[10px] px-6"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Gerar PDF Oficial
                    </>
                  )}
                </Button>
              </div>

              {/* CONTEÚDO DO LAUDO (FORA DA TELA PARA O HTML2CANVAS) */}
              <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                <div
                  id={`report-content-${service.id}`}
                  style={{
                    width: "210mm",
                    minHeight: "297mm",
                    background: "#ffffff",
                    color: "#000000",
                    fontFamily: '"Times New Roman", Times, serif',
                    fontSize: "12pt",
                    position: "relative",
                    padding: "20mm",
                    boxSizing: "border-box"
                  }}
                >
                  {/* TIMBRE (CABEÇALHO E RODAPÉ) */}
                  <img
                    src="/src/assets/timbre.png"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "42mm", // Ajuste conforme o tamanho real do cabeçalho do seu timbre
                      objectFit: "cover"
                    }}
                  />
                  
                  {/* LOGO NO CANTO SUPERIOR DIREITO */}
                  <img 
                    src="/src/assets/logo.png" 
                    style={{
                      position: "absolute",
                      top: "10mm",
                      right: "10mm",
                      width: "35mm",
                      height: "auto",
                      filter: "grayscale(100%) brightness(0)"
                    }}
                  />

                  {/* CABEÇALHO DO PACIENTE (CLEAN) */}
                  <div
                    style={{
                      marginTop: "42mm", // Começa após o cabeçalho do timbre
                      borderBottom: "1px solid black",
                      paddingBottom: "4mm",
                      marginBottom: "8mm",
                      fontSize: "12pt",
                      lineHeight: "1.4"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ flex: 1 }}>
                        <strong>NOME:</strong> {selectedPatient.full_name.toUpperCase()}
                      </div>
                      <div style={{ width: "60mm" }}>
                        <strong>REGISTRO:</strong> #{service.id.slice(0, 8).toUpperCase()}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2mm" }}>
                      <div style={{ flex: 1 }}>
                        <strong>CPF:</strong> {selectedPatient.cpf}
                      </div>
                      <div style={{ width: "40mm" }}>
                        <strong>DN:</strong> {format(new Date(selectedPatient.birth_date), "dd/MM/yyyy")}
                      </div>
                      <div style={{ width: "20mm" }}>
                        <strong>IDADE:</strong> {differenceInYears(new Date(), new Date(selectedPatient.birth_date))} ANOS
                      </div>
                    </div>
                  </div>

                  {/* EXAMES ORDENADOS POR NOME (OU SETOR SE TIVERMOS ESSA INFO) */}
                  <div style={{ marginTop: "8mm" }}>
                    {[...service.service_exams]
                      .sort((a, b) => (a.exams?.name || "").localeCompare(b.exams?.name || ""))
                      .map((se: any) => (
                        <div
                          key={se.id}
                          style={{
                            marginBottom: "10mm",
                            pageBreakInside: "avoid"
                          }}
                        >
                          <div
                            style={{
                              fontSize: "14pt",
                              fontWeight: "bold",
                              borderBottom: "1px solid #eeeeee",
                              marginBottom: "4mm",
                              paddingBottom: "1mm",
                              textTransform: "uppercase"
                            }}
                          >
                            {se.exams?.name}
                          </div>

                          <div
                            style={{
                              fontSize: "12pt",
                              whiteSpace: "pre-wrap",
                              lineHeight: "1.5",
                              color: "#333333"
                            }}
                          >
                            {/* O conteúdo do laudo já vem com os valores substituídos */}
                            {se.result_value}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* RESUMO DOS EXAMES NA TELA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {service.service_exams.map((se: any) => (
                  <div
                    key={se.id}
                    className="flex items-center gap-3 bg-blue-900/20 p-4 rounded-2xl border border-white/5"
                  >
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-tight">
                      {se.exams?.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {services.length === 0 && selectedPatient && (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <FileText className="w-16 h-16 mb-4" />
              <p className="text-lg font-bold uppercase tracking-widest">
                Nenhum laudo finalizado para este paciente
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
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

  const sectorOrder = ["HEMATOLOGIA", "BIOQUÍMICA", "IMUNOLOGIA / HORMÔNIOS", "URINÁLISE", "PARASITOLOGIA", "OUTROS"];
  const bioOrder = ["GLICOSE", "UREIA", "CREATININA", "COLESTEROL TOTAL", "COLESTEROL HDL", "COLESTEROL LDL", "COLESTEROL VLDL", "TRIGLICERÍDEOS"];

  const getSector = (examName: string) => {
    const name = examName.toUpperCase();
    if (name.includes("HEMOGRAMA") || name.includes("SANGUE") || name.includes("ERITRO") || name.includes("LEUCO")) return "HEMATOLOGIA";
    if (name.includes("GLICOSE") || name.includes("COLESTEROL") || name.includes("TRIGLI") || name.includes("UREIA") || name.includes("CREATININA") || name.includes("TGO") || name.includes("TGP")) return "BIOQUÍMICA";
    if (name.includes("URINA") || name.includes("EAS")) return "URINÁLISE";
    if (name.includes("FEZES") || name.includes("PARASITO")) return "PARASITOLOGIA";
    if (name.includes("PSA") || name.includes("BETA") || name.includes("TSH") || name.includes("T4")) return "IMUNOLOGIA / HORMÔNIOS";
    return "OUTROS";
  };

  const sortExamsInSector = (sector: string, exams: any[]) => {
    if (sector === "BIOQUÍMICA") {
      return [...exams].sort((a, b) => {
        const nameA = a.exams?.name.toUpperCase() || "";
        const nameB = b.exams?.name.toUpperCase() || "";
        const idxA = bioOrder.findIndex(item => nameA.includes(item));
        const idxB = bioOrder.findIndex(item => nameB.includes(item));
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return nameA.localeCompare(nameB);
      });
    }
    return [...exams].sort((a, b) => (a.exams?.name || "").localeCompare(b.exams?.name || ""));
  };

  const generatePDF = async (service: any) => {
    setGenerating(true);
    try {
      const timbreElement = document.getElementById(`timbre-template`);
      const headerElement = document.getElementById(`header-template-${service.id}`);
      const contentElement = document.getElementById(`content-template-${service.id}`);
      
      if (!timbreElement || !headerElement || !contentElement) throw new Error("Elementos não encontrados");

      await new Promise(r => setTimeout(r, 1000));

      const timbreCanvas = await html2canvas(timbreElement, { scale: 2, useCORS: true });
      const timbreImg = timbreCanvas.toDataURL("image/png");

      const headerCanvas = await html2canvas(headerElement, { scale: 2, useCORS: true, backgroundColor: null });
      const headerImg = headerCanvas.toDataURL("image/png");

      const contentCanvas = await html2canvas(contentElement, { scale: 2, useCORS: true, backgroundColor: null });
      const contentImg = contentCanvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const contentProps = pdf.getImageProperties(contentImg);
      const contentPdfWidth = pageWidth - 40;
      const contentPdfHeight = (contentProps.height * contentPdfWidth) / contentProps.width;

      const headerProps = pdf.getImageProperties(headerImg);
      const headerPdfHeight = (headerProps.height * contentPdfWidth) / headerProps.width;

      const availableHeight = pageHeight - 42 - headerPdfHeight - 35; 
      
      let heightLeft = contentPdfHeight;
      let position = 0;

      while (heightLeft > 0) {
        pdf.addImage(timbreImg, "PNG", 0, 0, pageWidth, pageHeight);
        pdf.addImage(headerImg, "PNG", 20, 42, contentPdfWidth, headerPdfHeight);
        
        pdf.addImage(
          contentImg, 
          "PNG", 
          20, 
          42 + headerPdfHeight + 2,
          contentPdfWidth, 
          Math.min(availableHeight, heightLeft),
          undefined,
          'FAST',
          0
        );
        
        heightLeft -= availableHeight;
        if (heightLeft > 0) {
          pdf.addPage();
          position += availableHeight;
        }
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

  const groupedExams = (exams: any[]) => {
    const groups: { [key: string]: any[] } = {};
    exams.forEach(se => {
      const sector = getSector(se.exams?.name || "");
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(se);
    });
    
    const sortedGroups: { [key: string]: any[] } = {};
    sectorOrder.forEach(sector => {
      if (groups[sector]) {
        sortedGroups[sector] = sortExamsInSector(sector, groups[sector]);
      }
    });
    
    Object.keys(groups).forEach(sector => {
      if (!sortedGroups[sector]) {
        sortedGroups[sector] = sortExamsInSector(sector, groups[sector]);
      }
    });

    return sortedGroups;
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

              <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                <div id="timbre-template" style={{ width: "210mm", height: "297mm", background: "#ffffff" }}>
                  <img src="/src/assets/timbre.png" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>

                <div id={`header-template-${service.id}`} style={{ width: "170mm", padding: "2mm 0", fontFamily: '"Times New Roman", serif' }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10pt", marginBottom: "1mm" }}>
                    <div style={{ flex: 1 }}><strong>NOME:</strong> {selectedPatient.full_name.toUpperCase()}</div>
                    <div style={{ width: "50mm", textAlign: "right" }}><strong>REGISTRO:</strong> #{service.id.slice(0, 8).toUpperCase()}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-start", gap: "10mm", fontSize: "9pt" }}>
                    <div><strong>CPF:</strong> {selectedPatient.cpf}</div>
                    <div><strong>IDADE:</strong> {differenceInYears(new Date(), new Date(selectedPatient.birth_date))} ANOS</div>
                    <div><strong>DN:</strong> {format(new Date(selectedPatient.birth_date), "dd/MM/yyyy")}</div>
                  </div>
                </div>

                <div id={`content-template-${service.id}`} style={{ width: "170mm", fontFamily: '"Times New Roman", serif' }}>
                  {Object.entries(groupedExams(service.service_exams)).map(([sector, exams]) => (
                    <div key={sector} style={{ marginBottom: "6mm" }}>
                      {sector !== "OUTROS" && (
                        <div style={{ 
                          fontSize: "9pt", 
                          fontWeight: "bold", 
                          textAlign: "center", 
                          textDecoration: "underline", 
                          marginBottom: "3mm",
                          textTransform: "uppercase"
                        }}>
                          {sector}
                        </div>
                      )}
                      
                      {exams.map((se: any) => (
                        <div key={se.id} style={{ marginBottom: "5mm" }}>
                          <div style={{ fontSize: "10pt", fontWeight: "bold", marginBottom: "1mm", textTransform: "uppercase" }}>
                            {se.exams?.name}
                          </div>
                          <div style={{ fontSize: "9pt", whiteSpace: "pre-wrap", lineHeight: "1.2" }}>
                            {se.result_value?.split('\n').map((line: string, i: number) => {
                              const isRef = line.toLowerCase().includes("referência") || line.toLowerCase().includes("ref:") || line.toLowerCase().includes("valor:") || line.toLowerCase().includes("vr:");
                              return (
                                <div key={i} style={{ fontSize: isRef ? "7pt" : "9pt", color: isRef ? "#555" : "#000", marginTop: isRef ? "0.5mm" : "0" }}>
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
"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Search,
  Printer,
  FileText,
  User,
  Loader2,
  CheckCircle2,
  Calendar,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { format, differenceInYears } from "date-fns";
import { cn } from "@/lib/utils";

const Reports = () => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [activeService, setActiveService] = useState<any>(null);

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

  // Ordem Clínica Real (Padrão Laboratorial)
  const sectorOrder = ["HEMATOLOGIA", "BIOQUÍMICA", "IMUNOLOGIA / HORMÔNIOS", "URINÁLISE", "PARASITOLOGIA", "OUTROS"];
  
  const bioOrder = [
    "GLICOSE", "GLICEMIA", 
    "UREIA", "CREATININA", // Renal
    "COLESTEROL TOTAL", "COLESTEROL HDL", "COLESTEROL LDL", "COLESTEROL VLDL", "TRIGLICERÍDEOS", // Lipidograma
    "TGO", "TGP", "GAMA GT", "FOSFATASE ALCALINA", "BILIRRUBINAS" // Hepática
  ];

  const getSector = (examName: string) => {
    const name = examName.toUpperCase();
    if (name.includes("HEMOGRAMA") || name.includes("SANGUE") || name.includes("ERITRO") || name.includes("LEUCO")) return "HEMATOLOGIA";
    if (name.includes("GLICOSE") || name.includes("GLICEMIA") || name.includes("COLESTEROL") || name.includes("TRIGLI") || name.includes("UREIA") || name.includes("CREATININA") || name.includes("TGO") || name.includes("TGP")) return "BIOQUÍMICA";
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
    
    return sortedGroups;
  };

  const handlePrint = (service: any) => {
    setActiveService(service);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <DashboardLayout>
      {/* Estilos de Impressão Injetados */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            display: block !important;
            width: 210mm;
            margin: 0 auto;
            background: white;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          .page-header-space {
            height: 65mm; /* Espaço para timbre + cabeçalho paciente */
          }
          .page-footer-space {
            height: 30mm; /* Espaço para o rodapé do timbre */
          }
          .fixed-header {
            position: fixed;
            top: 0;
            left: 0;
            width: 210mm;
            z-index: 1000;
          }
          .fixed-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 210mm;
            z-index: 1000;
          }
          .exam-block {
            page-break-inside: avoid;
            margin-bottom: 8mm;
          }
          .sector-title {
            page-break-after: avoid;
          }
        }
        .print-container {
          display: none;
        }
      `}} />

      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700 no-print">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
              <Printer className="w-6 h-6 text-blue-400" />
              Impressão de Laudos
            </h1>
            <p className="text-blue-300/50 text-sm mt-1 font-medium">Geração de documentos oficiais em padrão laboratorial</p>
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
                onClick={() => handlePrint(service)}
                className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-bold uppercase text-[10px] px-6"
              >
                <Printer className="w-4 h-4" /> Imprimir Laudo
              </Button>
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

      {/* ÁREA DE IMPRESSÃO (RENDERIZADA APENAS NO PRINT) */}
      {activeService && (
        <div className="print-container">
          {/* Cabeçalho Fixo (Timbre + Dados Paciente) */}
          <div className="fixed-header">
            <img src="/src/assets/timbre.png" className="w-full h-auto" alt="Timbre" />
            <div style={{ 
              padding: "0 20mm", 
              marginTop: "-45mm", // Ajuste para sobrepor ao timbre se necessário, ou use margem positiva
              position: "relative",
              top: "45mm" // Posiciona exatamente abaixo da linha do timbre
            }}>
              <div style={{ 
                fontFamily: '"Times New Roman", serif', 
                fontSize: "11pt", 
                lineHeight: "1.4",
                borderBottom: "1px solid #eee",
                paddingBottom: "4mm",
                marginBottom: "5mm"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1mm" }}>
                  <div style={{ flex: 1 }}><strong>NOME:</strong> {selectedPatient.full_name.toUpperCase()}</div>
                  <div style={{ width: "60mm", textAlign: "right" }}><strong>REGISTRO:</strong> #{activeService.id.slice(0, 8).toUpperCase()}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-start", gap: "12mm" }}>
                  <div><strong>CPF:</strong> {selectedPatient.cpf}</div>
                  <div><strong>IDADE:</strong> {differenceInYears(new Date(), new Date(selectedPatient.birth_date))} ANOS</div>
                  <div><strong>DN:</strong> {format(new Date(selectedPatient.birth_date), "dd/MM/yyyy")}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé Fixo (Opcional, se o timbre tiver rodapé) */}
          <div className="fixed-footer">
            {/* Se o timbre.png já incluir o rodapé, não precisa de nada aqui */}
          </div>

          {/* Tabela de Conteúdo (Garante a repetição do thead) */}
          <table>
            <thead>
              <tr>
                <td>
                  <div className="page-header-space"></div>
                </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style={{ padding: "0 20mm", fontFamily: '"Times New Roman", serif', color: "#000" }}>
                    {Object.entries(groupedExams(activeService.service_exams)).map(([sector, exams]) => (
                      <div key={sector} className="sector-block">
                        {sector !== "OUTROS" && (
                          <div className="sector-title" style={{ 
                            fontSize: "11pt", 
                            fontWeight: "bold", 
                            textAlign: "center", 
                            textDecoration: "underline", 
                            margin: "6mm 0 4mm 0",
                            textTransform: "uppercase"
                          }}>
                            {sector}
                          </div>
                        )}
                        
                        {exams.map((se: any) => (
                          <div key={se.id} className="exam-block">
                            <div style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "2mm", textTransform: "uppercase" }}>
                              {se.exams?.name}
                            </div>
                            <div style={{ fontSize: "12pt", whiteSpace: "pre-wrap", lineHeight: "1.4" }}>
                              {se.result_value?.split('\n').map((line: string, i: number) => {
                                const isRef = line.toLowerCase().includes("referência") || 
                                              line.toLowerCase().includes("ref:") || 
                                              line.toLowerCase().includes("valor:") || 
                                              line.toLowerCase().includes("vr:");
                                return (
                                  <div key={i} style={{ 
                                    fontSize: isRef ? "8.5pt" : "12pt", 
                                    color: isRef ? "#555" : "#000", 
                                    marginTop: isRef ? "1mm" : "0",
                                    fontStyle: isRef ? "italic" : "normal"
                                  }}>
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
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>
                  <div className="page-footer-space"></div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Reports;
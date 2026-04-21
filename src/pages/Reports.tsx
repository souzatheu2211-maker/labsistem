"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Search,
  FileText,
  User,
  Loader2,
  CheckCircle2,
  Calendar,
  Download,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format, parseISO } from "date-fns";
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFDownloadLink, 
  Image
} from "@react-pdf/renderer";

const formatSafeDate = (dateStr: string) => {
  if (!dateStr) return "";
  if (dateStr.length === 10) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return format(new Date(year, month - 1, day), "dd/MM/yyyy");
  }
  return format(parseISO(dateStr), "dd/MM/yyyy");
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 170,    
    paddingBottom: 80,  
    paddingHorizontal: 50,
    fontFamily: 'Times-Roman',
    backgroundColor: '#ffffff',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patientInfoFixed: {
    position: 'absolute',
    top: 115, 
    left: 50,
    right: 50,
    paddingBottom: 10,
  },
  patientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 12, 
    fontFamily: 'Times-Bold',
  },
  value: {
    fontSize: 12, 
    fontFamily: 'Times-Roman',
  },
  sectorTitle: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    textDecoration: 'underline',
    marginTop: 15,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  examBlock: {
    marginBottom: 15, 
  },
  examName: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  resultText: {
    fontSize: 11,
    fontFamily: 'Times-Roman',
    lineHeight: 1.2,
    color: '#000000',
  },
  referenceText: {
    fontSize: 9,
    fontFamily: 'Times-Roman',
    color: '#333333',
    marginTop: 1,
    lineHeight: 1.2,
  }
});

const formatFinalReport = (text: string) => {
  if (!text) return [];
  const lines = text.split('\n');
  const cleanedLines: string[] = [];
  let skipMode = false;

  const units = ['mg/dl', 'u/l', 'g/dl', 'mm/h', 'pg', 'fl', 'mcg/dl', 'ng/ml', 'mui/l', 'meq/l', 'mmol/l', '%', 'mil/mm', 'por/mm'];
  const resultKeywords = ['reagente', 'positivo', 'negativo', 'ausência', 'presença', 'não reagente', 'normal', 'alterada'];

  for (let line of lines) {
    let rawLine = line.trim();
    
    // Se a linha for vazia, mantém apenas se não estivermos em skipMode
    if (!rawLine) {
      if (!skipMode) cleanedLines.push("");
      continue;
    }

    // Detectar se é uma linha de resultado (tem : ou ____)
    const isResultLine = rawLine.includes(':') || rawLine.includes('____');
    
    if (isResultLine) {
      // Limpar o marcador
      let processed = rawLine.replace(/____/g, '').trim();
      
      // Verificar se tem valor real (número ou palavra-chave)
      const hasValue = /[0-9]/.test(processed) || resultKeywords.some(k => processed.toLowerCase().includes(k));
      
      // Se a linha termina com unidade mas não tem número, é considerada vazia
      const hasUnitOnly = units.some(u => processed.toLowerCase().endsWith(u)) && !hasValue;

      if (!hasValue || hasUnitOnly) {
        skipMode = true; // Entra no modo de pular referências deste resultado
        continue;
      } else {
        skipMode = false;
        cleanedLines.push(processed.replace(/\s{2,}/g, ' '));
      }
    } else {
      // É uma linha de referência ou cabeçalho
      if (skipMode) continue; // Pula se o resultado anterior estava vazio
      
      // Se for uma linha de "Valor de Referência" ou similar, e não estamos pulando, mantém
      cleanedLines.push(rawLine.replace(/\s{2,}/g, ' '));
    }
  }

  // Remove linhas vazias duplicadas no final
  return cleanedLines.filter((line, index) => !(line === "" && cleanedLines[index - 1] === ""));
};

const LabReportPDF = ({ service, patient }: { service: any, patient: any }) => {
  const sectorOrder = ["HEMATOLOGIA", "BIOQUÍMICA", "IMUNOLOGIA / HORMÔNIOS", "URINÁLISE", "PARASITOLOGIA"];
  
  const getSector = (examName: string) => {
    const name = examName.toUpperCase();
    if (name.includes("HEMOGRAMA") || name.includes("SANGUE")) return "HEMATOLOGIA";
    if (name.includes("GLICOSE") || name.includes("GLICEMIA") || name.includes("COLESTEROL") || name.includes("TRIGLI") || name.includes("UREIA") || name.includes("CREATININA") || name.includes("TGO") || name.includes("TGP") || name.includes("HBA1C") || name.includes("GLICADA")) return "BIOQUÍMICA";
    if (name.includes("URINA") || name.includes("EAS")) return "URINÁLISE";
    if (name.includes("FEZES") || name.includes("PARASITO")) return "PARASITOLOGIA";
    if (name.includes("PSA") || name.includes("BETA") || name.includes("TSH") || name.includes("T4")) return "IMUNOLOGIA / HORMÔNIOS";
    return "HEMATOLOGIA";
  };

  const groups: { [key: string]: any[] } = {};
  service.service_exams.forEach((se: any) => {
    const sector = getSector(se.exams?.name || "");
    if (!groups[sector]) groups[sector] = [];
    groups[sector].push(se);
  });

  const timbreUrl = `${window.location.origin}/src/assets/timbre.png`;

  return (
    <Document title={`Laudo - ${patient.full_name}`}>
      <Page size="A4" style={styles.page}>
        <Image src={timbreUrl} style={styles.background} fixed />

        <View style={styles.patientInfoFixed} fixed>
          <View style={styles.patientRow}>
            <Text style={styles.label}>PACIENTE: <Text style={styles.value}>{patient.full_name.toUpperCase()}</Text></Text>
            <Text style={styles.label}>REGISTRO: <Text style={styles.value}>#{service.id.slice(0, 8).toUpperCase()}</Text></Text>
          </View>
          <View style={styles.patientRow}>
            <Text style={styles.label}>CPF: <Text style={styles.value}>{patient.cpf}</Text></Text>
            <Text style={styles.label}>DN: <Text style={styles.value}>{formatSafeDate(patient.birth_date)}</Text></Text>
            <Text style={styles.label}>DATA: <Text style={styles.value}>{formatSafeDate(service.created_at)}</Text></Text>
          </View>
        </View>

        {sectorOrder.map(sector => {
          if (!groups[sector]) return null;
          
          const sectorContent = groups[sector].map((se: any) => {
            const lines = formatFinalReport(se.result_value || "");
            if (lines.length === 0) return null;
            return (
              <View key={se.id} style={styles.examBlock} wrap={false}>
                <Text style={styles.examName}>{se.exams?.name}</Text>
                {lines.map((line: string, i: number) => {
                  if (line === "") return <Text key={i} style={{ height: 11 }}> </Text>;
                  const isRef = line.toLowerCase().includes("referência") || line.toLowerCase().includes("ref:") || line.toLowerCase().includes("valor:") || line.toLowerCase().includes("vr:") || line.toLowerCase().includes("normal") || line.toLowerCase().includes("desejável");
                  return <Text key={i} style={isRef ? styles.referenceText : styles.resultText}>{line}</Text>;
                })}
              </View>
            );
          }).filter(Boolean);

          if (sectorContent.length === 0) return null;

          return (
            <View key={sector} wrap={false}>
              <Text style={styles.sectorTitle}>{sector}</Text>
              {sectorContent}
            </View>
          );
        })}
      </Page>
    </Document>
  );
};

const Reports = () => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);

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
      .select(`*, service_exams (*, exams (name))`)
      .eq("patient_id", patient.id)
      .eq("status", "finalizado")
      .order("created_at", { ascending: false });
    setServices(data || []);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
            <Printer className="w-6 h-6 text-blue-400" />
            Impressão de Laudos
          </h1>
          <p className="text-blue-300/50 text-sm mt-1 font-medium">Busque pacientes e gere PDFs oficiais</p>
        </div>

        <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm relative z-30">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-blue-300/30" />
            <Input
              placeholder="Buscar por Nome ou CPF..."
              className="bg-blue-900/20 border-blue-500/10 h-12 pl-12 rounded-2xl text-white font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {loading && <Loader2 className="absolute right-4 top-3.5 h-5 w-5 text-blue-400 animate-spin" />}
          </div>
          {patients.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-blue-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              {patients.map((p) => (
                <button key={p.id} onClick={() => handleSelectPatient(p)} className="w-full flex items-center justify-between p-4 hover:bg-blue-900/40 border-b border-white/5 last:border-none transition-all">
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
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white"><User className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Paciente Selecionado</p>
                <h3 className="text-lg font-bold text-white uppercase">{selectedPatient.full_name}</h3>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setSelectedPatient(null)} className="text-red-400 hover:bg-red-500/10 font-bold uppercase text-[10px]">Trocar Paciente</Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {services.map((service) => (
            <div key={service.id} className="bg-blue-950/30 border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/10 rounded-xl text-blue-400"><Calendar className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-white font-bold uppercase text-sm">Atendimento de {formatSafeDate(service.created_at)}</h3>
                  <p className="text-blue-300/40 text-[10px] font-black uppercase tracking-widest">Registro: #{service.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <PDFDownloadLink document={<LabReportPDF service={service} patient={selectedPatient} />} fileName={`Laudo_${selectedPatient.full_name.replace(/\s+/g, "_")}.pdf`}>
                {({ loading: pdfLoading }) => (
                  <Button className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-bold uppercase text-[10px] px-8 h-11 shadow-lg shadow-blue-900/20" disabled={pdfLoading}>
                    {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Baixar PDF</>}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
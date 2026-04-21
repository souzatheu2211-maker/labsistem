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

// Função para formatar data sem erro de fuso horário (UTC para Local)
const formatSafeDate = (dateStr: string) => {
  if (!dateStr) return "";
  if (dateStr.length === 10) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return format(new Date(year, month - 1, day), "dd/MM/yyyy");
  }
  return format(parseISO(dateStr), "dd/MM/yyyy");
};

// Configuração de Estilos para o PDF (A4) usando Times-Roman
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

/**
 * MOTOR DE FORMATAÇÃO DE LAUDO
 * Aplica as regras de limpeza profunda e substituição de placeholders
 */
const formatFinalReport = (text: string) => {
  if (!text) return [];

  return text.split('\n').map(line => {
    // 1. Remover placeholders (?) e (&)
    let cleaned = line.replace(/\(\s*[?&]\s*\)/g, '').trim();
    
    // 2. Remover lixo visual comum (sequências de underscores, interrogações, etc)
    cleaned = cleaned.replace(/_{2,}/g, '');
    cleaned = cleaned.replace(/\?{2,}/g, '');
    
    // 3. Remover espaços duplicados
    cleaned = cleaned.replace(/\s{2,}/g, ' ');

    // 4. Regra de Símbolos Soltos: Se a linha contém apenas unidades ou labels sem valor real
    // Ex: "Glicose: mg/dl" -> vira apenas "Glicose:" ou é removida se for irrelevante
    const units = ['mg/dl', 'U/L', 'g/dL', 'mm/h', 'pg', 'fL', 'mcg/dL', 'ng/mL', 'mUI/L'];
    const hasUnit = units.some(u => cleaned.toLowerCase().includes(u.toLowerCase()));
    
    // Se a linha tem unidade mas não tem números ou palavras de resultado (como 'reagente'), limpamos a unidade
    const hasValue = /[0-9]/.test(cleaned) || /reagente|positivo|negativo|ausência|presença/i.test(cleaned);
    
    if (hasUnit && !hasValue) {
      units.forEach(u => {
        const reg = new RegExp(`\\s*${u.replace('/', '\\/')}`, 'gi');
        cleaned = cleaned.replace(reg, '');
      });
    }

    return cleaned.trim();
  }).filter(line => line.length > 0); // Remove linhas que ficaram totalmente vazias
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
          
          return (
            <View key={sector} wrap={false}>
              <Text style={styles.sectorTitle}>{sector}</Text>
              {groups[sector].map((se: any) => (
                <View key={se.id} style={styles.examBlock} wrap={false}>
                  <Text style={styles.examName}>{se.exams?.name}</Text>
                  {formatFinalReport(se.result_value || "").map((line: string, i: number) => {
                    const isRef = line.toLowerCase().includes("referência") || 
                                  line.toLowerCase().includes("ref:") || 
                                  line.toLowerCase().includes("valor:") || 
                                  line.toLowerCase().includes("vr:") ||
                                  line.toLowerCase().includes("normal:") ||
                                  line.toLowerCase().includes("desejável:");
                    
                    return (
                      <Text key={i} style={isRef ? styles.referenceText : styles.resultText}>
                        {line}
                      </Text>
                    );
                  })}
                </View>
              ))}
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

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
            <Printer className="w-6 h-6 text-blue-400" />
            Impressão de Laudos
          </h1>
          <p className="text-blue-300/50 text-sm mt-1 font-medium">Busque pacientes e gere PDFs oficiais dos atendimentos finalizados</p>
        </div>

        <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm relative z-30">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-blue-300/30" />
            <Input
              placeholder="Buscar por Nome, CPF ou Registro..."
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
            <Button variant="ghost" onClick={() => setSelectedPatient(null)} className="text-red-400 hover:bg-red-500/10 font-bold uppercase text-[10px]">Trocar Paciente</Button>
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
                  <h3 className="text-white font-bold uppercase text-sm">Atendimento de {formatSafeDate(service.created_at)}</h3>
                  <p className="text-blue-300/40 text-[10px] font-black uppercase tracking-widest">Registro: #{service.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              
              <PDFDownloadLink 
                document={<LabReportPDF service={service} patient={selectedPatient} />} 
                fileName={`Laudo_${selectedPatient.full_name.replace(/\s+/g, "_")}_${formatSafeDate(service.created_at).replace(/\//g, "")}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-bold uppercase text-[10px] px-8 h-11 shadow-lg shadow-blue-900/20"
                    disabled={pdfLoading}
                  >
                    {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Baixar PDF</>}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          ))}

          {services.length === 0 && selectedPatient && (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <FileText className="w-16 h-16 mb-4" />
              <p className="text-lg font-bold uppercase tracking-widest">Nenhum atendimento finalizado</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
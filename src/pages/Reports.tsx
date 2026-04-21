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
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format, differenceInYears } from "date-fns";
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFDownloadLink, 
  Image
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 170, // Aumentado levemente para dar respiro após o cabeçalho
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontFamily: 'Times-Roman',
    backgroundColor: '#ffffff',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  timbre: {
    width: '100%',
    // Removido height auto para evitar conflitos em containers absolutos
    // O react-pdf mantém a proporção se apenas a largura for definida
  },
  patientInfoContainer: {
    position: 'absolute',
    top: 125, // Posicionado precisamente abaixo da arte do timbre
    left: 50,
    right: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingBottom: 8,
    marginBottom: 20,
  },
  patientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  patientLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  patientValue: {
    fontSize: 10,
  },
  patientSubRow: {
    flexDirection: 'row',
    gap: 30,
  },
  sectorTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    textDecoration: 'underline',
    marginTop: 15,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  examBlock: {
    marginBottom: 12,
  },
  examName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  resultText: {
    fontSize: 11,
    lineHeight: 1.3,
  },
  referenceText: {
    fontSize: 8,
    color: '#555555',
    marginTop: 2,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
  }
});

const LabReportPDF = ({ service, patient }: { service: any, patient: any }) => {
  const sectorOrder = ["HEMATOLOGIA", "BIOQUÍMICA", "IMUNOLOGIA / HORMÔNIOS", "URINÁLISE", "PARASITOLOGIA", "OUTROS"];
  
  const bioOrder = [
    "GLICOSE", "GLICEMIA", "HEMOGLOBINA GLICADA", "HBA1C",
    "COLESTEROL TOTAL", "COLESTEROL HDL", "COLESTEROL LDL", "COLESTEROL VLDL", "TRIGLICERÍDEOS",
    "UREIA", "CREATININA",
    "TGO", "TGP", "GAMA GT", "FOSFATASE ALCALINA", "BILIRRUBINAS"
  ];

  const getSector = (examName: string) => {
    const name = examName.toUpperCase();
    if (name.includes("HEMOGRAMA") || name.includes("SANGUE")) return "HEMATOLOGIA";
    if (name.includes("GLICOSE") || name.includes("GLICEMIA") || name.includes("COLESTEROL") || name.includes("TRIGLI") || name.includes("UREIA") || name.includes("CREATININA") || name.includes("TGO") || name.includes("TGP") || name.includes("HBA1C") || name.includes("GLICADA")) return "BIOQUÍMICA";
    if (name.includes("URINA") || name.includes("EAS")) return "URINÁLISE";
    if (name.includes("FEZES") || name.includes("PARASITO")) return "PARASITOLOGIA";
    if (name.includes("PSA") || name.includes("BETA") || name.includes("TSH") || name.includes("T4")) return "IMUNOLOGIA / HORMÔNIOS";
    return "OUTROS";
  };

  const sortExams = (exams: any[]) => {
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
  };

  const groups: { [key: string]: any[] } = {};
  service.service_exams.forEach((se: any) => {
    const sector = getSector(se.exams?.name || "");
    if (!groups[sector]) groups[sector] = [];
    groups[sector].push(se);
  });

  const timbreUrl = `${window.location.origin}/src/assets/timbre.png`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View fixed style={styles.fixedHeader}>
          <Image src={timbreUrl} style={styles.timbre} />
          <View style={styles.patientInfoContainer}>
            <View style={styles.patientRow}>
              <Text style={styles.patientLabel}>NOME: <Text style={styles.patientValue}>{patient.full_name.toUpperCase()}</Text></Text>
              <Text style={styles.patientLabel}>REGISTRO: <Text style={styles.patientValue}>#{service.id.slice(0, 8).toUpperCase()}</Text></Text>
            </View>
            <View style={styles.patientSubRow}>
              <Text style={styles.patientLabel}>CPF: <Text style={styles.patientValue}>{patient.cpf}</Text></Text>
              <Text style={styles.patientLabel}>IDADE: <Text style={styles.patientValue}>{differenceInYears(new Date(), new Date(patient.birth_date))} ANOS</Text></Text>
              <Text style={styles.patientLabel}>DN: <Text style={styles.patientValue}>{format(new Date(patient.birth_date), "dd/MM/yyyy")}</Text></Text>
            </View>
          </View>
        </View>

        {sectorOrder.map(sector => {
          if (!groups[sector]) return null;
          const sortedExams = sortExams(groups[sector]);
          
          return (
            <View key={sector}>
              {sector !== "OUTROS" && (
                <Text style={styles.sectorTitle}>{sector}</Text>
              )}
              {sortedExams.map((se: any) => (
                <View key={se.id} style={styles.examBlock} wrap={false}>
                  <Text style={styles.examName}>{se.exams?.name}</Text>
                  {se.result_value?.split('\n').map((line: string, i: number) => {
                    const isRef = line.toLowerCase().includes("referência") || 
                                  line.toLowerCase().includes("ref:") || 
                                  line.toLowerCase().includes("valor:") || 
                                  line.toLowerCase().includes("vr:");
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

        <Text 
          style={styles.footer} 
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} 
          fixed 
        />
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
            <FileText className="w-6 h-6 text-blue-400" />
            Central de Laudos
          </h1>
          <p className="text-blue-300/50 text-sm mt-1 font-medium">Baixe os resultados oficiais em formato PDF estruturado</p>
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
              
              <PDFDownloadLink 
                document={<LabReportPDF service={service} patient={selectedPatient} />} 
                fileName={`Laudo_${selectedPatient.full_name.replace(/\s+/g, "_")}_${format(new Date(service.created_at), "ddMMyy")}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-bold uppercase text-[10px] px-6"
                    disabled={pdfLoading}
                  >
                    {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Baixar Laudo</>}
                  </Button>
                )}
              </PDFDownloadLink>
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
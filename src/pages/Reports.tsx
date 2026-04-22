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

// Dimensões A4: 210mm x 297mm
// No react-pdf, 1pt = 1/72 polegada. 1mm = 2.834pt.
// Largura A4: 595.28pt | Altura A4: 841.89pt
const styles = StyleSheet.create({
  page: {
    paddingTop: 180, // Espaço exato para o cabeçalho fixo (Timbre + Info)
    paddingBottom: 80,
    paddingHorizontal: 50,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 170,
    paddingHorizontal: 50,
    paddingTop: 15,
  },
  timbreWrapper: {
    width: '100%',
    height: 110, // Altura fixa entre 35mm e 45mm (~113pt)
    marginBottom: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timbreImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain', // CRÍTICO: Mantém a proporção original sem distorcer
  },
  patientBox: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingVertical: 6,
    marginTop: 2,
  },
  patientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 10,
    fontWeight: 'normal',
  },
  content: {
    marginTop: 10,
  },
  sectorHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#f2f2f2',
    paddingVertical: 4,
    marginTop: 15,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  examContainer: {
    marginBottom: 20,
  },
  examTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  resultLine: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#000000',
  },
  referenceLine: {
    fontSize: 8,
    color: '#555555',
    marginTop: 2,
    fontStyle: 'italic',
  },
  signatureContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  line: {
    width: 200,
    borderTopWidth: 0.5,
    borderTopColor: '#000000',
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  signatureRole: {
    fontSize: 7,
    color: '#333333',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 7,
    color: '#999999',
    borderTopWidth: 0.5,
    borderTopColor: '#eeeeee',
    paddingTop: 8,
  }
});

const LabReportPDF = ({ service, patient }: { service: any, patient: any }) => {
  const sectorOrder = ["HEMATOLOGIA", "BIOQUÍMICA", "IMUNOLOGIA / HORMÔNIOS", "URINÁLISE", "PARASITOLOGIA", "OUTROS"];
  
  const getSector = (examName: string) => {
    const name = examName.toUpperCase();
    if (name.includes("HEMOGRAMA") || name.includes("SANGUE")) return "HEMATOLOGIA";
    if (name.includes("GLICOSE") || name.includes("GLICEMIA") || name.includes("COLESTEROL") || name.includes("TRIGLI") || name.includes("UREIA") || name.includes("CREATININA") || name.includes("TGO") || name.includes("TGP") || name.includes("HBA1C") || name.includes("GLICADA")) return "BIOQUÍMICA";
    if (name.includes("URINA") || name.includes("EAS")) return "URINÁLISE";
    if (name.includes("FEZES") || name.includes("PARASITO")) return "PARASITOLOGIA";
    if (name.includes("PSA") || name.includes("BETA") || name.includes("TSH") || name.includes("T4")) return "IMUNOLOGIA / HORMÔNIOS";
    return "OUTROS";
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
        {/* Cabeçalho Fixo em Todas as Páginas */}
        <View fixed style={styles.headerContainer}>
          <View style={styles.timbreWrapper}>
            <Image src={timbreUrl} style={styles.timbreImage} />
          </View>
          <View style={styles.patientBox}>
            <View style={styles.patientRow}>
              <Text style={styles.label}>Paciente: <Text style={styles.value}>{patient.full_name.toUpperCase()}</Text></Text>
              <Text style={styles.label}>Registro: <Text style={styles.value}>#{service.id.slice(0, 8).toUpperCase()}</Text></Text>
            </View>
            <View style={styles.patientRow}>
              <Text style={styles.label}>CPF: <Text style={styles.value}>{patient.cpf}</Text></Text>
              <Text style={styles.label}>Idade: <Text style={styles.value}>{differenceInYears(new Date(), new Date(patient.birth_date))} Anos</Text></Text>
              <Text style={styles.label}>Data: <Text style={styles.value}>{format(new Date(service.created_at), "dd/MM/yyyy")}</Text></Text>
            </View>
          </View>
        </View>

        {/* Conteúdo dos Exames */}
        <View style={styles.content}>
          {sectorOrder.map(sector => {
            if (!groups[sector]) return null;
            
            return (
              <View key={sector} wrap={false}>
                <Text style={styles.sectorHeader}>{sector}</Text>
                {groups[sector].map((se: any) => (
                  <View key={se.id} style={styles.examContainer}>
                    <Text style={styles.examTitle}>{se.exams?.name}</Text>
                    {/* Limpeza rigorosa de placeholders (?) */}
                    {se.result_value?.replace(/\(\?\)/g, '').split('\n').map((line: string, i: number) => {
                      const isRef = line.toLowerCase().includes("referência") || 
                                    line.toLowerCase().includes("ref:") || 
                                    line.toLowerCase().includes("valor:") || 
                                    line.toLowerCase().includes("vr:");
                      return (
                        <Text key={i} style={isRef ? styles.referenceLine : styles.resultLine}>
                          {line.trim()}
                        </Text>
                      );
                    })}
                  </View>
                ))}
              </View>
            );
          })}
        </View>

        {/* Assinatura Fixa */}
        <View style={styles.signatureContainer} fixed>
          <View style={styles.line} />
          <Text style={styles.signatureName}>Matheus Souza</Text>
          <Text style={styles.signatureRole}>Técnico em Patologia Clínica • CRF-BA 805.994</Text>
        </View>

        {/* Rodapé Fixo */}
        <Text 
          style={styles.footer} 
          render={({ pageNumber, totalPages }) => (
            `Lab Acajutiba - Inovação & Precisão | Página ${pageNumber} de ${totalPages}`
          )} 
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
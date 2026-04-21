"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Search,
  User,
  Loader2,
  CheckCircle2,
  Calendar,
  Download,
  Printer,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
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
import { cn } from "@/lib/utils";

const formatSafeDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    if (dateStr.length === 10) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return format(new Date(year, month - 1, day), "dd/MM/yyyy");
    }
    return format(parseISO(dateStr), "dd/MM/yyyy");
  } catch (e) {
    return dateStr;
  }
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
    fontSize: 11, 
    fontFamily: 'Times-Bold',
  },
  value: {
    fontSize: 11, 
    fontFamily: 'Times-Roman',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 3,
    marginTop: 15,
    marginBottom: 5,
  },
  headerText: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 3,
    minHeight: 15, // Garante espaçamento mesmo em linhas vazias
  },
  cellText: {
    fontSize: 10,
    fontFamily: 'Times-Roman',
  },
  examTitle: {
    fontSize: 12,
    fontFamily: 'Times-Bold',
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    textAlign: 'center',
    textDecoration: 'underline'
  }
});

const LabReportPDF = ({ service, patient, reportData }: { service: any, patient: any, reportData: any[] }) => {
  const timbreUrl = `${window.location.origin}/src/assets/timbre.png`;

  return (
    <Document title={`Laudo - ${patient.full_name}`}>
      <Page size="A4" style={styles.page}>
        <Image src={timbreUrl} style={styles.background} fixed />

        {/* Cabeçalho do Paciente */}
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

        {/* Conteúdo dos Pré-Modelos */}
        {reportData.map((report: any, rIdx: number) => (
          <View key={rIdx} wrap={false}>
            <Text style={styles.examTitle}>{report.name}</Text>
            
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, { width: '40%' }]}>Parâmetro</Text>
              <Text style={[styles.headerText, { width: '25%' }]}>Resultado</Text>
              <Text style={[styles.headerText, { width: '35%' }]}>Valores de Referência</Text>
            </View>

            {report.items.map((item: any, iIdx: number) => {
              const refValue = patient.gender === 'masculino' ? item.ref_male : 
                               patient.gender === 'feminino' ? item.ref_female : 
                               item.ref_general;
              
              return (
                <View key={iIdx} style={styles.row}>
                  <Text style={[styles.cellText, { width: '40%' }]}>{item.parameter}</Text>
                  <Text style={[styles.cellText, { width: '25%', fontFamily: 'Times-Bold' }]}>
                    {item.result || ''} {item.unit || ''}
                  </Text>
                  <Text style={[styles.cellText, { width: '35%', fontSize: 9 }]}>
                    {refValue || ''} {item.unit || ''}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
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
  const [reportDataMap, setReportDataMap] = useState<Record<string, any[]>>({});

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
    
    const { data: srvs } = await supabase
      .from("services")
      .select(`*, service_exams (*, exams (id, name))`)
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false });
    
    setServices(srvs || []);

    if (srvs) {
      const newReportDataMap: Record<string, any[]> = {};
      
      for (const service of srvs) {
        const examIds = service.service_exams.map((se: any) => se.exam_id);
        
        // Busca os pré-modelos vinculados aos exames deste atendimento
        const { data: reports } = await supabase
          .from('pre_reports')
          .select('*, pre_report_items (*)')
          .in('exam_id', examIds)
          .order('order_index');

        if (reports) {
          newReportDataMap[service.id] = reports.map(r => ({
            name: r.name,
            items: r.pre_report_items.sort((a: any, b: any) => a.line_order - b.line_order)
          }));
        }
      }
      setReportDataMap(newReportDataMap);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
            <Printer className="w-6 h-6 text-blue-400" />
            Impressão de Laudos (Pré-Modelos)
          </h1>
          <p className="text-blue-300/50 text-sm mt-1 font-medium">Geração de PDFs baseada nos templates e espaçamentos originais</p>
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
          {services.map((service) => {
            const reportData = reportDataMap[service.id] || [];
            
            return (
              <div key={service.id} className="bg-blue-950/30 border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600/10 rounded-xl text-blue-400"><Calendar className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-white font-bold uppercase text-sm">Atendimento de {formatSafeDate(service.created_at)}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-blue-300/40 text-[10px] font-black uppercase tracking-widest">Registro: #{service.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                </div>
                
                {reportData.length > 0 ? (
                  <PDFDownloadLink 
                    document={<LabReportPDF service={service} patient={selectedPatient} reportData={reportData} />} 
                    fileName={`Laudo_${selectedPatient.full_name.replace(/\s+/g, "_")}.pdf`}
                  >
                    {({ loading: pdfLoading }) => (
                      <Button className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-bold uppercase text-[10px] px-8 h-11 shadow-lg shadow-blue-900/20" disabled={pdfLoading}>
                        {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Baixar Laudo (Modelo)</>}
                      </Button>
                    )}
                  </PDFDownloadLink>
                ) : (
                  <div className="flex items-center gap-2 text-amber-400/50 text-[10px] font-bold uppercase">
                    <AlertCircle className="w-4 h-4" />
                    Sem modelo vinculado
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
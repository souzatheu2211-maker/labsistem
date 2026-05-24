"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Search, FileText, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image, Font } from "@react-pdf/renderer";

// Registro de fontes
Font.register({
  family: 'Times-Roman',
  src: 'https://fonts.gstatic.com/s/timesnewroman/v1/times.ttf'
});
Font.register({
  family: 'Times-Bold',
  src: 'https://fonts.gstatic.com/s/timesnewroman/v1/timesbold.ttf'
});

const HEMOGRAM_SCALE = 1448 / 595.28;
const s = (val: number) => val / HEMOGRAM_SCALE;

const styles = StyleSheet.create({
  page: { padding: 40, paddingTop: 160, fontFamily: "Times-Roman", backgroundColor: "#ffffff" },
  background: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  header: { position: "absolute", top: 110, left: 50, right: 50, borderBottom: 1, paddingBottom: 10 },
  patientRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontSize: 10, fontFamily: "Times-Bold" },
  value: { fontSize: 10, fontFamily: "Times-Roman" },
  examTitle: { fontSize: 12, fontFamily: "Times-Bold", textAlign: "center", marginTop: 20, marginBottom: 10, textDecoration: 'underline' },
  resultRow: { flexDirection: "row", borderBottom: 0.5, borderBottomColor: '#eee', paddingVertical: 3, alignItems: 'center' },
  colLabel: { width: '40%', fontSize: 10 },
  colResult: { width: '25%', fontSize: 10, fontFamily: "Times-Bold" },
  colUnit: { width: '10%', fontSize: 9 },
  colRef: { width: '25%', fontSize: 8, color: '#666' },
  sectionTitle: { fontSize: 10, fontFamily: "Times-Bold", marginTop: 10, marginBottom: 5, color: '#444', borderBottom: 1, borderBottomColor: '#ccc' }
});

const LabReportPDF = ({ service, patient }: { service: any; patient: any }) => {
  const timbreUrl = `${window.location.origin}/timbre.png`;
  const timbreHemogramaUrl = `${window.location.origin}/timbre-hemograma_page-0001.png`;

  return (
    <Document>
      {service.service_exams?.map((se: any) => {
        const isHemograma = se.exam_templates?.code === "HEMOGRAMA";
        const results = se.exam_results?.[0]?.exam_result_values || [];
        
        if (isHemograma) {
          // Mapeamento de valores por internal_name para coordenadas
          const valMap: Record<string, string> = {};
          results.forEach((rv: any) => {
            valMap[rv.exam_template_fields?.internal_name] = rv.value;
          });

          return (
            <Page key={se.id} size="A4" style={{ padding: 0 }}>
              <Image src={timbreHemogramaUrl} style={styles.background} />
              
              {/* Cabeçalho Hemograma Coordenadas */}
              <View style={{ position: 'absolute', top: s(340), left: s(120), right: s(120) }}>
                <View style={styles.patientRow}>
                  <Text style={styles.label}>PACIENTE: <Text style={styles.value}>{patient.full_name.toUpperCase()}</Text></Text>
                  <Text style={styles.label}>DATA: <Text style={styles.value}>{format(parseISO(service.created_at), "dd/MM/yyyy")}</Text></Text>
                </View>
              </View>

              {/* Valores Absolutos Hemograma */}
              <Text style={{ position: 'absolute', left: s(660), top: s(860), width: s(200), textAlign: 'center', fontSize: 10 }}>{valMap['hemacias'] || ''}</Text>
              <Text style={{ position: 'absolute', left: s(660), top: s(895), width: s(200), textAlign: 'center', fontSize: 10 }}>{valMap['hemoglobina'] || ''}</Text>
              <Text style={{ position: 'absolute', left: s(660), top: s(930), width: s(200), textAlign: 'center', fontSize: 10 }}>{valMap['hematocrito'] || ''}</Text>
              
              {/* Plaquetas com fonte maior conforme solicitado */}
              <Text style={{ position: 'absolute', left: s(520), top: s(1590), fontSize: 14, fontFamily: 'Times-Bold' }}>{valMap['plaquetas'] || ''}</Text>
            </Page>
          );
        }

        // Layout Padrão para outros exames
        return (
          <Page key={se.id} size="A4" style={styles.page}>
            <Image src={timbreUrl} style={styles.background} />
            <View style={styles.header}>
              <View style={styles.patientRow}>
                <Text style={styles.label}>PACIENTE: <Text style={styles.value}>{patient.full_name.toUpperCase()}</Text></Text>
                <Text style={styles.label}>DATA: <Text style={styles.value}>{format(parseISO(service.created_at), "dd/MM/yyyy")}</Text></Text>
              </View>
            </View>
            
            <Text style={styles.examTitle}>{se.exam_templates?.name.toUpperCase()}</Text>
            
            {results.sort((a: any, b: any) => a.exam_template_fields?.order_index - b.exam_template_fields?.order_index).map((rv: any) => (
              <React.Fragment key={rv.id}>
                {rv.exam_template_fields?.field_type === 'title' ? (
                  <Text style={styles.sectionTitle}>{rv.exam_template_fields?.label}</Text>
                ) : (
                  <View style={styles.resultRow}>
                    <Text style={styles.colLabel}>{rv.exam_template_fields?.label}</Text>
                    <Text style={styles.colResult}>{rv.value || '---'}</Text>
                    <Text style={styles.colUnit}>{rv.unit || ''}</Text>
                    <Text style={styles.colRef}>{rv.reference_value || ''}</Text>
                  </View>
                )}
              </React.Fragment>
            ))}
          </Page>
        );
      })}
    </Document>
  );
};

const Reports = () => {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchPatients = async () => {
    const { data } = await supabase.from("patients").select("*").or(`full_name.ilike.%${search}%,cpf.ilike.%${search}%`).limit(5);
    setPatients(data || []);
  };

  const fetchServices = async (pid: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("services")
      .select(`
        *, 
        service_exams (
          *, 
          exam_templates (name, code),
          exam_results (
            *,
            exam_result_values (
              *,
              exam_template_fields (*)
            )
          )
        )
      `)
      .eq("patient_id", pid)
      .eq("status", "finalizado");
    
    setServices(data || []);
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8">
          <Input 
            placeholder="Buscar paciente para laudo..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            onKeyUp={searchPatients} 
            className="bg-blue-900/20 border-blue-500/10 h-12 rounded-2xl text-white" 
          />
          <div className="mt-4 space-y-2">
            {patients.map(p => (
              <button key={p.id} onClick={() => { setSelectedPatient(p); fetchServices(p.id); setPatients([]); }} className="w-full p-4 bg-blue-900/10 rounded-xl text-left text-white hover:bg-blue-600/20">
                {p.full_name} - {p.cpf}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : services.map(s => (
          <div key={s.id} className="bg-blue-950/30 border border-white/5 p-6 rounded-2xl flex justify-between items-center">
            <div>
              <span className="text-white font-bold block">Atendimento {format(parseISO(s.created_at), "dd/MM/yyyy")}</span>
              <span className="text-[10px] text-blue-400 uppercase font-black">Status: {s.status}</span>
            </div>
            <PDFDownloadLink document={<LabReportPDF service={s} patient={selectedPatient} />} fileName={`laudo_${selectedPatient?.full_name}.pdf`}>
              {({ loading }) => (
                <Button className="bg-blue-600 rounded-xl gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Baixar Laudo</>}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Reports;
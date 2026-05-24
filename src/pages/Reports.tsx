"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Search, FileText, User, Loader2, CheckCircle2, Calendar, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image, Font } from "@react-pdf/renderer";

// Registro de fontes para garantir que não venha em branco
Font.register({
  family: 'Times-Roman',
  src: 'https://fonts.gstatic.com/s/timesnewroman/v1/times.ttf'
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
  categoryTitle: { fontSize: 10, fontFamily: "Times-Bold", marginTop: 10, marginBottom: 5, color: '#444' },
  resultRow: { flexDirection: "row", borderBottom: 0.5, borderBottomColor: '#eee', paddingVertical: 3, alignItems: 'center' },
  colLabel: { width: '40%', fontSize: 10 },
  colResult: { width: '25%', fontSize: 10, fontFamily: "Times-Bold" },
  colUnit: { width: '10%', fontSize: 9 },
  colRef: { width: '25%', fontSize: 8, color: '#666' },
  badge: { padding: 2, borderRadius: 2, fontSize: 8, fontFamily: 'Times-Bold', color: 'white' }
});

const LabReportPDF = ({ service, patient }: { service: any; patient: any }) => {
  const timbreUrl = `${window.location.origin}/timbre.png`;
  const timbreHemogramaUrl = `${window.location.origin}/timbre-hemograma_page-0001.png`;

  return (
    <Document>
      {service.service_exams?.map((se: any) => {
        const isHemograma = se.exams?.name.toUpperCase().includes("HEMOGRAMA");
        const results = se.structured_results || {};
        const fields = se.exam_fields || [];

        if (isHemograma) {
          return (
            <Page key={se.id} size="A4" style={{ padding: 0 }}>
              <Image src={timbreHemogramaUrl} style={styles.background} />
              {/* Cabeçalho Hemograma */}
              <View style={{ position: 'absolute', top: s(340), left: s(120), right: s(120) }}>
                <View style={styles.patientRow}>
                  <Text style={styles.label}>PACIENTE: <Text style={styles.value}>{patient.full_name.toUpperCase()}</Text></Text>
                  <Text style={styles.label}>DATA: <Text style={styles.value}>{format(parseISO(service.created_at), "dd/MM/yyyy")}</Text></Text>
                </View>
              </View>
              {/* Mapeamento de coordenadas conforme solicitado */}
              <Text style={{ position: 'absolute', left: s(760-100), top: s(860), width: s(200), textAlign: 'center', fontSize: 10 }}>{results['hemacias'] || ''}</Text>
              <Text style={{ position: 'absolute', left: s(760-100), top: s(895), width: s(200), textAlign: 'center', fontSize: 10 }}>{results['hemoglobina'] || ''}</Text>
              <Text style={{ position: 'absolute', left: s(520), top: s(1590), fontSize: 14, fontFamily: 'Times-Bold' }}>{results['plaquetas'] || ''}</Text>
              {/* ... outros campos seguem a mesma lógica de s(x) e s(y) */}
            </Page>
          );
        }

        return (
          <Page key={se.id} size="A4" style={styles.page}>
            <Image src={timbreUrl} style={styles.background} />
            <View style={styles.header}>
              <View style={styles.patientRow}>
                <Text style={styles.label}>PACIENTE: <Text style={styles.value}>{patient.full_name.toUpperCase()}</Text></Text>
                <Text style={styles.label}>DATA: <Text style={styles.value}>{format(parseISO(service.created_at), "dd/MM/yyyy")}</Text></Text>
              </View>
            </View>
            <Text style={styles.examTitle}>{se.exams?.name.toUpperCase()}</Text>
            {fields.map((field: any) => (
              <View key={field.id} style={styles.resultRow}>
                <Text style={styles.colLabel}>{field.label}</Text>
                <Text style={styles.colResult}>{results[field.internal_name] || '---'}</Text>
                <Text style={styles.colUnit}>{field.unit || ''}</Text>
                <Text style={styles.colRef}>{field.reference_value || ''}</Text>
              </View>
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

  const searchPatients = async () => {
    const { data } = await supabase.from("patients").select("*").or(`full_name.ilike.%${search}%,cpf.ilike.%${search}%`).limit(5);
    setPatients(data || []);
  };

  const fetchServices = async (pid: string) => {
    const { data } = await supabase.from("services").select(`*, service_exams (*, exams (name))`).eq("patient_id", pid).eq("status", "finalizado");
    
    // Para cada exame, buscar seus campos configurados
    const enrichedServices = await Promise.all((data || []).map(async (s) => {
      const exams = await Promise.all(s.service_exams.map(async (se: any) => {
        const { data: fields } = await supabase.from('exam_fields').select('*').eq('exam_id', se.exam_id).order('order_index');
        return { ...se, exam_fields: fields };
      }));
      return { ...s, service_exams: exams };
    }));
    
    setServices(enrichedServices);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-blue-950/30 border border-white/5 rounded-[2rem] p-8">
          <Input placeholder="Buscar paciente..." value={search} onChange={e => setSearch(e.target.value)} onKeyUp={searchPatients} className="bg-blue-900/20 border-blue-500/10 h-12 rounded-2xl text-white" />
          <div className="mt-4 space-y-2">
            {patients.map(p => (
              <button key={p.id} onClick={() => { setSelectedPatient(p); fetchServices(p.id); setPatients([]); }} className="w-full p-4 bg-blue-900/10 rounded-xl text-left text-white hover:bg-blue-600/20">
                {p.full_name} - {p.cpf}
              </button>
            ))}
          </div>
        </div>

        {services.map(s => (
          <div key={s.id} className="bg-blue-950/30 border border-white/5 p-6 rounded-2xl flex justify-between items-center">
            <span className="text-white font-bold">Atendimento {format(parseISO(s.created_at), "dd/MM/yyyy")}</span>
            <PDFDownloadLink document={<LabReportPDF service={s} patient={selectedPatient} />} fileName="laudo.pdf">
              <Button className="bg-blue-600 rounded-xl">Baixar Laudo</Button>
            </PDFDownloadLink>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Reports;
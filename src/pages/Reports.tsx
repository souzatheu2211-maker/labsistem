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

      await new Promise((r) => setTimeout(r, 500));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        windowWidth: 794
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const pdfImgHeight = (imgProps.height * pageWidth) / imgProps.width;

      let heightLeft = pdfImgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pageWidth, pdfImgHeight);
      heightLeft -= pageHeight;

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
      showError("Erro ao gerar PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3 uppercase">
            <Printer className="w-6 h-6 text-blue-400" />
            Impressão de Laudos
          </h1>
        </div>

        {/* SEARCH */}
        <div className="bg-blue-950/30 border border-white/5 rounded-2xl p-6">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-blue-300/30" />
            <Input
              placeholder="Pesquisar paciente..."
              className="pl-12 h-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {loading && (
              <Loader2 className="absolute right-4 top-3.5 animate-spin" />
            )}
          </div>

          {patients.length > 0 && (
            <div className="mt-2 bg-blue-950 border rounded-xl overflow-hidden">
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className="w-full p-3 flex justify-between hover:bg-blue-900/40"
                >
                  <div className="text-left">
                    <p className="font-bold text-white">{p.full_name}</p>
                    <p className="text-xs text-blue-400">{p.cpf}</p>
                  </div>
                  <CheckCircle2 />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PATIENT SELECTED */}
        {selectedPatient && (
          <div className="bg-blue-600/10 p-4 rounded-xl border border-blue-500/20">
            <p className="text-white font-bold uppercase">
              {selectedPatient.full_name}
            </p>
          </div>
        )}

        {/* SERVICES */}
        <div className="space-y-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-blue-950/30 p-6 rounded-2xl border"
            >
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-white font-bold">
                    Atendimento #{service.id.slice(0, 8)}
                  </p>
                </div>

                <Button onClick={() => generatePDF(service)}>
                  {generating ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </>
                  )}
                </Button>
              </div>

              {/* PDF CONTENT */}
              <div style={{ position: "absolute", left: "-9999px" }}>
                <div
                  id={`report-content-${service.id}`}
                  style={{
                    width: "210mm",
                    minHeight: "297mm",
                    background: "#fff",
                    color: "#000",
                    fontFamily: "Arial",
                    fontSize: "12pt",
                    position: "relative",
                    padding: "20mm",
                    boxSizing: "border-box"
                  }}
                >
                  {/* TIMBRE */}
                  <img
                    src="/src/assets/timbre.png"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "42mm",
                      objectFit: "cover"
                    }}
                  />

                  {/* CABEÇALHO */}
                  <div
                    style={{
                      marginTop: "42mm",
                      borderBottom: "1px solid black",
                      paddingBottom: "4mm",
                      fontSize: "12pt"
                    }}
                  >
                    <div>
                      <strong>NOME:</strong>{" "}
                      {selectedPatient.full_name.toUpperCase()}
                    </div>
                    <div>
                      <strong>CPF:</strong> {selectedPatient.cpf}
                    </div>
                    <div>
                      <strong>REGISTRO:</strong> #
                      {service.id.slice(0, 8)}
                    </div>
                    <div>
                      <strong>IDADE:</strong>{" "}
                      {differenceInYears(
                        new Date(),
                        new Date(selectedPatient.birth_date)
                      )}{" "}
                      ANOS
                    </div>
                  </div>

                  {/* EXAMES ORDENADOS */}
                  <div style={{ marginTop: "8mm" }}>
                    {[...service.service_exams]
                      .sort((a, b) =>
                        (a.exams?.name || "").localeCompare(
                          b.exams?.name || ""
                        )
                      )
                      .map((se: any) => (
                        <div
                          key={se.id}
                          style={{
                            marginBottom: "6mm",
                            pageBreakInside: "avoid"
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12pt",
                              fontWeight: "bold",
                              borderBottom: "1px solid #ccc"
                            }}
                          >
                            {se.exams?.name}
                          </div>

                          <div style={{ fontSize: "12pt" }}>
                            {se.result_value}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* EXAMES RESUMO */}
              <div className="grid grid-cols-2 gap-2">
                {service.service_exams.map((se: any) => (
                  <div
                    key={se.id}
                    className="p-3 border rounded-lg text-xs text-white"
                  >
                    {se.exams?.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
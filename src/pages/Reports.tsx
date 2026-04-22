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
    const [year, month, day] = dateStr.split("-").map(Number);
    return format(new Date(year, month - 1, day), "dd/MM/yyyy");
  }
  return format(parseISO(dateStr), "dd/MM/yyyy");
};

const abbreviateName = (fullName: string, maxLength: number = 36) => {
  if (!fullName) return "";
  const upper = fullName.toUpperCase();

  if (upper.length <= maxLength) return upper;

  const parts = upper.split(" ").filter(Boolean);
  if (parts.length <= 2) return upper.substring(0, maxLength - 3) + "...";

  const first = parts[0];
  const last = parts[parts.length - 1];
  const middle = parts.slice(1, parts.length - 1).map((p) => p[0] + ".");

  let abbreviated = [first, ...middle, last].join(" ");
  if (abbreviated.length <= maxLength) return abbreviated;

  abbreviated = [first, last].join(" ");
  if (abbreviated.length <= maxLength) return abbreviated;

  return upper.substring(0, maxLength - 3) + "...";
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 200,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontFamily: "Times-Roman",
    backgroundColor: "#ffffff"
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  patientInfoFixed: {
    position: "absolute",
    top: 140,
    left: 50,
    right: 50,
    borderBottom: 1,
    borderBottomColor: "#000000",
    paddingBottom: 10
  },
  patientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4
  },
  label: {
    fontSize: 12,
    fontFamily: "Times-Bold",
    color: "#000000"
  },
  value: {
    fontSize: 12,
    fontFamily: "Times-Roman",
    color: "#000000"
  },

  pageTitle: {
    fontSize: 14,
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginBottom: 14
  },

  examBlock: {
    marginBottom: 18
  },

  htmlLine: {
    marginBottom: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline"
  },

  twoColLine: {
    flexDirection: "row",
    marginBottom: 1
  },
  leftCol: {
    width: "62%",
    paddingRight: 6
  },
  rightCol: {
    width: "38%",
    paddingLeft: 4
  },

  // COAGULOGRAMA - bloco RIN organizado
  rinRow: {
    flexDirection: "row",
    marginBottom: 2
  },
  rinLeft: {
    width: "35%",
    paddingRight: 6
  },
  rinRight: {
    width: "65%"
  },

  resultText: {
    fontSize: 12,
    fontFamily: "Times-Bold"
  },
  normalText: {
    fontSize: 10,
    fontFamily: "Times-Roman"
  },
  refText: {
    fontSize: 8,
    color: "#333333",
    fontFamily: "Times-Roman",
    lineHeight: 1.1
  }
});

const cleanGarbage = (text: string) => {
  return text
    .replace(/&{1,}/g, "")
    .replace(/_{2,}/g, "")
    .replace(/\*{2,}/g, "")
    .replace(/-{5,}/g, "")
    .replace(/[ ]{2,}/g, " ")
    .trim();
};

const renderHTMLContent = (html: string, examName: string) => {
  if (!html) return null;

  const cleanHtml = html
    .replace(/<p>/g, "")
    .replace(/<\/p>/g, "\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<div>/g, "")
    .replace(/<\/div>/g, "\n")
    .replace(/<span[^>]*>/g, "")
    .replace(/<\/span>/g, "");

  const lines = cleanHtml.split("\n");
  const examUpper = (examName || "").trim().toUpperCase();

  let coagRinMode = false;

  return lines.map((line, i) => {
    let trimmedLine = line.trim();
    if (!trimmedLine) return <View key={i} style={{ height: 6 }} />;

    trimmedLine = cleanGarbage(trimmedLine);
    if (!trimmedLine) return <View key={i} style={{ height: 6 }} />;

    trimmedLine = trimmedLine.replace(/[\u200B-\u200D\uFEFF]/g, "");
    const upper = trimmedLine.toUpperCase();

    const isRefLine =
      upper.includes("VALOR DE REFERÊNCIA") ||
      upper.includes("VALORES DE REFERÊNCIA") ||
      upper.includes("VALOR REFERENCIAL") ||
      upper.includes("VALORES REFERENCIAIS") ||
      upper.includes("REFERÊNCIA") ||
      upper.includes("REF:") ||
      upper.includes("CRIANÇAS") ||
      upper.includes("ADOLESCENTES") ||
      upper.includes("ADULTOS") ||
      upper.includes("DESEJÁVEL") ||
      upper.includes("ACEITÁVEL") ||
      upper.includes("ALTO") ||
      upper.includes("BAIXO") ||
      upper.includes("ÓTIMO") ||
      upper.includes("LIMITRÓFE") ||
      upper.includes("LIMÍTROFE") ||
      upper.includes("MUITO ALTO") ||
      upper.includes("MUITO ELEVADO") ||
      upper.includes("INDETERMINADO") ||
      upper.includes("MÉTODO") ||
      upper.includes("MET.") ||
      upper.includes("LABTEST") ||
      upper.includes("DIAGNÓSTICA") ||
      upper.includes("IMUNO") ||
      upper.includes("IFCC") ||
      upper.includes("WINTROBE") ||
      upper.includes("SZASZ") ||
      upper.includes("FOTOMETRIA") ||
      upper.includes("CINÉTICO") ||
      upper.includes("CINETICO") ||
      upper.includes("ENZIMÁTICO") ||
      upper.includes("ENZIMATICO") ||
      upper.includes("PROFILAXIA") ||
      upper.includes("TRATAMENTO") ||
      upper.includes("TVP") ||
      upper.includes("EMBOLIA") ||
      upper.includes("CIRURGIA") ||
      upper.includes("INFARTO") ||
      upper.includes("ATAQUE ISQUÊMICO") ||
      upper.includes("ATAQUE ISQUEMICO") ||
      upper.includes("VÁLVULAS") ||
      upper.includes("VALVULAS") ||
      upper.includes("ENXERTOS") ||
      upper.includes("FAIXA TERAPÊUTICA") ||
      upper.includes("FAIXA TERAPEUTICA");

    // ATIVA MODO RIN DO COAG
    if (examUpper === "COAGULOGRAMA" && upper.startsWith("VALORES REFERENCIAIS:")) {
      coagRinMode = true;
    }

    // FINALIZA MODO RIN DO COAG QUANDO COMEÇA NOVA SEÇÃO
    if (
      examUpper === "COAGULOGRAMA" &&
      coagRinMode &&
      (upper.startsWith("MATERIAL: PLASMA") ||
        upper.startsWith("TEMPO DE TROMBOPLASTINA") ||
        upper.startsWith("TEMPO DE SANGRAMENTO") ||
        upper.startsWith("TEMPO DE COAGULAÇÃO"))
    ) {
      coagRinMode = false;
    }

    // BLOCO ESPECIAL DO COAGULOGRAMA PARA LINHAS RIN
    if (examUpper === "COAGULOGRAMA" && coagRinMode) {
      if (upper.startsWith("RIN:")) {
        const left = trimmedLine.split("=")[0].trim();
        const right = trimmedLine.includes("=")
          ? trimmedLine.split("=").slice(1).join("=").trim()
          : "";

        return (
          <View key={i} style={styles.rinRow}>
            <View style={styles.rinLeft}>
              <Text style={styles.refText}>{left}</Text>
            </View>
            <View style={styles.rinRight}>
              <Text style={styles.refText}>{right ? "= " + right : ""}</Text>
            </View>
          </View>
        );
      }

      return (
        <View key={i} style={styles.htmlLine}>
          <Text style={styles.refText}>{trimmedLine}</Text>
        </View>
      );
    }

    const isMainResultLine =
      trimmedLine.includes(":") &&
      !isRefLine &&
      !upper.includes("MATERIAL") &&
      !upper.includes("VALOR REFERENCIAL") &&
      !upper.includes("VALORES REFERENCIAIS");

    const hasTab = trimmedLine.includes("\t");
    const hasMultiSpaceColumns = /\s{5,}/.test(trimmedLine);

    if (isMainResultLine) {
      const [left, ...rest] = trimmedLine.split(":");
      const right = rest.join(":").trim();

      return (
        <View key={i} style={styles.twoColLine}>
          <View style={styles.leftCol}>
            <Text style={styles.resultText}>{left.trim()}:</Text>
          </View>
          <View style={styles.rightCol}>
            <Text style={styles.resultText}>{right}</Text>
          </View>
        </View>
      );
    }

    if (hasTab || hasMultiSpaceColumns) {
      const cols = hasTab
        ? trimmedLine.split("\t")
        : trimmedLine.split(/\s{5,}/);

      const left = cleanGarbage(cols[0] || "");
      const right = cleanGarbage(cols.slice(1).join(" ") || "");

      return (
        <View
          key={i}
          style={{
            ...styles.twoColLine,
            marginBottom: isRefLine ? 0 : 1
          }}
        >
          <View style={styles.leftCol}>
            <Text style={isRefLine ? styles.refText : styles.normalText}>
              {left}
            </Text>
          </View>

          <View style={styles.rightCol}>
            <Text style={isRefLine ? styles.refText : styles.normalText}>
              {right}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View
        key={i}
        style={
          isRefLine ? { ...styles.htmlLine, marginBottom: 0 } : styles.htmlLine
        }
      >
        <Text style={isRefLine ? styles.refText : styles.normalText}>
          {trimmedLine}
        </Text>
      </View>
    );
  });
};

const getExamGroup = (examName: string) => {
  const n = (examName || "").trim().toUpperCase();

  if (n.includes("HEMOGRAMA")) return "HEMOGRAMA";
  if (n.includes("COAGULOGRAMA")) return "COAGULOGRAMA";
  if (n.includes("SUMÁRIO DE URINA") || n.includes("EAS")) return "URINA";
  if (n.includes("PARASITOLÓGICO DE FEZES")) return "FEZES";
  if (n.includes("BETA HCG")) return "BETA_HCG";

  return "GERAL";
};

const getGroupTitle = (group: string) => {
  if (group === "HEMOGRAMA") return "HEMOGRAMA COMPLETO";
  if (group === "COAGULOGRAMA") return "COAGULOGRAMA";
  if (group === "URINA") return "SUMÁRIO DE URINA";
  if (group === "FEZES") return "PARASITOLÓGICO DE FEZES";
  if (group === "BETA_HCG") return "BETA HCG";
  return "EXAMES LABORATORIAIS";
};

const labOrder = [
  "HEMOGRAMA",
  "COAGULOGRAMA",
  "URINA",
  "FEZES",
  "BETA_HCG",
  "GERAL"
];

const LabReportPDF = ({ service, patient }: { service: any; patient: any }) => {
  const timbreUrl = `${window.location.origin}/timbre.png`;

  const allExams = [...(service.service_exams || [])];

  const grouped: Record<string, any[]> = {
    HEMOGRAMA: [],
    COAGULOGRAMA: [],
    URINA: [],
    FEZES: [],
    BETA_HCG: [],
    GERAL: []
  };

  allExams.forEach((se: any) => {
    const examName = se.exams?.name || "";
    const group = getExamGroup(examName);
    grouped[group].push(se);
  });

  Object.keys(grouped).forEach((key) => {
    grouped[key] = grouped[key].sort((a, b) => {
      const orderA = a.exams?.pre_reports?.[0]?.order_index ?? 999;
      const orderB = b.exams?.pre_reports?.[0]?.order_index ?? 999;

      if (orderA !== orderB) return orderA - orderB;

      const nameA = (a.exams?.name || "").toUpperCase();
      const nameB = (b.exams?.name || "").toUpperCase();
      return nameA.localeCompare(nameB);
    });
  });

  const patientName = abbreviateName(patient.full_name, 36);

  return (
    <Document title={`Laudo - ${patient.full_name}`}>
      {labOrder.map((groupKey) => {
        const examsInGroup = grouped[groupKey] || [];
        if (examsInGroup.length === 0) return null;

        return (
          <Page key={groupKey} size="A4" style={styles.page}>
            <Image src={timbreUrl} style={styles.background} fixed />

            <View style={styles.patientInfoFixed} fixed>
              <View style={styles.patientRow}>
                <Text style={styles.label}>
                  PACIENTE: <Text style={styles.value}>{patientName}</Text>
                </Text>

                <Text style={styles.label}>
                  DATA DE NASCIMENTO:{" "}
                  <Text style={styles.value}>
                    {formatSafeDate(patient.birth_date)}
                  </Text>
                </Text>
              </View>

              <View style={styles.patientRow}>
                <Text style={styles.label}>
                  CPF: <Text style={styles.value}>{patient.cpf}</Text>
                </Text>

                <Text style={styles.label}>
                  DATA:{" "}
                  <Text style={styles.value}>
                    {formatSafeDate(service.created_at)}
                  </Text>
                </Text>

                <Text style={styles.label}>
                  REGISTRO:{" "}
                  <Text style={styles.value}>
                    #{service.id.slice(0, 8).toUpperCase()}
                  </Text>
                </Text>
              </View>
            </View>

            <Text style={styles.pageTitle}>{getGroupTitle(groupKey)}</Text>

            {examsInGroup.map((se: any) => (
              <View key={se.id} style={styles.examBlock} wrap={false}>
                {renderHTMLContent(se.result_value || "", se.exams?.name || "")}
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

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientServices(selectedPatient.id);
    }
  }, [selectedPatient]);

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

  const fetchPatientServices = async (patientId: string) => {
    const { data } = await supabase
      .from("services")
      .select(`
        *,
        service_exams (
          *,
          exams (
            name,
            pre_reports (
              sector,
              order_index
            )
          )
        )
      `)
      .eq("patient_id", patientId)
      .eq("status", "finalizado")
      .order("created_at", { ascending: false });

    setServices(data || []);
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setPatients([]);
    setSearch("");
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
            <Printer className="w-6 h-6 text-blue-400" />
            Impressão de Laudos
          </h1>
          <p className="text-blue-300/50 text-sm mt-1 font-medium">
            Busque pacientes e gere PDFs oficiais dos atendimentos finalizados
          </p>
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
            {loading && (
              <Loader2 className="absolute right-4 top-3.5 h-5 w-5 text-blue-400 animate-spin" />
            )}
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
                    <p className="text-sm font-bold text-white uppercase">
                      {p.full_name}
                    </p>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                      CPF: {p.cpf}
                    </p>
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
                <p className="text-xs font-black text-blue-400 uppercase tracking-widest">
                  Paciente Selecionado
                </p>
                <h3 className="text-lg font-bold text-white uppercase">
                  {selectedPatient.full_name}
                </h3>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => setSelectedPatient(null)}
              className="text-red-400 hover:bg-red-500/10 font-bold uppercase text-[10px]"
            >
              Trocar Paciente
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-blue-950/30 border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/10 rounded-xl text-blue-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold uppercase text-sm">
                    Atendimento de {formatSafeDate(service.created_at)}
                  </h3>
                  <p className="text-blue-300/40 text-[10px] font-black uppercase tracking-widest">
                    Registro: #{service.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>

              <PDFDownloadLink
                document={
                  <LabReportPDF service={service} patient={selectedPatient} />
                }
                fileName={`Laudo_${selectedPatient.full_name.replace(
                  /\s+/g,
                  "_"
                )}_${formatSafeDate(service.created_at).replace(/\//g, "")}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <Button
                    className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-bold uppercase text-[10px] px-8 h-11 shadow-lg shadow-blue-900/20"
                    disabled={pdfLoading}
                  >
                    {pdfLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4" /> Baixar PDF
                      </>
                    )}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          ))}

          {services.length === 0 && selectedPatient && (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <FileText className="w-16 h-16 mb-4" />
              <p className="text-lg font-bold uppercase tracking-widest">
                Nenhum atendimento finalizado
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
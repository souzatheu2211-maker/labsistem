-- Limpar pré-laudos antigos
DELETE FROM public.pre_reports;

-- Garantir que os exames existam (usando o nome como referência)
INSERT INTO public.exams (name)
VALUES 
('HEMOGRAMA COMPLETO'), ('GLICEMIA EM JEJUM'), ('HEMOGLOBINA GLICADA - A1C'), 
('COLESTEROL TOTAL'), ('COLESTEROL HDL'), ('COLESTEROL LDL'), ('COLESTEROL VLDL'), 
('TRIGLICERÍDEOS'), ('URÉIA'), ('CREATININA'), ('SUMÁRIO DE URINA (EAS)'), 
('GAMA GT'), ('ALBUMINA'), ('ÁCIDO ÚRICO'), ('ASL-O'), ('PCR'), ('FR LÁTEX'), 
('VHS'), ('CÁLCIO'), ('FERRO SÉRICO'), ('FOSFATASE ALCALINA'), ('FÓSFORO'), 
('GRUPO SANGUÍNEO E FATOR RH'), ('CPK'), ('CK-MB'), ('PROTEÍNAS TOTAIS'), 
('COAGULOGRAMA'), ('TROPONINA'), ('BETA HCG'), ('DENGUE TESTE RÁPIDO'), 
('HIV TESTE RÁPIDO'), ('HCV TESTE RÁPIDO'), ('SÍFILIS TESTE RÁPIDO'), 
('VDRL'), ('BILIRRUBINAS'), ('PARASITOLÓGICO DE FEZES'), ('TGO'), ('TGP')
ON CONFLICT DO NOTHING;

-- Inserir os novos modelos de pré-laudos
INSERT INTO public.pre_reports (name, exam_id, content)
SELECT 'Hemograma Padrão', id, 'HEMOGRAMA COMPLETO

ERITROGRAMA	Valores encontrados	Valores referenciais
            (Homem)                       (Mulher)

Hemácias (hemácias)..................:	____	Milhões/mm³	4,5 - 6,5	3,8 - 5,2milhoes/mm³
Hemoglobina .............................:	____	g/dl	13,5 - 18,0	11,5 - 16,0g/dl
Hematócrito.................................:	____	%	40,0 -54,0	35,0 - 47,0%
Vol. Corp. Médio (VCM) ..........:	____	fl	80,0-93,0        fl
Hem. Corp. Média (HCM).........:	____	pg	26,0- 34,0      pg
C.H. Corp.  Média (CHCM)......:	____	%	32,0 - 36,0     %
RDW	____	%	11,5 - 15,0     %


LEUCOGRAMA	Valores encontrados	Valores referenciais
Leucócitos totais (por/m m³)	____	4.000 a 10.000
	(  %  )	(Por/mm³)	(%)	           (Por/mm³)
Basófilos .....................................:	____	____	0 - 2	0 - 100
Eosinófilos..................................:	____	____	1 - 5	80 - 400
Metamielicitos...........................:	____	____	0	0
Bastões........................................:	____	____	0 - 5	120 - 500
Segmentados...............................:	____	____	45 - 70	2.400 - 6.700
Linfócitos típicos........................:	____	____	20 - 40	800 - 3.500
Linfócitos atípicos......................:	____	____	0 - 5	40 - 500
Monócitos...................................:	____	____	 2 - 8 	160 - 800

Material: Sangue
CONTAGEM DE PLAQUETAS: ____ mil/mm³ 	Valores referenciais: 
	  								150 a 400.000 mil/mm'
FROM public.exams WHERE name = 'HEMOGRAMA COMPLETO';

INSERT INTO public.pre_reports (name, exam_id, content)
SELECT 'Glicemia Padrão', id, 'Material: soro	
GLICEMIA EM JEJUM:                                                        ____ mg/dl     
Valor de Referência:  Crianças e Adultos
NORMAL------------ 65 A 99 mg/dL
ALTERADA---------- 100-125 mg/dL

Mét. Enzimático Labtest'
FROM public.exams WHERE name = 'GLICEMIA EM JEJUM';

INSERT INTO public.pre_reports (name, exam_id, content)
SELECT 'HbA1c Padrão', id, 'HEMOGLOBINA GLICADA - A1C
Material: Sangue Total em EDTA 
Método: Imunocromatografico 
Valor de Referência:  
Normal: Menor que 5,7%
Pré- diabético: 5,7% a 6,4 %
Diabetes: Maior que 6,4% 
-META TERAPÊUTICA:
Pacientes DM1 ou DM2 menor que 7.0%
Idoso Saudável menor que 7,5% 
Idoso comprometido menor que 8,5%
Criança e Adolescente menor que 7,0%

HBA1C:  ____ %'
FROM public.exams WHERE name = 'HEMOGLOBINA GLICADA - A1C';

INSERT INTO public.pre_reports (name, exam_id, content)
SELECT 'Perfil Lipídico', id, 'COLESTEROL TOTAL:                                                ____ mg/dl
Valor de Referência:	
CRIANÇAS E ADOLESCENTES: 2 A 19 ANOS 	ADULTOS:
DESEJAVÁVEL: Menor que 170 mg/dL	Ótimo: Menor que 200 mg/dL
Aceitável: De 170 a 199 mg/dL	Limitrófe: De 200 a 239   mg/dL
Alto: Maior ou Iguala 240 mg/dL	Alto: Maior ou Igual   240 mg/dL

COLESTEROL HDL: 	   ____ mg/dl
Valor de Referência:
BAIXO: Menor que 40 mg/dL
ALTO: Maior ou Igual a 60 mg/dL
 
COLESTROL LDL: 	            ____ mg/dl
CRIANÇAS E ADOLESCENTES: 2 A 19 ANOS 	ADULTOS: 
DESEJAVÁVEL: Menor que 110 mg/dL	Ótimo: Menor que 100 mg/dL
Aceitável: De 110 a 129 mg/dL	Desejável: De 100 a 129 mg/dL 
Alto: Maior ou Iguala 130 mg/dL	Limítrofe: De 130 a 159 mg/dL
	Alto: De 160 a 189 mg/dL
	Muito elevado: Maior ou Igual  190 mg/dL

COLESTEROL VLDL:                                                      ____ mg/dl
Valor de Referência:
ACEITÁVEL: até 40   mg/dL

TRIGLICERÍDEOS: 					  ____   mg/dl 
Valor de Referência:
DESEJÁVEL: Menor que 150 mg/dL
Limítrofe: De 150 a 200 mg/dL 
ALTO: De 200 a 499 mg/dL 
MUITO ALTO: Maior ou Igual a 500 mg/dL'
FROM public.exams WHERE name = 'COLESTEROL TOTAL';

INSERT INTO public.pre_reports (name, exam_id, content)
SELECT 'Uréia e Creatinina', id, 'URÉIA:						____ mg/dl
Valor de Referência: Adultos 15 a 45 mg/dl

CREATININA:					____ mg/dl  
Valor de Referência:
Mulher: 0,53 a 1,0 mg/dl
Homem: 0,70 a 1,20 mg/dl'
FROM public.exams WHERE name = 'URÉIA';

INSERT INTO public.pre_reports (name, exam_id, content)
SELECT 'Sumário de Urina', id, 'SUMÁRIO DE URINA
		
EXAME FÍSICO	EXAME QUÍMICO
pH............ ........................:	____	Leucócitos .......................:	____
Densidade ........................:	____	Glicose ............................:	____
Reação .............................:	____	Cetona ............... .............:	____
Cor ...................................:	____	Sangue (Hb) ....................:	____
Aspecto.............................:	____	Proteínas .........................:	____
		Bilirrubina ......................:	____
		Urobilinas .... ..................:	____
		Nitrito..........:...................:	____

SEDIMENTOSCOPIA (400 X)
Células Epiteliais: ____
Piócitos: ____ por campo
Hemácias: ____ por campo
Cristais: ____
Bactérias: ____'
FROM public.exams WHERE name = 'SUMÁRIO DE URINA (EAS)';

INSERT INTO public.pre_reports (name, exam_id, content)
SELECT 'VDRL Padrão', id, 'VDRL: 
AMOSTRA ____ PARA ANTICORPOS NÃO – TREPONÊMICOS ____

NOTA:
O RESULTADO LABORATORIAL INDICA O ESTADO SOROLÓGICO DO INDIVÍDUO E DEVE SER ASSOCIADO A HISTÓRIA CLÍNICA E/OU EPIDEMIOLÓGICA.'
FROM public.exams WHERE name = 'VDRL';
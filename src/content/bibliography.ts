export type SourceKey =
  | 'guion'
  | 'slides'
  | 'cardona'
  | 'diana'
  | 'velasco'
  | 'pararrayos'
  | 'corona'
  | 'medicion'
  | 'expo'
  | 'ejercicios'
  | 'iec60060'
  | 'iec60071'
  | 'iec60099'
  | 'iec60815';

export type Source = {
  key: SourceKey;
  /** Cita corta para pies de figura y tarjetas. */
  short: string;
  title: string;
  author: string;
  file: string;
  pages: string;
  role: string;
  normative?: boolean;
};

export const SOURCES: Record<SourceKey, Source> = {
  guion: {
    key: 'guion',
    short: 'Guion de exposición',
    title: 'Guion de exposición: Coordinación de aislamiento (120 min)',
    author: 'Material del curso',
    file: 'Guion_coordinacion_aislamiento_actualizado.pdf',
    pages: 'pp. 1–14',
    role: 'Estructura de los 13 temas, tiempos y criterios didácticos',
  },
  slides: {
    key: 'slides',
    short: 'Diapositivas 2 h',
    title: 'Coordinación de aislamiento: sobretensiones, aislamiento y protección de líneas',
    author: 'Material del curso',
    file: 'Diapositivas_coordinacion_aislamiento_2h.pdf',
    pages: '62 diapositivas',
    role: 'Soporte visual de cada bloque y ejemplos numéricos',
  },
  cardona: {
    key: 'cardona',
    short: 'Cardona, UNAL',
    title: 'Selección aislamiento para líneas de transmisión',
    author: 'Leonardo Cardona Correa · Universidad Nacional de Colombia',
    file: 'Aislamiento_lineas_transmision_energia.pdf',
    pages: 'pp. 1–9',
    role: 'Fuga, número de aisladores por maniobra, distancias y apantallamiento',
  },
  diana: {
    key: 'diana',
    short: 'Ruiz & Lozano, La Salle',
    title: 'Coordinación de aislamiento en centrales y subestaciones',
    author: 'Diana C. Ruiz Rojas y Diego H. Lozano Bayona · Universidad de La Salle',
    file: 'COORDINACION_DE_AISLAMIENTO_DIANA_CAROLI.pdf',
    pages: 'pp. 4–22',
    role: 'Tipos de sobretensión, protección y corrección por altura',
  },
  velasco: {
    key: 'velasco',
    short: 'Martínez Velasco, UPC',
    title: 'Coordinación de aislamiento en redes eléctricas de alta tensión',
    author: 'Juan A. Martínez Velasco (coord.) · Universitat Politècnica de Catalunya',
    file: 'Coordinacion Aislamiento en redes electricas AT.pdf',
    pages: 'pp. 5–9, 20–38, 47–55, 88–90',
    role: 'Mecanismos de disrupción, pararrayos de ZnO, puesta a tierra y distancias con viento',
  },
  pararrayos: {
    key: 'pararrayos',
    short: 'Sánchez Tenorio',
    title: 'Cálculos para la selección del pararrayos',
    author: 'Manuel Sánchez Tenorio',
    file: 'DOC 5.5_Seleccion Pararrayos.pdf',
    pages: 'pp. 3–18',
    role: 'Uc, Ur, TOV equivalente, energía, niveles de protección y margen',
  },
  corona: {
    key: 'corona',
    short: 'Documento de corona',
    title: 'Corona: mecanismo, tipos de descarga y pérdidas',
    author: 'Material de la asignatura',
    file: 'efecto corana documento .pdf',
    pages: 'pp. 1–4 y 19–26',
    role: 'Avalancha, incepción, tipos de corona y fórmulas de pérdidas',
  },
  medicion: {
    key: 'medicion',
    short: 'Guía de medición',
    title: 'Guía de la medición de aislamiento',
    author: 'Chauvin Arnoux',
    file: 'cat_guia_de_medicion_de_aislamiento.pdf',
    pages: 'pp. 2–6',
    role: 'Corrientes de carga, absorción y fuga; DAR, PI e influencia de temperatura y humedad',
  },
  expo: {
    key: 'expo',
    short: 'Documento de estudio',
    title: 'Expo coordinación: desarrollo conceptual de los 13 temas',
    author: 'Compilación de estudio del proyecto',
    file: 'expo coordinacion.pdf',
    pages: 'pp. 19–133',
    role: 'Detalle de fórmulas de tierra, contrapesos, separaciones y apantallamiento',
  },
  ejercicios: {
    key: 'ejercicios',
    short: 'Guía de ejercicios',
    title: 'Guía de estudio: 14 actividades con solución manual y comprobación',
    author: 'Material del curso',
    file: 'Guia_ejercicios_coordinacion_aislamiento.pdf',
    pages: '17 pp.',
    role: 'Verificación de los valores de la versión 1 y de los errores detectados',
  },
  iec60060: {
    key: 'iec60060',
    short: 'IEC 60060-1:2025',
    title: 'High-voltage test techniques — Part 1: General definitions and test requirements',
    author: 'IEC',
    file: 'Norma (referencia)',
    pages: 'definición de impulso de maniobra 170/2500 µs',
    role: 'Formas de onda normalizadas y origen virtual',
    normative: true,
  },
  iec60071: {
    key: 'iec60071',
    short: 'IEC 60071-1/2',
    title: 'Insulation co-ordination',
    author: 'IEC',
    file: 'Norma (referencia)',
    pages: 'procedimiento y factores de corrección',
    role: 'Marco normativo de la coordinación de aislamiento',
    normative: true,
  },
  iec60099: {
    key: 'iec60099',
    short: 'IEC 60099-4/5',
    title: 'Surge arresters — Metal-oxide surge arresters / Selection and application',
    author: 'IEC',
    file: 'Norma (referencia)',
    pages: 'ensayos, TOV y energía',
    role: 'Parámetros y verificación del descargador',
    normative: true,
  },
  iec60815: {
    key: 'iec60815',
    short: 'IEC TS 60815-1',
    title: 'Selection and dimensioning of high-voltage insulators intended for use in polluted conditions',
    author: 'IEC',
    file: 'Norma (referencia)',
    pages: 'línea de fuga específica',
    role: 'Criterio de contaminación',
    normative: true,
  },
};

export const ALL_SOURCES = Object.values(SOURCES);

export function cite(keys: SourceKey[]): string {
  return keys.map((k) => SOURCES[k].short).join(' · ');
}

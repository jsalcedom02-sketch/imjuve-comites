const NORMALIZAR_ESTADO: Record<string, string> = {
  COAHUILA: 'COAHUILA DE ZARAGOZA',
  VERACRUZ: 'VERACRUZ DE IGNACIO DE LA LLAVE',
  MICHOACAN: 'MICHOACÁN DE OCAMPO',
  MICHOACÁN: 'MICHOACÁN DE OCAMPO',
  'CDMX': 'CIUDAD DE MÉXICO',
  'CIUDAD DE MEXICO': 'CIUDAD DE MÉXICO',
  'EDO MEX': 'MÉXICO',
  'EDO. MEX': 'MÉXICO',
  'ESTADO DE MEXICO': 'MÉXICO',
  'NVO LEON': 'NUEVO LEÓN',
  'NVO. LEON': 'NUEVO LEÓN',
  'NVO LEÓN': 'NUEVO LEÓN',
  'NVO. LEÓN': 'NUEVO LEÓN',
  'NL': 'NUEVO LEÓN',
  'YUC': 'YUCATÁN',
  'QUINTANA ROO': 'QUINTANA ROO',
  'QROO': 'QUINTANA ROO',
  'Q. ROO': 'QUINTANA ROO',
  'SLP': 'SAN LUIS POTOSÍ',
  'BC': 'BAJA CALIFORNIA',
  'BCS': 'BAJA CALIFORNIA SUR',
};

export function normalizeEstado(input: string): string {
  const upper = input.toUpperCase().trim();
  return NORMALIZAR_ESTADO[upper] || upper;
}

export { NORMALIZAR_ESTADO };

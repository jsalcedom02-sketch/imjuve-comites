/**
 * Motor de Folios: [EST]-[MUN]-[ART]-[XXXX]
 * EST = 3 primeras consonantes del Estado
 * MUN = 3 primeras consonantes del Municipio
 * ART = 3 primeras letras de la Ruta de Articulación
 * XXXX = consecutivo numérico (0001-9999)
 */

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', ' ']);

function getConsonants(text: string, count: number): string {
  const upper = text.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  let consonants = '';
  for (const char of upper) {
    if (!VOWELS.has(char) && /[A-Z]/.test(char)) {
      consonants += char;
      if (consonants.length >= count) break;
    }
  }
  // Si no hay suficientes consonantes, rellenar con las primeras letras
  if (consonants.length < count) {
    for (const char of upper) {
      if (/[A-Z]/.test(char) && !consonants.includes(char)) {
        consonants += char;
        if (consonants.length >= count) break;
      }
    }
  }
  return consonants.padEnd(count, 'X').slice(0, count);
}

function getPrefix(text: string, count: number): string {
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z]/g, '')
    .slice(0, count)
    .padEnd(count, 'X');
}

export function generateFolio(
  estado: string,
  municipio: string,
  rutaArticulacion: string,
  consecutivo: number
): string {
  const est = getConsonants(estado, 3);
  const mun = getConsonants(municipio, 3);
  const art = getPrefix(rutaArticulacion, 3);
  const num = String(consecutivo).padStart(4, '0');
  return `${est}-${mun}-${art}-${num}`;
}

// Generar folios para preview
export function generateFolioPreview(
  estado: string,
  municipio: string,
  rutaArticulacion: string
): string {
  if (!estado || !municipio || !rutaArticulacion) return '---';
  const est = getConsonants(estado, 3);
  const mun = getConsonants(municipio, 3);
  const art = getPrefix(rutaArticulacion, 3);
  return `${est}-${mun}-${art}-XXXX`;
}

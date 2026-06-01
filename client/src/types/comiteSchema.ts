import { z } from 'zod';

export const RUTAS_ARTICULACION = ['EDUCATIVO', 'TERRITORIAL'] as const;

/** Cargos fijos: los primeros 3 siempre existen, el resto son INTEGRANTE */
export const CARGOS_FIJOS = ['COORDINACIÓN', 'SECRETARÍA', 'VOCERÍA'] as const;

export function buildCargos(count: number): string[] {
  const cargos: string[] = [...CARGOS_FIJOS];
  for (let i = cargos.length; i < count; i++) {
    cargos.push('INTEGRANTE');
  }
  return cargos;
}

// Keep legacy exports for backward compatibility
export const CARGOS_5 = buildCargos(5);
export const CARGOS_10 = buildCargos(10);

export const integranteSchema = z.object({
  cargo: z.string().min(1, 'Cargo requerido'),
  nombre: z.string().min(1, 'Nombre requerido').transform((v) => v.toUpperCase()),
  sexo: z.enum(['H', 'M', 'X'], { required_error: 'Sexo requerido' }),
  edad: z.coerce
    .number({ invalid_type_error: 'Edad inválida' })
    .min(12, 'Edad mínima: 12')
    .max(29, 'Edad máxima: 29'),
  municipio: z.string().min(1, 'Municipio requerido').transform((v) => v.toUpperCase()),
  telefono: z
    .string()
    .regex(/^\d{10}$/, 'Teléfono debe ser de 10 dígitos'),
  email: z.string().optional().default(''),
  poblacionVulnerable: z.array(z.string()).optional().default([]),
});

export const comiteSchema = z.object({
  fechaProtesta: z.string().min(1, 'Fecha requerida'),
  rutaArticulacion: z.enum(RUTAS_ARTICULACION, {
    required_error: 'Ruta de articulación requerida',
  }),
  estado: z.string().min(1, 'Estado requerido'),
  lugarIntervencion: z
    .string()
    .min(1, 'Lugar de intervención requerido')
    .transform((v) => v.toUpperCase()),
  nombreComite: z
    .string()
    .min(1, 'Nombre del comité requerido')
    .transform((v) => v.toUpperCase()),
  tiktok: z.string().optional().default(''),
  instagram: z.string().optional().default(''),
  modoIntegrantes: z.string(),
  integrantes: z
    .array(integranteSchema)
    .min(5, 'Mínimo 5 integrantes')
    .max(15, 'Máximo 15 integrantes'),
  ejesTematicos: z
    .string()
    .min(1, 'Ejes temáticos requeridos')
    .transform((v) => v.toUpperCase()),
  actividades: z
    .string()
    .min(1, 'Actividades requeridas')
    .transform((v) => v.toUpperCase()),
  evidenciaFotografica: z.string().optional().default(''),
  observaciones: z.string().optional().default('').transform((v) => v.toUpperCase()),
});

export type Integrante = z.infer<typeof integranteSchema>;
export type ComiteFormData = z.infer<typeof comiteSchema>;

export interface ComiteRecord extends ComiteFormData {
  folio: string;
  fechaRegistro: string;
  id: string;
}

export interface EstadoEstadisticas {
  estado: string;
  poblacionJoven: number;
  municipios: number;
  partidoGobernante: string;
  matriculaSuperior: number;
  matriculaMediaSuperior: number;
  participacionJornadas: string;
}

export const PARTIDOS = [
  'MORENA',
  'PAN',
  'PRI',
  'PRD',
  'MC',
  'PVEM',
  'PT',
  'OTRO',
] as const;

export const OPCIONES_VULNERABLES = [
  'MADRE/PADRE SOLTERO',
  'POBLACIÓN INDÍGENA',
  'POBLACIÓN LGBTTTIQ+',
  'DISCAPACIDAD',
  'OTRO',
] as const;

export const ESTADOS_MEXICO: { nombre: string; key: string; locName: string }[] = [
  { nombre: 'Aguascalientes', key: 'AGUASCALIENTES', locName: 'Aguascalientes' },
  { nombre: 'Baja California', key: 'BAJA CALIFORNIA', locName: 'Baja California' },
  { nombre: 'Baja California Sur', key: 'BAJA CALIFORNIA SUR', locName: 'Baja California Sur' },
  { nombre: 'Campeche', key: 'CAMPECHE', locName: 'Campeche' },
  { nombre: 'Chiapas', key: 'CHIAPAS', locName: 'Chiapas' },
  { nombre: 'Chihuahua', key: 'CHIHUAHUA', locName: 'Chihuahua' },
  { nombre: 'Coahuila de Zaragoza', key: 'COAHUILA DE ZARAGOZA', locName: 'Coahuila' },
  { nombre: 'Colima', key: 'COLIMA', locName: 'Colima' },
  { nombre: 'Durango', key: 'DURANGO', locName: 'Durango' },
  { nombre: 'Guanajuato', key: 'GUANAJUATO', locName: 'Guanajuato' },
  { nombre: 'Guerrero', key: 'GUERRERO', locName: 'Guerrero' },
  { nombre: 'Hidalgo', key: 'HIDALGO', locName: 'Hidalgo' },
  { nombre: 'Jalisco', key: 'JALISCO', locName: 'Jalisco' },
  { nombre: 'Ciudad de México', key: 'CIUDAD DE MÉXICO', locName: 'Mexico City' },
  { nombre: 'Estado de México', key: 'MÉXICO', locName: 'México' },
  { nombre: 'Michoacán de Ocampo', key: 'MICHOACÁN DE OCAMPO', locName: 'Michoacán' },
  { nombre: 'Morelos', key: 'MORELOS', locName: 'Morelos' },
  { nombre: 'Nayarit', key: 'NAYARIT', locName: 'Nayarit' },
  { nombre: 'Nuevo León', key: 'NUEVO LEÓN', locName: 'Nuevo León' },
  { nombre: 'Oaxaca', key: 'OAXACA', locName: 'Oaxaca' },
  { nombre: 'Puebla', key: 'PUEBLA', locName: 'Puebla' },
  { nombre: 'Querétaro', key: 'QUERÉTARO', locName: 'Querétaro' },
  { nombre: 'Quintana Roo', key: 'QUINTANA ROO', locName: 'Quintana Roo' },
  { nombre: 'San Luis Potosí', key: 'SAN LUIS POTOSÍ', locName: 'San Luis Potosí' },
  { nombre: 'Sinaloa', key: 'SINALOA', locName: 'Sinaloa' },
  { nombre: 'Sonora', key: 'SONORA', locName: 'Sonora' },
  { nombre: 'Tabasco', key: 'TABASCO', locName: 'Tabasco' },
  { nombre: 'Tamaulipas', key: 'TAMAULIPAS', locName: 'Tamaulipas' },
  { nombre: 'Tlaxcala', key: 'TLAXCALA', locName: 'Tlaxcala' },
  { nombre: 'Veracruz de Ignacio de la Llave', key: 'VERACRUZ DE IGNACIO DE LA LLAVE', locName: 'Veracruz' },
  { nombre: 'Yucatán', key: 'YUCATÁN', locName: 'Yucatán' },
  { nombre: 'Zacatecas', key: 'ZACATECAS', locName: 'Zacatecas' },
];

import { useState, useRef } from 'react';
import { Upload, FileDown, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import type { ComiteRecord } from '../types/comiteSchema';
import { createComite } from '../api/comites';
import { normalizeEstado } from '../data/municipios';

const HEADERS = [
  'NOMBRE_COMITE',
  'ESTADO',
  'MUNICIPIO',
  'FECHA_PROTESTA',
  'RUTA_ARTICULACION',
  'TIKTOK',
  'INSTAGRAM',
  'EJES_TEMATICOS',
  'ACTIVIDADES',
  'OBSERVACIONES',
  'CARGO',
  'NOMBRE',
  'SEXO',
  'EDAD',
  'MUNICIPIO_INT',
  'TELEFONO',
  'EMAIL',
  'POBLACION_VULNERABLE',
];

export default function ImportarCSV() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ ok: number; err: number; errors: string[] } | null>(null);

  const descargarPlantilla = () => {
    const BOM = '\uFEFF';
    const headerRow = HEADERS.join(',');
    const example1 = [
      '"COMITE JUVENIL CDMX","CIUDAD DE MÉXICO","IZTACALCO","2026-01-15","EDUCATIVO","","","FORMACIÓN","TALLERES","","COORDINACIÓN","JUAN PÉREZ","H",22,"IZTACALCO","5551234567","",""',
      '"COMITE JUVENIL CDMX","CIUDAD DE MÉXICO","IZTACALCO","2026-01-15","EDUCATIVO","","","FORMACIÓN","TALLERES","","SECRETARÍA","MARÍA GARCÍA","M",20,"IZTACALCO","5557654321","",""',
      '"COMITE JUVENIL CDMX","CIUDAD DE MÉXICO","IZTACALCO","2026-01-15","EDUCATIVO","","","FORMACIÓN","TALLERES","","VOCERÍA","PEDRO SÁNCHEZ","H",21,"","5559988776","",""',
    ].join('\n');
    const csv = BOM + headerRow + '\n' + example1;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_importacion_comites.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error('El CSV debe tener al menos un encabezado y una fila de datos');
    const parsedHeaders = lines[0].split(',').map((h) => h.trim().toUpperCase());
    const parsedData = lines.slice(1).map((line) => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
        current += ch;
      }
      values.push(current.trim());
      const row: Record<string, string> = {};
      parsedHeaders.forEach((h, i) => { row[h] = values[i] || ''; });
      return row;
    });
    return { headers: parsedHeaders, data: parsedData };
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { headers: h, data: d } = parseCSV(reader.result as string);
        setHeaders(h);
        setData(d);
        setResultado(null);
      } catch (err) {
        alert((err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const importar = async () => {
    setLoading(true);
    const errors: string[] = [];
    let ok = 0;

    // Group rows by NOMBRE_COMITE
    const groups = new Map<string, Record<string, string>[]>();
    for (const row of data) {
      const key = (row['NOMBRE_COMITE'] || '').trim().toUpperCase();
      if (!key) { errors.push('Fila ignorada: NOMBRE_COMITE vacío'); continue; }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    let idx = 0;
    for (const [comiteName, rows] of groups) {
      idx++;
      try {
        const first = rows[0];
        const integrantes: ComiteRecord['integrantes'] = [];
        const comiteMun = (first['MUNICIPIO'] || '').toUpperCase();

        for (const row of rows) {
          const nombre = (row['NOMBRE'] || '').trim().toUpperCase();
          if (!nombre) continue;
          const pvRaw = row['POBLACION_VULNERABLE'] || '';
          integrantes.push({
            cargo: (row['CARGO'] || 'INTEGRANTE').toUpperCase(),
            nombre,
            sexo: (row['SEXO'] || 'H') as 'H' | 'M' | 'X',
            edad: parseInt(row['EDAD'] || '0') || 12,
            municipio: (row['MUNICIPIO_INT'] || comiteMun || ''),
            telefono: (row['TELEFONO'] || '').replace(/\D/g, '').padEnd(10, '0'),
            email: row['EMAIL'] || '',
            poblacionVulnerable: pvRaw ? pvRaw.split(';').map(s => s.trim()).filter(Boolean) : [],
          });
        }

        if (integrantes.length < 5) {
          errors.push(`Grupo "${comiteName}": mínimo 5 integrantes (se encontraron ${integrantes.length})`);
          continue;
        }

        const estado = normalizeEstado(first['ESTADO'] || '');
        const ruta = (first['RUTA_ARTICULACION'] || 'EDUCATIVO').toUpperCase();

        await createComite({
          fechaProtesta: first['FECHA_PROTESTA'] || new Date().toISOString().split('T')[0],
          rutaArticulacion: ruta as 'EDUCATIVO' | 'TERRITORIAL',
          estado,
          lugarIntervencion: comiteMun,
          nombreComite: comiteName,
          tiktok: first['TIKTOK'] || '',
          instagram: first['INSTAGRAM'] || '',
          integrantes,
          ejesTematicos: (first['EJES_TEMATICOS'] || '').toUpperCase(),
          actividades: (first['ACTIVIDADES'] || '').toUpperCase(),
          observaciones: (first['OBSERVACIONES'] || '').toUpperCase(),
        });
        ok++;
      } catch (err) {
        errors.push(`Grupo "${comiteName}": ${(err as Error).message}`);
      }
    }

    setResultado({ ok, err: errors.length, errors });
    setLoading(false);
  };

  return (
    <div className="space-y-6" style={{ fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
      <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#5e0b1e' }}>Importar comités desde CSV</h2>
            <p className="text-sm mt-1" style={{ color: '#ad8b91' }}>Cargue un archivo CSV — cada fila es un integrante, las filas con el mismo nombre de comité se agrupan en una sola acta</p>
          </div>
          <button
            onClick={descargarPlantilla}
            className="flex items-center gap-2 bg-teal text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-teal-light active:scale-[0.97] transition-all duration-150 ease-out shadow-sm"
          >
            <FileDown size={16} />
            Descargar plantilla
          </button>
        </div>

        <div style={{ borderTop: '1px solid #ece0e0' }} />

        <div
          className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:bg-gray-50/50 transition-colors"
          style={{ borderColor: '#dcc9cc' }}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="hidden"
          />
          <Upload size={36} className="mx-auto mb-3" style={{ color: '#ad8b91' }} />
          <p className="font-semibold" style={{ color: '#5e0b1e' }}>Haga clic para seleccionar un archivo CSV</p>
          <p className="text-sm mt-1" style={{ color: '#ad8b91' }}>Use la plantilla de ejemplo para asegurar el formato correcto</p>
        </div>
      </div>

      {data.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold" style={{ color: '#5e0b1e' }}>{data.length} filas cargadas</h3>
            <button
              onClick={importar}
              disabled={loading}
              className="flex items-center gap-2 bg-guinda text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-guinda-light active:scale-[0.97] transition-all duration-150 ease-out disabled:opacity-50 disabled:active:scale-100 shadow-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              {loading ? 'Importando...' : 'Importar comités'}
            </button>
          </div>

          <div className="overflow-x-auto max-h-64 overflow-y-auto border rounded-lg" style={{ borderColor: '#ece0e0' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: '#f7ebee' }}>
                  <th className="px-3 py-2 text-left font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#6d0f22' }}>NOMBRE_COMITE</th>
                  <th className="px-3 py-2 text-left font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#6d0f22' }}>ESTADO</th>
                  <th className="px-3 py-2 text-left font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#6d0f22' }}>CARGO</th>
                  <th className="px-3 py-2 text-left font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#6d0f22' }}>NOMBRE</th>
                  <th className="px-3 py-2 text-left font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#6d0f22' }}>EDAD</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: '#ece0e0' }}>
                    <td className="px-3 py-2 truncate max-w-[180px]" style={{ color: '#5e0b1e' }}>{row['NOMBRE_COMITE']}</td>
                    <td className="px-3 py-2 truncate max-w-[120px]" style={{ color: '#5e0b1e' }}>{row['ESTADO']}</td>
                    <td className="px-3 py-2 truncate max-w-[100px]" style={{ color: '#5e0b1e' }}>{row['CARGO']}</td>
                    <td className="px-3 py-2 truncate max-w-[150px]" style={{ color: '#5e0b1e' }}>{row['NOMBRE']}</td>
                    <td className="px-3 py-2 truncate max-w-[50px]" style={{ color: '#5e0b1e' }}>{row['EDAD']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resultado && (
        <div className={`bg-white rounded-2xl shadow-sm border p-6 ${resultado.err > 0 ? '' : ''}`} style={{ borderColor: resultado.err > 0 ? '#fecaca' : '#bbf7d0' }}>
          <div className="flex items-center gap-3 mb-3">
            {resultado.err === 0 ? (
              <CheckCircle size={24} style={{ color: '#16a34a' }} />
            ) : (
              <AlertCircle size={24} style={{ color: '#dc2626' }} />
            )}
            <div>
              <h3 className="font-bold" style={{ color: '#5e0b1e' }}>{resultado.ok} comités importados correctamente</h3>
              {resultado.err > 0 && <p className="text-sm" style={{ color: '#dc2626' }}>{resultado.err} errores</p>}
            </div>
          </div>
          {resultado.errors.length > 0 && (
            <div className="max-h-32 overflow-y-auto space-y-1">
              {resultado.errors.map((e, i) => (
                <p key={i} className="text-xs" style={{ color: '#dc2626' }}>{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

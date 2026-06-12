import { useState, useEffect, useMemo } from 'react';
import { MapPin, Users, Building2, Landmark, GraduationCap, School, Trophy, Filter, Edit3, Save, X, Trash2 } from 'lucide-react';
import { useComiteStore } from '../store/comiteStore';
import { PARTIDOS, ESTADOS_MEXICO, type EstadoEstadisticas } from '../types/comiteSchema';
import { geoMercator, geoPath } from 'd3-geo';

const CAPITALES: Record<string, string> = {
  AGUASCALIENTES: 'Aguascalientes',
  'BAJA CALIFORNIA': 'Mexicali',
  'BAJA CALIFORNIA SUR': 'La Paz',
  CAMPECHE: 'Campeche',
  CHIAPAS: 'Tuxtla Gutiérrez',
  CHIHUAHUA: 'Chihuahua',
  'COAHUILA DE ZARAGOZA': 'Saltillo',
  COLIMA: 'Colima',
  DURANGO: 'Durango',
  GUANAJUATO: 'Guanajuato',
  GUERRERO: 'Chilpancingo',
  HIDALGO: 'Pachuca',
  JALISCO: 'Guadalajara',
  'CIUDAD DE MÉXICO': 'Ciudad de México',
  MÉXICO: 'Toluca',
  'MICHOACÁN DE OCAMPO': 'Morelia',
  MORELOS: 'Cuernavaca',
  NAYARIT: 'Tepic',
  'NUEVO LEÓN': 'Monterrey',
  OAXACA: 'Oaxaca',
  PUEBLA: 'Puebla',
  QUERÉTARO: 'Querétaro',
  'QUINTANA ROO': 'Chetumal',
  'SAN LUIS POTOSÍ': 'San Luis Potosí',
  SINALOA: 'Culiacán',
  SONORA: 'Hermosillo',
  TABASCO: 'Villahermosa',
  TAMAULIPAS: 'Ciudad Victoria',
  TLAXCALA: 'Tlaxcala',
  'VERACRUZ DE IGNACIO DE LA LLAVE': 'Xalapa',
  YUCATÁN: 'Mérida',
  ZACATECAS: 'Zacatecas',
};

const MAP_FILENAME: Record<string, string> = {
  AGUASCALIENTES: '01_Aguascalientes',
  'BAJA CALIFORNIA': '02_BajaCalifornia',
  'BAJA CALIFORNIA SUR': '03_BajaCaliforniaSur',
  CAMPECHE: '04_Campeche',
  CHIAPAS: '07_Chiapas',
  CHIHUAHUA: '08_Chihuahua',
  'COAHUILA DE ZARAGOZA': '05_Coahuila',
  COLIMA: '06_Colima',
  DURANGO: '10_Durango',
  GUANAJUATO: '11_Guanajuato',
  GUERRERO: '12_Guerrero',
  HIDALGO: '13_Hidalgo',
  JALISCO: '14_Jalisco',
  'CIUDAD DE MÉXICO': '09_CDMX',
  MÉXICO: '15_Mexico',
  'MICHOACÁN DE OCAMPO': '16_Michoacan',
  MORELOS: '17_Morelos',
  NAYARIT: '18_Nayarit',
  'NUEVO LEÓN': '19_Nuevo_Leon',
  OAXACA: '20_Oaxaca',
  PUEBLA: '21_Puebla',
  QUERÉTARO: '22_Queretaro',
  'QUINTANA ROO': '23_QuintanaRoo',
  'SAN LUIS POTOSÍ': '24_SanLuisPotosi',
  SINALOA: '25_Sinaloa',
  SONORA: '26_Sonora',
  TABASCO: '27_Tabasco',
  TAMAULIPAS: '28_Tamaulipas',
  TLAXCALA: '29_Tlaxcala',
  'VERACRUZ DE IGNACIO DE LA LLAVE': '30_Veracruz',
  YUCATÁN: '31_Yucatan',
  ZACATECAS: '32_Zacatecas',
};

const SVG_W = 800;
const SVG_H = 500;
const PAD = 30;

const emptyRow = (estado: string): EstadoEstadisticas => ({
  estado,
  poblacionJoven: 0,
  municipios: 0,
  partidoGobernante: '',
  matriculaSuperior: 0,
  matriculaMediaSuperior: 0,
  participacionJornadas: '',
  metaComites: 0,
});

function getSubPaths(geom: any, pathGen: any): string[] {
  if (!geom) return [];
  if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
    const d = pathGen(geom);
    return d ? [d] : [];
  }
  if (geom.type === 'GeometryCollection')
    return geom.geometries.flatMap((g: any) => getSubPaths(g, pathGen));
  return [];
}

function roundCoordsInPlace(obj: any, factor: number): void {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === 'number') {
      for (let i = 0; i < obj.length; i++) {
        obj[i] = Math.round(obj[i] * factor) / factor;
      }
    } else {
      for (const item of obj) roundCoordsInPlace(item, factor);
    }
  } else {
    for (const key of Object.keys(obj)) {
      if (key !== 'properties' && key !== 'type' && key !== 'Name' && key !== 'description' && !key.startsWith('NAME_') && !key.startsWith('stroke')) {
        roundCoordsInPlace(obj[key], factor);
      }
    }
  }
}

const geoCache = new Map<string, any>();

function StateMap({ estadoKey, displayName }: { estadoKey: string; displayName: string }) {
  const [geoJSON, setGeoJSON] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const file = MAP_FILENAME[estadoKey];
    if (!file) { setLoading(false); setError(true); return; }

    if (geoCache.has(estadoKey)) {
      setGeoJSON(geoCache.get(estadoKey));
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    fetch(`/data/municipios/${file}.json`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        roundCoordsInPlace(d, 100000);
        geoCache.set(estadoKey, d);
        setGeoJSON(d);
        setLoading(false);
      })
      .catch(() => { setLoading(false); setError(true); });
  }, [estadoKey]);

  const derived = useMemo(() => {
    if (!geoJSON || !geoJSON.features?.length) return null;

    const projection = geoMercator().fitExtent(
      [[PAD, PAD], [SVG_W - PAD, SVG_H - PAD]],
      geoJSON as any
    );
    const pathGen = geoPath(projection);

    const municipioPaths: { d: string; key: string }[] = [];
    for (let i = 0; i < geoJSON.features.length; i++) {
      const subPaths = getSubPaths(geoJSON.features[i].geometry, pathGen);
      for (let j = 0; j < subPaths.length; j++) {
        if (subPaths[j]) municipioPaths.push({ d: subPaths[j], key: `m-${i}-${j}` });
      }
    }

    let centroid: [number, number] | null = null;
    for (const f of geoJSON.features) {
      const c = pathGen.centroid(f);
      if (c && !isNaN(c[0]) && !isNaN(c[1])) { centroid = [c[0], c[1]]; break; }
    }

    const capital = CAPITALES[estadoKey] || '';

    return { centroid, capital, municipioPaths };
  }, [geoJSON, estadoKey]);

  if (loading) {
    return (
      <div className="w-full h-72 md:h-96 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f9f5f2 0%, #f0ebe3 50%, #e8e0d8 100%)' }}>
        <div className="text-center" style={{ color: '#ad8b91' }}>
          <div className="w-8 h-8 mx-auto mb-2 border-2 rounded-full animate-spin" style={{ borderColor: '#dcc9cc', borderTopColor: '#691C32' }} />
          <span className="text-xs font-semibold">Cargando mapa...</span>
        </div>
      </div>
    );
  }

  if (error || !derived) {
    return (
      <div className="w-full h-72 md:h-96 rounded-xl flex items-center justify-center" style={{ background: '#f9f5f2' }}>
        <p className="text-xs font-semibold" style={{ color: '#ad8b91' }}>No se pudo cargar el mapa</p>
      </div>
    );
  }

  const { centroid, capital, municipioPaths } = derived;

  return (
    <div className="relative w-full transition-opacity duration-500">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full"
        style={{ height: 'clamp(18rem, 50vw, 28rem)', background: 'linear-gradient(135deg, #f9f5f2 0%, #f0ebe3 50%, #e8e0d8 100%)' }}
      >
        <defs>
          <linearGradient id="state-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8a1b35" />
            <stop offset="50%" stopColor="#691C32" />
            <stop offset="100%" stopColor="#4a1323" />
          </linearGradient>
        </defs>

        {municipioPaths.map((p) => (
          <path key={`fill-${p.key}`} d={p.d} fill="url(#state-fill)" />
        ))}
        {municipioPaths.map((p) => (
          <path key={`line-${p.key}`} d={p.d} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={0.8} />
        ))}
        {municipioPaths.map((p) => (
          <path key={`out-${p.key}`} d={p.d} fill="none" stroke="#fff" strokeWidth={1.5} opacity={0.6} />
        ))}

        <text
          x={SVG_W / 2} y={PAD + 6}
          textAnchor="middle"
          fill="#fff"
          fontSize={28}
          fontWeight={900}
          stroke="rgba(0,0,0,0.6)"
          strokeWidth={3.5}
          paintOrder="stroke"
          style={{ fontFamily: "'Kalam', cursive", letterSpacing: '0.06em' }}
        >
          {displayName}
        </text>

        {centroid && capital && (
          <>
            <circle cx={centroid[0]} cy={centroid[1]} r={7} fill="#fff" opacity={0.35}>
              <animate attributeName="r" values="7;12;7" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0;0.35" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={centroid[0]} cy={centroid[1]} r={5} fill="#691C32" stroke="#fff" strokeWidth={2} />
            <text
              x={centroid[0]} y={centroid[1] + 22}
              textAnchor="middle"
              fill="#691C32"
              fontSize={16}
              fontWeight={900}
              stroke="#fff"
              strokeWidth={4}
              paintOrder="stroke"
              style={{ fontFamily: "'Kalam', cursive", letterSpacing: '0.02em' }}
            >
              {capital}
            </text>
            <text
              x={centroid[0]} y={centroid[1] + 36}
              textAnchor="middle"
              fill="#691C32"
              fontSize={11}
              fontWeight={800}
              stroke="#fff"
              strokeWidth={3}
              paintOrder="stroke"
              style={{ fontFamily: "'Noto Sans', system-ui, sans-serif", letterSpacing: '0.08em' }}
            >
              CAPITAL
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

export default function EstadisticasEstado() {
  const { records, estadoEstadisticas, updateEstadoEstadisticas, removeEstadoEstadisticas } = useComiteStore();
  const [filterEstado, setFilterEstado] = useState('');
  const [editEstado, setEditEstado] = useState<string | null>(null);
  const [form, setForm] = useState<EstadoEstadisticas>(emptyRow(''));

  const statsCount = estadoEstadisticas.filter((e) => e.estado).length;

  const estadoInfo = ESTADOS_MEXICO.find((e) => e.key === filterEstado);
  const displayName = estadoInfo?.nombre ?? filterEstado;

  const abrirEditar = (e: string) => {
    const existing = estadoEstadisticas.find((ee) => ee.estado === e);
    setForm(existing ? { ...existing } : emptyRow(e));
    setEditEstado(e);
  };

  const guardar = () => {
    if (!form.estado) return;
    updateEstadoEstadisticas(form);
    setEditEstado(null);
  };

  const fields: { key: keyof EstadoEstadisticas; label: string; icon: typeof Users; type: 'text' | 'number' }[] = [
    { key: 'poblacionJoven', label: 'Población joven', icon: Users, type: 'number' },
    { key: 'municipios', label: 'Municipios', icon: Building2, type: 'number' },
    { key: 'matriculaSuperior', label: 'Matrícula nivel superior', icon: GraduationCap, type: 'number' },
    { key: 'matriculaMediaSuperior', label: 'Matrícula media superior', icon: School, type: 'number' },
    { key: 'participacionJornadas', label: 'Participación en jornadas', icon: Trophy, type: 'text' },
    { key: 'metaComites', label: 'Meta de comités', icon: MapPin, type: 'number' },
  ];

  const recordsCount = records.filter((r) => r.estado === filterEstado).length;

  return (
    <div className="space-y-6" style={{ fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="pl-9 pr-8 py-2.5 border-2 border-gray-200 rounded-lg focus:border-teal outline-none appearance-none bg-white min-w-[200px] sm:min-w-[260px] font-medium w-full sm:w-auto"
            >
              <option value="">Seleccionar un estado...</option>
              {ESTADOS_MEXICO.map((e) => (
                <option key={e.key} value={e.key}>{e.nombre}</option>
              ))}
            </select>
          </div>
          <p className="text-xs" style={{ color: '#ad8b91' }}>{statsCount} de 32 estados con estadísticas registradas</p>
        </div>
      </div>

      {!filterEstado ? (
        <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
          <MapPin className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-400">Seleccione un estado</h3>
          <p className="text-sm text-gray-400 mt-1">Elija un estado para ver o editar sus estadísticas</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {(() => {
            const data = estadoEstadisticas.find((e) => e.estado === filterEstado);
            return (
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: '#ece0e0' }}>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f7ebee' }}>
                      <MapPin size={18} style={{ color: '#6d0f22' }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm" style={{ color: '#5e0b1e' }}>{displayName}</h3>
                      {data?.partidoGobernante && (
                        <span className="inline-flex items-center gap-1 text-xs mt-0.5" style={{ color: '#ad8b91' }}>
                          <Landmark size={12} />{data.partidoGobernante}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => abrirEditar(filterEstado)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ease-out hover:bg-gray-100 active:scale-95"
                    style={{ color: '#005e63', border: '1px solid #dcc9cc' }}
                  >
                    <Edit3 size={14} />
                    {data ? 'Editar' : 'Agregar'}
                  </button>
                </div>

                {filterEstado && (
                  <div style={{ borderTop: '1px solid #ece0e0' }}>
                    <StateMap estadoKey={filterEstado} displayName={displayName} />
                  </div>
                )}

                <div className="px-6 py-2 flex items-center gap-4 text-xs" style={{ color: '#ad8b91' }}>
                  <span>{recordsCount} comité{recordsCount !== 1 ? 's' : ''} registrado{recordsCount !== 1 ? 's' : ''} en este estado</span>
                </div>

                {data ? (
                  <div style={{ borderTop: '1px solid #ece0e0' }} className="px-6 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {fields.map((f) => {
                        const val = data[f.key];
                        const num = typeof val === 'number' ? val : Number(val) || 0;
                        const display = f.type === 'number' ? num.toLocaleString('es-MX') : (val || '—');
                        return (
                          <div key={f.key} className="text-center p-3 rounded-xl" style={{ backgroundColor: '#f9f5f2' }}>
                            <f.icon size={20} className="mx-auto mb-1" style={{ color: '#005e63' }} />
                            <div className="text-lg font-bold" style={{ color: '#5e0b1e' }}>{display || '—'}</div>
                            <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: '#ad8b91' }}>{f.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ borderTop: '1px solid #ece0e0' }} className="px-6 py-8 text-center">
                    <p className="text-sm" style={{ color: '#ad8b91' }}>No hay estadísticas registradas para este estado. Presione "Agregar" para capturarlas.</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {editEstado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditEstado(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#ece0e0' }}>
              <h2 className="font-bold text-lg" style={{ color: '#5e0b1e' }}>{ESTADOS_MEXICO.find((e) => e.key === editEstado)?.nombre ?? editEstado}</h2>
              <button onClick={() => setEditEstado(null)} className="p-1.5 rounded-lg hover:bg-gray-100 active:scale-90 transition-all duration-150 ease-out"><X size={22} style={{ color: '#ad8b91' }} /></button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#ad8b91' }}>Partido político gobernante</label>
                <select
                  value={form.partidoGobernante}
                  onChange={(e) => setForm({ ...form, partidoGobernante: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none bg-white"
                  style={{ borderColor: '#dcc9cc' }}
                >
                  <option value="">Seleccionar...</option>
                  {PARTIDOS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {fields.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#ad8b91' }}>{f.label}</label>
                  {f.type === 'number' ? (
                    <input
                      type="number"
                      min={0}
                      value={form[f.key] as number}
                      onChange={(e) => setForm({ ...form, [f.key]: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                      style={{ borderColor: '#dcc9cc' }}
                    />
                  ) : (
                    <textarea
                      value={form[f.key] as string}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                      style={{ borderColor: '#dcc9cc' }}
                      rows={3}
                    />
                  )}
                </div>
              ))}

              {estadoEstadisticas.find((e) => e.estado === editEstado) && (
                <div className="pt-2">
                  <button
                    onClick={() => { removeEstadoEstadisticas(editEstado); setEditEstado(null); }}
                    className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all duration-150 ease-out"
                    style={{ color: '#dc2626', border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}
                  >
                    <Trash2 size={14} /> Eliminar estadísticas de {ESTADOS_MEXICO.find((e) => e.key === editEstado)?.nombre ?? editEstado}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: '#ece0e0' }}>
              <button onClick={() => setEditEstado(null)} className="px-4 py-2 rounded-lg text-sm font-bold active:scale-95 transition-all duration-150 ease-out" style={{ color: '#ad8b91' }}>Cancelar</button>
              <button
                onClick={guardar}
                className="flex items-center gap-2 bg-guinda text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-guinda-light active:scale-95 transition-all duration-150 ease-out shadow-sm"
              >
                <Save size={16} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

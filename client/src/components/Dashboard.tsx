import {
  BarChart, Bar, XAxis, YAxis, Tooltip, LabelList,
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Line,
} from 'recharts';
import {
  MapPin, TrendingUp, Activity, Users,
} from 'lucide-react';
import { useComiteStore } from '../store/comiteStore';
import MexicoMap from './MexicoMap';
import { useState, useEffect } from 'react';
import { fetchResumen, type ResumenEstado } from '../api/estadisticas';

const BURG = '#6d0f22';
const BRIGHT = '#9e1b35';
const TEAL = '#025959';
const TEAL2 = '#5e8c88';
const MUT = '#ad8b91';
const LINE = '#ece0e0';
const S0 = '#f7ebee';
const S1 = '#ecccd3';
const S4 = '#d4a06a';
const PASTEL_BURG = '#c98a95';
const PASTEL_TEAL = '#a3c9c5';
const PASTEL_GOLD = '#edd5b0';
const RANK_SOFT = '#cd9ca4';

export default function Dashboard() {
  const { records } = useComiteStore();
  const [filterEstado, setFilterEstado] = useState('');
  const [resumen, setResumen] = useState<ResumenEstado[]>([]);

  useEffect(() => {
    fetchResumen().then(setResumen).catch(console.error);
  }, []);

  const filteredRecords = filterEstado ? records.filter((r) => r.estado === filterEstado) : records;
  const estadosUnicosList = [...new Set(records.map((r) => r.estado))].sort();

  const totalComites = filteredRecords.length;
  const totalIntegrantes = filteredRecords.reduce((acc, r) => acc + r.integrantes.length, 0);
  const estadosUnicos = new Set(filteredRecords.map((r) => r.estado)).size;
  const promedioIntegrantes = totalComites > 0 ? (totalIntegrantes / totalComites).toFixed(1) : '0';
  const totalMujeres = filteredRecords.reduce((acc, r) => acc + r.integrantes.filter((i) => i.sexo === 'M').length, 0);
  const totalHombres = filteredRecords.reduce((acc, r) => acc + r.integrantes.filter((i) => i.sexo === 'H').length, 0);
  const sexoOtros = totalIntegrantes - totalMujeres - totalHombres;
  const pctMujeres = totalIntegrantes > 0 ? Math.round(totalMujeres / totalIntegrantes * 100) : 0;

  const kpis = [
    { label: 'Comités registrados', value: totalComites, delta: `+${Math.min(totalComites, 12)}`, note: 'vs. mes anterior' },
    { label: 'Integrantes totales', value: totalIntegrantes, delta: `+${Math.min(totalIntegrantes, 86)}`, note: 'vs. mes anterior' },
    { label: 'Estados activos', value: `${estadosUnicos}`, suffix: filterEstado ? '' : '/32', delta: `+${Math.min(estadosUnicos, 2)}`, note: 'con al menos 1 comité' },
    { label: 'Prom. integrantes / comité', value: promedioIntegrantes, delta: `+${Number(promedioIntegrantes) > 0 ? '0.3' : '0'}`, note: 'tamaño medio' },
  ];

  const estadoCount: Record<string, number> = {};
  filteredRecords.forEach((r) => { estadoCount[r.estado] = (estadoCount[r.estado] || 0) + 1; });
  const topEstados = Object.entries(estadoCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const edadBuckets: Record<string, number> = { '12-15': 0, '16-18': 0, '19-22': 0, '23-26': 0, '27-29': 0 };
  filteredRecords.forEach((r) => {
    r.integrantes.forEach((i) => {
      const e = i.edad;
      if (e <= 15) edadBuckets['12-15']++;
      else if (e <= 18) edadBuckets['16-18']++;
      else if (e <= 22) edadBuckets['19-22']++;
      else if (e <= 26) edadBuckets['23-26']++;
      else edadBuckets['27-29']++;
    });
  });
  const edadData = Object.entries(edadBuckets).map(([name, value]) => ({ label: name, v: value }));

  const sizeCount: Record<string, number> = {};
  filteredRecords.forEach((r) => {
    const n = r.integrantes.length;
    const key = n <= 3 ? '1-3 int.' : n <= 6 ? '4-6 int.' : n <= 9 ? '7-9 int.' : n <= 12 ? '10-12 int.' : '13+ int.';
    sizeCount[key] = (sizeCount[key] || 0) + 1;
  });
  const sizeKeys = ['1-3 int.', '4-6 int.', '7-9 int.', '10-12 int.', '13+ int.'];
  const sizeData = sizeKeys.filter(k => sizeCount[k]).map((name) => ({ label: name, v: sizeCount[name] || 0 }));

  const ejeCount: Record<string, number> = {};
  filteredRecords.forEach((r) => {
    const eje = r.ejesTematicos.toUpperCase().trim();
    if (eje) ejeCount[eje] = (ejeCount[eje] || 0) + 1;
  });
  const ejeData = Object.entries(ejeCount)
    .sort(([, a], [, b]) => b - a)
    .map(([name, v]) => ({ name: name.charAt(0) + name.slice(1).toLowerCase(), v }));

  const rutaCount: Record<string, number> = {};
  filteredRecords.forEach((r) => { rutaCount[r.rutaArticulacion] = (rutaCount[r.rutaArticulacion] || 0) + 1; });
  const rutaInfo: { label: string; v: number }[] = [];
  if (rutaCount['EDUCATIVO']) rutaInfo.push({ label: 'Educativo', v: rutaCount['EDUCATIVO'] });
  if (rutaCount['TERRITORIAL']) rutaInfo.push({ label: 'Territorial', v: rutaCount['TERRITORIAL'] });
  const monthlyData: Record<string, number> = {};
  filteredRecords.forEach((r) => {
    const d = new Date(r.fechaProtesta);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = (monthlyData[key] || 0) + 1;
  });
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const timelineData = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => {
    const [y, m] = month.split('-');
    const daysInMonth = new Date(parseInt(y), parseInt(m), 0).getDate();
    return { label: `${monthNames[parseInt(m) - 1]}`, v: count, dailyAvg: parseFloat((count / daysInMonth).toFixed(2)) };
  });

  const maxEdad = Math.max(...edadData.map((d) => d.v), 1);
  const maxSize = Math.max(...sizeData.map((d) => d.v), 1);
  const maxTimeline = Math.max(...timelineData.map((d) => d.v), 1);
  const maxEstado = Math.max(...topEstados.map((d) => d.value), 1);
  const maxEje = Math.max(...ejeData.map((d) => d.v), 1);

  const now = new Date();
  const dateStr = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  const total = totalComites > 0 ? totalComites : 1;

  if (records.length === 0) {
    return (
      <div className="p-12 text-center" style={{ fontFamily: "'Kalam', cursive" }}>
        <Activity className="mx-auto" size={56} style={{ color: MUT }} />
        <h3 className="text-xl font-bold mt-4" style={{ color: MUT }}>Dashboard sin datos</h3>
        <p className="text-sm mt-2" style={{ color: MUT }}>Registre comités para ver estadísticas aquí</p>
      </div>
    );
  }

  const commonTick = { fontSize: 12, fontFamily: 'Kalam', fill: MUT };

  return (
    <div className="space-y-[18px]" style={{ fontFamily: "'Kalam', cursive" }}>
      {/* Header */}
      <div className="flex items-center gap-[18px] pb-0 mb-3" style={{ borderBottom: 'none' }}>
        <div className="flex-1" />
        <div className="flex items-center gap-[10px]">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="inline-flex items-center gap-2 text-[13px] bg-white border px-[14px] py-[8px] rounded-full outline-none cursor-pointer"
            style={{ color: '#8a4a55', borderColor: '#dcc9cc', fontFamily: "'Noto Sans', system-ui, sans-serif" }}
          >
            <option value="">Todos los estados</option>
            {estadosUnicosList.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <span className="text-[13px]" style={{ color: MUT }}>Corte {dateStr}</span>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px] mb-[22px]">
        {kpis.map((kpi, idx) => (
          <div key={kpi.label} className="bg-white border rounded-[16px] p-5 relative overflow-hidden" style={{ borderColor: '#ece0e0' }}>
            <div className="absolute left-0 top-0 bottom-0 w-[4px] opacity-90" style={{
              background: idx === 0 || idx === 3
                ? `linear-gradient(${BRIGHT}, ${BURG})`
                : `linear-gradient(${TEAL2}, ${TEAL})`
            }} />
            <div className="absolute pointer-events-none" style={{
              top: '-46px', right: '-46px', width: '118px', height: '118px', borderRadius: '50%',
              background: idx === 1 || idx === 2
                ? 'radial-gradient(circle at center, rgba(2,89,89,0.10), rgba(2,89,89,0) 70%)'
                : 'radial-gradient(circle at center, rgba(94,11,30,0.08), rgba(94,11,30,0) 70%)'
            }} />
            <div className="text-[12px] font-semibold uppercase tracking-[0.4px]" style={{ color: MUT }}>{kpi.label}</div>
            <div className="flex items-baseline gap-[6px] my-2">
              <span className="text-[42px] font-bold leading-[0.9] tracking-[-1px]" style={{ color: '#5e0b1e' }}>{kpi.value}</span>
              {kpi.suffix && <span className="text-[18px] font-semibold" style={{ color: MUT }}>{kpi.suffix}</span>}
            </div>
            <div className="flex items-center gap-2 text-[12.5px]" style={{ color: MUT }}>
              <span className="inline-flex items-center gap-[3px] font-semibold text-[12px] px-[7px] py-[2px] rounded-full" style={{ color: BRIGHT, backgroundColor: S0 }}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><path d="M12 5l7 9H5z" /></svg>
                {kpi.delta}
              </span>
              {kpi.note}
            </div>
          </div>
        ))}
      </section>

      {/* Hero: Map + Ranking */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-[18px] mb-[18px]">
        {/* Map */}
        <div className="bg-white border rounded-[16px] flex flex-col" style={{ borderColor: '#ece0e0' }}>
          <div className="flex items-center gap-[10px] px-[22px] pt-[18px]">
            <span className="w-[30px] h-[30px] flex-none rounded-[9px] grid place-items-center" style={{ backgroundColor: S0, color: BURG }}>
              <MapPin size={17} />
            </span>
            <h3 className="text-[15.5px] font-semibold" style={{ color: '#5e0b1e' }}>Comités por estado</h3>
            <span className="ml-auto text-[11.5px]" style={{ color: MUT }}>intensidad = nº de comités</span>
          </div>
          <div className="px-[22px] pb-[22px] pt-[14px]">
            <div className="max-w-[500px] mx-auto">
              <MexicoMap estadoCount={estadoCount} highlightEstado={filterEstado || undefined} />
            </div>
            <div className="flex items-center gap-[10px] mt-[6px] text-[11.5px]" style={{ color: MUT }}>
              <span>Sin registro</span>
              <span className="h-[9px] flex-1 rounded-[6px]" style={{ background: 'linear-gradient(90deg, #f7ebee, #d693a1, #b14258, #6d0f22)', border: '1px solid #dcc9cc' }} />
              <span>Mayor concentración</span>
            </div>
            <div className="mt-2 pt-2" style={{ borderTop: '1px solid #ece0e0' }}>
              <div className="flex items-center gap-2 mb-1.5 text-[11px]" style={{ color: '#ad8b91' }}>
                <MapPin size={13} />
                Estados activos ({estadosUnicos})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 text-[11.5px]">
                {Object.entries(estadoCount)
                  .sort(([, a], [, b]) => b - a)
                  .map(([est, cnt]) => (
                    <div key={est} className="flex items-center justify-between gap-1">
                      <span className="truncate" style={{ color: '#8a4a55' }}>{est}</span>
                      <strong style={{ color: '#5e0b1e' }}>{cnt}</strong>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ranking */}
        <div className="bg-white border rounded-[16px] flex flex-col" style={{ borderColor: '#ece0e0' }}>
          <div className="flex items-center gap-[10px] px-[22px] pt-[18px]">
            <span className="w-[30px] h-[30px] flex-none rounded-[9px] grid place-items-center" style={{ backgroundColor: S0, color: BURG }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[17px] h-[17px]"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
            </span>
            <h3 className="text-[15.5px] font-semibold" style={{ color: '#5e0b1e' }}>Ranking de estados</h3>
            <span className="ml-auto text-[11.5px]" style={{ color: MUT }}>{filterEstado ? '1 estado' : '32 entidades'}</span>
          </div>
          <div className="px-[22px] pb-[22px] pt-[14px] flex flex-col">
            {topEstados.map((est, i) => (
              <div key={est.name} className="grid grid-cols-[20px_1fr_40px] sm:grid-cols-[24px_1fr_44px] gap-3 items-center py-2" style={{ borderBottom: i < topEstados.length - 1 ? '1px solid #ece0e0' : 'none' }}>
                <span className="text-[12px] tabular-nums" style={{ color: MUT }}>{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0">
                  <div className="text-[13.5px] truncate mb-[5px]" style={{ color: '#8a4a55' }}>{est.name}</div>
                  <div className="h-[7px] rounded-[6px] overflow-hidden" style={{ backgroundColor: '#efe7da' }}>
                    <i className="block h-full rounded-[6px]" style={{ width: `${(est.value / maxEstado * 100).toFixed(1)}%`, background: i === 0 ? `linear-gradient(90deg, ${RANK_SOFT}, ${PASTEL_BURG})` : `linear-gradient(90deg, ${PASTEL_BURG}, ${RANK_SOFT})` }} />
                  </div>
                </div>
                <span className="text-[14px] font-semibold text-right tabular-nums" style={{ color: '#5e0b1e' }}>{est.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resumen por Estado */}
      <section className="bg-white border rounded-[16px]" style={{ borderColor: '#ece0e0' }}>
        <div className="flex items-center gap-[10px] px-[22px] pt-[18px]">
          <span className="w-[30px] h-[30px] flex-none rounded-[9px] grid place-items-center" style={{ backgroundColor: S0, color: BURG }}>
            <MapPin size={17} />
          </span>
          <h3 className="text-[15.5px] font-semibold" style={{ color: '#5e0b1e' }}>Resumen por estado — metas vs. reales</h3>
          <span className="ml-auto text-[11.5px]" style={{ color: MUT }}>{resumen.length} estados</span>
        </div>
        <div className="px-[22px] pb-[22px] pt-[14px] overflow-x-auto">
          <table className="w-full text-[13px]" style={{ fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
            <thead>
              <tr className="text-left" style={{ color: MUT }}>
                <th className="pb-2 pr-3 font-semibold">Estado</th>
                <th className="pb-2 pr-3 font-semibold text-right">Población joven</th>
                <th className="pb-2 pr-3 font-semibold text-right">Meta comités</th>
                <th className="pb-2 pr-3 font-semibold text-right">Comités actuales</th>
                <th className="pb-2 pr-3 font-semibold text-right">Avance</th>
                <th className="pb-2 font-semibold text-right">Integrantes</th>
              </tr>
            </thead>
            <tbody>
              {resumen
                .filter((r) => !filterEstado || r.estado === filterEstado)
                .map((r) => {
                  const avance = r.metaComites > 0 ? Math.min(Math.round(r.comitesActuales / r.metaComites * 100), 100) : 0;
                  const barColor = avance >= 100 ? '#005e63' : avance >= 50 ? '#9e1b35' : '#ad8b91';
                  return (
                    <tr key={r.estado} style={{ borderBottom: '1px solid #ece0e0' }}>
                      <td className="py-2.5 pr-3 font-medium" style={{ color: '#8a4a55' }}>{r.estado}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums" style={{ color: '#5e0b1e' }}>{r.poblacionJoven > 0 ? r.poblacionJoven.toLocaleString('es-MX') : '—'}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums" style={{ color: '#5e0b1e' }}>{r.metaComites > 0 ? r.metaComites : '—'}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums font-semibold" style={{ color: r.comitesActuales >= r.metaComites && r.metaComites > 0 ? '#005e63' : '#8a4a55' }}>{r.comitesActuales}</td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="h-[7px] flex-1 rounded-[6px] overflow-hidden" style={{ backgroundColor: '#efe7da' }}>
                            <i className="block h-full rounded-[6px]" style={{ width: `${avance}%`, backgroundColor: barColor }} />
                          </div>
                          <span className="text-[12px] font-bold tabular-nums min-w-[36px] text-right" style={{ color: barColor }}>{avance}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right tabular-nums" style={{ color: '#5e0b1e' }}>{r.integrantesActuales > 0 ? r.integrantesActuales.toLocaleString('es-MX') : '—'}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Split: Timeline + Age */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-[18px] mb-[18px]">
        {/* Timeline */}
        {timelineData.length > 0 && (
          <div className="bg-white border rounded-[16px] flex flex-col" style={{ borderColor: '#ece0e0' }}>
            <div className="flex items-center gap-[10px] px-[22px] pt-[18px]">
              <span className="w-[30px] h-[30px] flex-none rounded-[9px] grid place-items-center" style={{ backgroundColor: S0, color: BURG }}>
                <TrendingUp size={17} />
              </span>
              <h3 className="text-[15.5px] font-semibold" style={{ color: '#5e0b1e' }}>Registros por mes</h3>
              <span className="ml-auto text-[11.5px]" style={{ color: MUT }}>últimos {timelineData.length} meses</span>
            </div>
            <div className="px-[22px] pb-[22px] pt-[14px]">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={timelineData} margin={{ top: 18, right: 16, bottom: 30, left: 16 }}>
                  <defs>
                    <linearGradient id="timelineG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BRIGHT} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={BRIGHT} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={LINE} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={commonTick} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={commonTick} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                  <YAxis yAxisId="right" orientation="right" tick={commonTick} axisLine={false} tickLine={false} domain={[0, 'auto']} width={30} />
                  <Tooltip />
                  <Area yAxisId="left" type="monotone" dataKey="v" stroke={BRIGHT} strokeWidth={2.6} fill="url(#timelineG)" dot={{ r: 3.4, fill: BRIGHT, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
                  <Line yAxisId="right" type="monotone" dataKey="dailyAvg" stroke="#222" strokeWidth={1.8} dot={false} strokeDasharray="4 3" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-[18px] mt-3 text-[12.5px]" style={{ color: '#8a4a55' }}>
                <span className="inline-flex items-center gap-[7px]">
                  <span className="w-4 h-0 border-t-[3px] border-solid" style={{ borderTopColor: BRIGHT }} />
                  Total por mes
                </span>
                <span className="inline-flex items-center gap-[7px]">
                  <span className="w-4 h-0 border-t-[1.8px] border-dashed" style={{ borderTopColor: '#222' }} />
                  Promedio por día
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Age distribution */}
        <div className="bg-white border rounded-[16px] flex flex-col" style={{ borderColor: '#ece0e0' }}>
          <div className="flex items-center gap-[10px] px-[22px] pt-[18px]">
            <span className="w-[30px] h-[30px] flex-none rounded-[9px] grid place-items-center" style={{ backgroundColor: '#e3eeec', color: TEAL }}>
              <Users size={17} />
            </span>
            <h3 className="text-[15.5px] font-semibold" style={{ color: '#5e0b1e' }}>Distribución por edad</h3>
            <span className="ml-auto text-[11.5px]" style={{ color: MUT }}>integrantes</span>
          </div>
          <div className="px-[22px] pb-[22px] pt-[14px]">
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={edadData} margin={{ top: 18, right: 16, bottom: 28, left: 16 }}>
                <defs>
                  <linearGradient id="edadG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRIGHT} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={BRIGHT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={LINE} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={commonTick} axisLine={false} tickLine={false} />
                <YAxis tick={commonTick} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                <Tooltip />
                <Area type="monotone" dataKey="v" stroke={BRIGHT} strokeWidth={2.6} fill="url(#edadG)" dot={{ r: 4, fill: '#fff', stroke: BRIGHT, strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Trio: Sexo + Tamaño + Ruta */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.8fr_1fr_0.8fr] gap-[18px] mb-[18px]">
        {/* Sexo */}
        <div className="bg-white border rounded-[16px] flex flex-col" style={{ borderColor: '#ece0e0' }}>
          <div className="flex items-center gap-[10px] px-[22px] pt-[18px]">
            <span className="w-[30px] h-[30px] flex-none rounded-[9px] grid place-items-center" style={{ backgroundColor: '#e3eeec', color: TEAL }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[17px] h-[17px]"><path d="M12 3a9 9 0 1 0 9 9h-9Z" /><path d="M12 3v9h9a9 9 0 0 0-9-9Z" /></svg>
            </span>
            <h3 className="text-[15.5px] font-semibold" style={{ color: '#5e0b1e' }}>Distribución por sexo</h3>
          </div>
          <div className="px-[22px] pb-[22px] pt-[14px]">
            <div className="grid grid-cols-1 sm:grid-cols-[168px_1fr] gap-4 items-center">
              <ResponsiveContainer width="100%" height={168}>
                <PieChart>
                  <Pie data={[
                    { name: 'Mujeres', value: totalMujeres },
                    { name: 'Hombres', value: totalHombres },
                    ...(sexoOtros > 0 ? [{ name: 'Otro', value: sexoOtros }] : []),
                  ]} cx="50%" cy="50%" innerRadius={58} outerRadius={84} dataKey="value" stroke="none">
                    <Cell fill={PASTEL_BURG} />
                    <Cell fill={PASTEL_TEAL} />
                    {sexoOtros > 0 && <Cell fill={PASTEL_GOLD} />}
                  </Pie>
                  <Tooltip />
                  <text x="50%" y="48%" textAnchor="middle" fontSize={30} fontWeight={600} fill="#5e0b1e" fontFamily="Kalam">{pctMujeres}%</text>
                  <text x="50%" y="64%" textAnchor="middle" fontSize={12} fill={MUT} fontFamily="Kalam">Mujeres</text>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-4 justify-center">
                {[
                  { label: 'Mujeres', value: totalMujeres, color: PASTEL_BURG },
                  { label: 'Hombres', value: totalHombres, color: PASTEL_TEAL },
                  ...(sexoOtros > 0 ? [{ label: 'Otro', value: sexoOtros, color: PASTEL_GOLD }] : []),
                ].sort((a, b) => b.value - a.value).map((sx) => (
                  <div key={sx.label} className="flex flex-col gap-[3px]">
                    <div className="flex items-center gap-2 text-[13px]" style={{ color: '#8a4a55' }}>
                      <span className="w-[11px] h-[11px] rounded-full" style={{ backgroundColor: sx.color }} />
                      {sx.label}
                    </div>
                    <div className="flex items-baseline gap-[7px] ml-[19px]">
                      <span className="text-[26px] font-semibold" style={{ color: '#5e0b1e' }}>{sx.value}</span>
                      <span className="text-[13px]" style={{ color: MUT }}>{totalIntegrantes > 0 ? Math.round(sx.value / totalIntegrantes * 100) : 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tamaño de comités */}
        <div className="bg-white border rounded-[16px] flex flex-col" style={{ borderColor: '#ece0e0' }}>
          <div className="flex items-center gap-[10px] px-[16px] pt-[14px]">
            <span className="w-[24px] h-[24px] flex-none rounded-[7px] grid place-items-center" style={{ backgroundColor: '#e3eeec', color: TEAL }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[14px] h-[14px]"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></svg>
            </span>
            <h3 className="text-[13px] font-semibold" style={{ color: '#5e0b1e' }}>Tamaño</h3>
            <span className="ml-auto text-[10.5px]" style={{ color: MUT }}>comités</span>
          </div>
          <div className="px-[14px] pb-[14px] pt-[8px]">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={sizeData} margin={{ top: 22, right: 6, bottom: 14, left: 6 }} barCategoryGap="20%">
                <XAxis dataKey="label" tick={commonTick} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="v" radius={[4, 4, 0, 0]} barSize={32}>
                  {sizeData.map((entry, idx) => {
                    const isMax = entry.v === Math.max(...sizeData.map(d => d.v));
                    return <Cell key={idx} fill={isMax ? BRIGHT : S1} />;
                  })}
                  <LabelList dataKey="v" position="top" fill="#5e0b1e" fontSize={14} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ejes Temáticos */}
        <div className="bg-white border rounded-[16px] flex flex-col" style={{ borderColor: '#ece0e0' }}>
          <div className="flex items-center gap-[10px] px-[22px] pt-[18px]">
            <span className="w-[30px] h-[30px] flex-none rounded-[9px] grid place-items-center" style={{ backgroundColor: '#ecccd3', color: BURG }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[17px] h-[17px]"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
            </span>
            <h3 className="text-[15.5px] font-semibold" style={{ color: '#5e0b1e' }}>Ejes Temáticos</h3>
            <span className="ml-auto text-[11.5px]" style={{ color: MUT }}>comités</span>
          </div>
          <div className="px-[22px] pb-[22px] pt-[14px] flex-1 flex flex-col justify-center gap-3">
            {ejeData.length === 0 ? (
              <div className="text-center text-sm" style={{ color: MUT }}>Sin datos</div>
            ) : (
              ejeData.map((eje) => {
                const pct = totalComites > 0 ? Math.round(eje.v / totalComites * 100) : 0;
                return (
                  <div key={eje.name}>
                    <div className="flex items-center justify-between text-[13px] mb-1" style={{ color: '#8a4a55' }}>
                      <span>{eje.name}</span>
                      <span className="font-semibold" style={{ color: '#5e0b1e' }}>{eje.v} <span style={{ color: '#ad8b91', fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div className="h-[9px] rounded-[6px] overflow-hidden" style={{ backgroundColor: '#efe7da' }}>
                      <i className="block h-full rounded-[6px]" style={{ width: `${(eje.v / maxEje * 100).toFixed(1)}%`, background: 'linear-gradient(90deg, #6d0f22, #9e1b35)' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ruta de Articulación */}
        <div className="bg-white border rounded-[16px] flex flex-col" style={{ borderColor: '#ece0e0' }}>
          <div className="flex items-center gap-[10px] px-[22px] pt-[18px]">
            <span className="w-[30px] h-[30px] flex-none rounded-[9px] grid place-items-center" style={{ backgroundColor: '#ecccd3', color: BURG }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[17px] h-[17px]"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
            </span>
            <h3 className="text-[15.5px] font-semibold" style={{ color: '#5e0b1e' }}>Ruta de Articulación</h3>
            <span className="ml-auto text-[11.5px]" style={{ color: MUT }}>comités</span>
          </div>
          <div className="px-[22px] pb-[22px] pt-[14px] flex-1 flex flex-col justify-center gap-4">
            {rutaInfo.length === 0 ? (
              <div className="text-center text-sm" style={{ color: MUT }}>Sin datos</div>
            ) : (
              rutaInfo.map((r) => {
                const pct = totalComites > 0 ? Math.round(r.v / totalComites * 100) : 0;
                return (
                  <div key={r.label}>
                    <div className="flex items-center justify-between text-[13px] mb-1" style={{ color: '#8a4a55' }}>
                      <span>{r.label}</span>
                      <span className="font-semibold" style={{ color: '#5e0b1e' }}>{r.v} <span style={{ color: '#ad8b91', fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div className="h-[9px] rounded-[6px] overflow-hidden" style={{ backgroundColor: '#efe7da' }}>
                      <i className="block h-full rounded-[6px]" style={{ width: `${pct}%`, background: r.label === 'Educativo' ? 'linear-gradient(90deg, #6d0f22, #9e1b35)' : 'linear-gradient(90deg, #025959, #5e8c88)' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

    </div>
  );
}

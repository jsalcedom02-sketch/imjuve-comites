import { useState } from 'react';
import { Search, MapPin, Users, Phone, Filter, Edit3, X, Plus, Trash2, Save, Mail, Camera } from 'lucide-react';
import { useComiteStore } from '../store/comiteStore';
import { useAuthStore } from '../store/authStore';
import { OPCIONES_VULNERABLES, buildCargos, type Integrante } from '../types/comiteSchema';
import { compressImage } from '../lib/imageUtils';

const defaultIntegrante: Integrante = { cargo: 'INTEGRANTE', nombre: '', sexo: 'H', edad: 12, municipio: '', telefono: '', email: '', poblacionVulnerable: [] };

export default function ConsultaComites() {
  const { records, updateRecord } = useComiteStore();
  const { assignedStates, role } = useAuthStore();
  const defaultEstado = assignedStates.length === 1 ? assignedStates[0] : '';
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState(defaultEstado);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState({ nombre: '', folio: '' });
  const [editIntegrantes, setEditIntegrantes] = useState<Integrante[]>([]);
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);

  const estados = [...new Set(records.map((r) => r.estado))].sort();

  const filtered = records.filter((r) => {
    const matchSearch =
      !search ||
      r.nombreComite.toLowerCase().includes(search.toLowerCase()) ||
      r.folio.toLowerCase().includes(search.toLowerCase()) ||
      r.integrantes.some((i) => i.nombre.toLowerCase().includes(search.toLowerCase()));
    const matchEstado = !filterEstado || r.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  const abrirEditar = (r: typeof records[0]) => {
    setEditTitle({ nombre: r.nombreComite, folio: r.folio });
    setEditIntegrantes(r.integrantes.map((i) => ({ ...i, email: i.email || '', poblacionVulnerable: [...(i.poblacionVulnerable || [])] })));
    setEditPhoto(r.evidenciaFotografica || null);
    setEditId(r.id);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 0.7);
      setEditPhoto(compressed);
    } catch (err) {
      console.error('Error comprimiendo imagen:', err);
    }
    e.target.value = '';
  };

  const guardar = () => {
    if (!editId) return;
    const r = records.find((r) => r.id === editId);
    if (!r) return;
    const cargosAsignados = buildCargos(editIntegrantes.length);
    const integrantes = editIntegrantes.map((int, i) => ({ ...int, cargo: cargosAsignados[i] || 'INTEGRANTE' }));
    updateRecord(editId, { integrantes, evidenciaFotografica: editPhoto || '' });
    setEditId(null);
  };

  const toggleVulnerable = (intIdx: number, v: string) => {
    setEditIntegrantes((prev) => prev.map((int, i) => {
      if (i !== intIdx) return int;
      const arr = int.poblacionVulnerable || [];
      return { ...int, poblacionVulnerable: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    }));
  };

  const actualizarInt = (i: number, campo: keyof Integrante, valor: string | number | string[]) => {
    setEditIntegrantes((prev) => {
      const ints = [...prev];
      ints[i] = { ...ints[i], [campo]: valor };
      return ints;
    });
  };

  const agregarIntegrante = () => setEditIntegrantes((prev) => [...prev, { ...defaultIntegrante }]);
  const quitarIntegrante = (i: number) => setEditIntegrantes((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6" style={{ fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
      <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre de comité, folio o integrante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="pl-9 pr-8 py-2.5 border-2 border-gray-200 rounded-lg focus:border-teal outline-none appearance-none bg-white min-w-[140px] sm:min-w-[220px] font-medium w-full sm:w-auto"
            >
              <option value="">Todos los estados</option>
              {estados.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {filtered.length} de {records.length} comités encontrados
          {filterEstado && <span className="ml-1 text-teal font-semibold">({filterEstado})</span>}
        </div>
      </div>

      {editId ? (
        <div className="bg-white rounded-2xl shadow-sm border space-y-4" style={{ borderColor: '#ece0e0' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#ece0e0' }}>
            <div>
              <button onClick={() => setEditId(null)} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-150 ease-out hover:bg-gray-100 active:scale-95" style={{ color: '#005e63', border: '1px solid #dcc9cc' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Volver
              </button>
            </div>
            <h2 className="font-bold text-lg truncate" style={{ color: '#5e0b1e' }}>
              {editTitle.nombre}
              <span className="ml-2 font-mono text-sm font-normal" style={{ color: '#ad8b91' }}>{editTitle.folio}</span>
            </h2>
            <div className="flex items-center gap-3">
              <button onClick={guardar} className="flex items-center gap-2 bg-guinda text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-guinda-light active:scale-95 transition-all duration-150 ease-out shadow-sm">
                <Save size={16} /> Guardar cambios
              </button>
            </div>
          </div>

          <div className="px-6 pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#ad8b91' }}>Integrantes ({editIntegrantes.length})</h4>
              <button onClick={agregarIntegrante} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all duration-150 ease-out hover:bg-gray-50 active:scale-95" style={{ color: '#005e63', border: '1px solid #dcc9cc' }}>
                <Plus size={15} /> Agregar integrante
              </button>
            </div>

            <div className="space-y-3">
              {editIntegrantes.map((int, i) => (
                <div key={i} className="border rounded-xl p-4 relative" style={{ borderColor: '#ece0e0' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold" style={{ color: '#6d0f22' }}>#{i + 1} — {int.cargo}</span>
                    {role !== 'coordinador' && (
                    <button onClick={() => quitarIntegrante(i)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ease-out active:scale-95" style={{ color: '#dc2626', border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}>
                      <Trash2 size={14} /> Eliminar
                    </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#ad8b91' }}>Nombre completo</label>
                      <input value={int.nombre} onChange={(e) => actualizarInt(i, 'nombre', e.target.value.toUpperCase())} className="w-full px-3 py-2 border rounded-lg text-sm outline-none uppercase" style={{ borderColor: '#dcc9cc' }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#ad8b91' }}>Sexo</label>
                      <select value={int.sexo} onChange={(e) => actualizarInt(i, 'sexo', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm outline-none bg-white" style={{ borderColor: '#dcc9cc' }}>
                        <option value="H">Hombre</option>
                        <option value="M">Mujer</option>
                        <option value="X">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#ad8b91' }}>Edad</label>
                      <input type="number" min={12} max={29} value={int.edad} onChange={(e) => actualizarInt(i, 'edad', parseInt(e.target.value) || 12)} className="w-full px-3 py-2 border rounded-lg text-sm outline-none" style={{ borderColor: '#dcc9cc' }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#ad8b91' }}>Municipio</label>
                      <input value={int.municipio} onChange={(e) => actualizarInt(i, 'municipio', e.target.value.toUpperCase())} className="w-full px-3 py-2 border rounded-lg text-sm outline-none uppercase" style={{ borderColor: '#dcc9cc' }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#ad8b91' }}>Teléfono</label>
                      <input value={int.telefono} onChange={(e) => actualizarInt(i, 'telefono', e.target.value.replace(/\D/g, '').slice(0, 10))} className="w-full px-3 py-2 border rounded-lg text-sm outline-none font-mono" style={{ borderColor: '#dcc9cc' }} placeholder="10 dígitos" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#ad8b91' }}>Correo electrónico</label>
                      <input type="email" value={int.email || ''} onChange={(e) => actualizarInt(i, 'email', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm outline-none" style={{ borderColor: '#dcc9cc' }} placeholder="correo@ejemplo.com" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#ad8b91' }}>Población vulnerable</label>
                    <div className="flex flex-wrap gap-1.5">
                      {OPCIONES_VULNERABLES.map((v) => (
                        <button key={v} onClick={() => toggleVulnerable(i, v)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-150 ease-out active:scale-90 border ${(int.poblacionVulnerable || []).includes(v) ? 'bg-guinda text-white border-guinda' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #ece0e0' }} className="pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#ad8b91' }}>Foto de protesta (opcional)</h4>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-all duration-150 ease-out hover:bg-gray-50 active:scale-95" style={{ color: '#005e63', border: '1px solid #dcc9cc' }}>
                  <Camera size={16} /> {editPhoto ? 'Cambiar foto' : 'Cargar foto'}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                {editPhoto && <button onClick={() => setEditPhoto(null)} className="text-sm font-bold px-4 py-2.5 rounded-lg active:scale-95 transition-all duration-150 ease-out" style={{ color: '#dc2626', border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}>Eliminar foto</button>}
              </div>
              {editPhoto && <div className="mt-3"><img src={editPhoto} alt="Foto de protesta" className="max-h-32 rounded-lg border" style={{ borderColor: '#ece0e0' }} /></div>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: '#ece0e0' }}>
            <button onClick={() => setEditId(null)} className="px-4 py-2 rounded-lg text-sm font-bold active:scale-95 transition-all duration-150 ease-out" style={{ color: '#ad8b91' }}>Cancelar</button>
            <button onClick={guardar} className="flex items-center gap-2 bg-guinda text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-guinda-light active:scale-95 transition-all duration-150 ease-out shadow-sm">
              <Save size={16} /> Guardar cambios
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
          <Users className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-400">
            {records.length === 0 ? 'No hay comités registrados' : 'Sin resultados'}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {records.length === 0 ? 'Registre un comité para verlo aquí' : 'Intente con otros términos de búsqueda'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-2xl shadow-sm border overflow-hidden"
              style={{ borderColor: '#ece0e0' }}
            >
              <div className="px-6 py-4 flex items-center gap-4">
                <button onClick={() => setExpandido(expandido === record.id ? null : record.id)} className="flex items-center gap-4 flex-1 min-w-0 text-left active:scale-[0.99] transition-all duration-150 ease-out">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f7ebee' }}>
                    <Users size={18} style={{ color: '#6d0f22' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: '#5e0b1e' }}>{record.nombreComite}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: '#f7ebee', color: '#6d0f22' }}>{record.folio}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: '#ad8b91' }}>
                      <span className="flex items-center gap-1"><MapPin size={12} />{record.estado}</span>
                      <span className="flex items-center gap-1"><Users size={12} />{record.integrantes.length} integrantes</span>
                      <span>{record.rutaArticulacion}</span>
                    </div>
                  </div>
                </button>
                {role !== 'promotor' && (
                <button
                  onClick={() => abrirEditar(record)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ease-out hover:bg-gray-100 active:scale-95"
                  style={{ color: '#005e63', border: '1px solid #dcc9cc' }}
                >
                  <Edit3 size={14} />
                  Editar
                </button>
                )}
                <svg
                  className={`w-4 h-4 transition-transform flex-shrink-0 cursor-pointer ${expandido === record.id ? 'rotate-180' : ''}`}
                  style={{ color: '#ad8b91' }}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  onClick={() => setExpandido(expandido === record.id ? null : record.id)}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>

              {expandido === record.id && (
                <div style={{ borderTop: '1px solid #ece0e0' }}>
                  <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#ad8b91' }}>Datos del comité</h4>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between"><span style={{ color: '#ad8b91' }}>Lugar de intervención</span><span className="font-medium" style={{ color: '#5e0b1e' }}>{record.lugarIntervencion}</span></div>
                        <div className="flex justify-between"><span style={{ color: '#ad8b91' }}>Fecha de protesta</span><span className="font-medium" style={{ color: '#5e0b1e' }}>{record.fechaProtesta}</span></div>
                        <div className="flex justify-between"><span style={{ color: '#ad8b91' }}>Ruta de articulación</span><span className="font-medium" style={{ color: '#5e0b1e' }}>{record.rutaArticulacion}</span></div>
                        {record.tiktok && <div className="flex justify-between"><span style={{ color: '#ad8b91' }}>TikTok</span><span className="font-medium" style={{ color: '#5e0b1e' }}>@{record.tiktok}</span></div>}
                        {record.instagram && <div className="flex justify-between"><span style={{ color: '#ad8b91' }}>Instagram</span><span className="font-medium" style={{ color: '#5e0b1e' }}>@{record.instagram}</span></div>}
                        {record.evidenciaFotografica && (
                          <div className="mt-2">
                            <span style={{ color: '#ad8b91' }} className="text-xs block mb-1">Foto de protesta</span>
                            <img src={record.evidenciaFotografica} alt="Foto de protesta"
                              className="max-h-24 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ borderColor: '#ece0e0' }}
                              onClick={() => setFotoAmpliada(record.evidenciaFotografica)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#ad8b91' }}>Ejes y actividades</h4>
                      <div className="space-y-1.5 text-sm">
                        <div><span style={{ color: '#ad8b91' }}>Ejes temáticos</span><p className="font-medium mt-0.5" style={{ color: '#5e0b1e' }}>{record.ejesTematicos}</p></div>
                        <div><span style={{ color: '#ad8b91' }}>Actividades</span><p className="font-medium mt-0.5" style={{ color: '#5e0b1e' }}>{record.actividades}</p></div>
                        {record.observaciones && <div><span style={{ color: '#ad8b91' }}>Observaciones</span><p className="font-medium mt-0.5" style={{ color: '#5e0b1e' }}>{record.observaciones}</p></div>}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #ece0e0' }}>
                    <div className="px-6 py-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#ad8b91' }}>Integrantes</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ backgroundColor: '#f7ebee' }}>
                              <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#6d0f22' }}>Cargo</th>
                              <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#6d0f22' }}>Nombre</th>
                              <th className="hidden sm:table-cell px-3 py-2 text-center text-xs font-bold uppercase tracking-wider" style={{ color: '#6d0f22' }}>Edad</th>
                              <th className="hidden sm:table-cell px-3 py-2 text-center text-xs font-bold uppercase tracking-wider" style={{ color: '#6d0f22' }}>Sexo</th>
                              <th className="hidden sm:table-cell px-3 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#6d0f22' }}>Municipio</th>
                              <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#6d0f22' }}>Teléfono</th>
                              <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#6d0f22' }}>Email</th>
                              <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#6d0f22' }}>Población vulnerable</th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.integrantes.map((int, i) => (
                              <tr key={i} className="border-t" style={{ borderColor: '#ece0e0' }}>
                                <td className="px-3 py-2 text-xs font-medium" style={{ color: '#6d0f22' }}>{int.cargo}</td>
                                <td className="px-3 py-2 font-medium" style={{ color: '#5e0b1e' }}>{int.nombre}</td>
                                <td className="hidden sm:table-cell px-3 py-2 text-center" style={{ color: '#5e0b1e' }}>{int.edad}</td>
                                <td className="hidden sm:table-cell px-3 py-2 text-center" style={{ color: '#5e0b1e' }}>{int.sexo}</td>
                                <td className="hidden sm:table-cell px-3 py-2" style={{ color: '#5e0b1e' }}>{int.municipio}</td>
                                <td className="hidden md:table-cell px-3 py-2">
                                  <span className="inline-flex items-center gap-1 font-mono text-xs" style={{ color: '#005e63' }}>
                                    <Phone size={12} />
                                    {int.telefono.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
                                  </span>
                                </td>
                                <td className="hidden lg:table-cell px-3 py-2 text-xs" style={{ color: '#5e0b1e' }}>
                                  {int.email && <span className="inline-flex items-center gap-1"><Mail size={12} />{int.email}</span>}
                                </td>
                                <td className="hidden lg:table-cell px-3 py-2 text-xs" style={{ color: '#5e0b1e' }}>
                                  {int.poblacionVulnerable && int.poblacionVulnerable.length > 0 ? int.poblacionVulnerable.join(', ') : ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal foto ampliada */}
      {fotoAmpliada && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setFotoAmpliada(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button onClick={() => setFotoAmpliada(null)}
              className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg z-10">
              <X size={20} />
            </button>
            <img src={fotoAmpliada} alt="Foto ampliada"
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import {
  Search,
  FileDown,
  Calendar,
  MapPin,
  Users,
  Package,
  Loader2,
  Filter,
  Download,
  FileSpreadsheet,
  Trash2,
  Eye,
  X,
  FileText,
} from 'lucide-react';
import { useComiteStore } from '../store/comiteStore';
import { useAuthStore } from '../store/authStore';
import { generateActaPDF, generateActaBlob } from '../lib/pdfGenerator';
import { deleteAllComites } from '../api/comites';
import JSZip from 'jszip';

export default function HistorialActas() {
  const { records, deleteRecord } = useComiteStore();
  const { assignedStates, role } = useAuthStore();
  const canDelete = role === 'administrador' || role === 'territorial';
  const defaultEstado = assignedStates.length === 1 ? assignedStates[0] : '';
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState(defaultEstado);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [preview, setPreview] = useState<{ url: string; folio: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; folio: string } | null>(null);
  const [deleteAllStep, setDeleteAllStep] = useState(0); // 0=hidden, 1=first confirm, 2=password
  const [deleteAllPassword, setDeleteAllPassword] = useState('');
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  const estados = [...new Set(records.map((r) => r.estado))].sort();

  const filtered = records.filter((r) => {
    const matchSearch =
      !search ||
      r.folio.toLowerCase().includes(search.toLowerCase()) ||
      r.nombreComite.toLowerCase().includes(search.toLowerCase()) ||
      r.estado.toLowerCase().includes(search.toLowerCase());
    const matchEstado = !filterEstado || r.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  const handleDownload = async (record: typeof records[0]) => {
    setDownloading(record.id);
    try {
      await generateActaPDF(record);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setDownloading(null);
    }
  };

  const handlePreview = async (record: typeof records[0]) => {
    setPreviewLoading(true);
    try {
      const blob = await generateActaBlob(record);
      const url = URL.createObjectURL(blob);
      setPreview({ url, folio: record.folio });
    } catch (err) {
      console.error('Error generando vista previa:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview.url);
      setPreview(null);
    }
  };

  const handleCSVDownload = () => {
    if (filtered.length === 0) return;

    const headers = [
      'FOLIO',
      'NOMBRE DEL COMITÉ',
      'FECHA DE PROTESTA',
      'RUTA DE ARTICULACIÓN',
      'ESTADO',
      'LUGAR DE INTERVENCIÓN',
      'TIKTOK',
      'INSTAGRAM',
      'CARGO',
      'NOMBRE DEL INTEGRANTE',
      'SEXO',
      'EDAD',
      'MUNICIPIO',
      'TELÉFONO',
      'EMAIL',
      'POBLACION_VULNERABLE',
      'EJES TEMÁTICOS',
      'ACTIVIDADES',
      'OBSERVACIONES',
      'FECHA DE REGISTRO',
    ];

    const escapeCSV = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const rows: string[] = [headers.join(',')];

    filtered.forEach((record) => {
      record.integrantes.forEach((integrante) => {
        const row = [
          record.folio,
          record.nombreComite,
          record.fechaProtesta,
          record.rutaArticulacion,
          record.estado,
          record.lugarIntervencion,
          record.tiktok || '',
          record.instagram || '',
          integrante.cargo,
          integrante.nombre,
          integrante.sexo,
          String(integrante.edad),
          integrante.municipio,
          integrante.telefono,
          integrante.email || '',
          integrante.poblacionVulnerable && integrante.poblacionVulnerable.length > 0 ? integrante.poblacionVulnerable.join('; ') : '',
          record.ejesTematicos,
          record.actividades,
          record.observaciones || '',
          new Date(record.fechaRegistro).toLocaleDateString('es-MX'),
        ].map(escapeCSV);
        rows.push(row.join(','));
      });
    });

    const BOM = '﻿';
    const csvContent = BOM + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filterEstado
      ? `Integrantes_${filterEstado}.csv`
      : 'Integrantes_Todos.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string, folio: string) => {
    setConfirmDelete({ id, folio });
  };
  const confirmDeleteAction = () => {
    if (confirmDelete) {
      deleteRecord(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const handleDeleteAll = async () => {
    setDeleteAllLoading(true);
    try {
      await deleteAllComites();
      setDeleteAllStep(0);
      setDeleteAllPassword('');
      // Force re-sync from server
      const { useComiteStore } = await import('../store/comiteStore');
      useComiteStore.getState().syncFromServer();
    } catch (err) {
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setDeleteAllLoading(false);
    }
  };

  const handleBulkDownload = async () => {
    if (filtered.length === 0) return;
    setBulkDownloading(true);
    setBulkProgress({ current: 0, total: filtered.length });

    try {
      const zip = new JSZip();
      const folder = zip.folder(
        filterEstado ? `Actas_${filterEstado}` : 'Actas_Todas'
      )!;

      for (let i = 0; i < filtered.length; i++) {
        const record = filtered[i];
        setBulkProgress({ current: i + 1, total: filtered.length });
        const blob = await generateActaBlob(record);
        const namePart = record.nombreComite
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '_').substring(0, 50);
        folder.file(`ACTA_${record.folio}_${namePart}.pdf`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filterEstado
        ? `Actas_${filterEstado}.zip`
        : 'Actas_Todas.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error en descarga masiva:', err);
      alert('Error al generar las actas. Intente nuevamente.');
    } finally {
      setBulkDownloading(false);
      setBulkProgress({ current: 0, total: 0 });
    }
  };

  if (preview) {
    return (
      <div className="space-y-6" style={{ fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-teal" />
              <h2 className="font-bold text-lg text-gray-800">
                Vista previa — {preview.folio}
              </h2>
            </div>
            <button
              onClick={closePreview}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 active:scale-95 transition-all"
            >
              <span className="text-lg leading-none">←</span>
              Volver
            </button>
          </div>
          <div>
            <iframe
              src={preview.url}
              className="w-full border-0"
              style={{ minHeight: '80vh' }}
              title={`Vista previa ${preview.folio}`}
            />
          </div>
        </div>
      </div>
    );
  }

  if (confirmDelete) {
    return (
      <div className="space-y-6" style={{ fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-6 py-5 text-center space-y-4">
            <Trash2 size={40} className="mx-auto" style={{ color: '#dc2626' }} />
            <h2 className="font-bold text-xl" style={{ color: '#5e0b1e' }}>¿Eliminar acta {confirmDelete.folio}?</h2>
            <p className="text-sm" style={{ color: '#ad8b91' }}>
              Esta acción eliminará el comité y todos sus integrantes. No se puede deshacer.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-6 py-2.5 rounded-lg text-sm font-bold border border-gray-300 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteAction}
                className="px-6 py-2.5 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (deleteAllStep > 0) {
    return (
      <div className="space-y-6" style={{ fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-6 py-5 space-y-4">
            {deleteAllStep === 1 ? (
              <>
                <div className="text-center space-y-3">
                  <Trash2 size={40} className="mx-auto" style={{ color: '#dc2626' }} />
                  <h2 className="font-bold text-xl" style={{ color: '#5e0b1e' }}>¿Eliminar todas las actas?</h2>
                  <p className="text-sm" style={{ color: '#ad8b91' }}>
                    Esta acción eliminará <strong>todos</strong> los comités, integrantes e historial. No se puede deshacer.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => { setDeleteAllStep(0); setDeleteAllPassword(''); }}
                    className="px-6 py-2.5 rounded-lg text-sm font-bold border border-gray-300 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setDeleteAllStep(2)}
                    className="px-6 py-2.5 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all"
                  >
                    Sí, eliminar todo
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center space-y-3">
                  <h2 className="font-bold text-xl" style={{ color: '#5e0b1e' }}>Confirmación adicional</h2>
                  <p className="text-sm" style={{ color: '#ad8b91' }}>
                    Escriba la palabra <strong>CONTRASEÑA</strong> para confirmar la eliminación total.
                  </p>
                </div>
                <input
                  type="text"
                  value={deleteAllPassword}
                  onChange={(e) => setDeleteAllPassword(e.target.value)}
                  placeholder="Escriba CONTRASEÑA"
                  autoFocus
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-center font-bold uppercase tracking-wider"
                  style={{ borderColor: deleteAllPassword === 'CONTRASEÑA' ? '#16a34a' : '#dcc9cc' }}
                />
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => { setDeleteAllStep(0); setDeleteAllPassword(''); }}
                    disabled={deleteAllLoading}
                    className="px-6 py-2.5 rounded-lg text-sm font-bold border border-gray-300 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    disabled={deleteAllPassword !== 'CONTRASEÑA' || deleteAllLoading}
                    className="px-6 py-2.5 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleteAllLoading ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    {deleteAllLoading ? 'Eliminando...' : 'Confirmar y eliminar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
      <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por folio, nombre o estado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={16}
            />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="pl-9 pr-8 py-2.5 border-2 border-gray-200 rounded-lg focus:border-teal outline-none appearance-none bg-white min-w-[220px] font-medium"
            >
              <option value="">Todos los estados</option>
              {estados.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Barra de descarga masiva */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package size={16} className="text-teal" />
            <span>
              <strong className="text-gray-800">{filtered.length}</strong> de{' '}
              <strong className="text-gray-800">{records.length}</strong> actas
              {filterEstado && (
                <span className="ml-1 text-teal font-semibold">
                  ({filterEstado})
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCSVDownload}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 bg-guinda text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-guinda-light active:scale-[0.97] transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm"
            >
              <FileSpreadsheet size={16} />
              Exportar CSV
            </button>
            <button
              onClick={handleBulkDownload}
              disabled={bulkDownloading || filtered.length === 0}
              className="flex items-center gap-2 bg-teal text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-teal-light active:scale-[0.97] transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm"
            >
              {bulkDownloading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Generando {bulkProgress.current}/{bulkProgress.total}...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Descargar {filtered.length === records.length ? 'Todas' : filtered.length}{' '}
                  Actas (.zip)
                </>
              )}
            </button>
            {role === 'administrador' && (
              <button
                onClick={() => setDeleteAllStep(1)}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-red-700 active:scale-[0.97] transition-all duration-150 ease-out shadow-sm"
              >
                <Trash2 size={16} />
                Borrar todo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla / Lista */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
          <Users className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-400">
            {records.length === 0
              ? 'No hay actas registradas'
              : 'Sin resultados para esta búsqueda'}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {records.length === 0
              ? 'Registre un comité para verlo aquí'
              : 'Intente con otros términos de búsqueda'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-guinda text-white">
                  <th className="px-2 sm:px-4 py-3 text-left font-bold text-[10px] sm:text-xs uppercase tracking-wider">
                    Folio
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left font-bold text-[10px] sm:text-xs uppercase tracking-wider">
                    Comité
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left font-bold text-xs uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-center font-bold text-xs uppercase tracking-wider">
                    Ruta
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-center font-bold text-[10px] sm:text-xs uppercase tracking-wider">
                    # Int.
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-center font-bold text-xs uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-center font-bold text-[10px] sm:text-xs uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, i) => (
                  <tr
                    key={record.id}
                    className={`border-b border-gray-100 hover:bg-guinda-50/50 transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`}
                  >
                    <td className="px-2 sm:px-4 py-3">
                      <span className="font-mono font-bold text-guinda text-[10px] sm:text-xs bg-guinda-50 px-1.5 sm:px-2 py-1 rounded leading-tight inline-block">
                        {record.folio}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3 font-medium text-gray-800 max-w-[120px] sm:max-w-[200px] truncate text-[11px] sm:text-sm">
                      {record.nombreComite}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin size={12} />
                        <span className="text-[11px]">{record.estado}</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-center">
                      <span
                        className={`text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-1 rounded ${
                          record.rutaArticulacion === 'EDUCATIVO'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {record.rutaArticulacion === 'EDUCATIVO' ? 'EDUC' : 'TERR'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-center font-bold text-gray-700 text-[11px] sm:text-sm">
                      {record.integrantes.length}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-500 text-[11px]">
                        <Calendar size={12} />
                        {new Date(record.fechaRegistro).toLocaleDateString('es-MX')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handlePreview(record)}
                          disabled={previewLoading}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
                          style={{ color: '#1a7a4a', backgroundColor: 'rgba(26,122,74,0.08)', border: '1px solid rgba(26,122,74,0.2)' }}
                          title="Vista previa"
                        >
                          {previewLoading ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <FileText size={15} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDownload(record)}
                          disabled={downloading === record.id}
                          className="inline-flex items-center gap-1 bg-guinda text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-guinda-light active:scale-95 transition-all duration-150 ease-out disabled:opacity-50 disabled:active:scale-100"
                        >
                          <FileDown size={14} className={downloading === record.id ? 'animate-pulse' : ''} />
                          {downloading === record.id ? (
                            <span className="flex items-center gap-1">
                              <Loader2 size={12} className="animate-spin" />
                              Generando
                            </span>
                          ) : 'PDF'}
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(record.id, record.folio)}
                            className="inline-flex items-center gap-1 text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 hover:border-red-300 active:scale-95 transition-all duration-150 ease-out"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

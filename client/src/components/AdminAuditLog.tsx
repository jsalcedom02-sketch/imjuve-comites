import { useState, useEffect } from 'react';
import { Loader2, Download, Search, Filter } from 'lucide-react';
import * as auditApi from '../api/audit';

const ACTION_LABELS: Record<string, string> = {
  crear: 'Crear',
  editar: 'Editar',
  eliminar: 'Eliminar',
};

const ACTION_COLORS: Record<string, string> = {
  crear: '#1a7a4a',
  editar: '#005e63',
  eliminar: '#dc2626',
};

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<auditApi.AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterUsername, setFilterUsername] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 100;

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditApi.fetchAuditLogs({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        action: filterAction || undefined,
        username: filterUsername || undefined,
      });
      setLogs(data.logs);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, [page, filterAction]);

  const handleSearch = () => { setPage(0); loadLogs(); };
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#ad8b91' }} />
            <input
              value={filterUsername}
              onChange={(e) => setFilterUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-8 pr-3 py-1.5 border rounded-lg text-xs outline-none w-40"
              style={{ borderColor: '#dcc9cc' }}
              placeholder="Filtrar usuario..."
            />
          </div>
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
            className="px-3 py-1.5 border rounded-lg text-xs outline-none bg-white"
            style={{ borderColor: '#dcc9cc' }}
          >
            <option value="">Todas las acciones</option>
            <option value="crear">Crear</option>
            <option value="editar">Editar</option>
            <option value="eliminar">Eliminar</option>
          </select>
          <button
            onClick={handleSearch}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-gray-100 active:scale-95 border"
            style={{ color: '#666', borderColor: '#dcc9cc' }}
          >
            <Filter size={13} />
            Filtrar
          </button>
        </div>
        <button
          onClick={() => auditApi.exportAuditLog()}
          className="inline-flex items-center gap-1.5 bg-guinda text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-guinda-light active:scale-95 transition-all duration-150 ease-out"
        >
          <Download size={14} />
          Descargar Bitácora
        </button>
      </div>

      <div className="text-xs" style={{ color: '#ad8b91' }}>{total} registros</div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: '#9e1b35' }} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-guinda text-white">
                  <th className="px-3 py-3 text-left font-bold text-xs uppercase tracking-wider">Usuario</th>
                  <th className="px-3 py-3 text-left font-bold text-xs uppercase tracking-wider">Acción</th>
                  <th className="px-3 py-3 text-left font-bold text-xs uppercase tracking-wider">Entidad</th>
                  <th className="px-3 py-3 text-left font-bold text-xs uppercase tracking-wider hidden md:table-cell">Detalles</th>
                  <th className="px-3 py-3 text-right font-bold text-xs uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-sm" style={{ color: '#ad8b91' }}>Sin registros</td></tr>
                ) : (
                  logs.map((log, i) => (
                    <tr key={log.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                      <td className="px-3 py-2.5 font-medium text-xs" style={{ color: '#5e0b1e' }}>{log.username}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: ACTION_COLORS[log.action] || '#666' }}
                        >
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: '#8a4a55' }}>
                        {log.entity}
                        {log.entityId && <span className="font-mono ml-1 opacity-60">#{log.entityId.slice(0, 8)}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-xs hidden md:table-cell" style={{ color: '#666' }}>{log.details || '—'}</td>
                      <td className="px-3 py-2.5 text-right text-[10px]" style={{ color: '#ad8b91' }}>
                        {new Date(log.createdAt).toLocaleString('es-MX')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border disabled:opacity-30 transition-all hover:bg-gray-100 active:scale-95"
            style={{ borderColor: '#dcc9cc', color: '#666' }}
          >
            Anterior
          </button>
          <span className="text-xs" style={{ color: '#ad8b91' }}>
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border disabled:opacity-30 transition-all hover:bg-gray-100 active:scale-95"
            style={{ borderColor: '#dcc9cc', color: '#666' }}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

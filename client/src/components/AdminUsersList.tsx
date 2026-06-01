import { useState, useEffect } from 'react';
import {
  Shield, ShieldAlert, ShieldCheck, Plus, Pencil, Trash2, X, Save, Loader2,
  Download, Upload,
} from 'lucide-react';
import * as authApi from '../api/auth';
import { ESTADOS } from '../data/municipios';

const ROLE_LABELS: Record<string, string> = {
  administrador: 'Administrador',
  territorial: 'Territorial',
  coordinador: 'Coordinador',
  promotor: 'Promotor',
};

const ROLE_ICONS: Record<string, typeof Shield> = {
  administrador: ShieldAlert,
  territorial: ShieldCheck,
  coordinador: ShieldCheck,
  promotor: Shield,
};

const ROLE_COLORS: Record<string, string> = {
  administrador: '#9e1b35',
  territorial: '#1a7a4a',
  coordinador: '#005e63',
  promotor: '#8a4a55',
};

export default function AdminUsersList() {
  const [users, setUsers] = useState<authApi.UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<{
    id?: string; username: string; password: string; role: string;
    assignedStates: string[]; fullName: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await authApi.fetchUsers();
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError('');
    try {
      if (editing.id) {
        const payload: any = {};
        if (editing.username) payload.username = editing.username;
        if (editing.password) payload.password = editing.password;
        payload.role = editing.role;
        payload.assignedStates = editing.assignedStates;
        payload.fullName = editing.fullName;
        await authApi.updateUser(editing.id, payload);
      } else {
        await authApi.createUser({
          username: editing.username,
          password: editing.password || '0000',
          role: editing.role,
          assignedStates: editing.assignedStates,
          fullName: editing.fullName,
        });
      }
      setEditing(null);
      await loadUsers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await authApi.deleteUser(id);
      await loadUsers();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const toggleState = (state: string) => {
    if (!editing) return;
    const current = editing.assignedStates;
    setEditing({
      ...editing,
      assignedStates: current.includes(state)
        ? current.filter((s) => s !== state)
        : [...current, state],
    });
  };

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const lines = importText.trim().split('\n');
      if (lines.length < 2) { setImportResult({ error: 'Debe incluir encabezado + al menos 1 fila' }); return; }

      const headers = lines[0].split(',').map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(',').map((v) => v.trim().replace(/^"(.*)"$/, '$1'));
        const row: any = {};
        headers.forEach((h, i) => { row[h] = vals[i] || ''; });
        return {
          username: row.username?.toUpperCase() || '',
          password: row.password || '0000',
          role: row.role || 'promotor',
          fullName: row.full_name || '',
          assignedStates: (() => { try { return JSON.parse(row.assigned_states || '[]'); } catch { return []; } })(),
        };
      });

      const result = await authApi.importUsers(rows);
      setImportResult(result);
      await loadUsers();
    } catch (e: any) {
      setImportResult({ error: e.message });
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin" style={{ color: '#9e1b35' }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm" style={{ color: '#ad8b91' }}>{users.length} usuarios</span>
        <div className="flex gap-2">
          <button
            onClick={() => authApi.fetchTemplate()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:bg-gray-100 active:scale-95 border"
            style={{ color: '#1a7a4a', borderColor: '#dcc9cc' }}
          >
            <Download size={14} />
            Plantilla
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:bg-gray-100 active:scale-95 border"
            style={{ color: '#005e63', borderColor: '#dcc9cc' }}
          >
            <Upload size={14} />
            Importar
          </button>
          <button
            onClick={() => setEditing({ username: '', password: '0000', role: 'promotor', assignedStates: [], fullName: '' })}
            className="inline-flex items-center gap-1.5 bg-guinda text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-guinda-light active:scale-95 transition-all duration-150 ease-out"
          >
            <Plus size={14} />
            Nuevo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-guinda text-white">
                <th className="px-3 py-3 text-left font-bold text-xs uppercase tracking-wider">Usuario</th>
                <th className="px-3 py-3 text-left font-bold text-xs uppercase tracking-wider">Nombre</th>
                <th className="px-3 py-3 text-left font-bold text-xs uppercase tracking-wider">Rol</th>
                <th className="px-3 py-3 text-left font-bold text-xs uppercase tracking-wider">Estados</th>
                <th className="px-3 py-3 text-center font-bold text-xs uppercase tracking-wider">Creado</th>
                <th className="px-3 py-3 text-center font-bold text-xs uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const Icon = ROLE_ICONS[u.role] || Shield;
                return (
                  <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                    <td className="px-3 py-3 font-medium text-gray-800 text-xs sm:text-sm">{u.username}</td>
                    <td className="px-3 py-3 text-xs" style={{ color: '#8a4a55' }}>{u.fullName || '—'}</td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ color: '#fff', backgroundColor: ROLE_COLORS[u.role] || '#666' }}
                      >
                        <Icon size={11} />
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-0.5">
                        {u.assignedStates.length === 0 ? (
                          <span className="text-[10px]" style={{ color: '#ad8b91' }}>Todos</span>
                        ) : (
                          u.assignedStates.slice(0, 3).map((s) => (
                            <span key={s} className="inline-block bg-teal-50 text-teal text-[9px] font-bold px-1 py-0.5 rounded">
                              {s}
                            </span>
                          ))
                        )}
                        {u.assignedStates.length > 3 && (
                          <span className="text-[9px]" style={{ color: '#ad8b91' }}>+{u.assignedStates.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-[10px]" style={{ color: '#ad8b91' }}>
                      {new Date(u.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditing({
                            id: u.id, username: u.username, password: '',
                            role: u.role, assignedStates: u.assignedStates, fullName: u.fullName || '',
                          })}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:bg-blue-50 active:scale-95"
                          style={{ color: '#1a7a4a' }}
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:bg-red-50 active:scale-95"
                          style={{ color: '#dc2626' }}
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#ece0e0' }}>
              <h3 className="text-lg font-bold" style={{ color: '#5e0b1e' }}>
                {editing.id ? 'Editar usuario' : 'Nuevo usuario'}
              </h3>
              <button onClick={() => setEditing(null)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#ad8b91' }}>Usuario</label>
                <input
                  value={editing.username}
                  onChange={(e) => setEditing({ ...editing, username: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none uppercase"
                  style={{ borderColor: '#dcc9cc' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#ad8b91' }}>Nombre completo</label>
                <input
                  value={editing.fullName}
                  onChange={(e) => setEditing({ ...editing, fullName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                  style={{ borderColor: '#dcc9cc' }}
                  placeholder="Ej: Alberto Mireles"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#ad8b91' }}>
                  Contraseña {editing.id && '(dejar vacío para mantener)'}
                </label>
                <input
                  type="password"
                  value={editing.password}
                  onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                  style={{ borderColor: '#dcc9cc' }}
                  placeholder={editing.id ? '••••••' : '0000'}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#ad8b91' }}>Rol</label>
                <div className="flex gap-2">
                  {['administrador', 'territorial', 'coordinador', 'promotor'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setEditing({ ...editing, role: r })}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                        editing.role === r
                          ? 'text-white shadow-sm'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border'
                      }`}
                      style={editing.role === r ? { backgroundColor: ROLE_COLORS[r] } : { borderColor: '#ece0e0' }}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#ad8b91' }}>
                  Estados asignados
                  {editing.role === 'administrador' ? ' (administrador tiene acceso a todos)' : ''}
                  <span className="font-normal text-gray-400 ml-1">({editing.assignedStates.length})</span>
                </label>
                <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto p-2 border rounded-lg" style={{ borderColor: '#ece0e0' }}>
                  {ESTADOS.map((est) => (
                    <button
                      key={est}
                      onClick={() => toggleState(est)}
                      disabled={editing.role === 'administrador'}
                      className={`text-[10px] font-bold px-2 py-1 rounded transition-all active:scale-95 ${
                        editing.assignedStates.includes(est)
                          ? 'bg-guinda text-white'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border'
                      }`}
                      style={editing.assignedStates.includes(est) ? {} : { borderColor: '#ece0e0' }}
                    >
                      {est}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: '#ece0e0' }}>
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:bg-gray-100 active:scale-95"
                style={{ color: '#666' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editing.username}
                className="inline-flex items-center gap-2 bg-guinda text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-guinda-light active:scale-95 transition-all duration-150 ease-out disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {editing.id ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#ece0e0' }}>
              <h3 className="text-lg font-bold" style={{ color: '#5e0b1e' }}>Importar usuarios</h3>
              <button onClick={() => { setImportOpen(false); setImportResult(null); setImportText(''); }} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs" style={{ color: '#ad8b91' }}>
                Pega los datos en formato CSV. Usa la plantilla para ver el formato correcto.
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border rounded-lg text-xs font-mono outline-none"
                style={{ borderColor: '#dcc9cc' }}
                placeholder="username,password,role,full_name,assigned_states&#10;PROMO2,0000,promotor,Juan Pérez,&quot;[&quot;&quot;JALISCO&quot;&quot;]&quot;"
              />
              {importResult && (
                <div className={`text-xs p-3 rounded-lg ${importResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {importResult.error || importResult.message}
                  {importResult.results && (
                    <ul className="mt-1 space-y-0.5">
                      {importResult.results.map((r: any, i: number) => (
                        <li key={i}>{r.success ? '✅' : '❌'} {r.username} {r.error ? `— ${r.error}` : ''}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: '#ece0e0' }}>
              <button
                onClick={() => { setImportOpen(false); setImportResult(null); setImportText(''); }}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:bg-gray-100 active:scale-95"
                style={{ color: '#666' }}
              >
                Cerrar
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !importText.trim()}
                className="inline-flex items-center gap-2 bg-guinda text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-guinda-light active:scale-95 transition-all duration-150 ease-out disabled:opacity-50"
              >
                {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

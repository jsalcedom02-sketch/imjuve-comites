import { useState } from 'react';
import { UserCog, ClipboardList } from 'lucide-react';
import AdminUsersList from './AdminUsersList';
import AdminAuditLog from './AdminAuditLog';

const SUBTABS = [
  { id: 'users', label: 'Usuarios', icon: UserCog },
  { id: 'audit', label: 'Auditoría', icon: ClipboardList },
];

export default function AdminUsers() {
  const [subtab, setSubtab] = useState('users');

  return (
    <div className="space-y-6" style={{ fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
      <h2 className="text-xl font-bold" style={{ color: '#5e0b1e' }}>
        <UserCog size={22} className="inline mr-2" style={{ color: '#9e1b35' }} />
        Administración
      </h2>

      <div className="flex gap-1 bg-white/60 rounded-xl p-1 max-sm:flex-wrap inline-flex" style={{ border: '1px solid #ece0e0' }}>
        {SUBTABS.map((st) => (
          <button
            key={st.id}
            onClick={() => setSubtab(st.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${
              subtab === st.id
                ? 'bg-guinda text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
            style={subtab === st.id ? {} : { color: '#8a4a55' }}
          >
            <st.icon size={16} />
            {st.label}
          </button>
        ))}
      </div>

      {subtab === 'users' && <AdminUsersList />}
      {subtab === 'audit' && <AdminAuditLog />}
    </div>
  );
}

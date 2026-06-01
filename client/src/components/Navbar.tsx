import { ClipboardList, Archive, BarChart3, LogOut, Search, Upload, Landmark, UserCog } from 'lucide-react';
import { useComiteStore } from '../store/comiteStore';
import { useAuthStore } from '../store/authStore';
import logosUrl from '../assets/logo-comites.png';

const ROLE_LABELS: Record<string, string> = {
  administrador: 'Administrador',
  territorial: 'Territorial',
  coordinador: 'Coordinador',
  promotor: 'Promotor',
};

export default function Navbar() {
  const { activeTab, setActiveTab } = useComiteStore();
  const startLogout = useAuthStore((s) => s.startLogout);
  const role = useAuthStore((s) => s.role);
  const fullName = useAuthStore((s) => s.fullName);

  const isAdmin = role === 'administrador';
  const isTerritorial = role === 'territorial';

  const allTabs = [
    { id: 'registro' as const, label: 'Registro de Comité', icon: ClipboardList },
    { id: 'historial' as const, label: 'Historial de Actas', icon: Archive },
    ...(isAdmin || isTerritorial || role === 'coordinador'
      ? [{ id: 'consulta' as const, label: 'Consulta de Comités', icon: Search }] : []),
    ...(isAdmin || isTerritorial
      ? [{ id: 'dashboard' as const, label: 'Estadísticas de Comités', icon: BarChart3 }] : []),
    ...(isAdmin || isTerritorial
      ? [{ id: 'estadisticas' as const, label: 'Estadística del Estado', icon: Landmark }] : []),
    ...(isAdmin ? [{ id: 'importar' as const, label: 'Cargar Comités', icon: Upload }] : []),
    ...(isAdmin ? [{ id: 'admin' as const, label: 'Usuarios', icon: UserCog }] : []),
  ];

  return (
    <header>
      {/* Header bar */}
      <div className="flex items-center gap-[18px] py-5 px-8 max-sm:px-4" style={{ background: '#f4eee4', borderBottom: '1px solid #dcc9cc', fontFamily: "'Kalam', cursive" }}>
        <a className="inline-flex items-center" href="#" aria-label="Gobierno de México · IMJUVE · Comités Jóvenes por la Transformación">
          <img src={logosUrl} alt="Gobierno de México · IMJUVE" className="h-[50px] max-sm:h-9 w-auto max-w-full block" />
        </a>
        <div className="flex-1" />
        <div className="flex items-center gap-[10px]">
          <span className="text-[11px] font-medium hidden sm:inline" style={{ color: '#ad8b91' }}>
            {fullName || ROLE_LABELS[role || ''] || role}
          </span>
          <button
            onClick={startLogout}
            className="inline-flex items-center gap-2 text-[13px] bg-white border px-[14px] py-[8px] rounded-full hover:bg-red-50 active:scale-95 transition-all duration-150 ease-out"
            style={{ color: '#9e1b35', borderColor: '#dcc9cc' }}
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Burgundy title bar */}
      <div className="bg-guinda text-white text-center py-4 px-8 max-sm:px-4 text-3xl max-sm:text-xl max-md:text-2xl font-extrabold tracking-wider" style={{ fontFamily: "'Kalam', cursive" }}>
        Comités de Jóvenes por la Transformación
      </div>

      {/* Navigation tabs */}
      <nav className="px-8 max-sm:px-4 pb-0" style={{ background: '#f4eee4', fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
        <div className="flex items-center gap-4 pt-2">
          <div className="flex gap-1 bg-white/60 rounded-xl p-1 max-sm:flex-wrap" style={{ border: '1px solid #ece0e0' }}>
            {allTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-out active:scale-95 ${
                  activeTab === tab.id
                    ? 'bg-guinda text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
                style={activeTab === tab.id ? {} : { color: '#8a4a55' }}
              >
                <tab.icon size={18} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}

import { useEffect } from 'react';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import RegistroComite from './components/RegistroComite';
import HistorialActas from './components/HistorialActas';
import ConsultaComites from './components/ConsultaComites';
import Dashboard from './components/Dashboard';
import EstadisticasEstado from './components/EstadisticasEstado';
import ImportarCSV from './components/ImportarCSV';
import ErrorBoundary from './components/ErrorBoundary';
import { useComiteStore } from './store/comiteStore';
import { useAuthStore } from './store/authStore';

export default function App() {
  const { activeTab } = useComiteStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loggingOut = useAuthStore((s) => s.loggingOut);
  const checkSession = useAuthStore((s) => s.checkSession);
  const syncFromServer = useComiteStore((s) => s.syncFromServer);
  const syncEstadisticasFromServer = useComiteStore((s) => s.syncEstadisticasFromServer);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (isAuthenticated) {
      syncFromServer();
      syncEstadisticasFromServer();
    }
  }, [isAuthenticated, syncFromServer, syncEstadisticasFromServer]);

  if (!isAuthenticated && !loggingOut) return <LoginPage />;

  return (
    <div className={loggingOut ? 'animate-page-out' : ''}>
      <Layout>
        <ErrorBoundary>
          {activeTab === 'registro' && <div key="registro" className="animate-page-in"><RegistroComite /></div>}
          {activeTab === 'historial' && <div key="historial" className="animate-page-in-left"><HistorialActas /></div>}
          {activeTab === 'consulta' && <div key="consulta" className="animate-page-in"><ConsultaComites /></div>}
          {activeTab === 'dashboard' && <div key="dashboard" className="animate-page-in-left"><Dashboard /></div>}
          {activeTab === 'estadisticas' && <div key="estadisticas" className="animate-page-in"><EstadisticasEstado /></div>}
          {activeTab === 'importar' && <div key="importar" className="animate-page-in-left"><ImportarCSV /></div>}
          {activeTab === 'admin' && <div key="admin" className="animate-page-in"><AdminUsers /></div>}
        </ErrorBoundary>
      </Layout>
    </div>
  );
}

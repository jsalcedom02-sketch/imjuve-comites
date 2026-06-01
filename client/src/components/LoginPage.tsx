import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import logosUrl from '../assets/logo-comites.png';

const SELVA = '#1a7a4a';

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setLoading(true);
    const ok = await login(user, pass);
    setLoading(false);
    if (!ok) setError(true);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#f4eee4' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-8 w-96 h-72 opacity-15" style={{ background: SELVA, clipPath: 'polygon(30% 0%, 100% 0%, 100% 65%, 60% 100%, 5% 60%, 0% 25%)', transform: 'rotate(18deg)' }} />
        <div className="absolute -top-20 left-1/4 w-64 h-56 opacity-10" style={{ background: '#005e63', clipPath: 'polygon(50% 0%, 100% 35%, 80% 100%, 20% 100%, 0% 35%)', transform: 'rotate(-12deg)' }} />
        <div className="absolute top-10 left-10 w-48 h-48 opacity-8" style={{ background: '#691C32', clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)', transform: 'rotate(35deg)' }} />
        <div className="absolute top-1/3 -right-10 w-72 h-64 opacity-12" style={{ background: SELVA, clipPath: 'polygon(0% 15%, 40% 0%, 100% 20%, 85% 100%, 15% 85%)', transform: 'rotate(-8deg)' }} />
        <div className="absolute top-1/2 left-1/5 w-56 h-56 opacity-10" style={{ background: '#005e63', clipPath: 'polygon(0% 0%, 100% 20%, 85% 100%, 0% 80%)', transform: 'rotate(-25deg)' }} />
        <div className="absolute top-2/3 right-1/4 w-40 h-40 opacity-8" style={{ background: SELVA, clipPath: 'polygon(40% 0%, 100% 15%, 85% 60%, 60% 100%, 0% 70%, 10% 30%)', transform: 'rotate(20deg)' }} />
        <div className="absolute -bottom-16 -left-10 w-80 h-64 opacity-10" style={{ background: '#691C32', clipPath: 'polygon(0% 30%, 40% 0%, 100% 30%, 85% 100%, 15% 100%)', transform: 'rotate(8deg)' }} />
        <div className="absolute -bottom-8 right-1/3 w-48 h-48 opacity-12" style={{ background: SELVA, clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)', transform: 'rotate(-15deg)' }} />
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 1440 900" preserveAspectRatio="none">
          <path d="M -100 150 Q 200 400 500 200 T 1000 300 T 1500 100" fill="none" stroke={SELVA} strokeWidth="2" strokeDasharray="0" />
          <path d="M -100 400 Q 300 150 600 500 T 1100 350 T 1500 600" fill="none" stroke="#005e63" strokeWidth="1.5" strokeDasharray="0" />
          <path d="M -100 650 Q 250 850 550 600 T 1050 750 T 1500 500" fill="none" stroke="#691C32" strokeWidth="2" strokeDasharray="0" />
          <path d="M 300 -50 Q 500 250 700 100 T 1100 250 T 1440 50" fill="none" stroke={SELVA} strokeWidth="1" strokeDasharray="0" />
          <path d="M 200 950 Q 400 700 700 850 T 1200 700 T 1500 900" fill="none" stroke="#005e63" strokeWidth="1.5" strokeDasharray="0" />
          <path d="M -50 50 C 300 200 200 600 600 400 S 900 800 1440 600" fill="none" stroke="#691C32" strokeWidth="1.2" strokeDasharray="0" />
        </svg>
        <div className="absolute top-0 left-0 w-full h-full opacity-5" style={{ background: `linear-gradient(135deg, ${SELVA} 0%, transparent 25%, transparent 75%, ${SELVA} 100%)` }} />
        <div className="absolute top-0 left-0 w-full h-full opacity-5" style={{ background: `linear-gradient(45deg, #005e63 0%, transparent 20%, transparent 80%, #005e63 100%)` }} />
      </div>
      <div className="h-2 w-full relative" style={{ background: SELVA }} />
      <div className="flex-1 flex items-center justify-center relative">
        <div className="flex flex-col items-center justify-center w-full px-6">
          <div className="w-full max-w-md mx-auto mb-6">
            <img src={logosUrl} alt="Comités Jóvenes" className="w-full block" />
          </div>
          <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
              <p className="text-center text-lg font-bold w-full" style={{ color: '#5e0b1e', fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
                Plataforma institucional de comités
              </p>
              <div className="w-full space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#6d0f22', fontFamily: "'Noto Sans', system-ui, sans-serif" }}>Usuario</label>
                  <input
                    type="text"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none text-sm"
                    style={{ borderColor: '#dcc9cc', fontFamily: "'Noto Sans', system-ui, sans-serif" }}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#6d0f22', fontFamily: "'Noto Sans', system-ui, sans-serif" }}>Contraseña</label>
                  <input
                    type="password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none text-sm"
                    style={{ borderColor: '#dcc9cc', fontFamily: "'Noto Sans', system-ui, sans-serif" }}
                  />
                </div>
              </div>
              {error && (
                <p className="text-sm font-semibold w-full text-center" style={{ color: '#9e1b35', fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
                  Usuario o contraseña incorrectos
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-1.5 rounded-lg text-white font-bold text-sm tracking-wide active:scale-[0.98] transition-all duration-150 ease-out disabled:opacity-50"
                style={{ background: '#691C32', fontFamily: "'Noto Sans', system-ui, sans-serif", border: '2px solid #1a7a4a', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.1)' }}
              >
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <footer className="py-3 flex flex-col items-center" style={{ borderTop: '1px solid #dcc9cc' }}>
        <div className="text-[11px]" style={{ color: '#ad8b91', fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
          Plataforma institucional de comités · Instituto Mexicano de la Juventud · Gobierno de México · 2026
        </div>
      </footer>
      <div className="h-2 w-full" style={{ background: SELVA }} />
    </div>
  );
}

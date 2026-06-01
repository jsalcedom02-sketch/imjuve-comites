import type { ReactNode } from 'react';
import Navbar from './Navbar';
import logosUrl from '../assets/logo-comites.png';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#f4eee4', fontFamily: "'Kalam', cursive" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-8 w-80 h-64 opacity-10" style={{ background: '#1a7a4a', clipPath: 'polygon(30% 0%, 100% 0%, 100% 65%, 60% 100%, 5% 60%, 0% 25%)', transform: 'rotate(15deg)' }} />
        <div className="absolute -top-16 left-1/3 w-56 h-48 opacity-8" style={{ background: '#005e63', clipPath: 'polygon(50% 0%, 100% 35%, 80% 100%, 20% 100%, 0% 35%)', transform: 'rotate(-10deg)' }} />
        <div className="absolute top-12 left-8 w-40 h-40 opacity-6" style={{ background: '#691C32', clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)', transform: 'rotate(40deg)' }} />
        <div className="absolute top-1/3 -right-8 w-64 h-56 opacity-8" style={{ background: '#1a7a4a', clipPath: 'polygon(0% 15%, 40% 0%, 100% 20%, 85% 100%, 15% 85%)', transform: 'rotate(-6deg)' }} />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 opacity-6" style={{ background: '#005e63', clipPath: 'polygon(0% 0%, 100% 20%, 85% 100%, 0% 80%)', transform: 'rotate(-20deg)' }} />
        <div className="absolute top-2/3 right-1/3 w-36 h-36 opacity-8" style={{ background: '#1a7a4a', clipPath: 'polygon(40% 0%, 100% 15%, 85% 60%, 60% 100%, 0% 70%, 10% 30%)', transform: 'rotate(22deg)' }} />
        <div className="absolute -bottom-12 -left-8 w-72 h-56 opacity-8" style={{ background: '#691C32', clipPath: 'polygon(0% 30%, 40% 0%, 100% 30%, 85% 100%, 15% 100%)', transform: 'rotate(6deg)' }} />
        <div className="absolute -bottom-6 right-1/4 w-40 h-40 opacity-10" style={{ background: '#1a7a4a', clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)', transform: 'rotate(-12deg)' }} />
        <div className="absolute inset-0 opacity-4" style={{ background: `linear-gradient(135deg, #1a7a4a 0%, transparent 30%, transparent 70%, #1a7a4a 100%)` }} />
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15" viewBox="0 0 1440 900" preserveAspectRatio="none">
          <path d="M -100 200 Q 250 450 550 250 T 1050 350 T 1500 150" fill="none" stroke="#1a7a4a" strokeWidth="2" />
          <path d="M -100 500 Q 350 250 650 550 T 1150 400 T 1500 700" fill="none" stroke="#005e63" strokeWidth="1.5" />
          <path d="M 300 -50 Q 550 300 800 150 T 1200 300 T 1440 100" fill="none" stroke="#691C32" strokeWidth="1.2" />
          <path d="M -50 850 Q 300 650 600 800 T 1100 650 T 1500 850" fill="none" stroke="#1a7a4a" strokeWidth="1.5" />
        </svg>
      </div>
      <Navbar />
      <main className="w-full mx-auto px-4 sm:px-8 pt-4 pb-7 flex-1 relative" style={{ maxWidth: '1280px' }}>
        {children}
      </main>
      <footer className="py-6 flex flex-col items-center gap-4 relative" style={{ borderTop: '1px solid #dcc9cc' }}>
        <div className="text-[12.5px]" style={{ color: '#ad8b91', fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
          Plataforma institucional de comités · Instituto Mexicano de la Juventud · Gobierno de México · 2026
        </div>
        <img src={logosUrl} alt="Gobierno de México · IMJUVE" className="h-[45px] w-auto block" />
      </footer>
    </div>
  );
}

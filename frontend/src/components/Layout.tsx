import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div
      className="min-h-screen text-neutral-100 font-sans selection:bg-amber-500/30"
      style={{ background: 'linear-gradient(160deg, #080d1a 0%, #0d1117 50%, #080808 100%)' }}
    >
      {/* ── NAVBAR ── */}
      <nav
        className="border-b sticky top-0 z-50 backdrop-blur-xl"
        style={{ borderColor: 'rgba(251,191,36,0.12)', background: 'rgba(8,13,26,0.88)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group hover:opacity-90 transition-opacity">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg relative"
                style={{
                  background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2040 100%)',
                  border: '1px solid rgba(251,191,36,0.35)',
                  boxShadow: '0 0 16px rgba(251,191,36,0.1)',
                }}
              >
                🥎
                <span className="absolute -top-1 -right-1 text-[10px]" style={{ filter: 'drop-shadow(0 0 4px #fbbf24)' }}>⚡</span>
              </div>
              <div>
                <div
                  className="text-base font-black tracking-tight leading-none"
                  style={{ background: 'linear-gradient(90deg,#ffffff 0%,#fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  TORNEOS RELÁMPAGO
                </div>
                <div className="text-[10px] font-black tracking-[0.18em] uppercase mt-0.5" style={{ color: '#fbbf24' }}>
                  ENVIGADO · SOFTBALL
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/amistoso"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-90"
                style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}
              >
                📣 Amistosos
              </Link>

              <div
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)', color: '#fbbf24' }}
              >
                🥎 Temporada 2026
              </div>

              <button
                onClick={() => supabase.auth.signOut()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-opacity hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa' }}
              >
                🔒 Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t mt-20 py-6" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-neutral-600 text-xs font-bold uppercase tracking-widest">🥎 Torneos Relámpago Envigado · 2026</p>
          <p className="text-neutral-700 text-xs">Polideportivo Sur · Envigado, Antioquia</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
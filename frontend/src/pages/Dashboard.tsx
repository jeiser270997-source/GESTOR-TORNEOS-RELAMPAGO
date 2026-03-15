import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Torneo } from '../types';
import { Calendar, Users, ChevronRight, PlusCircle, Trash2, Send, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import InvitarModal from '../components/InvitarModal';

// ── Softball SVG decorativo ──────────────────────────────────────────────────
const SoftballHero = () => (
  <svg width="220" height="220" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Glow */}
    <circle cx="110" cy="110" r="108" fill="url(#outerGlow)" opacity="0.18"/>
    {/* Sombra */}
    <ellipse cx="110" cy="208" rx="55" ry="7" fill="#000" opacity="0.45"/>
    {/* Pelota */}
    <circle cx="110" cy="106" r="90" fill="url(#ballFill)"/>
    <circle cx="110" cy="106" r="90" fill="url(#ballShine)" opacity="0.6"/>
    <circle cx="110" cy="106" r="90" stroke="#d4c490" strokeWidth="2"/>
    {/* Costuras izquierda */}
    <path d="M58 68 C64 78, 64 88, 58 98 C52 108, 52 118, 58 128 C64 138, 64 148, 58 158"
      stroke="#dc2626" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <path d="M48 74 C54 84, 54 94, 48 104 C42 114, 42 124, 48 134"
      stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4"/>
    {/* Costuras derecha */}
    <path d="M162 68 C156 78, 156 88, 162 98 C168 108, 168 118, 162 128 C156 138, 156 148, 162 158"
      stroke="#dc2626" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <path d="M172 74 C166 84, 166 94, 172 104 C178 114, 178 124, 172 134"
      stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4"/>
    {/* Texto SOFTBALL centrado */}
    <text x="110" y="98" textAnchor="middle" fill="#5a4a1a" fontSize="13" fontWeight="900" fontFamily="Arial" letterSpacing="3">SOFTBALL</text>
    <text x="110" y="118" textAnchor="middle" fill="#7a6a2a" fontSize="10" fontWeight="700" fontFamily="Arial" letterSpacing="2">ENVIGADO</text>
    {/* Relámpago */}
    <text x="110" y="140" textAnchor="middle" fontSize="28" fontFamily="Arial">⚡</text>
    <defs>
      <radialGradient id="ballFill" cx="35%" cy="28%" r="75%">
        <stop offset="0%" stopColor="#fffef2"/>
        <stop offset="55%" stopColor="#f5efcc"/>
        <stop offset="100%" stopColor="#e0d498"/>
      </radialGradient>
      <radialGradient id="ballShine" cx="30%" cy="22%" r="45%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9"/>
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="outerGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fbbf24"/>
        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/>
      </radialGradient>
    </defs>
  </svg>
);

// ── Diamante SVG decorativo ──────────────────────────────────────────────────
const DiamondSVG = () => (
  <svg width="160" height="130" viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30">
    {/* Bases */}
    <rect x="72" y="2" width="16" height="16" rx="2" fill="#fbbf24" transform="rotate(45 80 10)"/>
    <rect x="2" y="57" width="16" height="16" rx="2" fill="#fbbf24" transform="rotate(45 10 65)"/>
    <rect x="142" y="57" width="16" height="16" rx="2" fill="#fbbf24" transform="rotate(45 150 65)"/>
    <rect x="72" y="112" width="16" height="16" rx="2" fill="#fbbf24" transform="rotate(45 80 120)"/>
    {/* Líneas del diamante */}
    <line x1="80" y1="10" x2="10" y2="65" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 3"/>
    <line x1="80" y1="10" x2="150" y2="65" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 3"/>
    <line x1="10" y1="65" x2="80" y2="120" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 3"/>
    <line x1="150" y1="65" x2="80" y2="120" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 3"/>
    {/* Home plate */}
    <polygon points="80,112 72,120 72,128 88,128 88,120" fill="#fbbf24" opacity="0.5"/>
    {/* Pitcher mound */}
    <circle cx="80" cy="65" r="5" fill="#fbbf24" opacity="0.4"/>
  </svg>
);

const Dashboard: React.FC = () => {
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitarModalOpen, setInvitarModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchTorneos(); }, []);

  const fetchTorneos = () => {
    api.getTorneos().then(setTorneos).catch(console.error).finally(() => setLoading(false));
  };

  const handleDelete = async (e: React.MouseEvent, id: string, numero: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`¿Eliminar torneo #${numero}?`)) {
      try {
        await api.deleteTorneo(id);
        setTorneos(prev => prev.filter(t => t.id !== id));
      } catch {
        alert('Error al eliminar el torneo');
      }
    }
  };

  return (
    <div className="space-y-12">

      {/* ══ HERO ═══════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden rounded-3xl p-8 sm:p-12"
        style={{
          background: 'linear-gradient(135deg, #0d1f3c 0%, #0a1628 40%, #0f0f0f 100%)',
          border: '1px solid rgba(251,191,36,0.2)',
          boxShadow: '0 0 60px rgba(251,191,36,0.04), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Glow fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(251,191,36,0.06) 0%, transparent 70%)' }}/>
        {/* Diamante decorativo fondo derecha */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block pointer-events-none">
          <DiamondSVG />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Texto */}
          <div className="max-w-xl">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black mb-6 uppercase tracking-widest"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}
            >
              <Zap className="w-3 h-3" /> Torneos Relámpago · Temporada 2026
            </div>

            <h2
              className="text-4xl sm:text-5xl font-black tracking-tight mb-3 leading-none"
              style={{ background: 'linear-gradient(135deg, #ffffff 0%, #e2d58a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              GESTOR DE<br />CUADRANGULARES
            </h2>
            <p className="text-base mb-2 font-bold" style={{ color: '#fbbf24' }}>
              🥎 Softball · Polideportivo Sur · Envigado
            </p>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-md">
              Administra torneos, registra equipos, genera brackets automáticos y comparte flayers profesionales.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <button
                onClick={() => navigate('/nuevo-torneo')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: '#0a0a0a',
                  boxShadow: '0 8px 24px rgba(251,191,36,0.25)',
                }}
              >
                <PlusCircle className="w-4 h-4" />
                NUEVO TORNEO
              </button>
              <button
                onClick={() => setInvitarModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all hover:-translate-y-0.5"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#ffffff',
                }}
              >
                <Send className="w-4 h-4" />
                INVITAR EQUIPOS
              </button>
            </div>
          </div>

          {/* Softball SVG hero */}
          <div className="hidden lg:flex items-center justify-center shrink-0">
            <div className="relative">
              {/* Anillo de brillo */}
              <div className="absolute inset-0 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.12) 30%, transparent 70%)' }}/>
              <SoftballHero />
            </div>
          </div>
        </div>

        {/* Stats rápidas */}
        <div
          className="relative z-10 mt-8 pt-6 grid grid-cols-3 gap-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {[
            { label: 'TORNEOS', value: torneos.length, icon: '🏆' },
            { label: 'MAX EQUIPOS', value: '4', icon: '👥' },
            { label: 'SEDE', value: 'POLI SUR', icon: '📍' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-lg mb-0.5">{stat.icon}</div>
              <div className="text-xl font-black text-white">{stat.value}</div>
              <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(251,191,36,0.6)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ TORNEOS ACTIVOS ════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
            <span style={{ color: '#fbbf24' }}>⚡</span> Torneos Activos
            <span
              className="px-2.5 py-0.5 rounded-full text-sm font-black"
              style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}
            >
              {torneos.length}
            </span>
          </h3>
          <button
            onClick={() => navigate('/nuevo-torneo')}
            className="flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa' }}
          >
            <PlusCircle className="w-3.5 h-3.5" /> Nuevo
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-56 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}/>
            ))}
          </div>
        ) : torneos.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center p-16 rounded-3xl border-dashed"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(251,191,36,0.15)' }}
          >
            <div className="text-6xl mb-4">🥎</div>
            <h3 className="text-xl font-black text-white mb-2">Sin torneos aún</h3>
            <p className="text-neutral-500 text-sm text-center max-w-xs mb-8">
              Crea el primer cuadrangular de la temporada 2026.
            </p>
            <button
              onClick={() => navigate('/nuevo-torneo')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm shadow-lg transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%)', color: '#0a0a0a', boxShadow: '0 8px 24px rgba(251,191,36,0.2)' }}
            >
              <PlusCircle className="w-4 h-4" /> CREAR CUADRANGULAR
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {torneos.map(torneo => (
              <Link
                to={torneo.estado === 'creado' ? `/torneo/${torneo.id}/configuracion` : `/torneo/${torneo.id}`}
                key={torneo.id}
                className="group flex flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: 'linear-gradient(135deg, rgba(20,30,50,0.8) 0%, rgba(15,15,20,0.9) 100%)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(torneo.fecha_inicio), 'dd MMM yyyy')}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                      style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
                    >
                      {torneo.estado.replace('_', ' ')}
                    </span>
                    <button
                      onClick={e => handleDelete(e, torneo.id, torneo.numero_interno)}
                      className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      style={{ color: '#555' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#555'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Softball mini */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}
                  >
                    🥎
                  </div>
                  <h4 className="text-base font-black text-white leading-tight group-hover:text-amber-300 transition-colors">
                    Torneos Relámpago Envigado<br />
                    <span style={{ color: '#fbbf24' }}>#{torneo.numero_interno}</span>
                  </h4>
                </div>

                <div
                  className="mt-auto pt-4 flex items-center justify-between border-t"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold">
                    <Users className="w-3.5 h-3.5" />
                    {torneo.equipos?.length || 0}/4 Equipos
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-amber-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ══ INVITAR ════════════════════════════════════════════════════════════ */}
      <section
        className="rounded-3xl p-8"
        style={{
          background: 'linear-gradient(135deg, #0d1f3c 0%, #0a1628 100%)',
          border: '1px solid rgba(251,191,36,0.15)',
        }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}
            >
              📨
            </div>
            <div>
              <h4 className="text-lg font-black text-white uppercase tracking-tight">Convocar Equipos</h4>
              <p className="text-neutral-500 text-sm">Genera la invitación oficial con fechas y horarios.</p>
            </div>
          </div>
          <button
            onClick={() => setInvitarModalOpen(true)}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-black text-sm shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%)',
              color: '#0a0a0a',
              boxShadow: '0 8px 24px rgba(251,191,36,0.2)',
            }}
          >
            <Send className="w-4 h-4" />
            📧 INVITAR A EQUIPOS
          </button>
        </div>
      </section>

      <InvitarModal
        isOpen={invitarModalOpen}
        onClose={() => setInvitarModalOpen(false)}
        torneoNumero={torneos.length + 1}
      />
    </div>
  );
};

export default Dashboard;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Torneo, Equipo, Juego } from '../types';
import { Trophy, Download, Share2, ChevronLeft, Edit2, FileText, Send, Users, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import html2pdf from 'html2pdf.js';
import EditTeamModal from '../components/EditTeamModal';
import EditFinalModal from '../components/EditFinalModal';

// Las fechas ya vienen correctas desde el backend (convertToUTC en TournamentBrackets)
// Solo parseamos normalmente
const parseDate = (dateString: string) => new Date(dateString);

const format12h = (hora24: string): string => {
  if (!hora24 || !hora24.includes(':')) return hora24;
  const [h, m] = hora24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

// ── SVG fondo softball profesional ────────────────────────────────────────────
const buildFlyerSVGBackground = (isFinal: boolean) => {
  const baseColor   = isFinal ? '#1a0a00' : '#0a1a0f';
  const accentColor = isFinal ? '#f59e0b' : '#fbbf24';
  const glowColor   = isFinal ? 'rgba(245,158,11,0.18)' : 'rgba(251,191,36,0.14)';

  return `
    <rect width="1080" height="1350" fill="${baseColor}"/>
    <radialGradient id="bg" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="${glowColor}"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <rect width="1080" height="1350" fill="url(#bg)"/>
    <g opacity="0.06" transform="translate(540,700)">
      <polygon points="0,-280 280,0 0,280 -280,0" fill="none" stroke="${accentColor}" stroke-width="3"/>
      <polygon points="0,-200 200,0 0,200 -200,0" fill="none" stroke="${accentColor}" stroke-width="2"/>
      <line x1="0" y1="-280" x2="0" y2="280" stroke="${accentColor}" stroke-width="1.5" stroke-dasharray="8 6"/>
      <line x1="-280" y1="0" x2="280" y2="0" stroke="${accentColor}" stroke-width="1.5" stroke-dasharray="8 6"/>
      <rect x="-18" y="-298" width="36" height="36" rx="4" fill="${accentColor}" transform="rotate(45 0 -280)"/>
      <rect x="-18" y="262" width="36" height="36" rx="4" fill="${accentColor}" transform="rotate(45 0 280)"/>
      <rect x="-298" y="-18" width="36" height="36" rx="4" fill="${accentColor}" transform="rotate(45 -280 0)"/>
      <rect x="262" y="-18" width="36" height="36" rx="4" fill="${accentColor}" transform="rotate(45 280 0)"/>
      <circle cx="0" cy="0" r="22" fill="${accentColor}" opacity="0.5"/>
    </g>
    <g opacity="0.07" transform="translate(940, 120)">
      <circle cx="0" cy="0" r="110" fill="#f5f0cc" stroke="#d4c490" stroke-width="2"/>
      <radialGradient id="ballR" cx="30%" cy="25%" r="70%">
        <stop offset="0%" stop-color="#fffef2"/>
        <stop offset="100%" stop-color="#e0d498"/>
      </radialGradient>
      <circle cx="0" cy="0" r="110" fill="url(#ballR)"/>
      <path d="M-50,-80 C-38,-60,-38,-40,-50,-20 C-62,0,-62,20,-50,40 C-38,60,-38,80,-50,100" stroke="#dc2626" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M50,-80 C38,-60,38,-40,50,-20 C62,0,62,20,50,40 C38,60,38,80,50,100" stroke="#dc2626" stroke-width="5" stroke-linecap="round" fill="none"/>
    </g>
    <g opacity="0.05" transform="translate(120, 1220)">
      <circle cx="0" cy="0" r="80" fill="#f5f0cc" stroke="#d4c490" stroke-width="2"/>
      <path d="M-36,-58 C-28,-44,-28,-30,-36,-16 C-44,0,-44,14,-36,30" stroke="#dc2626" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M36,-58 C28,-44,28,-30,36,-16 C44,0,44,14,36,30" stroke="#dc2626" stroke-width="4" stroke-linecap="round" fill="none"/>
    </g>
    <line x1="0" y1="420" x2="1080" y2="420" stroke="${accentColor}" stroke-width="1" opacity="0.08"/>
    <line x1="0" y1="900" x2="1080" y2="900" stroke="${accentColor}" stroke-width="1" opacity="0.08"/>
    <rect x="24" y="24" width="1032" height="1302" rx="28" fill="none" stroke="${accentColor}" stroke-width="4" opacity="0.7"/>
    <rect x="34" y="34" width="1012" height="1282" rx="22" fill="none" stroke="${accentColor}" stroke-width="1" opacity="0.3"/>
  `;
};

const TournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [torneo, setTorneo] = useState<Torneo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTeam, setEditingTeam] = useState<Equipo | null>(null);
  const [isFinalModalOpen, setIsFinalModalOpen] = useState(false);
  const [promoTab, setPromoTab] = useState<{ juego: Juego } | null>(null);

  const fetchTorneo = async () => {
    if (!id) return;
    try {
      const data = await api.getTorneo(id);
      setTorneo(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTorneo(); }, [id]);

  const getTeamName = (teamId: string) => {
    if (teamId === 'TBD') return 'POR DEFINIR';
    return torneo?.equipos.find(e => e.id === teamId)?.nombre || 'DESCONOCIDO';
  };

  const getTeamRoster = (teamId: string) => {
    return torneo?.equipos.find(e => e.id === teamId)?.roster || [];
  };

  // ─── PDF ROSTER — 25 jugadores, 1 sola hoja ───────────────────────────────
  const generateRosterPDF = async (juego: Juego) => {
    const local = getTeamName(juego.equipo_local_id);
    const visitante = getTeamName(juego.equipo_visitante_id);
    const localRoster = getTeamRoster(juego.equipo_local_id);
    const visitanteRoster = getTeamRoster(juego.equipo_visitante_id);

    if (juego.equipo_local_id === 'TBD' || juego.equipo_visitante_id === 'TBD') {
      alert('Debes definir los equipos antes de generar el PDF.');
      return;
    }

    const filas = (roster: ReturnType<typeof getTeamRoster>) =>
      Array.from({ length: 25 }).map((_, i) => {
        const p = roster[i];
        const bg = i % 2 === 0 ? '#ffffff' : '#f5f5f5';
        return `<tr style="background:${bg};">
          <td style="padding:1.2mm 2mm;text-align:center;font-size:9px;font-weight:700;border-bottom:1px solid #e5e5e5;">${p?.numero_camiseta || ''}</td>
          <td style="padding:1.2mm 2mm;text-align:left;font-size:9px;border-bottom:1px solid #e5e5e5;">${p?.nombre?.toUpperCase() || ''}</td>
        </tr>`;
      }).join('');

    const printDiv = document.createElement('div');
    printDiv.innerHTML = `
      <div style="
        width:215.9mm;
        height:279.4mm;
        padding:6mm 8mm;
        background:white;
        color:black;
        font-family:Arial,sans-serif;
        box-sizing:border-box;
        display:flex;
        flex-direction:column;
        overflow:hidden;
      ">
        <!-- HEADER -->
        <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:3mm;margin-bottom:4mm;flex-shrink:0;">
          <div style="font-size:16px;font-weight:900;letter-spacing:1px;margin-bottom:1mm;">
            🥎 TORNEOS RELÁMPAGO ENVIGADO
          </div>
          <div style="font-size:13px;font-weight:800;margin-bottom:1mm;">
            ${juego.ronda.replace('_', ' ').toUpperCase()}
          </div>
          <div style="font-size:12px;font-weight:700;margin-bottom:1mm;">
            ${local.toUpperCase()} vs ${visitante.toUpperCase()}
          </div>
          <div style="font-size:10px;color:#333;">
            ${format(parseDate(juego.fecha), 'eeee dd MMMM yyyy', { locale: es }).toUpperCase()} · ${format12h(juego.hora)}
          </div>
          <div style="font-size:9px;color:#555;margin-top:1mm;">
            📍 Polideportivo Sur · Envigado, Antioquia
          </div>
        </div>

        <!-- DOS COLUMNAS -->
        <div style="display:flex;gap:5mm;flex:1;min-height:0;">

          <!-- LOCAL -->
          <div style="flex:1;display:flex;flex-direction:column;">
            <div style="background:#111;color:#fff;padding:1.5mm 3mm;font-size:10px;font-weight:900;margin-bottom:2mm;text-align:center;letter-spacing:1px;flex-shrink:0;">
              ${local.toUpperCase()}
            </div>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#333;color:#fff;">
                  <th style="width:12mm;padding:1.5mm;font-size:8px;text-align:center;">#</th>
                  <th style="padding:1.5mm;font-size:8px;text-align:left;">JUGADOR</th>
                </tr>
              </thead>
              <tbody>${filas(localRoster)}</tbody>
            </table>
          </div>

          <!-- VISITANTE -->
          <div style="flex:1;display:flex;flex-direction:column;">
            <div style="background:#111;color:#fff;padding:1.5mm 3mm;font-size:10px;font-weight:900;margin-bottom:2mm;text-align:center;letter-spacing:1px;flex-shrink:0;">
              ${visitante.toUpperCase()}
            </div>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#333;color:#fff;">
                  <th style="width:12mm;padding:1.5mm;font-size:8px;text-align:center;">#</th>
                  <th style="padding:1.5mm;font-size:8px;text-align:left;">JUGADOR</th>
                </tr>
              </thead>
              <tbody>${filas(visitanteRoster)}</tbody>
            </table>
          </div>
        </div>

        <!-- FIRMAS -->
        <div style="display:flex;justify-content:space-around;border-top:1px solid #ccc;padding-top:3mm;margin-top:3mm;flex-shrink:0;">
          <div style="text-align:center;">
            <div style="width:50mm;border-bottom:1px solid #000;margin-bottom:1mm;"></div>
            <div style="font-size:8px;color:#555;">Delegado ${local}</div>
          </div>
          <div style="text-align:center;">
            <div style="width:50mm;border-bottom:1px solid #000;margin-bottom:1mm;"></div>
            <div style="font-size:8px;color:#555;">Delegado ${visitante}</div>
          </div>
          <div style="text-align:center;">
            <div style="width:35mm;border-bottom:1px solid #000;margin-bottom:1mm;"></div>
            <div style="font-size:8px;color:#555;">Árbitro</div>
          </div>
        </div>

        <!-- FOOTER -->
        <div style="text-align:center;font-size:7px;color:#aaa;margin-top:2mm;flex-shrink:0;">
          Documento Oficial · Torneos Relámpago Envigado 2026
        </div>
      </div>
    `;

    // Renderizar a imagen primero, luego meter en PDF — garantiza 1 sola hoja
    printDiv.style.cssText = 'position:absolute;left:-9999px;top:0;';
    document.body.appendChild(printDiv);

    try {
      const { default: html2canvas } = await import('html2canvas');
      const innerDiv = printDiv.firstElementChild as HTMLElement;
      const canvas = await html2canvas(innerDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: innerDiv.offsetWidth,
        height: innerDiv.offsetHeight,
        windowWidth: 816,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.97);
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH);
      pdf.save(`Roster_${juego.ronda}_${local}_vs_${visitante}.pdf`);
      alert('PDF generado correctamente — 1 hoja con 25 jugadores.');
    } catch (err) {
      console.error(err);
      alert('Error al generar PDF.');
    } finally {
      document.body.removeChild(printDiv);
    }
  };

  // ─── COPIAR MENSAJE ────────────────────────────────────────────────────────
  const copyFlyerText = (juego: Juego) => {
    const local = getTeamName(juego.equipo_local_id);
    const visitante = getTeamName(juego.equipo_visitante_id);
    const fecha = format(new Date(juego.fecha), "eeee dd 'de' MMMM", { locale: es }).toUpperCase();
    const horaFmt = format12h(juego.hora);
    const isFinal = juego.ronda === 'final';

    let text = '';
    if (isFinal) {
      text = `🏆 ¡TORNEOS RELÁMPAGO ENVIGADO!\n\n🥇 GRAN FINAL - CAMPEONATO\n\n🏅 ${local} vs 🏅 ${visitante}\n\n📅 ${fecha}\n🕐 ${horaFmt}\n📍 POLIDEPORTIVO SUR ENVIGADO\n\n👑 ¡ESTA ES LA HORA DE LA GLORIA!\n\n#TorneosRelámpago #Softball #Final #Envigado`;
    } else {
      const emotion = juego.ronda === 'semifinal_1' ? '🔥 SE VIENE LA ACCIÓN' : '🔥 LA BATALLA CONTINÚA';
      const accent  = juego.ronda === 'semifinal_1' ? '⚡ ¡A TRAER TU MEJOR JUEGO!' : '⚡ ¡A DARLO TODO EN LA CANCHA!';
      const emoji   = juego.ronda === 'semifinal_1' ? '🔴' : '🟡';
      const emoji2  = juego.ronda === 'semifinal_1' ? '🔵' : '🟢';
      text = `⚾ ¡TORNEOS RELÁMPAGO ENVIGADO!\n\n${emotion}\n\n${emoji} ${local} vs ${emoji2} ${visitante}\n\n📅 ${fecha}\n🕐 ${horaFmt}\n📍 POLIDEPORTIVO SUR ENVIGADO\n\n${accent}\n\n#TorneosRelámpago #Softball #Envigado`;
    }
    navigator.clipboard.writeText(text);
    alert('¡Mensaje copiado al portapapeles!');
  };

  // ─── DESCARGAR FLAYER PNG — SVG profesional ───────────────────────────────
  const downloadFlayerImage = async (juego: Juego) => {
    if (juego.equipo_local_id === 'TBD' || juego.equipo_visitante_id === 'TBD') return;

    const local       = getTeamName(juego.equipo_local_id);
    const visitante   = getTeamName(juego.equipo_visitante_id);
    const fecha       = format(new Date(juego.fecha), 'eeee dd MMMM', { locale: es }).toUpperCase();
    const horaFmt     = format12h(juego.hora);
    const isFinal     = juego.ronda === 'final';
    const accentColor = '#fbbf24';

    const rondaLabel = isFinal
      ? '🏆 GRAN FINAL 🏆'
      : juego.ronda === 'semifinal_1' ? '⚾ SEMIFINAL 1' : '⚾ SEMIFINAL 2';

    const tagline = isFinal
      ? '⚡ ¡LA HORA DE LA GLORIA! ⚡'
      : '⚡ ¡QUE COMIENCE LA ACCIÓN! ⚡';

    const localUp    = local.toUpperCase();
    const visitUp    = visitante.toUpperCase();

    // Partir nombre si es muy largo
    const splitName = (name: string, maxLen = 12) =>
      name.length > maxLen
        ? [name.substring(0, maxLen), name.substring(maxLen)]
        : [name, null];

    const [localL1, localL2]   = splitName(localUp);
    const [visitL1, visitL2]   = splitName(visitUp);

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      <defs>
        <radialGradient id="bg" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stop-color="${isFinal ? 'rgba(245,158,11,0.18)' : 'rgba(251,191,36,0.14)'}"/>
          <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
        <radialGradient id="ballR" cx="30%" cy="25%" r="70%">
          <stop offset="0%" stop-color="#fffef2"/>
          <stop offset="100%" stop-color="#e0d498"/>
        </radialGradient>
      </defs>

      ${buildFlyerSVGBackground(isFinal)}

      <!-- SOFTBALL EMOJI TOP -->
      <text x="540" y="112" text-anchor="middle" font-size="70" font-family="Arial">🥎</text>

      <!-- TORNEOS RELÁMPAGO -->
      <text x="540" y="182" text-anchor="middle"
        font-family="Arial Black,Arial" font-weight="900" font-size="56"
        fill="#ffffff" letter-spacing="3">TORNEOS RELÁMPAGO</text>

      <!-- ENVIGADO -->
      <text x="540" y="252" text-anchor="middle"
        font-family="Arial Black,Arial" font-weight="900" font-size="64"
        fill="${accentColor}" letter-spacing="6">ENVIGADO</text>

      <!-- SOFTBALL subtitle -->
      <text x="540" y="295" text-anchor="middle"
        font-family="Arial" font-weight="700" font-size="20"
        fill="rgba(255,255,255,0.4)" letter-spacing="8">S O F T B A L L</text>

      <!-- Separador -->
      <line x1="80" y1="322" x2="1000" y2="322" stroke="${accentColor}" stroke-width="2" opacity="0.4"/>

      <!-- RONDA -->
      <text x="540" y="410" text-anchor="middle"
        font-family="Arial Black,Arial" font-weight="900" font-size="52"
        fill="${accentColor}">${rondaLabel}</text>

      <!-- Equipo LOCAL -->
      <text x="200" y="510" text-anchor="middle" font-size="32" font-family="Arial">${isFinal ? '🏅' : '🔴'}</text>
      <text x="200" y="572" text-anchor="middle"
        font-family="Arial Black,Arial" font-weight="900" font-size="48" fill="#ffffff">${localL1}</text>
      ${localL2 ? `<text x="200" y="626" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="48" fill="#ffffff">${localL2}</text>` : ''}

      <!-- VS -->
      <text x="540" y="598" text-anchor="middle"
        font-family="Arial Black,Arial" font-weight="900" font-size="88"
        fill="${accentColor}" font-style="italic">VS</text>

      <!-- Equipo VISITANTE -->
      <text x="880" y="510" text-anchor="middle" font-size="32" font-family="Arial">${isFinal ? '🏅' : '🔵'}</text>
      <text x="880" y="572" text-anchor="middle"
        font-family="Arial Black,Arial" font-weight="900" font-size="48" fill="#ffffff">${visitL1}</text>
      ${visitL2 ? `<text x="880" y="626" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="48" fill="#ffffff">${visitL2}</text>` : ''}

      <!-- Separador -->
      <line x1="80" y1="720" x2="1000" y2="720" stroke="${accentColor}" stroke-width="2" opacity="0.3"/>

      <!-- FECHA -->
      <text x="540" y="800" text-anchor="middle"
        font-family="Arial" font-weight="700" font-size="34"
        fill="rgba(255,255,255,0.75)">📅 ${fecha}</text>

      <!-- HORA -->
      <text x="540" y="895" text-anchor="middle"
        font-family="Arial Black,Arial" font-weight="900" font-size="76"
        fill="#ffffff">🕐 ${horaFmt}</text>

      <!-- FONDO BOTTOM -->
      <rect x="0" y="1010" width="1080" height="340" fill="rgba(0,0,0,0.48)"/>
      <line x1="0" y1="1010" x2="1080" y2="1010" stroke="${accentColor}" stroke-width="2" opacity="0.4"/>

      <!-- SEDE -->
      <text x="540" y="1088" text-anchor="middle"
        font-family="Arial Black,Arial" font-weight="900" font-size="32"
        fill="#ffffff">📍 POLIDEPORTIVO SUR ENVIGADO</text>

      <!-- TAGLINE -->
      <text x="540" y="1158" text-anchor="middle"
        font-family="Arial" font-weight="700" font-size="28"
        fill="${accentColor}">${tagline}</text>

      <!-- HASHTAGS -->
      <text x="540" y="1224" text-anchor="middle"
        font-family="Arial" font-size="20"
        fill="rgba(255,255,255,0.38)">#TorneosRelámpago #Softball #Envigado</text>

      <!-- WEB -->
      <text x="540" y="1308" text-anchor="middle"
        font-family="Arial" font-size="17"
        fill="rgba(251,191,36,0.32)">torneosrelampagoenvigado.com</text>
    </svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = 1080 * 2;
      canvas.height = 1350 * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, 1080, 1350);
      URL.revokeObjectURL(url);
      const link = document.createElement('a');
      link.download = `Flayer_${juego.ronda}_${local}_vs_${visitante}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      alert('¡Flayer PNG generado correctamente!');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert('Error al generar el flayer. Intenta de nuevo.');
    };
    img.src = url;
  };

  if (loading) return <div className="text-white p-10 animate-pulse">Cargando detalles del torneo...</div>;
  if (!torneo)  return <div className="text-white p-10">Torneo no encontrado</div>;

  const semi1 = torneo.juegos.find(j => j.ronda === 'semifinal_1');
  const semi2 = torneo.juegos.find(j => j.ronda === 'semifinal_2');
  const final = torneo.juegos.find(j => j.ronda === 'final');

  return (
    <div className="space-y-10 pb-32">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group mb-4">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Volver al Dashboard
          </button>
          <h1 className="text-4xl font-black text-white tracking-tighter">TORNEO #{torneo.numero_interno}</h1>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mt-1">Configuración y Documentación</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate(`/torneo/${id}/configuracion`)}
            className="flex items-center gap-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:-translate-y-1 transition-all">
            <Settings className="w-5 h-5" /> EDITAR EQUIPOS
          </button>
          <button onClick={() => setIsFinalModalOpen(true)}
            className="flex items-center gap-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-neutral-950 px-6 py-3 rounded-2xl font-black shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 hover:-translate-y-1 transition-all">
            <Trophy className="w-5 h-5" /> EDITAR FINAL
          </button>
        </div>
      </div>

      {/* ── EQUIPOS Y ROSTERS ── */}
      <section className="space-y-6">
        <h3 className="text-lg font-black text-white flex items-center gap-3 ml-2">
          <Users className="w-5 h-5 text-blue-500" /> EQUIPOS Y ROSTERS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {torneo.equipos.map(equipo => (
            <div key={equipo.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 hover:border-neutral-700 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 font-black">
                  {equipo.nombre.charAt(0)}
                </div>
                <button onClick={() => setEditingTeam(equipo)}
                  className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <h4 className="text-white font-black truncate">{equipo.nombre}</h4>
              <p className="text-neutral-500 text-xs mt-1">{equipo.roster?.length || 0} Jugadores</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FLAYERS PROMOCIONALES ── */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center justify-between ml-2">
          <h3 className="text-lg font-black text-white flex items-center gap-3">
            <Share2 className="w-5 h-5 text-indigo-500" /> FLAYERS PROMOCIONALES
          </h3>
          <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">3 Variantes Disponibles</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[semi1, semi2, final].map((juego, idx) => {
            if (!juego) return null;
            const isDefined = juego.equipo_local_id !== 'TBD' && juego.equipo_visitante_id !== 'TBD';
            const title = idx < 2 ? `SEMIFINAL ${idx + 1}` : 'GRAN FINAL';
            return (
              <div key={juego.id}
                className={`bg-neutral-900 border ${isDefined ? 'border-neutral-800' : 'border-neutral-800/50 opacity-50'} rounded-3xl p-6 flex flex-col space-y-4`}>
                <div className="flex items-center gap-2 mb-2">
                  {idx < 2
                    ? <Trophy className="w-4 h-4 text-blue-500" />
                    : <Trophy className="w-4 h-4 text-yellow-500" />}
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{title}</span>
                </div>
                <div className="flex-1">
                  <div className="text-white font-black text-lg">{getTeamName(juego.equipo_local_id)}</div>
                  <div className="text-neutral-700 font-black italic text-xs my-1">VS</div>
                  <div className="text-white font-black text-lg">{getTeamName(juego.equipo_visitante_id)}</div>
                </div>
                <div className="pt-2 text-neutral-500 text-xs font-bold">
                  {isDefined && `${format(parseDate(juego.fecha), 'dd MMM', { locale: es }).toUpperCase()} · ${format12h(juego.hora)}`}
                </div>
                <div className="pt-2 space-y-2">
                  <button onClick={() => copyFlyerText(juego)} disabled={!isDefined}
                    className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30">
                    <Send className="w-3 h-3" /> COPIAR MENSAJE
                  </button>
                  <button onClick={() => setPromoTab({ juego })} disabled={!isDefined}
                    className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30">
                    VER PREVISUALIZACIÓN
                  </button>
                  <button onClick={() => downloadFlayerImage(juego)} disabled={!isDefined}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30">
                    <Download className="w-3 h-3" /> DESCARGAR IMAGEN PNG
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── PREVIEW MODAL ── */}
      {promoTab && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md" onClick={() => setPromoTab(null)} />
          <div className="relative bg-neutral-900 border border-neutral-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl p-8 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-6">
              <h4 className="text-white font-black uppercase tracking-widest text-sm">Vista Previa Flayer</h4>
              <button onClick={() => setPromoTab(null)} className="p-2 text-neutral-500 hover:text-white">✕</button>
            </div>
            <div className="w-full aspect-[1080/1350] rounded-2xl border-2 border-amber-500/40 overflow-hidden mb-6 flex flex-col items-center justify-center text-center"
              style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #0a1a0f 100%)' }}>
              <div className="text-4xl mb-1">🥎</div>
              <div className="text-[9px] font-black text-white tracking-widest">TORNEOS RELÁMPAGO</div>
              <div className="text-sm font-black mb-2" style={{ color: '#fbbf24' }}>ENVIGADO</div>
              <div className="text-[8px] font-black mb-3" style={{ color: '#fbbf24' }}>
                {promoTab.juego.ronda.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-xs font-black text-white">{getTeamName(promoTab.juego.equipo_local_id)}</div>
              <div className="text-[8px] font-black italic my-0.5" style={{ color: '#fbbf24' }}>VS</div>
              <div className="text-xs font-black text-white">{getTeamName(promoTab.juego.equipo_visitante_id)}</div>
              <div className="mt-2 text-[8px] text-neutral-400 uppercase">
                {format(parseDate(promoTab.juego.fecha), 'eeee dd MMMM', { locale: es })}
              </div>
              <div className="text-xs font-black text-white">{format12h(promoTab.juego.hora)}</div>
              <div className="mt-2 text-[7px] text-neutral-500">📍 POLIDEPORTIVO SUR ENVIGADO</div>
            </div>
            <button onClick={() => downloadFlayerImage(promoTab.juego)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all">
              DESCARGAR PNG
            </button>
          </div>
        </div>
      )}

      {/* ── DOCUMENTOS JORNADA (PDF) ── */}
      <section className="space-y-6 pt-6">
        <h3 className="text-lg font-black text-white flex items-center gap-3 ml-2">
          <FileText className="w-5 h-5 text-emerald-500" /> DOCUMENTOS JORNADA (PDF)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[semi1, semi2, final].map((juego, idx) => {
            if (!juego) return null;
            const isDefined = juego.equipo_local_id !== 'TBD' && juego.equipo_visitante_id !== 'TBD';
            return (
              <button key={juego.id} onClick={() => generateRosterPDF(juego)} disabled={!isDefined}
                className={`group relative overflow-hidden bg-neutral-900 border ${isDefined ? 'border-emerald-500/30 hover:border-emerald-500/60' : 'border-neutral-800 opacity-30'} p-8 rounded-3xl text-left transition-all hover:-translate-y-1`}>
                <div className="relative z-10">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl w-fit mb-4 text-emerald-500 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-white font-black text-xl mb-1">ROSTERS</h4>
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
                    {idx < 2 ? `SEMIFINAL ${idx + 1}` : 'GRAN FINAL'}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-black">
                    <Download className="w-3 h-3" /> DESCARGAR PDF
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FileText className="w-24 h-24 text-white" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── MODALS ── */}
      {editingTeam && (
        <EditTeamModal
          isOpen={!!editingTeam}
          onClose={() => setEditingTeam(null)}
          equipo={editingTeam as Equipo}
          onUpdate={fetchTorneo}
        />
      )}
      <EditFinalModal
        isOpen={isFinalModalOpen}
        onClose={() => setIsFinalModalOpen(false)}
        torneo={torneo}
        onUpdate={fetchTorneo}
      />
    </div>
  );
};

export default TournamentDetail;

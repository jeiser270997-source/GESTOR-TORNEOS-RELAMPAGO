import { useState } from 'react';
import { X, Copy, Download, CheckCircle, Calendar, Clock } from 'lucide-react';
import { format, parseISO, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';

interface InvitarModalProps {
  isOpen: boolean;
  onClose: () => void;
  torneoNumero: number;
}

const HORAS_FIN_DE_SEMANA = ['10:00','12:00','14:00','16:00','18:00','19:00','19:30','20:00'];
const HORA_ENTRE_SEMANA = '19:30';

const format12h = (hora24: string) => {
  if (!hora24 || !hora24.includes(':')) return hora24;
  const [h, m] = hora24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const formatFechaCorta = (fecha: string) => {
  if (!fecha) return '';
  try { return format(parseISO(fecha), "EEEE dd 'de' MMMM", { locale: es }).toUpperCase(); }
  catch { return fecha; }
};

interface JuegoProgramado { fecha: string; hora: string; }

const HoraPicker = ({ fecha, hora, onChange, label }: {
  fecha: string; hora: string; onChange: (h: string) => void; label: string;
}) => {
  const esFinDeSemana = fecha ? isWeekend(parseISO(fecha)) : false;
  if (!esFinDeSemana) {
    return (
      <div className="flex items-center gap-3">
        <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
        <div className="flex-1">
          <span className="text-xs text-neutral-500 block mb-1">{label}</span>
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-white font-bold text-sm flex items-center gap-2">
            <span>{format12h(HORA_ENTRE_SEMANA)}</span>
            <span className="text-[10px] text-neutral-500 font-normal">(entre semana — fijo)</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
      <div className="flex-1">
        <span className="text-xs text-neutral-500 block mb-1">{label} (fin de semana)</span>
        <select value={hora} onChange={e => onChange(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-2 font-bold text-sm focus:outline-none focus:border-blue-500 transition-colors">
          {HORAS_FIN_DE_SEMANA.map(h => <option key={h} value={h}>{format12h(h)}</option>)}
        </select>
      </div>
    </div>
  );
};

const InvitarModal = ({ isOpen, onClose, torneoNumero }: InvitarModalProps) => {
  const [semi1, setSemi1] = useState<JuegoProgramado>({ fecha: '', hora: '19:30' });
  const [semi2, setSemi2] = useState<JuegoProgramado>({ fecha: '', hora: '19:30' });
  const [finalJ, setFinalJ] = useState<JuegoProgramado>({ fecha: '', hora: '19:30' });
  const [copied, setCopied] = useState(false);
  const [generatingPNG, setGeneratingPNG] = useState(false);

  if (!isOpen) return null;

  const getHoraEfectiva = (juego: JuegoProgramado) => {
    if (!juego.fecha) return juego.hora;
    return isWeekend(parseISO(juego.fecha)) ? juego.hora : HORA_ENTRE_SEMANA;
  };

  const buildMensaje = () => {
    const linea = (emoji: string, label: string, juego: JuegoProgramado) => {
      if (!juego.fecha) return `${emoji} ${label}\n📅 Por definir\n🕒 Por definir`;
      return `${emoji} ${label}\n📅 ${formatFechaCorta(juego.fecha)}\n🕒 ${format12h(getHoraEfectiva(juego))}`;
    };
    return `🥎 TORNEOS RELÁMPAGO ENVIGADO 🥎\n🔥 INVITACIÓN OFICIAL 🔥\n\n📅 PROGRAMACIÓN DEL TORNEO\n\n${linea('🔥', 'SEMIFINAL 1', semi1)}\n\n${linea('🔥', 'SEMIFINAL 2', semi2)}\n\n${linea('🏆', 'GRAN FINAL', finalJ)}\n\n💰 INSCRIPCIÓN: $500.000\n🏆 PREMIO CAMPEÓN: $1.000.000\nIncluye ambos arbitrajes (semifinal y final).\nNo incluye bolas.\n\n🚨 Los PRIMEROS 4 EQUIPOS que confirmen\nquedarán oficialmente inscritos.\n\n🌧️ Fechas y horarios sujetos a ajustes por clima o disponibilidad del escenario.`;
  };

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(buildMensaje());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { alert('No se pudo copiar.'); }
  };

  const handleDescargarPNG = async () => {
    setGeneratingPNG(true);

    const lineaHTML = (label: string, juego: JuegoProgramado, color: string) => {
      if (!juego.fecha) return `
        <div style="margin:14px 0;padding:16px 20px;background:rgba(0,0,0,0.3);border-radius:12px;border-left:4px solid ${color};">
          <div style="font-size:20px;font-weight:900;color:${color};letter-spacing:1px;">${label}</div>
          <div style="font-size:17px;color:#94a3b8;margin-top:4px;">📅 Por definir &nbsp;·&nbsp; 🕒 Por definir</div>
        </div>`;
      return `
        <div style="margin:14px 0;padding:16px 20px;background:rgba(0,0,0,0.3);border-radius:12px;border-left:4px solid ${color};">
          <div style="font-size:20px;font-weight:900;color:${color};letter-spacing:1px;">${label}</div>
          <div style="font-size:19px;color:#ffffff;margin-top:6px;font-weight:700;">📅 ${formatFechaCorta(juego.fecha)}</div>
          <div style="font-size:24px;color:#ffffff;font-weight:900;margin-top:2px;">🕒 ${format12h(getHoraEfectiva(juego))}</div>
        </div>`;
    };

    // SVG fondo con pelota softball y diamante
    const svgBg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
        <defs>
          <radialGradient id="bg" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stop-color="#0d1f3c"/>
            <stop offset="100%" stop-color="#050508"/>
          </radialGradient>
        </defs>
        <rect width="1080" height="1350" fill="url(#bg)"/>
        <!-- Diamante fondo -->
        <g opacity="0.05" transform="translate(540,750)">
          <polygon points="0,-300 300,0 0,300 -300,0" fill="none" stroke="#fbbf24" stroke-width="3"/>
          <line x1="0" y1="-300" x2="0" y2="300" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="8 6"/>
          <line x1="-300" y1="0" x2="300" y2="0" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="8 6"/>
        </g>
        <!-- Pelota decorativa -->
        <g opacity="0.06" transform="translate(950,200)">
          <circle cx="0" cy="0" r="140" fill="#f5f0cc"/>
          <path d="M-60,-100 C-45,-75,-45,-50,-60,-25 C-75,0,-75,25,-60,50 C-45,75,-45,100,-60,125" stroke="#dc2626" stroke-width="6" stroke-linecap="round" fill="none"/>
          <path d="M60,-100 C45,-75,45,-50,60,-25 C75,0,75,25,60,50 C45,75,45,100,60,125" stroke="#dc2626" stroke-width="6" stroke-linecap="round" fill="none"/>
        </g>
        <!-- Borde dorado -->
        <rect x="20" y="20" width="1040" height="1310" rx="28" fill="none" stroke="#fbbf24" stroke-width="4" opacity="0.65"/>
        <rect x="30" y="30" width="1020" height="1290" rx="22" fill="none" stroke="#fbbf24" stroke-width="1" opacity="0.25"/>
      </svg>
    `)}`;

    const div = document.createElement('div');
    div.style.cssText = `
      width:1080px; height:1350px;
      position:absolute; left:-9999px; top:0;
      font-family:Arial,sans-serif;
      color:#ffffff;
      box-sizing:border-box;
      display:flex; flex-direction:column;
      align-items:center; justify-content:space-between;
      padding:60px 70px;
      background-image:url('${svgBg}');
      background-size:cover;
    `;

    div.innerHTML = `
      <!-- TOP -->
      <div style="text-align:center;width:100%;">
        <div style="font-size:60px;margin-bottom:8px;">🥎</div>
        <div style="font-size:48px;font-weight:900;letter-spacing:3px;color:#ffffff;">TORNEOS RELÁMPAGO</div>
        <div style="font-size:56px;font-weight:900;color:#fbbf24;letter-spacing:5px;">ENVIGADO</div>
        <div style="margin-top:10px;font-size:20px;color:rgba(255,255,255,0.5);letter-spacing:8px;">S O F T B A L L</div>
        <div style="margin-top:16px;display:inline-block;padding:8px 28px;border:2px solid #fbbf24;border-radius:999px;font-size:18px;font-weight:900;color:#fbbf24;letter-spacing:2px;">
          🔥 INVITACIÓN OFICIAL
        </div>
      </div>

      <!-- CRONOGRAMA -->
      <div style="width:100%;background:rgba(0,0,0,0.35);border-radius:20px;padding:30px 36px;border:1px solid rgba(251,191,36,0.25);">
        <div style="font-size:24px;font-weight:900;color:#fbbf24;text-align:center;margin-bottom:6px;letter-spacing:2px;">
          📅 PROGRAMACIÓN DEL TORNEO
        </div>
        ${lineaHTML('🔥 SEMIFINAL 1', semi1, '#60a5fa')}
        ${lineaHTML('🔥 SEMIFINAL 2', semi2, '#a78bfa')}
        ${lineaHTML('🏆 GRAN FINAL', finalJ, '#fbbf24')}
        <div style="margin-top:16px;text-align:center;font-size:15px;color:#ef4444;font-weight:700;">
          🌧️ Cronograma sujeto a cambios por clima o disponibilidad del escenario
        </div>
      </div>

      <!-- PREMIO E INSCRIPCIÓN -->
      <div style="width:100%;display:flex;gap:16px;">
        <div style="flex:1;background:rgba(0,0,0,0.4);border-radius:16px;padding:20px;text-align:center;border:1px solid rgba(251,191,36,0.2);">
          <div style="font-size:32px;margin-bottom:6px;">💰</div>
          <div style="font-size:14px;color:#94a3b8;font-weight:700;letter-spacing:1px;">INSCRIPCIÓN</div>
          <div style="font-size:28px;font-weight:900;color:#ffffff;">$500.000</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">Incluye 2 arbitrajes</div>
        </div>
        <div style="flex:1;background:rgba(0,0,0,0.4);border-radius:16px;padding:20px;text-align:center;border:1px solid rgba(251,191,36,0.3);">
          <div style="font-size:32px;margin-bottom:6px;">🏆</div>
          <div style="font-size:14px;color:#94a3b8;font-weight:700;letter-spacing:1px;">PREMIO CAMPEÓN</div>
          <div style="font-size:28px;font-weight:900;color:#fbbf24;">$1.000.000</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">No incluye bolas</div>
        </div>
      </div>

      <!-- BOTTOM -->
      <div style="text-align:center;width:100%;">
        <div style="font-size:28px;font-weight:900;color:#ffffff;margin-bottom:8px;">
          📍 POLIDEPORTIVO SUR ENVIGADO
        </div>
        <div style="font-size:20px;color:#fbbf24;font-weight:700;margin-bottom:10px;">
          🚨 Los primeros 4 equipos que confirmen quedan inscritos
        </div>
        <div style="font-size:16px;color:rgba(255,255,255,0.35);">
          🥎 #TorneosRelámpago #Softball #Envigado
        </div>
      </div>
    `;

    document.body.appendChild(div);

    // Usar SVG → canvas para evitar problemas oklch
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
        <defs>
          <radialGradient id="bg2" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stop-color="#0d1f3c"/>
            <stop offset="100%" stop-color="#050508"/>
          </radialGradient>
        </defs>
        <rect width="1080" height="1350" fill="url(#bg2)"/>
        <g opacity="0.05" transform="translate(540,750)">
          <polygon points="0,-300 300,0 0,300 -300,0" fill="none" stroke="#fbbf24" stroke-width="3"/>
          <line x1="0" y1="-300" x2="0" y2="300" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="8 6"/>
          <line x1="-300" y1="0" x2="300" y2="0" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="8 6"/>
        </g>
        <g opacity="0.06" transform="translate(950,200)">
          <circle cx="0" cy="0" r="140" fill="#f5f0cc"/>
          <path d="M-60,-100 C-45,-75,-45,-50,-60,-25 C-75,0,-75,25,-60,50 C-45,75,-45,100,-60,125" stroke="#dc2626" stroke-width="6" stroke-linecap="round" fill="none"/>
          <path d="M60,-100 C45,-75,45,-50,60,-25 C75,0,75,25,60,50 C45,75,45,100,60,125" stroke="#dc2626" stroke-width="6" stroke-linecap="round" fill="none"/>
        </g>
        <rect x="20" y="20" width="1040" height="1310" rx="28" fill="none" stroke="#fbbf24" stroke-width="4" opacity="0.65"/>
        <rect x="30" y="30" width="1020" height="1290" rx="22" fill="none" stroke="#fbbf24" stroke-width="1" opacity="0.25"/>

        <!-- TOP TEXT -->
        <text x="540" y="115" text-anchor="middle" font-size="64" font-family="Arial">🥎</text>
        <text x="540" y="182" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="50" fill="#ffffff" letter-spacing="3">TORNEOS RELÁMPAGO</text>
        <text x="540" y="250" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="58" fill="#fbbf24" letter-spacing="6">ENVIGADO</text>
        <text x="540" y="292" text-anchor="middle" font-family="Arial" font-weight="700" font-size="20" fill="rgba(255,255,255,0.4)" letter-spacing="8">S O F T B A L L</text>
        <rect x="340" y="308" width="400" height="46" rx="23" fill="none" stroke="#fbbf24" stroke-width="2"/>
        <text x="540" y="338" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="18" fill="#fbbf24" letter-spacing="2">🔥 INVITACIÓN OFICIAL</text>

        <!-- SEPARADOR -->
        <line x1="80" y1="378" x2="1000" y2="378" stroke="#fbbf24" stroke-width="1.5" opacity="0.3"/>

        <!-- CRONOGRAMA TÍTULO -->
        <text x="540" y="430" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="26" fill="#fbbf24" letter-spacing="2">📅 PROGRAMACIÓN DEL TORNEO</text>

        <!-- SEMI 1 -->
        <rect x="60" y="448" width="960" height="${semi1.fecha ? '110' : '80'}" rx="12" fill="rgba(0,0,0,0.4)"/>
        <rect x="60" y="448" width="6" height="${semi1.fecha ? '110' : '80'}" rx="3" fill="#60a5fa"/>
        <text x="88" y="482" font-family="Arial Black,Arial" font-weight="900" font-size="20" fill="#60a5fa">🔥 SEMIFINAL 1</text>
        ${semi1.fecha
          ? `<text x="88" y="514" font-family="Arial" font-weight="700" font-size="18" fill="#ffffff">📅 ${formatFechaCorta(semi1.fecha)}</text>
             <text x="88" y="544" font-family="Arial Black,Arial" font-weight="900" font-size="22" fill="#ffffff">🕒 ${format12h(getHoraEfectiva(semi1))}</text>`
          : `<text x="88" y="512" font-family="Arial" font-size="17" fill="#94a3b8">📅 Por definir &nbsp;·&nbsp; 🕒 Por definir</text>`}

        <!-- SEMI 2 -->
        <rect x="60" y="${semi1.fecha ? '572' : '542'}" width="960" height="${semi2.fecha ? '110' : '80'}" rx="12" fill="rgba(0,0,0,0.4)"/>
        <rect x="60" y="${semi1.fecha ? '572' : '542'}" width="6" height="${semi2.fecha ? '110' : '80'}" rx="3" fill="#a78bfa"/>
        <text x="88" y="${semi1.fecha ? '606' : '576'}" font-family="Arial Black,Arial" font-weight="900" font-size="20" fill="#a78bfa">🔥 SEMIFINAL 2</text>
        ${semi2.fecha
          ? `<text x="88" y="${semi1.fecha ? '638' : '608'}" font-family="Arial" font-weight="700" font-size="18" fill="#ffffff">📅 ${formatFechaCorta(semi2.fecha)}</text>
             <text x="88" y="${semi1.fecha ? '668' : '638'}" font-family="Arial Black,Arial" font-weight="900" font-size="22" fill="#ffffff">🕒 ${format12h(getHoraEfectiva(semi2))}</text>`
          : `<text x="88" y="${semi1.fecha ? '610' : '580'}" font-family="Arial" font-size="17" fill="#94a3b8">📅 Por definir &nbsp;·&nbsp; 🕒 Por definir</text>`}

        <!-- FINAL -->
        <rect x="60" y="${semi1.fecha && semi2.fecha ? '696' : '636'}" width="960" height="${finalJ.fecha ? '110' : '80'}" rx="12" fill="rgba(0,0,0,0.4)"/>
        <rect x="60" y="${semi1.fecha && semi2.fecha ? '696' : '636'}" width="6" height="${finalJ.fecha ? '110' : '80'}" rx="3" fill="#fbbf24"/>
        <text x="88" y="${semi1.fecha && semi2.fecha ? '730' : '670'}" font-family="Arial Black,Arial" font-weight="900" font-size="20" fill="#fbbf24">🏆 GRAN FINAL</text>
        ${finalJ.fecha
          ? `<text x="88" y="${semi1.fecha && semi2.fecha ? '762' : '702'}" font-family="Arial" font-weight="700" font-size="18" fill="#ffffff">📅 ${formatFechaCorta(finalJ.fecha)}</text>
             <text x="88" y="${semi1.fecha && semi2.fecha ? '792' : '732'}" font-family="Arial Black,Arial" font-weight="900" font-size="22" fill="#ffffff">🕒 ${format12h(getHoraEfectiva(finalJ))}</text>`
          : `<text x="88" y="${semi1.fecha && semi2.fecha ? '734' : '674'}" font-family="Arial" font-size="17" fill="#94a3b8">📅 Por definir &nbsp;·&nbsp; 🕒 Por definir</text>`}

        <!-- SEPARADOR -->
        <line x1="80" y1="830" x2="1000" y2="830" stroke="#fbbf24" stroke-width="1.5" opacity="0.25"/>

        <!-- PREMIO -->
        <rect x="60" y="848" width="470" height="130" rx="16" fill="rgba(0,0,0,0.4)"/>
        <text x="295" y="896" text-anchor="middle" font-size="34" font-family="Arial">💰</text>
        <text x="295" y="928" text-anchor="middle" font-family="Arial" font-weight="700" font-size="14" fill="#94a3b8" letter-spacing="1">INSCRIPCIÓN</text>
        <text x="295" y="960" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="30" fill="#ffffff">$500.000</text>

        <rect x="550" y="848" width="470" height="130" rx="16" fill="rgba(0,0,0,0.4)"/>
        <text x="785" y="896" text-anchor="middle" font-size="34" font-family="Arial">🏆</text>
        <text x="785" y="928" text-anchor="middle" font-family="Arial" font-weight="700" font-size="14" fill="#94a3b8" letter-spacing="1">PREMIO CAMPEÓN</text>
        <text x="785" y="960" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="30" fill="#fbbf24">$1.000.000</text>

        <!-- SEPARADOR -->
        <line x1="80" y1="1000" x2="1000" y2="1000" stroke="#fbbf24" stroke-width="1.5" opacity="0.25"/>

        <!-- BOTTOM -->
        <text x="540" y="1068" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="30" fill="#ffffff">📍 POLIDEPORTIVO SUR ENVIGADO</text>
        <text x="540" y="1130" text-anchor="middle" font-family="Arial" font-weight="700" font-size="22" fill="#fbbf24">🚨 Primeros 4 equipos que confirmen quedan inscritos</text>
        <text x="540" y="1185" text-anchor="middle" font-family="Arial" font-size="17" fill="rgba(239,68,68,0.8)" font-weight="700">🌧️ Cronograma sujeto a cambios</text>
        <text x="540" y="1240" text-anchor="middle" font-family="Arial" font-size="17" fill="rgba(255,255,255,0.3)">#TorneosRelámpago #Softball #Envigado</text>
        <text x="540" y="1296" text-anchor="middle" font-family="Arial" font-size="15" fill="rgba(251,191,36,0.3)">torneosrelampagoenvigado.com</text>
      </svg>
    `;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080 * 2;
      canvas.height = 1350 * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, 1080, 1350);
      URL.revokeObjectURL(url);
      document.body.removeChild(div);
      const link = document.createElement('a');
      link.download = `Invitacion_Torneo_${torneoNumero}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setGeneratingPNG(false);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      document.body.removeChild(div);
      alert('Error al generar imagen.');
      setGeneratingPNG(false);
    };
    img.src = url;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const allDatesSet = semi1.fecha && semi2.fecha && finalJ.fecha;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={handleBackdropClick}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative z-10 bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800 shrink-0">
          <div>
            <h2 className="text-white font-black text-lg">📧 INVITAR A EQUIPOS</h2>
            <p className="text-neutral-500 text-xs mt-0.5">Cronograma propuesto para el próximo torneo</p>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SEMI 1 */}
          <div className="bg-neutral-800/50 rounded-2xl p-4 space-y-3 border border-neutral-700/50">
            <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest">🔹 Semifinal 1</p>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-neutral-500 shrink-0" />
              <input type="date" value={semi1.fecha} onChange={e => setSemi1(p => ({ ...p, fecha: e.target.value }))}
                className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <HoraPicker fecha={semi1.fecha} hora={semi1.hora} onChange={h => setSemi1(p => ({ ...p, hora: h }))} label="Hora" />
          </div>

          {/* SEMI 2 */}
          <div className="bg-neutral-800/50 rounded-2xl p-4 space-y-3 border border-neutral-700/50">
            <p className="text-[11px] font-black text-yellow-400 uppercase tracking-widest">🔹 Semifinal 2</p>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-neutral-500 shrink-0" />
              <input type="date" value={semi2.fecha} onChange={e => setSemi2(p => ({ ...p, fecha: e.target.value }))}
                className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <HoraPicker fecha={semi2.fecha} hora={semi2.hora} onChange={h => setSemi2(p => ({ ...p, hora: h }))} label="Hora" />
          </div>

          {/* FINAL */}
          <div className="bg-neutral-800/50 rounded-2xl p-4 space-y-3 border border-amber-500/20">
            <p className="text-[11px] font-black text-amber-400 uppercase tracking-widest">🏆 Gran Final</p>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-neutral-500 shrink-0" />
              <input type="date" value={finalJ.fecha} onChange={e => setFinalJ(p => ({ ...p, fecha: e.target.value }))}
                className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <HoraPicker fecha={finalJ.fecha} hora={finalJ.hora} onChange={h => setFinalJ(p => ({ ...p, hora: h }))} label="Hora" />
          </div>

          {/* Preview mensaje */}
          <div>
            <p className="text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-2">Vista previa del mensaje</p>
            <div className="bg-neutral-800 rounded-2xl p-4 border border-neutral-700">
              <pre className="text-xs text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed">{buildMensaje()}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-800 shrink-0 space-y-3">
          <button onClick={handleCopiar}
            className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl font-black text-sm transition-all border border-neutral-700">
            {copied ? (<><CheckCircle className="w-4 h-4 text-green-400" /><span className="text-green-400">¡COPIADO!</span></>) : (<><Copy className="w-4 h-4" />COPIAR MENSAJE WHATSAPP</>)}
          </button>
          <button onClick={handleDescargarPNG} disabled={!allDatesSet || generatingPNG}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white py-3 rounded-xl font-black text-sm shadow-lg transition-all">
            {generatingPNG
              ? <span className="animate-pulse">Generando PNG...</span>
              : (<><Download className="w-4 h-4" />DESCARGAR FLAYER PNG{!allDatesSet && <span className="text-[10px] opacity-60 ml-1">(requiere 3 fechas)</span>}</>)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvitarModal;

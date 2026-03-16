import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Torneo, Equipo, Juego } from '../types';
import { Trophy, Download, Share2, ChevronLeft, Edit2, FileText, Send, Users, Settings, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import EditTeamModal from '../components/EditTeamModal';
import EditFinalModal from '../components/EditFinalModal';
import RescheduleModal from '../components/RescheduleModal';

const format12h = (hora24: string): string => {
  if (!hora24 || !hora24.includes(':')) return hora24;
  const [h, m] = hora24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

// ── FLAYER MLB-style — render HTML → canvas ───────────────────────────────────


const TournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [torneo, setTorneo] = useState<Torneo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTeam, setEditingTeam] = useState<Equipo | null>(null);
  const [isFinalModalOpen, setIsFinalModalOpen] = useState(false);
  const [promoTab, setPromoTab] = useState<{ juego: Juego } | null>(null);
  const [reschedulingJuego, setReschedulingJuego] = useState<Juego | null>(null);

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

    const filas = (roster: ReturnType<typeof getTeamRoster>) => {
      // Generar filas enumeradas (1, 2, 3, 4...)
      const filasEnumeradas = Array.from({ length: 25 }).map((_, i) => {
        const p = roster[i];
        const bg = i % 2 === 0 ? '#ffffff' : '#f5f5f5';
        const numeroEnumerado = i + 1; // Enumera 1, 2, 3, etc
        return `<tr style="background:${bg};">
          <td style="padding:1.2mm 2mm;text-align:center;font-size:9px;font-weight:700;border-bottom:1px solid #e5e5e5;">${numeroEnumerado}</td>
          <td style="padding:1.2mm 2mm;text-align:left;font-size:9px;border-bottom:1px solid #e5e5e5;">${p?.nombre?.toUpperCase() || ''}</td>
        </tr>`;
      }).join('');
      
      // Contar jugadores reales (no filas vacías)
      const totalJugadores = roster.length;
      
      // Agregar fila de TOTAL al final
      const filaTotal = `<tr style="background:#e8e8e8;font-weight:bold;">
        <td style="padding:1.5mm 2mm;text-align:center;font-size:9px;font-weight:700;border-top:2px solid #000;border-bottom:1px solid #999;">TOTAL</td>
        <td style="padding:1.5mm 2mm;text-align:left;font-size:9px;border-top:2px solid #000;border-bottom:1px solid #999;">${totalJugadores} Jugadores</td>
      </tr>`;
      
      return filasEnumeradas + filaTotal;
    };

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
            ${format(new Date(juego.fecha), 'eeee dd MMMM yyyy', { locale: es }).toUpperCase()} · ${format12h(juego.hora)}
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
                  <th style="width:12mm;padding:1.5mm;font-size:8px;text-align:center;">NO.</th>
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
                  <th style="width:12mm;padding:1.5mm;font-size:8px;text-align:center;">NO.</th>
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
      alert('PDF generado correctamente con enumeración y totales.');
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

  // ─── DESCARGAR FLAYER PNG — Canvas API + fondos reales ──────────────────────
  const downloadFlayerImage = async (juego: Juego) => {
    if (juego.equipo_local_id === 'TBD' || juego.equipo_visitante_id === 'TBD') return;

    const local     = getTeamName(juego.equipo_local_id);
    const visitante = getTeamName(juego.equipo_visitante_id);
    const fechaStr  = format(new Date(juego.fecha), 'eeee dd MMMM', { locale: es }).toUpperCase();
    const horaFmt   = format12h(juego.hora);
    const isFinal   = juego.ronda === 'final';

    const rondaLabel = juego.ronda === 'semifinal_1' ? 'SEMIFINAL 1'
                     : juego.ronda === 'semifinal_2' ? 'SEMIFINAL 2'
                     : 'GRAN FINAL';

    // ── Cargar fondo ────────────────────────────────────────────────
    // Final: siempre home plate. Semifinales: aleatorio entre 4 fondos
    const SEMI_FONDOS = [
      new URL('../assets/fondos/semi_1.png', import.meta.url).href,
      new URL('../assets/fondos/semi_2.png', import.meta.url).href,
      new URL('../assets/fondos/semi_3.png', import.meta.url).href,
      new URL('../assets/fondos/semi_4.png', import.meta.url).href,
    ];
    const FINAL_FONDO = new URL('../assets/fondos/final.png', import.meta.url).href;
    const bgUrl = isFinal
      ? FINAL_FONDO
      : SEMI_FONDOS[Math.floor(Math.random() * SEMI_FONDOS.length)];

    const bgImg = await new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = bgUrl;
    });

    const W = 1080, H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // ── Dibujar fondo recortado centrado ────────────────────────────
    const scale  = Math.max(W / bgImg.width, H / bgImg.height);
    const scaledW = bgImg.width  * scale;
    const scaledH = bgImg.height * scale;
    const offX   = (W - scaledW) / 2;
    const offY   = (H - scaledH) / 2;
    ctx.drawImage(bgImg, offX, offY, scaledW, scaledH);

    // ── Overlay quirúrgico adaptado a cada tipo de fondo ───────────
    // Header (cielo oscuro — overlay mínimo)
    const gradTop = ctx.createLinearGradient(0, 0, 0, 340);
    gradTop.addColorStop(0,   'rgba(0,0,0,0.55)');
    gradTop.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = gradTop; ctx.fillRect(0, 0, W, 340);

    // Centro — velo muy suave para legibilidad nombres
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, 340, W, 440);

    // Zona hora/fecha — oscurecer el campo para texto blanco
    const gradMid = ctx.createLinearGradient(0, 780, 0, 1090);
    gradMid.addColorStop(0,   'rgba(0,0,0,0)');
    gradMid.addColorStop(0.4, 'rgba(0,0,0,0.52)');
    gradMid.addColorStop(1,   'rgba(0,0,0,0.65)');
    ctx.fillStyle = gradMid; ctx.fillRect(0, 780, W, 310);

    // Franja inferior
    const gradBot = ctx.createLinearGradient(0, 1090, 0, H);
    gradBot.addColorStop(0,   'rgba(0,0,0,0.65)');
    gradBot.addColorStop(1,   'rgba(0,0,0,0.85)');
    ctx.fillStyle = gradBot; ctx.fillRect(0, 1090, W, H - 1090);

    const GOLD  = '#F5C518';
    const WHITE = '#FFFFFF';

    // ── Helpers ────────────────────────────────────────────────────
    const fitFont = (text: string, maxW: number, maxSz: number, minSz: number) => {
      let sz = maxSz;
      while (sz > minSz) {
        ctx.font = `900 ${sz}px "Poppins", "Arial Black", Arial`;
        if (ctx.measureText(text).width <= maxW) break;
        sz -= 2;
      }
      return sz;
    };

    const drawText = (text: string, x: number, y: number, color: string, sw = 3) => {
      ctx.fillStyle   = color;
      ctx.strokeStyle = `rgba(0,0,0,0.85)`;
      ctx.lineWidth   = sw * 2;
      ctx.lineJoin    = 'round';
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    };

    const centerText = (text: string, y: number, color: string, sw = 3) => {
      const tw = ctx.measureText(text).width;
      drawText(text, (W - tw) / 2, y, color, sw);
    };

    const fitCenter = (text: string, y: number, maxSz: number, minSz: number, color: string, sw = 5) => {
      const sz = fitFont(text, W - 80, maxSz, minSz);
      ctx.font = `900 ${sz}px "Poppins", "Arial Black", Arial`;
      centerText(text, y, color, sw);
    };

    const hline = (y: number, alpha = 0.55, margin = 60) => {
      const g = ctx.createLinearGradient(margin, y, W - margin, y);
      g.addColorStop(0,   'transparent');
      g.addColorStop(0.5, `rgba(245,197,24,${alpha})`);
      g.addColorStop(1,   'transparent');
      ctx.strokeStyle = g;
      ctx.lineWidth   = 1.5;
      ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(W - margin, y); ctx.stroke();
    };

    // ── Bordes dorados ─────────────────────────────────────────────
    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
      ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
      ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
      ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
      ctx.closePath();
    };
    ctx.strokeStyle = 'rgba(245,197,24,0.85)'; ctx.lineWidth = 3;
    rr(14,14,W-28,H-28,20); ctx.stroke();
    ctx.strokeStyle = 'rgba(245,197,24,0.22)'; ctx.lineWidth = 1;
    rr(22,22,W-44,H-44,14); ctx.stroke();

    // ── Pelota softball dibujada ───────────────────────────────────
    const bcx = W/2, bcy = 72, br = 38;
    ctx.beginPath(); ctx.arc(bcx,bcy,br,0,Math.PI*2);
    ctx.fillStyle = 'rgba(228,215,120,0.92)'; ctx.fill();
    ctx.strokeStyle='rgba(160,138,50,0.8)'; ctx.lineWidth=2; ctx.stroke();
    const seams: number[][][] = [
      [[bcx-14,bcy-30],[bcx-18,bcy-18],[bcx-14,bcy-6],[bcx-18,bcy+6],[bcx-14,bcy+18],[bcx-18,bcy+28]],
      [[bcx+14,bcy-30],[bcx+18,bcy-18],[bcx+14,bcy-6],[bcx+18,bcy+6],[bcx+14,bcy+18],[bcx+18,bcy+28]],
    ];
    ctx.strokeStyle='rgba(190,30,30,0.85)'; ctx.lineWidth=2.2; ctx.lineJoin='round';
    seams.forEach(pts => {
      ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
      pts.slice(1).forEach(p => ctx.lineTo(p[0],p[1]));
      ctx.stroke();
    });

    // ══ LAYOUT ═══════════════════════════════════════════════════
    ctx.textBaseline = 'top';

    // TORNEOS RELÁMPAGO
    ctx.font = '900 52px "Poppins","Arial Black",Arial';
    centerText('TORNEOS RELÁMPAGO', 122, WHITE, 3);

    // ENVIGADO
    ctx.font = '900 90px "Poppins","Arial Black",Arial';
    centerText('ENVIGADO', 182, GOLD, 5);

    // SOFTBALL
    ctx.font = '400 15px "Poppins",Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    const sw_txt = ctx.measureText('S  O  F  T  B  A  L  L').width;
    ctx.fillText('S  O  F  T  B  A  L  L', (W-sw_txt)/2, 282);

    hline(308, 0.65);

    // ── BADGE RONDA ───────────────────────────────────────────────
    ctx.font = '900 36px "Poppins","Arial Black",Arial';
    const btw = ctx.measureText(rondaLabel).width;
    const padX = 60, padY = 16;
    const bw = btw + padX*2, bh = 36+padY*2;
    const bx = (W-bw)/2, by = 322;
    // Fondo badge
    rr(bx,by,bw,bh,bh/2);
    ctx.fillStyle = 'rgba(0,0,0,0.82)'; ctx.fill();
    ctx.strokeStyle='rgba(245,197,24,0.95)'; ctx.lineWidth=2; ctx.stroke();
    // Texto badge — centrado exacto dentro del rect
    ctx.fillStyle = GOLD;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 2;
    ctx.strokeText(rondaLabel, bx+padX, by+padY);
    ctx.fillText(rondaLabel,   bx+padX, by+padY);

    const badgeBottom = by + bh + 14;
    hline(badgeBottom, 0.2);

    // NOMBRE LOCAL
    fitCenter(local.toUpperCase(), badgeBottom + 28, 108, 48, WHITE, 5);

    // VS
    ctx.font = '900 96px "Poppins","Arial Black",Arial';
    centerText('VS', badgeBottom + 168, GOLD, 5);

    // NOMBRE VISITANTE
    fitCenter(visitante.toUpperCase(), badgeBottom + 288, 108, 48, WHITE, 5);

    const sepY = badgeBottom + 420;
    hline(sepY, 0.4);

    // HORA — grande protagonista
    ctx.font = '900 118px "Poppins","Arial Black",Arial';
    centerText(horaFmt, sepY + 20, WHITE, 5);

    // FECHA — debajo hora en dorado
    ctx.font = '900 34px "Poppins","Arial Black",Arial';
    centerText(fechaStr, sepY + 158, GOLD, 3);

    hline(sepY + 210, 0.4);

    // ── FRANJA INFERIOR ───────────────────────────────────────────
    const footY = sepY + 220;
    ctx.font = '700 27px "Poppins","Arial Black",Arial';
    centerText('POLIDEPORTIVO SUR ENVIGADO', footY + 18, WHITE, 2);

    hline(footY + 60, 0.25, 130);

    ctx.font = '700 26px "Poppins","Arial Black",Arial';
    const tagline = isFinal ? '¡LA HORA DE LA GLORIA!' : '¡QUE COMIENCE LA ACCION!';
    centerText(tagline, footY + 70, GOLD, 2);

    ctx.font = '400 17px "Poppins",Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    const ht = '#TorneosRelampago   #Softball   #Envigado';
    ctx.fillText(ht, (W - ctx.measureText(ht).width)/2, footY + 112);

    ctx.font = '400 14px "Poppins",Arial';
    ctx.fillStyle = 'rgba(245,197,24,0.55)';
    const web = 'torneosrelampagoenvigado.com';
    ctx.fillText(web, (W - ctx.measureText(web).width)/2, footY + 144);

    // ── Descargar ─────────────────────────────────────────────────
    const link = document.createElement('a');
    link.download = `Flayer_${juego.ronda}_${local}_vs_${visitante}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
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
                  {isDefined && `${format(new Date(juego.fecha), 'dd MMM', { locale: es }).toUpperCase()} · ${format12h(juego.hora)}`}
                </div>
                <div className="pt-2 space-y-2">
                  <button onClick={() => setReschedulingJuego(juego)}
                    className="w-full flex items-center justify-center gap-2 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 text-white py-2 rounded-xl text-xs font-bold transition-all">
                    <CalendarClock className="w-3 h-3" /> REPROGRAMAR PARTIDO
                  </button>
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
                {format(new Date(promoTab.juego.fecha), 'eeee dd MMMM', { locale: es })}
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
      <RescheduleModal
        isOpen={!!reschedulingJuego}
        onClose={() => setReschedulingJuego(null)}
        juego={reschedulingJuego}
        torneo={torneo}
        onUpdate={fetchTorneo}
      />
    </div>
  );
};

export default TournamentDetail;

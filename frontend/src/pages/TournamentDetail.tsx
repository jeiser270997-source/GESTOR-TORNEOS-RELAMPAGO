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
import html2canvas from 'html2canvas';

// ✅ Convierte "19:30" → "7:30 PM"
const format12h = (hora24: string): string => {
  if (!hora24 || !hora24.includes(':')) return hora24;
  const [h, m] = hora24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
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

  useEffect(() => {
    fetchTorneo();
  }, [id]);

  const getTeamName = (teamId: string) => {
    if (teamId === 'TBD') return 'POR DEFINIR';
    return torneo?.equipos.find(e => e.id === teamId)?.nombre || 'DESCONOCIDO';
  };

  const getTeamRoster = (teamId: string) => {
    return torneo?.equipos.find(e => e.id === teamId)?.roster || [];
  };

  // ─── PDF ROSTER ───────────────────────────────────────────────────────────────
  const generateRosterPDF = async (juego: Juego) => {
    const local = getTeamName(juego.equipo_local_id);
    const visitante = getTeamName(juego.equipo_visitante_id);
    const localRoster = getTeamRoster(juego.equipo_local_id);
    const visitanteRoster = getTeamRoster(juego.equipo_visitante_id);

    if (juego.equipo_local_id === 'TBD' || juego.equipo_visitante_id === 'TBD') {
      alert('Debes definir los equipos antes de generar el PDF.');
      return;
    }

    const printDiv = document.createElement('div');
    printDiv.innerHTML = `
      <div style="width:215.9mm;height:279.4mm;padding:8mm;background:white;color:black;font-family:Arial,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;">
        <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:6mm;margin-bottom:8mm;">
          <h1 style="font-size:14px;font-weight:900;margin:0;letter-spacing:1px;">TORNEOS RELÁMPAGO ENVIGADO</h1>
          <h2 style="font-size:11px;margin:2px 0;font-weight:700;">${juego.ronda.replace('_', ' ').toUpperCase()}</h2>
          <div style="font-size:10px;font-weight:bold;margin:2px 0;">${local} vs ${visitante}</div>
          <div style="font-size:9px;margin-top:2px;color:#333;">
            ${format(new Date(juego.fecha), 'eeee dd MMMM', { locale: es }).toUpperCase()} - ${format12h(juego.hora)}
          </div>
        </div>
        <div style="display:flex;gap:10mm;justify-content:center;flex:1;">
          <div style="flex:0 1 90mm;">
            <div style="background:#000;color:#fff;padding:2mm 4mm;font-size:9px;font-weight:900;margin-bottom:3mm;text-align:center;">${local.toUpperCase()}</div>
            <table style="width:100%;border-collapse:collapse;font-size:7.5px;">
              <thead><tr style="border-bottom:1px solid #000;"><th style="width:18mm;padding:1mm;font-weight:700;text-align:center;">#</th><th style="padding:1mm;font-weight:700;text-align:left;">NOMBRE</th></tr></thead>
              <tbody>${Array.from({ length: 15 }).map((_, i) => { const p = localRoster[i]; return `<tr style="border-bottom:1px solid #eee;"><td style="padding:1mm;text-align:center;">${p?.numero_camiseta || ''}</td><td style="padding:1mm;text-align:left;">${p?.nombre?.toUpperCase() || ''}</td></tr>`; }).join('')}</tbody>
            </table>
          </div>
          <div style="flex:0 1 90mm;">
            <div style="background:#000;color:#fff;padding:2mm 4mm;font-size:9px;font-weight:900;margin-bottom:3mm;text-align:center;">${visitante.toUpperCase()}</div>
            <table style="width:100%;border-collapse:collapse;font-size:7.5px;">
              <thead><tr style="border-bottom:1px solid #000;"><th style="width:18mm;padding:1mm;font-weight:700;text-align:center;">#</th><th style="padding:1mm;font-weight:700;text-align:left;">NOMBRE</th></tr></thead>
              <tbody>${Array.from({ length: 15 }).map((_, i) => { const p = visitanteRoster[i]; return `<tr style="border-bottom:1px solid #eee;"><td style="padding:1mm;text-align:center;">${p?.numero_camiseta || ''}</td><td style="padding:1mm;text-align:left;">${p?.nombre?.toUpperCase() || ''}</td></tr>`; }).join('')}</tbody>
            </table>
          </div>
        </div>
        <div style="text-align:center;font-size:7px;color:#666;padding-top:6mm;border-top:1px solid #000;margin-top:6mm;">www.torneosrelampagoenvigado.com | Documento Oficial de Jornada</div>
      </div>
    `;

    const opt = {
      margin: [8, 8, 8, 8] as [number, number, number, number],
      filename: `Roster_${juego.ronda}_${local}_vs_${visitante}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' as const },
    };

    try {
      await html2pdf().set(opt).from(printDiv.innerHTML).save();
      alert('PDF de Roster generado correctamente.');
    } catch (err) {
      console.error(err);
      alert('Error al generar PDF.');
    }
  };

  // ─── COPIAR MENSAJE ───────────────────────────────────────────────────────────
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

  // ─── DESCARGAR FLAYER PNG ─────────────────────────────────────────────────────
  const downloadFlayerImage = async (juego: Juego) => {
    if (juego.equipo_local_id === 'TBD' || juego.equipo_visitante_id === 'TBD') return;

    const local     = getTeamName(juego.equipo_local_id);
    const visitante = getTeamName(juego.equipo_visitante_id);
    const fecha     = format(new Date(juego.fecha), 'eeee dd MMMM', { locale: es }).toUpperCase();
    const horaFmt   = format12h(juego.hora);
    const isFinal   = juego.ronda === 'final';

    const div = document.createElement('div');
    div.style.cssText = 'width:1080px;height:1350px;display:flex;flex-direction:column;background:linear-gradient(135deg,#1a3a52 0%,#0f0f0f 100%);color:#ffffff;font-family:Arial,sans-serif;padding:60px;box-sizing:border-box;position:absolute;left:-9999px;top:0;';

    div.innerHTML = `
      <div style="border:4px solid #fbbf24;height:100%;display:flex;flex-direction:column;position:relative;">
        <div style="flex:0 0 30%;display:flex;flex-direction:column;align-items:center;justify-content:center;border-bottom:2px solid rgba(251,191,36,0.3);">
          <div style="font-size:50px;margin-bottom:10px;">🎯</div>
          <div style="font-size:48px;font-weight:900;letter-spacing:2px;">TORNEOS RELÁMPAGO</div>
          <div style="font-size:52px;font-weight:900;color:#fbbf24;letter-spacing:4px;">ENVIGADO</div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;">
          <div style="font-size:60px;font-weight:900;color:#fbbf24;margin-bottom:60px;">
            ${isFinal ? '🏆 GRAN FINAL 🏆' : `⚾ ${juego.ronda.replace('_', ' ').toUpperCase()}`}
          </div>
          <div style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:20px;">
            <div style="flex:1;text-align:right;font-size:64px;font-weight:900;color:#fff;line-height:1;">${isFinal ? '🏅' : '🔴'}<br/>${local.toUpperCase()}</div>
            <div style="font-size:50px;font-weight:900;font-style:italic;color:#fbbf24;margin:0 30px;">VS</div>
            <div style="flex:1;text-align:left;font-size:64px;font-weight:900;color:#fff;line-height:1;">${isFinal ? '🏅' : '🔵'}<br/>${visitante.toUpperCase()}</div>
          </div>
          <div style="margin-top:60px;text-align:center;">
            <div style="font-size:32px;font-weight:700;color:#94a3b8;margin-bottom:10px;">📅 ${fecha}</div>
            <div style="font-size:48px;font-weight:900;">🕐 ${horaFmt}</div>
          </div>
        </div>
        <div style="flex:0 0 20%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);">
          <div style="font-size:36px;font-weight:900;color:#fff;">📍 POLIDEPORTIVO SUR ENVIGADO</div>
          <div style="margin-top:20px;font-size:24px;color:#94a3b8;font-style:italic;">
            ${isFinal ? '⚡ ¡LA HORA DE LA GLORIA! ⚡' : '⚡ ¡QUE COMIENCE LA ACCIÓN! ⚡'}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(div);
    try {
      const canvas = await html2canvas(div, { width: 1080, height: 1350, scale: 2, useCORS: true, backgroundColor: '#0f0f0f' });
      const link = document.createElement('a');
      link.download = `Flayer_${juego.ronda}_${local}_vs_${visitante}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      alert('¡Imagen PNG generada correctamente!');
    } catch (err) {
      console.error(err);
      alert('Error al generar la imagen. Intenta de nuevo.');
    } finally {
      document.body.removeChild(div);
    }
  };

  if (loading) return <div className="text-white p-10 animate-pulse">Cargando detalles del torneo...</div>;
  if (!torneo) return <div className="text-white p-10">Torneo no encontrado</div>;

  const semi1 = torneo.juegos.find(j => j.ronda === 'semifinal_1');
  const semi2 = torneo.juegos.find(j => j.ronda === 'semifinal_2');
  const final = torneo.juegos.find(j => j.ronda === 'final');

  return (
    <div className="space-y-10 pb-32">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group mb-4"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Volver al Dashboard
          </button>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            TORNEO #{torneo.numero_interno}
          </h1>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mt-1">Configuración y Documentación</p>
        </div>

        {/* ✅ Botón EDITAR EQUIPOS a la izquierda de EDITAR FINAL */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/torneo/${id}/configuracion`)}
            className="flex items-center gap-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:-translate-y-1 transition-all"
          >
            <Settings className="w-5 h-5" />
            EDITAR EQUIPOS
          </button>
          <button
            onClick={() => setIsFinalModalOpen(true)}
            className="flex items-center gap-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-neutral-950 px-6 py-3 rounded-2xl font-black shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 hover:-translate-y-1 transition-all"
          >
            <Trophy className="w-5 h-5" />
            EDITAR FINAL
          </button>
        </div>
      </div>

      {/* SECCIÓN EQUIPOS Y ROSTERS */}
      <section className="space-y-6">
        <h3 className="text-lg font-black text-white flex items-center gap-3 ml-2">
          <Users className="w-5 h-5 text-blue-500" />
          EQUIPOS Y ROSTERS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {torneo.equipos.map(equipo => (
            <div key={equipo.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 hover:border-neutral-700 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 font-black">
                  {equipo.nombre.charAt(0)}
                </div>
                <button
                  onClick={() => setEditingTeam(equipo)}
                  className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <h4 className="text-white font-black truncate">{equipo.nombre}</h4>
              <p className="text-neutral-500 text-xs mt-1">{equipo.roster?.length || 0} Jugadores</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN FLAYERS PROMOCIONALES */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center justify-between ml-2">
          <h3 className="text-lg font-black text-white flex items-center gap-3">
            <Share2 className="w-5 h-5 text-indigo-500" />
            FLAYERS PROMOCIONALES
          </h3>
          <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">3 Variantes Disponibles</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[semi1, semi2, final].map((juego, idx) => {
            if (!juego) return null;
            const isDefined = juego.equipo_local_id !== 'TBD' && juego.equipo_visitante_id !== 'TBD';
            const title = idx < 2 ? `SEMIFINAL ${idx + 1}` : 'GRAN FINAL';

            return (
              <div key={juego.id} className={`bg-neutral-900 border ${isDefined ? 'border-neutral-800' : 'border-neutral-800/50 opacity-50'} rounded-3xl p-6 flex flex-col space-y-4`}>
                <div className="flex items-center gap-2 mb-2">
                  {idx < 2 ? <Trophy className="w-4 h-4 text-blue-500" /> : <Trophy className="w-4 h-4 text-yellow-500" />}
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
                  <button
                    onClick={() => copyFlyerText(juego)}
                    disabled={!isDefined}
                    className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
                  >
                    <Send className="w-3 h-3" />
                    COPIAR MENSAJE
                  </button>
                  <button
                    onClick={() => setPromoTab({ juego })}
                    disabled={!isDefined}
                    className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
                  >
                    VER PREVISUALIZACIÓN
                  </button>
                  <button
                    onClick={() => downloadFlayerImage(juego)}
                    disabled={!isDefined}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
                  >
                    <Download className="w-3 h-3" />
                    DESCARGAR IMAGEN PNG
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PREVIEW MODAL */}
      {promoTab && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md" onClick={() => setPromoTab(null)} />
          <div className="relative bg-neutral-900 border border-neutral-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl p-8 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-6">
              <h4 className="text-white font-black uppercase tracking-widest text-sm">Vista Previa Flayer</h4>
              <button onClick={() => setPromoTab(null)} className="p-2 text-neutral-500 hover:text-white">✕</button>
            </div>
            <div className="w-full aspect-[1080/1350] bg-gradient-to-br from-[#1a3a52] to-[#0f0f0f] rounded-2xl border-2 border-amber-500/30 flex flex-col items-center justify-center p-6 text-center mb-6">
              <div className="text-[8px] font-black text-amber-500 mb-2">TORNEOS RELÁMPAGO ENVIGADO</div>
              <div className="text-xl font-black text-amber-500 mb-4">{promoTab.juego.ronda.replace('_', ' ').toUpperCase()}</div>
              <div className="text-lg font-black text-white">{getTeamName(promoTab.juego.equipo_local_id)}</div>
              <div className="text-amber-500 font-black italic m-1">VS</div>
              <div className="text-lg font-black text-white">{getTeamName(promoTab.juego.equipo_visitante_id)}</div>
              <div className="mt-4 text-[10px] text-neutral-400 font-bold uppercase">{format(new Date(promoTab.juego.fecha), 'eeee dd MMMM', { locale: es })}</div>
              <div className="text-white font-black">{format12h(promoTab.juego.hora)}</div>
            </div>
            <button
              onClick={() => downloadFlayerImage(promoTab.juego)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all"
            >
              DESCARGAR PNG
            </button>
          </div>
        </div>
      )}

      {/* SECCIÓN JORNADA (PDFs) */}
      <section className="space-y-6 pt-6">
        <h3 className="text-lg font-black text-white flex items-center gap-3 ml-2">
          <FileText className="w-5 h-5 text-emerald-500" />
          DOCUMENTOS JORNADA (PDF)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[semi1, semi2, final].map((juego, idx) => {
            if (!juego) return null;
            const isDefined = juego.equipo_local_id !== 'TBD' && juego.equipo_visitante_id !== 'TBD';
            return (
              <button
                key={juego.id}
                onClick={() => generateRosterPDF(juego)}
                disabled={!isDefined}
                className={`group relative overflow-hidden bg-neutral-900 border ${isDefined ? 'border-emerald-500/30 hover:border-emerald-500/60' : 'border-neutral-800 opacity-30'} p-8 rounded-3xl text-left transition-all hover:-translate-y-1`}
              >
                <div className="relative z-10">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl w-fit mb-4 text-emerald-500 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-white font-black text-xl mb-1">ROSTERS</h4>
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
                    {idx < 2 ? `SEMIFINAL ${idx + 1}` : 'GRAN FINAL'}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-black">
                    <Download className="w-3 h-3" />
                    DESCARGAR PDF
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

      {/* MODALS */}
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

import { useState } from 'react';
import { X, Copy, Download, CheckCircle, Calendar, Clock } from 'lucide-react';
import { format, parseISO, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import html2canvas from 'html2canvas';

interface InvitarModalProps {
  isOpen: boolean;
  onClose: () => void;
  torneoNumero: number;
}

const HORAS_FIN_DE_SEMANA = [
  '10:00', '12:00', '14:00', '16:00', '18:00', '19:00', '19:30', '20:00'
];

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
  try {
    return format(parseISO(fecha), "EEEE dd 'de' MMMM", { locale: es }).toUpperCase();
  } catch {
    return fecha;
  }
};

interface JuegoProgramado {
  fecha: string;
  hora: string;
}

const HoraPicker = ({
  fecha,
  hora,
  onChange,
  label,
}: {
  fecha: string;
  hora: string;
  onChange: (h: string) => void;
  label: string;
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
        <select
          value={hora}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-2 font-bold text-sm focus:outline-none focus:border-blue-500 transition-colors"
        >
          {HORAS_FIN_DE_SEMANA.map(h => (
            <option key={h} value={h}>{format12h(h)}</option>
          ))}
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

    return `🥎 TORNEOS RELÁMPAGO ENVIGADO 🥎
🔥 INVITACIÓN OFICIAL 🔥

📅 PROGRAMACIÓN DEL TORNEO

${linea('🔥', 'SEMIFINAL 1', semi1)}

${linea('🔥', 'SEMIFINAL 2', semi2)}

${linea('🏆', 'GRAN FINAL', finalJ)}

💰 INSCRIPCIÓN: $500.000
🏆 PREMIO CAMPEÓN: $1.000.000
Incluye ambos arbitrajes (semifinal y final).
No incluye bolas.

🚨 Los PRIMEROS 4 EQUIPOS que confirmen
quedarán oficialmente inscritos.

🌧️ Fechas y horarios sujetos a ajustes por clima o disponibilidad del escenario.`;
  };

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(buildMensaje());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('No se pudo copiar. Intenta manualmente.');
    }
  };

  const handleDescargarPNG = async () => {
    setGeneratingPNG(true);

    const linea = (label: string, juego: JuegoProgramado) => {
      if (!juego.fecha) return `<div style="margin: 8px 0;"><span style="color:#fbbf24;font-weight:900;">🔹 ${label}:</span> <span style="color:#cbd5e1;">Por definir</span></div>`;
      return `<div style="margin: 8px 0;"><span style="color:#fbbf24;font-weight:900;">🔹 ${label}:</span> <span style="color:#ffffff;">${formatFechaCorta(juego.fecha)} — ${format12h(getHoraEfectiva(juego))}</span></div>`;
    };

    const div = document.createElement('div');
    div.style.cssText = `
      width: 1080px;
      height: 1350px;
      background: linear-gradient(135deg, #1a3a52 0%, #0f0f0f 100%);
      color: #ffffff;
      font-family: Arial, sans-serif;
      padding: 70px;
      box-sizing: border-box;
      position: absolute;
      left: -9999px;
      top: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
    `;

    div.innerHTML = `
      <!-- BORDE -->
      <div style="
        position: absolute; inset: 20px;
        border: 4px solid #fbbf24;
        border-radius: 30px;
        pointer-events: none;
      "></div>

      <!-- TOP -->
      <div style="text-align: center; padding-top: 20px;">
        <div style="font-size: 52px; margin-bottom: 8px;">🎯</div>
        <div style="font-size: 44px; font-weight: 900; letter-spacing: 3px; color: #ffffff;">TORNEOS RELÁMPAGO</div>
        <div style="font-size: 50px; font-weight: 900; color: #fbbf24; letter-spacing: 5px;">ENVIGADO</div>
        <div style="margin-top: 16px; font-size: 22px; color: #94a3b8; font-style: italic;">¡Te invitamos a participar!</div>
      </div>

      <!-- MIDDLE -->
      <div style="
        width: 100%;
        background: rgba(0,0,0,0.4);
        border-radius: 20px;
        padding: 40px 50px;
        border: 1px solid rgba(251,191,36,0.3);
      ">
        <div style="font-size: 28px; font-weight: 900; color: #fbbf24; text-align: center; margin-bottom: 24px; letter-spacing: 2px;">
          📅 CRONOGRAMA PROPUESTO
        </div>
        <div style="font-size: 22px; line-height: 1.8;">
          ${linea('SEMIFINAL 1', semi1)}
          ${linea('SEMIFINAL 2', semi2)}
          ${linea('FINAL 🏆', finalJ)}
        </div>
        <div style="margin-top: 24px; text-align: center; font-size: 18px; color: #ef4444; font-weight: 700;">
          ⚠️ Cronograma sujeto a cambios
        </div>
      </div>

      <!-- BOTTOM -->
      <div style="text-align: center; padding-bottom: 20px;">
        <div style="font-size: 30px; font-weight: 900; color: #ffffff; margin-bottom: 10px;">
          📍 POLIDEPORTIVO SUR ENVIGADO
        </div>
        <div style="font-size: 20px; color: #fbbf24; font-weight: 700; margin-bottom: 16px;">
          ⚡ Los primeros 4 equipos que confirmen participan
        </div>
        <div style="font-size: 18px; color: #64748b;">
          🥎 #TorneosRelámpago #Softball #Envigado
        </div>
      </div>
    `;

    document.body.appendChild(div);

    try {
      const canvas = await html2canvas(div, {
        width: 1080,
        height: 1350,
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f0f0f',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `Invitacion_Torneo_${torneoNumero}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
      alert('Error al generar imagen. Intenta de nuevo.');
    } finally {
      document.body.removeChild(div);
      setGeneratingPNG(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const allDatesSet = semi1.fecha && semi2.fecha && finalJ.fecha;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative z-10 bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800 shrink-0">
          <div>
            <h2 className="text-white font-black text-lg flex items-center gap-2">
              📧 INVITAR A EQUIPOS
            </h2>
            <p className="text-neutral-500 text-xs mt-0.5">Cronograma propuesto para el próximo torneo</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"
          >
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
              <input
                type="date"
                value={semi1.fecha}
                onChange={e => setSemi1(p => ({ ...p, fecha: e.target.value }))}
                className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <HoraPicker
              fecha={semi1.fecha}
              hora={semi1.hora}
              onChange={h => setSemi1(p => ({ ...p, hora: h }))}
              label="Hora"
            />
          </div>

          {/* SEMI 2 */}
          <div className="bg-neutral-800/50 rounded-2xl p-4 space-y-3 border border-neutral-700/50">
            <p className="text-[11px] font-black text-yellow-400 uppercase tracking-widest">🔹 Semifinal 2</p>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-neutral-500 shrink-0" />
              <input
                type="date"
                value={semi2.fecha}
                onChange={e => setSemi2(p => ({ ...p, fecha: e.target.value }))}
                className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <HoraPicker
              fecha={semi2.fecha}
              hora={semi2.hora}
              onChange={h => setSemi2(p => ({ ...p, hora: h }))}
              label="Hora"
            />
          </div>

          {/* FINAL */}
          <div className="bg-neutral-800/50 rounded-2xl p-4 space-y-3 border border-amber-500/20">
            <p className="text-[11px] font-black text-amber-400 uppercase tracking-widest">🏆 Gran Final</p>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-neutral-500 shrink-0" />
              <input
                type="date"
                value={finalJ.fecha}
                onChange={e => setFinalJ(p => ({ ...p, fecha: e.target.value }))}
                className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <HoraPicker
              fecha={finalJ.fecha}
              hora={finalJ.hora}
              onChange={h => setFinalJ(p => ({ ...p, hora: h }))}
              label="Hora"
            />
          </div>

          {/* Preview del mensaje */}
          <div>
            <p className="text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-2">Vista previa del mensaje</p>
            <div className="bg-neutral-800 rounded-2xl p-4 border border-neutral-700">
              <pre className="text-xs text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed">
                {buildMensaje()}
              </pre>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-800 shrink-0 space-y-3">
          <button
            onClick={handleCopiar}
            className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl font-black text-sm transition-all border border-neutral-700"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400">¡COPIADO!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                COPIAR MENSAJE WHATSAPP
              </>
            )}
          </button>

          <button
            onClick={handleDescargarPNG}
            disabled={!allDatesSet || generatingPNG}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white py-3 rounded-xl font-black text-sm shadow-lg transition-all"
          >
            {generatingPNG ? (
              <span className="animate-pulse">Generando PNG...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                DESCARGAR FLAYER PNG
                {!allDatesSet && <span className="text-[10px] opacity-60 ml-1">(requiere 3 fechas)</span>}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvitarModal;

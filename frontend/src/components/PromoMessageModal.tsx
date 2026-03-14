import React, { useState, useRef } from 'react';
import { Copy, MessageSquare, X, Clock, Download, Trophy } from 'lucide-react';
import { format, parseISO, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import html2canvas from 'html2canvas';

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  torneo?: any; // Torneo actual para obtener nombres de equipos si está disponible
}

const PromoMessageModal: React.FC<PromoModalProps> = ({ isOpen, onClose, torneo }) => {
  const [activeTab, setActiveTab] = useState<'semi1' | 'semi2' | 'final'>('semi1');
  const [dates, setDates] = useState({
    semi1: '',
    semi2: '',
    final: ''
  });
  
  const [times, setTimes] = useState({
    semi1: '7:30 PM',
    semi2: '7:30 PM',
    final: '7:30 PM'
  });

  const flyerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const weekendHours = ['12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'];

  const handleDateChange = (key: keyof typeof dates, value: string) => {
    setDates(prev => ({ ...prev, [key]: value }));
    if (value) {
        const date = parseISO(value);
        if (!isWeekend(date)) {
            setTimes(prev => ({ ...prev, [key]: '7:30 PM' }));
        }
    }
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '[FECHA]';
    try {
        const date = parseISO(dateStr);
        return format(date, "EEEE dd 'de' MMMM", { locale: es });
    } catch {
        return dateStr;
    }
  };

  const getTeamName = (ronda: string, side: 'local' | 'visitante') => {
    if (!torneo) return side === 'local' ? 'EQUIPO A' : 'EQUIPO B';
    const juego = torneo.juegos?.find((j: any) => j.ronda === (ronda === 'semi1' ? 'semifinal_1' : ronda === 'semi2' ? 'semifinal_2' : 'final'));
    if (!juego) return side === 'local' ? 'EQUIPO A' : 'EQUIPO B';
    const id = side === 'local' ? juego.equipo_local_id : juego.equipo_visitante_id;
    if (id === 'TBD') return 'POR DEFINIR';
    return torneo.equipos?.find((e: any) => e.id === id)?.nombre || (side === 'local' ? 'LOCAL' : 'VISITANTE');
  };

  const generateMessage = (key: 'semi1' | 'semi2' | 'final') => {
    const local = getTeamName(key, 'local');
    const visitante = getTeamName(key, 'visitante');
    const fecha = formatDateLabel(dates[key]);
    const hora = times[key];

    if (key === 'final') {
        return `🏆 ¡TORNEOS RELÁMPAGO ENVIGADO!
   
🥇 GRAN FINAL - CAMPEONATO
   
🏅 ${local} vs 🏅 ${visitante}
   
📅 ${fecha.toUpperCase()}
🕐 ${hora}
📍 POLIDEPORTIVO SUR ENVIGADO
   
👑 ¡ESTA ES LA HORA DE LA GLORIA!
   
#TorneosRelámpago #Softball #Final #Envigado`;
    }

    const emotion = key === 'semi1' ? '🔥 SE VIENE LA ACCIÓN' : '🔥 LA BATALLA CONTINÚA';
    const accent = key === 'semi1' ? '⚡ ¡A TRAER TU MEJOR JUEGO!' : '⚡ ¡A DARLO TODO EN LA CANCHA!';

    return `⚾ ¡TORNEOS RELÁMPAGO ENVIGADO!
   
${emotion}
   
${key === 'semi1' ? '🔴' : '🟡'} ${local} vs ${key === 'semi1' ? '🔵' : '🟢'} ${visitante}
   
📅 ${fecha.toUpperCase()}
🕐 ${hora}
📍 POLIDEPORTIVO SUR ENVIGADO
   
${accent}
   
#TorneosRelámpago #Softball #Envigado`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateMessage(activeTab));
    alert('Mensaje copiado');
  };

  const downloadPNG = async () => {
    if (!flyerRef.current) return;
    try {
        const canvas = await html2canvas(flyerRef.current, { scale: 2, backgroundColor: '#0a0a0a', useCORS: true });
        const link = document.createElement('a');
        link.download = `Flyer_${activeTab}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[95vh]">
        
        {/* Lado Izquierdo: Configuración */}
        <div className="w-full md:w-1/2 p-8 space-y-8 overflow-y-auto border-r border-neutral-800">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-blue-500" />
                Flayers
              </h3>
              <button onClick={onClose} className="md:hidden p-2 text-neutral-500"><X /></button>
           </div>

           <div className="flex bg-neutral-950 p-1.5 rounded-2xl gap-1">
              {(['semi1', 'semi2', 'final'] as const).map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                      {tab.toUpperCase()}
                  </button>
              ))}
           </div>

           <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Fecha del Partido</label>
                      <input 
                        type="date"
                        value={dates[activeTab]}
                        onChange={(e) => handleDateChange(activeTab, e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Horario</label>
                      {isWeekend(dates[activeTab] ? parseISO(dates[activeTab]) : new Date()) ? (
                          <select 
                            value={times[activeTab]}
                            onChange={(e) => setTimes(prev => ({ ...prev, [activeTab]: e.target.value }))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white outline-none"
                          >
                            {weekendHours.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                      ) : (
                          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400 text-sm flex items-center gap-2">
                             <Clock className="w-4 h-4 opacity-50" /> 7:30 PM (Lunes-Viernes)
                          </div>
                      )}
                  </div>
              </div>

              <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Texto del Mensaje</label>
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 text-xs text-neutral-400 font-mono whitespace-pre-line leading-relaxed">
                        {generateMessage(activeTab)}
                    </div>
              </div>

              <div className="flex gap-4">
                  <button onClick={copyToClipboard} className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white py-4 rounded-2xl font-black transition-all">
                      <Copy className="w-4 h-4" /> COPIAR
                  </button>
                  <button onClick={downloadPNG} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black transition-all">
                      <Download className="w-4 h-4" /> PNG
                  </button>
              </div>
           </div>
        </div>

        {/* Lado Derecho: Previsualización Visual */}
        <div className="hidden md:flex flex-1 bg-neutral-950 items-center justify-center p-12 relative">
            <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-500 hover:text-white transition-all"><X /></button>
            
            <div ref={flyerRef} className="w-full max-w-sm aspect-[3/4] bg-neutral-900 rounded-[3rem] border-8 border-neutral-800 shadow-2xl flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <Trophy className={`w-12 h-12 mb-6 ${activeTab === 'final' ? 'text-yellow-500' : 'text-blue-500'}`} />
                <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">TORNEOS RELÁMPAGO ENVIGADO</div>
                <h2 className="text-4xl font-black text-white leading-tight mb-8">
                    {activeTab === 'final' ? 'GRAN FINAL' : `SEMIFINAL ${activeTab === 'semi1' ? '1' : '2'}`}
                </h2>

                <div className="w-full h-px bg-neutral-800 mb-8"></div>

                <div className="space-y-2 mb-8">
                    <div className="text-2xl font-black text-white truncate uppercase tracking-tight">{getTeamName(activeTab, 'local')}</div>
                    <div className="text-red-500 font-black italic text-lg opacity-40">VS</div>
                    <div className="text-2xl font-black text-white truncate uppercase tracking-tight">{getTeamName(activeTab, 'visitante')}</div>
                </div>

                <div className="mt-auto space-y-1">
                    <div className="text-neutral-400 text-sm font-bold uppercase tracking-widest">{formatDateLabel(dates[activeTab])}</div>
                    <div className="text-white text-2xl font-black">{times[activeTab]}</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PromoMessageModal;

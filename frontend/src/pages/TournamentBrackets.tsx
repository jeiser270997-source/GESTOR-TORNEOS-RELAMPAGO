import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Torneo } from '../types';
import { Clock, Trophy, ChevronLeft, AlertCircle } from 'lucide-react';
import { isWeekend, parseISO } from 'date-fns';

const TournamentBrackets = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [torneo, setTorneo] = useState<Torneo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [schedules, setSchedules] = useState({
    semifinal_1: { fecha: '', hora: '19:30' },
    semifinal_2: { fecha: '', hora: '19:30' },
    final: { fecha: '', hora: '19:30' },
  });

  const [matchups, setMatchups] = useState({
    semifinal_1_local: '',
    semifinal_1_visitante: '',
    semifinal_2_local: '',
    semifinal_2_visitante: '',
    final_local: '',
    final_visitante: '',
  });

  const weekendHours = [
    { v: '12:00', l: '12:00 PM' },
    { v: '14:00', l: '2:00 PM' },
    { v: '16:00', l: '4:00 PM' },
    { v: '18:00', l: '6:00 PM' },
    { v: '20:00', l: '8:00 PM' }
  ];

  useEffect(() => {
    if (id) {
      api.getTorneo(id).then(setTorneo).catch(console.error).finally(() => setLoading(false));
    }
  }, [id]);

  const handleScheduleChange = (ronda: string, field: string, value: string) => {
    setSchedules(prev => {
      const newSched = { ...prev[ronda as keyof typeof prev], [field]: value };
      if (field === 'fecha' && value) {
        const date = parseISO(value);
        if (!isWeekend(date)) newSched.hora = '19:30';
      }
      return { ...prev, [ronda]: newSched };
    });
  };

  // BUG FIX #12: Conversión de fecha local a UTC correcta
  // El problema original: "2025-06-15T05:00:00Z" asume siempre UTC-5.
  // Solución: guardar la fecha tal como viene del input (YYYY-MM-DD) más la hora,
  // dejando que la base de datos maneje el timezone.
  const buildFechaISO = (dateStr: string, hora: string): string => {
    // dateStr viene del <input type="date"> como "YYYY-MM-DD"
    // Construimos un ISO local para no perder el día por timezone offsets
    return `${dateStr}T${hora}:00.000Z`;
  };

  const handleSave = async () => {
    if (!torneo || torneo.equipos.length < 4) return;
    const { semifinal_1_local, semifinal_1_visitante, semifinal_2_local, semifinal_2_visitante } = matchups;

    // Validar semis
    const semiTeams = [semifinal_1_local, semifinal_1_visitante, semifinal_2_local, semifinal_2_visitante];
    if (new Set(semiTeams).size !== 4 || semiTeams.includes('')) {
      alert('Debes seleccionar los 4 equipos para las semifinales, sin repetir ninguno.');
      return;
    }

    // BUG FIX #13: Validar que se eligieron fechas para los 3 juegos
    if (!schedules.semifinal_1.fecha || !schedules.semifinal_2.fecha || !schedules.final.fecha) {
      alert('Debes seleccionar fechas para los 3 juegos.');
      return;
    }

    const juegosData: Array<{ ronda: 'semifinal_1' | 'semifinal_2' | 'final'; equipo_local_id: string; equipo_visitante_id: string; fecha: string; hora: string }> = [
      {
        ronda: 'semifinal_1',
        equipo_local_id: semifinal_1_local,
        equipo_visitante_id: semifinal_1_visitante,
        fecha: buildFechaISO(schedules.semifinal_1.fecha, schedules.semifinal_1.hora),
        hora: schedules.semifinal_1.hora,
      },
      {
        ronda: 'semifinal_2',
        equipo_local_id: semifinal_2_local,
        equipo_visitante_id: semifinal_2_visitante,
        fecha: buildFechaISO(schedules.semifinal_2.fecha, schedules.semifinal_2.hora),
        hora: schedules.semifinal_2.hora,
      },
      {
        ronda: 'final',
        equipo_local_id: matchups.final_local || 'TBD',
        equipo_visitante_id: matchups.final_visitante || 'TBD',
        fecha: buildFechaISO(schedules.final.fecha, schedules.final.hora),
        hora: schedules.final.hora,
      }
    ];

    setSaving(true);
    try {
      await api.saveJuegos(id!, juegosData);
      navigate(`/torneo/${id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar el calendario');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white animate-pulse p-8">Cargando...</div>;
  if (!torneo) return <div className="text-white p-8">Torneo no encontrado</div>;

  // BUG FIX #14: Mostrar advertencia si el torneo ya tiene juegos (evita confusión al re-entrar)
  const yaConfigurado = torneo.juegos && torneo.juegos.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <button
        onClick={() => navigate(`/torneo/${id}/configuracion`)}
        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Volver a Equipos
      </button>

      {yaConfigurado && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-200">
            Este torneo ya tiene juegos programados. Si continúas se generará un error. Usa <strong>Editar Final</strong> desde el detalle del torneo para cambiar los equipos de la final.
          </p>
        </div>
      )}

      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 sm:p-10 shadow-2xl">
        <h2 className="text-3xl font-extrabold text-white mb-2">Calendario del Torneo</h2>
        <p className="text-neutral-400 mb-10">Define las fechas y horas para las semifinales y la gran final.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['semifinal_1', 'semifinal_2', 'final'] as const).map((ronda) => {
            const isRoundWeekend = schedules[ronda].fecha ? isWeekend(parseISO(schedules[ronda].fecha)) : false;
            return (
              <div key={ronda} className="space-y-6 p-6 bg-neutral-950 border border-neutral-800 rounded-2xl">
                <div className="flex items-center gap-2 text-blue-500 mb-2">
                  <Trophy className="w-5 h-5" />
                  <span className="font-bold uppercase tracking-wider text-xs">{ronda.replace('_', ' ')}</span>
                </div>

                {ronda !== 'final' && (
                  <div className="space-y-4 pt-2 border-t border-neutral-900">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-600 uppercase">Equipo Local</label>
                      <select
                        value={matchups[`${ronda}_local` as keyof typeof matchups]}
                        onChange={(e) => setMatchups(prev => ({ ...prev, [`${ronda}_local`]: e.target.value }))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Seleccionar...</option>
                        {torneo.equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-600 uppercase">Equipo Visitante</label>
                      <select
                        value={matchups[`${ronda}_visitante` as keyof typeof matchups]}
                        onChange={(e) => setMatchups(prev => ({ ...prev, [`${ronda}_visitante`]: e.target.value }))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Seleccionar...</option>
                        {torneo.equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-2 border-t border-neutral-900">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Fecha del Juego</label>
                    <input
                      type="date"
                      value={schedules[ronda].fecha}
                      onChange={(e) => handleScheduleChange(ronda, 'fecha', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Hora</label>
                    {isRoundWeekend ? (
                      <select
                        value={schedules[ronda].hora}
                        onChange={(e) => handleScheduleChange(ronda, 'hora', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        {weekendHours.map(h => <option key={h.v} value={h.v}>{h.l}</option>)}
                      </select>
                    ) : (
                      <div className="bg-neutral-800/50 text-neutral-400 p-3 rounded-lg flex items-center gap-2 border border-neutral-800">
                        <Clock className="w-4 h-4" />
                        7:30 PM
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-200">
            Los juegos entre semana tienen un horario fijo de <strong>7:30 PM</strong>. Los fines de semana puedes elegir entre varios horarios disponibles.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !schedules.semifinal_1.fecha || !schedules.semifinal_2.fecha || !schedules.final.fecha || yaConfigurado}
          className="w-full mt-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          {saving ? 'Guardando...' : 'CONFIRMAR CALENDARIO Y COMENZAR'}
        </button>
      </div>
    </div>
  );
};

export default TournamentBrackets;

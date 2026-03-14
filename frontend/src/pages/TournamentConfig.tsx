import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Torneo, Jugador } from '../types';
import { Clipboard, Trash2, Plus, ArrowRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { normalizeRoster } from '../utils/rosterNormalizer';

const TournamentConfig = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [torneo, setTorneo] = useState<Torneo | null>(null);
  const [loading, setLoading] = useState(true);

  const [teamName, setTeamName] = useState('');
  const [rawRoster, setRawRoster] = useState('');
  const [tempRoster, setTempRoster] = useState<Omit<Jugador, 'id'>[]>([]);

  useEffect(() => {
    if (id) {
      api.getTorneo(id).then(setTorneo).catch(console.error).finally(() => setLoading(false));
    }
  }, [id]);

  const handleNormalize = () => {
    if (!rawRoster.trim()) return;
    const normalized = normalizeRoster(rawRoster);
    setTempRoster(normalized);
  };

  const handleAddTeam = async () => {
    if (!torneo) return;
    if (torneo.equipos.length >= 4) {
      alert('Ya hay 4 equipos registrados en este torneo.');
      return;
    }
    if (!teamName.trim()) {
      alert('Debes ingresar el nombre del equipo');
      return;
    }
    if (tempRoster.length > 0 && tempRoster.length < 10) {
      alert('El roster debe tener al menos 10 jugadores.');
      return;
    }

    try {
      await api.addEquipo(id!, {
        nombre: teamName,
        numero_delegado: '',
        pago_confirmado: false,
        roster: tempRoster as Jugador[],
        jugadores_activos: [],
      });

      alert(tempRoster.length > 0 ? 'Equipo guardado correctamente.' : 'Equipo guardado. Puedes editar el roster después.');
      setTeamName('');
      setRawRoster('');
      setTempRoster([]);
      const updated = await api.getTorneo(id!);
      setTorneo(updated);
    } catch (err) {
      alert('Error al agregar equipo');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm('¿Eliminar equipo?')) return;
    try {
      await api.deleteEquipo(teamId);
      const updated = await api.getTorneo(id!);
      setTorneo(updated);
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  if (loading) return <div className="text-white">Cargando...</div>;
  if (!torneo) return <div className="text-white">Torneo no encontrado</div>;

  const canGenerateBrackets = torneo.equipos.length === 4;

  return (
    <div className="space-y-10 pb-20">
      {/* Header con botón volver y botón ir al detalle si ya hay equipos */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Volver
        </button>

        {torneo.equipos.length > 0 && (
          <button
            onClick={() => navigate(`/torneo/${id}`)}
            className="flex items-center gap-2 text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          >
            Ver Detalle del Torneo
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* FORMULARIO AGREGAR EQUIPO */}
        <div className="flex-1 space-y-8">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Plus className="w-6 h-6 text-blue-500" />
              Registrar Equipo ({torneo.equipos.length < 4 ? torneo.equipos.length + 1 : 4}/4)
            </h2>

            <div className="space-y-6">
              {/* Solo nombre — sin campo delegado */}
              <input
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="Nombre del Equipo"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none font-bold"
              />

              <textarea
                value={rawRoster}
                onChange={e => setRawRoster(e.target.value)}
                placeholder="Pega el roster aquí... (opcional)"
                rows={4}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none resize-none font-mono text-sm"
              />

              <button
                onClick={handleNormalize}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Clipboard className="w-5 h-5" /> Normalizar Roster
              </button>

              {tempRoster.length > 0 && (
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden mt-4">
                  <div className="px-4 py-3 bg-neutral-800/50 border-b border-neutral-800 flex justify-between items-center text-sm">
                    <span className="font-bold text-neutral-300">Roster Detectado</span>
                    <span className={`${tempRoster.length >= 10 ? 'text-emerald-400' : 'text-amber-400'} font-black italic`}>
                      {tempRoster.length} Jugadores
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-neutral-800">
                    {tempRoster.map((p, i) => (
                      <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-900 transition-colors">
                        <span className="text-neutral-500 font-mono text-xs w-6">{i + 1}</span>
                        <span className="text-white font-mono text-xs w-6">{p.numero_camiseta || '-'}</span>
                        <span className="text-neutral-300 text-sm">{p.nombre}</span>
                      </div>
                    ))}
                  </div>
                  {tempRoster.length < 10 && (
                    <div className="p-4 bg-amber-500/10 border-t border-neutral-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <p className="text-xs text-amber-200">Se recomienda un mínimo de 10 jugadores.</p>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleAddTeam}
                disabled={!teamName.trim() || (tempRoster.length > 0 && tempRoster.length < 10) || torneo.equipos.length >= 4}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-30 disabled:pointer-events-none mt-2"
              >
                {tempRoster.length > 0 ? 'Guardar Equipo y Roster' : 'Guardar Equipo'}
              </button>
            </div>
          </div>
        </div>

        {/* LISTA DE EQUIPOS */}
        <div className="w-full lg:w-96 space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            Equipos Confirmados
            <span className="text-blue-500 bg-blue-500/10 px-2 rounded text-sm">{torneo.equipos.length}/4</span>
          </h3>

          <div className="space-y-4">
            {torneo.equipos.length === 0 && (
              <p className="text-neutral-600 text-sm italic text-center py-8">
                Sin equipos aún. Agrega el primero.
              </p>
            )}
            {torneo.equipos.map(equipo => (
              <div
                key={equipo.id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neutral-800 rounded-xl flex items-center justify-center text-blue-500 font-bold">
                    {equipo.nombre.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{equipo.nombre}</h4>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                      {equipo.roster?.length || 0} jugadores
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTeam(equipo.id)}
                  className="p-2 text-neutral-600 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {canGenerateBrackets && (
            <div className="pt-6 border-t border-neutral-800">
              <button
                onClick={() => navigate(`/torneo/${id}/calendario`)}
                className="w-full p-6 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                GENERAR BRACKETS <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentConfig;

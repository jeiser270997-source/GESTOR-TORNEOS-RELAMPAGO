import React, { useState } from 'react';
import { Calendar, Clock, AlertCircle, Save } from 'lucide-react';
import { isWeekend, parseISO } from 'date-fns';
import { api } from '../api';
import type { Juego, Torneo } from '../types';
import BaseModal from './BaseModal';
import { format12h } from '../utils/dateFormatters';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  juego: Juego | null;
  torneo: Torneo;
  onUpdate: () => void;
}

const WEEKEND_HOURS = ['12:00', '14:00', '16:00', '18:00', '20:00'];
const WEEKDAY_HOUR = '19:30';

const rondaLabel: Record<string, string> = {
  semifinal_1: 'Semifinal 1',
  semifinal_2: 'Semifinal 2',
  final: 'Gran Final',
};

const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  juego,
  torneo,
  onUpdate,
}) => {
  const [fecha, setFecha] = useState(juego?.fecha ? juego.fecha.split('T')[0] : '');
  const [hora, setHora] = useState(juego?.hora ?? WEEKDAY_HOUR);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Recalcular hora fija si el día cambia a entre semana
  const handleFechaChange = (nuevaFecha: string) => {
    setFecha(nuevaFecha);
    setError('');
    if (nuevaFecha && !isWeekend(parseISO(nuevaFecha))) {
      setHora(WEEKDAY_HOUR);
    } else if (nuevaFecha && isWeekend(parseISO(nuevaFecha))) {
      setHora(WEEKEND_HOURS[0]);
    }
  };

  const esFinDeSemana = fecha ? isWeekend(parseISO(fecha)) : false;

  // Verificar si el horario está ocupado por OTRO juego del mismo torneo
  const horarioOcupado = (() => {
    if (!fecha || !hora) return false;
    const clave = `${fecha}T${hora}`;
    return torneo.juegos
      .filter(j => j.id !== juego?.id)
      .some(j => `${j.fecha.split('T')[0]}T${j.hora}` === clave);
  })();

  const handleSave = async () => {
    if (!juego) return;
    if (!fecha) { setError('Debes seleccionar una fecha.'); return; }
    if (horarioOcupado) { setError('Ese horario ya está ocupado por otro partido del torneo.'); return; }

    setLoading(true);
    setError('');
    try {
      await api.updateJuego(juego.id, {
        fecha: new Date(`${fecha}T00:00:00`).toISOString(),
        hora,
      });
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Error al reprogramar el partido. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!juego) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reprogramar Partido"
      subtitle={rondaLabel[juego.ronda] ?? juego.ronda}
      icon={<Calendar className="w-5 h-5" />}
      footer={
        <button
          onClick={handleSave}
          disabled={loading || !fecha || horarioOcupado}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-black shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-30"
        >
          <Save className="w-5 h-5" />
          {loading ? 'GUARDANDO...' : 'CONFIRMAR NUEVA FECHA'}
        </button>
      }
    >
      <div className="space-y-6">

        {/* Partido info */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-white font-black text-sm truncate">
            {juego.equipo_local_id === 'TBD'
              ? 'POR DEFINIR'
              : torneo.equipos.find(e => e.id === juego.equipo_local_id)?.nombre ?? '?'}
          </span>
          <span className="text-neutral-500 font-black text-xs mx-3">VS</span>
          <span className="text-white font-black text-sm truncate text-right">
            {juego.equipo_visitante_id === 'TBD'
              ? 'POR DEFINIR'
              : torneo.equipos.find(e => e.id === juego.equipo_visitante_id)?.nombre ?? '?'}
          </span>
        </div>

        {/* Fecha actual */}
        <div className="text-xs text-neutral-500 flex items-center gap-2">
          <Clock className="w-3 h-3" />
          Fecha actual: <span className="text-neutral-300 font-bold">
            {new Date(juego.fecha).toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'short' })}
            {' '}&middot;{' '}{format12h(juego.hora)}
          </span>
        </div>

        {/* Nueva fecha */}
        <div className="space-y-2">
          <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">
            Nueva Fecha
          </label>
          <input
            type="date"
            value={fecha}
            onChange={e => handleFechaChange(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Hora */}
        {fecha && (
          <div className="space-y-2">
            <label className="text-xs font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3" /> Hora
            </label>
            {!esFinDeSemana ? (
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white font-bold text-sm flex items-center gap-2">
                <span>{format12h(WEEKDAY_HOUR)}</span>
                <span className="text-[10px] text-neutral-500 font-normal">(entre semana — fijo)</span>
              </div>
            ) : (
              <select
                value={hora}
                onChange={e => setHora(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                {WEEKEND_HOURS.map(h => (
                  <option key={h} value={h}>{format12h(h)}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Advertencia horario ocupado */}
        {horarioOcupado && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200">
              Este horario ya está asignado a otro partido del torneo. Elige una fecha u hora diferente.
            </p>
          </div>
        )}

        {/* Error genérico */}
        {error && !horarioOcupado && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200">{error}</p>
          </div>
        )}

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-200">
            Los flayers y documentos PDF reflejarán automáticamente la nueva fecha al regenerarlos.
          </p>
        </div>
      </div>
    </BaseModal>
  );
};

export default RescheduleModal;

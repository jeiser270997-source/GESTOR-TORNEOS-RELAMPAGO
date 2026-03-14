import React, { useState } from 'react';
import { X, Trophy, Save, AlertCircle } from 'lucide-react';
import { api } from '../api';
import type { Torneo } from '../types';

interface EditFinalModalProps {
  isOpen: boolean;
  onClose: () => void;
  torneo: Torneo;
  onUpdate: () => void;
}

const EditFinalModal: React.FC<EditFinalModalProps> = ({ isOpen, onClose, torneo, onUpdate }) => {
  const finalJuego = torneo.juegos.find(j => j.ronda === 'final');
  const semi1 = torneo.juegos.find(j => j.ronda === 'semifinal_1');
  const semi2 = torneo.juegos.find(j => j.ronda === 'semifinal_2');

  const equiposSemi1 = torneo.equipos.filter(e => e.id === semi1?.equipo_local_id || e.id === semi1?.equipo_visitante_id);
  const equiposSemi2 = torneo.equipos.filter(e => e.id === semi2?.equipo_local_id || e.id === semi2?.equipo_visitante_id);

  const [ganador1, setGanador1] = useState(finalJuego?.equipo_local_id !== 'TBD' ? finalJuego?.equipo_local_id : '');
  const [ganador2, setGanador2] = useState(finalJuego?.equipo_visitante_id !== 'TBD' ? finalJuego?.equipo_visitante_id : '');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !finalJuego) return null;

  const handleSave = async () => {
    if (!ganador1 || !ganador2) {
      alert('Debes seleccionar ambos ganadores para la final.');
      return;
    }
    if (ganador1 === ganador2) {
      alert('Un equipo no puede jugar contra sí mismo.');
      return;
    }

    setLoading(true);
    try {
      await api.updateJuego(finalJuego.id, {
        equipo_local_id: ganador1,
        equipo_visitante_id: ganador2
      });
      alert('Final actualizada correctamente');
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al actualizar la final');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Configurar Gran Final
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">¿Quién ganó la SEMIFINAL 1?</label>
                <select 
                    value={ganador1}
                    onChange={(e) => setGanador1(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-sm appearance-none"
                >
                    <option value="">Seleccionar Ganador Semi 1...</option>
                    {equiposSemi1.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
            </div>

            <div className="flex justify-center">
                <div className="h-4 w-px bg-neutral-800"></div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">¿Quién ganó la SEMIFINAL 2?</label>
                <select 
                    value={ganador2}
                    onChange={(e) => setGanador2(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-sm appearance-none"
                >
                    <option value="">Seleccionar Ganador Semi 2...</option>
                    {equiposSemi2.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200">Al guardar, los documentos y flayers de la gran final se habilitarán automáticamente.</p>
          </div>

          <button 
            onClick={handleSave}
            disabled={loading || !ganador1 || !ganador2}
            className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-yellow-900/20 hover:shadow-yellow-500/30 transition-all active:scale-95 disabled:opacity-30"
          >
            {loading ? 'Confirmando...' : (
                <div className="flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" />
                    GUARDAR FINAL
                </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditFinalModal;

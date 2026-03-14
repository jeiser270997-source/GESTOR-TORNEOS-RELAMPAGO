import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Equipo, Jugador } from '../types';
import { X, Plus, Trash2, Save, Users } from 'lucide-react';

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipo: Equipo;
  onUpdate: () => void;
}

const EditTeamModal = ({ isOpen, onClose, equipo, onUpdate }: EditTeamModalProps) => {
  const [nombre, setNombre] = useState('');
  const [roster, setRoster] = useState<Jugador[]>([]);
  const [saving, setSaving] = useState(false);
  const [rosterText, setRosterText] = useState('');
  const [activeTab, setActiveTab] = useState<'individual' | 'bulk'>('individual');

  // Sincronizar estado cuando cambia el equipo
  useEffect(() => {
    if (isOpen && equipo) {
      setNombre(equipo.nombre || '');
      setRoster(equipo.roster ? [...equipo.roster] : []);
      setRosterText('');
      setActiveTab('individual');
    }
  }, [isOpen, equipo?.id]);

  if (!isOpen || !equipo) return null;

  const addJugador = () => {
    setRoster(prev => [...prev, { nombre: '', numero_camiseta: '' }]);
  };

  const updateJugador = (index: number, field: keyof Jugador, value: string) => {
    setRoster(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeJugador = (index: number) => {
    setRoster(prev => prev.filter((_, i) => i !== index));
  };

  const parseRosterBulk = () => {
    const lines = rosterText.split('\n').map(l => l.trim()).filter(Boolean);
    const jugadores: Jugador[] = lines.map(line => {
      // Formatos: "10 Juan", "Juan #10", "10. Juan", "Juan - 10", "Juan"
      const match1 = line.match(/^(\d+)[\.\-\s]+(.+)$/);
      const match2 = line.match(/^(.+?)\s*[#\-]\s*(\d+)$/);
      const match3 = line.match(/^(.+?)\s+(\d+)$/);

      if (match1) return { numero_camiseta: match1[1], nombre: match1[2].trim() };
      if (match2) return { numero_camiseta: match2[2], nombre: match2[1].trim() };
      if (match3) return { numero_camiseta: match3[2], nombre: match3[1].trim() };
      return { numero_camiseta: '', nombre: line };
    });
    setRoster(jugadores);
    setActiveTab('individual');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const jugadoresLimpios = roster.filter(j => j.nombre?.trim());
      await api.updateEquipo(equipo.id, {
        nombre: nombre.trim() || equipo.nombre,
        roster: jugadoresLimpios,
      });
      await onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-black text-lg">EDITAR EQUIPO</h2>
              <p className="text-neutral-500 text-xs">{equipo.nombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Nombre del equipo */}
          <div>
            <label className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 block">
              Nombre del Equipo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-blue-500 transition-colors"
              placeholder={equipo.nombre}
            />
          </div>

          {/* Tabs */}
          <div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('individual')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === 'individual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                Individual ({roster.length})
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === 'bulk'
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                Pegar Lista
              </button>
            </div>

            {/* Tab: Individual */}
            {activeTab === 'individual' && (
              <div className="space-y-2">
                {roster.length === 0 && (
                  <p className="text-neutral-600 text-xs text-center py-4 italic">
                    Sin jugadores aún. Agrega uno o pega una lista.
                  </p>
                )}
                {roster.map((jugador, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={jugador.numero_camiseta || ''}
                      onChange={e => updateJugador(index, 'numero_camiseta', e.target.value)}
                      placeholder="#"
                      className="w-16 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-2 text-sm font-bold text-center focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <input
                      type="text"
                      value={jugador.nombre || ''}
                      onChange={e => updateJugador(index, 'nombre', e.target.value)}
                      placeholder={`Jugador ${index + 1}`}
                      className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      onClick={() => removeJugador(index)}
                      className="p-2 text-neutral-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addJugador}
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-neutral-700 hover:border-blue-500/50 text-neutral-500 hover:text-blue-400 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Jugador
                </button>
              </div>
            )}

            {/* Tab: Bulk */}
            {activeTab === 'bulk' && (
              <div className="space-y-3">
                <p className="text-neutral-500 text-xs">
                  Pega la lista de jugadores. Formatos soportados:<br />
                  <span className="text-neutral-400 font-mono">10 Juan García</span> · <span className="text-neutral-400 font-mono">Juan García #10</span> · <span className="text-neutral-400 font-mono">Juan García</span>
                </p>
                <textarea
                  value={rosterText}
                  onChange={e => setRosterText(e.target.value)}
                  placeholder="10 Juan García&#10;7 Carlos López&#10;Pedro Martínez #5&#10;Ana Torres"
                  rows={8}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
                <button
                  onClick={parseRosterBulk}
                  disabled={!rosterText.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Procesar Lista ({rosterText.split('\n').filter(l => l.trim()).length} líneas)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-800 shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600 font-bold text-sm transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-black text-sm shadow-lg transition-all"
          >
            {saving ? (
              <span className="animate-pulse">Guardando...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                GUARDAR CAMBIOS
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTeamModal;

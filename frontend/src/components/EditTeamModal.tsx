import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Equipo, Jugador } from '../types';
import { Plus, Trash2, Save, Users } from 'lucide-react';
import BaseModal from './BaseModal';

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipo: Equipo;
  onUpdate: () => void;
}

type JugadorForm = { id?: string; nombre: string; numero_camiseta: string | null };

const EditTeamModal = ({ isOpen, onClose, equipo, onUpdate }: EditTeamModalProps) => {
  const [nombre, setNombre] = useState('');
  const [roster, setRoster] = useState<JugadorForm[]>([]);
  const [saving, setSaving] = useState(false);
  const [rosterText, setRosterText] = useState('');
  const [activeTab, setActiveTab] = useState<'individual' | 'bulk'>('individual');

  useEffect(() => {
    if (isOpen && equipo) {
      setNombre(equipo.nombre || '');
      setRoster(equipo.roster ? equipo.roster.map(j => ({ id: j.id, nombre: j.nombre, numero_camiseta: j.numero_camiseta })) : []);
      setRosterText('');
      setActiveTab('individual');
    }
  }, [isOpen, equipo?.id]);

  if (!isOpen || !equipo) return null;

  const addJugador = () => {
    setRoster(prev => [...prev, { nombre: '', numero_camiseta: '' }]);
  };

  const updateJugador = (index: number, field: keyof JugadorForm, value: string) => {
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
    const jugadores: JugadorForm[] = lines.map(line => {
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
        roster: jugadoresLimpios as Jugador[],
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

  const footer = (
    <div className="flex gap-3">
      <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600 font-bold text-sm transition-all">
        Cancelar
      </button>
      <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-black text-sm shadow-lg transition-all">
        {saving ? <span className="animate-pulse">Guardando...</span> : <><Save className="w-4 h-4" />GUARDAR CAMBIOS</>}
      </button>
    </div>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="EDITAR EQUIPO" subtitle={equipo.nombre} icon={<Users className="w-5 h-5" />} footer={footer}>
      <div className="space-y-6">
        <div>
          <label className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 block">Nombre del Equipo</label>
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-blue-500 transition-colors"
            placeholder={equipo.nombre} />
        </div>
        <div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setActiveTab('individual')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'individual' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}>
              Individual ({roster.length})
            </button>
            <button onClick={() => setActiveTab('bulk')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'bulk' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}>
              Pegar Lista
            </button>
          </div>
          {activeTab === 'individual' && (
            <div className="space-y-2">
              {roster.length === 0 && <p className="text-neutral-600 text-xs text-center py-4 italic">Sin jugadores aún.</p>}
              {roster.map((jugador, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input type="text" value={jugador.numero_camiseta || ''} onChange={e => updateJugador(index, 'numero_camiseta', e.target.value)}
                    placeholder="#" className="w-16 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-2 text-sm font-bold text-center focus:outline-none focus:border-blue-500 transition-colors" />
                  <input type="text" value={jugador.nombre || ''} onChange={e => updateJugador(index, 'nombre', e.target.value)}
                    placeholder={`Jugador ${index + 1}`} className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors" />
                  <button onClick={() => removeJugador(index)} className="p-2 text-neutral-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={addJugador} className="w-full flex items-center justify-center gap-2 border border-dashed border-neutral-700 hover:border-blue-500/50 text-neutral-500 hover:text-blue-400 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all mt-2">
                <Plus className="w-4 h-4" />Agregar Jugador
              </button>
            </div>
          )}
          {activeTab === 'bulk' && (
            <div className="space-y-3">
              <p className="text-neutral-500 text-xs">Pega la lista de jugadores. Formatos: <span className="text-neutral-400 font-mono">10 Juan García</span> · <span className="text-neutral-400 font-mono">Juan García #10</span></p>
              <textarea value={rosterText} onChange={e => setRosterText(e.target.value)}
                placeholder="10 Juan García&#10;7 Carlos López" rows={8}
                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors resize-none" />
              <button onClick={parseRosterBulk} disabled={!rosterText.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                Procesar Lista ({rosterText.split('\n').filter(l => l.trim()).length} líneas)
              </button>
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

export default EditTeamModal;

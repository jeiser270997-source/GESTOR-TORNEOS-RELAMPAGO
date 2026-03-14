import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Trophy, ChevronLeft, Save } from 'lucide-react';

interface TournamentForm {
  nombre_externo: string;
}

const CreateTournament: React.FC = () => {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<TournamentForm>({
    defaultValues: {
      nombre_externo: 'Torneos Relámpago Envigado'
    }
  });
  const navigate = useNavigate();

  const onSubmit = async (data: TournamentForm) => {
    try {
      // Send nombre_externo and default fecha_inicio (today)
      const newTorneo = await api.createTorneo({
        ...data,
        fecha_inicio: new Date().toISOString()
      });
      navigate(`/torneo/${newTorneo.id}/configuracion`);
    } catch (err) {
      console.error(err);
      alert('Error al crear el torneo. Verifica la conexión con el servidor.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 group"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Volver al Dashboard
      </button>

      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 sm:p-10 shadow-2xl">
        <h2 className="text-3xl font-extrabold text-white mb-2">Nuevo Cuadrangular</h2>
        <p className="text-neutral-400 mb-10">Ingresa el nombre público para este torneo.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-300 ml-1">Nombre del Torneo</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-blue-500 transition-colors">
                <Trophy className="w-5 h-5" />
              </div>
              <input
                type="text"
                {...register('nombre_externo', { required: true })}
                placeholder="Ej: Torneos Relámpago Envigado"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-bold"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Confirmar y Continuar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTournament;

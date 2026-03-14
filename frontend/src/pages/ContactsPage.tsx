import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Contacto } from '../types';
import { Users, Phone, Search, Plus, Trash2, Edit2 } from 'lucide-react';

const ContactsPage = () => {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getContactos().then(setContactos).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = contactos.filter(c => 
    c.nombre_equipo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Directorio de Contactos</h2>
          <p className="text-neutral-400">Gestiona los equipos y delegados que han participado.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          Nuevo Contacto
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text"
          placeholder="Buscar equipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-neutral-900 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(contacto => (
            <div key={contacto.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 group hover:border-neutral-700 transition-all">
               <div className="flex items-start justify-between mb-4">
                 <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center font-bold text-xl">
                   {contacto.nombre_equipo.charAt(0)}
                 </div>
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg">
                     <Edit2 className="w-4 h-4" />
                   </button>
                   <button className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               </div>
               
               <h4 className="text-xl font-bold text-white mb-1">{contacto.nombre_equipo}</h4>
               <div className="flex items-center gap-2 text-neutral-400 text-sm mb-4">
                 <Phone className="w-3.5 h-3.5" />
                 {contacto.numero_delegado}
               </div>

               <div className="pt-4 border-t border-neutral-800 flex justify-between items-center">
                 <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Torneos</span>
                 <span className="bg-neutral-800 text-white px-2 py-0.5 rounded text-xs font-black">
                   {contacto.total_participaciones}
                 </span>
               </div>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="col-span-full p-20 text-center bg-neutral-900/50 border border-neutral-800 border-dashed rounded-3xl">
              <Users className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-500">No se encontraron contactos que coincidan con la búsqueda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactsPage;

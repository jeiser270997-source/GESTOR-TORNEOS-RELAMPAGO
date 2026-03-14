import axios from 'axios';
import type { Torneo, Equipo, Contacto, Juego } from './types';

const API_URL = 'http://localhost:3001/api';

export const api = {
  // Torneos
  getTorneos: () => axios.get<Torneo[]>(`${API_URL}/torneos`).then(res => res.data),
  createTorneo: (data: { fecha_inicio: string }) => axios.post<Torneo>(`${API_URL}/torneos`, data).then(res => res.data),
  getTorneo: (id: string) => axios.get<Torneo>(`${API_URL}/torneos/${id}`).then(res => res.data),
  deleteTorneo: (id: string) => axios.delete(`${API_URL}/torneos/${id}`).then(res => res.data),
  
  // Equipos
  addEquipo: (torneoId: string, equipo: Omit<Equipo, 'id' | 'torneo_id'>) => 
    axios.post<Equipo>(`${API_URL}/torneos/${torneoId}/equipos`, equipo).then(res => res.data),
  
  deleteEquipo: (id: string) =>
    axios.delete(`${API_URL}/equipos/${id}`).then(res => res.data),
  
  updateEquipo: (id: string, data: Partial<Equipo>) =>
    axios.put<Equipo>(`${API_URL}/equipos/${id}`, data).then(res => res.data),
    
  // Juegos
  saveJuegos: (torneoId: string, juegos: any[]) =>
    axios.post(`${API_URL}/torneos/${torneoId}/juegos`, { juegos }).then(res => res.data),

  updateJuego: (id: string, data: Partial<Juego>) =>
    axios.put<Juego>(`${API_URL}/juegos/${id}`, data).then(res => res.data),

  // Contactos
  getContactos: () => axios.get<Contacto[]>(`${API_URL}/contactos`).then(res => res.data),
};

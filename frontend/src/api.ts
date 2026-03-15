import axios, { AxiosError } from 'axios';
import { supabase } from './supabase';
import type { Torneo, Equipo, Contacto, Juego } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

// Manejo global de errores
axios.interceptors.response.use(
  res => res,
  (error: AxiosError<{ error?: string }>) => {
    const msg = error.response?.data?.error ?? error.message ?? 'Error de red';
    console.error('[API Error]', msg, error.config?.url);
    return Promise.reject(new Error(msg));
  }
);

// Adjuntar token de Supabase a cada petición
axios.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});

export const api = {
  // Torneos
  getTorneos: () => axios.get<Torneo[]>(`${API_URL}/torneos`).then(r => r.data),
  createTorneo: (data: { fecha_inicio: string }) => axios.post<Torneo>(`${API_URL}/torneos`, data).then(r => r.data),
  getTorneo: (id: string) => axios.get<Torneo>(`${API_URL}/torneos/${id}`).then(r => r.data),
  deleteTorneo: (id: string) => axios.delete(`${API_URL}/torneos/${id}`).then(r => r.data),

  // Equipos
  addEquipo: (torneoId: string, equipo: Omit<Equipo, 'id' | 'torneo_id'>) =>
    axios.post<Equipo>(`${API_URL}/torneos/${torneoId}/equipos`, equipo).then(r => r.data),
  deleteEquipo: (id: string) => axios.delete(`${API_URL}/equipos/${id}`).then(r => r.data),
  updateEquipo: (id: string, data: Partial<Equipo>) =>
    axios.put<Equipo>(`${API_URL}/equipos/${id}`, data).then(r => r.data),

  // Juegos
  saveJuegos: (torneoId: string, juegos: Partial<Juego>[]) =>
    axios.post(`${API_URL}/torneos/${torneoId}/juegos`, { juegos }).then(r => r.data),
  updateJuego: (id: string, data: Partial<Juego>) =>
    axios.put<Juego>(`${API_URL}/juegos/${id}`, data).then(r => r.data),

  // Contactos
  getContactos: () => axios.get<Contacto[]>(`${API_URL}/contactos`).then(r => r.data),
};
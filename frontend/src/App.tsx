import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CreateTournament from './pages/CreateTournament';
import TournamentConfig from './pages/TournamentConfig';
import TournamentBrackets from './pages/TournamentBrackets';
import TournamentDetail from './pages/TournamentDetail';

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;          // cargando
  if (session === null)      return <LoginPage />; // no logueado

  return (
    <Layout>
      <Routes>
        <Route path="/"                         element={<Dashboard />} />
        <Route path="/nuevo-torneo"             element={<CreateTournament />} />
        <Route path="/torneo/:id/configuracion" element={<TournamentConfig />} />
        <Route path="/torneo/:id/calendario"    element={<TournamentBrackets />} />
        <Route path="/torneo/:id"               element={<TournamentDetail />} />
      </Routes>
    </Layout>
  );
}

export default App;
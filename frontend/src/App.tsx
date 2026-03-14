import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreateTournament from './pages/CreateTournament';
import TournamentConfig from './pages/TournamentConfig';
import TournamentBrackets from './pages/TournamentBrackets';
import TournamentDetail from './pages/TournamentDetail';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/nuevo-torneo" element={<CreateTournament />} />
        <Route path="/torneo/:id/configuracion" element={<TournamentConfig />} />
        <Route path="/torneo/:id/calendario" element={<TournamentBrackets />} />
        <Route path="/torneo/:id" element={<TournamentDetail />} />
      </Routes>
    </Layout>
  );
}

export default App;

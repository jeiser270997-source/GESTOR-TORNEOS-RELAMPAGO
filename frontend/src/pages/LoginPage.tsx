import { useState } from 'react';
import { supabase } from '../supabase';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('Email o contraseña incorrectos');
    setLoading(false);
  };

  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#0f0f1a' }}>
      <div style={{ background:'#1a1a2e', padding:'2rem', borderRadius:'12px', width:'360px', boxShadow:'0 4px 24px rgba(0,0,0,0.4)' }}>
        <h1 style={{ color:'#fff', marginBottom:'0.25rem' }}>⚡ Torneos Relámpago</h1>
        <p style={{ color:'#888', marginBottom:'2rem', fontSize:'0.9rem' }}>Panel de administración</p>

        <input
          type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width:'100%', padding:'0.75rem', marginBottom:'0.75rem', borderRadius:'8px', border:'1px solid #333', background:'#0f0f1a', color:'#fff', boxSizing:'border-box', fontSize:'1rem' }}
        />
        <input
          type="password" placeholder="Contraseña" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ width:'100%', padding:'0.75rem', marginBottom:'1rem', borderRadius:'8px', border:'1px solid #333', background:'#0f0f1a', color:'#fff', boxSizing:'border-box', fontSize:'1rem' }}
        />

        {error && <p style={{ color:'#f38ba8', marginBottom:'1rem', fontSize:'0.9rem' }}>{error}</p>}

        <button
          onClick={handleLogin} disabled={loading}
          style={{ width:'100%', padding:'0.75rem', background:'#6c63ff', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'1rem', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </div>
  );
}
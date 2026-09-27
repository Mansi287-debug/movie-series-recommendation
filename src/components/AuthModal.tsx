import { useState, useEffect } from 'react';
import { Mail, Lock, X, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setError(null); setBusy(false); }
  }, [open, mode]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);
    setBusy(false);
    if (error) {
      setError(error);
    } else {
      onClose();
      setEmail('');
      setPassword('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        <div className="auth-brand"><span className="brand-mark"><Sparkles size={17} fill="currentColor" /></span><span>Cine<span>Match</span></span></div>
        <h2>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="auth-subtitle">{mode === 'signin' ? 'Sign in to sync your watchlist across devices.' : 'Join to save movies, get recommendations, and build your watchlist.'}</p>
        <div className="auth-tabs">
          <button className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>Sign In</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Sign Up</button>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field"><Mail size={17} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required autoComplete="email" /></label>
          <label className="auth-field"><Lock size={17} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} /></label>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="primary-button auth-submit" disabled={busy}>{busy ? <Loader2 size={16} className="spin" /> : (mode === 'signin' ? 'Sign In' : 'Create Account')}</button>
        </form>
      </div>
    </div>
  );
}

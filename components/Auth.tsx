import React, { useState } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import { authService } from '../services/supabaseClient';

interface AuthProps {
  onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error: signUpError } = await authService.signUp(email, password);
        if (signUpError) throw signUpError;
        setError('Check your email to confirm your account');
      } else {
        const { error: signInError } = await authService.signIn(email, password);
        if (signInError) throw signInError;
        onAuthSuccess();
      }
    } catch (err) {
      setError((err as any).message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans border-x border-slate-900 pt-[env(safe-area-inset-top)]">
      <div className="bg-slate-900/50 backdrop-blur-sm px-6 py-2 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
      </div>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mx-auto mb-6">
              <span className="text-2xl font-black text-slate-950">✂️</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Shorten</h1>
            <p className="text-sm text-slate-400">Smart Link Hub</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 disabled:opacity-50 text-sm uppercase tracking-widest"
            >
              {isLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  <span>{isSignUp ? 'Creating...' : 'Signing in...'}</span>
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="w-full text-center text-sm text-slate-400 hover:text-emerald-400 transition-colors font-medium"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Auth;

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export function Login() {
  const { t } = useTranslation();
  const { signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate('/reports');
    }
  }, [user, loading, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full text-center space-y-6 p-10 bg-slate-900 rounded-3xl shadow-xl shadow-emerald-500/5 border border-slate-800">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Activity size={32} />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-200 tracking-tight uppercase">
            {t('appName')} <span className="text-emerald-400">Pro</span>
          </h2>
          <p className="mt-2 text-slate-400 text-sm">
            Professional & Amateur Football Scouting
          </p>
        </div>
        
        <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
          {error && <div className="text-red-400 text-sm p-3 bg-red-500/10 border border-red-500/20 rounded-xl">{error}</div>}
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-1">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-1">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={formLoading}
            className="w-full flex justify-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 transition-colors uppercase tracking-wide"
          >
            {isRegister ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-slate-900 text-slate-500 font-medium">Or continue with</span>
          </div>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full flex justify-center py-3 px-4 border border-slate-800 rounded-xl shadow-sm text-sm font-bold text-slate-200 hover:text-emerald-400 bg-slate-950 hover:bg-slate-800 transition-colors"
        >
          {t('signIn')} (Google)
        </button>

        <p className="text-sm text-slate-500">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            type="button" 
            onClick={() => setIsRegister(!isRegister)}
            className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
          >
            {isRegister ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}

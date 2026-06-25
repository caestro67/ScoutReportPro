import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { useTranslation } from 'react-i18next';
import { ClipboardList, LogOut, Settings, PlusCircle, Activity } from 'lucide-react';

export function Layout() {
  const { user, logOut } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logOut();
    navigate('/login');
  };

  const languages = ['en', 'es', 'fr', 'de', 'pt', 'it', 'ar'];

  if (!user) {
    return <Outlet />;
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden w-full">
      <div className="p-4 md:p-6 flex flex-col h-full min-w-0 w-full">
        {/* Header Navigation */}
        <header className="flex flex-col xl:flex-row justify-between items-center mb-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 gap-4 shrink-0">
          
          <div className="flex items-center gap-6 w-full xl:w-auto justify-between xl:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
                <Activity size={24} />
              </div>
              <h1 className="text-xl font-bold tracking-tight uppercase">ScoutReport <span className="text-emerald-400">Pro</span></h1>
            </div>
            <button onClick={handleLogout} className="xl:hidden text-slate-400 hover:text-emerald-400">
              <LogOut size={20} />
            </button>
          </div>

          <nav className="flex items-center gap-2 text-sm w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 hide-scrollbar shrink-0">
            <Link 
              to="/reports" 
              className={`flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap transition-colors ${location.pathname === '/reports' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-emerald-400'}`}
            >
              <ClipboardList size={18} />
              {t('myReports')}
            </Link>
            <Link 
              to="/reports/new" 
              className={`flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap transition-colors ${location.pathname === '/reports/new' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-emerald-400'}`}
            >
              <PlusCircle size={18} />
              {t('newReport')}
            </Link>
            <Link 
              to="/settings" 
              className={`flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap transition-colors ${location.pathname === '/settings' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-emerald-400'}`}
            >
              <Settings size={18} />
              {t('settings')}
            </Link>
          </nav>

          <div className="flex items-center gap-4 xl:gap-6 w-full xl:w-auto justify-between xl:justify-end shrink-0">
            {/* Language Selector */}
            <div className="flex gap-1 xl:gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto hide-scrollbar">
              {languages.map(lang => (
                <button
                  key={lang}
                  onClick={() => i18n.changeLanguage(lang)}
                  className={`px-2 py-1 text-xs uppercase rounded transition-colors ${i18n.language.startsWith(lang) ? 'font-bold bg-emerald-500 text-slate-950' : 'font-medium text-slate-400 opacity-70 hover:opacity-100 hover:text-emerald-400'}`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 xl:border-l border-slate-800 xl:pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{user.displayName || 'Scout User'}</p>
                <p className="text-[10px] opacity-40 truncate max-w-[180px]">{user.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="hidden xl:flex p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                title={t('signOut')}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-7xl mx-auto custom-scrollbar pr-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

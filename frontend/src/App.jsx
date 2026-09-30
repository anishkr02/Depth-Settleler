import React, { useState, useEffect } from 'react';
import { api } from './api/client';
import AuthScreen from './components/AuthScreen';
import { LogOut, Wallet, Users, PlusCircle, ArrowRight } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(api.currentUser);

  useEffect(() => {
    // If we have a session stored, verify with /auth/me
    if (api.currentUser) {
      api.getMe()
        .then((userData) => setUser(userData))
        .catch(() => {
          api.clearSession();
          setUser(null);
        });
    }
  }, []);

  const handleLogout = () => {
    api.clearSession();
    setUser(null);
  };

  if (!user) {
    return <AuthScreen onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-olive-primary text-white flex items-center justify-center shadow-md shadow-olive-primary/20">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">Debt-Settle</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-slate-700 block">@{user.username}</span>
              <span className="text-[11px] text-slate-400 block">{user.email || 'Dev Mode'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-olive-100 text-olive-800 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Welcome, @{user.username}!</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            You are signed in. The next step is loading your expense groups list and dashboard.
          </p>
        </div>
      </main>
    </div>
  );
}

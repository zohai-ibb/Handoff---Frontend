import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, List, PlusCircle, Clock, Users, ArrowLeft } from 'lucide-react';

export default function Layout({ children, toastMessage, currentUser = { name: 'Dr. Kishor S. Kulkarni' } }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract initials for top right avatar
  const getInitials = (name) => {
    if (!name) return 'AP';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Items', path: '/items', icon: List },
    { label: 'Issue', path: '/issue', icon: PlusCircle },
    { label: 'Due', path: '/due', icon: Clock },
    { label: 'People', path: '/people', icon: Users },
  ];

  const isHome = location.pathname === '/';

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#f7f6f3] font-sans antialiased relative overflow-hidden select-none">
      {/* --- Sticky Top App Bar --- */}
      <header className="bg-[#1b4d8f] text-white px-4 pt-3.5 pb-3 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          {!isHome && (
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all"
              aria-label="Back"
            >
              <ArrowLeft size={18} className="text-white" />
            </button>
          )}
          <div>
            <h1 className="text-[16px] font-semibold leading-tight tracking-tight">
              Instrument Register
            </h1>
            <p className="text-[10px] font-mono tracking-wider uppercase text-white/75 mt-0.5">
              APEEG · CBRI ROORKEE
            </p>
          </div>
        </div>
        <div className="w-[30px] h-[30px] rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[11px] font-semibold text-white tracking-wider">
          {getInitials(currentUser.name)}
        </div>
      </header>

      {/* --- Main Screen Scroll Body --- */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-[80px] space-y-4">
        {children}
      </main>

      {/* --- Toast Notification Banner --- */}
      {toastMessage && (
        <div className="absolute bottom-[72px] left-4 right-4 z-30 bg-[#1b1a18] text-white text-[12px] leading-relaxed rounded-xl p-3 shadow-2xl border border-white/10 animate-fade-in flex items-center justify-between">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* --- Fixed Bottom Navigation Bar --- */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-black/10 px-2 py-1.5 flex justify-around items-center z-20 h-[62px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === '/items' && location.pathname.startsWith('/items/'));

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
                isActive ? 'text-[#1b4d8f]' : 'text-[#8b8985]'
              }`}
            >
              <div
                className={`w-[22px] h-[22px] rounded-md flex items-center justify-center transition-all ${
                  isActive ? 'bg-[#dce7f4]' : 'bg-transparent'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
import React from 'react';
import { ShieldCheck, User } from 'lucide-react';

export default function Header({ userPhotoUrl = null }) {
  return (
    <header className="sticky top-0 left-0 right-0 w-full bg-[#1b4d8f] text-white px-4 py-3 flex items-center justify-between shadow-md z-50">
      {/* --- Left Side: Logo & App Title --- */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-wide">
          HandOff
        </span>
      </div>

      {/* --- Right Side: Profile Photo Icon --- */}
      <button 
        className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden hover:bg-white/30 transition-all active:scale-95"
        aria-label="User Profile"
      >
        {userPhotoUrl ? (
          <img 
            src={userPhotoUrl} 
            alt="Profile" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <User className="w-5 h-5 text-white" />
        )}
      </button>
    </header>
  );
}
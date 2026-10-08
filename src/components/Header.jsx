import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, User, LogOut, UserCheck } from 'lucide-react';

export default function Header({ userPhotoUrl = null, user = null, onProfileClick, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      {/* --- Right Side: Profile Photo Icon & Dropdown Popup (Only when user is logged in) --- */}
      {user && (
        <div className="relative" ref={dropdownRef}>
          <button 
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden hover:bg-white/30 transition-all active:scale-95 cursor-pointer focus:outline-none"
            aria-label="User Profile Options"
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

          {/* Popup Option Box */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-[#1b1a18] rounded-2xl shadow-xl border border-gray-200 py-1.5 z-50 animate-fade-in">
              {/* Optional User Info Header */}
              {user?.name && (
                <div className="px-3.5 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-[#1b1a18] truncate">{user.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                </div>
              )}

              {/* Option 1: Profile Screen */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onProfileClick) onProfileClick();
                }}
                className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <UserCheck size={16} className="text-[#1b4d8f]" />
                <span>Profile</span>
              </button>

              {/* Option 2: Logout */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-[#c92a2a] hover:bg-red-50 flex items-center gap-2.5 transition-colors border-t border-gray-100 cursor-pointer"
              >
                <LogOut size={16} className="text-[#c92a2a]" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { Package, UserCircle, LogOut, UserCheck, AlertCircle } from 'lucide-react';
import { SERVER_BASE_URL } from "../api/config";
import appLogo from '../assets/whitelogo.png';

export default function Header({ userPhotoUrl = null, user = null, onProfileClick, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef(null);
  // const BASE_URL = 'http://192.168.1.34:8080'; 

  // Helper to format full image URL
  const getPhotoSrc = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${SERVER_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
  };

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

  // Intercept logout click to show modal
  const handleLogoutClick = () => {
    setIsOpen(false);
    setShowLogoutConfirm(true);
  };

  // Confirmed logout execution
  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 w-full bg-[#1b4d8f] text-white px-3.5 py-2 flex items-center justify-between shadow-md z-50 border-none outline-none overflow-visible min-h-14">
      {/* --- Left Side: Logo Icon & App Title --- */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shadow-xs shrink-0">
          {/* <Package className="w-4 h-4 text-white" /> */}
          <img  
            src={appLogo} 
            alt="CSIR Yantra Drishti Logo" 
            className="w-full h-full object-contain rounded-lg"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-md font-bold tracking-wide leading-tight">
            CSIR - Yantra Drishti
          </span>
          <span className="text-[10.5px] font-mono tracking-wider uppercase text-white/70">
            Instrument Management System
          </span>
        </div>
      </div>

      {/* --- Right Side: Profile Photo Icon & Popup (When user is logged in) --- */}
      {user && (
        <div className="relative shrink-0" ref={dropdownRef}>
          <button 
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden hover:bg-white/30 transition-all active:scale-95 cursor-pointer focus:outline-none shadow-xs"
            aria-label="User Profile Options"
          >
            {userPhotoUrl ? (
              <img 
                src={getPhotoSrc(userPhotoUrl)} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <UserCircle className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Popup Menu */}
          {isOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white text-[#1b1a18] rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-fade-in">
              {user?.name && (
                <div className="px-3.5 py-2 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                  <p className="text-xs font-bold text-[#1b1a18] truncate">{user.name}</p>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{user.email}</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onProfileClick) onProfileClick();
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100/80 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <UserCheck size={15} className="text-[#1b4d8f]" />
                <span>Profile</span>
              </button>

              <button
                type="button"
                onClick={handleLogoutClick}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#c92a2a] hover:bg-red-50 flex items-center gap-2.5 transition-colors border-t border-gray-100 cursor-pointer"
              >
                <LogOut size={15} className="text-[#c92a2a]" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- Logout Confirmation Modal --- */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-100 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-4 max-w-xs w-full shadow-2xl border border-gray-200 space-y-2.5 text-[#1b1a18]">
            <div className="flex items-center gap-2 text-[#1b4d8f]">
              <AlertCircle size={18} className="shrink-0 text-[#1b4d8f]" />
              <h3 className="text-xs font-bold text-[#1b1a18]">
                Confirm Sign Out
              </h3>
            </div>

            <p className="text-[11px] text-[#5d5b56] leading-relaxed">
              Are you sure you want to sign out of your account?
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-1.5 rounded-xl text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-98 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-98 transition-all shadow-xs cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
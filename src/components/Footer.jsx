import React from 'react';
import { Home, List, PlusCircle, Users, User } from 'lucide-react';

export default function Footer({ currentTab = 'Home', onTabChange }) {
  const tabs = [
    { id: 'Home', label: 'Home', icon: Home },
    { id: 'Items', label: 'Items', icon: List },
    { id: 'Issue', label: 'Issue', icon: PlusCircle },
    { id: 'People', label: 'People', icon: Users },
    { id: 'Profile', label: 'Profile', icon: User },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 py-1.5 px-3 shadow-lg z-50 h-[62px]">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange && onTabChange(tab.id)}
              className="flex flex-col items-center justify-center flex-1 focus:outline-none transition-all group"
            >
              {/* Icon Container Box with Active Pill Highlight */}
              <div
                className={`w-9 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? ' text-[#1b4d8f] scale-105'
                    : 'bg-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  fill={isActive ? 'currentColor' : 'none'}
                  className="transition-all duration-200"
                />
              </div>

              {/* Label */}
              <span
                className={`text-[10px] mt-0.5 transition-all ${
                  isActive
                    ? 'text-[#1b4d8f] font-bold'
                    : 'text-gray-500 font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </footer>
  );
}
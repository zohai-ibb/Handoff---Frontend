import React from 'react';
import { Home, List, PlusCircle, Clock, Users } from 'lucide-react';

export default function Footer({ currentTab = 'Home', onTabChange }) {
  const tabs = [
    { id: 'Home', label: 'Home', icon: Home },
    { id: 'Items', label: 'Items', icon: List },
    { id: 'Issue', label: 'Issue', icon: PlusCircle },
    { id: 'Due', label: 'Due', icon: Clock },
    { id: 'People', label: 'People', icon: Users },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 py-2 px-4 shadow-lg z-50">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange && onTabChange(tab.id)}
              className="flex flex-col items-center justify-center flex-1 focus:outline-none"
            >
              {/* Outer Checkbox / Rounded Box */}
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-[#dce7f4] border-2 border-[#1b4d8f]'
                    : 'bg-white border-2 border-gray-400'
                }`}
              >
                {/* Checkbox Inner Mark / Icon */}
                <span
                  className={`text-xs font-bold ${
                    isActive ? 'text-[#1b4d8f]' : 'text-transparent'
                  }`}
                >
                  ✓
                </span>
              </div>

              {/* Label */}
              <span
                className={`text-[11px] mt-1 font-medium ${
                  isActive ? 'text-[#1b4d8f] font-bold' : 'text-gray-600'
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
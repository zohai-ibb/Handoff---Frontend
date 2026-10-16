import React from 'react';
import { Home, List, QrCode, Users, User } from 'lucide-react';

export default function Footer({ currentTab = 'Home', onTabChange }) {
  const tabs = [
    { id: 'Home', label: 'Home', icon: Home },
    { id: 'Items', label: 'Items', icon: List },
    { id: 'Issue', label: 'Issue', icon: QrCode, isPrimary: true },
    { id: 'People', label: 'People', icon: Users },
    { id: 'Profile', label: 'Profile', icon: User },
  ];

  return (
    <footer
      className="
        fixed bottom-0 left-0 right-0 w-full
        bg-white/95 backdrop-blur-md
        px-3 shadow-lg z-50 h-[56px]
      "
    >
      {/* Top border with curved QR notch */}
      <div className="absolute top-0 left-0 right-0 h-[18px] pointer-events-none">

        {/* Left straight line */}
        <div
          className="
            absolute left-0 top-0
            h-px bg-gray-200/80
            w-[calc(50%-34px)]
          "
        />

        {/* Right straight line */}
        <div
          className="
            absolute right-0 top-0
            h-px bg-gray-200/80
            w-[calc(50%-34px)]
          "
        />

        {/* Curved section above QR */}
        <div
          className="
            absolute left-1/2 top-0
            -translate-x-1/2
            w-[68px] h-[21px]
            bg-white/95
            border-t border-gray-200/80
            rounded-t-full
          "
        />
      </div>

      <div className="max-w-md mx-auto flex items-center justify-between h-full relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          {/* QR / Issue button */}
          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange && onTabChange(tab.id)}
                className="
                  flex flex-col items-center justify-center
                  flex-1 focus:outline-none
                  -mt-4 group relative z-20
                "
              >
                {/* White separation around QR button */}
                <div
                  className="
                    absolute -top-2
                    w-[58px] h-[58px]
                    bg-white/95
                    rounded-full
                    -z-10
                  "
                />

                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
                    isActive
                      ? 'bg-[#1b4d8f] text-white ring-4 ring-[#dce7f4] scale-105'
                      : 'bg-[#1b4d8f] text-white hover:bg-[#153e75] active:scale-95'
                  }`}
                >
                  <Icon size={22} strokeWidth={2.2} />
                </div>

                <span
                  className={`text-[9px] mt-1 transition-all ${
                    isActive
                      ? 'text-[#1b4d8f] font-bold'
                      : 'text-gray-500 font-medium'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          {/* Standard navigation buttons */}
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange && onTabChange(tab.id)}
              className="
                flex flex-col items-center justify-center
                flex-1 focus:outline-none
                transition-all group
              "
            >
              <div
                className={`w-8 h-6 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-[#dce7f4] text-[#1b4d8f]'
                    : 'bg-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  fill={isActive ? 'currentColor' : 'none'}
                  className="transition-all duration-200"
                />
              </div>

              <span
                className={`text-[9px] mt-0.5 transition-all ${
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

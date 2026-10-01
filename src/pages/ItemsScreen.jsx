import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

export default function ItemsScreen({ onSelectInstrument }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Static mock inventory data matching CSIR-CBRI APEEG specs
  const [instruments] = useState([
    {
      id: 'inst_1',
      assetId: 'CBRI/APEEG/0121',
      name: 'Fluke 1736 Three-Phase Power Logger',
      make: 'Fluke',
      status: 'ISSUED',
      holder: 'Ankit Rawat',
      dueDate: '12 Sept',
      isOverdue: false,
    },
    {
      id: 'inst_2',
      assetId: 'CBRI/APEEG/0088',
      name: 'Hukseflux HFP01 Heat Flux Sensor Set',
      make: 'Hukseflux',
      status: 'OVERDUE',
      holder: 'Priya Nautiyal',
      dueDate: '04 Sept',
      daysLate: 5,
      isOverdue: true,
    },
    {
      id: 'inst_3',
      assetId: 'CBRI/APEEG/0143',
      name: 'Testo 872 Thermal Imager',
      make: 'Testo',
      status: 'AVAILABLE',
      location: 'Energy Lab, Cabinet 4',
    },
    {
      id: 'inst_4',
      assetId: 'CBRI/APEEG/0054',
      name: 'LI-COR LI-250A Light Meter',
      make: 'LI-COR',
      status: 'MAINTENANCE',
      location: 'With vendor, Dehradun',
    },
    {
      id: 'inst_5',
      assetId: 'CBRI/APEEG/0210',
      name: 'HOBO MX1101 Temp/RH Loggers (set of 12)',
      make: 'Onset',
      status: 'AVAILABLE',
      location: 'Envelope Lab, Drawer 1',
    },
    {
      id: 'inst_6',
      assetId: 'CBRI/APEEG/0177',
      name: 'Kimo DBM 610 Air Flow Meter',
      make: 'Kimo',
      status: 'ISSUED',
      holder: 'Saurabh Joshi',
      dueDate: '28 Sept',
      isOverdue: false,
    },
  ]);

  const filterPills = ['All', 'Available', 'Issued', 'Overdue', 'Service'];

  // Search and Filter Logic
  const filteredInstruments = useMemo(() => {
    return instruments.filter((item) => {
      // 1. Text Search matching name, assetId, or make
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.assetId.toLowerCase().includes(query) ||
        item.make.toLowerCase().includes(query) ||
        (item.holder && item.holder.toLowerCase().includes(query));

      // 2. Status Pill Filter
      let matchesFilter = true;
      if (activeFilter === 'Available') {
        matchesFilter = item.status === 'AVAILABLE';
      } else if (activeFilter === 'Issued') {
        matchesFilter = item.status === 'ISSUED';
      } else if (activeFilter === 'Overdue') {
        matchesFilter = item.status === 'OVERDUE' || item.isOverdue;
      } else if (activeFilter === 'Service') {
        matchesFilter = item.status === 'MAINTENANCE' || item.status === 'CALIBRATION_DUE';
      }

      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter, instruments]);

  // Helper for Status Pill Colors
  const getStatusBadge = (status, isOverdue) => {
    if (isOverdue || status === 'OVERDUE') {
      return (
        <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-[#fcf2f2] text-[#c92a2a] border border-[#f5c2c2]">
          Overdue
        </span>
      );
    }
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-[#eef8f5] text-[#12695a] border border-[#c3e6df]">
            Available
          </span>
        );
      case 'ISSUED':
        return (
          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-[#fef8ee] text-[#8a5a12] border border-[#f7e4c3]">
            Issued
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-[#f3f0f8] text-[#5c4a86] border border-[#dcd4eb]">
            Maintenance
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden font-sans text-[#1b1a18]">
      {/* --- Top Fixed Header Controls --- */}
      <div className="shrink-0 space-y-2.5 pb-2">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, asset ID or holder"
            className="w-full bg-white text-[13px] py-2.5 pl-3.5 pr-9 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f] shadow-xs"
          />
          <Search size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {filterPills.map((pill) => {
            const isSelected = activeFilter === pill;
            return (
              <button
                key={pill}
                onClick={() => setActiveFilter(pill)}
                className={`text-[11.5px] font-medium px-3 py-1 rounded-full whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#1b4d8f] text-white border border-[#1b4d8f]'
                    : 'bg-white text-[#3f3d39] border border-black/15 hover:border-gray-400'
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>

        {/* Result Count Indicator */}
        <div className="text-[11.5px] text-[#7a7872] px-0.5">
          {filteredInstruments.length} of {instruments.length} instruments
        </div>
      </div>

      {/* --- Middle Scrollable Item List --- */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filteredInstruments.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectInstrument && onSelectInstrument(item)}
            className="bg-white p-3.5 rounded-2xl border border-black/10 hover:border-[#1b4d8f] transition-all cursor-pointer active:scale-99 shadow-xs space-y-1"
          >
            {/* Row Header: Name & Status */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[13.5px] font-semibold text-[#1b1a18] leading-snug">
                {item.name}
              </h3>
              <div className="shrink-0">{getStatusBadge(item.status, item.isOverdue)}</div>
            </div>

            {/* Asset ID & Make */}
            <div className="font-mono text-[10.5px] text-[#7a7872]">
              {item.assetId} · {item.make}
            </div>

            {/* Context Line */}
            <div className="text-[12px] text-[#5d5b56] pt-0.5">
              {item.status === 'OVERDUE' || item.isOverdue ? (
                <span>
                  {item.holder} · due {item.dueDate}, {item.daysLate} days late
                </span>
              ) : item.status === 'ISSUED' ? (
                <span>
                  {item.holder} · return by {item.dueDate}
                </span>
              ) : item.status === 'MAINTENANCE' ? (
                <span>Out for repair / calibration · {item.location}</span>
              ) : (
                <span>{item.location}</span>
              )}
            </div>
          </div>
        ))}

        {filteredInstruments.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-xs">
            No instruments found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
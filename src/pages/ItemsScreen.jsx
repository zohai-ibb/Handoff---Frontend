import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Image as ImageIcon } from 'lucide-react';
import { getInstruments, getActiveIssueRecords } from '../api/instrumentService';
import { isRecordOverdue } from '../utils/dateUtils';

export default function ItemsScreen({ onNavigate, onSelectInstrument }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [instruments, setInstruments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInventoryAndLoans = async () => {
      try {
        setIsLoading(true);
        const [instData, recordsData] = await Promise.all([
          getInstruments(),
          getActiveIssueRecords(),
        ]);

        const rawInstruments = instData || [];
        const activeLoans = recordsData || [];

        const mappedInstruments = rawInstruments.map((item) => {
          const itemId = item.id || item._id;

          const activeRecord = activeLoans.find((record) => {
            const recordInstId =
              record.instrument?.id || record.instrument?._id || record.instrument;
            return (
              recordInstId === itemId &&
              (record.state === 'OPEN' || record.state === 'ISSUED' || !record.state)
            );
          });

          if (activeRecord) {
            const overdue = isRecordOverdue(activeRecord);

            const borrowerName =
              activeRecord.borrowerScientist?.name ||
              activeRecord.borrower_scientist?.name ||
              activeRecord.staffName ||
              activeRecord.staff_name ||
              'Borrower';

            return {
              ...item,
              status: overdue ? 'OVERDUE' : 'ISSUED',
              isOverdue: overdue,
              dueDate: activeRecord.dueDate || activeRecord.due_date,
              holder: borrowerName,
            };
          }

          return item;
        });

        setInstruments(mappedInstruments);
      } catch (err) {
        setError('Failed to load instrument inventory from server.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventoryAndLoans();
  }, []);

  const filterPills = ['All', 'Available', 'Issued', 'Overdue', 'Service'];

  const filteredInstruments = useMemo(() => {
    return instruments.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        item.assetId?.toLowerCase().includes(query) ||
        item.asset_id?.toLowerCase().includes(query) ||
        item.make?.toLowerCase().includes(query) ||
        item.holder?.toLowerCase().includes(query);

      const isOverdueItem = item.status === 'OVERDUE' || item.isOverdue;

      let matchesFilter = true;
      if (activeFilter === 'Available') {
        matchesFilter = item.status === 'AVAILABLE';
      } else if (activeFilter === 'Issued') {
        matchesFilter = item.status === 'ISSUED' && !isOverdueItem;
      } else if (activeFilter === 'Overdue') {
        matchesFilter = isOverdueItem;
      } else if (activeFilter === 'Service') {
        matchesFilter = item.status === 'MAINTENANCE';
      }

      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter, instruments]);

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden font-sans text-[#1b1a18] relative">
      {/* Search & Filter Header */}
      <div className="shrink-0 space-y-2.5 pb-2">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, asset ID or make"
            className="w-full bg-white text-[13px] py-2.5 pl-3.5 pr-9 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f] shadow-xs"
          />
          <Search size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {filterPills.map((pill) => {
            const isSelected = activeFilter === pill;
            return (
              <button
                key={pill}
                onClick={() => setActiveFilter(pill)}
                className={`text-[11.5px] font-medium px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
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

        <div className="text-[11.5px] text-[#7a7872] px-0.5">
          {filteredInstruments.length} of {instruments.length} instruments
        </div>
      </div>

      {/* Inventory Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar pb-16">
        {error && (
          <div className="bg-[#fcf2f2] text-[#c92a2a] text-[11.5px] p-2.5 rounded-xl border border-[#f5c2c2]">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-xs text-gray-400 py-2">Loading inventory...</p>
        ) : (
          filteredInstruments.map((item) => {
            const isOverdueItem = item.status === 'OVERDUE' || item.isOverdue;
            const assetIdDisplay = item.assetId || item.asset_id || 'N/A';
            const photoPath = item.photoPath || item.photo_path;
            const photoUrl = photoPath
              ? photoPath.startsWith('http')
                ? photoPath
                : `http://localhost:8080${photoPath}`
              : null;

            return (
              <div
                key={item.id || item._id}
                onClick={() => onSelectInstrument && onSelectInstrument(item)}
                className={`bg-white p-3 rounded-2xl border shadow-xs cursor-pointer hover:border-[#1b4d8f] active:scale-98 transition-all flex items-center gap-3 ${
                  isOverdueItem ? 'border-[#f5c2c2]' : 'border-black/10'
                }`}
              >
                {/* Left Side: Photo Thumbnail */}
                <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-xl overflow-hidden border border-black/10 flex items-center justify-center">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={22} className="text-gray-400" />
                  )}
                </div>

                {/* Right Side: Card Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-1.5">
                    <h3 className="text-[13px] font-bold text-[#1b1a18] leading-snug truncate">
                      {item.name}
                    </h3>
                    <span
                      className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        isOverdueItem
                          ? 'bg-[#fbe4e0] text-[#8f2318] border border-[#f5c2c2]'
                          : item.status === 'ISSUED'
                          ? 'bg-[#fbf0dc] text-[#8a5a12]'
                          : item.status === 'MAINTENANCE'
                          ? 'bg-[#f3f0f8] text-[#5c4a86]'
                          : 'bg-[#eef8f5] text-[#12695a]'
                      }`}
                    >
                      {isOverdueItem
                        ? 'OVERDUE'
                        : item.status === 'ISSUED'
                        ? 'Issued'
                        : item.status === 'MAINTENANCE'
                        ? 'Maintenance'
                        : 'Available'}
                    </span>
                  </div>

                  <div className="font-mono text-[10.5px] text-[#7a7872] truncate">
                    Asset ID: {assetIdDisplay}
                  </div>

                  <div className="text-[11.5px] text-[#5d5b56] truncate">
                    {isOverdueItem ? (
                      <span className="text-[#c92a2a] font-bold">
                        {item.holder} · Due: {item.dueDate}
                      </span>
                    ) : item.status === 'ISSUED' ? (
                      <span>
                        {item.holder} · Due: {item.dueDate}
                      </span>
                    ) : item.status === 'MAINTENANCE' ? (
                      <span>Out for repair / calibration</span>
                    ) : (
                      <span>Location: {item.location || 'Storage'}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {!isLoading && filteredInstruments.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-xs">
            No instruments found matching your query.
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => onNavigate && onNavigate('Add item')}
        aria-label="Add Instrument"
        className="fixed bottom-20 right-5 z-40 bg-[#1b4d8f] hover:bg-[#143d73] text-white p-3.5 rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-white/20"
      >
        <Plus size={22} className="stroke-[2.5]" />
      </button>
    </div>
  );
}
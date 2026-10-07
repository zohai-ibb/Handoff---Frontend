import React, { useState, useEffect } from 'react';
import { getInstruments, getActiveIssueRecords } from '../api/instrumentService';
import { isRecordOverdue } from '../utils/dateUtils';

export default function HomeScreen({ onNavigate }) {
  const [instruments, setInstruments] = useState([]);
  const [issueRecords, setIssueRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [instData, recordsData] = await Promise.all([
          getInstruments(),
          getActiveIssueRecords(),
        ]);

        if (isMounted) {
          // Filter issueRecords to only include OPEN loans
          const openRecords = (recordsData || []).filter(
            (r) => r.state === 'OPEN' || r.state === 'ISSUED' || !r.state
          );
          setInstruments(instData || []);
          setIssueRecords(openRecords);
        }
      } catch (err) {
        if (isMounted) setError('Failed to load dashboard metrics from server.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Available instruments count (from user's owned inventory)
  const availableCount = instruments.filter((i) => i.status === 'AVAILABLE').length;

  // 2. Maintenance instruments count
  const maintenanceCount = instruments.filter((i) => i.status === 'MAINTENANCE').length;

  // 3. Overdue count from open issue records
  const overdueCount = issueRecords.filter((r) => isRecordOverdue(r)).length;

  // 4. Total items marked ISSUED in instrument inventory
  const totalDbIssuedCount = instruments.filter((i) => i.status === 'ISSUED').length;

  // 5. On-time Issued count = Total ISSUED minus Overdue (Prevents double counting)
  const issuedCount = Math.max(0, totalDbIssuedCount - overdueCount);

  return (
    <div className="space-y-4 font-sans text-[#1b1a18]">
      {/* 4 Stat Tiles Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div
          onClick={() => onNavigate && onNavigate('Items')}
          className="bg-white p-3.5 rounded-2xl border border-black/10 cursor-pointer active:scale-98 transition-all shadow-xs"
        >
          <div className="text-2xl font-bold text-[#12695a]">
            {isLoading ? '...' : availableCount}
          </div>
          <div className="text-[12px] text-[#5d5b56] mt-1">Available</div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate('Due')}
          className="bg-white p-3.5 rounded-2xl border border-black/10 cursor-pointer active:scale-98 transition-all shadow-xs"
        >
          <div className="text-2xl font-bold text-[#8a5a12]">
            {isLoading ? '...' : issuedCount}
          </div>
          <div className="text-[12px] text-[#5d5b56] mt-1">Issued / in use</div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate('Due')}
          className="bg-white p-3.5 rounded-2xl border border-black/10 cursor-pointer active:scale-98 transition-all shadow-xs"
        >
          <div className="text-2xl font-bold text-[#8f2318]">
            {isLoading ? '...' : overdueCount}
          </div>
          <div className="text-[12px] text-[#5d5b56] mt-1">Overdue</div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate('Items')}
          className="bg-white p-3.5 rounded-2xl border border-black/10 cursor-pointer active:scale-98 transition-all shadow-xs"
        >
          <div className="text-2xl font-bold text-[#5c4a86]">
            {isLoading ? '...' : maintenanceCount}
          </div>
          <div className="text-[12px] text-[#5d5b56] mt-1">Maintenance</div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="flex gap-2.5 pt-1">
        <button
          onClick={() => onNavigate && onNavigate('Issue')}
          className="flex-1 bg-[#1b4d8f] text-white py-2.5 px-2 rounded-xl text-[13px] font-semibold shadow-xs active:scale-95 transition-all text-center"
        >
          Issue
        </button>
        <button
          onClick={() => onNavigate && onNavigate('Receive')}
          className="flex-1 bg-white text-[#1b1a18] border border-gray-300 py-2.5 px-2 rounded-xl text-[13px] font-medium shadow-xs active:scale-95 transition-all text-center"
        >
          Receive
        </button>
        <button
          onClick={() => onNavigate && onNavigate('Add item')}
          className="flex-1 bg-white text-[#1b1a18] border border-gray-300 py-2.5 px-2 rounded-xl text-[13px] font-medium shadow-xs active:scale-95 transition-all text-center"
        >
          Add Item
        </button>
      </div>

      {/* Currently Out List Section */}
      <div className="pt-2 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[#5d5b56] uppercase">
            CURRENTLY OUT ({issueRecords.length})
          </span>
          <button
            onClick={() => onNavigate && onNavigate('Items')}
            className="text-[12px] text-[#1b4d8f] hover:underline"
          >
            All instruments
          </button>
        </div>

        {error && (
          <div className="bg-[#fcf2f2] text-[#c92a2a] text-[11.5px] p-2.5 rounded-xl border border-[#f5c2c2]">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-xs text-gray-400 py-2">Loading active records...</p>
        ) : issueRecords.length === 0 ? (
          <div className="bg-white p-4 rounded-2xl border border-black/10 text-center text-xs text-gray-400">
            No instruments are currently issued out.
          </div>
        ) : (
          issueRecords.map((record) => {
            const overdue = isRecordOverdue(record);
            const dateDisplay = record.dueDate || record.due_date || 'N/A';

            return (
              <div
                key={record.id || record._id}
                className={`p-3.5 rounded-2xl border shadow-xs flex items-start justify-between bg-white transition-all ${
                  overdue ? 'border-[#f5c2c2]' : 'border-black/10'
                }`}
              >
                <div className="space-y-1 max-w-[72%]">
                  <h4 className="text-[13.5px] font-semibold text-[#1b1a18]">
                    {record.instrument?.name || 'Instrument'}
                  </h4>
                  <div className="font-mono text-[11px] text-[#7a7872]">
                    {record.instrument?.assetId || record.instrument?.asset_id || 'N/A'}
                  </div>
                  <div className="text-[12px] text-[#5d5b56]">
                    <span className="font-medium">
                      {record.borrowerScientist?.name || record.staffName || 'Borrower'}
                    </span>{' '}
                    · {overdue ? `due ${dateDisplay} (OVERDUE)` : `return by ${dateDisplay}`}
                  </div>
                </div>

                <div className="shrink-0 mt-0.5">
                  {overdue ? (
                    <span className="bg-[#fbe4e0] text-[#8f2318] text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#f5c2c2]">
                      Overdue
                    </span>
                  ) : (
                    <span className="bg-[#fbf0dc] text-[#8a5a12] text-[11px] font-medium px-2.5 py-1 rounded-md">
                      Issued
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
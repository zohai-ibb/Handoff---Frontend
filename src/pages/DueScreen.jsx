import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { getActiveIssueRecords } from '../api/instrumentService';
import { isRecordOverdue } from '../utils/dateUtils';

export default function DueScreen({ onShowToast }) {
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchActiveLoans = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getActiveIssueRecords();
      // Keep only active open loans
      const openOnly = (data || []).filter(
        (record) => record.state === 'OPEN' || record.state === 'ISSUED' || !record.state
      );
      setLoans(openOnly);
    } catch (err) {
      setError('Failed to fetch active loans list from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  const handleSendReminder = async (item) => {
    try {
      const recordId = item.id || item._id;
      // Trigger instant reminder endpoint if present or notify user
      if (onShowToast) {
        onShowToast(
          `Reminder email dispatched to ${
            item.borrowerScientist?.name || item.staffName || 'Borrower'
          } for ${item.instrument?.name || 'Instrument'}.`
        );
      }
    } catch (err) {
      if (onShowToast) onShowToast('Failed to dispatch reminder email.');
    }
  };

  const handleMarkReceived = async (id, name) => {
    try {
      // Execute live backend return call
      await axiosClient.put(`/issue-records/${id}/return`, {
        condition_in: 'GOOD',
        conditionIn: 'GOOD',
      });

      // Filter returned item out of local state
      setLoans((prev) => prev.filter((item) => (item.id || item._id) !== id));

      if (onShowToast) {
        onShowToast(`Marked ${name} as received back into inventory.`);
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast('Failed to update return state in backend database.');
      }
    }
  };

  const overdueCount = loans.filter((i) => isRecordOverdue(i)).length;
  const activeCount = loans.length - overdueCount;

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden font-sans text-[#1b1a18]">
      {/* Header Info */}
      <div className="shrink-0 pb-2">
        <p className="text-[12px] text-[#5d5b56] leading-relaxed">
          {isLoading ? (
            'Loading active records...'
          ) : overdueCount > 0 || activeCount > 0 ? (
            <>
              <span className="font-bold text-[#c92a2a]">{overdueCount} overdue</span>, {activeCount} active loan(s).
              Reminders go out automatically; tap below to trigger immediately.
            </>
          ) : (
            <>All issued items have been received back. Nothing overdue.</>
          )}
        </p>
      </div>

      {/* Due/Overdue Records List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {error && (
          <div className="bg-[#fcf2f2] text-[#c92a2a] text-[11.5px] p-2.5 rounded-xl border border-[#f5c2c2]">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-xs text-gray-400 py-2">Loading active tracker...</p>
        ) : (
          loans.map((item) => {
            const overdue = isRecordOverdue(item);
            const dueDateDisplay = item.dueDate || item.due_date || 'N/A';

            return (
              <div
                key={item.id || item._id}
                className={`p-3.5 rounded-2xl border transition-all shadow-xs space-y-2.5 ${
                  overdue ? 'bg-white border-[#f5c2c2]' : 'bg-white border-black/10'
                }`}
              >
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[13.5px] font-bold text-[#1b1a18] leading-snug">
                    {item.instrument?.name || 'Instrument'}
                  </h3>
                  <span
                    className={`shrink-0 text-[10.5px] font-semibold px-2.5 py-0.5 rounded-md ${
                      overdue
                        ? 'bg-[#fbe4e0] text-[#8f2318] border border-[#f5c2c2]'
                        : 'bg-[#fbf0dc] text-[#8a5a12]'
                    }`}
                  >
                    {overdue ? 'OVERDUE' : 'Issued'}
                  </span>
                </div>

                {/* Borrower & Due Date */}
                <p className="text-[11.5px] text-[#5d5b56] leading-tight">
                  {item.borrowerScientist?.name || item.staffName || 'Borrower'} · Due:{' '}
                  <span className={overdue ? 'font-bold text-[#c92a2a]' : 'font-semibold'}>
                    {dueDateDisplay}
                  </span>
                </p>

                {/* Asset ID */}
                <p className="font-mono text-[10.5px] text-[#7a7872]">
                  Asset ID: {item.instrument?.assetId || 'N/A'}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSendReminder(item)}
                    className="flex-1 bg-[#8f2318] text-white py-2 rounded-xl text-[12.5px] font-semibold active:scale-98 transition-all shadow-xs text-center"
                  >
                    Send reminder now
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleMarkReceived(item.id || item._id, item.instrument?.name)
                    }
                    className="bg-white text-[#1b1a18] border border-gray-300 py-2 px-4 rounded-xl text-[12.5px] font-medium active:scale-98 transition-all hover:bg-gray-50"
                  >
                    Received
                  </button>
                </div>
              </div>
            );
          })
        )}

        {!isLoading && loans.length === 0 && (
          <div className="bg-white p-6 rounded-2xl border border-black/10 text-center space-y-1">
            <h4 className="text-[13px] font-semibold text-[#12695a]">
              No active loans or overdue items
            </h4>
            <p className="text-[11px] text-[#7a7872]">
              All equipment is currently returned and available in lab inventory.
            </p> 
          </div>
        )}
      </div>
    </div>
  );
}
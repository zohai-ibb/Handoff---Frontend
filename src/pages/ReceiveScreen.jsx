import React, { useState } from 'react';
import { CheckCircle2, FileText, ArrowLeft, X } from 'lucide-react';

export default function ReceiveScreen({ onBack, onShowToast }) {
  // Mock active loans (state === 'OPEN') matching your backend IssueRecord models
  const [issuedRecords, setIssuedRecords] = useState([
    {
      id: '65f3c4d5e6f7a8b9c0d1e2f1',
      name: 'Fluke 1736 Three-Phase Power Logger',
      assetId: 'CBRI/APEEG/0121',
      holder: 'Ankit Rawat',
      context: 'return by 12 Sept',
      status: 'Issued',
      statusType: 'issued',
    },
    {
      id: '65f3c4d5e6f7a8b9c0d1e2f2',
      name: 'Hukseflux HFP01 Heat Flux Sensor Set',
      assetId: 'CBRI/APEEG/0088',
      holder: 'Priya Nautiyal',
      context: 'due 04 Sept, 5 days late',
      status: 'Overdue',
      statusType: 'overdue',
    },
    {
      id: '65f3c4d5e6f7a8b9c0d1e2f3',
      name: 'Kimo DBM 610 Air Flow Meter',
      assetId: 'CBRI/APEEG/0177',
      holder: 'Saurabh Joshi',
      context: 'return by 20 Sept',
      status: 'Issued',
      statusType: 'issued',
    },
    {
      id: '65f3c4d5e6f7a8b9c0d1e2f4',
      name: 'Testo 405i Hot-Wire Anemometer',
      assetId: 'CBRI/APEEG/0210',
      holder: 'Ankit Rawat',
      context: 'return by 10 Sept',
      status: 'Issued',
      statusType: 'issued',
    },
  ]);

  // Selected item state for the condition modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [conditionIn, setConditionIn] = useState('Returned intact, cleaned and functioning normally');

  const handleOpenReturnModal = (record) => {
    setSelectedRecord(record);
    setConditionIn('Returned intact, cleaned and functioning normally');
  };

  const handleConfirmReturn = () => {
    if (!selectedRecord) return;

    // Filter out returned item from open loans
    setIssuedRecords((prev) => prev.filter((item) => item.id !== selectedRecord.id));

    // Display confirmation toast
    if (onShowToast) {
      onShowToast(
        `Received back. Acknowledgement mailed to ${selectedRecord.holder}, the scientist, and Group Head.`
      );
    }

    setSelectedRecord(null);
  };

  return (
    <div className="space-y-3.5 font-sans text-[#1b1a18]">
      {/* --- Intro Subheader --- */}
      <div className="flex items-center gap-2 mb-1">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-black/5 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} className="text-[#1b4d8f]" />
        </button>
        <h2 className="text-base font-bold text-[#1b4d8f]">Receive back</h2>
      </div>

      <p className="text-[12.5px] leading-relaxed text-[#5d5b56]">
        Receiving an instrument closes the issue, records the condition and mails an acknowledgement to the holder, their scientist and the Group Head.
      </p>

      {/* --- Issued Items List --- */}
      <div className="space-y-3">
        {issuedRecords.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-black/10 text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-800">No active checkouts</h3>
            <p className="text-xs text-gray-500">All instruments are currently checked in.</p>
          </div>
        ) : (
          issuedRecords.map((item) => (
            <div
              key={item.id}
              className="bg-white p-3.5 rounded-2xl border border-black/10 space-y-3 shadow-xs"
            >
              {/* Header: Title & Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <h3 className="text-[13.5px] font-semibold text-[#1b1a18] leading-snug">
                    {item.name}
                  </h3>
                  <div className="text-[12px] text-[#5d5b56]">
                    <span className="font-medium text-[#3f3d39]">{item.holder}</span> · {item.context}
                  </div>
                </div>

                <div className="shrink-0 mt-0.5">
                  {item.statusType === 'issued' ? (
                    <span className="bg-[#fbf0dc] text-[#8a5a12] text-[11px] font-medium px-2.5 py-1 rounded-md">
                      Issued
                    </span>
                  ) : (
                    <span className="bg-[#fbe4e0] text-[#8f2318] text-[11px] font-medium px-2.5 py-1 rounded-md">
                      Overdue
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={() => handleOpenReturnModal(item)}
                  className="flex-1 bg-[#1b4d8f] text-white py-2 px-3 rounded-xl text-[13px] font-semibold active:scale-98 transition-all shadow-xs text-center"
                >
                  Mark returned
                </button>
                <button
                  onClick={() => onShowToast && onShowToast(`Opened ${item.name} details.`)}
                  className="bg-white text-[#1b1a18] border border-gray-300 py-2 px-4 rounded-xl text-[13px] font-medium active:scale-98 transition-all text-center"
                >
                  Open
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- Return Condition Modal --- */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-4 w-full max-w-sm space-y-3 shadow-2xl border border-black/10 animate-fade-in">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-[#1b1a18]">Record Return Condition</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-700">{selectedRecord.name}</span>
              <p className="text-[11px] text-gray-500">Holder: {selectedRecord.holder}</p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider">
                Condition at Return
              </label>
              <textarea
                value={conditionIn}
                onChange={(e) => setConditionIn(e.target.value)}
                rows={3}
                className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#1b4d8f]"
                placeholder="Specify physical condition upon return..."
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setSelectedRecord(null)}
                className="flex-1 py-2 rounded-xl text-xs font-medium border border-gray-300 text-gray-700 active:scale-98"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#1b4d8f] text-white active:scale-98 shadow-xs"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
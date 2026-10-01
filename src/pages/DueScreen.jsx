import React, { useState } from "react";

export default function DueScreen({ onShowToast }) {
  // Static mock loans matching the CSIR-CBRI APEEG specifications
  const [loans, setLoans] = useState([
    {
      id: "rec_101",
      assetId: "CBRI/APEEG/0088",
      name: "Hukseflux HFP01 Heat Flux Sensor Set",
      borrowerScientist: "Priya Nautiyal",
      ownerScientist: "Dr. Kishor S. Kulkarni",
      dueDate: "04 Sept 2026",
      status: "OVERDUE",
      badgeText: "5 days late",
      subtext: "Auto reminder sent daily since 04 Sept",
    },
    {
      id: "rec_102",
      assetId: "CBRI/APEEG/0145",
      name: "Testo 405i Hot-Wire Anemometer",
      borrowerScientist: "Ankit Rawat",
      ownerScientist: "Dr. Kishor S. Kulkarni",
      dueDate: "10 Sept 2026",
      status: "DUE_SOON",
      badgeText: "Due in 1 days",
      subtext: "Advance notice sent 2 day(s) before due",
    },
  ]);

  // Handle immediate manual reminder trigger
  const handleSendReminder = (item) => {
    if (onShowToast) {
      onShowToast(
        `Reminder email sent to ${item.borrowerScientist} for ${item.name}.`
      );
    }
  };

  // Handle mark received (removes item from active due list)
  const handleMarkReceived = (id, name) => {
    setLoans((prev) => prev.filter((item) => item.id !== id));
    if (onShowToast) {
      onShowToast(`Marked ${name} as received back.`);
    }
  };

  // Dynamic summary counts
  const overdueCount = loans.filter((i) => i.status === "OVERDUE").length;
  const dueSoonCount = loans.filter((i) => i.status === "DUE_SOON").length;

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden font-sans text-[#1b1a18]">
      {/* Top Fixed Header Info */}
      <div className="shrink-0 pb-2">
        <p className="text-[12px] text-[#5d5b56] leading-relaxed">
          {overdueCount > 0 || dueSoonCount > 0 ? (
            <>
              {overdueCount} overdue, {dueSoonCount} due within 2 day(s).
              Reminders are automatic; use the button to chase immediately.
            </>
          ) : (
            <>All issued items have been received back. Nothing overdue.</>
          )}
        </p>
      </div>

      {/* Middle Scrollable Due Items List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {loans.map((item) => {
          const isOverdue = item.status === "OVERDUE";

          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border transition-all shadow-xs space-y-2.5 ${
                isOverdue
                  ? "bg-white border-[#f5c2c2]"
                  : "bg-white border-black/10"
              }`}
            >
              {/* Line 1: Instrument Name & Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[13.5px] font-bold text-[#1b1a18] leading-snug">
                  {item.name}
                </h3>
                <span
                  className={`shrink-0 text-[10.5px] font-semibold px-2.5 py-0.5 rounded-md ${
                    isOverdue
                      ? "bg-[#fbe4e0] text-[#8f2318]"
                      : "bg-[#fbf0dc] text-[#8a5a12]"
                  }`}
                >
                  {item.badgeText}
                </span>
              </div>

              {/* Line 2: Borrower, Owner & Due Date */}
              <p className="text-[11.5px] text-[#5d5b56] leading-tight">
                {item.borrowerScientist} · {item.ownerScientist} · due{" "}
                {item.dueDate}
              </p>

              {/* Line 3: Reminder Subtext */}
              <p className="font-mono text-[10.5px] text-[#7a7872]">
                {item.subtext}
              </p>

              {/* Action Buttons Row */}
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
                  onClick={() => handleMarkReceived(item.id, item.name)}
                  className="bg-white text-[#1b1a18] border border-gray-300 py-2 px-4 rounded-xl text-[12.5px] font-medium active:scale-98 transition-all hover:bg-gray-50"
                >
                  Received
                </button>
              </div>
            </div>
          );
        })}

        {loans.length === 0 && (
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
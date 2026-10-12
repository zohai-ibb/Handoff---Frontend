import React, { useState, useEffect } from "react";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import axiosClient from "../api/axiosClient";
import { getActiveIssueRecords } from "../api/instrumentService";
import { isRecordOverdue } from "../utils/dateUtils";

const PAGE_SIZE = 10;

export default function DueScreen({ onBack, onShowToast }) {
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchActiveLoans = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await getActiveIssueRecords();

      // Filter ONLY open records that are strictly OVERDUE
      const overdueOnly = (data || []).filter((record) => {
        const isOpen =
          record.state === "OPEN" || record.state === "ISSUED" || !record.state;
        return isOpen && isRecordOverdue(record);
      });

      setLoans(overdueOnly);
    } catch (err) {
      setError("Failed to fetch overdue loans list from server.");
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll smoothly to top whenever pagination page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Reset scroll on any internal main container if applicable
    const mainContainer = document.querySelector("main");
    if (mainContainer) {
      mainContainer.scrollTop = 0;
    }
  }, [currentPage]);

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  // Reset page if total records shrink below active page offset
  useEffect(() => {
    const totalPages = Math.ceil(loans.length / PAGE_SIZE) || 1;
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [loans.length, currentPage]);

  const handleSendReminder = async (item) => {
    try {
      const borrowerName =
        item.borrowerScientist?.name ||
        item.borrower_scientist?.name ||
        item.staffName ||
        item.staff_name ||
        "Borrower";

      if (onShowToast) {
        onShowToast(
          `Reminder email dispatched to ${borrowerName} for ${
            item.instrument?.name || "Instrument"
          }.`,
        );
      }
    } catch (err) {
      if (onShowToast) onShowToast("Failed to dispatch reminder email.");
    }
  };

  // Pagination Math
  const totalPages = Math.ceil(loans.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const slicedLoans = loans.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden font-sans text-[#1b1a18]">
      {/* Header Info & Back Button */}
      <div className="shrink-0 pb-2 space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <button
            type="button"
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-black/5 active:scale-95 transition-all focus:outline-none"
            aria-label="Back to Home"
          >
            <ArrowLeft size={18} className="text-[#1b4d8f]" />
          </button>
          <h2 className="text-base font-bold text-[#1b4d8f]">
            Overdue Tracker
          </h2>
        </div>

        <p className="text-[12px] text-[#5d5b56] leading-relaxed">
          {isLoading ? (
            "Loading overdue records..."
          ) : loans.length > 0 ? (
            <>
              <span className="font-bold text-[#c92a2a]">
                {loans.length} overdue item(s)
              </span>{" "}
              require immediate attention. Tap below to trigger reminder.
            </>
          ) : (
            <>
              All issued items are within their return schedules. Nothing
              overdue.
            </>
          )}
        </p>
      </div>

      {/* Overdue Records List Only */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
        {error && (
          <div className="bg-[#fcf2f2] text-[#c92a2a] text-[11.5px] p-2.5 rounded-xl border border-[#f5c2c2]">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-xs text-gray-400 py-2">
            Loading overdue tracker...
          </p>
        ) : loans.length === 0 ? (
          <div className="bg-[#ffffff] p-6 rounded-2xl border border-black/10 text-center space-y-1">
            <h4 className="text-[13px] font-semibold text-[#12695a]">
              No overdue items
            </h4>
            <p className="text-[11px] text-[#7a7872]">
              All issued equipment is within its allowed return date.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {slicedLoans.map((item) => {
                const dueDateDisplay = item.dueDate || item.due_date || "N/A";

                const borrowerName =
                  item.borrowerScientist?.name ||
                  item.borrower_scientist?.name ||
                  item.staffName ||
                  item.staff_name ||
                  "Borrower";

                // Resolve Photo URL
                const photoPath =
                  item.instrument?.photoPath || item.instrument?.photo_path;
                const photoUrl = photoPath
                  ? photoPath.startsWith("http")
                    ? photoPath
                    : `http://localhost:8080${photoPath}`
                  : null;

                return (
                  <div
                    key={item.id || item._id}
                    className="p-3.5 rounded-2xl border transition-all shadow-xs space-y-2.5 bg-white border-[#f5c2c2]"
                  >
                    <div className="flex items-center gap-3">
                      {/* Left Side: Photo Thumbnail */}
                      <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-xl overflow-hidden border border-black/10 flex items-center justify-center">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={item.instrument?.name || "Instrument"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon size={22} className="text-gray-400" />
                        )}
                      </div>

                      {/* Right Side: Card Header & Details */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <h3 className="text-[13.5px] font-bold text-[#1b1a18] leading-snug truncate">
                            {item.instrument?.name || "Instrument"}
                          </h3>
                          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#fbe4e0] text-[#8f2318] border border-[#f5c2c2]">
                            OVERDUE
                          </span>
                        </div>

                        <p className="text-[11.5px] text-[#5d5b56] leading-tight truncate">
                          {borrowerName} · Due:{" "}
                          <span className="font-bold text-[#c92a2a]">
                            {dueDateDisplay}
                          </span>
                        </p>

                        <p className="font-mono text-[10.5px] text-[#7a7872] truncate">
                          Asset ID:{" "}
                          {item.instrument?.assetId ||
                            item.instrument?.asset_id ||
                            "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSendReminder(item)}
                        className="flex-1 bg-[#8f2318] text-white py-2 rounded-xl text-[12.5px] font-semibold active:scale-98 transition-all shadow-xs text-center cursor-pointer"
                      >
                        Send reminder now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-[12px] text-[#5d5b56]">
                <button
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(1, prev - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl font-medium shadow-xs disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
                >
                  Prev
                </button>
                <span className="font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl font-medium shadow-xs disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

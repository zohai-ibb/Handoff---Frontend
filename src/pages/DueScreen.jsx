import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Search, Image as ImageIcon, Calendar, RefreshCw, X, Mail } from "lucide-react";
import axiosClient from "../api/axiosClient";
import { getActiveIssueRecords } from "../api/instrumentService";
import { isRecordOverdue } from "../utils/dateUtils";

const PAGE_SIZE = 5;

export default function DueScreen({ onBack, onShowToast }) {
  const [loans, setLoans] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State for Reissuing
  const [reissueItem, setReissueItem] = useState(null);
  const [newDueDate, setNewDueDate] = useState("");
  const [isSubmittingReissue, setIsSubmittingReissue] = useState(false);

  // Modal State for Sending Email Confirmation
  const [confirmReminderItem, setConfirmReminderItem] = useState(null);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

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

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  // Filter loans based on search input
  const filteredLoans = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return loans;

    return loans.filter((item) => {
      const instrumentName = item.instrument?.name?.toLowerCase() || "";
      const assetId = (
        item.instrument?.assetId ||
        item.instrument?.asset_id ||
        ""
      ).toLowerCase();
      const make = item.instrument?.make?.toLowerCase() || "";
      const borrowerName = (
        item.borrowerScientist?.name ||
        item.borrower_scientist?.name ||
        item.staffName ||
        item.staff_name ||
        ""
      ).toLowerCase();

      return (
        instrumentName.includes(query) ||
        assetId.includes(query) ||
        make.includes(query) ||
        borrowerName.includes(query)
      );
    });
  }, [loans, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    const mainContainer = document.querySelector("main");
    if (mainContainer) {
      mainContainer.scrollTop = 0;
    }
  }, [currentPage]);

  // Open confirmation pop-up modal
  const handlePromptSendReminder = (item) => {
    setConfirmReminderItem(item);
  };

  // Execute reminder API call upon user confirmation
  const handleConfirmSendReminder = async () => {
    if (!confirmReminderItem) return;

    try {
      setIsSendingReminder(true);
      const recordId = confirmReminderItem.id || confirmReminderItem._id;
      const borrowerName =
        confirmReminderItem.borrowerScientist?.name ||
        confirmReminderItem.borrower_scientist?.name ||
        confirmReminderItem.staffName ||
        confirmReminderItem.staff_name ||
        "Borrower";
      const instrumentName = confirmReminderItem.instrument?.name || "Instrument";

      // Dispatch request to backend
      await axiosClient.post(`/issue-records/${recordId}/send-reminder`);

      if (onShowToast) {
        onShowToast(
          `Reminder email dispatched to ${borrowerName} for ${instrumentName}.`
        );
      }
      setConfirmReminderItem(null);
    } catch (err) {
      if (onShowToast) {
        onShowToast(
          err.response?.data?.message || "Failed to dispatch reminder email."
        );
      }
    } finally {
      setIsSendingReminder(false);
    }
  };

  // Reissue handlers
  const handleOpenReissueModal = (item) => {
    setReissueItem(item);
    const fourteenDaysLater = new Date();
    fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14);
    setNewDueDate(fourteenDaysLater.toISOString().split("T")[0]);
  };

  const handleConfirmReissue = async () => {
    if (!reissueItem || !newDueDate) return;

    try {
      setIsSubmittingReissue(true);
      const recordId = reissueItem.id || reissueItem._id;

      await axiosClient.put(`/issue-records/${recordId}`, {
        due_date: newDueDate,
        dueDate: newDueDate,
      });

      const borrowerName =
        reissueItem.borrowerScientist?.name ||
        reissueItem.borrower_scientist?.name ||
        reissueItem.staffName ||
        reissueItem.staff_name ||
        "Borrower";

      if (onShowToast) {
        onShowToast(
          `Reissued ${
            reissueItem.instrument?.name || "Instrument"
          } to ${borrowerName} until ${newDueDate}.`
        );
      }

      setReissueItem(null);
      fetchActiveLoans();
    } catch (err) {
      if (onShowToast) {
        onShowToast("Failed to reissue instrument. Please try again.");
      }
    } finally {
      setIsSubmittingReissue(false);
    }
  };

  const totalPages = Math.ceil(filteredLoans.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const slicedLoans = filteredLoans.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden font-sans text-[#1b1a18]">
      {/* Header Info & Search Input */}
      <div className="shrink-0 pb-2 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <button
            type="button"
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-black/5 active:scale-95 transition-all focus:outline-none cursor-pointer"
            aria-label="Back to Home"
          >
            <ArrowLeft size={18} className="text-[#1b4d8f]" />
          </button>
          <h2 className="text-base font-bold text-[#1b4d8f]">Overdue Tracker</h2>
        </div>

        <p className="text-[12px] text-[#5d5b56] leading-relaxed">
          {isLoading ? (
            "Loading overdue records..."
          ) : loans.length > 0 ? (
            <>
              <span className="font-bold text-[#c92a2a]">
                {loans.length} overdue item(s)
              </span>{" "}
              require immediate attention. Send reminders or reissue with a new return date.
            </>
          ) : (
            <>All issued items are within their return schedules. Nothing overdue.</>
          )}
        </p>

        {/* Search Input */}
        <div className="relative pt-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, asset ID, borrower or make"
            className="w-full bg-white text-[13px] py-2 pl-3 pr-9 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f] shadow-xs"
          />
          <Search
            size={16}
            className="absolute right-3 top-3.5 text-gray-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Overdue List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
        {error && (
          <div className="bg-[#fcf2f2] text-[#c92a2a] text-[11.5px] p-2.5 rounded-xl border border-[#f5c2c2]">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-xs text-gray-400 py-2">Loading overdue tracker...</p>
        ) : filteredLoans.length === 0 ? (
          <div className="bg-[#ffffff] p-6 rounded-2xl border border-black/10 text-center space-y-1">
            <h4 className="text-[13px] font-semibold text-[#12695a]">
              {loans.length === 0 ? "No overdue items" : "No matching records"}
            </h4>
            <p className="text-[11px] text-[#7a7872]">
              {loans.length === 0
                ? "All issued equipment is within its allowed return date."
                : "Try adjusting your search criteria."}
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
                        onClick={() => handlePromptSendReminder(item)}
                        className="flex-1 bg-[#8f2318] hover:bg-[#731c13] text-white py-2 rounded-xl text-[12px] font-semibold active:scale-98 transition-all shadow-xs text-center cursor-pointer"
                      >
                        Send reminder
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenReissueModal(item)}
                        className="flex-1 bg-[#1b4d8f] hover:bg-[#153d73] text-white py-2 rounded-xl text-[12px] font-semibold active:scale-98 transition-all shadow-xs text-center cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw size={13} />
                        Reissue
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
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl font-medium shadow-xs disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
                >
                  Prev
                </button>
                <span className="font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl font-medium shadow-xs disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modal for Sending Reminder Email */}
      {confirmReminderItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl border border-black/10 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-[#8f2318] flex items-center gap-1.5">
                <Mail size={16} />
                Confirm Send Reminder
              </h3>
              <button
                onClick={() => setConfirmReminderItem(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#5d5b56] pt-1">
              <p>Are you sure you want to send a return reminder email?</p>
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 space-y-1">
                <p>
                  <span className="font-semibold text-gray-800">Borrower Scientist:</span>{" "}
                  <span className="font-bold text-[#1b4d8f]">
                    {confirmReminderItem.borrowerScientist?.name ||
                      confirmReminderItem.borrower_scientist?.name ||
                      confirmReminderItem.staffName ||
                      confirmReminderItem.staff_name ||
                      "Borrower"}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-gray-800">Instrument:</span>{" "}
                  <span className="font-bold text-[#1b1a18]">
                    {confirmReminderItem.instrument?.name || "Instrument"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmReminderItem(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingReminder}
                onClick={handleConfirmSendReminder}
                className="flex-1 py-2 bg-[#8f2318] hover:bg-[#731c13] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSendingReminder ? "Sending..." : "Yes, Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reissue Modal */}
      {reissueItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl border border-black/10 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-[#1b4d8f] flex items-center gap-1.5">
                <RefreshCw size={16} />
                Reissue Instrument
              </h3>
              <button
                onClick={() => setReissueItem(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#5d5b56]">
              <p>
                <span className="font-semibold text-gray-800">Instrument:</span>{" "}
                {reissueItem.instrument?.name || "Instrument"}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Borrower:</span>{" "}
                {reissueItem.borrowerScientist?.name ||
                  reissueItem.borrower_scientist?.name ||
                  reissueItem.staffName ||
                  reissueItem.staff_name ||
                  "Borrower"}
              </p>

              <div className="pt-2 space-y-1">
                <label className="block text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                  <Calendar size={13} /> Select New Return Due Date:
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-xs focus:outline-none focus:border-[#1b4d8f]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReissueItem(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReissue || !newDueDate}
                onClick={handleConfirmReissue}
                className="flex-1 py-2 bg-[#1b4d8f] hover:bg-[#153d73] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmittingReissue ? "Updating..." : "Confirm Reissue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
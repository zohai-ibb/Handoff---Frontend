import React, { useState, useEffect } from "react";
import { Image as ImageIcon } from "lucide-react";
import {
  getInstruments,
  getActiveIssueRecords,
} from "../api/instrumentService";
import { isRecordOverdue } from "../utils/dateUtils";
import { SERVER_BASE_URL } from "../api/config";

const PAGE_SIZE = 10;

export default function HomeScreen({ onNavigate, onSelectInstrument }) {
  const [instruments, setInstruments] = useState([]);
  const [issueRecords, setIssueRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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
            (r) => r.state === "OPEN" || r.state === "ISSUED" || !r.state,
          );
          setInstruments(instData || []);
          setIssueRecords(openRecords);
        }
      } catch (err) {
        if (isMounted)
          setError("Failed to load dashboard metrics from server.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Reset page if total records shrink below active page offset
  useEffect(() => {
    const totalPages = Math.ceil(issueRecords.length / PAGE_SIZE) || 1;
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [issueRecords.length, currentPage]);

  // 1. Available instruments count
  const availableCount = instruments.filter(
    (i) => i.status === "AVAILABLE",
  ).length;

  // 2. Maintenance instruments count
  const maintenanceCount = instruments.filter(
    (i) => i.status === "MAINTENANCE",
  ).length;

  // 3. Overdue count from open issue records
  const overdueCount = issueRecords.filter((r) => isRecordOverdue(r)).length;

  // 4. Total items marked ISSUED in instrument inventory
  const totalDbIssuedCount = instruments.filter(
    (i) => i.status === "ISSUED",
  ).length;

  // 5. On-time Issued count = Total ISSUED minus Overdue
  const issuedCount = Math.max(0, totalDbIssuedCount - overdueCount);

  // Pagination Math
  const totalPages = Math.ceil(issueRecords.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const slicedRecords = issueRecords.slice(startIndex, startIndex + PAGE_SIZE);

  // Helper function to build a full instrument object before navigating to detail view
  const handleCardClick = (record) => {
    if (!onSelectInstrument) return;

    const instrumentData = record.instrument || {};
    const itemId =
      instrumentData.id ||
      instrumentData._id ||
      record.instrumentId ||
      record.instrument;
    const overdue = isRecordOverdue(record);
    const dateDisplay = record.dueDate || record.due_date || "N/A";

    const borrowerName =
      record.borrowerScientist?.name ||
      record.borrower_scientist?.name ||
      record.staffName ||
      record.staff_name ||
      "Borrower";

    // Find original instrument from list if available, or build full fallback
    const matchedInstrument = instruments.find(
      (i) => (i.id || i._id) === itemId,
    );

    const fullInstrumentToPass = {
      ...(matchedInstrument || instrumentData),
      id: itemId,
      _id: itemId,
      name: instrumentData.name || matchedInstrument?.name || "Instrument",
      assetId:
        instrumentData.assetId ||
        instrumentData.asset_id ||
        matchedInstrument?.assetId ||
        "N/A",
      asset_id:
        instrumentData.assetId ||
        instrumentData.asset_id ||
        matchedInstrument?.asset_id ||
        "N/A",
      photoPath:
        instrumentData.photoPath ||
        instrumentData.photo_path ||
        matchedInstrument?.photoPath,
      photo_path:
        instrumentData.photoPath ||
        instrumentData.photo_path ||
        matchedInstrument?.photo_path,
      status: overdue ? "OVERDUE" : "ISSUED",
      isOverdue: overdue,
      dueDate: dateDisplay,
      holder: borrowerName,
    };

    onSelectInstrument(fullInstrumentToPass);
  };

  return (
    <div className="space-y-4 font-sans text-[#1b1a18]">
      {/* 4 Stat Tiles Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div
          onClick={() => onNavigate && onNavigate("Items")}
          className="bg-white p-3.5 rounded-2xl border border-black/10 cursor-pointer active:scale-98 transition-all shadow-xs"
        >
          <div className="text-2xl font-bold text-[#12695a]">
            {isLoading ? "..." : availableCount}
          </div>
          <div className="text-[12px] text-[#5d5b56] mt-1">Available</div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate("Due")}
          className="bg-white p-3.5 rounded-2xl border border-black/10 cursor-pointer active:scale-98 transition-all shadow-xs"
        >
          <div className="text-2xl font-bold text-[#8a5a12]">
            {isLoading ? "..." : issuedCount}
          </div>
          <div className="text-[12px] text-[#5d5b56] mt-1">Issued / in use</div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate("Due")}
          className="bg-white p-3.5 rounded-2xl border border-black/10 cursor-pointer active:scale-98 transition-all shadow-xs"
        >
          <div className="text-2xl font-bold text-[#8f2318]">
            {isLoading ? "..." : overdueCount}
          </div>
          <div className="text-[12px] text-[#5d5b56] mt-1">Overdue</div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate("Items")}
          className="bg-white p-3.5 rounded-2xl border border-black/10 cursor-pointer active:scale-98 transition-all shadow-xs"
        >
          <div className="text-2xl font-bold text-[#5c4a86]">
            {isLoading ? "..." : maintenanceCount}
          </div>
          <div className="text-[12px] text-[#5d5b56] mt-1">Maintenance</div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="flex gap-2.5 pt-1">
        <button
          onClick={() => onNavigate && onNavigate("Due")}
          className="flex-1 bg-white text-[#1b1a18] border border-gray-300 py-2.5 px-2 rounded-xl text-[13px] font-medium shadow-xs active:scale-95 transition-all text-center"
        >
          Due
        </button>
        <button
          onClick={() => onNavigate && onNavigate("Receive")}
          className="flex-1 bg-white text-[#1b1a18] border border-gray-300 py-2.5 px-2 rounded-xl text-[13px] font-medium shadow-xs active:scale-95 transition-all text-center"
        >
          Receive
        </button>
        <button
          onClick={() => onNavigate && onNavigate("Add item")}
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
            onClick={() => onNavigate && onNavigate("Items")}
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
          <p className="text-xs text-gray-400 py-2">
            Loading active records...
          </p>
        ) : issueRecords.length === 0 ? (
          <div className="bg-white p-4 rounded-2xl border border-black/10 text-center text-xs text-gray-400">
            No instruments are currently issued out.
          </div>
        ) : (
          <>
            <div className="space-y-2.5">
              {slicedRecords.map((record) => {
                const overdue = isRecordOverdue(record);
                const dateDisplay = record.dueDate || record.due_date || "N/A";

                // Borrower Name Resolution
                const borrowerName =
                  record.borrowerScientist?.name ||
                  record.borrower_scientist?.name ||
                  record.staffName ||
                  record.staff_name ||
                  "Borrower";

                // Photo URL Resolution
                const photoPath =
                  record.instrument?.photoPath || record.instrument?.photo_path;

                const photoUrl = photoPath
                  ? photoPath.startsWith("http") ||
                    photoPath.startsWith("data:")
                    ? photoPath
                    : `${SERVER_BASE_URL}${photoPath.startsWith("/") ? photoPath : `/${photoPath}`}`
                  : null;


                const assetIdDisplay =
                  record.instrument?.assetId ||
                  record.instrument?.asset_id ||
                  "N/A";

                return (
                  <div
                    key={record.id || record._id}
                    onClick={() => handleCardClick(record)}
                    className={`bg-white p-3 rounded-2xl border shadow-xs cursor-pointer hover:border-[#1b4d8f] active:scale-98 transition-all flex items-center gap-3 ${
                      overdue ? "border-[#f5c2c2]" : "border-black/10"
                    }`}
                  >
                    {/* Left Side: Photo Thumbnail */}
                    <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-xl overflow-hidden border border-black/10 flex items-center justify-center">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={record.instrument?.name || "Instrument"}
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
                          {record.instrument?.name || "Instrument"}
                        </h3>
                        <span
                          className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            overdue
                              ? "bg-[#fbe4e0] text-[#8f2318] border border-[#f5c2c2]"
                              : "bg-[#fbf0dc] text-[#8a5a12]"
                          }`}
                        >
                          {overdue ? "OVERDUE" : "Issued"}
                        </span>
                      </div>

                      <div className="font-mono text-[10.5px] text-[#7a7872] truncate">
                        Asset ID: {assetIdDisplay}
                      </div>

                      <div className="text-[11.5px] text-[#5d5b56] truncate">
                        {overdue ? (
                          <span className="text-[#c92a2a] font-bold">
                            {borrowerName} · Due: {dateDisplay}
                          </span>
                        ) : (
                          <span>
                            {borrowerName} · Due: {dateDisplay}
                          </span>
                        )}
                      </div>
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

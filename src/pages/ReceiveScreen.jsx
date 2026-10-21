import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Camera,
  X,
  Search,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import axiosClient from "../api/axiosClient";
import { getActiveIssueRecords } from "../api/instrumentService";
import { isRecordOverdue } from "../utils/dateUtils";
import { SERVER_BASE_URL } from "../api/config";

const PAGE_SIZE = 10;

export default function ReceiveScreen({ onBack, onShowToast }) {
  const [issuedRecords, setIssuedRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Selected item state for the condition modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [conditionIn, setConditionIn] = useState("GOOD");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Camera Capture State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Converts base64 Data URL captured by canvas into a binary Blob
  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const fetchOpenLoans = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await getActiveIssueRecords();
      // Only keep records that are active OPEN loans
      const openOnly = (data || []).filter(
        (record) =>
          record.state === "OPEN" || record.state === "ISSUED" || !record.state,
      );
      setIssuedRecords(openOnly);
    } catch (err) {
      setError("Failed to fetch active issue records from server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenLoans();
  }, []);

  // Filter checkout records based on search input (Name, Asset ID, Borrower Name, Make)
  const filteredRecords = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return issuedRecords;

    return issuedRecords.filter((item) => {
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
  }, [issuedRecords, searchQuery]);

  // Reset page when search input changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Scroll smoothly to top whenever pagination page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    const mainContainer = document.querySelector("main");
    if (mainContainer) {
      mainContainer.scrollTop = 0;
    }
  }, [currentPage]);

  // Camera Controls
  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      if (onShowToast) onShowToast("Unable to access live camera stream.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const handleOpenReturnModal = (record) => {
    setSelectedRecord(record);
    setConditionIn("GOOD");
    setCapturedPhoto(null);
  };

  const handleConfirmReturn = async () => {
    if (!selectedRecord) return;

    // MANDATORY PHOTO GUARD: Do not allow return submission without capturing a photo
    if (!capturedPhoto) {
      if (onShowToast) {
        onShowToast(
          "Please capture a live photo of the instrument before proceeding.",
        );
      }
      return;
    }

    const recordId = selectedRecord.id || selectedRecord._id;

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("condition_in", conditionIn);

      const photoBlob = dataURLtoBlob(capturedPhoto);
      formData.append("photo", photoBlob, "return_condition.jpg");

      await axiosClient.put(
        `/issue-records/${recordId}/return/photo`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setIssuedRecords((prev) =>
        prev.filter((item) => (item.id || item._id) !== recordId),
      );

      if (onShowToast) {
        onShowToast(
          `Received back. Instrument status set to ${
            conditionIn === "GOOD" ? "AVAILABLE" : "MAINTENANCE"
          }.`,
        );
      }

      setSelectedRecord(null);
      setCapturedPhoto(null);
      stopCamera();
    } catch (err) {
      if (onShowToast) {
        onShowToast(
          err.response?.data?.message ||
            "Failed to record return in backend database.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination Math
  const totalPages = Math.ceil(filteredRecords.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const slicedRecords = filteredRecords.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  return (
    <div className="space-y-3 font-sans text-[#1b1a18]">
      {/* Intro Subheader & Search Input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft size={18} className="text-[#1b4d8f]" />
          </button>
          <h2 className="text-base font-bold text-[#1b4d8f]">
            Receive instrument back
          </h2>
        </div>

        <p className="text-[12.5px] leading-relaxed text-[#5d5b56]">
          Receiving an instrument closes the issue, records the return
          condition, and restores equipment availability in the backend ledger.
        </p>

        {/* Search Bar Input */}
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

      {error && (
        <div className="bg-[#fcf2f2] text-[#c92a2a] text-[11.5px] p-2.5 rounded-xl border border-[#f5c2c2]">
          {error}
        </div>
      )}

      {/* Issued Items List */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-xs text-gray-400 py-2">
            Loading active checkouts...
          </p>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-black/10 text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-800">
              {issuedRecords.length === 0
                ? "No active checkouts"
                : "No matching items found"}
            </h3>
            <p className="text-xs text-gray-500">
              {issuedRecords.length === 0
                ? "All instruments are currently checked in and available in inventory."
                : "Try searching using a different name or ID."}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {slicedRecords.map((item) => {
                const overdue = isRecordOverdue(item);
                const dateDisplay = item.dueDate || item.due_date || "N/A";

                const borrowerName =
                  item.borrowerScientist?.name ||
                  item.borrower_scientist?.name ||
                  item.staffName ||
                  item.staff_name ||
                  "Borrower";

                // Photo URL Resolution
                const photoPath =
                  item.instrument?.photoPath || item.instrument?.photo_path;

                const photoUrl = photoPath
                  ? photoPath.startsWith("http") ||
                    photoPath.startsWith("data:")
                    ? photoPath
                    : `${SERVER_BASE_URL}${photoPath.startsWith("/") ? photoPath : `/${photoPath}`}`
                  : null;

                return (
                  <div
                    key={item.id || item._id}
                    className={`bg-white p-3.5 rounded-2xl border shadow-xs space-y-3 ${
                      overdue ? "border-[#f5c2c2]" : "border-black/10"
                    }`}
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

                      {/* Right Side: Title & Status Badge */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <h3 className="text-[13.5px] font-semibold text-[#1b1a18] leading-snug truncate">
                            {item.instrument?.name || "Instrument"}
                          </h3>
                          <span
                            className={`shrink-0 text-[10px] font-medium px-2.5 py-1 rounded-md ${
                              overdue
                                ? "bg-[#fbe4e0] text-[#8f2318] border border-[#f5c2c2]"
                                : "bg-[#fbf0dc] text-[#8a5a12]"
                            }`}
                          >
                            {overdue ? "Overdue" : "Issued"}
                          </span>
                        </div>

                        <p className="font-mono text-[10.5px] text-[#7a7872] truncate">
                          Asset ID:{" "}
                          {item.instrument?.assetId ||
                            item.instrument?.asset_id ||
                            "N/A"}
                        </p>

                        <div className="text-[12px] text-[#5d5b56] truncate">
                          <span className="font-medium text-[#3f3d39]">
                            {borrowerName}
                          </span>{" "}
                          · Due: {dateDisplay}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        onClick={() => handleOpenReturnModal(item)}
                        className="flex-1 bg-[#1b4d8f] text-white py-2 px-3 rounded-xl text-[13px] font-semibold active:scale-98 transition-all shadow-xs text-center cursor-pointer"
                      >
                        Mark returned
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

      {/* Return Condition & Mandatory Photo Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-4 w-full max-w-sm space-y-3 shadow-2xl border border-black/10">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-[#1b1a18]">
                Record Return Details
              </h3>
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  stopCamera();
                }}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-gray-800">
                {selectedRecord.instrument?.name}
              </span>
              <p className="text-[11px] text-gray-500">
                Borrower:{" "}
                {selectedRecord.borrowerScientist?.name ||
                  selectedRecord.borrower_scientist?.name ||
                  selectedRecord.staffName ||
                  selectedRecord.staff_name ||
                  "N/A"}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">
                Physical Condition at Return *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConditionIn("GOOD")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    conditionIn === "GOOD"
                      ? "bg-[#eef8f5] text-[#12695a] border-[#12695a] ring-1 ring-[#12695a]"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  Good (Available)
                </button>

                <button
                  type="button"
                  onClick={() => setConditionIn("BAD")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    conditionIn === "BAD"
                      ? "bg-[#fcf2f2] text-[#c92a2a] border-[#c92a2a] ring-1 ring-[#c92a2a]"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  Bad (Maintenance)
                </button>
              </div>
            </div>

            {/* Mandatory Photo Capture Section */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold uppercase text-[#c92a2a] tracking-wider flex items-center justify-between">
                <span>Instrument Photo (Required) *</span>
                {!capturedPhoto && (
                  <span className="text-[10px] lowercase font-normal text-red-500 flex items-center gap-0.5">
                    <AlertCircle size={11} /> Photo required
                  </span>
                )}
              </label>

              {isCameraOpen ? (
                <div className="space-y-2">
                  <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="flex-1 bg-[#12695a] text-white py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Capture Photo
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="bg-gray-200 text-gray-700 py-1.5 px-3 rounded-xl text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : capturedPhoto ? (
                <div className="relative rounded-xl overflow-hidden border border-emerald-500 ring-1 ring-emerald-500">
                  <img
                    src={capturedPhoto}
                    alt="Captured condition"
                    className="w-full h-28 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setCapturedPhoto(null)}
                    className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full bg-red-50/50 border border-dashed border-[#f5c2c2] text-[#8f2318] py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 hover:bg-red-100/50 cursor-pointer"
                >
                  <Camera size={16} />
                  <span>Take Live Photo (Mandatory)</span>
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRecord(null);
                  stopCamera();
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium border border-gray-300 text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || !capturedPhoto}
                onClick={handleConfirmReturn}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#1b4d8f] text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? "Processing..." : "Confirm Return"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

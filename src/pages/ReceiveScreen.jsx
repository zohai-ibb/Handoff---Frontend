import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, CheckCircle2, Camera, X } from "lucide-react";
import axiosClient from "../api/axiosClient";
import { getActiveIssueRecords } from "../api/instrumentService";
import { isRecordOverdue } from "../utils/dateUtils";

export default function ReceiveScreen({ onBack, onShowToast }) {
  const [issuedRecords, setIssuedRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Selected item state for the condition modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [conditionIn, setConditionIn] = useState("GOOD"); // 'GOOD' or 'BAD'
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
  const recordId = selectedRecord.id || selectedRecord._id;

  try {
    setIsSubmitting(true);

    if (capturedPhoto) {
      // MULTIPART FORM-DATA SUBMISSION (WITH PHOTO)
      const formData = new FormData();
      formData.append('condition_in', conditionIn);

      // Convert base64 data URL to Blob and attach file under key "photo"
      const photoBlob = dataURLtoBlob(capturedPhoto);
      formData.append('photo', photoBlob, 'return_condition.jpg');

      // Call the multipart endpoint
      await axiosClient.put(`/issue-records/${recordId}/return/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // PLAIN JSON SUBMISSION (WITHOUT PHOTO)
      await axiosClient.put(`/issue-records/${recordId}/return`, {
        condition_in: conditionIn,
      });
    }

    // Remove returned record from active list
    setIssuedRecords((prev) =>
      prev.filter((item) => (item.id || item._id) !== recordId)
    );

    if (onShowToast) {
      onShowToast(
        `Received back. Instrument status set to ${
          conditionIn === 'GOOD' ? 'AVAILABLE' : 'MAINTENANCE'
        }.`
      );
    }

    setSelectedRecord(null);
    setCapturedPhoto(null);
    stopCamera();
  } catch (err) {
    if (onShowToast) {
      onShowToast(
        err.response?.data?.message || 'Failed to record return in backend database.'
      );
    }
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <div className="space-y-3.5 font-sans text-[#1b1a18]">
      {/* Intro Subheader */}
      <div className="flex items-center gap-2 mb-1">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-black/5 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} className="text-[#1b4d8f]" />
        </button>
        <h2 className="text-base font-bold text-[#1b4d8f]">
          Receive instrument back
        </h2>
      </div>

      <p className="text-[12.5px] leading-relaxed text-[#5d5b56]">
        Receiving an instrument closes the issue, records the return condition,
        and restores equipment availability in the backend ledger.
      </p>

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
        ) : issuedRecords.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-black/10 text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-800">
              No active checkouts
            </h3>
            <p className="text-xs text-gray-500">
              All instruments are currently checked in and available in
              inventory.
            </p>
          </div>
        ) : (
          issuedRecords.map((item) => {
            const overdue = isRecordOverdue(item);
            const dateDisplay = item.dueDate || item.due_date || "N/A";

            return (
              <div
                key={item.id || item._id}
                className={`bg-white p-3.5 rounded-2xl border shadow-xs space-y-3 ${
                  overdue ? "border-[#f5c2c2]" : "border-black/10"
                }`}
              >
                {/* Header: Title & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 max-w-[70%]">
                    <h3 className="text-[13.5px] font-semibold text-[#1b1a18] leading-snug">
                      {item.instrument?.name || "Instrument"}
                    </h3>
                    <p className="font-mono text-[10.5px] text-[#7a7872]">
                      Asset ID: {item.instrument?.assetId || "N/A"}
                    </p>
                    <div className="text-[12px] text-[#5d5b56] pt-0.5">
                      <span className="font-medium text-[#3f3d39]">
                        {item.borrowerScientist?.name ||
                          item.staffName ||
                          "Borrower"}
                      </span>{" "}
                      · Due: {dateDisplay}
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

                {/* Action Buttons Row */}
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => handleOpenReturnModal(item)}
                    className="flex-1 bg-[#1b4d8f] text-white py-2 px-3 rounded-xl text-[13px] font-semibold active:scale-98 transition-all shadow-xs text-center"
                  >
                    Mark returned
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Return Condition & Photo Modal */}
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
                className="text-gray-400 hover:text-gray-600 p-1"
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
                  selectedRecord.staffName ||
                  "N/A"}
              </p>
            </div>

            {/* Binary Condition Selector (GOOD vs BAD) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">
                Physical Condition at Return *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConditionIn("GOOD")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
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
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    conditionIn === "BAD"
                      ? "bg-[#fcf2f2] text-[#c92a2a] border-[#c92a2a] ring-1 ring-[#c92a2a]"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  Bad (Maintenance)
                </button>
              </div>
            </div>

            {/* Photo Capture Section */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">
                Instrument Condition Photo (Optional)
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
                      className="flex-1 bg-[#12695a] text-white py-1.5 rounded-xl text-xs font-semibold"
                    >
                      Capture Photo
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="bg-gray-200 text-gray-700 py-1.5 px-3 rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : capturedPhoto ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-300">
                  <img
                    src={capturedPhoto}
                    alt="Captured condition"
                    className="w-full h-28 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setCapturedPhoto(null)}
                    className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full bg-gray-50 border border-dashed border-gray-300 text-gray-600 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 hover:bg-gray-100"
                >
                  <Camera size={16} />
                  <span>Take Live Photo</span>
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
                className="flex-1 py-2.5 rounded-xl text-xs font-medium border border-gray-300 text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmReturn}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#1b4d8f] text-white disabled:opacity-50"
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

import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, ArrowLeft, X, Camera } from 'lucide-react';

export default function ReceiveScreen({ onBack, onShowToast }) {
  // Mock active loans matching backend IssueRecord models
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

  // Camera & Photo State for Return
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Camera Controls
  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      if (onShowToast) onShowToast('Unable to access live camera stream.');
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

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    
    setCapturedPhoto(dataUrl);
    stopCamera();
    if (onShowToast) onShowToast('Return photo attached to record!');
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleOpenReturnModal = (record) => {
    setSelectedRecord(record);
    setConditionIn('Returned intact, cleaned and functioning normally');
    setCapturedPhoto(null);
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
    setCapturedPhoto(null);
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
              className="bg-white p-3.5 rounded-2xl border border-black/10 space-y-3 shadow-2xs"
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
                  className="flex-1 bg-[#1b4d8f] text-white py-2 px-3 rounded-xl text-[13px] font-semibold active:scale-98 transition-all shadow-2xs text-center"
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

            {/* Condition In + Capture Photo Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider">
                  Condition at Return
                </label>
                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-[#1b4d8f] hover:bg-[#143d73] text-white text-[10.5px] font-medium py-1 px-2.5 rounded-lg transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
                >
                  <Camera size={12} />
                  <span>Take Photo</span>
                </button>
              </div>

              <textarea
                value={conditionIn}
                onChange={(e) => setConditionIn(e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#1b4d8f]"
                placeholder="Specify physical condition upon return..."
              />

              {/* Photo Preview Attachment */}
              {capturedPhoto && (
                <div className="mt-2 p-2 bg-white rounded-xl border border-black/10 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={capturedPhoto}
                      alt="Return Condition"
                      className="w-10 h-10 object-cover rounded-lg border border-gray-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10.5px] font-semibold text-[#12695a] flex items-center gap-1">
                        <CheckCircle2 size={11} /> Photo Attached
                      </span>
                      <p className="text-[9.5px] text-gray-500 truncate">
                        Saved with return record
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCapturedPhoto(null)}
                    className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
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
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#1b4d8f] text-white active:scale-98 shadow-2xs"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Viewfinder Overlay (Covers 70% of screen height) */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm h-[70vh] bg-black rounded-3xl overflow-hidden flex flex-col justify-between p-3.5 shadow-2xl border border-white/20">
            {/* Header */}
            <div className="flex items-center justify-between text-white pb-1">
              <h3 className="text-xs font-bold flex items-center gap-1.5">
                <Camera size={14} className="text-[#1b4d8f]" />
                Capture Return Condition Photo
              </h3>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Video Viewport */}
            <div className="relative flex-1 bg-black rounded-2xl overflow-hidden flex items-center justify-center my-2">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-2 border-white/20 rounded-2xl pointer-events-none" />
            </div>

            {/* Controls */}
            <div className="pt-1 pb-1 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={stopCamera}
                className="bg-white/20 hover:bg-white/30 text-white text-xs px-4 py-2 rounded-xl transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={takePhoto}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border-4 border-[#1b4d8f]"
              >
                <div className="w-8 h-8 bg-[#1b4d8f] rounded-full" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Camera, X, CheckCircle2 } from "lucide-react";

export default function IssueWizardScreen({
  onBack,
  onShowToast,
  onIssueComplete,
}) {
  // Wizard active step tracker (1: Instrument, 2: Person & Staff, 3: Dates, 4: Confirm)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State across all wizard steps
  const [selectedInstrument, setSelectedInstrument] = useState(null);

  // Step 2 State: Selected Borrower Scientist & Optional Intermediary Staff details
  const [selectedScientist, setSelectedScientist] = useState(null);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");

  // Step 3 State: Dates, Purpose, Condition & Photo Record
  const [issueDate, setIssueDate] = useState("09-09-2026");
  const [expectedReturn, setExpectedReturn] = useState("23-09-2026");
  const [purpose, setPurpose] = useState("");
  const [conditionOut, setConditionOut] = useState(
    "Complete with case and accessories"
  );

  // Camera & Photo Capture State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Expanded list of instruments
  const availableInstruments = [
    { id: "inst_1", name: "Testo 872 Thermal Imager", assetId: "CBRI/APEEG/0143" },
    { id: "inst_2", name: "HOBO MX1101 Temp/RH Loggers (set of 12)", assetId: "CBRI/APEEG/0210" },
    { id: "inst_3", name: "Lutron SL-4023SD Sound Level Meter", assetId: "CBRI/APEEG/0201" },
    { id: "inst_4", name: "Kipp & Zonen CMP6 Pyranometer", assetId: "CBRI/APEEG/0099" },
    { id: "inst_5", name: "Fluke 1736 Three-Phase Power Logger", assetId: "CBRI/APEEG/0121" },
    { id: "inst_6", name: "Kimo DBM 610 Air Flow Meter", assetId: "CBRI/APEEG/0177" },
    { id: "inst_7", name: "Testo 440 IAQ Kit", assetId: "CBRI/APEEG/0121" },
    { id: "inst_8", name: "FLIR E8-XT Thermal Camera", assetId: "CBRI/APEEG/0122" },
  ];

  // Expanded list of scientists
  const scientists = [
    {
      id: "sc_1",
      name: "Dr. Ankit Rawat",
      initials: "AR",
      department: "APEEG",
      email: "ankit.rawat@cbri.res.in",
    },
    {
      id: "sc_2",
      name: "Dr. Priya Nautiyal",
      initials: "PN",
      department: "APEEG",
      email: "priya.nautiyal@cbri.res.in",
    },
    {
      id: "sc_3",
      name: "Dr. Saurabh Joshi",
      initials: "SJ",
      department: "APEEG",
      email: "saurabh.joshi@cbri.res.in",
    },
    {
      id: "sc_4",
      name: "Dr. Neha Bisht",
      initials: "NB",
      department: "APEEG",
      email: "neha.bisht@cbri.res.in",
    },
    {
      id: "sc_5",
      name: "Dr. Vikram Singh",
      initials: "VS",
      department: "APEEG",
      email: "vikram.singh@cbri.res.in",
    },
  ];

  // Camera Stream Handlers
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

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setCapturedPhoto(dataUrl);
    stopCamera();
    if (onShowToast) onShowToast("Photo saved to issue record!");
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Handle QR Scan Simulation
  const handleSimulateScan = () => {
    const scanned = availableInstruments[0];
    setSelectedInstrument(scanned);
    if (onShowToast) {
      onShowToast(`Scanned asset tag: ${scanned.assetId} (${scanned.name})`);
    }
  };

  // Step Validation Handlers
  const handleContinueStep1 = () => {
    if (!selectedInstrument) {
      if (onShowToast)
        onShowToast("Validation Error: Please select or scan an instrument first.");
      return;
    }
    setCurrentStep(2);
  };

  const handleContinueStep2 = () => {
    if (!selectedScientist) {
      if (onShowToast)
        onShowToast("Validation Error: Please select a Borrower Scientist.");
      return;
    }
    setCurrentStep(3);
  };

  const handleContinueStep3 = () => {
    if (!issueDate || !expectedReturn) {
      if (onShowToast)
        onShowToast("Validation Error: Issue date and expected return date are required.");
      return;
    }
    setCurrentStep(4);
  };

  const handleConfirmIssue = () => {
    const staffText = staffName.trim() ? `, ${staffName} (${staffEmail})` : "";
    if (onShowToast) {
      onShowToast(
        `Issued. Confirmation mail sent to ${selectedScientist.name}${staffText}, and Group Head.`
      );
    }
    if (onIssueComplete) {
      onIssueComplete();
    }
  };

  return (
    <div className="relative h-full flex flex-col justify-between overflow-hidden font-sans text-[#1b1a18]">
      {/* --- Top Fixed Header & Step Progress Bar --- */}
      <div className="shrink-0 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-black/5 active:scale-95 transition-all"
            aria-label="Back"
          >
            <ArrowLeft size={18} className="text-[#1b4d8f]" />
          </button>
          <h2 className="text-base font-bold text-[#1b4d8f]">Issue instrument</h2>
        </div>

        <div className="space-y-1.5">
          <div className="grid grid-cols-4 gap-1.5">
            <div className={`h-1 rounded-full ${currentStep >= 1 ? "bg-[#1b4d8f]" : "bg-gray-300"}`} />
            <div className={`h-1 rounded-full ${currentStep >= 2 ? "bg-[#1b4d8f]" : "bg-gray-300"}`} />
            <div className={`h-1 rounded-full ${currentStep >= 3 ? "bg-[#1b4d8f]" : "bg-gray-300"}`} />
            <div className={`h-1 rounded-full ${currentStep >= 4 ? "bg-[#12695a]" : "bg-gray-300"}`} />
          </div>
          <div className="grid grid-cols-4 text-[10.5px] font-medium text-gray-500 text-center">
            <span className={currentStep === 1 ? "font-bold text-[#1b4d8f]" : ""}>Instrument</span>
            <span className={currentStep === 2 ? "font-bold text-[#1b4d8f]" : ""}>Person</span>
            <span className={currentStep === 3 ? "font-bold text-[#1b4d8f]" : ""}>Dates</span>
            <span className={currentStep === 4 ? "font-bold text-[#12695a]" : ""}>Confirm</span>
          </div>
        </div>
      </div>

      {/* --- Middle Scrollable Area --- */}
      <div className="flex-1 overflow-y-auto py-1 pr-1 custom-scrollbar">
        {/* ==================== STEP 1: SELECT INSTRUMENT ==================== */}
        {currentStep === 1 && (
          <div className="space-y-2.5 animate-fade-in">
            <div className="bg-[#eef3fa] border-2 border-dashed border-[#1b4d8f]/40 rounded-2xl p-4 text-center space-y-1.5">
              <div className="w-12 h-12 rounded-xl bg-white border-2 border-[#1b4d8f] mx-auto flex items-center justify-center shadow-xs">
                <span className="font-mono font-bold text-xs text-[#1b4d8f]">QR</span>
              </div>
              <h3 className="text-xs font-bold text-[#1b4d8f]">Scan the asset label</h3>
              <p className="text-[10.5px] text-[#5d5b56] max-w-[220px] mx-auto leading-tight">
                Each instrument carries a printed CBRI/APEEG QR sticker. Scanning fills the entry below.
              </p>
              <button
                type="button"
                onClick={handleSimulateScan}
                className="mt-1 bg-[#1b4d8f] text-white text-[11px] font-semibold py-1.5 px-4 rounded-xl active:scale-95 transition-all shadow-xs"
              >
                Simulate scan
              </button>
            </div>

            <div className="text-center">
              <span className="text-[11px] text-[#7a7872]">or choose manually</span>
            </div>

            <div className="space-y-2">
              {availableInstruments.map((item) => {
                const isSelected = selectedInstrument?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedInstrument(item)}
                    className={`bg-white p-3 rounded-2xl border transition-all cursor-pointer active:scale-99 shadow-xs ${
                      isSelected
                        ? "border-[#1b4d8f] ring-1 ring-[#1b4d8f] bg-[#f4f7fc]"
                        : "border-black/10 hover:border-gray-300"
                    }`}
                  >
                    <h4 className="text-[13px] font-semibold text-[#1b1a18]">{item.name}</h4>
                    <p className="font-mono text-[10.5px] text-[#7a7872] mt-0.5">{item.assetId}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== STEP 2: SELECT BORROWER SCIENTIST & STAFF ==================== */}
        {currentStep === 2 && (
          <div className="space-y-2.5 animate-fade-in">
            <div className="bg-white p-2.5 rounded-xl border border-black/10 space-y-0.5 shadow-xs">
              <span className="text-[9.5px] font-bold tracking-wider text-[#7a7872] uppercase">
                INSTRUMENT
              </span>
              <h3 className="text-[13px] font-bold text-[#1b1a18]">{selectedInstrument?.name}</h3>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10.5px] font-bold tracking-wider text-[#5d5b56] uppercase">
                ISSUE TO BORROWER SCIENTIST *
              </span>

              <div className="space-y-2">
                {scientists.map((sc) => {
                  const isSelected = selectedScientist?.id === sc.id;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => setSelectedScientist(sc)}
                      className={`bg-white p-2.5 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer active:scale-99 shadow-xs ${
                        isSelected
                          ? "border-[#1b4d8f] ring-1 ring-[#1b4d8f] bg-[#f4f7fc]"
                          : "border-black/10 hover:border-gray-300"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#eef3fa] text-[#1b4d8f] font-bold text-[11px] flex items-center justify-center shrink-0">
                        {sc.initials}
                      </div>
                      <div>
                        <h4 className="text-[13px] font-semibold text-[#1b1a18] leading-tight">
                          {sc.name}
                        </h4>
                        <p className="text-[10.5px] text-[#5d5b56] mt-0.5 font-mono">{sc.email}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 space-y-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold tracking-wider text-[#5d5b56] uppercase">
                  INTERMEDIARY STAFF DETAILS
                </span>
                <span className="text-[9.5px] text-gray-400 uppercase font-medium">Optional</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Staff Name"
                  className="w-full bg-white text-[12px] p-2 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                />
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="Staff Email"
                  className="w-full bg-white text-[12px] p-2 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================== STEP 3: DATES & CONDITION ==================== */}
        {currentStep === 3 && (
          <div className="space-y-2.5 pt-1 animate-fade-in">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#5d5b56]">Issue date</label>
              <input
                type="text"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full bg-white text-[12.5px] p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#5d5b56]">Expected return</label>
              <input
                type="text"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value)}
                className="w-full bg-white text-[12.5px] p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
              />
              <p className="text-[10px] text-[#7a7872] leading-tight pt-0.5">
                Default loan period is 14 days. Daily reminders sent when overdue.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#5d5b56]">Purpose / project</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Thermal monitoring, Bhopal site"
                className="w-full bg-white text-[12.5px] p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
              />
            </div>

            {/* Condition Field with Camera Button */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#5d5b56]">
                  Condition at issue
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

              <input
                type="text"
                value={conditionOut}
                onChange={(e) => setConditionOut(e.target.value)}
                className="w-full bg-white text-[12.5px] p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
              />

              {/* Photo Preview Badge */}
              {capturedPhoto && (
                <div className="mt-2 p-2 bg-white rounded-xl border border-black/10 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={capturedPhoto}
                      alt="Instrument Condition"
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-[#12695a] flex items-center gap-1">
                        <CheckCircle2 size={12} /> Photo Attached
                      </span>
                      <p className="text-[10px] text-gray-500 truncate">
                        Instrument condition photo recorded
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
          </div>
        )}

        {/* ==================== STEP 4: CONFIRM & MAIL PREVIEW ==================== */}
        {currentStep === 4 && (
          <div className="space-y-2.5 animate-fade-in">
            <div className="bg-white p-3 rounded-2xl border border-black/10 space-y-1.5 text-[12px] shadow-xs">
              <div className="flex justify-between">
                <span className="text-[#7a7872]">Instrument</span>
                <span className="font-semibold text-[#1b1a18] text-right">{selectedInstrument?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7872]">Asset ID</span>
                <span className="font-mono font-medium text-[#1b1a18]">{selectedInstrument?.assetId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7872]">Borrower Scientist</span>
                <span className="font-semibold text-[#1b1a18]">{selectedScientist?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7872]">Intermediary Staff</span>
                <span className="font-semibold text-[#1b1a18]">
                  {staffName.trim() ? staffName : "None specified"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7872]">Period</span>
                <span className="font-semibold text-[#1b1a18]">09 Sept 2026 → 23 Sept 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7872]">Purpose</span>
                <span className="font-semibold text-[#1b1a18]">{purpose.trim() ? purpose : "Not stated"}</span>
              </div>
            </div>

            <div className="bg-[#eef3fa] border border-[#1b4d8f]/20 rounded-2xl p-3 space-y-2">
              <span className="text-[10px] font-bold tracking-wider text-[#1b4d8f] uppercase">
                MAIL GOES TO
              </span>

              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1b4d8f] mt-1.5 shrink-0" />
                  <div>
                    <h4 className="text-[12px] font-bold text-[#1b1a18]">{selectedScientist?.name}</h4>
                    <p className="font-mono text-[10px] text-[#5d5b56]">{selectedScientist?.email}</p>
                  </div>
                </div>
                <span className="text-[10px] text-[#5d5b56]">Borrower Scientist</span>
              </div>

              {staffEmail.trim() && (
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1b4d8f] mt-1.5 shrink-0" />
                    <div>
                      <h4 className="text-[12px] font-bold text-[#1b1a18]">
                        {staffName.trim() ? staffName : "Intermediary Staff"}
                      </h4>
                      <p className="font-mono text-[10px] text-[#5d5b56]">{staffEmail}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#5d5b56]">Intermediary Staff</span>
                </div>
              )}

              <div className="border-t border-[#1b4d8f]/15 pt-1.5 text-[11px] leading-relaxed text-[#3f4d63]">
                {selectedInstrument?.name} ({selectedInstrument?.assetId}) is issued to{" "}
                {selectedScientist?.name} from 09 Sept 2026 to 23 Sept 2026.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Camera Modal Overlay (Covers 70% of screen height) */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm h-[70vh] bg-black rounded-3xl overflow-hidden flex flex-col justify-between p-3.5 shadow-2xl border border-white/20">
            {/* Header */}
            <div className="flex items-center justify-between text-white pb-1">
              <h3 className="text-xs font-bold flex items-center gap-1.5">
                <Camera size={14} className="text-[#1b4d8f]" />
                Capture Instrument Photo
              </h3>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Video Stream Container */}
            <div className="relative flex-1 bg-black rounded-2xl overflow-hidden flex items-center justify-center my-2">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-2 border-white/20 rounded-2xl pointer-events-none" />
            </div>

            {/* Bottom Capture Action Row */}
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

      {/* --- Bottom Fixed Action Footer --- */}
      <div className="pt-2 border-t border-gray-100 shrink-0 bg-[#f7f6f3]">
        {currentStep === 1 && (
          <button
            onClick={handleContinueStep1}
            className="w-full bg-[#1b4d8f] text-white py-2.5 rounded-xl text-[13px] font-semibold active:scale-98 transition-all shadow-xs text-center"
          >
            Continue
          </button>
        )}

        {currentStep === 2 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="bg-white text-[#1b1a18] border border-gray-300 py-2.5 px-4 rounded-xl text-[12.5px] font-medium active:scale-98 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleContinueStep2}
              className="flex-1 bg-[#1b4d8f] text-white py-2.5 rounded-xl text-[13px] font-semibold active:scale-98 transition-all shadow-xs text-center"
            >
              Continue
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="bg-white text-[#1b1a18] border border-gray-300 py-2.5 px-4 rounded-xl text-[12.5px] font-medium active:scale-98 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleContinueStep3}
              className="flex-1 bg-[#1b4d8f] text-white py-2.5 rounded-xl text-[13px] font-semibold active:scale-98 transition-all shadow-xs text-center"
            >
              Continue
            </button>
          </div>
        )}

        {currentStep === 4 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(3)}
              className="bg-white text-[#1b1a18] border border-gray-300 py-2.5 px-4 rounded-xl text-[12.5px] font-medium active:scale-98 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleConfirmIssue}
              className="flex-1 bg-[#12695a] text-white py-2.5 rounded-xl text-[13px] font-bold active:scale-98 transition-all shadow-xs text-center"
            >
              Confirm & send mail
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
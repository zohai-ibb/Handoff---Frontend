import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Camera,
  X,
  CheckCircle2,
  Loader2,
  Search,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  QrCode,
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  getMyInstruments,
  getMyScientists,
  scanInstrumentByAssetId,
  issueInstrumentApi,
} from "../api/issueWizardService";
import axiosClient from "../api/axiosClient";

export default function IssueWizardScreen({
  onBack,
  onShowToast,
  onIssueComplete,
}) {
  const [currentStep, setCurrentStep] = useState(1);

  const [availableInstruments, setAvailableInstruments] = useState([]);
  const [scientists, setScientists] = useState([]);
  const [savedStaffList, setSavedStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  const [instrumentSearchQuery, setInstrumentSearchQuery] = useState("");
  const [scientistSearchQuery, setScientistSearchQuery] = useState("");
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);

  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isScanningApi, setIsScanningApi] = useState(false);
  const qrScannerRef = useRef(null);

  const [instrumentPage, setInstrumentPage] = useState(1);
  const [scientistPage, setScientistPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [issueQuantity, setIssueQuantity] = useState(1);

  const [selectedScientist, setSelectedScientist] = useState(null);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");

  const getTodayFormatted = () => new Date().toISOString().split("T")[0];
  const getFourteenDaysLaterFormatted = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  };

  const [issueDate, setIssueDate] = useState(getTodayFormatted());
  const [expectedReturn, setExpectedReturn] = useState(
    getFourteenDaysLaterFormatted()
  );
  const [purpose, setPurpose] = useState("");
  const [conditionOut, setConditionOut] = useState(
    "Complete with case and accessories"
  );

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [instRes, sciRes, staffRes] = await Promise.all([
          getMyInstruments(),
          getMyScientists(),
          axiosClient.get("/staff-members").catch(() => ({ data: [] })),
        ]);

        const availableOnly = (Array.isArray(instRes) ? instRes : []).filter(
          (item) => item.status === "AVAILABLE" || item.status === "Available"
        );
        setAvailableInstruments(availableOnly);
        setScientists(Array.isArray(sciRes) ? sciRes : []);
        setSavedStaffList(Array.isArray(staffRes.data) ? staffRes.data : []);
      } catch (err) {
        if (onShowToast) {
          onShowToast(
            "Failed to load inventory/scientists: " +
              (err.response?.data || err.message)
          );
        }
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (isQrScannerOpen) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader-container",
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        false
      );

      qrScannerRef.current = scanner;

      scanner.render(
        async (decodedText) => {
          scanner.clear().catch(() => {});
          setIsQrScannerOpen(false);

          try {
            setIsScanningApi(true);
            if (onShowToast) onShowToast(`Scanned Tag: ${decodedText}. Fetching details...`);

            const scannedInstrument = await scanInstrumentByAssetId(decodedText.trim());

            if (scannedInstrument) {
              setSelectedInstrument(scannedInstrument);
              setIssueQuantity(1);
              if (onShowToast) {
                onShowToast(
                  `Instrument Matched: ${scannedInstrument.name} (${scannedInstrument.asset_id || scannedInstrument.assetId})`
                );
              }
              setCurrentStep(2);
            } else {
              if (onShowToast) onShowToast("Instrument not found for scanned QR tag.");
            }
          } catch (err) {
            if (onShowToast) {
              onShowToast("Backend scan failed: Instrument not found in inventory.");
            }
          } finally {
            setIsScanningApi(false);
          }
        },
        () => {}
      );

      return () => {
        if (qrScannerRef.current) {
          qrScannerRef.current.clear().catch(() => {});
        }
      };
    }
  }, [isQrScannerOpen]);

  const filteredInstruments = availableInstruments.filter((inst) => {
    const q = instrumentSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (inst.name && inst.name.toLowerCase().includes(q)) ||
      (inst.asset_id && inst.asset_id.toLowerCase().includes(q)) ||
      (inst.assetId && inst.assetId.toLowerCase().includes(q))
    );
  });

  const filteredScientists = scientists.filter((sc) => {
    const q = scientistSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (sc.name && sc.name.toLowerCase().includes(q)) ||
      (sc.email && sc.email.toLowerCase().includes(q)) ||
      (sc.department && sc.department.toLowerCase().includes(q))
    );
  });

  const filteredStaffList = savedStaffList.filter((st) => {
    const q = staffSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (st.name && st.name.toLowerCase().includes(q)) ||
      (st.email && st.email.toLowerCase().includes(q))
    );
  });

  const totalInstrumentPages =
    Math.ceil(filteredInstruments.length / ITEMS_PER_PAGE) || 1;
  const paginatedInstruments = filteredInstruments.slice(
    (instrumentPage - 1) * ITEMS_PER_PAGE,
    instrumentPage * ITEMS_PER_PAGE
  );

  const totalScientistPages =
    Math.ceil(filteredScientists.length / ITEMS_PER_PAGE) || 1;
  const paginatedScientists = filteredScientists.slice(
    (scientistPage - 1) * ITEMS_PER_PAGE,
    scientistPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setInstrumentPage(1);
  }, [instrumentSearchQuery]);

  useEffect(() => {
    setScientistPage(1);
  }, [scientistSearchQuery]);

  const handleSelectStaff = (staff) => {
    if (!staff) {
      setSelectedStaffId("NEW");
      setStaffName("");
      setStaffEmail("");
      setStaffSearchQuery("");
    } else {
      const stId = staff.id || staff._id;
      setSelectedStaffId(stId);
      setStaffName(staff.name || "");
      setStaffEmail(staff.email || "");
      setStaffSearchQuery(staff.name || "");
    }
    setIsStaffDropdownOpen(false);
  };

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
    if (onShowToast) onShowToast("Mandatory instrument photo captured!");
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleContinueStep1 = () => {
    if (!selectedInstrument) {
      if (onShowToast)
        onShowToast(
          "Validation Error: Please select or scan an instrument first."
        );
      return;
    }

    const availableQty = selectedInstrument.quantity || 1;
    if (issueQuantity < 1 || issueQuantity > availableQty) {
      if (onShowToast)
        onShowToast(
          `Validation Error: Please select a valid quantity between 1 and ${availableQty}.`
        );
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
        onShowToast(
          "Validation Error: Issue date and expected return date are required."
        );
      return;
    }
    if (!capturedPhoto) {
      if (onShowToast)
        onShowToast(
          "Validation Error: Instrument photo is required before proceeding."
        );
      return;
    }
    setCurrentStep(4);
  };

  const handleConfirmIssue = async () => {
    if (!capturedPhoto) {
      if (onShowToast)
        onShowToast(
          "Validation Error: Please capture an instrument photo before issuing."
        );
      return;
    }

    try {
      setIsSubmitting(true);
      const targetScientistId = selectedScientist.id || selectedScientist._id;

      const payload = {
        instrumentId: selectedInstrument.id || selectedInstrument._id,
        scientistListId: targetScientistId,
        quantity: issueQuantity,
        staffName: staffName.trim() || null,
        staffEmail: staffEmail.trim() || null,
        dueDate: expectedReturn,
        purpose: purpose.trim() || null,
        conditionOut:
          conditionOut.trim() || "Complete with case and accessories",
      };

      await issueInstrumentApi(payload, capturedPhoto);

      const staffText = staffName.trim()
        ? `, ${staffName} (${staffEmail})`
        : "";
      if (onShowToast) {
        onShowToast(
          `Issued ${issueQuantity} unit(s) successfully. Confirmation mail sent to ${selectedScientist.name}${staffText}.`
        );
      }

      if (onIssueComplete) {
        onIssueComplete();
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast("Checkout Error: " + (err.response?.data || err.message));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-2">
        <Loader2 className="animate-spin text-[#1b4d8f]" size={28} />
        <p className="text-xs text-gray-500 font-medium">
          Loading inventory & directory...
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col justify-between overflow-hidden font-sans text-[#1b1a18]">
      <div className="shrink-0 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={18} className="text-[#1b4d8f]" />
          </button>
          <h2 className="text-base font-bold text-[#1b4d8f]">
            Issue instrument
          </h2>
        </div>

        <div className="space-y-1.5">
          <div className="grid grid-cols-4 gap-1.5">
            <div
              className={`h-1 rounded-full ${
                currentStep >= 1 ? "bg-[#1b4d8f]" : "bg-gray-300"
              }`}
            />
            <div
              className={`h-1 rounded-full ${
                currentStep >= 2 ? "bg-[#1b4d8f]" : "bg-gray-300"
              }`}
            />
            <div
              className={`h-1 rounded-full ${
                currentStep >= 3 ? "bg-[#1b4d8f]" : "bg-gray-300"
              }`}
            />
            <div
              className={`h-1 rounded-full ${
                currentStep >= 4 ? "bg-[#12695a]" : "bg-gray-300"
              }`}
            />
          </div>
          <div className="grid grid-cols-4 text-[10.5px] font-medium text-gray-500 text-center">
            <span className={currentStep === 1 ? "font-bold text-[#1b4d8f]" : ""}>
              Instrument
            </span>
            <span className={currentStep === 2 ? "font-bold text-[#1b4d8f]" : ""}>
              Person
            </span>
            <span className={currentStep === 3 ? "font-bold text-[#1b4d8f]" : ""}>
              Dates
            </span>
            <span className={currentStep === 4 ? "font-bold text-[#12695a]" : ""}>
              Confirm
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1 pr-1 custom-scrollbar">
        {currentStep === 1 && (
          <div className="space-y-2.5 animate-fade-in">
            <div className="bg-[#eef3fa] border-2 border-dashed border-[#1b4d8f]/40 rounded-2xl p-3 text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#1b4d8f] mx-auto flex items-center justify-center shadow-xs">
                <QrCode size={20} className="text-[#1b4d8f]" />
              </div>
              <h3 className="text-xs font-bold text-[#1b4d8f]">
                Scan physical QR label
              </h3>
              <p className="text-[10.5px] text-[#5d5b56] max-w-[220px] mx-auto leading-tight">
                Scan the QR code printed on the instrument to automatically fetch asset details.
              </p>
              <button
                type="button"
                disabled={isScanningApi}
                onClick={() => setIsQrScannerOpen(true)}
                className="bg-[#1b4d8f] text-white text-[11px] font-semibold py-1.5 px-4 rounded-xl active:scale-95 transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
              >
                {isScanningApi ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Fetching asset...</span>
                  </>
                ) : (
                  <>
                    <Camera size={13} />
                    <span>Open QR Camera</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <span className="text-[11px] text-[#7a7872]">
                or choose manually
              </span>
            </div>

            <div className="relative">
              <Search
                className="absolute left-2.5 top-2.5 text-gray-400"
                size={14}
              />
              <input
                type="text"
                value={instrumentSearchQuery}
                onChange={(e) => setInstrumentSearchQuery(e.target.value)}
                placeholder="Search instrument by name or asset ID..."
                className="w-full bg-white text-[11.5px] py-1.5 pl-8 pr-8 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
              />
              {instrumentSearchQuery && (
                <button
                  type="button"
                  onClick={() => setInstrumentSearchQuery("")}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="space-y-2">
              {filteredInstruments.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">
                  {instrumentSearchQuery
                    ? "No matching instruments found."
                    : "No available instruments found in inventory."}
                </p>
              ) : (
                paginatedInstruments.map((item) => {
                  const instId = item.id || item._id;
                  const isSelected =
                    selectedInstrument?.id === instId ||
                    selectedInstrument?._id === instId;
                  const maxQuantity = item.quantity || 1;

                  return (
                    <div
                      key={instId}
                      onClick={() => {
                        setSelectedInstrument(item);
                        setIssueQuantity(1);
                      }}
                      className={`bg-white p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-99 shadow-xs flex flex-col gap-2 ${
                        isSelected
                          ? "border-[#1b4d8f] ring-1 ring-[#1b4d8f] bg-[#f4f7fc]"
                          : "border-black/10 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[12.5px] font-semibold text-[#1b1a18] truncate">
                            {item.name}
                          </h4>
                          <p className="font-mono text-[10px] text-[#7a7872] mt-0.5 truncate">
                            Asset ID: {item.asset_id || item.assetId} · In Stock: {maxQuantity}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-[#1b4d8f] bg-[#1b4d8f]/10 px-2 py-0.5 rounded-md shrink-0">
                            Selected
                          </span>
                        )}
                      </div>

                      {isSelected && maxQuantity > 1 && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="pt-1 border-t border-black/10 flex items-center justify-between gap-2"
                        >
                          <label className="text-[11px] font-semibold text-[#5d5b56]">
                            Checkout Quantity:
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              max={maxQuantity}
                              value={issueQuantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                  setIssueQuantity(Math.max(1, Math.min(maxQuantity, val)));
                                } else {
                                  setIssueQuantity(1);
                                }
                              }}
                              className="w-16 bg-white text-[12px] font-semibold text-center py-1 border border-black/20 rounded-lg focus:outline-none focus:border-[#1b4d8f]"
                            />
                            <span className="text-[10.5px] text-gray-500">
                              / {maxQuantity} max
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {filteredInstruments.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <button
                  type="button"
                  disabled={instrumentPage === 1}
                  onClick={() => setInstrumentPage((prev) => prev - 1)}
                  className="flex items-center gap-0.5 text-[11px] font-semibold text-[#1b4d8f] disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                <span className="text-[10.5px] font-medium text-gray-500">
                  Page {instrumentPage} of {totalInstrumentPages}
                </span>

                <button
                  type="button"
                  disabled={instrumentPage === totalInstrumentPages}
                  onClick={() => setInstrumentPage((prev) => prev + 1)}
                  className="flex items-center gap-0.5 text-[11px] font-semibold text-[#1b4d8f] disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-2.5 animate-fade-in pb-4">
            <div className="bg-white p-2.5 rounded-xl border border-black/10 space-y-0.5 shadow-xs">
              <span className="text-[9.5px] font-bold tracking-wider text-[#7a7872] uppercase">
                INSTRUMENT
              </span>
              <h3 className="text-[13px] font-bold text-[#1b1a18] truncate">
                {selectedInstrument?.name} (Qty: {issueQuantity})
              </h3>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10.5px] font-bold tracking-wider text-[#5d5b56] uppercase">
                ISSUE TO BORROWER SCIENTIST *
              </span>

              {selectedScientist ? (
                <div className="bg-[#f4f7fc] p-3 rounded-2xl border border-[#1b4d8f] flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-[#1b4d8f] text-white font-bold text-[12px] flex items-center justify-center shrink-0 shadow-2xs">
                      {selectedScientist.name
                        ? selectedScientist.name
                            .replace(/^(Dr\.|Er\.|Prof\.)\s+/i, "")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()
                        : "SC"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[13px] font-bold text-[#1b1a18] leading-snug truncate">
                        {selectedScientist.name}
                      </h4>
                      <p className="text-[10.5px] text-[#5d5b56] font-mono leading-tight truncate">
                        {selectedScientist.email}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedScientist(null)}
                    className="text-[11px] font-semibold text-[#1b4d8f] bg-white border border-[#1b4d8f]/30 px-2.5 py-1 rounded-xl hover:bg-[#1b4d8f] hover:text-white transition-all shrink-0 active:scale-95 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search
                      className="absolute left-2.5 top-2.5 text-gray-400"
                      size={14}
                    />
                    <input
                      type="text"
                      value={scientistSearchQuery}
                      onChange={(e) => setScientistSearchQuery(e.target.value)}
                      placeholder="Search scientist by name or email..."
                      className="w-full bg-white text-[11.5px] py-1.5 pl-8 pr-8 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                    />
                    {scientistSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setScientistSearchQuery("")}
                        className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {filteredScientists.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4">
                        {scientistSearchQuery
                          ? "No matching scientist found."
                          : "No scientist contacts found."}
                      </p>
                    ) : (
                      paginatedScientists.map((sc) => {
                        const scId = sc.id || sc._id;
                        const initials = sc.name
                          ? sc.name
                              .replace(/^(Dr\.|Er\.|Prof\.)\s+/i, "")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)
                              .toUpperCase()
                          : "SC";

                        return (
                          <div
                            key={scId}
                            onClick={() => {
                              setSelectedScientist(sc);
                              setScientistSearchQuery("");
                            }}
                            className="bg-white p-2.5 rounded-2xl border border-black/10 hover:border-[#1b4d8f] flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-99 shadow-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-[#eef3fa] text-[#1b4d8f] font-bold text-[11px] flex items-center justify-center shrink-0">
                                {initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-[13px] font-semibold text-[#1b1a18] leading-snug truncate">
                                  {sc.name}
                                </h4>
                                <p className="text-[10.5px] text-[#5d5b56] font-mono leading-tight truncate">
                                  {sc.email}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {filteredScientists.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <button
                        type="button"
                        disabled={scientistPage === 1}
                        onClick={() => setScientistPage((prev) => prev - 1)}
                        className="flex items-center gap-0.5 text-[11px] font-semibold text-[#1b4d8f] disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronLeft size={14} />
                        <span>Prev</span>
                      </button>

                      <span className="text-[10.5px] font-medium text-gray-500">
                        Page {scientistPage} of {totalScientistPages}
                      </span>

                      <button
                        type="button"
                        disabled={scientistPage === totalScientistPages}
                        onClick={() => setScientistPage((prev) => prev + 1)}
                        className="flex items-center gap-0.5 text-[11px] font-semibold text-[#1b4d8f] disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 space-y-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold tracking-wider text-[#5d5b56] uppercase">
                  INTERMEDIARY STAFF DETAILS
                </span>
                <span className="text-[9.5px] text-gray-400 uppercase font-medium">
                  Optional
                </span>
              </div>

              {savedStaffList.length > 0 && (
                <div className="space-y-1">
                  <div className="relative">
                    <Search
                      className="absolute left-2.5 top-2.5 text-gray-400"
                      size={14}
                    />
                    <input
                      type="text"
                      value={staffSearchQuery}
                      onFocus={() => setIsStaffDropdownOpen(true)}
                      onChange={(e) => {
                        setStaffSearchQuery(e.target.value);
                        setStaffName(e.target.value);
                        setSelectedStaffId("NEW");
                        setIsStaffDropdownOpen(true);
                      }}
                      placeholder="Search or pick saved staff..."
                      className="w-full bg-white text-[11.5px] py-1.5 pl-8 pr-8 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                    />
                    {staffSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setStaffSearchQuery("");
                          setStaffName("");
                          setStaffEmail("");
                          setSelectedStaffId("NEW");
                          setIsStaffDropdownOpen(true);
                        }}
                        className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {isStaffDropdownOpen && (
                    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden p-1 flex flex-col">
                      <div className="max-h-[120px] overflow-y-auto space-y-0.5 custom-scrollbar">
                        {filteredStaffList.length === 0 ? (
                          <div className="p-2 text-[11px] text-gray-400 text-center">
                            No matching staff found. Enter details below.
                          </div>
                        ) : (
                          filteredStaffList.map((st) => {
                            const stId = st.id || st._id;
                            const isSelected = selectedStaffId === stId;
                            return (
                              <div
                                key={stId}
                                onClick={() => handleSelectStaff(st)}
                                className={`p-2 rounded-lg text-[11.5px] flex items-center justify-between cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-[#eef3fa] text-[#1b4d8f] font-semibold"
                                    : "hover:bg-gray-50 text-[#1b1a18]"
                                }`}
                              >
                                <div className="truncate min-w-0 pr-2">
                                  <span>{st.name}</span>
                                  <span className="text-[10px] text-gray-500 font-mono ml-1.5">
                                    ({st.email})
                                  </span>
                                </div>
                                {isSelected && (
                                  <UserCheck
                                    size={14}
                                    className="text-[#1b4d8f] shrink-0"
                                  />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div
                        onClick={() => handleSelectStaff(null)}
                        className="p-1.5 border-t border-gray-100 text-[11px] text-[#1b4d8f] font-semibold hover:bg-gray-50 cursor-pointer rounded-lg text-center mt-1 shrink-0"
                      >
                        + Clear & enter new staff manually
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => {
                    setStaffName(e.target.value);
                    setStaffSearchQuery(e.target.value);
                    setSelectedStaffId("NEW");
                  }}
                  placeholder="Staff Name"
                  className="w-full bg-white text-[12px] p-2 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                />
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => {
                    setStaffEmail(e.target.value);
                    setSelectedStaffId("NEW");
                  }}
                  placeholder="Staff Email"
                  className="w-full bg-white text-[12px] p-2 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-2.5 pt-1 animate-fade-in">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#5d5b56]">
                Issue date *
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full bg-white text-[12.5px] p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#5d5b56]">
                Expected return *
              </label>
              <input
                type="date"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value)}
                className="w-full bg-white text-[12.5px] p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
              />
              <p className="text-[10px] text-[#7a7872] leading-tight pt-0.5">
                Default loan period is 14 days from issue date.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#5d5b56]">
                Purpose / project
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Thermal monitoring, Bhopal site"
                className="w-full bg-white text-[12.5px] p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase text-[#c92a2a] tracking-wider flex items-center gap-1">
                  <span>Instrument Photo (Mandatory) *</span>
                </label>
                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-[#1b4d8f] hover:bg-[#143d73] text-white text-[10.5px] font-medium py-1 px-2.5 rounded-lg transition-all flex items-center gap-1 active:scale-95 shadow-2xs cursor-pointer"
                >
                  <Camera size={12} />
                  <span>{capturedPhoto ? "Retake Photo" : "Take Photo"}</span>
                </button>
              </div>

              <input
                type="text"
                value={conditionOut}
                onChange={(e) => setConditionOut(e.target.value)}
                placeholder="Condition description..."
                className="w-full bg-white text-[12.5px] p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
              />

              {capturedPhoto ? (
                <div className="mt-2 p-2 bg-white rounded-xl border border-emerald-500 ring-1 ring-emerald-500 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={capturedPhoto}
                      alt="Instrument Condition"
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-[#12695a] flex items-center gap-1">
                        <CheckCircle2 size={12} /> Photo Captured
                      </span>
                      <p className="text-[10px] text-gray-500 truncate">
                        Mandatory issue photo recorded
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCapturedPhoto(null)}
                    className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="mt-2 p-2 bg-red-50/60 rounded-xl border border-dashed border-[#f5c2c2] text-[#8f2318] flex items-center gap-2 text-[11px]">
                  <AlertCircle size={15} className="shrink-0 text-red-500" />
                  <span>
                    A live camera photo of the instrument is required to proceed.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-2.5 animate-fade-in">
            <div className="bg-white p-3 rounded-2xl border border-black/10 space-y-1.5 text-[12px] shadow-xs">
              <div className="flex justify-between">
                <span className="text-[#7a7872]">Instrument</span>
                <span className="font-semibold text-[#1b1a18] text-right">
                  {selectedInstrument?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7872]">Asset ID</span>
                <span className="font-mono font-medium text-[#1b1a18]">
                  {selectedInstrument?.asset_id ||
                    selectedInstrument?.assetId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7872]">Checkout Quantity</span>
                <span className="font-bold text-[#1b4d8f]">
                  {issueQuantity} unit(s)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7872]">Borrower Scientist</span>
                <span className="font-semibold text-[#1b1a18]">
                  {selectedScientist?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7872]">Intermediary Staff</span>
                <span className="font-semibold text-[#1b1a18]">
                  {staffName.trim() ? staffName : "None specified"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7872]">Period</span>
                <span className="font-semibold text-[#1b1a18]">
                  {issueDate} → {expectedReturn}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7872]">Purpose</span>
                <span className="font-semibold text-[#1b1a18]">
                  {purpose.trim() ? purpose : "Not stated"}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 pt-1 mt-1">
                <span className="text-[#7a7872]">Condition Photo</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 size={12} /> Attached
                </span>
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
                    <h4 className="text-[12px] font-bold text-[#1b1a18]">
                      {selectedScientist?.name}
                    </h4>
                    <p className="font-mono text-[10px] text-[#5d5b56]">
                      {selectedScientist?.email}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-[#5d5b56]">
                  Borrower Scientist
                </span>
              </div>

              {staffEmail.trim() && (
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1b4d8f] mt-1.5 shrink-0" />
                    <div>
                      <h4 className="text-[12px] font-bold text-[#1b1a18]">
                        {staffName.trim() ? staffName : "Intermediary Staff"}
                      </h4>
                      <p className="font-mono text-[10px] text-[#5d5b56]">
                        {staffEmail}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#5d5b56]">
                    Intermediary Staff
                  </span>
                </div>
              )}

              <div className="border-t border-[#1b4d8f]/15 pt-1.5 text-[11px] leading-relaxed text-[#3f4d63]">
                {issueQuantity} unit(s) of {selectedInstrument?.name} (
                {selectedInstrument?.asset_id || selectedInstrument?.assetId})
                is issued to {selectedScientist?.name} from {issueDate} to{" "}
                {expectedReturn}.
              </div>
            </div>
          </div>
        )}
      </div>

      {isQrScannerOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-2xl border border-black/10 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-bold text-[#1b4d8f] flex items-center gap-1.5">
                <QrCode size={16} />
                Scan Asset QR Sticker
              </h3>
              <button
                type="button"
                onClick={() => setIsQrScannerOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl bg-black min-h-[220px]">
              <div id="qr-reader-container" className="w-full" />
            </div>

            <p className="text-[10.5px] text-[#5d5b56] text-center">
              Align the QR label on the instrument inside the box.
            </p>

            <button
              type="button"
              onClick={() => setIsQrScannerOpen(false)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Cancel Scanning
            </button>
          </div>
        </div>
      )}

      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm h-[70vh] bg-black rounded-3xl overflow-hidden flex flex-col justify-between p-3.5 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between text-white pb-1">
              <h3 className="text-xs font-bold flex items-center gap-1.5">
                <Camera size={14} className="text-[#1b4d8f]" />
                Capture Instrument Photo
              </h3>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative flex-1 bg-black rounded-2xl overflow-hidden flex items-center justify-center my-2">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-2 border-white/20 rounded-2xl pointer-events-none" />
            </div>

            <div className="pt-1 pb-1 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={stopCamera}
                className="bg-white/20 hover:bg-white/30 text-white text-xs px-4 py-2 rounded-xl transition-all font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={takePhoto}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border-4 border-[#1b4d8f] cursor-pointer"
              >
                <div className="w-8 h-8 bg-[#1b4d8f] rounded-full" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-gray-100 shrink-0 bg-[#f7f6f3]">
        {currentStep === 1 && (
          <button
            onClick={handleContinueStep1}
            className="w-full bg-[#1b4d8f] text-white py-2.5 rounded-xl text-[13px] font-semibold active:scale-98 transition-all shadow-xs text-center cursor-pointer"
          >
            Continue
          </button>
        )}

        {currentStep === 2 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="bg-white text-[#1b1a18] border border-gray-300 py-2.5 px-4 rounded-xl text-[12.5px] font-medium active:scale-98 transition-all cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleContinueStep2}
              className="flex-1 bg-[#1b4d8f] text-white py-2.5 rounded-xl text-[13px] font-semibold active:scale-98 transition-all shadow-xs text-center cursor-pointer"
            >
              Continue
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="bg-white text-[#1b1a18] border border-gray-300 py-2.5 px-4 rounded-xl text-[12.5px] font-medium active:scale-98 transition-all cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleContinueStep3}
              disabled={!capturedPhoto}
              className="flex-1 bg-[#1b4d8f] text-white py-2.5 rounded-xl text-[13px] font-semibold active:scale-98 transition-all shadow-xs text-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {currentStep === 4 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(3)}
              disabled={isSubmitting}
              className="bg-white text-[#1b1a18] border border-gray-300 py-2.5 px-4 rounded-xl text-[12.5px] font-medium active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleConfirmIssue}
              disabled={isSubmitting || !capturedPhoto}
              className="flex-1 bg-[#12695a] text-white py-2.5 rounded-xl text-[13px] font-bold active:scale-98 transition-all shadow-xs text-center flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Issuing...</span>
                </>
              ) : (
                "Confirm & send mail"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
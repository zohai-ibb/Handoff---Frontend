import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  X,
  CheckCircle2,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  QrCode,
  Info,
  UserPlus,
  User,
  Users,
  Package,
  CalendarDays,
  FileText,
  ShieldCheck,
  Mail,
  ArrowRight,
  Check,
  RefreshCw,
} from "lucide-react";

import { Html5QrcodeScanner } from "html5-qrcode";

import {
  getMyInstruments,
  getMyScientists,
  scanInstrumentByAssetId,
  issueInstrumentApi,
} from "../api/issueWizardService";

import { addScientistApi } from "../api/peopleService";

import axiosClient from "../api/axiosClient";
import { SERVER_BASE_URL } from "../api/config";

export default function IssueWizardScreen({
  onBack,
  onShowToast,
  onIssueComplete,
}) {
  /* =========================================================
     BASIC WIZARD STATE
  ========================================================= */

  const [currentStep, setCurrentStep] = useState(1);

  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* =========================================================
     DATA
  ========================================================= */

  const [availableInstruments, setAvailableInstruments] = useState([]);
  const [scientists, setScientists] = useState([]);
  const [savedStaffList, setSavedStaffList] = useState([]);

  /* =========================================================
     SEARCH
  ========================================================= */

  const [instrumentSearchQuery, setInstrumentSearchQuery] = useState("");
  const [scientistSearchQuery, setScientistSearchQuery] = useState("");
  const [staffSearchQuery, setStaffSearchQuery] = useState("");

  /* =========================================================
     INSTRUMENT
  ========================================================= */

  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [issueQuantity, setIssueQuantity] = useState(1);

  const [instrumentPage, setInstrumentPage] = useState(1);

  const ITEMS_PER_PAGE = 5;

  /* =========================================================
     SCIENTIST
  ========================================================= */

  const [selectedScientist, setSelectedScientist] = useState(null);

  const [isAddingScientist, setIsAddingScientist] = useState(false);

  const [newScientistName, setNewScientistName] = useState("");
  const [newScientistEmail, setNewScientistEmail] = useState("");
  const [newScientistDept, setNewScientistDept] = useState("APEEG");

  const [isCreatingScientist, setIsCreatingScientist] = useState(false);

  /* =========================================================
     STAFF
  ========================================================= */

  const [selectedStaff, setSelectedStaff] = useState(null);

  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");

  const [isAddingStaff, setIsAddingStaff] = useState(false);

  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");

  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

  /* =========================================================
     DATE / PURPOSE
  ========================================================= */

  const getTodayFormatted = () => {
    return new Date().toISOString().split("T")[0];
  };

  const getFourteenDaysLaterFormatted = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  };

  const [issueDate, setIssueDate] = useState(getTodayFormatted());

  const [expectedReturn, setExpectedReturn] = useState(
    getFourteenDaysLaterFormatted(),
  );

  const [purpose, setPurpose] = useState("");

  const [conditionOut, setConditionOut] = useState(
    "Complete with case and accessories",
  );

  /* =========================================================
     PHOTO CAMERA
  ========================================================= */

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  /* =========================================================
     QR SCANNER
  ========================================================= */

  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isScanningApi, setIsScanningApi] = useState(false);

  const qrScannerRef = useRef(null);

  /* =========================================================
     HELPERS
  ========================================================= */

  const showToast = (message) => {
    if (onShowToast) {
      onShowToast(message);
    }
  };

  const getId = (item) => {
    return item?.id || item?._id;
  };

  const getAssetId = (item) => {
    return item?.asset_id || item?.assetId || "";
  };

  const getInstrumentPhotoUrl = (item) => {
    const rawPath =
      item?.photoPath ||
      item?.photo_path ||
      item?.imageUrl ||
      item?.photoUrl ||
      item?.photo;

    if (!rawPath) return null;

    if (rawPath.startsWith("http") || rawPath.startsWith("data:")) {
      return `${rawPath}?t=${Date.now()}`;
    }

    const cleanBase = (SERVER_BASE_URL || "").replace(/\/+$/, "");
    const cleanPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

    return `${cleanBase}${cleanPath}`;
  };

  const getInitials = (name = "") => {
    const cleaned = String(name)
      .replace(/^(Dr\.|Er\.|Prof\.)\s+/i, "")
      .trim();

    if (!cleaned) return "U";

    return cleaned
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const formatError = (err) => {
    return (
      err?.response?.data?.message ||
      err?.response?.data ||
      err?.message ||
      "Something went wrong."
    );
  };

  /* =========================================================
     FETCH DATA
  ========================================================= */

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);

        const [instRes, sciRes, staffRes] = await Promise.all([
          getMyInstruments(),
          getMyScientists(),
          axiosClient
            .get("/staff-members")
            .catch(() => ({ data: [] })),
        ]);

        const instruments = Array.isArray(instRes) ? instRes : [];

        const availableOnly = instruments.filter((item) => {
          const status = String(item?.status || "").toUpperCase();

          return status === "AVAILABLE";
        });

        setAvailableInstruments(availableOnly);

        setScientists(Array.isArray(sciRes) ? sciRes : []);

        setSavedStaffList(
          Array.isArray(staffRes?.data) ? staffRes.data : [],
        );

        /* -----------------------------------------------------
           Restore instrument selected from Instrument Detail
        ----------------------------------------------------- */

        const storedInstrument = sessionStorage.getItem(
          "apeeg_issue_selected_instrument",
        );

        if (storedInstrument) {
          try {
            const instrumentFromDetail = JSON.parse(storedInstrument);

            const selectedFromInventory = availableOnly.find((item) => {
              const itemId = getId(item);
              const storedId = getId(instrumentFromDetail);

              const itemAssetId = getAssetId(item);
              const storedAssetId = getAssetId(instrumentFromDetail);

              return (
                (itemId &&
                  storedId &&
                  String(itemId) === String(storedId)) ||
                (itemAssetId &&
                  storedAssetId &&
                  String(itemAssetId).toLowerCase() ===
                    String(storedAssetId).toLowerCase())
              );
            });

            if (selectedFromInventory) {
              setSelectedInstrument(selectedFromInventory);
              setIssueQuantity(1);
              setInstrumentSearchQuery("");
              setCurrentStep(2);
            }

            sessionStorage.removeItem(
              "apeeg_issue_selected_instrument",
            );
          } catch (storageError) {
            console.error(
              "Failed to restore selected instrument:",
              storageError,
            );

            sessionStorage.removeItem(
              "apeeg_issue_selected_instrument",
            );
          }
        }
      } catch (err) {
        console.error("Issue Wizard loading error:", err);

        showToast(
          "Failed to load inventory: " + formatError(err),
        );
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  /* =========================================================
     QR SCANNER
  ========================================================= */

  useEffect(() => {
    if (!isQrScannerOpen) return;

    const styleEl = document.createElement("style");

    styleEl.id = "qr-scanner-custom-style";

    styleEl.innerHTML = `
      #qr-reader-container {
        border: none !important;
        width: 100% !important;
      }

      #qr-reader-container video {
        width: 100% !important;
        border-radius: 18px !important;
        object-fit: cover !important;
      }

      #qr-reader-container select {
        background: #0f172a !important;
        color: white !important;
        border: 1px solid #334155 !important;
        padding: 8px 10px !important;
        border-radius: 10px !important;
        font-size: 11px !important;
        margin-top: 8px !important;
        width: 100% !important;
      }

      #qr-reader-container button {
        background: #2563eb !important;
        color: white !important;
        border: none !important;
        padding: 8px 14px !important;
        border-radius: 10px !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        margin-top: 8px !important;
        cursor: pointer !important;
      }

      #qr-reader-container span {
        color: #cbd5e1 !important;
        font-size: 10px !important;
      }
    `;

    document.head.appendChild(styleEl);

    const scanner = new Html5QrcodeScanner(
      "qr-reader-container",
      {
        fps: 10,
        qrbox: {
          width: 220,
          height: 220,
        },
        aspectRatio: 1,
      },
      false,
    );

    qrScannerRef.current = scanner;

    let scanHandled = false;

    scanner.render(
      async (decodedText) => {
        if (scanHandled) return;

        scanHandled = true;

        try {
          await scanner.clear().catch(() => {});

          setIsQrScannerOpen(false);
          setIsScanningApi(true);

          const scannedText = decodedText.trim();

          let qrData;

          try {
            qrData = JSON.parse(scannedText);
          } catch {
            showToast(
              "Invalid QR code. Instrument details could not be read.",
            );
            return;
          }

          const assetId = qrData?.assetId;

          if (!assetId) {
            showToast("Invalid QR code: Asset ID not found.");
            return;
          }

          const scannedInstrument =
            await scanInstrumentByAssetId(assetId);

          if (!scannedInstrument) {
            showToast(
              `Instrument ${assetId} was not found.`,
            );
            return;
          }

          const scannedAssetId = getAssetId(scannedInstrument);

          const inventoryInstrument =
            availableInstruments.find((item) => {
              const inventoryAssetId = getAssetId(item);

              return (
                inventoryAssetId &&
                scannedAssetId &&
                inventoryAssetId
                  .trim()
                  .toLowerCase() ===
                  scannedAssetId.trim().toLowerCase()
              );
            });

          if (!inventoryInstrument) {
            showToast(
              `Instrument ${scannedAssetId} is not available in inventory.`,
            );
            return;
          }

          setSelectedInstrument(inventoryInstrument);
          setIssueQuantity(1);
          setInstrumentSearchQuery("");
          setCurrentStep(2);
        } catch (err) {
          console.error("QR scan error:", err);
          showToast("QR scan failed.");
        } finally {
          setIsScanningApi(false);
        }
      },
      () => {},
    );

    return () => {
      const existingStyle = document.getElementById(
        "qr-scanner-custom-style",
      );

      if (existingStyle) {
        existingStyle.remove();
      }

      if (qrScannerRef.current) {
        qrScannerRef.current.clear().catch(() => {});
        qrScannerRef.current = null;
      }
    };
  }, [isQrScannerOpen, availableInstruments]);

  /* =========================================================
     FILTERS
  ========================================================= */

  const filteredInstruments = availableInstruments.filter(
    (inst) => {
      const q = instrumentSearchQuery
        .toLowerCase()
        .trim();

      if (!q) return true;

      return (
        String(inst?.name || "")
          .toLowerCase()
          .includes(q) ||
        String(inst?.asset_id || "")
          .toLowerCase()
          .includes(q) ||
        String(inst?.assetId || "")
          .toLowerCase()
          .includes(q)
      );
    },
  );

  const filteredScientists = scientists.filter((sc) => {
    const q = scientistSearchQuery
      .toLowerCase()
      .trim();

    if (!q) return true;

    return (
      String(sc?.name || "")
        .toLowerCase()
        .includes(q) ||
      String(sc?.email || "")
        .toLowerCase()
        .includes(q) ||
      String(sc?.department || "")
        .toLowerCase()
        .includes(q)
    );
  });

  const filteredStaffList = savedStaffList.filter((staff) => {
    const q = staffSearchQuery
      .toLowerCase()
      .trim();

    if (!q) return true;

    return (
      String(staff?.name || "")
        .toLowerCase()
        .includes(q) ||
      String(staff?.email || "")
        .toLowerCase()
        .includes(q)
    );
  });

  const totalInstrumentPages =
    Math.ceil(
      filteredInstruments.length / ITEMS_PER_PAGE,
    ) || 1;

  const paginatedInstruments =
    filteredInstruments.slice(
      (instrumentPage - 1) * ITEMS_PER_PAGE,
      instrumentPage * ITEMS_PER_PAGE,
    );

  useEffect(() => {
    setInstrumentPage(1);
  }, [instrumentSearchQuery]);

  /* =========================================================
     ADD SCIENTIST
  ========================================================= */

  const handleAddNewScientist = async (e) => {
    if (e) e.preventDefault();

    const name = newScientistName.trim();
    const email = newScientistEmail
      .trim()
      .toLowerCase();

    const department =
      newScientistDept.trim() || "APEEG";

    if (!name || !email) {
      showToast(
        "Please provide both scientist name and email.",
      );
      return;
    }

    const existingScientist = scientists.find(
      (scientist) => {
        const existingName = String(
          scientist?.name || "",
        )
          .trim()
          .toLowerCase();

        const existingEmail = String(
          scientist?.email || "",
        )
          .trim()
          .toLowerCase();

        return (
          existingEmail === email ||
          existingName === name.toLowerCase()
        );
      },
    );

    if (existingScientist) {
      setSelectedScientist(existingScientist);

      setScientistSearchQuery("");
      setIsAddingScientist(false);

      setNewScientistName("");
      setNewScientistEmail("");
      setNewScientistDept("APEEG");

      showToast(
        `${existingScientist.name || "Scientist"} already exists and has been selected.`,
      );

      return;
    }

    try {
      setIsCreatingScientist(true);

      const savedScientist = await addScientistApi({
        name,
        email,
        mobile: "",
        department,
        role: "Scientist",
      });

      const createdScientist =
        savedScientist?.scientist ||
        savedScientist;

      if (!createdScientist) {
        throw new Error(
          "Scientist was not returned by the server.",
        );
      }

      setScientists((prev) => [
        ...prev,
        createdScientist,
      ]);

      setSelectedScientist(createdScientist);

      setScientistSearchQuery("");
      setIsAddingScientist(false);

      setNewScientistName("");
      setNewScientistEmail("");
      setNewScientistDept("APEEG");

      showToast(
        `Scientist ${
          createdScientist.name || name
        } saved and selected.`,
      );
    } catch (err) {
      console.error(
        "Failed to create scientist:",
        err,
      );

      showToast(
        "Failed to save scientist: " +
          formatError(err),
      );
    } finally {
      setIsCreatingScientist(false);
    }
  };

  /* =========================================================
     ADD STAFF
  ========================================================= */

  const handleAddNewStaff = async (e) => {
    if (e) e.preventDefault();

    const name = newStaffName.trim();

    const email = newStaffEmail
      .trim()
      .toLowerCase();

    if (!name || !email) {
      showToast(
        "Please provide staff name and email.",
      );
      return;
    }

    const existingStaff = savedStaffList.find(
      (staff) => {
        const existingName = String(
          staff?.name || "",
        )
          .trim()
          .toLowerCase();

        const existingEmail = String(
          staff?.email || "",
        )
          .trim()
          .toLowerCase();

        return (
          existingEmail === email ||
          existingName === name.toLowerCase()
        );
      },
    );

    if (existingStaff) {
      setSelectedStaff(existingStaff);

      setStaffName(
        existingStaff.name || "",
      );

      setStaffEmail(
        existingStaff.email || "",
      );

      setStaffSearchQuery("");
      setIsAddingStaff(false);

      setNewStaffName("");
      setNewStaffEmail("");

      showToast(
        `${existingStaff.name || "Staff member"} already exists and has been selected.`,
      );

      return;
    }

    try {
      setIsCreatingStaff(true);

      const res = await axiosClient.post(
        "/staff-members",
        {
          name,
          email,
        },
      );

      const createdStaff = res?.data;

      if (!createdStaff) {
        throw new Error(
          "Staff member was not returned by the server.",
        );
      }

      setSavedStaffList((prev) => [
        ...prev,
        createdStaff,
      ]);

      setSelectedStaff(createdStaff);

      setStaffName(
        createdStaff.name || name,
      );

      setStaffEmail(
        createdStaff.email || email,
      );

      setStaffSearchQuery("");
      setIsAddingStaff(false);

      setNewStaffName("");
      setNewStaffEmail("");

      showToast(
        `Staff member ${
          createdStaff.name || name
        } saved and selected.`,
      );
    } catch (err) {
      console.error(
        "Failed to create staff:",
        err,
      );

      showToast(
        "Failed to save staff member: " +
          formatError(err),
      );
    } finally {
      setIsCreatingStaff(false);
    }
  };

  /* =========================================================
     CAMERA
  ========================================================= */

  const startCamera = async () => {
    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        showToast(
          "Camera is not supported by this browser.",
        );
        return;
      }

      setIsCameraOpen(true);

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
          },
          audio: false,
        });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        try {
          await videoRef.current.play();
        } catch {
          // Browser may start playback automatically.
        }
      }
    } catch (err) {
      console.error("Camera error:", err);

      showToast(
        "Unable to access live camera. Please allow camera permission.",
      );

      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    const video = videoRef.current;

    if (!video) {
      showToast("Camera is not ready.");
      return;
    }

    if (
      !video.videoWidth ||
      !video.videoHeight
    ) {
      showToast(
        "Camera is still starting. Please try again.",
      );
      return;
    }

    const canvas =
      document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      showToast("Unable to capture photo.");
      return;
    }

    ctx.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const dataUrl =
      canvas.toDataURL("image/jpeg", 0.9);

    setCapturedPhoto(dataUrl);

    stopCamera();

    showToast(
      "Instrument condition photo captured.",
    );
  };

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop(),
          );
      }
    };
  }, []);

  /* =========================================================
     STEP NAVIGATION
  ========================================================= */

  const handleContinueStep1 = () => {
    if (!selectedInstrument) {
      showToast(
        "Please select or scan an instrument.",
      );
      return;
    }

    const availableQty =
      Number(selectedInstrument?.quantity) || 1;

    const quantity =
      Number(issueQuantity);

    if (
      !quantity ||
      quantity < 1 ||
      quantity > availableQty
    ) {
      showToast(
        `Select a quantity between 1 and ${availableQty}.`,
      );
      return;
    }

    setIssueQuantity(quantity);

    setCurrentStep(2);
  };

  const handleContinueStep2 = () => {
    if (!selectedScientist) {
      showToast(
        "Please select a Borrower Scientist.",
      );
      return;
    }

    setCurrentStep(3);
  };

  const handleContinueStep3 = () => {
    if (!issueDate || !expectedReturn) {
      showToast(
        "Issue date and expected return date are required.",
      );
      return;
    }

    if (
      new Date(expectedReturn) <
      new Date(issueDate)
    ) {
      showToast(
        "Expected return date cannot be before the issue date.",
      );
      return;
    }

    if (!capturedPhoto) {
      showToast(
        "Instrument condition photo is required.",
      );
      return;
    }

    setCurrentStep(4);
  };

  /* =========================================================
     CONFIRM ISSUE
  ========================================================= */

  const handleConfirmIssue = async () => {
    if (!selectedInstrument) {
      showToast("Instrument is missing.");
      return;
    }

    if (!selectedScientist) {
      showToast("Borrower Scientist is missing.");
      return;
    }

    if (!capturedPhoto) {
      showToast(
        "Instrument condition photo is required.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const targetScientistId =
        selectedScientist.id ||
        selectedScientist._id;

      const instrumentId =
        selectedInstrument.id ||
        selectedInstrument._id;

      if (!targetScientistId) {
        throw new Error(
          "Scientist ID is missing.",
        );
      }

      if (!instrumentId) {
        throw new Error(
          "Instrument ID is missing.",
        );
      }

      const payload = {
        instrumentId,
        scientistListId: targetScientistId,

        quantity: Number(issueQuantity),

        staffName:
          staffName.trim() || null,

        staffEmail:
          staffEmail.trim() || null,

        issueDate,

        dueDate: expectedReturn,

        purpose:
          purpose.trim() || null,

        conditionOut:
          conditionOut.trim() ||
          "Complete with case and accessories",
      };

      await issueInstrumentApi(
        payload,
        capturedPhoto,
      );

      const staffText = staffName.trim()
        ? `, ${staffName}`
        : "";

      showToast(
        `Issued ${issueQuantity} unit(s) successfully to ${selectedScientist.name}${staffText}.`,
      );

      if (onIssueComplete) {
        onIssueComplete();
      }
    } catch (err) {
      console.error(
        "Issue confirmation error:",
        err,
      );

      showToast(
        "Checkout Error: " +
          formatError(err),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================
     LOADING SCREEN
  ========================================================= */

  if (loadingData) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f7f8fb]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1b4d8f]/10 flex items-center justify-center">
            <Loader2
              size={24}
              className="text-[#1b4d8f] animate-spin"
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-bold text-[#1b1a18]">
              Preparing Issue Wizard
            </p>

            <p className="text-[11px] text-gray-500 mt-0.5">
              Loading inventory and people...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     STEP INFORMATION
  ========================================================= */

  const steps = [
    {
      number: 1,
      title: "Instrument",
      icon: Package,
    },
    {
      number: 2,
      title: "People",
      icon: Users,
    },
    {
      number: 3,
      title: "Details",
      icon: CalendarDays,
    },
    {
      number: 4,
      title: "Confirm",
      icon: CheckCircle2,
    },
  ];

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="relative h-full flex flex-col overflow-hidden bg-[#f7f8fb] text-[#1b1a18]">
      {/* HEADER */}
      <div className="shrink-0 px-1 pt-1 pb-3">
        <div className="flex items-center gap-2.5 mb-4">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#1b4d8f] hover:bg-[#eef3fa] active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-bold text-[#1b4d8f]">
              Issue Instrument
            </h2>

            <p className="text-[10.5px] text-gray-500">
              Complete the details below to issue an instrument
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-sm">
          <div className="flex items-center">
            {steps.map((step, index) => {
              const Icon = step.icon;

              const completed = currentStep > step.number;
              const active = currentStep === step.number;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        completed
                          ? "bg-[#12695a] text-white"
                          : active
                            ? "bg-[#1b4d8f] text-white shadow-md shadow-[#1b4d8f]/20"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {completed ? (
                        <Check size={15} />
                      ) : (
                        <Icon size={15} />
                      )}
                    </div>

                    <span
                      className={`text-[9.5px] mt-1.5 font-semibold ${
                        active
                          ? "text-[#1b4d8f]"
                          : completed
                            ? "text-[#12695a]"
                            : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 mb-5 rounded-full ${
                        currentStep > step.number
                          ? "bg-[#12695a]"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-1 pb-3">
        {/* STEP 1 */}
        {currentStep === 1 && (
          <div className="space-y-3 animate-fade-in">
            {/* QR CARD */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#eef3fa] to-white border border-[#1b4d8f]/15 p-4 shadow-sm">
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-[#1b4d8f]/5" />

              <div className="relative text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-[#1b4d8f]/20 flex items-center justify-center shadow-sm mb-2.5">
                  <QrCode
                    size={27}
                    className="text-[#1b4d8f]"
                  />
                </div>

                <h3 className="text-sm font-bold text-[#1b4d8f]">
                  Scan Instrument QR
                </h3>

                <p className="text-[10.5px] text-gray-500 max-w-xs mx-auto mt-1 leading-relaxed">
                  Scan the QR label attached to the instrument and we will automatically select it for you.
                </p>

                <button
                  type="button"
                  disabled={isScanningApi}
                  onClick={() => setIsQrScannerOpen(true)}
                  className="mt-3 inline-flex items-center justify-center gap-2 bg-[#1b4d8f] hover:bg-[#143d73] text-white px-4 py-2 rounded-xl text-[11px] font-semibold shadow-sm active:scale-95 transition-all disabled:opacity-60"
                >
                  {isScanningApi ? (
                    <>
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                      Fetching instrument...
                    </>
                  ) : (
                    <>
                      <Camera size={14} />
                      Open QR Camera
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[10px] font-medium text-gray-400">
                OR SELECT MANUALLY
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* SEARCH */}
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-3 text-gray-400"
              />

              <input
                type="text"
                value={instrumentSearchQuery}
                onChange={(e) => setInstrumentSearchQuery(e.target.value)}
                placeholder="Search instrument or asset ID..."
                className="w-full h-10 bg-white rounded-xl border border-gray-200 pl-9 pr-9 text-[11.5px] outline-none focus:border-[#1b4d8f] focus:ring-2 focus:ring-[#1b4d8f]/10 transition-all"
              />

              {instrumentSearchQuery && (
                <button
                  type="button"
                  onClick={() => setInstrumentSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-700"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* INSTRUMENT LIST */}
            <div className="space-y-2">
              {filteredInstruments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-7 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 mx-auto flex items-center justify-center mb-2">
                    <Package
                      size={21}
                      className="text-gray-400"
                    />
                  </div>

                  <p className="text-xs font-semibold text-gray-600">
                    No instruments found
                  </p>

                  <p className="text-[10px] text-gray-400 mt-1">
                    {instrumentSearchQuery
                      ? "Try another search term."
                      : "There are currently no available instruments."}
                  </p>
                </div>
              ) : (
                paginatedInstruments.map((item) => {
                  const instId = getId(item);
                  const isSelected = String(getId(selectedInstrument)) === String(instId);
                  const maxQuantity = Number(item?.quantity) || 1;
                  const photoUrl = getInstrumentPhotoUrl(item);

                  return (
                    <button
                      type="button"
                      key={instId}
                      onClick={() => {
                        setSelectedInstrument(item);
                        setIssueQuantity(1);
                      }}
                      className={`w-full text-left bg-white rounded-2xl border p-3 transition-all ${
                        isSelected
                          ? "border-[#1b4d8f] ring-2 ring-[#1b4d8f]/10 bg-[#f7faff]"
                          : "border-gray-200 hover:border-[#1b4d8f]/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border ${
                            isSelected
                              ? "border-[#1b4d8f] bg-[#1b4d8f]"
                              : "border-gray-200 bg-[#eef3fa]"
                          }`}
                        >
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={item?.name || "Instrument"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                if (e.currentTarget.nextSibling) {
                                  e.currentTarget.nextSibling.style.display = "flex";
                                }
                              }}
                            />
                          ) : null}

                          <div
                            className={`w-full h-full flex items-center justify-center ${
                              photoUrl ? "hidden" : "flex"
                            } ${isSelected ? "text-white" : "text-[#1b4d8f]"}`}
                          >
                            <Package size={20} />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-[12.5px] font-bold truncate">
                            {item?.name || "Unnamed Instrument"}
                          </h4>

                          <p className="text-[9.5px] font-mono text-gray-500 mt-0.5 truncate">
                            {getAssetId(item)}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-[#1b4d8f] text-white flex items-center justify-center shrink-0">
                            <Check size={13} />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2.5">
                        <span className="text-[9.5px] text-gray-400">
                          Quantity in stock: {maxQuantity}
                        </span>
                      </div>

                      {isSelected && maxQuantity > 1 && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between"
                        >
                          <span className="text-[10.5px] font-semibold text-gray-600">
                            Issue quantity
                          </span>

                          <input
                            type="number"
                            min="1"
                            max={maxQuantity}
                            value={issueQuantity}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "") {
                                setIssueQuantity("");
                                return;
                              }
                              const parsed = parseInt(value, 10);
                              if (!Number.isNaN(parsed)) {
                                setIssueQuantity(parsed);
                              }
                            }}
                            onBlur={() => {
                              let value = parseInt(issueQuantity, 10);
                              if (Number.isNaN(value) || value < 1) value = 1;
                              if (value > maxQuantity) value = maxQuantity;
                              setIssueQuantity(value);
                            }}
                            className="w-16 h-8 text-center text-xs font-bold border border-gray-200 rounded-lg outline-none focus:border-[#1b4d8f]"
                          />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* PAGINATION */}
            {filteredInstruments.length > ITEMS_PER_PAGE && (
              <div className="bg-white rounded-xl border border-gray-200 px-3 py-2 flex items-center justify-between">
                <button
                  type="button"
                  disabled={instrumentPage === 1}
                  onClick={() => setInstrumentPage((prev) => prev - 1)}
                  className="flex items-center gap-1 text-[10.5px] font-semibold text-[#1b4d8f] disabled:text-gray-300"
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>

                <span className="text-[10px] font-medium text-gray-500">
                  {instrumentPage} / {totalInstrumentPages}
                </span>

                <button
                  type="button"
                  disabled={instrumentPage === totalInstrumentPages}
                  onClick={() => setInstrumentPage((prev) => prev + 1)}
                  className="flex items-center gap-1 text-[10.5px] font-semibold text-[#1b4d8f] disabled:text-gray-300"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <div className="space-y-3 animate-fade-in">
            {/* SELECTED INSTRUMENT */}
            <div className="bg-linear-to-r from-[#1b4d8f] to-[#285f9f] text-white rounded-2xl p-3.5 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Package size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase tracking-wider text-white/65 font-bold">
                    Selected Instrument
                  </p>

                  <h3 className="text-[12.5px] font-bold truncate mt-0.5">
                    {selectedInstrument?.name || "Instrument"}
                  </h3>

                  <p className="text-[9.5px] text-white/70 font-mono mt-0.5 truncate">
                    {getAssetId(selectedInstrument)}
                  </p>
                </div>

                <div className="bg-white/15 rounded-xl px-2.5 py-1.5 text-center shrink-0">
                  <p className="text-[8px] text-white/60">QTY</p>

                  <p className="text-sm font-bold">{issueQuantity}</p>
                </div>
              </div>
            </div>

            {/* BORROWER SCIENTIST */}
            <div className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#eef3fa] text-[#1b4d8f] flex items-center justify-center">
                    <UserCheckIcon />
                  </div>

                  <div>
                    <h3 className="text-[12px] font-bold">Borrower Scientist</h3>
                    <p className="text-[9.5px] text-gray-400">
                      Person receiving the instrument
                    </p>
                  </div>
                </div>

                <span className="text-[9px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                  REQUIRED
                </span>
              </div>

              {selectedScientist ? (
                <div className="bg-[#f7faff] border border-[#1b4d8f]/20 rounded-2xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1b4d8f] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      {getInitials(selectedScientist.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-[12.5px] font-bold truncate">
                        {selectedScientist.name}
                      </h4>

                      <p className="text-[9.5px] text-gray-500 font-mono truncate mt-0.5">
                        {selectedScientist.email}
                      </p>

                      {selectedScientist.department && (
                        <span className="inline-block mt-1 text-[8.5px] font-semibold text-[#1b4d8f] bg-[#1b4d8f]/10 px-1.5 py-0.5 rounded-md">
                          {selectedScientist.department}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedScientist(null);
                        setScientistSearchQuery("");
                        setIsAddingScientist(false);
                      }}
                      className="text-[10px] font-semibold text-[#1b4d8f] border border-[#1b4d8f]/20 bg-white px-2.5 py-1.5 rounded-lg hover:bg-[#1b4d8f] hover:text-white transition-all"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-2.5 text-gray-400"
                    />

                    <input
                      type="text"
                      value={scientistSearchQuery}
                      onChange={(e) => setScientistSearchQuery(e.target.value)}
                      placeholder="Search name or email..."
                      className="w-full h-9 bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-8 text-[11px] outline-none focus:bg-white focus:border-[#1b4d8f] transition-all"
                    />

                    {scientistSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setScientistSearchQuery("")}
                        className="absolute right-2.5 top-2 text-gray-400"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {scientistSearchQuery.trim() ? (
                    <div className="mt-2 space-y-1.5">
                      {filteredScientists.length > 0 ? (
                        filteredScientists.map((scientist) => {
                          const scientistId = getId(scientist);

                          return (
                            <button
                              type="button"
                              key={scientistId}
                              onClick={() => {
                                setSelectedScientist(scientist);
                                setScientistSearchQuery("");
                                setIsAddingScientist(false);
                              }}
                              className="w-full text-left flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 hover:border-[#1b4d8f]/30 hover:bg-[#f7faff] transition-all"
                            >
                              <div className="w-8 h-8 rounded-full bg-[#eef3fa] text-[#1b4d8f] flex items-center justify-center text-[10px] font-bold shrink-0">
                                {getInitials(scientist.name)}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-[11.5px] font-semibold truncate">
                                  {scientist.name}
                                </p>

                                <p className="text-[9px] text-gray-500 font-mono truncate mt-0.5">
                                  {scientist.email}
                                </p>
                              </div>

                              <ArrowRight size={13} className="text-gray-300" />
                            </button>
                          );
                        })
                      ) : (
                        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-3 text-center">
                          <p className="text-[10.5px] font-semibold text-gray-500">
                            No scientist found
                          </p>

                          <p className="text-[9px] text-gray-400 mt-0.5">
                            Add this scientist instead.
                          </p>

                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingScientist(true);
                              setNewScientistName(scientistSearchQuery.trim());
                            }}
                            className="mt-2 h-8 px-3 rounded-lg bg-[#1b4d8f] text-white text-[10px] font-semibold inline-flex items-center justify-center gap-1.5"
                          >
                            <UserPlus size={13} />
                            Add New Scientist
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-3 text-center">
                      <Search size={17} className="mx-auto text-gray-300 mb-1" />
                      <p className="text-[10px] text-gray-400">
                        Start typing to search for a scientist.
                      </p>
                    </div>
                  )}
                </>
              )}

              {isAddingScientist && !selectedScientist && (
                <div className="mt-3 bg-[#f8fafc] border border-[#1b4d8f]/20 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <UserPlus size={14} className="text-[#1b4d8f]" />
                      <span className="text-[11px] font-bold text-[#1b4d8f]">
                        Add Scientist
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingScientist(false);
                        setNewScientistName("");
                        setNewScientistEmail("");
                        setNewScientistDept("APEEG");
                      }}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newScientistName}
                      onChange={(e) => setNewScientistName(e.target.value)}
                      placeholder="Full name *"
                      className="w-full h-9 bg-white border border-gray-200 rounded-xl px-3 text-[10.5px] outline-none focus:border-[#1b4d8f]"
                    />

                    <input
                      type="email"
                      value={newScientistEmail}
                      onChange={(e) => setNewScientistEmail(e.target.value)}
                      placeholder="Official email *"
                      className="w-full h-9 bg-white border border-gray-200 rounded-xl px-3 text-[10.5px] outline-none focus:border-[#1b4d8f]"
                    />

                    <input
                      type="text"
                      value={newScientistDept}
                      onChange={(e) => setNewScientistDept(e.target.value)}
                      placeholder="Department"
                      className="w-full h-9 bg-white border border-gray-200 rounded-xl px-3 text-[10.5px] outline-none focus:border-[#1b4d8f]"
                    />
                  </div>

                  <div className="flex gap-2 mt-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingScientist(false)}
                      className="flex-1 h-9 rounded-xl bg-white border border-gray-200 text-gray-600 text-[10.5px] font-semibold"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={isCreatingScientist}
                      onClick={handleAddNewScientist}
                      className="flex-1 h-9 rounded-xl bg-[#1b4d8f] text-white text-[10.5px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isCreatingScientist ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check size={13} />
                          Save & Select
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* INTERMEDIARY STAFF */}
            <div className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Users size={15} />
                  </div>

                  <div>
                    <h3 className="text-[12px] font-bold">Intermediary Staff</h3>
                    <p className="text-[9.5px] text-gray-400">
                      Optional contact for this issue
                    </p>
                  </div>
                </div>

                <span className="text-[9px] font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                  OPTIONAL
                </span>
              </div>

              {selectedStaff ? (
                <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      {getInitials(selectedStaff.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-[12.5px] font-bold truncate">
                        {selectedStaff.name}
                      </h4>

                      <p className="text-[9.5px] text-gray-500 font-mono truncate mt-0.5">
                        {selectedStaff.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStaff(null);
                        setStaffName("");
                        setStaffEmail("");
                        setStaffSearchQuery("");
                        setIsAddingStaff(false);
                      }}
                      className="text-[10px] font-semibold text-purple-600 border border-purple-200 bg-white px-2.5 py-1.5 rounded-lg hover:bg-purple-600 hover:text-white transition-all"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-2.5 text-gray-400"
                    />

                    <input
                      type="text"
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      placeholder="Search staff by name or email..."
                      className="w-full h-9 bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-8 text-[11px] outline-none focus:bg-white focus:border-purple-500 transition-all"
                    />

                    {staffSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setStaffSearchQuery("")}
                        className="absolute right-2.5 top-2 text-gray-400"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {staffSearchQuery.trim() ? (
                    <div className="mt-2 space-y-1.5">
                      {filteredStaffList.length > 0 ? (
                        filteredStaffList.map((staff) => {
                          const staffId = getId(staff);

                          return (
                            <button
                              type="button"
                              key={staffId}
                              onClick={() => {
                                setSelectedStaff(staff);
                                setStaffName(staff.name || "");
                                setStaffEmail(staff.email || "");
                                setStaffSearchQuery("");
                                setIsAddingStaff(false);
                              }}
                              className="w-full text-left flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/40 transition-all"
                            >
                              <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {getInitials(staff.name)}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-[11.5px] font-semibold truncate">
                                  {staff.name}
                                </p>

                                <p className="text-[9px] text-gray-500 font-mono truncate mt-0.5">
                                  {staff.email}
                                </p>
                              </div>

                              <ArrowRight size={13} className="text-gray-300" />
                            </button>
                          );
                        })
                      ) : (
                        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-3 text-center">
                          <p className="text-[10.5px] font-semibold text-gray-500">
                            No staff member found
                          </p>

                          <p className="text-[9px] text-gray-400 mt-0.5">
                            Add this staff member instead.
                          </p>

                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingStaff(true);
                              setNewStaffName(staffSearchQuery.trim());
                            }}
                            className="mt-2 h-8 px-3 rounded-lg bg-purple-600 text-white text-[10px] font-semibold inline-flex items-center justify-center gap-1.5"
                          >
                            <UserPlus size={13} />
                            Add New Staff Member
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-3 text-center">
                      <Search size={17} className="mx-auto text-gray-300 mb-1" />
                      <p className="text-[10px] text-gray-400">
                        Start typing to search for a staff member.
                      </p>
                    </div>
                  )}
                </>
              )}

              {isAddingStaff && !selectedStaff && (
                <div className="mt-3 bg-purple-50/40 border border-purple-100 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <UserPlus size={14} className="text-purple-600" />
                      <span className="text-[11px] font-bold text-purple-700">
                        Add Staff Member
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingStaff(false)}
                      className="text-gray-400"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="Staff full name *"
                      className="w-full h-9 bg-white border border-gray-200 rounded-xl px-3 text-[10.5px] outline-none focus:border-purple-500"
                    />

                    <input
                      type="email"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      placeholder="Staff email *"
                      className="w-full h-9 bg-white border border-gray-200 rounded-xl px-3 text-[10.5px] outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex gap-2 mt-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingStaff(false)}
                      className="flex-1 h-9 rounded-xl bg-white border border-gray-200 text-gray-600 text-[10.5px] font-semibold"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={isCreatingStaff}
                      onClick={handleAddNewStaff}
                      className="flex-1 h-9 rounded-xl bg-purple-600 text-white text-[10.5px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isCreatingStaff ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check size={13} />
                          Save & Select
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <div className="space-y-3 animate-fade-in">
            {/* DATES */}
            <div className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#eef3fa] text-[#1b4d8f] flex items-center justify-center">
                  <CalendarDays size={15} />
                </div>

                <div>
                  <h3 className="text-[12px] font-bold">Issue Period</h3>
                  <p className="text-[9.5px] text-gray-400">
                    Set when the instrument will be issued and returned
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                    Issue Date *
                  </label>

                  <input
                    type="date"
                    value={issueDate}
                    min={getTodayFormatted()}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-2.5 text-[11px] outline-none focus:bg-white focus:border-[#1b4d8f]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                    Expected Return *
                  </label>

                  <input
                    type="date"
                    value={expectedReturn}
                    min={issueDate || getTodayFormatted()}
                    onChange={(e) => setExpectedReturn(e.target.value)}
                    className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-2.5 text-[11px] outline-none focus:bg-white focus:border-[#1b4d8f]"
                  />
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2 bg-[#eef3fa] rounded-xl px-2.5 py-2">
                <Info size={13} className="text-[#1b4d8f] shrink-0" />
                <p className="text-[9.5px] text-[#53657d]">
                  Default loan period is 14 days. You can change the return date above.
                </p>
              </div>
            </div>

            {/* PURPOSE */}
            <div className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FileText size={15} />
                </div>

                <div>
                  <h3 className="text-[12px] font-bold">Purpose / Project</h3>
                  <p className="text-[9.5px] text-gray-400">
                    Tell us why this instrument is being issued
                  </p>
                </div>
              </div>

              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                placeholder="e.g. Thermal monitoring at Bhopal site..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-[11px] resize-none outline-none focus:bg-white focus:border-[#1b4d8f]"
              />
            </div>

            {/* CONDITION PHOTO */}
            <div className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                    <Camera size={15} />
                  </div>

                  <div>
                    <h3 className="text-[12px] font-bold">Instrument Condition</h3>
                    <p className="text-[9.5px] text-gray-400">
                      Photo is mandatory before issuing
                    </p>
                  </div>
                </div>

                <span className="text-[9px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                  REQUIRED
                </span>
              </div>

              <input
                type="text"
                value={conditionOut}
                onChange={(e) => setConditionOut(e.target.value)}
                placeholder="Condition description..."
                className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-[10.5px] outline-none focus:bg-white focus:border-[#1b4d8f]"
              />

              {capturedPhoto ? (
                <div className="mt-3 rounded-2xl overflow-hidden border border-emerald-200 bg-emerald-50/40">
                  <div className="relative">
                    <img
                      src={capturedPhoto}
                      alt="Instrument condition"
                      className="w-full h-40 object-cover"
                    />

                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-emerald-600 text-white px-2 py-1 rounded-lg text-[9px] font-semibold shadow-sm">
                      <CheckCircle2 size={12} />
                      Photo Captured
                    </div>

                    <button
                      type="button"
                      onClick={() => setCapturedPhoto(null)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center backdrop-blur-sm"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="p-2.5 flex items-center justify-between">
                    <span className="text-[9.5px] text-emerald-700 font-medium">
                      Instrument condition photo attached
                    </span>

                    <button
                      type="button"
                      onClick={startCamera}
                      className="text-[9.5px] font-semibold text-[#1b4d8f] flex items-center gap-1"
                    >
                      <RefreshCw size={12} />
                      Retake
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-red-200 bg-red-50/60 p-4 text-center">
                  <div className="w-11 h-11 rounded-2xl bg-white mx-auto flex items-center justify-center text-red-400 shadow-sm">
                    <Camera size={20} />
                  </div>

                  <p className="text-[10.5px] font-semibold text-red-700 mt-2">
                    No photo captured
                  </p>

                  <p className="text-[9px] text-red-500/80 mt-0.5">
                    A live photo is required before continuing.
                  </p>

                  <button
                    type="button"
                    onClick={startCamera}
                    className="mt-3 inline-flex items-center gap-1.5 bg-[#1b4d8f] text-white px-3.5 py-2 rounded-xl text-[10px] font-semibold shadow-sm active:scale-95"
                  >
                    <Camera size={13} />
                    Take Instrument Photo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {currentStep === 4 && (
          <div className="space-y-3 animate-fade-in">
            {/* SUCCESS HEADER */}
            <div className="bg-linear-to-br from-[#12695a] to-[#18816e] rounded-3xl p-5 text-white text-center shadow-md">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/15 flex items-center justify-center mb-2">
                <CheckCircle2 size={29} />
              </div>

              <h3 className="text-base font-bold">Ready to Issue</h3>

              <p className="text-[10px] text-white/75 mt-1">
                Review the information before confirming.
              </p>
            </div>

            {/* SUMMARY */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-3.5 py-3 border-b border-gray-100">
                <h3 className="text-[12px] font-bold">Issue Summary</h3>
              </div>

              <div className="divide-y divide-gray-100">
                <SummaryRow
                  icon={<Package size={13} />}
                  label="Instrument"
                  value={selectedInstrument?.name || "—"}
                />

                <SummaryRow
                  icon={<QrCode size={13} />}
                  label="Asset ID"
                  value={getAssetId(selectedInstrument)}
                  mono
                />

                <SummaryRow
                  icon={<Package size={13} />}
                  label="Quantity"
                  value={`${issueQuantity} unit(s)`}
                  highlight
                />

                <SummaryRow
                  icon={<User size={13} />}
                  label="Borrower Scientist"
                  value={selectedScientist?.name || "—"}
                />

                <SummaryRow
                  icon={<Users size={13} />}
                  label="Intermediary Staff"
                  value={staffName.trim() || "None specified"}
                />

                <SummaryRow
                  icon={<CalendarDays size={13} />}
                  label="Issue Period"
                  value={`${issueDate} → ${expectedReturn}`}
                />

                <SummaryRow
                  icon={<FileText size={13} />}
                  label="Purpose"
                  value={purpose.trim() || "Not stated"}
                />

                <SummaryRow
                  icon={<Camera size={13} />}
                  label="Condition Photo"
                  value="Attached"
                  success
                />
              </div>
            </div>

            {/* EMAIL CARD */}
            <div className="bg-[#eef3fa] border border-[#1b4d8f]/15 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-white text-[#1b4d8f] flex items-center justify-center">
                  <Mail size={15} />
                </div>

                <div>
                  <h3 className="text-[12px] font-bold text-[#1b4d8f]">
                    Confirmation Email
                  </h3>

                  <p className="text-[9.5px] text-gray-500">
                    Notification will be sent to
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-white rounded-xl p-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1b4d8f] text-white flex items-center justify-center text-[9px] font-bold">
                    {getInitials(selectedScientist?.name)}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10.5px] font-bold truncate">
                      {selectedScientist?.name}
                    </p>

                    <p className="text-[9px] text-gray-500 font-mono truncate">
                      {selectedScientist?.email}
                    </p>
                  </div>
                </div>

                {staffEmail.trim() && (
                  <div className="bg-white rounded-xl p-2.5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] font-bold">
                      {getInitials(staffName)}
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10.5px] font-bold truncate">
                        {staffName || "Intermediary Staff"}
                      </p>

                      <p className="text-[9px] text-gray-500 font-mono truncate">
                        {staffEmail}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-[#1b4d8f]/10">
                <p className="text-[9.5px] leading-relaxed text-[#53657d]">
                  {issueQuantity} unit(s) of{" "}
                  <strong>{selectedInstrument?.name}</strong> will be issued to{" "}
                  <strong>{selectedScientist?.name}</strong> from{" "}
                  <strong>{issueDate}</strong> to <strong>{expectedReturn}</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR SCANNER MODAL */}
      {isQrScannerOpen && (
        <div className="fixed inset-0 z-100 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <QrCode size={18} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">
                    Scan Instrument QR
                  </h3>

                  <p className="text-[9.5px] text-slate-400 mt-0.5">
                    Point the camera at the QR label
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsQrScannerOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4">
              <div className="relative overflow-hidden rounded-2xl bg-black border border-slate-800 min-h-67.5 flex items-center justify-center">
                <div id="qr-reader-container" className="w-full" />
              </div>

              <div className="mt-3 flex gap-2 bg-slate-800/70 border border-slate-700 rounded-xl p-2.5">
                <Info size={15} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[9.5px] text-slate-300 leading-relaxed">
                  Keep the QR code inside the scanner area. The instrument will be selected automatically after a successful scan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsQrScannerOpen(false)}
                className="w-full mt-3 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE CAMERA MODAL */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm h-[78vh] max-h-175 bg-black rounded-3xl overflow-hidden border border-white/15 shadow-2xl flex flex-col">
            <div className="px-4 py-3 flex items-center justify-between text-white shrink-0">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Camera size={16} className="text-blue-400" />
                  Capture Instrument Photo
                </h3>

                <p className="text-[9px] text-white/50 mt-0.5">
                  Capture the current physical condition
                </p>
              </div>

              <button
                type="button"
                onClick={stopCamera}
                className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative flex-1 bg-black overflow-hidden mx-3 rounded-2xl">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />

              <div className="absolute inset-4 border-2 border-white/20 rounded-2xl pointer-events-none" />

              <div className="absolute bottom-5 left-0 right-0 text-center pointer-events-none">
                <span className="inline-block bg-black/50 backdrop-blur-sm text-white text-[9px] px-3 py-1.5 rounded-full">
                  Keep the entire instrument visible
                </span>
              </div>
            </div>

            <div className="px-4 py-4 flex items-center justify-center gap-5 shrink-0">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-[10.5px] font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={takePhoto}
                className="w-16 h-16 rounded-full bg-white border-[5px] border-[#1b4d8f] flex items-center justify-center shadow-xl active:scale-90 transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-[#1b4d8f]" />
              </button>

              <div className="w-17" />
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM ACTION BAR */}
      <div className="shrink-0 bg-[#f7f8fb] border-t border-gray-200 px-1 pt-2 pb-1">
        {currentStep === 1 && (
          <button
            type="button"
            onClick={handleContinueStep1}
            className="w-full h-11 rounded-xl bg-[#1b4d8f] hover:bg-[#143d73] text-white text-[12px] font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all"
          >
            Continue
            <ArrowRight size={15} />
          </button>
        )}

        {currentStep === 2 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="h-11 px-4 rounded-xl bg-white border border-gray-200 text-gray-700 text-[11px] font-semibold flex items-center gap-1.5"
            >
              <ChevronLeft size={15} />
              Back
            </button>

            <button
              type="button"
              onClick={handleContinueStep2}
              className="flex-1 h-11 rounded-xl bg-[#1b4d8f] text-white text-[12px] font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              Continue
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="h-11 px-4 rounded-xl bg-white border border-gray-200 text-gray-700 text-[11px] font-semibold flex items-center gap-1.5"
            >
              <ChevronLeft size={15} />
              Back
            </button>

            <button
              type="button"
              onClick={handleContinueStep3}
              disabled={!capturedPhoto}
              className="flex-1 h-11 rounded-xl bg-[#1b4d8f] text-white text-[12px] font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Review Issue
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {currentStep === 4 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              disabled={isSubmitting}
              className="h-11 px-4 rounded-xl bg-white border border-gray-200 text-gray-700 text-[11px] font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <ChevronLeft size={15} />
              Back
            </button>

            <button
              type="button"
              onClick={handleConfirmIssue}
              disabled={isSubmitting || !capturedPhoto}
              className="flex-1 h-11 rounded-xl bg-[#12695a] hover:bg-[#0f5a4d] text-white text-[12px] font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Issuing Instrument...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Confirm & Send Mail
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SMALL REUSABLE COMPONENTS
========================================================= */

function UserCheckIcon() {
  return (
    <span className="relative">
      <User size={15} />
      <span className="absolute -right-1 -bottom-1 w-2.5 h-2.5 rounded-full bg-[#1b4d8f] text-white flex items-center justify-center">
        <Check size={6} />
      </span>
    </span>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  mono = false,
  highlight = false,
  success = false,
}) {
  return (
    <div className="flex items-start gap-2.5 px-3.5 py-2.5">
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
          success
            ? "bg-emerald-50 text-emerald-600"
            : highlight
              ? "bg-[#eef3fa] text-[#1b4d8f]"
              : "bg-gray-100 text-gray-500"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
          {label}
        </p>

        <p
          className={`text-[10.5px] mt-0.5 wrap-break-word ${
            mono
              ? "font-mono"
              : highlight
                ? "font-bold text-[#1b4d8f]"
                : success
                  ? "font-semibold text-emerald-600"
                  : "font-semibold text-gray-700"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
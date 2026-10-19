import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Edit3,
  LogOut,
  Loader2,
  AlertCircle,
  Eye,
  Clock,
  CheckCircle,
  ImageIcon,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  ClipboardList,
  FileSpreadsheet,
  Camera,
  Upload,
} from "lucide-react";

import jsPDF from "jspdf";
import { downloadFileToDevice } from "../utils/fileDownloader";

const PAGE_SIZE = 5;

export default function ProfileScreen({
  user,
  onLogout,
  onShowToast,
  onUpdateUser,
}) {
  const BASE_URL = "http://192.168.1.34:8080";

  // =========================================================
  // VIEW MODE SWITCH ("issues" | "instruments")
  // =========================================================
  const [activeTab, setActiveTab] = useState("issues");

  // =========================================================
  // PERSON DATA
  // =========================================================
  const [person, setPerson] = useState({
    id: user?.id || "",
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    department: user?.department || "APEEG",
    photo_path: user?.photo_path || null,
    is_active: user?.is_active ?? true,
    created_at: user?.created_at || new Date().toISOString(),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...person });
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Camera Controls
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const fileInputRef = useRef(null);

  // =========================================================
  // ISSUE RECORDS DATA & PREVIEW
  // =========================================================
  const [issueRecordsList, setIssueRecordsList] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedIssuePreview, setSelectedIssuePreview] = useState(null);
  const [issueCurrentPage, setIssueCurrentPage] = useState(1);

  // =========================================================
  // INSTRUMENTS DATA & PREVIEW
  // =========================================================
  const [instrumentsList, setInstrumentsList] = useState([]);
  const [instrumentsLoading, setInstrumentsLoading] = useState(false);
  const [selectedInstrumentPreview, setSelectedInstrumentPreview] = useState(null);
  const [instrumentCurrentPage, setInstrumentCurrentPage] = useState(1);

  // =========================================================
  // EXPORT / GENERATION LOADING STATES
  // =========================================================
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [isDownloadingInstrumentsExcel, setIsDownloadingInstrumentsExcel] = useState(false);
  const [isDownloadingIssuesExcel, setIsDownloadingIssuesExcel] = useState(false);

  // =========================================================
  // CONFIRMATION DIALOG
  // =========================================================
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    actionType: null,
  });

  // =========================================================
  // SYNC USER
  // =========================================================
  useEffect(() => {
    if (user) {
      const updated = {
        id: user.id || "",
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        department: user.department || "APEEG",
        photo_path: user.photo_path || null,
        is_active: user.is_active ?? true,
        created_at: user.created_at || new Date().toISOString(),
      };
      setPerson(updated);
      setFormData(updated);
    }
  }, [user]);

  // =========================================================
  // FETCH ISSUE RECORDS & INSTRUMENTS
  // =========================================================
  useEffect(() => {
    if (person.id) {
      fetchScientistIssueRecords();
      fetchScientistInstruments();
    }
  }, [person.id]);

  const fetchScientistIssueRecords = async () => {
    setPreviewLoading(true);
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const response = await fetch(
        `${BASE_URL}/api/issue-records/owner/${person.id}`,
        { headers }
      );

      if (response.ok) {
        const issueData = await response.json();
        const sortedData = [...(issueData || [])].reverse();
        setIssueRecordsList(sortedData);
        setIssueCurrentPage(1);
      }
    } catch (err) {
      console.error("Failed to load issue records:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const fetchScientistInstruments = async () => {
    setInstrumentsLoading(true);
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const response = await fetch(
        `${BASE_URL}/api/instruments/owner/${person.id}`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        setInstrumentsList(data || []);
        setInstrumentCurrentPage(1);
      }
    } catch (err) {
      console.error("Failed to load instruments:", err);
    } finally {
      setInstrumentsLoading(false);
    }
  };

  // =========================================================
  // IMAGE URL & HELPERS
  // =========================================================
  const resolvePhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith("data:")) return photoPath;
    const fullPath = photoPath.startsWith("http")
      ? photoPath
      : `${BASE_URL}${photoPath}`;
    return `${fullPath}?t=${Date.now()}`;
  };

  const renderAvatar = (photoPath, name) => {
    if (photoPath) {
      return (
        <img
          src={resolvePhotoUrl(photoPath)}
          alt={name || "Avatar"}
          className="w-14 h-14 rounded-full object-cover shrink-0 border-2 border-[#1b4d8f]/20"
        />
      );
    }

    return (
      <div className="w-14 h-14 rounded-full bg-[#1b4d8f] text-white flex items-center justify-center font-bold text-lg shrink-0 border-2 border-[#1b4d8f]/20">
        {name
          ? name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()
          : "AP"}
      </div>
    );
  };

  const getRecordValue = (rec, camel, snake, fallback = "") => {
    return rec?.[camel] ?? rec?.[snake] ?? fallback;
  };

  // =========================================================
  // EDIT PROFILE & PHOTO LOGIC
  // =========================================================
  const handleEditClick = () => {
    const cleanMobile = (person.mobile || "").replace(/\D/g, "").slice(-10);
    setFormData({ ...person, mobile: cleanMobile });
    setSelectedPhotoFile(null);
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "mobile") {
      setFormData((prev) => ({
        ...prev,
        mobile: value.replace(/\D/g, "").slice(0, 10),
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // File Picker Handler
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          photo_path: reader.result,
        }));
      };
      reader.readAsDataURL(file);
      if (onShowToast) onShowToast("New photo selected!");
    }
  };

  // Camera Handlers
  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      if (onShowToast) onShowToast("Unable to access live camera.");
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

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `profile_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setSelectedPhotoFile(file);
        setFormData((prev) => ({
          ...prev,
          photo_path: canvas.toDataURL("image/jpeg"),
        }));
      }
    }, "image/jpeg");

    stopCamera();
    if (onShowToast) onShowToast("Photo captured!");
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleSavePrompt = (e) => {
    e.preventDefault();
    if (formData.mobile && formData.mobile.length !== 10) {
      if (onShowToast) onShowToast("Mobile number must be exactly 10 digits!");
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "Confirm Profile Update",
      message: "Are you sure you want to save changes to your profile details?",
      actionType: "SAVE",
    });
  };

  const executeSave = async () => {
    if (!person.id) return;
    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      // Step 1: Update details
      const response = await fetch(`${BASE_URL}/api/persons/${person.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile ? `+91 ${formData.mobile}` : "",
          department: formData.department,
          is_active: formData.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile details.");
      }

      let updatedPersonData = await response.json();

      // Step 2: Upload photo if modified
      if (selectedPhotoFile) {
        const photoFormData = new FormData();
        photoFormData.append("photo", selectedPhotoFile);

        const photoResponse = await fetch(
          `${BASE_URL}/api/persons/${person.id}/photo`,
          {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: photoFormData,
          }
        );

        if (!photoResponse.ok) {
          throw new Error("Failed to upload profile photo.");
        }

        updatedPersonData = await photoResponse.json();
      }

      setPerson(updatedPersonData);
      setFormData(updatedPersonData);
      setIsEditing(false);
      setSelectedPhotoFile(null);

      if (onUpdateUser) onUpdateUser(updatedPersonData);
      if (onShowToast) onShowToast("Profile updated successfully!");
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Error updating profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // PDF HELPER UTILITIES
  // =========================================================
  const imageToDataURL = async (imageUrl) => {
    if (!imageUrl) return null;
    try {
      const response = await fetch(imageUrl, { cache: "no-cache" });
      if (!response.ok) return null;
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Image conversion failed:", error);
      return null;
    }
  };

  const waitForImage = (src) => {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  const addImageToPDF = async (pdf, imageUrl, x, y, width, height) => {
    if (!imageUrl) return;
    try {
      const dataUrl = await imageToDataURL(imageUrl);
      if (!dataUrl) return;
      const img = await waitForImage(dataUrl);
      if (!img) return;
      pdf.addImage(dataUrl, "JPEG", x, y, width, height);
    } catch (error) {
      console.error("Could not add image to PDF:", error);
    }
  };

  // =========================================================
  // PDF GENERATOR 1: ISSUE RECORDS
  // =========================================================
  const createIssuePDF = async (records) => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;

    for (let index = 0; index < records.length; index++) {
      const rec = records[index];
      if (index > 0) pdf.addPage();

      // Header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(18, 105, 90);
      pdf.text("APEEG", margin, 16);

      pdf.setFontSize(13);
      pdf.setTextColor(27, 77, 143);
      pdf.text("Instrument Issue & Condition Audit", margin, 24);

      pdf.setDrawColor(18, 105, 90);
      pdf.line(margin, 28, pageWidth - margin, 28);

      // Instrument Details
      const instrumentName = rec.instrument?.name || "Instrument";
      const assetId = rec.instrument?.assetId || rec.instrument?.asset_id || "N/A";

      pdf.setTextColor(27, 26, 24);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${index + 1}. ${instrumentName}`, margin, 39);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Asset ID: ${assetId}`, margin, 46);

      // Metadata Table
      let y = 56;
      const borrower = getRecordValue(rec, "borrowerScientist", "borrower_scientist", {});
      const borrowerName = borrower?.name || "N/A";
      const staffName = getRecordValue(rec, "staffName", "staff_name", "Direct Issue");
      const staffEmail = getRecordValue(rec, "staffEmail", "staff_email", "N/A");
      const issueDate = getRecordValue(rec, "issueDate", "issue_date", "N/A");
      const dueDate = getRecordValue(rec, "dueDate", "due_date", "N/A");
      const actualReturnDate = getRecordValue(rec, "actualReturnDate", "actual_return_date", "Pending");
      const state = rec.state || "OPEN";
      const purpose = rec.purpose || "N/A";

      const details = [
        ["Borrower Scientist", borrowerName],
        ["Handling Staff Member", `${staffName} (${staffEmail})`],
        ["Issue Date", issueDate],
        ["Due Return Date", dueDate],
        ["Actual Return Date", actualReturnDate],
        ["Status", state],
        ["Purpose / Work", purpose],
      ];

      pdf.setFontSize(9.5);
      details.forEach(([label, value]) => {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(85, 85, 85);
        pdf.text(`${label}:`, margin, y);

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(30, 30, 30);
        const wrapped = pdf.splitTextToSize(String(value), pageWidth - margin * 2 - 45);
        pdf.text(wrapped, margin + 45, y);
        y += Math.max(6, wrapped.length * 4.5);
      });

      // Condition Photos
      y += 5;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(18, 105, 90);
      pdf.text("Physical Condition Photos Audit", margin, y);
      y += 7;

      const checkoutPath = rec.condition_photo_path || rec.conditionPhotoPath;
      const returnPath = rec.condition_in_photo_path || rec.conditionInPhotoPath;
      const checkoutUrl = resolvePhotoUrl(checkoutPath);
      const returnUrl = resolvePhotoUrl(returnPath);
      const photoWidth = 88;
      const photoHeight = 60;

      // Checkout Box
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(margin, y, photoWidth, 78);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(50, 50, 50);
      pdf.text("Checkout Photo", margin + 4, y + 7);

      if (checkoutUrl) {
        await addImageToPDF(pdf, checkoutUrl, margin + 4, y + 11, photoWidth - 8, photoHeight);
      } else {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(8);
        pdf.setTextColor(130, 130, 130);
        pdf.text("No checkout photo", margin + 4, y + 40);
      }

      const conditionOut = getRecordValue(rec, "conditionOut", "condition_out", "N/A");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(50, 50, 50);
      const conditionOutText = pdf.splitTextToSize(`Condition: ${conditionOut}`, photoWidth - 8);
      pdf.text(conditionOutText, margin + 4, y + 70);

      // Check-in Box
      const secondX = margin + photoWidth + 8;
      pdf.rect(secondX, y, photoWidth, 78);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(18, 105, 90);
      pdf.text("Check-in Photo", secondX + 4, y + 7);

      if (returnUrl) {
        await addImageToPDF(pdf, returnUrl, secondX + 4, y + 11, photoWidth - 8, photoHeight);
      } else {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(8);
        pdf.setTextColor(130, 130, 130);
        pdf.text(state === "RETURNED" ? "No return photo" : "Pending return", secondX + 4, y + 40);
      }

      const conditionIn = getRecordValue(rec, "conditionIn", "condition_in", "N/A");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(50, 50, 50);
      const conditionInText = pdf.splitTextToSize(`Condition: ${conditionIn}`, photoWidth - 8);
      pdf.text(conditionInText, secondX + 4, y + 70);

      // Footer
      pdf.setFontSize(7);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Generated from APEEG • ${new Date().toLocaleString()}`, margin, pageHeight - 8);
      pdf.text(`Page ${index + 1} of ${records.length}`, pageWidth - margin - 25, pageHeight - 8);
    }

    return pdf;
  };

  // =========================================================
  // PDF GENERATOR 2: INSTRUMENTS
  // =========================================================
  const createInstrumentsPDF = async (items) => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;

    for (let index = 0; index < items.length; index++) {
      const inst = items[index];
      if (index > 0) pdf.addPage();

      // Header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(27, 77, 143);
      pdf.text("APEEG", margin, 16);

      pdf.setFontSize(13);
      pdf.setTextColor(18, 105, 90);
      pdf.text("Instrument Asset Inventory Audit", margin, 24);

      pdf.setDrawColor(27, 77, 143);
      pdf.line(margin, 28, pageWidth - margin, 28);

      // Title & Asset ID
      pdf.setTextColor(27, 26, 24);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${index + 1}. ${inst.name || "Instrument"}`, margin, 39);

      const assetId = inst.assetId || inst.asset_id || "N/A";
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Asset ID: ${assetId}`, margin, 46);

      // Instrument Details Table
      let y = 56;
      const make = inst.make || "N/A";
      const serialNo = inst.serialNo || inst.serial_no || "N/A";
      const location = inst.location || "N/A";
      const status = inst.status || "AVAILABLE";
      const calibrationValidTo = inst.calibrationValidTo || inst.calibration_valid_to || "N/A";
      const purchaseDate = inst.purchaseDate || inst.purchase_date || "N/A";
      const purchaseCost = inst.purchaseCost || inst.purchase_cost ? `₹ ${inst.purchaseCost || inst.purchase_cost}` : "N/A";

      const details = [
        ["Manufacturer / Make", make],
        ["Serial Number", serialNo],
        ["Storage Location", location],
        ["Current Availability Status", status],
        ["Calibration Valid Until", calibrationValidTo],
        ["Purchase Date", purchaseDate],
        ["Purchase Cost", purchaseCost],
      ];

      pdf.setFontSize(9.5);
      details.forEach(([label, value]) => {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(85, 85, 85);
        pdf.text(`${label}:`, margin, y);

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(30, 30, 30);
        const wrapped = pdf.splitTextToSize(String(value), pageWidth - margin * 2 - 45);
        pdf.text(wrapped, margin + 45, y);
        y += Math.max(6, wrapped.length * 4.5);
      });

      // Photo & QR
      y += 8;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(27, 77, 143);
      pdf.text("Asset Photo & Digital Tracking QR Code", margin, y);
      y += 7;

      const photoPath = inst.photoPath || inst.photo_path;
      const qrPath = inst.qrPhoto || inst.qr_photo;
      const photoUrl = resolvePhotoUrl(photoPath);
      const qrUrl = resolvePhotoUrl(qrPath);
      const photoWidth = 88;
      const photoHeight = 65;

      // Photo Box
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(margin, y, photoWidth, 75);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(50, 50, 50);
      pdf.text("Instrument Photo", margin + 4, y + 7);

      if (photoUrl) {
        await addImageToPDF(pdf, photoUrl, margin + 4, y + 11, photoWidth - 8, photoHeight - 5);
      } else {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(8);
        pdf.setTextColor(130, 130, 130);
        pdf.text("No photo available", margin + 4, y + 38);
      }

      // QR Code Box
      const secondX = margin + photoWidth + 8;
      pdf.rect(secondX, y, photoWidth, 75);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(27, 77, 143);
      pdf.text("Asset QR Code", secondX + 4, y + 7);

      if (qrUrl) {
        await addImageToPDF(pdf, qrUrl, secondX + 18, y + 12, 50, 50);
      } else {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(8);
        pdf.setTextColor(130, 130, 130);
        pdf.text("No QR Code generated", secondX + 4, y + 38);
      }

      // Footer
      pdf.setFontSize(7);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Generated from APEEG • ${new Date().toLocaleString()}`, margin, pageHeight - 8);
      pdf.text(`Page ${index + 1} of ${items.length}`, pageWidth - margin - 25, pageHeight - 8);
    }

    return pdf;
  };

  // =========================================================
  // DOWNLOAD PDF DISPATCHER
  // =========================================================
  const downloadPDF = async (itemsToDownload, type = "issues", closeModal = false) => {
    const records = Array.isArray(itemsToDownload) ? itemsToDownload : [itemsToDownload];

    if (!records.length) {
      if (onShowToast) onShowToast(`No ${type === "issues" ? "issue records" : "instruments"} available.`);
      return;
    }

    if (pdfGenerating) return;
    setPdfGenerating(true);

    try {
      if (onShowToast) onShowToast("Preparing PDF...");

      const pdf = type === "issues" 
        ? await createIssuePDF(records)
        : await createInstrumentsPDF(records);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = type === "issues"
        ? (records.length === 1 ? `APEEG_Issue_Record_${timestamp}.pdf` : `APEEG_Issue_Audit_${timestamp}.pdf`)
        : (records.length === 1 ? `APEEG_Instrument_${timestamp}.pdf` : `APEEG_Instruments_Catalog_${timestamp}.pdf`);

      const pdfBlob = pdf.output("blob");

      const result = await downloadFileToDevice(pdfBlob, filename, "application/pdf");

      if (onShowToast) {
        onShowToast(
          result?.isNative
            ? "Saved PDF to Documents folder!"
            : "PDF downloaded successfully!"
        );
      }

      if (closeModal) {
        setSelectedIssuePreview(null);
        setSelectedInstrumentPreview(null);
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
      if (onShowToast) onShowToast("Unable to download PDF. Please try again.");
    } finally {
      setPdfGenerating(false);
    }
  };

  // =========================================================
  // EXCEL EXPORTS (With unique timestamp)
  // =========================================================
  const handleDownloadInstrumentsExcel = async () => {
    if (!person.id) return;
    try {
      setIsDownloadingInstrumentsExcel(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/persons/${person.id}/export-instruments`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to export instruments Excel.");

      const blob = await response.blob();
      const cleanName = (person.name || "Scientist").replace(/\s+/g, "_");
      
      const now = new Date();
      const timestamp = `${now.toISOString().split("T")[0]}_${now.getHours().toString().padStart(2, "0")}-${now.getMinutes().toString().padStart(2, "0")}-${now.getSeconds().toString().padStart(2, "0")}`;
      const fileName = `${cleanName}_Instruments_${timestamp}.xlsx`;

      const result = await downloadFileToDevice(
        blob,
        fileName,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      if (onShowToast) {
        onShowToast(
          result?.isNative
            ? "Saved Instruments Excel report to Documents!"
            : "Instruments Excel report downloaded!"
        );
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Error exporting Excel.");
    } finally {
      setIsDownloadingInstrumentsExcel(false);
    }
  };

  const handleDownloadIssuesExcel = async () => {
    if (!person.id) return;
    try {
      setIsDownloadingIssuesExcel(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/persons/${person.id}/export-issue-records`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to export issue records Excel.");

      const blob = await response.blob();
      const cleanName = (person.name || "Scientist").replace(/\s+/g, "_");
      
      const now = new Date();
      const timestamp = `${now.toISOString().split("T")[0]}_${now.getHours().toString().padStart(2, "0")}-${now.getMinutes().toString().padStart(2, "0")}-${now.getSeconds().toString().padStart(2, "0")}`;
      const fileName = `${cleanName}_Issue_Records_${timestamp}.xlsx`;

      const result = await downloadFileToDevice(
        blob,
        fileName,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      if (onShowToast) {
        onShowToast(
          result?.isNative
            ? "Saved Issue Records Excel report to Documents!"
            : "Issue Records Excel report downloaded!"
        );
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Error exporting Excel.");
    } finally {
      setIsDownloadingIssuesExcel(false);
    }
  };

  // =========================================================
  // PAGINATION COMPUTATION
  // =========================================================
  // Issues Pagination
  const totalIssuePages = Math.ceil(issueRecordsList.length / PAGE_SIZE) || 1;
  const issueStartIndex = (issueCurrentPage - 1) * PAGE_SIZE;
  const slicedIssueRecords = issueRecordsList.slice(issueStartIndex, issueStartIndex + PAGE_SIZE);

  // Instruments Pagination
  const totalInstrumentPages = Math.ceil(instrumentsList.length / PAGE_SIZE) || 1;
  const instrumentStartIndex = (instrumentCurrentPage - 1) * PAGE_SIZE;
  const slicedInstruments = instrumentsList.slice(instrumentStartIndex, instrumentStartIndex + PAGE_SIZE);

  return (
    <div className="space-y-4 font-sans text-[#1b1a18] animate-fade-in relative pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#1b4d8f]">User Profile</h2>
      </div>

      {/* --- Profile Card (Image 2 style with Phone Number & Right Circular Action Buttons) --- */}
      <div className="bg-white p-4 rounded-2xl border border-black/10 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {renderAvatar(person.photo_path, person.name)}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[#1b1a18] truncate leading-tight">
              {person.name || "Scientist Profile"}
            </h3>
            <p className="text-xs text-[#5d5b56] mt-0.5 font-medium flex items-center gap-1">
              <Phone size={11} className="text-[#1b4d8f] shrink-0" />
              <span>{person.mobile || "Phone not set"}</span>
            </p>
            <p className="text-[11px] font-mono text-gray-400 mt-0.5 truncate">
              {person.email}
            </p>
          </div>
        </div>

        {/* Circular Action Buttons on Right Side */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleEditClick}
            title="Edit Profile"
            className="w-9 h-9 rounded-full bg-[#1b4d8f]/10 text-[#1b4d8f] hover:bg-[#1b4d8f] hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <Edit3 size={15} />
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={() =>
                setConfirmDialog({
                  isOpen: true,
                  title: "Sign Out",
                  message: "Are you sure you want to sign out?",
                  actionType: "LOGOUT",
                })
              }
              title="Sign Out"
              className="w-9 h-9 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>

      {!isEditing ? (
        <div className="space-y-4">
          {/* =====================================================
              SEGMENTED TOGGLE SWITCH (ISSUE RECORDS vs INSTRUMENTS)
          ===================================================== */}
          <div className="bg-[#eef3fa] p-1 rounded-2xl flex items-center border border-[#1b4d8f]/10 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab("issues")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "issues"
                  ? "bg-white text-[#12695a] shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <ClipboardList size={15} />
              <span>Issue Records</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("instruments")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "instruments"
                  ? "bg-white text-[#1b4d8f] shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <PackageCheck size={15} />
              <span>Instruments</span>
            </button>
          </div>

          {/* =====================================================
              TAB CONTENT 1: ISSUE RECORDS
          ===================================================== */}
          {activeTab === "issues" && (
            <div className="bg-white p-4 rounded-2xl border border-black/10 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Eye size={16} className="text-[#12695a] shrink-0" />
                  <h4 className="text-xs font-bold text-[#12695a] uppercase tracking-wider truncate">
                    Issue Records Audit
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {issueRecordsList.length} Records
                  </span>

                  <button
                    type="button"
                    onClick={() => downloadPDF(issueRecordsList, "issues")}
                    disabled={issueRecordsList.length === 0 || pdfGenerating}
                    className="flex items-center gap-1 bg-[#12695a] hover:bg-[#0e5246] text-white text-[10.5px] font-semibold px-2.5 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    {pdfGenerating ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Download size={12} />
                    )}
                    <span>{pdfGenerating ? "Creating..." : "Download PDF"}</span>
                  </button>
                </div>
              </div>

              <p className="text-[11.5px] text-[#5d5b56] leading-relaxed">
                Displaying latest issue records. Tap any record to inspect details or download individual PDF audit.
              </p>

              {previewLoading ? (
                <div className="py-6 flex items-center justify-center text-xs text-gray-400 gap-2">
                  <Loader2 size={16} className="animate-spin text-[#12695a]" />
                  <span>Loading issue history...</span>
                </div>
              ) : issueRecordsList.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No issue records logged yet.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {slicedIssueRecords.map((rec) => (
                      <div
                        key={rec.id || rec._id}
                        onClick={() => setSelectedIssuePreview(rec)}
                        className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-[#eef8f5]/50 transition-all flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="flex -space-x-2 shrink-0">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-200 border border-white shadow-xs flex items-center justify-center">
                            {rec.condition_photo_path || rec.conditionPhotoPath ? (
                              <img
                                src={resolvePhotoUrl(rec.condition_photo_path || rec.conditionPhotoPath)}
                                alt="Checkout"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon size={14} className="text-gray-400" />
                            )}
                          </div>

                          {(rec.condition_in_photo_path || rec.conditionInPhotoPath) && (
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-emerald-100 border border-white shadow-xs">
                              <img
                                src={resolvePhotoUrl(rec.condition_in_photo_path || rec.conditionInPhotoPath)}
                                alt="Return"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className="text-xs font-bold text-[#1b1a18] truncate group-hover:text-[#12695a]">
                              {rec.instrument?.name || "Instrument Loan"}
                            </h5>

                            <span
                              className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                                rec.state === "RETURNED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {rec.state || "OPEN"}
                            </span>
                          </div>

                          <p className="text-[10.5px] text-gray-500 truncate">
                            Borrower:{" "}
                            <span className="font-semibold text-gray-700">
                              {rec.borrowerScientist?.name || rec.borrower_scientist?.name || "N/A"}
                            </span>
                          </p>
                        </div>

                        <Eye size={14} className="text-gray-400 group-hover:text-[#12695a] shrink-0" />
                      </div>
                    ))}
                  </div>

                  {/* Issues Pagination */}
                  {totalIssuePages > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[12px] text-[#5d5b56]">
                      <button
                        type="button"
                        disabled={issueCurrentPage === 1}
                        onClick={() => setIssueCurrentPage((prev) => Math.max(1, prev - 1))}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-xl font-medium shadow-2xs disabled:opacity-40 transition-all cursor-pointer"
                      >
                        <ChevronLeft size={14} />
                        <span>Prev</span>
                      </button>

                      <span className="font-semibold text-[11px]">
                        Page {issueCurrentPage} of {totalIssuePages}
                      </span>

                      <button
                        type="button"
                        disabled={issueCurrentPage === totalIssuePages}
                        onClick={() => setIssueCurrentPage((prev) => Math.min(totalIssuePages, prev + 1))}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-xl font-medium shadow-2xs disabled:opacity-40 transition-all cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* =====================================================
              TAB CONTENT 2: INSTRUMENTS
          ===================================================== */}
          {activeTab === "instruments" && (
            <div className="bg-white p-4 rounded-2xl border border-black/10 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <PackageCheck size={16} className="text-[#1b4d8f] shrink-0" />
                  <h4 className="text-xs font-bold text-[#1b4d8f] uppercase tracking-wider truncate">
                    Owned Instruments
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {instrumentsList.length} Items
                  </span>

                  <button
                    type="button"
                    onClick={() => downloadPDF(instrumentsList, "instruments")}
                    disabled={instrumentsList.length === 0 || pdfGenerating}
                    className="flex items-center gap-1 bg-[#1b4d8f] hover:bg-[#143d73] text-white text-[10.5px] font-semibold px-2.5 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    {pdfGenerating ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Download size={12} />
                    )}
                    <span>{pdfGenerating ? "Creating..." : "Download PDF"}</span>
                  </button>
                </div>
              </div>

              <p className="text-[11.5px] text-[#5d5b56] leading-relaxed">
                Displaying instruments assigned to your ownership. Tap any instrument to preview full spec sheet or download PDF.
              </p>

              {instrumentsLoading ? (
                <div className="py-6 flex items-center justify-center text-xs text-gray-400 gap-2">
                  <Loader2 size={16} className="animate-spin text-[#1b4d8f]" />
                  <span>Loading instrument inventory...</span>
                </div>
              ) : instrumentsList.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No instruments assigned under your profile.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {slicedInstruments.map((inst) => (
                      <div
                        key={inst.id || inst._id}
                        onClick={() => setSelectedInstrumentPreview(inst)}
                        className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-[#eef3fa]/50 transition-all flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 border border-white shadow-xs shrink-0 flex items-center justify-center">
                          {inst.photoPath || inst.photo_path ? (
                            <img
                              src={resolvePhotoUrl(inst.photoPath || inst.photo_path)}
                              alt={inst.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={16} className="text-gray-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className="text-xs font-bold text-[#1b1a18] truncate group-hover:text-[#1b4d8f]">
                              {inst.name || "Instrument"}
                            </h5>

                            <span
                              className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                                inst.status === "AVAILABLE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {inst.status || "AVAILABLE"}
                            </span>
                          </div>

                          <p className="text-[10.5px] text-gray-500 font-mono truncate">
                            Make: {inst.make || "N/A"}
                          </p>
                        </div>

                        <Eye size={14} className="text-gray-400 group-hover:text-[#1b4d8f] shrink-0" />
                      </div>
                    ))}
                  </div>

                  {/* Instruments Pagination */}
                  {totalInstrumentPages > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[12px] text-[#5d5b56]">
                      <button
                        type="button"
                        disabled={instrumentCurrentPage === 1}
                        onClick={() => setInstrumentCurrentPage((prev) => Math.max(1, prev - 1))}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-xl font-medium shadow-2xs disabled:opacity-40 transition-all cursor-pointer"
                      >
                        <ChevronLeft size={14} />
                        <span>Prev</span>
                      </button>

                      <span className="font-semibold text-[11px]">
                        Page {instrumentCurrentPage} of {totalInstrumentPages}
                      </span>

                      <button
                        type="button"
                        disabled={instrumentCurrentPage === totalInstrumentPages}
                        onClick={() => setInstrumentCurrentPage((prev) => Math.min(totalInstrumentPages, prev + 1))}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-xl font-medium shadow-2xs disabled:opacity-40 transition-all cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* =====================================================
              EXCEL REPORT EXPORT SECTION
          ===================================================== */}
          <div className="bg-white p-4 rounded-2xl border border-black/10 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <FileSpreadsheet size={16} className="text-[#1b4d8f]" />
              <h4 className="text-xs font-bold text-[#1b4d8f] uppercase tracking-wider">
                Export Spreadsheet (.xlsx)
              </h4>
            </div>

            <p className="text-[11.5px] text-[#5d5b56] leading-relaxed">
              Export comprehensive Microsoft Excel spreadsheets for offline recordkeeping.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleDownloadInstrumentsExcel}
                disabled={isDownloadingInstrumentsExcel}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#eef3fa] hover:bg-[#e0eaf6] text-[#1b4d8f] border border-[#1b4d8f]/30 rounded-xl text-xs font-semibold transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isDownloadingInstrumentsExcel ? (
                  <Loader2 size={15} className="animate-spin text-[#1b4d8f]" />
                ) : (
                  <>
                    <PackageCheck size={15} className="text-[#1b4d8f]" />
                    <span>Download Instruments</span>
                    <Download size={13} className="ml-auto opacity-70" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadIssuesExcel}
                disabled={isDownloadingIssuesExcel}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#eef8f5] hover:bg-[#dbf0ea] text-[#12695a] border border-[#12695a]/30 rounded-xl text-xs font-semibold transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isDownloadingIssuesExcel ? (
                  <Loader2 size={15} className="animate-spin text-[#12695a]" />
                ) : (
                  <>
                    <ClipboardList size={15} className="text-[#12695a]" />
                    <span>Download Issue Records</span>
                    <Download size={13} className="ml-auto opacity-70" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Profile Form Mode */
        <form
          onSubmit={handleSavePrompt}
          className="bg-white p-4 rounded-2xl border border-black/10 shadow-2xs space-y-3.5"
        >
          <h4 className="text-xs font-bold text-[#1b4d8f] uppercase tracking-wider border-b pb-2">
            Edit Profile
          </h4>

          {/* Profile Photo Upload / Capture */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#5d5b56] block">
              Profile Photo
            </label>
            <div className="flex items-center gap-3">
              {formData.photo_path ? (
                <div className="relative shrink-0">
                  <img
                    src={resolvePhotoUrl(formData.photo_path)}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border border-[#1b4d8f]/30"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhotoFile(null);
                      setFormData((prev) => ({ ...prev, photo_path: null }));
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-xs hover:bg-red-600 cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
                  <User size={20} />
                </div>
              )}

              <div className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex-1 bg-[#1b4d8f] text-white text-[11px] font-medium py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all shadow-2xs cursor-pointer"
                >
                  <Camera size={13} />
                  <span>Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current && fileInputRef.current.click()
                  }
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#1b1a18] border border-black/10 text-[11px] font-medium py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <Upload size={13} />
                  <span>Upload</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#5d5b56]">
              Mobile Number (10 digits)
            </label>
            <div className="flex items-center rounded-xl border border-black/15 overflow-hidden bg-white focus-within:border-[#1b4d8f]">
              <span className="px-3 py-2.5 bg-gray-100 border-r border-black/15 text-xs font-semibold text-gray-600 select-none">
                +91
              </span>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                maxLength={10}
                placeholder="9876543210"
                className="w-full text-xs p-2.5 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 py-2.5 rounded-xl text-xs border border-gray-300 text-gray-700 cursor-pointer hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#1b4d8f] text-white flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-all"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* =====================================================
          SINGLE ISSUE RECORD DETAIL MODAL
      ===================================================== */}
      {selectedIssuePreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">
            <div className="p-3.5 border-b flex items-center justify-between bg-[#12695a] text-white">
              <div className="min-w-0 pr-2">
                <h3 className="text-xs font-bold truncate">
                  {selectedIssuePreview.instrument?.name || "Issue Record Detail"}
                </h3>
                <p className="text-[10px] opacity-80 font-mono">
                  Asset ID: {selectedIssuePreview.instrument?.assetId || selectedIssuePreview.instrument?.asset_id || "N/A"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIssuePreview(null)}
                className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#12695a] uppercase tracking-wider block">
                  Condition Photos Audit
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-1">
                      <Clock size={10} /> Checkout Photo
                    </span>
                    <div className="h-28 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative">
                      {selectedIssuePreview.condition_photo_path || selectedIssuePreview.conditionPhotoPath ? (
                        <img
                          src={resolvePhotoUrl(
                            selectedIssuePreview.condition_photo_path || selectedIssuePreview.conditionPhotoPath
                          )}
                          alt="Checkout"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] italic">
                          No photo captured
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle size={10} /> Check-in Photo
                    </span>
                    <div className="h-28 rounded-xl overflow-hidden bg-emerald-50/50 border border-emerald-200 relative">
                      {selectedIssuePreview.condition_in_photo_path || selectedIssuePreview.conditionInPhotoPath ? (
                        <img
                          src={resolvePhotoUrl(
                            selectedIssuePreview.condition_in_photo_path || selectedIssuePreview.conditionInPhotoPath
                          )}
                          alt="Return"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-[10px] italic p-1 text-center">
                          {selectedIssuePreview.state === "RETURNED" ? "No return photo" : "Pending return"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 bg-gray-50 p-3 rounded-2xl border border-gray-200 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Borrower Scientist:</span>
                  <span className="font-semibold text-gray-800 text-right">
                    {selectedIssuePreview.borrowerScientist?.name || selectedIssuePreview.borrower_scientist?.name || "N/A"}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Issue Date:</span>
                  <span className="font-mono text-gray-800">
                    {selectedIssuePreview.issueDate || selectedIssuePreview.issue_date || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button
                type="button"
                disabled={pdfGenerating}
                onClick={() => downloadPDF(selectedIssuePreview, "issues", true)}
                className="flex-1 py-2 bg-[#12695a] hover:bg-[#0e5246] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {pdfGenerating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>{pdfGenerating ? "Creating PDF..." : "Download PDF"}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedIssuePreview(null)}
                className="py-2 px-4 border border-gray-300 text-gray-700 rounded-xl text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          SINGLE INSTRUMENT DETAIL PREVIEW MODAL
      ===================================================== */}
      {selectedInstrumentPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">
            <div className="p-3.5 border-b flex items-center justify-between bg-[#1b4d8f] text-white">
              <div className="min-w-0 pr-2">
                <h3 className="text-xs font-bold truncate">{selectedInstrumentPreview.name || "Instrument Detail"}</h3>
                <p className="text-[10px] opacity-80 font-mono">
                  Asset ID: {selectedInstrumentPreview.assetId || selectedInstrumentPreview.asset_id || "N/A"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInstrumentPreview(null)}
                className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              <div className="h-36 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 relative">
                {selectedInstrumentPreview.photoPath || selectedInstrumentPreview.photo_path ? (
                  <img
                    src={resolvePhotoUrl(selectedInstrumentPreview.photoPath || selectedInstrumentPreview.photo_path)}
                    alt={selectedInstrumentPreview.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 italic text-xs">
                    No photo uploaded
                  </div>
                )}
              </div>

              <div className="space-y-2 bg-gray-50 p-3 rounded-2xl border border-gray-200 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Make / Manufacturer:</span>
                  <span className="font-medium text-gray-800">{selectedInstrumentPreview.make || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Serial Number:</span>
                  <span className="font-mono text-gray-800">{selectedInstrumentPreview.serialNo || selectedInstrumentPreview.serial_no || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Storage Location:</span>
                  <span className="font-medium text-gray-800">{selectedInstrumentPreview.location || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Availability:</span>
                  <span className="font-bold text-[#1b4d8f]">{selectedInstrumentPreview.status || "AVAILABLE"}</span>
                </div>
              </div>
            </div>

            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button
                type="button"
                disabled={pdfGenerating}
                onClick={() => downloadPDF(selectedInstrumentPreview, "instruments", true)}
                className="flex-1 py-2 bg-[#1b4d8f] hover:bg-[#143d73] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {pdfGenerating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>{pdfGenerating ? "Creating PDF..." : "Download PDF"}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedInstrumentPreview(null)}
                className="py-2 px-4 border border-gray-300 text-gray-700 rounded-xl text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-gray-200 space-y-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={20} className="shrink-0 text-[#1b4d8f]" />
              <h3 className="text-sm font-bold text-[#1b1a18]">{confirmDialog.title}</h3>
            </div>

            <p className="text-xs text-[#5d5b56] leading-relaxed">{confirmDialog.message}</p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, title: "", message: "", actionType: null })}
                className="flex-1 py-2 rounded-xl text-xs font-medium border border-gray-300 text-gray-700 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  const action = confirmDialog.actionType;
                  setConfirmDialog({ isOpen: false, title: "", message: "", actionType: null });
                  if (action === "SAVE") executeSave();
                  if (action === "LOGOUT" && onLogout) onLogout();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold text-white cursor-pointer ${
                  confirmDialog.actionType === "LOGOUT" ? "bg-red-600" : "bg-[#1b4d8f]"
                }`}
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Viewfinder Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm h-[70vh] bg-black rounded-3xl overflow-hidden flex flex-col justify-between p-3.5 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between text-white pb-1">
              <h3 className="text-xs font-bold flex items-center gap-1.5">
                <Camera size={14} className="text-[#1b4d8f]" />
                Capture Profile Photo
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
                className="w-full h-full object-cover transform -scale-x-100"
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
    </div>
  );
}
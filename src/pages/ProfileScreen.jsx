import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Edit3,
  CheckCircle2,
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
} from "lucide-react";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const PAGE_SIZE = 5;

export default function ProfileScreen({
  user,
  onLogout,
  onShowToast,
  onUpdateUser,
}) {
  const BASE_URL = "http://192.168.1.34:8080";

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

  const [formData, setFormData] = useState({
    ...person,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // =========================================================
  // ISSUE RECORDS
  // =========================================================

  const [issueRecordsList, setIssueRecordsList] = useState([]);

  const [previewLoading, setPreviewLoading] = useState(false);

  const [selectedIssuePreview, setSelectedIssuePreview] =
    useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  // =========================================================
  // PDF STATES
  // =========================================================

  const [pdfGenerating, setPdfGenerating] = useState(false);

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
        created_at:
          user.created_at || new Date().toISOString(),
      };

      setPerson(updated);
      setFormData(updated);
    }
  }, [user]);

  // =========================================================
  // FETCH ISSUE RECORDS
  // =========================================================

  useEffect(() => {
    if (person.id) {
      fetchScientistIssueRecords();
    }
  }, [person.id]);

  const fetchScientistIssueRecords = async () => {
    setPreviewLoading(true);

    const token = localStorage.getItem("token");

    const headers = token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};

    try {
      const response = await fetch(
        `${BASE_URL}/api/issue-records/owner/${person.id}`,
        {
          headers,
        }
      );

      if (response.ok) {
        const issueData = await response.json();

        const sortedData = [...(issueData || [])].reverse();

        setIssueRecordsList(sortedData);

        setCurrentPage(1);
      }
    } catch (err) {
      console.error(
        "Failed to load issue records:",
        err
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  // =========================================================
  // IMAGE URL
  // =========================================================

  const resolvePhotoUrl = (photoPath) => {
    if (!photoPath) return null;

    if (photoPath.startsWith("data:")) {
      return photoPath;
    }

    const fullPath = photoPath.startsWith("http")
      ? photoPath
      : `${BASE_URL}${photoPath}`;

    return `${fullPath}?t=${Date.now()}`;
  };

  // =========================================================
  // EDIT PROFILE
  // =========================================================

  const handleEditClick = () => {
    const cleanMobile = (person.mobile || "")
      .replace(/\D/g, "")
      .slice(-10);

    setFormData({
      ...person,
      mobile: cleanMobile,
    });

    setIsEditing(true);
  };

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    if (name === "mobile") {
      setFormData((prev) => ({
        ...prev,
        mobile: value
          .replace(/\D/g, "")
          .slice(0, 10),
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleSavePrompt = (e) => {
    e.preventDefault();

    if (
      formData.mobile &&
      formData.mobile.length !== 10
    ) {
      if (onShowToast) {
        onShowToast(
          "Mobile number must be exactly 10 digits!"
        );
      }

      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Confirm Profile Update",
      message:
        "Are you sure you want to save changes to your profile details?",
      actionType: "SAVE",
    });
  };

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const executeSave = async () => {
    if (!person.id) return;

    setIsSubmitting(true);

    const token =
      localStorage.getItem("token");

    const headers = {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };

    try {
      const response = await fetch(
        `${BASE_URL}/api/persons/${person.id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            mobile: formData.mobile
              ? `+91 ${formData.mobile}`
              : "",
            department: formData.department,
            is_active: formData.is_active,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update profile details."
        );
      }

      const updatedPersonData =
        await response.json();

      setPerson(updatedPersonData);

      setFormData(updatedPersonData);

      setIsEditing(false);

      if (onUpdateUser) {
        onUpdateUser(updatedPersonData);
      }

      if (onShowToast) {
        onShowToast(
          "Profile updated successfully!"
        );
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(
          err.message ||
            "Error updating profile."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // AVATAR
  // =========================================================

  const renderAvatar = (
    photoPath,
    name
  ) => {
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

  // =========================================================
  // GET RECORD VALUE
  // =========================================================

  const getRecordValue = (
    rec,
    camel,
    snake,
    fallback = ""
  ) => {
    return (
      rec?.[camel] ??
      rec?.[snake] ??
      fallback
    );
  };

  // =========================================================
  // LOAD IMAGE AS DATA URL
  // =========================================================

  const imageToDataURL = async (
    imageUrl
  ) => {
    if (!imageUrl) return null;

    try {
      const response = await fetch(
        imageUrl,
        {
          cache: "no-cache",
        }
      );

      if (!response.ok) {
        return null;
      }

      const blob =
        await response.blob();

      return await new Promise(
        (resolve) => {
          const reader =
            new FileReader();

          reader.onloadend = () => {
            resolve(reader.result);
          };

          reader.onerror = () => {
            resolve(null);
          };

          reader.readAsDataURL(blob);
        }
      );
    } catch (error) {
      console.error(
        "Image conversion failed:",
        error
      );

      return null;
    }
  };

  // =========================================================
  // WAIT FOR IMAGE
  // =========================================================

  const waitForImage = (src) => {
    return new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }

      const img =
        new Image();

      img.onload = () => resolve(img);

      img.onerror = () =>
        resolve(null);

      img.src = src;
    });
  };

  // =========================================================
  // ADD IMAGE TO PDF
  // =========================================================

  const addImageToPDF = async (
    pdf,
    imageUrl,
    x,
    y,
    width,
    height
  ) => {
    if (!imageUrl) {
      return;
    }

    try {
      const dataUrl =
        await imageToDataURL(
          imageUrl
        );

      if (!dataUrl) {
        return;
      }

      const img =
        await waitForImage(
          dataUrl
        );

      if (!img) {
        return;
      }

      pdf.addImage(
        dataUrl,
        "JPEG",
        x,
        y,
        width,
        height
      );
    } catch (error) {
      console.error(
        "Could not add image to PDF:",
        error
      );
    }
  };

  // =========================================================
  // CREATE PDF
  // =========================================================

  const createIssuePDF = async (
    records
  ) => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth =
      pdf.internal.pageSize.getWidth();

    const pageHeight =
      pdf.internal.pageSize.getHeight();

    const margin = 12;

    for (
      let index = 0;
      index < records.length;
      index++
    ) {
      const rec = records[index];

      if (index > 0) {
        pdf.addPage();
      }

      // -----------------------------------------------------
      // HEADER
      // -----------------------------------------------------

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(18);

      pdf.setTextColor(
        18,
        105,
        90
      );

      pdf.text(
        "APEEG",
        margin,
        16
      );

      pdf.setFontSize(13);

      pdf.setTextColor(
        27,
        77,
        143
      );

      pdf.text(
        "Instrument Issue & Condition Audit",
        margin,
        24
      );

      pdf.setDrawColor(
        18,
        105,
        90
      );

      pdf.line(
        margin,
        28,
        pageWidth - margin,
        28
      );

      // -----------------------------------------------------
      // INSTRUMENT
      // -----------------------------------------------------

      const instrumentName =
        rec.instrument?.name ||
        "Instrument";

      const assetId =
        rec.instrument?.assetId ||
        rec.instrument?.asset_id ||
        "N/A";

      pdf.setTextColor(
        27,
        26,
        24
      );

      pdf.setFontSize(14);

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        `${index + 1}. ${instrumentName}`,
        margin,
        39
      );

      pdf.setFontSize(10);

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.text(
        `Asset ID: ${assetId}`,
        margin,
        46
      );

      // -----------------------------------------------------
      // DETAILS
      // -----------------------------------------------------

      let y = 56;

      const borrower =
        getRecordValue(
          rec,
          "borrowerScientist",
          "borrower_scientist",
          {}
        );

      const borrowerName =
        borrower?.name || "N/A";

      const staffName =
        getRecordValue(
          rec,
          "staffName",
          "staff_name",
          "Direct Issue"
        );

      const staffEmail =
        getRecordValue(
          rec,
          "staffEmail",
          "staff_email",
          "N/A"
        );

      const issueDate =
        getRecordValue(
          rec,
          "issueDate",
          "issue_date",
          "N/A"
        );

      const dueDate =
        getRecordValue(
          rec,
          "dueDate",
          "due_date",
          "N/A"
        );

      const actualReturnDate =
        getRecordValue(
          rec,
          "actualReturnDate",
          "actual_return_date",
          "Pending"
        );

      const state =
        rec.state || "OPEN";

      const purpose =
        rec.purpose ||
        "N/A";

      const details = [
        [
          "Borrower Scientist",
          borrowerName,
        ],
        [
          "Handling Staff Member",
          `${staffName} (${staffEmail})`,
        ],
        [
          "Issue Date",
          issueDate,
        ],
        [
          "Due Return Date",
          dueDate,
        ],
        [
          "Actual Return Date",
          actualReturnDate,
        ],
        [
          "Status",
          state,
        ],
        [
          "Purpose / Work",
          purpose,
        ],
      ];

      pdf.setFontSize(9.5);

      details.forEach(
        ([label, value]) => {
          pdf.setFont(
            "helvetica",
            "bold"
          );

          pdf.setTextColor(
            85,
            85,
            85
          );

          pdf.text(
            `${label}:`,
            margin,
            y
          );

          pdf.setFont(
            "helvetica",
            "normal"
          );

          pdf.setTextColor(
            30,
            30,
            30
          );

          const wrapped =
            pdf.splitTextToSize(
              String(value),
              pageWidth -
                margin * 2 -
                45
            );

          pdf.text(
            wrapped,
            margin + 45,
            y
          );

          y +=
            Math.max(
              6,
              wrapped.length * 4.5
            );
        }
      );

      // -----------------------------------------------------
      // CONDITION AUDIT TITLE
      // -----------------------------------------------------

      y += 5;

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(11);

      pdf.setTextColor(
        18,
        105,
        90
      );

      pdf.text(
        "Physical Condition Photos Audit",
        margin,
        y
      );

      y += 7;

      // -----------------------------------------------------
      // PHOTOS
      // -----------------------------------------------------

      const checkoutPath =
        rec.condition_photo_path ||
        rec.conditionPhotoPath;

      const returnPath =
        rec.condition_in_photo_path ||
        rec.conditionInPhotoPath;

      const checkoutUrl =
        resolvePhotoUrl(
          checkoutPath
        );

      const returnUrl =
        resolvePhotoUrl(
          returnPath
        );

      const photoWidth = 88;

      const photoHeight = 60;

      // Checkout box
      pdf.setDrawColor(
        200,
        200,
        200
      );

      pdf.rect(
        margin,
        y,
        photoWidth,
        78
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(9);

      pdf.setTextColor(
        50,
        50,
        50
      );

      pdf.text(
        "Checkout Photo",
        margin + 4,
        y + 7
      );

      if (checkoutUrl) {
        await addImageToPDF(
          pdf,
          checkoutUrl,
          margin + 4,
          y + 11,
          photoWidth - 8,
          photoHeight
        );
      } else {
        pdf.setFont(
          "helvetica",
          "italic"
        );

        pdf.setFontSize(8);

        pdf.setTextColor(
          130,
          130,
          130
        );

        pdf.text(
          "No checkout photo",
          margin + 4,
          y + 40
        );
      }

      const conditionOut =
        getRecordValue(
          rec,
          "conditionOut",
          "condition_out",
          "N/A"
        );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(7.5);

      pdf.setTextColor(
        50,
        50,
        50
      );

      const conditionOutText =
        pdf.splitTextToSize(
          `Condition: ${conditionOut}`,
          photoWidth - 8
        );

      pdf.text(
        conditionOutText,
        margin + 4,
        y + 70
      );

      // Return box
      const secondX =
        margin +
        photoWidth +
        8;

      pdf.rect(
        secondX,
        y,
        photoWidth,
        78
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(9);

      pdf.setTextColor(
        18,
        105,
        90
      );

      pdf.text(
        "Check-in Photo",
        secondX + 4,
        y + 7
      );

      if (returnUrl) {
        await addImageToPDF(
          pdf,
          returnUrl,
          secondX + 4,
          y + 11,
          photoWidth - 8,
          photoHeight
        );
      } else {
        pdf.setFont(
          "helvetica",
          "italic"
        );

        pdf.setFontSize(8);

        pdf.setTextColor(
          130,
          130,
          130
        );

        pdf.text(
          state === "RETURNED"
            ? "No return photo"
            : "Pending return",
          secondX + 4,
          y + 40
        );
      }

      const conditionIn =
        getRecordValue(
          rec,
          "conditionIn",
          "condition_in",
          "N/A"
        );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(7.5);

      pdf.setTextColor(
        50,
        50,
        50
      );

      const conditionInText =
        pdf.splitTextToSize(
          `Condition: ${conditionIn}`,
          photoWidth - 8
        );

      pdf.text(
        conditionInText,
        secondX + 4,
        y + 70
      );

      // -----------------------------------------------------
      // FOOTER
      // -----------------------------------------------------

      pdf.setFontSize(7);

      pdf.setTextColor(
        120,
        120,
        120
      );

      pdf.text(
        `Generated from APEEG • ${new Date().toLocaleString()}`,
        margin,
        pageHeight - 8
      );

      pdf.text(
        `Page ${index + 1} of ${records.length}`,
        pageWidth - margin - 25,
        pageHeight - 8
      );
    }

    return pdf;
  };

  // =========================================================
  // DOWNLOAD PDF
  // =========================================================

  const downloadPDF = async (
    recordsToDownload,
    closeModal = false
  ) => {
    const records = Array.isArray(
      recordsToDownload
    )
      ? recordsToDownload
      : [recordsToDownload];

    if (!records.length) {
      if (onShowToast) {
        onShowToast(
          "No issue records available to download."
        );
      }

      return;
    }

    if (pdfGenerating) {
      return;
    }

    setPdfGenerating(true);

    try {
      if (onShowToast) {
        onShowToast(
          "Preparing PDF..."
        );
      }

      const pdf =
        await createIssuePDF(
          records
        );

      const timestamp =
        new Date()
          .toISOString()
          .replace(
            /[:.]/g,
            "-"
          );

      const filename =
        records.length === 1
          ? `APEEG_Issue_Record_${timestamp}.pdf`
          : `APEEG_Issue_Audit_${timestamp}.pdf`;

      // =====================================================
      // CAPACITOR ANDROID
      // =====================================================

      const isCapacitor =
        typeof window !==
          "undefined" &&
        window.Capacitor &&
        window.Capacitor.isNativePlatform &&
        window.Capacitor.isNativePlatform();

      if (isCapacitor) {
        try {
          const {
            Filesystem,
            Directory,
          } = await import(
            "@capacitor/filesystem"
          );

          const base64 =
            pdf.output(
              "datauristring"
            );

          const cleanBase64 =
            base64.split(",")[1];

          /*
           * Documents is the safe Capacitor
           * native directory.
           *
           * On Android this is stored in
           * the application's accessible
           * Documents area.
           */
          await Filesystem.writeFile(
            {
              path: `APEEG/${filename}`,
              data: cleanBase64,
              directory:
                Directory.Documents,
              recursive: true,
            }
          );

          if (onShowToast) {
            onShowToast(
              "PDF downloaded successfully!"
            );
          }

          if (closeModal) {
            setSelectedIssuePreview(
              null
            );
          }

          return;
        } catch (nativeError) {
          console.error(
            "Native PDF save failed:",
            nativeError
          );

          /*
           * If native storage fails,
           * fall back to normal browser
           * download.
           */
        }
      }

      // =====================================================
      // NORMAL BROWSER / MOBILE BROWSER
      // =====================================================

      pdf.save(filename);

      if (onShowToast) {
        onShowToast(
          "PDF downloaded successfully!"
        );
      }

      if (closeModal) {
        setSelectedIssuePreview(
          null
        );
      }
    } catch (error) {
      console.error(
        "PDF generation failed:",
        error
      );

      if (onShowToast) {
        onShowToast(
          "Unable to download PDF. Please try again."
        );
      }
    } finally {
      setPdfGenerating(false);
    }
  };

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages =
    Math.ceil(
      issueRecordsList.length /
        PAGE_SIZE
    ) || 1;

  const startIndex =
    (currentPage - 1) *
    PAGE_SIZE;

  const slicedRecords =
    issueRecordsList.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-4 font-sans text-[#1b1a18] animate-fade-in relative pb-8">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#1b4d8f]">
          User Profile
        </h2>
      </div>

      {/* =====================================================
          PROFILE CARD
      ===================================================== */}

      <div className="bg-white p-4 rounded-2xl border border-black/10 shadow-2xs flex items-center gap-3.5">
        {renderAvatar(
          person.photo_path,
          person.name
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold text-[#1b1a18] truncate leading-tight">
              {person.name ||
                "Scientist Profile"}
            </h3>

            {person.is_active && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <CheckCircle2
                  size={10}
                />
                Active
              </span>
            )}
          </div>

          <p className="text-xs text-[#5d5b56] mt-0.5 font-medium">
            {person.department ||
              "APEEG"}{" "}
            Department
          </p>

          <p className="text-[11px] font-mono text-gray-400 mt-0.5 truncate">
            {person.email}
          </p>
        </div>
      </div>

      {/* =====================================================
          VIEW MODE
      ===================================================== */}

      {!isEditing ? (
        <div className="space-y-4">

          {/* PERSON DETAILS */}

          <div className="bg-white p-4 rounded-2xl border border-black/10 shadow-2xs space-y-3">

            <h4 className="text-xs font-bold text-[#1b4d8f] uppercase tracking-wider border-b pb-2">
              Person Details
            </h4>

            <div className="space-y-2.5 text-xs">

              <div className="flex items-center gap-2.5 text-[#5d5b56]">
                <User
                  size={15}
                  className="text-[#1b4d8f] shrink-0"
                />

                <div>
                  <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                    Name
                  </span>

                  <span className="font-semibold text-[#1b1a18]">
                    {person.name ||
                      "N/A"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-[#5d5b56]">
                <Mail
                  size={15}
                  className="text-[#1b4d8f] shrink-0"
                />

                <div>
                  <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                    Official Email
                  </span>

                  <span className="font-mono text-[#1b1a18]">
                    {person.email ||
                      "N/A"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-[#5d5b56]">
                <Phone
                  size={15}
                  className="text-[#1b4d8f] shrink-0"
                />

                <div>
                  <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                    Mobile Number
                  </span>

                  <span className="text-[#1b1a18]">
                    {person.mobile ||
                      "Not set"}
                  </span>
                </div>
              </div>

            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center gap-2">

              <button
                type="button"
                onClick={
                  handleEditClick
                }
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1b4d8f] hover:bg-[#143d73] text-white rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              >
                <Edit3 size={14} />
                <span>
                  Edit Profile
                </span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDialog({
                      isOpen: true,
                      title: "Sign Out",
                      message:
                        "Are you sure you want to sign out?",
                      actionType:
                        "LOGOUT",
                    })
                  }
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <LogOut
                    size={14}
                  />

                  <span>
                    Sign Out
                  </span>
                </button>
              )}

            </div>
          </div>

          {/* =================================================
              ISSUE RECORD AUDIT
          ================================================= */}

          <div className="bg-white p-4 rounded-2xl border border-black/10 shadow-2xs space-y-3">

            <div className="flex items-center justify-between border-b pb-2 gap-2">

              <div className="flex items-center gap-2 min-w-0">
                <Eye
                  size={16}
                  className="text-[#12695a] shrink-0"
                />

                <h4 className="text-xs font-bold text-[#12695a] uppercase tracking-wider truncate">
                  Issue Records Audit
                </h4>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">

                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {
                    issueRecordsList.length
                  }{" "}
                  Records
                </span>

                <button
                  type="button"
                  onClick={() =>
                    downloadPDF(
                      issueRecordsList
                    )
                  }
                  disabled={
                    issueRecordsList.length ===
                      0 ||
                    pdfGenerating
                  }
                  className="flex items-center gap-1 bg-[#12695a] hover:bg-[#0e5246] text-white text-[10.5px] font-semibold px-2.5 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  {pdfGenerating ? (
                    <Loader2
                      size={12}
                      className="animate-spin"
                    />
                  ) : (
                    <Download
                      size={12}
                    />
                  )}

                  <span>
                    {pdfGenerating
                      ? "Creating..."
                      : "Download PDF"}
                  </span>
                </button>

              </div>
            </div>

            <p className="text-[11.5px] text-[#5d5b56] leading-relaxed">
              Displaying latest issue records first. Tap any record to inspect its checkout and return condition photos.
            </p>

            {previewLoading ? (
              <div className="py-6 flex items-center justify-center text-xs text-gray-400 gap-2">

                <Loader2
                  size={16}
                  className="animate-spin text-[#12695a]"
                />

                <span>
                  Loading issue history...
                </span>

              </div>
            ) : (
              <div className="space-y-2">

                {issueRecordsList.length ===
                0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No issue records logged yet.
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">

                      {slicedRecords.map(
                        (rec) => (
                          <div
                            key={
                              rec.id ||
                              rec._id
                            }
                            onClick={() =>
                              setSelectedIssuePreview(
                                rec
                              )
                            }
                            className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-[#eef8f5]/50 transition-all flex items-center gap-3 cursor-pointer group"
                          >

                            <div className="flex -space-x-2 shrink-0">

                              <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-200 border border-white shadow-xs flex items-center justify-center">

                                {rec.condition_photo_path ||
                                rec.conditionPhotoPath ? (
                                  <img
                                    src={resolvePhotoUrl(
                                      rec.condition_photo_path ||
                                        rec.conditionPhotoPath
                                    )}
                                    alt="Checkout condition"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon
                                    size={14}
                                    className="text-gray-400"
                                  />
                                )}

                              </div>

                              {(rec.condition_in_photo_path ||
                                rec.conditionInPhotoPath) && (
                                <div className="w-9 h-9 rounded-lg overflow-hidden bg-emerald-100 border border-white shadow-xs">

                                  <img
                                    src={resolvePhotoUrl(
                                      rec.condition_in_photo_path ||
                                        rec.conditionInPhotoPath
                                    )}
                                    alt="Return condition"
                                    className="w-full h-full object-cover"
                                  />

                                </div>
                              )}

                            </div>

                            <div className="min-w-0 flex-1">

                              <div className="flex items-center justify-between gap-1">

                                <h5 className="text-xs font-bold text-[#1b1a18] truncate group-hover:text-[#12695a]">
                                  {rec
                                    .instrument
                                    ?.name ||
                                    "Instrument Loan"}
                                </h5>

                                <span
                                  className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                                    rec.state ===
                                    "RETURNED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {rec.state ||
                                    "OPEN"}
                                </span>

                              </div>

                              <p className="text-[10.5px] text-gray-500 truncate">

                                Borrower:{" "}

                                <span className="font-semibold text-gray-700">
                                  {rec
                                    .borrowerScientist
                                    ?.name ||
                                    rec
                                      .borrower_scientist
                                      ?.name ||
                                    "N/A"}
                                </span>

                              </p>

                            </div>

                            <Eye
                              size={14}
                              className="text-gray-400 group-hover:text-[#12695a] shrink-0"
                            />

                          </div>
                        )
                      )}

                    </div>

                    {/* PAGINATION */}

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[12px] text-[#5d5b56]">

                        <button
                          type="button"
                          disabled={
                            currentPage ===
                            1
                          }
                          onClick={() =>
                            setCurrentPage(
                              (prev) =>
                                Math.max(
                                  1,
                                  prev - 1
                                )
                            )
                          }
                          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-xl font-medium shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
                        >
                          <ChevronLeft
                            size={14}
                          />
                          <span>
                            Prev
                          </span>
                        </button>

                        <span className="font-semibold text-[11px]">
                          Page{" "}
                          {currentPage}{" "}
                          of{" "}
                          {totalPages}
                        </span>

                        <button
                          type="button"
                          disabled={
                            currentPage ===
                            totalPages
                          }
                          onClick={() =>
                            setCurrentPage(
                              (prev) =>
                                Math.min(
                                  totalPages,
                                  prev + 1
                                )
                            )
                          }
                          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-xl font-medium shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
                        >
                          <span>
                            Next
                          </span>

                          <ChevronRight
                            size={14}
                          />
                        </button>

                      </div>
                    )}

                  </>
                )}

              </div>
            )}

          </div>

        </div>
      ) : (
        /* ===================================================
           EDIT FORM
        =================================================== */

        <form
          onSubmit={
            handleSavePrompt
          }
          className="bg-white p-4 rounded-2xl border border-black/10 shadow-2xs space-y-3.5"
        >

          <h4 className="text-xs font-bold text-[#1b4d8f] uppercase tracking-wider border-b pb-2">
            Edit Profile
          </h4>

          <div className="space-y-1">

            <label className="text-[11px] font-semibold text-[#5d5b56]">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              value={
                formData.name
              }
              onChange={
                handleChange
              }
              className="w-full bg-white text-xs p-2.5 rounded-xl border border-black/15 focus:outline-none"
            />

          </div>

          <div className="space-y-1">

            <label className="text-[11px] font-semibold text-[#5d5b56]">
              Mobile Number (10 digits)
            </label>

            <input
              type="text"
              name="mobile"
              value={
                formData.mobile
              }
              onChange={
                handleChange
              }
              maxLength={10}
              className="w-full text-xs p-2.5 border border-black/15 rounded-xl focus:outline-none"
            />

          </div>

          <div className="flex gap-2 pt-2">

            <button
              type="button"
              onClick={() =>
                setIsEditing(false)
              }
              className="flex-1 py-2.5 rounded-xl text-xs border border-gray-300 text-gray-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting
              }
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#1b4d8f] text-white flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <span>
                  Save Changes
                </span>
              )}
            </button>

          </div>

        </form>
      )}

      {/* =====================================================
          ISSUE RECORD DETAIL MODAL
      ===================================================== */}

      {selectedIssuePreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">

          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">

            {/* HEADER */}

            <div className="p-3.5 border-b flex items-center justify-between bg-[#12695a] text-white">

              <div className="min-w-0 pr-2">

                <h3 className="text-xs font-bold truncate">
                  {selectedIssuePreview
                    .instrument
                    ?.name ||
                    "Issue Record Detail"}
                </h3>

                <p className="text-[10px] opacity-80 font-mono">
                  Asset ID:{" "}
                  {selectedIssuePreview
                    .instrument
                    ?.assetId ||
                    selectedIssuePreview
                      .instrument
                      ?.asset_id ||
                    "N/A"}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedIssuePreview(
                    null
                  )
                }
                className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer"
              >
                <X size={16} />
              </button>

            </div>

            {/* BODY */}

            <div className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs">

              {/* PHOTOS */}

              <div className="space-y-1.5">

                <span className="text-[11px] font-bold text-[#12695a] uppercase tracking-wider block">
                  Condition Photos Audit
                </span>

                <div className="grid grid-cols-2 gap-2">

                  {/* CHECKOUT */}

                  <div className="space-y-1">

                    <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-1">
                      <Clock size={10} />
                      Checkout Photo
                    </span>

                    <div className="h-28 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative">

                      {selectedIssuePreview.condition_photo_path ||
                      selectedIssuePreview.conditionPhotoPath ? (
                        <img
                          src={resolvePhotoUrl(
                            selectedIssuePreview.condition_photo_path ||
                              selectedIssuePreview.conditionPhotoPath
                          )}
                          alt="Checkout condition"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] italic">
                          No photo captured
                        </div>
                      )}

                    </div>

                    <p className="text-[10px] text-gray-600 italic bg-gray-50 p-1.5 rounded-lg border border-gray-100">

                      "
                      {selectedIssuePreview.conditionOut ||
                        selectedIssuePreview.condition_out ||
                        "Good condition"}
                      "

                    </p>

                  </div>

                  {/* CHECK-IN */}

                  <div className="space-y-1">

                    <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle
                        size={10}
                      />
                      Check-in Photo
                    </span>

                    <div className="h-28 rounded-xl overflow-hidden bg-emerald-50/50 border border-emerald-200 relative">

                      {selectedIssuePreview.condition_in_photo_path ||
                      selectedIssuePreview.conditionInPhotoPath ? (
                        <img
                          src={resolvePhotoUrl(
                            selectedIssuePreview.condition_in_photo_path ||
                              selectedIssuePreview.conditionInPhotoPath
                          )}
                          alt="Return condition"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-[10px] italic p-1 text-center">
                          {selectedIssuePreview.state ===
                          "RETURNED"
                            ? "No return photo"
                            : "Pending return"}
                        </div>
                      )}

                    </div>

                    <p className="text-[10px] text-emerald-900 italic bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">

                      "
                      {selectedIssuePreview.conditionIn ||
                        selectedIssuePreview.condition_in ||
                        "Pending return"}
                      "

                    </p>

                  </div>

                </div>

              </div>

              {/* DETAILS */}

              <div className="space-y-2 bg-gray-50 p-3 rounded-2xl border border-gray-200 text-xs">

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">
                    Borrower Scientist:
                  </span>

                  <span className="font-semibold text-gray-800 text-right">
                    {selectedIssuePreview
                      .borrowerScientist
                      ?.name ||
                      selectedIssuePreview
                        .borrower_scientist
                        ?.name ||
                      "N/A"}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">
                    Handling Staff Member:
                  </span>

                  <span className="text-gray-800 text-right">
                    {selectedIssuePreview.staffName ||
                      selectedIssuePreview.staff_name ||
                      "Direct issue"}
                  </span>
                </div>

                {(selectedIssuePreview.staffEmail ||
                  selectedIssuePreview.staff_email) && (
                  <div className="flex justify-between gap-3">

                    <span className="text-gray-500">
                      Staff Email:
                    </span>

                    <span className="font-mono text-gray-700 text-right break-all">
                      {selectedIssuePreview.staffEmail ||
                        selectedIssuePreview.staff_email}
                    </span>

                  </div>
                )}

                <div className="flex justify-between gap-3">

                  <span className="text-gray-500">
                    Issue Date:
                  </span>

                  <span className="font-mono text-gray-800">
                    {selectedIssuePreview.issueDate ||
                      selectedIssuePreview.issue_date ||
                      "N/A"}
                  </span>

                </div>

                <div className="flex justify-between gap-3">

                  <span className="text-gray-500">
                    Due Return Date:
                  </span>

                  <span className="font-mono text-gray-800">
                    {selectedIssuePreview.dueDate ||
                      selectedIssuePreview.due_date ||
                      "N/A"}
                  </span>

                </div>

                {(selectedIssuePreview.actualReturnDate ||
                  selectedIssuePreview.actual_return_date) && (
                  <div className="flex justify-between gap-3">

                    <span className="text-gray-500">
                      Actual Returned Date:
                    </span>

                    <span className="font-mono text-emerald-700 font-semibold">
                      {selectedIssuePreview.actualReturnDate ||
                        selectedIssuePreview.actual_return_date}
                    </span>

                  </div>
                )}

                <div className="pt-1 border-t border-gray-200">

                  <span className="text-gray-500 block text-[10px] uppercase font-bold">
                    Purpose / Activity:
                  </span>

                  <p className="text-gray-700 mt-0.5">
                    {selectedIssuePreview.purpose ||
                      "Testing and study"}
                  </p>

                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="p-3 border-t bg-gray-50 flex gap-2">

              <button
                type="button"
                disabled={
                  pdfGenerating
                }
                onClick={() =>
                  downloadPDF(
                    selectedIssuePreview,
                    true
                  )
                }
                className="flex-1 py-2 bg-[#12695a] hover:bg-[#0e5246] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >

                {pdfGenerating ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Download
                    size={14}
                  />
                )}

                <span>
                  {pdfGenerating
                    ? "Creating PDF..."
                    : "Download PDF"}
                </span>

              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedIssuePreview(
                    null
                  )
                }
                className="py-2 px-4 border border-gray-300 text-gray-700 rounded-xl text-xs font-medium cursor-pointer"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          CONFIRMATION DIALOG
      ===================================================== */}

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[60] flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-gray-200 space-y-3">

            <div className="flex items-center gap-2.5">

              <AlertCircle
                size={20}
                className="shrink-0 text-[#1b4d8f]"
              />

              <h3 className="text-sm font-bold text-[#1b1a18]">
                {
                  confirmDialog.title
                }
              </h3>

            </div>

            <p className="text-xs text-[#5d5b56] leading-relaxed">
              {
                confirmDialog.message
              }
            </p>

            <div className="flex items-center gap-2 pt-2">

              <button
                type="button"
                onClick={() =>
                  setConfirmDialog({
                    isOpen: false,
                    title: "",
                    message: "",
                    actionType:
                      null,
                  })
                }
                className="flex-1 py-2 rounded-xl text-xs font-medium border border-gray-300 text-gray-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  const action =
                    confirmDialog.actionType;

                  setConfirmDialog({
                    isOpen: false,
                    title: "",
                    message: "",
                    actionType:
                      null,
                  });

                  if (
                    action ===
                    "SAVE"
                  ) {
                    executeSave();
                  }

                  if (
                    action ===
                      "LOGOUT" &&
                    onLogout
                  ) {
                    onLogout();
                  }
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold text-white ${
                  confirmDialog.actionType ===
                  "LOGOUT"
                    ? "bg-red-600"
                    : "bg-[#1b4d8f]"
                }`}
              >
                Okay
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
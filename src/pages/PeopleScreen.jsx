import React, { useState, useEffect } from "react";
import {
  UserPlus,
  X,
  CheckCircle2,
  Package,
  UserCheck,
  User,
  Loader2,
} from "lucide-react";
import { getMyScientists, addScientistApi } from "../api/peopleService";
import { getActiveIssueRecords } from "../api/instrumentService";

export default function PeopleScreen({ onShowToast }) {
  const [scientists, setScientists] = useState([]);
  const [issueRecords, setIssueRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State for Add Scientist
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    department: "APEEG",
    role: "Scientist",
  });
  const [modalError, setModalError] = useState("");

  // Get currently authenticated logged-in user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  // Fetch scientists directory and active issue records from backend
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError("");

      const [scientistsData, recordsData] = await Promise.all([
        getMyScientists(),
        getActiveIssueRecords(),
      ]);

      setScientists(scientistsData || []);
      setIssueRecords(recordsData || []);
    } catch (err) {
      console.error("Error fetching people directory:", err);
      setError(
        "Failed to load scientists directory and holdings from backend.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Helper to extract initials for avatar
  const getInitials = (name) => {
    if (!name) return "SC";
    const cleanName = name.replace(/^(Dr\.|Er\.|Prof\.)\s+/i, "");
    const parts = cleanName.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0] ? parts[0].substring(0, 2).toUpperCase() : "SC";
  };

  // Compute instrument holdings for a specific scientist
  const getScientistHoldings = (scientist) => {
    // 1. Resolve normalized IDs and emails for comparison
    const scientistId = String(scientist.id || scientist._id || "");
    const scientistEmail = (scientist.email || "").toLowerCase().trim();

    const currentUserId = String(currentUser.id || currentUser._id || "");
    const currentUserEmail = (currentUser.email || "").toLowerCase().trim();

    // 2. Determine if this scientist card represents the currently authenticated user
    const isSelf =
      (scientistId && scientistId === currentUserId) ||
      (scientistEmail && scientistEmail === currentUserEmail);

    // 3. Filter open issue records belonging to this borrower scientist
    const matchedRecords = issueRecords.filter((record) => {
      const isStateOpen = record.state === "OPEN" || record.state === "ISSUED";

      const borrower =
        record.borrowerScientist || record.borrower_scientist || {};
      const borrowerId = String(borrower.id || borrower._id || "");
      const borrowerEmail = (borrower.email || "").toLowerCase().trim();

      return (
        isStateOpen &&
        ((scientistId && borrowerId === scientistId) ||
          (scientistEmail && borrowerEmail === scientistEmail))
      );
    });

    if (matchedRecords.length === 0) {
      return [];
    }

    // 4. Group holdings by staff intermediary or Direct Holding
    const staffGroupMap = {};

    matchedRecords.forEach((record) => {
      const staffName = record.staffName || record.staff_name;

      // Check if staff name exists and is not blank
      if (staffName && staffName.trim().length > 0) {
        // Option A: Held via Intermediary Staff
        staffGroupMap[staffName] = (staffGroupMap[staffName] || 0) + 1;
      } else {
        // Option B: Checked out Directly to the Scientist
        const key = isSelf ? "Self (Directly Held)" : scientist.name;
        staffGroupMap[key] = (staffGroupMap[key] || 0) + 1;
      }
    });

    // 5. Transform aggregated counts into display items
    return Object.entries(staffGroupMap).map(([staffName, count]) => {
      // Direct holding condition check
      const isDirectOrSelf =
        staffName.includes("Self (Directly Held)") ||
        staffName === scientist.name ||
        isSelf;

      return {
        staffName,
        count: `${count} instrument(s) held`,
        type: isDirectOrSelf ? "self" : "staff",
      };
    });
  };

  // Handle Add Scientist Form Submission
  const handleAddScientist = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!formData.name.trim() || !formData.email.trim()) {
      setModalError("Name and official email are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const savedScientist = await addScientistApi(formData);

      setScientists((prev) => [...prev, savedScientist]);

      if (onShowToast) {
        onShowToast(`Scientist ${savedScientist.name} added successfully!`);
      }

      setFormData({
        name: "",
        email: "",
        mobile: "",
        department: "APEEG",
        role: "Scientist",
      });
      setIsModalOpen(false);
    } catch (err) {
      setModalError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to add scientist contact.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3 font-sans text-[#1b1a18]">
      {/* Top Header Subtitle */}
      <div className="shrink-0 pb-1">
        <p className="text-[12px] text-[#5d5b56]">
          Scientists & project staff instrument holdings directory[cite: 5, 8].
        </p>
      </div>

      {error && (
        <div className="bg-[#fbe7e3] border border-[#8f2318]/20 text-[#8f2318] text-[11px] font-medium p-2.5 rounded-xl">
          {error}
        </div>
      )}

      {/* Main Directory Area */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-10 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#1b4d8f]" />
          <span className="text-xs">Loading directory from backend...</span>
        </div>
      ) : scientists.length === 0 ? (
        <div className="flex-1 bg-white p-6 rounded-2xl border border-black/10 flex flex-col items-center justify-center text-center space-y-2">
          <User className="w-8 h-8 text-gray-300" />
          <p className="text-xs text-gray-500 font-medium">
            No scientists in directory yet.
          </p>
          <p className="text-[11px] text-gray-400">
            Click "Add scientist" below to add contacts.
          </p>
        </div>
      ) : (
        /* Scrollable Scientists Cards Container */
        <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 custom-scrollbar">
          {scientists.map((scientist) => {
            const holdings = getScientistHoldings(scientist);
            const hasHoldings = holdings.length > 0;

            return (
              <div
                key={scientist.id || scientist._id}
                className="bg-white p-3.5 rounded-2xl border border-black/10 shadow-2xs space-y-3 transition-all"
              >
                {/* Header Row: Avatar Initials, Name, Role/Department, Email */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1b4d8f] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {getInitials(scientist.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13.5px] font-bold text-[#1b1a18] truncate leading-snug">
                      {scientist.name}
                    </h3>
                    <p className="text-[11.5px] font-medium text-[#5d5b56]">
                      {scientist.role || scientist.department || "APEEG"}
                    </p>
                    <p className="font-mono text-[10.5px] text-[#7a7872] truncate mt-0.5">
                      {scientist.email}
                    </p>
                  </div>
                </div>

                {/* Staff & Holdings Section */}
                <div className="pt-2 border-t border-black/5 space-y-1.5">
                  {hasHoldings ? (
                    holdings.map((item, idx) => {
                      const isSelfHeld = item.type === "self";

                      return (
                        <div
                          key={idx}
                          className={`flex justify-between items-center text-[11.5px] px-2.5 py-1.5 rounded-xl border ${
                            isSelfHeld
                              ? "bg-[#e8eff8]/60 border-[#1b4d8f]/20"
                              : "bg-gray-50/70 border-black/5"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isSelfHeld ? (
                              <User
                                size={13}
                                className="text-[#1b4d8f] shrink-0"
                              />
                            ) : (
                              <UserCheck
                                size={13}
                                className="text-[#12695a] shrink-0"
                              />
                            )}
                            <span
                              className={`font-medium truncate ${
                                isSelfHeld
                                  ? "text-[#1b4d8f] font-semibold"
                                  : "text-[#1b1a18]"
                              }`}
                            >
                              {item.staffName}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                              isSelfHeld
                                ? "text-[#1b4d8f] bg-[#e8eff8]"
                                : "text-[#8a5a12] bg-[#fef6e7]"
                            }`}
                          >
                            {item.count}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    /* Case: No instruments held */
                    <div className="flex items-center justify-between text-[11.5px] bg-[#f7f6f3] px-2.5 py-1.5 rounded-xl border border-black/5 text-[#7a7872]">
                      <div className="flex items-center gap-1.5">
                        <Package size={13} className="text-gray-400" />
                        <span>No instruments currently held</span>
                      </div>
                      <span className="text-[11px] font-medium italic text-gray-400">
                        nothing held
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer: Add Scientist Button */}
      <div className="shrink-0 pt-1">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-white hover:bg-gray-50 text-[#1b1a18] border border-black/15 font-semibold text-[12.5px] py-2.5 px-4 rounded-xl transition-all shadow-2xs active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
        >
          <UserPlus size={16} className="text-[#1b4d8f]" />
          <span>Add scientist</span>
        </button>
      </div>

      {/* Add Scientist Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-black/10 shadow-xl overflow-hidden p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#e8eff8] text-[#1b4d8f] flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <h3 className="text-sm font-bold text-[#1b1a18]">
                  Add New Scientist
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {modalError && (
              <div className="bg-[#fbe7e3] border border-[#8f2318]/20 text-[#8f2318] text-[11px] font-medium p-2 rounded-xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddScientist} className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-[#5d5b56]">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Dr. Ankit Rawat"
                  className="w-full bg-white text-[12px] py-2 px-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-[#5d5b56]">
                  Official Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="ankit.rawat@cbri.res.in"
                  className="w-full bg-white text-[12px] py-2 px-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-[#5d5b56]">
                  Role / Designation
                </label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  placeholder="e.g. Senior Scientist"
                  className="w-full bg-white text-[12px] py-2 px-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-[#5d5b56]">
                    Mobile
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    className="w-full bg-white text-[12px] py-2 px-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-[#5d5b56]">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="APEEG"
                    className="w-full bg-white text-[12px] py-2 px-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#5d5b56] text-[12px] font-semibold py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#1b4d8f] hover:bg-[#143d73] text-white text-[12px] font-semibold py-2 rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>Save Scientist</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

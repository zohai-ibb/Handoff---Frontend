import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  X,
  CheckCircle2,
  Package,
  UserCheck,
  User,
  Users,
  Loader2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getMyScientists, addScientistApi } from '../api/peopleService';
import { getActiveIssueRecords } from '../api/instrumentService';
import axiosClient from '../api/axiosClient';

export default function PeopleScreen({ onShowToast }) {
  // Navigation Toggle State ('scientists' | 'staff')
  const [activeTab, setActiveTab] = useState('scientists');

  // Pagination States (3 items per page)
  const ITEMS_PER_PAGE = 3;
  const [scientistPage, setScientistPage] = useState(1);
  const [staffPage, setStaffPage] = useState(1);

  // Backend Data States
  const [scientists, setScientists] = useState([]);
  const [savedStaffList, setSavedStaffList] = useState([]);
  const [issueRecords, setIssueRecords] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State for Adding a Scientist
  const [isScientistModalOpen, setIsScientistModalOpen] = useState(false);
  const [isSubmittingScientist, setIsSubmittingScientist] = useState(false);
  const [scientistFormData, setScientistFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    department: 'APEEG',
    role: 'Scientist',
  });
  const [scientistModalError, setScientistModalError] = useState('');

  // Modal State for Adding a Staff Member
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    email: '',
  });
  const [staffModalError, setStaffModalError] = useState('');

  // Currently logged-in user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};

  // --- Fetch Data from Backend ---
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [scientistsData, staffData, recordsData] = await Promise.all([
        getMyScientists().catch(() => []),
        axiosClient.get('/staff-members').then((res) => res.data).catch(() => []),
        getActiveIssueRecords().catch(() => []),
      ]);

      setScientists(scientistsData || []);
      setSavedStaffList(staffData || []);
      setIssueRecords(recordsData || []);
    } catch (err) {
      console.error('Error fetching people directory:', err);
      setError('Failed to load directory and instrument holdings from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScientistInputChange = (e) => {
    const { name, value } = e.target;
    setScientistFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStaffInputChange = (e) => {
    const { name, value } = e.target;
    setStaffFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Helper to extract initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const cleanName = name.replace(/^(Dr\.|Er\.|Prof\.)\s+/i, '');
    const parts = cleanName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0] ? parts[0].substring(0, 2).toUpperCase() : 'U';
  };

  // --- Calculate Scientist Holdings ---
  const getScientistHoldings = (scientist) => {
    const scientistId = String(scientist.id || scientist._id || '');
    const scientistEmail = (scientist.email || '').toLowerCase().trim();

    const currentUserId = String(currentUser.id || currentUser._id || '');
    const currentUserEmail = (currentUser.email || '').toLowerCase().trim();

    const isSelf =
      (scientistId && scientistId === currentUserId) ||
      (scientistEmail && scientistEmail === currentUserEmail);

    const matchedRecords = issueRecords.filter((record) => {
      const isStateOpen = record.state === 'OPEN' || record.state === 'ISSUED';

      const borrower = record.borrowerScientist || record.borrower_scientist || {};
      const borrowerId = String(borrower.id || borrower._id || '');
      const borrowerEmail = (borrower.email || '').toLowerCase().trim();

      return (
        isStateOpen &&
        ((scientistId && borrowerId === scientistId) ||
          (scientistEmail && borrowerEmail === scientistEmail))
      );
    });

    if (matchedRecords.length === 0) return [];

    const staffGroupMap = {};

    matchedRecords.forEach((record) => {
      const staffName = record.staffName || record.staff_name;

      if (staffName && staffName.trim().length > 0) {
        staffGroupMap[staffName] = (staffGroupMap[staffName] || 0) + 1;
      } else {
        const key = isSelf ? 'Self (Directly Held)' : scientist.name;
        staffGroupMap[key] = (staffGroupMap[key] || 0) + 1;
      }
    });

    return Object.entries(staffGroupMap).map(([staffName, count]) => {
      const isDirectOrSelf =
        staffName.includes('Self (Directly Held)') ||
        staffName === scientist.name ||
        isSelf;

      return {
        staffName,
        count: `${count} instrument(s) held`,
        type: isDirectOrSelf ? 'self' : 'staff',
      };
    });
  };

  // --- Calculate Staff Member Instruments ---
  const getStaffHoldings = (staff) => {
    const staffName = (staff.name || '').toLowerCase().trim();
    const staffEmail = (staff.email || '').toLowerCase().trim();

    return issueRecords.filter((record) => {
      const isStateOpen = record.state === 'OPEN' || record.state === 'ISSUED';
      const recStaffName = (record.staffName || record.staff_name || '').toLowerCase().trim();
      const recStaffEmail = (record.staffEmail || record.staff_email || '').toLowerCase().trim();

      return (
        isStateOpen &&
        ((staffName && recStaffName === staffName) ||
          (staffEmail && recStaffEmail === staffEmail))
      );
    });
  };

  // --- Save Scientist Submission ---
  const handleAddScientist = async (e) => {
    e.preventDefault();
    setScientistModalError('');

    if (!scientistFormData.name.trim() || !scientistFormData.email.trim()) {
      setScientistModalError('Name and official email are required.');
      return;
    }

    try {
      setIsSubmittingScientist(true);
      const savedScientist = await addScientistApi(scientistFormData);

      setScientists((prev) => [...prev, savedScientist]);

      if (onShowToast) {
        onShowToast(`Scientist ${savedScientist.name} added successfully!`);
      }

      setScientistFormData({
        name: '',
        email: '',
        mobile: '',
        department: 'APEEG',
        role: 'Scientist',
      });
      setIsScientistModalOpen(false);
    } catch (err) {
      setScientistModalError(
        err.response?.data?.message || err.response?.data || 'Failed to add scientist contact.'
      );
    } finally {
      setIsSubmittingScientist(false);
    }
  };

  // --- Save Staff Member Submission ---
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setStaffModalError('');

    if (!staffFormData.name.trim() || !staffFormData.email.trim()) {
      setStaffModalError('Staff name and email address are required.');
      return;
    }

    try {
      setIsSubmittingStaff(true);
      const res = await axiosClient.post('/staff-members', {
        name: staffFormData.name.trim(),
        email: staffFormData.email.trim(),
      });

      setSavedStaffList((prev) => [...prev, res.data]);

      if (onShowToast) {
        onShowToast(`Staff member ${res.data.name || staffFormData.name} saved!`);
      }

      setStaffFormData({ name: '', email: '' });
      setIsStaffModalOpen(false);
    } catch (err) {
      setStaffModalError(
        err.response?.data?.message || err.response?.data || 'Failed to save staff member.'
      );
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  // --- Pagination Slice Computation ---
  const totalScientistPages = Math.ceil(scientists.length / ITEMS_PER_PAGE) || 1;
  const paginatedScientists = scientists.slice(
    (scientistPage - 1) * ITEMS_PER_PAGE,
    scientistPage * ITEMS_PER_PAGE
  );

  const totalStaffPages = Math.ceil(savedStaffList.length / ITEMS_PER_PAGE) || 1;
  const paginatedStaff = savedStaffList.slice(
    (staffPage - 1) * ITEMS_PER_PAGE,
    staffPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex flex-col h-full space-y-3 font-sans text-[#1b1a18]">
      {/* Top Header & Toggle Option */}
      <div className="shrink-0 space-y-2">
        <div className="bg-[#eef3fa] p-1 rounded-xl flex items-center border border-black/5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('scientists');
              setScientistPage(1);
            }}
            className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'scientists'
                ? 'bg-white text-[#1b4d8f] shadow-xs'
                : 'text-[#5d5b56] hover:text-[#1b1a18]'
            }`}
          >
            <User size={14} />
            <span>Scientists Directory</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('staff');
              setStaffPage(1);
            }}
            className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'staff'
                ? 'bg-white text-[#1b4d8f] shadow-xs'
                : 'text-[#5d5b56] hover:text-[#1b1a18]'
            }`}
          >
            <Users size={14} />
            <span>Staff Members</span>
          </button>
        </div>

        <p className="text-[11.5px] text-[#5d5b56] px-0.5">
          {activeTab === 'scientists'
            ? 'Scientist inventory custody & staff holding breakdown.'
            : 'Project staff members currently holding active instruments.'}
        </p>
      </div>

      {error && (
        <div className="bg-[#fbe7e3] border border-[#8f2318]/20 text-[#8f2318] text-[11px] font-medium p-2.5 rounded-xl">
          {error}
        </div>
      )}
      {/* Footer Area: Add Scientist / Add Staff Button */}
      <div className="shrink-0 pt-1">
        {activeTab === 'scientists' ? (
          <button
            onClick={() => setIsScientistModalOpen(true)}
            className="w-full bg-white hover:bg-gray-50 text-[#1b1a18] border border-black/15 font-semibold text-[12.5px] py-2.5 px-4 rounded-xl transition-all shadow-2xs active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus size={16} className="text-[#1b4d8f]" />
            <span>Add scientist</span>
          </button>
        ) : (
          <button
            onClick={() => setIsStaffModalOpen(true)}
            className="w-full bg-white hover:bg-gray-50 text-[#1b1a18] border border-black/15 font-semibold text-[12.5px] py-2.5 px-4 rounded-xl transition-all shadow-2xs active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus size={16} className="text-[#12695a]" />
            <span>Add staff member</span>
          </button>
        )}
      </div>

      {/* Main Content View */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-10 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#1b4d8f]" />
          <span className="text-xs">Loading directory from backend...</span>
        </div>
      ) : activeTab === 'scientists' ? (
        /* ==================== SCIENTISTS DIRECTORY LIST ==================== */
        scientists.length === 0 ? (
          <div className="flex-1 bg-white p-6 rounded-2xl border border-black/10 flex flex-col items-center justify-center text-center space-y-2">
            <User className="w-8 h-8 text-gray-300" />
            <p className="text-xs text-gray-500 font-medium">No scientists in directory yet.</p>
            <p className="text-[11px] text-gray-400">Click "Add scientist" below to add contacts.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* 3 Paginated Scientist Cards */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 custom-scrollbar">
              {paginatedScientists.map((scientist) => {
                const holdings = getScientistHoldings(scientist);
                const hasHoldings = holdings.length > 0;

                return (
                  <div
                    key={scientist.id || scientist._id}
                    className="bg-white p-3.5 rounded-2xl border border-black/10 shadow-2xs space-y-3 transition-all"
                  >
                    {/* Header Row */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1b4d8f] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {getInitials(scientist.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[13.5px] font-bold text-[#1b1a18] truncate leading-snug">
                          {scientist.name}
                        </h3>
                        <p className="text-[11.5px] font-medium text-[#5d5b56]">
                          {scientist.role || scientist.department || 'APEEG'}
                        </p>
                        <p className="font-mono text-[10.5px] text-[#7a7872] truncate mt-0.5">
                          {scientist.email}
                        </p>
                      </div>
                    </div>

                    {/* Holdings Section */}
                    <div className="pt-2 border-t border-black/5 space-y-1.5">
                      {hasHoldings ? (
                        holdings.map((item, idx) => {
                          const isSelfHeld = item.type === 'self';

                          return (
                            <div
                              key={idx}
                              className={`flex justify-between items-center text-[11.5px] px-2.5 py-1.5 rounded-xl border ${
                                isSelfHeld
                                  ? 'bg-[#e8eff8]/60 border-[#1b4d8f]/20'
                                  : 'bg-gray-50/70 border-black/5'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isSelfHeld ? (
                                  <User size={13} className="text-[#1b4d8f] shrink-0" />
                                ) : (
                                  <UserCheck size={13} className="text-[#12695a] shrink-0" />
                                )}
                                <span
                                  className={`font-medium truncate ${
                                    isSelfHeld ? 'text-[#1b4d8f] font-semibold' : 'text-[#1b1a18]'
                                  }`}
                                >
                                  {item.staffName}
                                </span>
                              </div>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                                  isSelfHeld
                                    ? 'text-[#1b4d8f] bg-[#e8eff8]'
                                    : 'text-[#8a5a12] bg-[#fef6e7]'
                                }`}
                              >
                                {item.count}
                              </span>
                            </div>
                          );
                        })
                      ) : (
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

            {/* Scientist Pagination Controls */}
            {totalScientistPages > 1 && (
              <div className="shrink-0 pt-2 flex items-center justify-between border-t border-gray-100">
                <button
                  type="button"
                  disabled={scientistPage === 1}
                  onClick={() => setScientistPage((p) => Math.max(p - 1, 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11.5px] font-medium bg-white border border-gray-200 text-[#1b1a18] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                <span className="text-[11.5px] font-bold text-[#5d5b56]">
                  Page {scientistPage} of {totalScientistPages}
                </span>

                <button
                  type="button"
                  disabled={scientistPage === totalScientistPages}
                  onClick={() => setScientistPage((p) => Math.min(p + 1, totalScientistPages))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11.5px] font-medium bg-white border border-gray-200 text-[#1b1a18] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        /* ==================== STAFF MEMBERS DIRECTORY LIST ==================== */
        savedStaffList.length === 0 ? (
          <div className="flex-1 bg-white p-6 rounded-2xl border border-black/10 flex flex-col items-center justify-center text-center space-y-2">
            <Users className="w-8 h-8 text-gray-300" />
            <p className="text-xs text-gray-500 font-medium">No saved staff members found.</p>
            <p className="text-[11px] text-gray-400">
              Click "Add staff member" below to save new staff contacts.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* 3 Paginated Staff Cards */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 custom-scrollbar">
              {paginatedStaff.map((staff) => {
                const staffRecords = getStaffHoldings(staff);
                const isHoldingInstruments = staffRecords.length > 0;

                return (
                  <div
                    key={staff.id || staff._id}
                    className="bg-white p-3.5 rounded-2xl border border-black/10 shadow-2xs space-y-3 transition-all"
                  >
                    {/* Header Row */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#12695a] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {getInitials(staff.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[13.5px] font-bold text-[#1b1a18] truncate leading-snug">
                          {staff.name}
                        </h3>
                        <p className="font-mono text-[10.5px] text-[#7a7872] truncate mt-0.5">
                          {staff.email || 'No email specified'}
                        </p>
                      </div>
                      <span
                        className={`text-[10.5px] font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                          isHoldingInstruments
                            ? 'bg-[#fef6e7] text-[#8a5a12] border border-[#8a5a12]/20'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {staffRecords.length} Item(s)
                      </span>
                    </div>

                    {/* Instruments List Held By This Staff */}
                    <div className="pt-2 border-t border-black/5 space-y-1.5">
                      {isHoldingInstruments ? (
                        staffRecords.map((record, idx) => {
                          const instrument = record.instrument || {};
                          const borrower =
                            record.borrowerScientist || record.borrower_scientist || {};

                          return (
                            <div
                              key={idx}
                              className="bg-gray-50/80 p-2.5 rounded-xl border border-black/5 space-y-1 text-[11.5px]"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-[#1b1a18] truncate">
                                  {instrument.name || 'Instrument'}
                                </span>
                                <span className="font-mono text-[10px] text-gray-500 shrink-0">
                                  {instrument.assetId || instrument.asset_id}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[10.5px] text-[#5d5b56]">
                                <span className="flex items-center gap-1 truncate">
                                  <User size={11} className="text-[#1b4d8f]" />
                                  Borrower: <strong className="text-[#1b1a18]">{borrower.name || 'Scientist'}</strong>
                                </span>
                                {record.dueDate && (
                                  <span className="flex items-center gap-1 font-mono text-gray-500 shrink-0">
                                    <Clock size={11} />
                                    Due: {record.dueDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center justify-between text-[11.5px] bg-[#f7f6f3] px-2.5 py-1.5 rounded-xl border border-black/5 text-[#7a7872]">
                          <div className="flex items-center gap-1.5">
                            <Package size={13} className="text-gray-400" />
                            <span>No instruments currently in possession</span>
                          </div>
                          <span className="text-[11px] font-medium italic text-gray-400">
                            clear
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Staff Pagination Controls */}
            {totalStaffPages > 1 && (
              <div className="shrink-0 pt-2 flex items-center justify-between border-t border-gray-100">
                <button
                  type="button"
                  disabled={staffPage === 1}
                  onClick={() => setStaffPage((p) => Math.max(p - 1, 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11.5px] font-medium bg-white border border-gray-200 text-[#1b1a18] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                <span className="text-[11.5px] font-bold text-[#5d5b56]">
                  Page {staffPage} of {totalStaffPages}
                </span>

                <button
                  type="button"
                  disabled={staffPage === totalStaffPages}
                  onClick={() => setStaffPage((p) => Math.min(p + 1, totalStaffPages))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11.5px] font-medium bg-white border border-gray-200 text-[#1b1a18] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )
      )}

      

      {/* Add Scientist Form Modal */}
      {isScientistModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-black/10 shadow-xl overflow-hidden p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#e8eff8] text-[#1b4d8f] flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <h3 className="text-sm font-bold text-[#1b1a18]">Add New Scientist</h3>
              </div>
              <button
                onClick={() => setIsScientistModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {scientistModalError && (
              <div className="bg-[#fbe7e3] border border-[#8f2318]/20 text-[#8f2318] text-[11px] font-medium p-2 rounded-xl">
                {scientistModalError}
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
                  value={scientistFormData.name}
                  onChange={handleScientistInputChange}
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
                  value={scientistFormData.email}
                  onChange={handleScientistInputChange}
                  placeholder="ankit.rawat@cbri.res.in"
                  className="w-full bg-white text-[12px] py-2 px-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-[#5d5b56]">Role / Designation</label>
                <input
                  type="text"
                  name="role"
                  value={scientistFormData.role}
                  onChange={handleScientistInputChange}
                  placeholder="e.g. Senior Scientist"
                  className="w-full bg-white text-[12px] py-2 px-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-[#5d5b56]">Mobile</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={scientistFormData.mobile}
                    onChange={handleScientistInputChange}
                    placeholder="9876543210"
                    className="w-full bg-white text-[12px] py-2 px-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-[#5d5b56]">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={scientistFormData.department}
                    onChange={handleScientistInputChange}
                    placeholder="APEEG"
                    className="w-full bg-white text-[12px] py-2 px-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScientistModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#5d5b56] text-[12px] font-semibold py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingScientist}
                  className="flex-1 bg-[#1b4d8f] hover:bg-[#143d73] text-white text-[12px] font-semibold py-2 rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingScientist ? (
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

      {/* Add Staff Member Form Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-black/10 shadow-xl overflow-hidden p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#e6f0ed] text-[#12695a] flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <h3 className="text-sm font-bold text-[#1b1a18]">Add Staff Member</h3>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {staffModalError && (
              <div className="bg-[#fbe7e3] border border-[#8f2318]/20 text-[#8f2318] text-[11px] font-medium p-2 rounded-xl">
                {staffModalError}
              </div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-[#5d5b56]">
                  Staff Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={staffFormData.name}
                  onChange={handleStaffInputChange}
                  placeholder="e.g. Vikram Singh"
                  className="w-full bg-white text-[12px] py-2 px-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#12695a]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-[#5d5b56]">
                  Staff Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={staffFormData.email}
                  onChange={handleStaffInputChange}
                  placeholder="e.g. vikram.staff@cbri.res.in"
                  className="w-full bg-white text-[12px] py-2 px-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#12695a]"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#5d5b56] text-[12px] font-semibold py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStaff}
                  className="flex-1 bg-[#12695a] hover:bg-[#0e5246] text-white text-[12px] font-semibold py-2 rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingStaff ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>Save Staff</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
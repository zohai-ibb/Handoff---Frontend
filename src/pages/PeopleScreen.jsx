import React, { useState } from 'react';
import { UserPlus, X, CheckCircle2, Package, UserCheck, User } from 'lucide-react';

export default function PeopleScreen() {
  // Initial Scientists & Directory Dataset covering all scenarios
  const [scientists, setScientists] = useState([
    {
      id: 'sc_1',
      name: 'Dr. Kishor S. Kulkarni',
      role: 'Group Head, APEEG',
      email: 'kskulkarni@cbri.res.in',
      mobile: '+91 98765 43210',
      department: 'APEEG',
      heldInstruments: [
        { staffName: 'Ankit Rawat', count: '2 instrument(s) held', type: 'staff' },
        { staffName: 'Priya Nautiyal', count: '1 instrument(s) held', type: 'staff' },
      ],
    },
    {
      id: 'sc_2',
      name: 'Dr. A. Sharma',
      role: 'Principal Scientist',
      email: 'asharma@cbri.res.in',
      mobile: '+91 98765 43211',
      department: 'Structural Engineering',
      heldInstruments: [
        { staffName: 'Saurabh Joshi', count: '1 instrument(s) held', type: 'staff' },
      ],
    },
    {
      id: 'sc_3',
      name: 'Dr. Ankit Rawat',
      role: 'Senior Scientist',
      email: 'ankit.rawat@cbri.res.in',
      mobile: '+91 98765 43215',
      department: 'APEEG',
      heldInstruments: [
        { staffName: 'Self (Directly Held)', count: '1 instrument(s) held', type: 'self' },
      ],
    },
    {
      id: 'sc_4',
      name: 'Er. M. Verma',
      role: 'Scientist',
      email: 'mverma@cbri.res.in',
      mobile: '+91 98765 43212',
      department: 'Environmental Science',
      heldInstruments: [], // No staff / No instruments held
    },
  ]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    department: 'APEEG',
    role: 'Scientist',
  });
  const [error, setError] = useState('');

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Helper to extract initials for avatar
  const getInitials = (name) => {
    const cleanName = name.replace(/^(Dr\.|Er\.|Prof\.)\s+/i, '');
    const parts = cleanName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0] ? parts[0].substring(0, 2).toUpperCase() : 'SC';
  };

  // Handle Add Scientist Submission
  const handleAddScientist = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and official email are required.');
      return;
    }

    if (!formData.email.includes('@cbri.res.in')) {
      setError('Please enter a valid CSIR-CBRI email address (@cbri.res.in).');
      return;
    }

    const newScientist = {
      id: `sc_${Date.now()}`,
      name: formData.name.trim(),
      role: formData.role.trim() || 'Scientist',
      email: formData.email.trim(),
      mobile: formData.mobile.trim() || 'N/A',
      department: formData.department.trim() || 'APEEG',
      heldInstruments: [], // Initial state with no staff/instruments held
    };

    setScientists((prev) => [...prev, newScientist]);

    setFormData({
      name: '',
      email: '',
      mobile: '',
      department: 'APEEG',
      role: 'Scientist',
    });
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full space-y-3 font-sans text-[#1b1a18]">
      {/* Scrollable Scientists Directory */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 custom-scrollbar">
        {scientists.map((scientist) => {
          const hasHoldings = scientist.heldInstruments && scientist.heldInstruments.length > 0;

          return (
            <div
              key={scientist.id}
              className="bg-white p-3.5 rounded-2xl border border-black/10 shadow-2xs space-y-3 transition-all"
            >
              {/* Header Row: Avatar, Name, Role, Email */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1b4d8f] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  {getInitials(scientist.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13.5px] font-bold text-[#1b1a18] truncate leading-snug">
                    {scientist.name}
                  </h3>
                  <p className="text-[11.5px] font-medium text-[#5d5b56]">
                    {scientist.role}
                  </p>
                  <p className="font-mono text-[10.5px] text-[#7a7872] truncate mt-0.5">
                    {scientist.email}
                  </p>
                </div>
              </div>

              {/* Staff & Holdings Section */}
              <div className="pt-2 border-t border-black/5 space-y-1.5">
                {hasHoldings ? (
                  scientist.heldInstruments.map((item, idx) => {
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
                  /* Case: No staff & no instruments held */
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

      {/* Footer Area: Add Scientist Button Only */}
      <div className="shrink-0 pt-1">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-white hover:bg-gray-50 text-[#1b1a18] border border-black/15 font-semibold text-[12.5px] py-2.5 px-4 rounded-xl transition-all shadow-2xs active:scale-98 flex items-center justify-center gap-2"
        >
          <UserPlus size={16} className="text-[#1b4d8f]" />
          <span>Add scientist</span>
        </button>
      </div>

      {/* Add Scientist Form Modal */}
      {isModalOpen && (
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
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="bg-[#fbe7e3] border border-[#8f2318]/20 text-[#8f2318] text-[11px] font-medium p-2 rounded-xl">
                {error}
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
                  CSIR-CBRI Email <span className="text-red-500">*</span>
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
                  Designation / Role
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
                  <label className="text-[10.5px] font-bold text-[#5d5b56]">Mobile</label>
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
                  <label className="text-[10.5px] font-bold text-[#5d5b56]">Department</label>
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
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#5d5b56] text-[12px] font-semibold py-2 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#1b4d8f] hover:bg-[#143d73] text-white text-[12px] font-semibold py-2 rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
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
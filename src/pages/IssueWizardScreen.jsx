import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function IssueWizardScreen({ onBack, onShowToast, onIssueComplete }) {
  // Wizard active step tracker (1: Instrument, 2: Person & Staff, 3: Dates, 4: Confirm)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State across all wizard steps
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  
  // Step 2 State: Selected Borrower Scientist & Optional Intermediary Staff details
  const [selectedScientist, setSelectedScientist] = useState(null);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');

  // Step 3 State: Dates & Condition
  const [issueDate, setIssueDate] = useState('09-09-2026');
  const [expectedReturn, setExpectedReturn] = useState('23-09-2026');
  const [purpose, setPurpose] = useState('');
  const [conditionOut, setConditionOut] = useState('Complete with case and accessories');

  // Available instruments mock data (Step 1)
  const availableInstruments = [
    { id: 'inst_1', name: 'Testo 872 Thermal Imager', assetId: 'CBRI/APEEG/0143' },
    { id: 'inst_2', name: 'HOBO MX1101 Temp/RH Loggers (set of 12)', assetId: 'CBRI/APEEG/0210' },
    { id: 'inst_3', name: 'Lutron SL-4023SD Sound Level Meter', assetId: 'CBRI/APEEG/0201' },
    { id: 'inst_4', name: 'Kipp & Zonen CMP6 Pyranometer', assetId: 'CBRI/APEEG/0099' },
  ];

  // Registered Scientists Directory (Step 2 - Borrower Scientist)
  const scientists = [
    {
      id: 'sc_1',
      name: 'Dr. Ankit Rawat',
      initials: 'AR',
      department: 'APEEG',
      email: 'ankit.rawat@cbri.res.in',
    },
    {
      id: 'sc_2',
      name: 'Dr. Priya Nautiyal',
      initials: 'PN',
      department: 'APEEG',
      email: 'priya.nautiyal@cbri.res.in',
    },
    {
      id: 'sc_3',
      name: 'Dr. Saurabh Joshi',
      initials: 'SJ',
      department: 'APEEG',
      email: 'saurabh.joshi@cbri.res.in',
    },
    {
      id: 'sc_4',
      name: 'Dr. Neha Bisht',
      initials: 'NB',
      department: 'APEEG',
      email: 'neha.bisht@cbri.res.in',
    },
  ];

  // Handle QR Scan Simulation
  const handleSimulateScan = () => {
    const scanned = availableInstruments[0];
    setSelectedInstrument(scanned);
    if (onShowToast) {
      onShowToast(`Scanned asset tag: ${scanned.assetId} (${scanned.name})`);
    }
  };

  // Step 1 Validation
  const handleContinueStep1 = () => {
    if (!selectedInstrument) {
      if (onShowToast) onShowToast('Validation Error: Please select or scan an instrument first.');
      return;
    }
    setCurrentStep(2);
  };

  // Step 2 Validation (Scientist is mandatory; Staff Details are optional)
  const handleContinueStep2 = () => {
    if (!selectedScientist) {
      if (onShowToast) onShowToast('Validation Error: Please select a Borrower Scientist.');
      return;
    }
    // Staff details are optional — validation removed for staff fields
    setCurrentStep(3);
  };

  // Step 3 Validation
  const handleContinueStep3 = () => {
    if (!issueDate || !expectedReturn) {
      if (onShowToast) onShowToast('Validation Error: Issue date and expected return date are required.');
      return;
    }
    setCurrentStep(4);
  };

  // Step 4 Final Submission
  const handleConfirmIssue = () => {
    const staffText = staffName.trim() ? `, ${staffName} (${staffEmail})` : '';
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
    <div className="space-y-3.5 font-sans text-[#1b1a18]">
      {/* --- Intro Subheader --- */}
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

      {/* --- Top 4-Step Indicator Bar --- */}
      <div className="space-y-1.5 pb-2">
        <div className="grid grid-cols-4 gap-1.5">
          <div className={`h-1 rounded-full ${currentStep >= 1 ? 'bg-[#1b4d8f]' : 'bg-gray-300'}`} />
          <div className={`h-1 rounded-full ${currentStep >= 2 ? 'bg-[#1b4d8f]' : 'bg-gray-300'}`} />
          <div className={`h-1 rounded-full ${currentStep >= 3 ? 'bg-[#1b4d8f]' : 'bg-gray-300'}`} />
          <div className={`h-1 rounded-full ${currentStep >= 4 ? 'bg-[#12695a]' : 'bg-gray-300'}`} />
        </div>
        <div className="grid grid-cols-4 text-[10.5px] font-medium text-gray-500 text-center">
          <span className={currentStep === 1 ? 'font-bold text-[#1b4d8f]' : ''}>Instrument</span>
          <span className={currentStep === 2 ? 'font-bold text-[#1b4d8f]' : ''}>Person</span>
          <span className={currentStep === 3 ? 'font-bold text-[#1b4d8f]' : ''}>Dates</span>
          <span className={currentStep === 4 ? 'font-bold text-[#12695a]' : ''}>Confirm</span>
        </div>
      </div>

      {/* ==================== STEP 1: SELECT INSTRUMENT ==================== */}
      {currentStep === 1 && (
        <div className="space-y-3.5 animate-fade-in">
          <div className="bg-[#eef3fa] border-2 border-dashed border-[#1b4d8f]/40 rounded-2xl p-5 text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#1b4d8f] mx-auto flex items-center justify-center shadow-xs">
              <span className="font-mono font-bold text-xs text-[#1b4d8f]">QR</span>
            </div>
            <h3 className="text-sm font-bold text-[#1b4d8f]">Scan the asset label</h3>
            <p className="text-[11.5px] text-[#5d5b56] max-w-[220px] mx-auto leading-relaxed">
              Each instrument carries a printed CBRI/APEEG QR sticker. Scanning fills the entry below.
            </p>
            <button
              type="button"
              onClick={handleSimulateScan}
              className="mt-1 bg-[#1b4d8f] text-white text-[12px] font-semibold py-2 px-5 rounded-xl active:scale-95 transition-all shadow-xs"
            >
              Simulate scan
            </button>
          </div>

          <div className="text-center">
            <span className="text-[11.5px] text-[#7a7872]">or choose manually</span>
          </div>

          <div className="space-y-2">
            {availableInstruments.map((item) => {
              const isSelected = selectedInstrument?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedInstrument(item)}
                  className={`bg-white p-3.5 rounded-2xl border transition-all cursor-pointer active:scale-99 shadow-xs ${
                    isSelected
                      ? 'border-[#1b4d8f] ring-1 ring-[#1b4d8f] bg-[#f4f7fc]'
                      : 'border-black/10 hover:border-gray-300'
                  }`}
                >
                  <h4 className="text-[13.5px] font-semibold text-[#1b1a18]">{item.name}</h4>
                  <p className="font-mono text-[11px] text-[#7a7872] mt-0.5">{item.assetId}</p>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={handleContinueStep1}
              className="w-full bg-[#1b4d8f] text-white py-3 rounded-xl text-[13.5px] font-semibold active:scale-98 transition-all shadow-xs text-center"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ==================== STEP 2: SELECT BORROWER SCIENTIST & STAFF (OPTIONAL) ==================== */}
      {currentStep === 2 && (
        <div className="space-y-3.5 animate-fade-in">
          {/* Selected Instrument Summary Card */}
          <div className="bg-white p-3.5 rounded-2xl border border-black/10 space-y-0.5 shadow-xs">
            <span className="text-[10px] font-bold tracking-wider text-[#7a7872] uppercase">
              INSTRUMENT
            </span>
            <h3 className="text-[14px] font-bold text-[#1b1a18]">{selectedInstrument?.name}</h3>
          </div>

          {/* --- Section A: Select Borrower Scientist (Mandatory) --- */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold tracking-wider text-[#5d5b56] uppercase">
              ISSUE TO BORROWER SCIENTIST *
            </span>

            <div className="space-y-2">
              {scientists.map((sc) => {
                const isSelected = selectedScientist?.id === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => setSelectedScientist(sc)}
                    className={`bg-white p-3 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer active:scale-99 shadow-xs ${
                      isSelected
                        ? 'border-[#1b4d8f] ring-1 ring-[#1b4d8f] bg-[#f4f7fc]'
                        : 'border-black/10 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#eef3fa] text-[#1b4d8f] font-bold text-xs flex items-center justify-center shrink-0">
                      {sc.initials}
                    </div>
                    <div>
                      <h4 className="text-[13.5px] font-semibold text-[#1b1a18] leading-tight">
                        {sc.name}
                      </h4>
                      <p className="text-[11.5px] text-[#5d5b56] mt-0.5 font-mono">
                        {sc.email}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* --- Section B: Intermediary Staff Details Form (Optional) --- */}
          <div className="pt-2 space-y-2.5 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#5d5b56] uppercase">
                INTERMEDIARY STAFF DETAILS
              </span>
              <span className="text-[10px] text-gray-400 uppercase font-medium">Optional</span>
            </div>

            <div className="space-y-1">
              <label className="text-[11.5px] font-semibold text-[#5d5b56]">
                Staff Member Name 
              </label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="e.g. Vikram Singh"
                className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11.5px] font-semibold text-[#5d5b56]">
                Staff Member Email 
              </label>
              <input
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="e.g. vikram.staff@cbri.res.in"
                className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
              />
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="bg-white text-[#1b1a18] border border-gray-300 py-3 px-5 rounded-xl text-[13px] font-medium active:scale-98 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleContinueStep2}
              className="flex-1 bg-[#1b4d8f] text-white py-3 rounded-xl text-[13.5px] font-semibold active:scale-98 transition-all shadow-xs text-center"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ==================== STEP 3: DATES & PURPOSE ==================== */}
      {currentStep === 3 && (
        <div className="space-y-3 pt-1 animate-fade-in">
          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-[#5d5b56]">Issue date</label>
            <input
              type="text"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-[#5d5b56]">Expected return</label>
            <input
              type="text"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
            />
            <p className="text-[11px] text-[#7a7872] leading-normal pt-0.5">
              Default loan period is 14 days. Reminder goes out 2 day(s) before, then daily once overdue.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-[#5d5b56]">Purpose / project</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Envelope thermal monitoring, Bhopal site"
              className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-[#5d5b56]">Condition at issue</label>
            <input
              type="text"
              value={conditionOut}
              onChange={(e) => setConditionOut(e.target.value)}
              className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="bg-white text-[#1b1a18] border border-gray-300 py-3 px-5 rounded-xl text-[13px] font-medium active:scale-98 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleContinueStep3}
              className="flex-1 bg-[#1b4d8f] text-white py-3 rounded-xl text-[13.5px] font-semibold active:scale-98 transition-all shadow-xs text-center"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ==================== STEP 4: CONFIRM & MAIL PREVIEW ==================== */}
      {currentStep === 4 && (
        <div className="space-y-3.5 animate-fade-in">
          {/* Summary Card */}
          <div className="bg-white p-3.5 rounded-2xl border border-black/10 space-y-2 text-[12.5px] shadow-xs">
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
                {staffName.trim() ? staffName : 'None specified'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7a7872]">Period</span>
              <span className="font-semibold text-[#1b1a18]">09 Sept 2026 → 23 Sept 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7a7872]">Purpose</span>
              <span className="font-semibold text-[#1b1a18]">{purpose.trim() ? purpose : 'Not stated'}</span>
            </div>
          </div>

          {/* Mail Goes To Panel */}
          <div className="bg-[#eef3fa] border border-[#1b4d8f]/20 rounded-2xl p-3.5 space-y-2.5">
            <span className="text-[11px] font-bold tracking-wider text-[#1b4d8f] uppercase">
              MAIL GOES TO
            </span>

            {/* Recipient 1: Borrower Scientist */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1b4d8f] mt-1.5 shrink-0" />
                <div>
                  <h4 className="text-[12.5px] font-bold text-[#1b1a18]">{selectedScientist?.name}</h4>
                  <p className="font-mono text-[10.5px] text-[#5d5b56]">{selectedScientist?.email}</p>
                </div>
              </div>
              <span className="text-[10.5px] text-[#5d5b56]">Borrower Scientist</span>
            </div>

            {/* Recipient 2: Intermediary Staff (Renders only if provided) */}
            {staffEmail.trim() && (
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1b4d8f] mt-1.5 shrink-0" />
                  <div>
                    <h4 className="text-[12.5px] font-bold text-[#1b1a18]">
                      {staffName.trim() ? staffName : 'Intermediary Staff'}
                    </h4>
                    <p className="font-mono text-[10.5px] text-[#5d5b56]">{staffEmail}</p>
                  </div>
                </div>
                <span className="text-[10.5px] text-[#5d5b56]">Intermediary Staff</span>
              </div>
            )}

            {/* Recipient 3: Owner Scientist & Group Head */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1b4d8f] mt-1.5 shrink-0" />
                <div>
                  <h4 className="text-[12.5px] font-bold text-[#1b1a18]">Dr. Kishor S. Kulkarni</h4>
                  <p className="font-mono text-[10.5px] text-[#5d5b56]">kskulkarni@cbri.res.in</p>
                </div>
              </div>
              <span className="text-[10.5px] text-[#5d5b56]">Owner Scientist & Group Head</span>
            </div>

            <div className="border-t border-[#1b4d8f]/15 pt-2 text-[12px] leading-relaxed text-[#3f4d63]">
              {selectedInstrument?.name} ({selectedInstrument?.assetId}) is issued to {selectedScientist?.name}
              {staffName.trim() ? ` via ${staffName}` : ''} from 09 Sept 2026 to 23 Sept 2026 for {purpose.trim() ? purpose : 'group work'}. Condition at issue: {conditionOut}.
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setCurrentStep(3)}
              className="bg-white text-[#1b1a18] border border-gray-300 py-3 px-5 rounded-xl text-[13px] font-medium active:scale-98 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleConfirmIssue}
              className="flex-1 bg-[#12695a] text-white py-3 rounded-xl text-[13.5px] font-bold active:scale-98 transition-all shadow-xs text-center"
            >
              Confirm & send mail
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
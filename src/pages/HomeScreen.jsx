import React, { useState, useEffect } from "react";
import {
  getInstruments,
  getActiveIssueRecords,
} from "../api/instrumentService";
import { isRecordOverdue } from "../utils/dateUtils";
import { Maximize2, X, Info, Activity } from "lucide-react";

export default function HomeScreen({ onNavigate }) {
  const [instruments, setInstruments] = useState([]);
  const [issueRecords, setIssueRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [instData, recordsData] = await Promise.all([
          getInstruments(),
          getActiveIssueRecords(),
        ]);

        if (isMounted) {
          const openRecords = (recordsData || []).filter(
            (r) => r.state === "OPEN" || r.state === "ISSUED" || !r.state,
          );
          setInstruments(instData || []);
          setIssueRecords(openRecords);
        }
      } catch (err) {
        if (isMounted)
          setError("Failed to load dashboard metrics from server.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Available instruments count
  const availableCount = instruments.filter(
    (i) => i.status === "AVAILABLE",
  ).length;

  // 2. Maintenance instruments count
  const maintenanceCount = instruments.filter(
    (i) => i.status === "MAINTENANCE",
  ).length;

  // 3. Overdue count from open issue records
  const overdueCount = issueRecords.filter((r) => isRecordOverdue(r)).length;

  // 4. Total items marked ISSUED in instrument inventory
  const totalDbIssuedCount = instruments.filter(
    (i) => i.status === "ISSUED",
  ).length;

  // 5. On-time Issued count = Total ISSUED minus Overdue
  const issuedCount = Math.max(0, totalDbIssuedCount - overdueCount);

  return (
    <div className="space-y-4 font-sans text-[#1b1a18] pb-4">
      {error && (
        <div className="bg-[#fcf2f2] text-[#c92a2a] text-[11.5px] p-2.5 rounded-xl border border-[#f5c2c2]">
          {error}
        </div>
      )}

      {/* 4 Stat Tiles Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div
          onClick={() => onNavigate && onNavigate("Items")}
          className="bg-white p-3.5 rounded-2xl border border-black/10 cursor-pointer active:scale-98 transition-all shadow-xs"
        >
          <div className="text-2xl font-bold text-[#12695a]">
            {isLoading ? "..." : availableCount}
          </div>
          <div className="text-[12px] text-[#5d5b56] mt-1">Available</div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate("Due")}
          className="bg-white p-3.5 rounded-2xl border border-black/10 cursor-pointer active:scale-98 transition-all shadow-xs"
        >
          <div className="text-2xl font-bold text-[#8a5a12]">
            {isLoading ? "..." : issuedCount}
          </div>
          <div className="text-[12px] text-[#5d5b56] mt-1">Issued / in use</div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate("Due")}
          className="bg-white p-3.5 rounded-2xl border border-black/10 cursor-pointer active:scale-98 transition-all shadow-xs"
        >
          <div className="text-2xl font-bold text-[#8f2318]">
            {isLoading ? "..." : overdueCount}
          </div>
          <div className="text-[12px] text-[#5d5b56] mt-1">Overdue</div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate("Items")}
          className="bg-white p-3.5 rounded-2xl border border-black/10 cursor-pointer active:scale-98 transition-all shadow-xs"
        >
          <div className="text-2xl font-bold text-[#5c4a86]">
            {isLoading ? "..." : maintenanceCount}
          </div>
          <div className="text-[12px] text-[#5d5b56] mt-1">Maintenance</div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="flex gap-2.5 pt-1">
        <button
          onClick={() => onNavigate && onNavigate("Due")}
          className="flex-1 bg-white text-[#1b1a18] border border-gray-300 py-2.5 px-2 rounded-xl text-[13px] font-medium shadow-xs active:scale-95 transition-all text-center cursor-pointer"
        >
          Due
        </button>
        <button
          onClick={() => onNavigate && onNavigate("Receive")}
          className="flex-1 bg-white text-[#1b1a18] border border-gray-300 py-2.5 px-2 rounded-xl text-[13px] font-medium shadow-xs active:scale-95 transition-all text-center cursor-pointer"
        >
          Receive
        </button>
        <button
          onClick={() => onNavigate && onNavigate("Add item")}
          className="flex-1 bg-white text-[#1b1a18] border border-gray-300 py-2.5 px-2 rounded-xl text-[13px] font-medium shadow-xs active:scale-95 transition-all text-center cursor-pointer"
        >
          Add Item
        </button>
      </div>

      {/* Interactive Continuously Animated Flow Card */}
      <div className="pt-2">
        <div className="bg-white p-4 rounded-2xl border border-black/10 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#1b4d8f]">
              <Activity size={16} className="animate-pulse text-[#1b4d8f]" />
              <span className="text-[12px] font-bold tracking-wider uppercase">
                System Lifecycle Flow
              </span>
            </div>
            <button
              onClick={() => setIsFlowModalOpen(true)}
              className="flex items-center gap-1 text-[11px] font-medium text-[#1b4d8f] bg-[#eef3fa] px-2.5 py-1 rounded-lg hover:bg-[#dce7f4] active:scale-95 transition-all cursor-pointer"
            >
              <Maximize2 size={12} /> Full Screen
            </button>
          </div>

          <p className="text-[11.5px] text-[#5d5b56] leading-relaxed">
            Live animated diagram showing how instruments transition through QR scanning, issued loans, return condition checks, and maintenance.
          </p>

          {/* Embedded Animated Flowchart Container */}
          <div
            onClick={() => setIsFlowModalOpen(true)}
            className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-[#1b4d8f] active:scale-[0.99] transition-all relative group overflow-hidden"
          >
            <div className="absolute top-2 right-2 bg-white/90 p-1 rounded-md shadow-xs text-gray-500 group-hover:text-[#1b4d8f] z-10">
              <Maximize2 size={14} />
            </div>

            <AnimatedFlowChartSVG />
          </div>
        </div>
      </div>

      {/* Full Screen Android Modal Overlay */}
      {isFlowModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-between p-4 animate-fade-in">
          {/* Modal Header */}
          <div className="flex items-center justify-between text-white pt-2 pb-3 border-b border-white/20">
            <div className="flex items-center gap-2">
              <Activity size={18} className="animate-pulse text-[#dce7f4]" />
              <div>
                <h3 className="text-sm font-bold tracking-wide">
                  Live Instrument Regulation Flowchart
                </h3>
                <p className="text-[10.5px] text-gray-300">
                  CSIR-Yantra Dhristi Application Workflow
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsFlowModalOpen(false)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white active:scale-90 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Interactive Full Screen Scroll Area */}
          <div className="flex-1 overflow-y-auto my-4 py-2 flex items-center justify-center">
            <div className="w-full bg-white rounded-2xl p-4 shadow-2xl overflow-x-auto">
              <AnimatedFlowChartSVG />
            </div>
          </div>

          {/* Modal Footer / Close Action */}
          <div className="pt-2">
            <button
              onClick={() => setIsFlowModalOpen(false)}
              className="w-full py-3 bg-[#1b4d8f] text-white text-xs font-bold rounded-xl active:scale-98 transition-all shadow-md cursor-pointer"
            >
              Close Full Screen View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   CONTINUOUSLY ANIMATED SVG FLOWCHART COMPONENT
   ========================================================= */
function AnimatedFlowChartSVG() {
  return (
    <svg
      viewBox="0 0 340 510"
      className="w-full h-auto select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        /* Flow line dash movement */
        @keyframes flowDash {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-flow-dash {
          stroke-dasharray: 6, 6;
          animation: flowDash 1.2s linear infinite;
        }

        /* Pulsing node animation */
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.03); }
        }
        .animate-pulse-glow {
          animation: pulseGlow 2s ease-in-out infinite;
          transform-origin: center;
        }

        /* Moving beam/particle down main path */
        @keyframes beamMove {
          0% { cy: 55; }
          100% { cy: 165; }
        }
        .animate-beam-dot {
          animation: beamMove 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* Scanning laser line on QR block */
        @keyframes laserScan {
          0% { y: 88; opacity: 0.2; }
          50% { y: 132; opacity: 0.8; }
          100% { y: 88; opacity: 0.2; }
        }
        .animate-laser {
          animation: laserScan 2s ease-in-out infinite;
        }
      `}</style>

      {/* Node 1: Add Instrument */}
      <rect x="20" y="10" width="300" height="48" rx="10" fill="#1b4d8f" />
      <text x="170" y="32" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">
        1. Instrument Registered
      </text>
      <text x="170" y="46" textAnchor="middle" fill="#dce7f4" fontSize="9">
        Status: AVAILABLE (QR Label Printed)
      </text>

      {/* Flow Line 1 (Animated Dashes) */}
      <path d="M170 58 V80" stroke="#1b4d8f" strokeWidth="2.5" className="animate-flow-dash" />
      <polygon points="170,85 165,77 175,77" fill="#1b4d8f" />

      {/* Node 2: QR Scan & Issue Wizard */}
      <rect x="20" y="85" width="300" height="52" rx="10" fill="#ffffff" stroke="#1b4d8f" strokeWidth="1.5" />
      {/* Animated Scan Line effect */}
      <rect x="25" y="88" width="290" height="2" fill="#1b4d8f" className="animate-laser" />
      <text x="170" y="107" textAnchor="middle" fill="#1b1a18" fontSize="12" fontWeight="bold">
        2. QR Scan / Issue Wizard
      </text>
      <text x="170" y="123" textAnchor="middle" fill="#5d5b56" fontSize="9.5">
        Captures borrower, due date & emails staff
      </text>

      {/* Flow Line 2 */}
      <path d="M170 137 V160" stroke="#1b4d8f" strokeWidth="2.5" className="animate-flow-dash" />
      <polygon points="170,165 165,157 175,157" fill="#1b4d8f" />

      {/* Node 3: Active Loan / In Use */}
      <rect x="20" y="165" width="300" height="48" rx="10" fill="#fbf0dc" stroke="#8a5a12" strokeWidth="1.5" />
      {/* Pulse effect behind node */}
      <rect x="18" y="163" width="304" height="52" rx="12" fill="#8a5a12" className="animate-pulse-glow" opacity="0.15" />
      <text x="170" y="187" textAnchor="middle" fill="#8a5a12" fontSize="12" fontWeight="bold">
        3. Instrument In Use (ISSUED)
      </text>
      <text x="170" y="201" textAnchor="middle" fill="#8a5a12" fontSize="9">
        Automated daily reminders if overdue
      </text>

      {/* Flow Line 3 */}
      <path d="M170 213 V235" stroke="#1b4d8f" strokeWidth="2.5" className="animate-flow-dash" />
      <polygon points="170,240 165,232 175,232" fill="#1b4d8f" />

      {/* Continuous Particle/Beam Dot moving down */}
      <circle cx="170" cy="55" r="4" fill="#12695a" className="animate-beam-dot" />

      {/* Decision Node: Return Inspection */}
      <polygon points="170,240 280,270 170,300 60,270" fill="#ffffff" stroke="#1b4d8f" strokeWidth="1.5" />
      <text x="170" y="267" textAnchor="middle" fill="#1b1a18" fontSize="11" fontWeight="bold">
        Receive Return
      </text>
      <text x="170" y="279" textAnchor="middle" fill="#5d5b56" fontSize="8.5">
        Condition Check
      </text>

      {/* Path A: GOOD Condition */}
      <path d="M60 270 H30 V350 H70" stroke="#12695a" strokeWidth="2.5" className="animate-flow-dash" />
      <polygon points="75,350 67,345 67,355" fill="#12695a" />
      <text x="25" y="260" fill="#12695a" fontSize="9" fontWeight="bold">
        GOOD
      </text>

      {/* Node 4A: Available */}
      <rect x="75" y="328" width="105" height="44" rx="8" fill="#e8f5e9" stroke="#12695a" strokeWidth="1.5" />
      <text x="127" y="348" textAnchor="middle" fill="#12695a" fontSize="10" fontWeight="bold">
        AVAILABLE
      </text>
      <text x="127" y="360" textAnchor="middle" fill="#12695a" fontSize="8">
        Ready to reissue
      </text>

      {/* Path B: BAD Condition */}
      <path d="M280 270 H310 V350 H265" stroke="#8f2318" strokeWidth="2.5" className="animate-flow-dash" />
      <polygon points="260,350 268,345 268,355" fill="#8f2318" />
      <text x="285" y="260" fill="#8f2318" fontSize="9" fontWeight="bold">
        BAD
      </text>

      {/* Node 4B: Maintenance */}
      <rect x="160" y="328" width="100" height="44" rx="8" fill="#fbe4e0" stroke="#8f2318" strokeWidth="1.5" />
      <text x="210" y="348" textAnchor="middle" fill="#8f2318" fontSize="10" fontWeight="bold">
        MAINTENANCE
      </text>
      <text x="210" y="360" textAnchor="middle" fill="#8f2318" fontSize="8">
        Locked for repair
      </text>

      {/* Re-entry Path back to Available */}
      <path d="M210 372 V400 H127 V372" stroke="#12695a" strokeWidth="1.5" className="animate-flow-dash" />
      <polygon points="127,372 122,380 132,380" fill="#12695a" />
      <text x="170" y="415" textAnchor="middle" fill="#5d5b56" fontSize="8.5">
        Calibration completed & cleared
      </text>

      {/* Bottom Summary Badge */}
      <rect x="20" y="435" width="300" height="45" rx="10" fill="#eef3fa" stroke="#1b4d8f" strokeWidth="1" />
      <text x="170" y="454" textAnchor="middle" fill="#1b4d8f" fontSize="10" fontWeight="bold">
        Automated Email Logging & Stakeholder Sync
      </text>
      <text x="170" y="468" textAnchor="middle" fill="#5d5b56" fontSize="8.5">
        Notifies Borrower, Staff Member & Owner
      </text>
    </svg>
  );
}
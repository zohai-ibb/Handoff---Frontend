import React, { useState } from "react";

export default function HomeScreen({ onNavigate }) {
  // Static mock data matching the exact numbers & items from the image
  const [stats] = useState({
    available: 4,
    issued: 4,
    overdue: 1,
    maintenance: 2,
  });

  const [currentlyOut] = useState([
    {
      id: "1",
      name: "Fluke 1736 Three-Phase Power Logger",
      assetId: "CBRI/APEEG/0121",
      holder: "Ankit Rawat",
      context: "return by 12 Sept",
      status: "Issued",
      statusType: "issued", // Gold pill
    },
    {
      id: "2",
      name: "Hukseflux HFP01 Heat Flux Sensor Set",
      assetId: "CBRI/APEEG/0088",
      holder: "Priya Nautiyal",
      context: "due 04 Sept, 5 days late",
      status: "Overdue",
      statusType: "overdue", // Soft red pill
    },
    {
      id: "3",
      name: "Kimo DBM 610 Air Flow Meter",
      assetId: "CBRI/APEEG/0177",
      holder: "Saurabh Joshi",
      context: "return by 20 Sept",
      status: "Issued",
      statusType: "issued", // Gold pill
    },
  ]);

  return (
    <div className="space-y-4 font-sans text-[#1b1a18]">
      {/* --- Top Stat Cards (Flexbox Rows) --- */}
      <div className="flex flex-col gap-2.5">
        {/* Row 1: Available & Issued */}
        <div className="flex gap-2.5">
          {/* Available Card */}
          <div
            onClick={() => onNavigate && onNavigate("Items")}
            className="flex-1 bg-white p-3.5 rounded-2xl border border-black/10 cursor-pointer active:scale-98 transition-all shadow-xs"
          >
            <div className="text-2xl font-bold text-[#12695a] tracking-tight">
              {stats.available}
            </div>
            <div className="text-[12px] font-normal text-[#5d5b56] mt-1">
              Available
            </div>
          </div>

          {/* Issued / in use Card */}
          <div
            onClick={() => onNavigate && onNavigate("Due")}
            className="flex-1 bg-white p-3.5 rounded-2xl border border-black/10 cursor-pointer active:scale-98 transition-all shadow-xs"
          >
            <div className="text-2xl font-bold text-[#8a5a12] tracking-tight">
              {stats.issued}
            </div>
            <div className="text-[12px] font-normal text-[#5d5b56] mt-1">
              Issued / in use
            </div>
          </div>
        </div>

        {/* Row 2: Overdue & Maintenance */}
        <div className="flex gap-2.5">
          {/* Overdue Card */}
          <div
            onClick={() => onNavigate && onNavigate("Due")}
            className="flex-1 bg-white p-3.5 rounded-2xl border border-black/10 cursor-pointer active:scale-98 transition-all shadow-xs"
          >
            <div className="text-2xl font-bold text-[#8f2318] tracking-tight">
              {stats.overdue}
            </div>
            <div className="text-[12px] font-normal text-[#5d5b56] mt-1">
              Overdue
            </div>
          </div>

          {/* Maintenance / calibration Card */}
          <div
            onClick={() => onNavigate && onNavigate("Items")}
            className="flex-1 bg-white p-3.5 rounded-2xl border border-black/10 cursor-pointer active:scale-98 transition-all shadow-xs"
          >
            <div className="text-2xl font-bold text-[#5c4a86] tracking-tight">
              {stats.maintenance}
            </div>
            <div className="text-[12px] font-normal text-[#5d5b56] mt-1 leading-snug">
              Maintenance / calibration
            </div>
          </div>
        </div>
      </div>

      {/* --- Action Buttons Row (Flexbox) --- */}
      <div className="flex gap-2.5 pt-1">
        <button
          onClick={() => onNavigate && onNavigate("Issue")}
          className="flex-1 bg-[#1b4d8f] text-white py-2.5 px-2 rounded-xl text-[13px] font-semibold shadow-xs active:scale-95 transition-all text-center"
        >
          Issue
        </button>

        {/* Receive Button Triggers the Receive Back Screen */}
        <button
          onClick={() => onNavigate && onNavigate("Receive")}
          className="flex-1 bg-white text-[#1b1a18] border border-gray-300 py-2.5 px-2 rounded-xl text-[13px] font-medium shadow-xs active:scale-95 transition-all text-center"
        >
          Receive
        </button>

        <button
          onClick={() => onNavigate && onNavigate("Add item")}
          className="flex-1 bg-white text-[#1b1a18] border border-gray-300 py-2.5 px-2 rounded-xl text-[13px] font-medium shadow-xs active:scale-95 transition-all text-center"
        >
          Add item
        </button>
      </div>

      {/* --- CURRENTLY OUT Section --- */}
      <div className="pt-2 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[#5d5b56] uppercase">
            CURRENTLY OUT
          </span>
          <button
            onClick={() => onNavigate && onNavigate("Items")}
            className="text-[12px] text-[#1b4d8f] font-normal hover:underline"
          >
            All instruments
          </button>
        </div>

        {/* Instrument Rows */}
        <div className="space-y-2.5">
          {currentlyOut.map((item) => (
            <div
              key={item.id}
              onClick={() => onNavigate && onNavigate("Items")}
              className="bg-white p-3.5 rounded-2xl border border-black/10 flex items-start justify-between cursor-pointer active:bg-gray-50 transition-all shadow-xs"
            >
              <div className="space-y-1 max-w-[72%]">
                <h4 className="text-[13.5px] font-semibold leading-snug text-[#1b1a18]">
                  {item.name}
                </h4>
                <div className="font-mono text-[11px] text-[#7a7872]">
                  {item.assetId}
                </div>
                <div className="text-[12px] text-[#5d5b56] leading-relaxed">
                  <span className="font-medium text-[#3f3d39]">
                    {item.holder}
                  </span>{" "}
                  · {item.context}
                </div>
              </div>

              {/* Status Pill Badge */}
              <div className="shrink-0 mt-0.5">
                {item.statusType === "issued" ? (
                  <span className="bg-[#fbf0dc] text-[#8a5a12] text-[11px] font-medium px-2.5 py-1 rounded-md">
                    Issued
                  </span>
                ) : (
                  <span className="bg-[#fbe4e0] text-[#8f2318] text-[11px] font-medium px-2.5 py-1 rounded-md">
                    Overdue
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

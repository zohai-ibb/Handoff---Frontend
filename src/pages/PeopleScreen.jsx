import React, { useState } from "react";

export default function PeopleScreen({ onShowToast }) {
  // Static mock directory matching CSIR-CBRI APEEG specs
  const [scientists] = useState([
    {
      id: "sc_1",
      name: "Dr. Kishor S. Kulkarni",
      initials: "KS",
      role: "Group Head, APEEG",
      email: "kskulkarni@cbri.res.in",
      holdings: [
        { name: "Ankit Rawat", count: "2 instrument(s) held" },
        { name: "Priya Nautiyal", count: "1 instrument(s) held" },
      ],
    },
    {
      id: "sc_2",
      name: "Dr. A. Sharma",
      initials: "AS",
      role: "Principal Scientist",
      email: "asharma@cbri.res.in",
      holdings: [
        { name: "Saurabh Joshi", count: "1 instrument(s) held" },
      ],
    },
    {
      id: "sc_3",
      name: "Er. M. Verma",
      initials: "MV",
      role: "Scientist",
      email: "mverma@cbri.res.in",
      holdings: [
        { name: "Neha Bisht", count: "nothing held" },
      ],
    },
  ]);

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden font-sans text-[#1b1a18]">
      {/* Top Fixed Header Subtitle */}
      <div className="shrink-0 pb-2">
        <p className="text-[12px] text-[#5d5b56]">
          APEEG Scientists & active project staff holdings directory.
        </p>
      </div>

      {/* Middle Scrollable Directory List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {scientists.map((person) => (
          <div
            key={person.id}
            className="bg-white p-3.5 rounded-2xl border border-black/10 shadow-xs space-y-3"
          >
            {/* Header Block: Avatar, Name, Role & Email */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1b4d8f] text-white font-bold text-xs flex items-center justify-center shrink-0">
                {person.initials}
              </div>
              <div className="overflow-hidden">
                <h3 className="text-[14px] font-bold text-[#1b1a18] leading-tight truncate">
                  {person.name}
                </h3>
                <p className="text-[11.5px] text-[#5d5b56] mt-0.5">
                  {person.role}
                </p>
                <p className="font-mono text-[10.5px] text-[#7a7872] mt-0.5 truncate">
                  {person.email}
                </p>
              </div>
            </div>

            {/* Top-Bordered Holdings Sub-List */}
            <div className="border-t border-gray-100 pt-2.5 space-y-1.5">
              {person.holdings.map((holding, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-[12px]"
                >
                  <span className="font-medium text-[#1b1a18]">
                    {holding.name}
                  </span>
                  <span
                    className={`text-[11px] ${
                      holding.count === "nothing held"
                        ? "text-gray-400 font-normal"
                        : "text-[#5d5b56] font-medium"
                    }`}
                  >
                    {holding.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
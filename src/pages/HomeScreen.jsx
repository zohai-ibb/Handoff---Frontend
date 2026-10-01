import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, PlusCircle, CheckCircle, Package, Clock, ShieldAlert, ArrowRight } from 'lucide-react';

export default function HomeScreen() {
  const navigate = useNavigate();

  // Mock data representing state from backend
  const [stats] = useState({
    total: 10,
    available: 6,
    issued: 3,
    overdue: 1,
  });

  const [overdueItems] = useState([
    {
      id: 'rec_101',
      assetId: 'CBRI/APEEG/0122',
      name: 'FLIR E8-XT Thermal Camera',
      holder: 'Dr. Ankit Rawat',
      dueDate: '2026-09-25',
      daysOverdue: 5,
    },
  ]);

  const [activeLoans] = useState([
    {
      id: 'rec_101',
      assetId: 'CBRI/APEEG/0122',
      name: 'FLIR E8-XT Thermal Camera',
      holder: 'Dr. Ankit Rawat',
      dueDate: '2026-09-25',
      isOverdue: true,
    },
    {
      id: 'rec_102',
      assetId: 'CBRI/APEEG/0124',
      name: 'Kimo DB200 Sound Level Meter',
      holder: 'Vikram Singh (Staff)',
      dueDate: '2026-10-08',
      isOverdue: false,
    },
  ]);

  return (
    <div className="space-y-4">
      {/* --- Overdue Warning Banner (If Any Overdue Items Exist) --- */}
      {overdueItems.length > 0 && (
        <div className="bg-[#fcf2f2] border border-[#f5c2c2] rounded-xl p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#f8d7d7] flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={18} className="text-[#c92a2a]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-[#861818]">
                {overdueItems.length} Overdue Instrument{overdueItems.length > 1 ? 's' : ''}
              </h3>
              <button
                onClick={() => navigate('/due')}
                className="text-[11px] font-semibold text-[#c92a2a] flex items-center gap-0.5 hover:underline"
              >
                View <ArrowRight size={12} />
              </button>
            </div>
            <p className="text-[11.5px] text-[#5d1212] mt-0.5 leading-snug">
              {overdueItems[0].name} held by <span className="font-medium">{overdueItems[0].holder}</span> is {overdueItems[0].daysOverdue} days overdue.
            </p>
          </div>
        </div>
      )}

      {/* --- 4 Summary Stat Grid Tiles --- */}
      <div className="grid grid-cols-2 gap-2.5">
        <div
          onClick={() => navigate('/items')}
          className="bg-white p-3 rounded-xl border border-black/10 cursor-pointer active:bg-gray-50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#7a7872]">Total Items</span>
            <Package size={16} className="text-[#1b4d8f]" />
          </div>
          <div className="text-xl font-bold text-[#1b1a18] mt-1">{stats.total}</div>
        </div>

        <div
          onClick={() => navigate('/items')}
          className="bg-white p-3 rounded-xl border border-black/10 cursor-pointer active:bg-gray-50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#7a7872]">Available</span>
            <CheckCircle size={16} className="text-[#2b8a3e]" />
          </div>
          <div className="text-xl font-bold text-[#2b8a3e] mt-1">{stats.available}</div>
        </div>

        <div
          onClick={() => navigate('/due')}
          className="bg-white p-3 rounded-xl border border-black/10 cursor-pointer active:bg-gray-50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#7a7872]">Issued Out</span>
            <Clock size={16} className="text-[#e67700]" />
          </div>
          <div className="text-xl font-bold text-[#e67700] mt-1">{stats.issued}</div>
        </div>

        <div
          onClick={() => navigate('/due')}
          className="bg-white p-3 rounded-xl border border-black/10 cursor-pointer active:bg-gray-50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#7a7872]">Overdue</span>
            <ShieldAlert size={16} className="text-[#c92a2a]" />
          </div>
          <div className="text-xl font-bold text-[#c92a2a] mt-1">{stats.overdue}</div>
        </div>
      </div>

      {/* --- Quick Action Shortcuts --- */}
      <div className="bg-white p-3.5 rounded-xl border border-black/10 space-y-2">
        <h3 className="text-[12px] font-semibold tracking-wider text-[#7a7872] uppercase">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate('/issue')}
            className="flex items-center justify-center gap-2 bg-[#1b4d8f] text-white py-2.5 px-3 rounded-lg text-[12px] font-medium active:scale-98 transition-all"
          >
            <PlusCircle size={16} />
            <span>Issue Item</span>
          </button>
          <button
            onClick={() => navigate('/due')}
            className="flex items-center justify-center gap-2 bg-[#f0f4f9] text-[#1b4d8f] border border-[#1b4d8f]/20 py-2.5 px-3 rounded-lg text-[12px] font-medium active:scale-98 transition-all"
          >
            <Clock size={16} />
            <span>Receive Back</span>
          </button>
        </div>
      </div>

      {/* --- Active Loans List --- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-semibold tracking-wider text-[#7a7872] uppercase">
            Active Checkouts ({activeLoans.length})
          </h3>
          <button
            onClick={() => navigate('/due')}
            className="text-[11px] text-[#1b4d8f] font-semibold hover:underline"
          >
            View all
          </button>
        </div>

        <div className="space-y-2">
          {activeLoans.map((loan) => (
            <div
              key={loan.id}
              className="bg-white p-3 rounded-xl border border-black/10 flex items-center justify-between shadow-2xs"
            >
              <div>
                <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-semibold">
                  {loan.assetId}
                </span>
                <h4 className="text-[13px] font-medium text-[#1b1a18] mt-1">{loan.name}</h4>
                <p className="text-[11px] text-[#5d5b56] mt-0.5">
                  Holder: <span className="font-medium text-gray-800">{loan.holder}</span>
                </p>
              </div>

              <div className="text-right">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                    loan.isOverdue
                      ? 'bg-[#fcf2f2] text-[#c92a2a] border border-[#f5c2c2]'
                      : 'bg-[#eef6ff] text-[#1b4d8f] border border-[#b8d4f5]'
                  }`}
                >
                  {loan.isOverdue ? 'OVERDUE' : `Due ${loan.dueDate}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
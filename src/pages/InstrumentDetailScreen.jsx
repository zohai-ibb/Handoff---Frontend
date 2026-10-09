import React from 'react';
import { ArrowLeft, Calendar, MapPin, Tag, ShieldCheck, IndianRupee, User, Clock } from 'lucide-react';

export default function InstrumentDetailScreen({ instrument, onBack, onNavigate }) {
  if (!instrument) {
    return (
      <div className="space-y-4 font-sans text-[#1b1a18]">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-black/5 active:scale-95 transition-all"
            aria-label="Back"
          >
            <ArrowLeft size={18} className="text-[#1b4d8f]" />
          </button>
          <h2 className="text-base font-bold text-[#1b4d8f]">Instrument details</h2>
        </div>
        <p className="text-xs text-gray-500">No instrument selected.</p>
      </div>
    );
  }

  // Resolve status styling
  const status = instrument.status || 'AVAILABLE';
  const isOverdue = status === 'OVERDUE' || instrument.isOverdue;

  let statusBadgeClass = 'bg-[#eef7f2] text-[#12695a]';
  if (isOverdue) {
    statusBadgeClass = 'bg-[#fbe4e0] text-[#8f2318] border border-[#f5c2c2]';
  } else if (status === 'ISSUED') {
    statusBadgeClass = 'bg-[#fbf0dc] text-[#8a5a12]';
  } else if (status === 'MAINTENANCE') {
    statusBadgeClass = 'bg-[#f3f0f8] text-[#5c4a86]';
  }

  // Image URL resolution
  const photoUrl = instrument.photoPath 
    ? (instrument.photoPath.startsWith('http') ? instrument.photoPath : `http://localhost:8080${instrument.photoPath}`)
    : null;

  return (
    <div className="space-y-3.5 font-sans text-[#1b1a18]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-black/5 active:scale-95 transition-all"
          aria-label="Back"
        >
          <ArrowLeft size={18} className="text-[#1b4d8f]" />
        </button>
        <h2 className="text-base font-bold text-[#1b4d8f]">Instrument details</h2>
      </div>

      {/* Photo Viewport */}
      {photoUrl ? (
        <div className="relative w-full h-48 bg-gray-100 rounded-2xl overflow-hidden border border-black/10 shadow-xs">
          <img
            src={photoUrl}
            alt={instrument.name || 'Instrument'}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full shadow-xs ${statusBadgeClass}`}>
              {isOverdue ? 'OVERDUE' : status}
            </span>
          </div>
        </div>
      ) : (
        <div className="w-full h-28 bg-[#f4f7fc] rounded-2xl border border-dashed border-[#1b4d8f]/30 flex flex-col items-center justify-center gap-1">
          <Tag size={20} className="text-[#1b4d8f]" />
          <span className="text-[11.5px] font-medium text-[#1b4d8f]">No Photo Available</span>
        </div>
      )}

      {/* Identity Card */}
      <div className="bg-white p-4 rounded-2xl border border-black/10 shadow-xs space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="text-base font-bold text-[#1b1a18] leading-tight">
              {instrument.name || 'Unnamed Instrument'}
            </h3>
            <p className="font-mono text-[11px] text-[#7a7872] mt-1">
              Asset ID: {instrument.assetId || instrument.asset_id || 'N/A'}
            </p>
          </div>
          {!photoUrl && (
            <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-md shrink-0 ${statusBadgeClass}`}>
              {isOverdue ? 'OVERDUE' : status}
            </span>
          )}
        </div>

        <hr className="border-black/5" />

        {/* Technical Attributes Grid */}
        <div className="grid grid-cols-2 gap-3 text-[12px]">
          <div>
            <span className="text-[10.5px] font-semibold text-[#7a7872] uppercase block">Make</span>
            <span className="font-medium text-[#1b1a18]">{instrument.make || 'N/A'}</span>
          </div>

          <div>
            <span className="text-[10.5px] font-semibold text-[#7a7872] uppercase block">Serial No</span>
            <span className="font-mono text-[#1b1a18]">{instrument.serialNo || instrument.serial_no || 'N/A'}</span>
          </div>

          <div>
            <span className="text-[10.5px] font-semibold text-[#7a7872] uppercase block">Location</span>
            <span className="font-medium text-[#1b1a18] flex items-center gap-1 mt-0.5">
              <MapPin size={12} className="text-[#1b4d8f]" />
              {instrument.location || 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-[10.5px] font-semibold text-[#7a7872] uppercase block">Calibration Valid To</span>
            <span className="font-medium text-[#1b1a18] flex items-center gap-1 mt-0.5">
              <ShieldCheck size={12} className="text-[#12695a]" />
              {instrument.calibrationValidTo || instrument.calibration_valid_to || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Commercial & Acquisition Details Card */}
      {(instrument.purchaseDate || instrument.purchase_date || instrument.purchaseCost || instrument.purchase_cost) && (
        <div className="bg-white p-4 rounded-2xl border border-black/10 shadow-xs space-y-2">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#5d5b56]">
            Acquisition Details
          </span>

          <div className="grid grid-cols-2 gap-3 text-[12px] pt-1">
            <div>
              <span className="text-[10.5px] font-semibold text-[#7a7872] uppercase block">Purchase Date</span>
              <span className="font-medium text-[#1b1a18] flex items-center gap-1 mt-0.5">
                <Calendar size={12} className="text-[#1b4d8f]" />
                {instrument.purchaseDate || instrument.purchase_date || 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[10.5px] font-semibold text-[#7a7872] uppercase block">Purchase Cost</span>
              <span className="font-medium text-[#1b1a18] flex items-center gap-0.5 mt-0.5">
                <IndianRupee size={12} className="text-[#12695a]" />
                {instrument.purchaseCost || instrument.purchase_cost 
                  ? Number(instrument.purchaseCost || instrument.purchase_cost).toLocaleString('en-IN')
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Active Loan Details Card (If Currently Checked Out) */}
      {(status === 'ISSUED' || isOverdue) && instrument.holder && (
        <div className="bg-white p-4 rounded-2xl border border-black/10 shadow-xs space-y-2">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#5d5b56]">
            Current Issue Context
          </span>

          <div className="space-y-1.5 text-[12px] pt-0.5">
            <div className="flex items-center gap-2">
              <User size={14} className="text-[#1b4d8f]" />
              <span className="font-medium text-[#1b1a18]">
                Holder: <span className="font-bold">{instrument.holder}</span>
              </span>
            </div>

            {instrument.dueDate && (
              <div className="flex items-center gap-2">
                <Clock size={14} className={isOverdue ? 'text-[#8f2318]' : 'text-[#8a5a12]'} />
                <span className={`font-medium ${isOverdue ? 'text-[#8f2318]' : 'text-[#8a5a12]'}`}>
                  Return Date: {instrument.dueDate} {isOverdue && '(OVERDUE)'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2">
        {status === 'AVAILABLE' && (
          <button
            onClick={() => onNavigate && onNavigate('Issue')}
            className="w-full bg-[#1b4d8f] text-white py-3 rounded-xl text-[13.5px] font-semibold active:scale-98 transition-all shadow-xs text-center"
          >
            Issue this instrument
          </button>
        )}
      </div>
    </div>
  );
}
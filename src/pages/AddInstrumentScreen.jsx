//   // Form state fields mapped to the Instrument database schema
//   const [formData, setFormData] = useState({
//     assetId: 'CBRI/APEEG/0231',
//     name: 'Testo 440 IAQ Kit',
//     make: 'Testo',
//     serialNo: '440-01192',
//     location: 'Energy Lab, Cabinet 4',
//     calibrationValidity: 'Valid to 31 Mar 2027',
//   });
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function AddInstrumentScreen({ onBack, onShowToast }) {
  // Empty initial form state so fields start blank with visible placeholders
  const [formData, setFormData] = useState({
    assetId: '',
    name: '',
    make: '',
    serialNo: '',
    location: '',
    calibrationValidity: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.assetId.trim() || !formData.name.trim()) {
      if (onShowToast) {
        onShowToast('Validation Error: Asset ID and Instrument Name are required.');
      }
      return;
    }

    // Displays confirmation toast and returns to Home
    if (onShowToast) {
      onShowToast(
        `Added ${formData.name} (${formData.assetId}) to group register. Printable QR label generated.`
      );
    }

    if (onBack) {
      onBack();
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
        <h2 className="text-base font-bold text-[#1b4d8f]">Add instrument</h2>
      </div>

      <p className="text-[12.5px] leading-relaxed text-[#5d5b56]">
        New entries are added to the group register and get a printable QR asset label.
      </p>

      {/* --- Form Section --- */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-1">
        {/* Field 1: Asset / CBRI ID */}
        <div className="space-y-1">
          <label className="text-[11.5px] font-semibold text-[#5d5b56]">
            Asset / CBRI ID
          </label>
          <input
            type="text"
            name="assetId"
            value={formData.assetId}
            onChange={handleChange}
            placeholder="CBRI/APEEG/0231"
            className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f] focus:ring-1 focus:ring-[#1b4d8f] transition-all"
            required
          />
        </div>

        {/* Field 2: Instrument name & model */}
        <div className="space-y-1">
          <label className="text-[11.5px] font-semibold text-[#5d5b56]">
            Instrument name & model
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Testo 440 IAQ Kit"
            className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f] focus:ring-1 focus:ring-[#1b4d8f] transition-all"
            required
          />
        </div>

        {/* Field 3: Make */}
        <div className="space-y-1">
          <label className="text-[11.5px] font-semibold text-[#5d5b56]">
            Make
          </label>
          <input
            type="text"
            name="make"
            value={formData.make}
            onChange={handleChange}
            placeholder="Testo"
            className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f] focus:ring-1 focus:ring-[#1b4d8f] transition-all"
          />
        </div>

        {/* Field 4: Serial number */}
        <div className="space-y-1">
          <label className="text-[11.5px] font-semibold text-[#5d5b56]">
            Serial number
          </label>
          <input
            type="text"
            name="serialNo"
            value={formData.serialNo}
            onChange={handleChange}
            placeholder="440-01192"
            className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f] focus:ring-1 focus:ring-[#1b4d8f] transition-all"
          />
        </div>

        {/* Field 5: Location / lab */}
        <div className="space-y-1">
          <label className="text-[11.5px] font-semibold text-[#5d5b56]">
            Location / lab
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Energy Lab, Cabinet 4"
            className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f] focus:ring-1 focus:ring-[#1b4d8f] transition-all"
          />
        </div>

        {/* Field 6: Calibration validity */}
        <div className="space-y-1">
          <label className="text-[11.5px] font-semibold text-[#5d5b56]">
            Calibration validity
          </label>
          <input
            type="text"
            name="calibrationValidity"
            value={formData.calibrationValidity}
            onChange={handleChange}
            placeholder="Valid to 31 Mar 2027"
            className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f] focus:ring-1 focus:ring-[#1b4d8f] transition-all"
          />
        </div>

        {/* --- Action Submit Button --- */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-[#1b4d8f] text-white py-3 rounded-xl text-[13.5px] font-semibold active:scale-98 transition-all shadow-xs text-center"
          >
            Save to register
          </button>
        </div>
      </form>
    </div>
  );
}
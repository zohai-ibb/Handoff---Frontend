import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Camera,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  IndianRupee,
} from "lucide-react";
import axiosClient from "../api/axiosClient";

export default function AddInstrumentScreen({ onBack, onShowToast }) {
  const [formData, setFormData] = useState({
    assetId: "",
    name: "",
    make: "",
    serialNo: "",
    location: "",
    calibrationValidity: "",
    purchaseDate: "",
    purchaseCost: "",
  });

  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      if (onShowToast) onShowToast("Instrument photo selected!");
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      if (onShowToast) onShowToast("Unable to access camera.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `instrument_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setSelectedPhotoFile(file);
        setPhotoPreview(canvas.toDataURL("image/jpeg"));
      }
    }, "image/jpeg");

    stopCamera();
    if (onShowToast) onShowToast("Instrument photo captured!");
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (
      !formData.assetId.trim() ||
      !formData.name.trim() ||
      !formData.make.trim() ||
      !formData.location.trim()
    ) {
      if (onShowToast) {
        onShowToast(
          "Validation Error: Asset ID, Name, Make, and Location are required.",
        );
      }
      return;
    }

    try {
      setIsSubmitting(true);

      const multipartPayload = new FormData();
      multipartPayload.append("asset_id", formData.assetId.trim());
      multipartPayload.append("name", formData.name.trim());
      multipartPayload.append("make", formData.make.trim());
      if (formData.serialNo.trim())
        multipartPayload.append("serial_no", formData.serialNo.trim());
      multipartPayload.append("location", formData.location.trim());
      if (formData.calibrationValidity)
        multipartPayload.append(
          "calibration_valid_to",
          formData.calibrationValidity,
        );
      if (formData.purchaseDate)
        multipartPayload.append("purchase_date", formData.purchaseDate);
      if (formData.purchaseCost)
        multipartPayload.append("purchase_cost", formData.purchaseCost);
      multipartPayload.append("status", "AVAILABLE");
      multipartPayload.append("quantity", "1");

      if (selectedPhotoFile) {
        multipartPayload.append("photo", selectedPhotoFile);
      }

      const response = await axiosClient.post(
        "/instruments",
        multipartPayload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (onShowToast) {
        onShowToast(
          `Added ${response.data.name || formData.name} (${response.data.asset_id || formData.assetId}) to group register. Printable QR label generated.`,
        );
      }

      // Redirect to Instrument Details with newly created object
      if (onBack) {
        onBack(response.data);
      }
    } catch (err) {
      console.error("Failed to create instrument:", err);
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data ||
        "Failed to connect to database server.";
      setErrorMsg(
        typeof serverMessage === "string"
          ? serverMessage
          : "Failed to register instrument.",
      );

      if (onShowToast) {
        onShowToast(
          `Error: ${typeof serverMessage === "string" ? serverMessage : "Failed to add instrument"}`,
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3.5 font-sans text-[#1b1a18]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="p-1 rounded-lg hover:bg-black/5 active:scale-95 transition-all disabled:opacity-50"
          aria-label="Back"
        >
          <ArrowLeft size={18} className="text-[#1b4d8f]" />
        </button>
        <h2 className="text-base font-bold text-[#1b4d8f]">Add instrument</h2>
      </div>

      <p className="text-[12.5px] leading-relaxed text-[#5d5b56]">
        New entries are added to the group register and get a printable QR asset
        label.
      </p>

      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-[#fcf2f2] text-[#c92a2a] text-[12px] p-3 rounded-xl border border-[#f5c2c2] font-medium">
          {errorMsg}
        </div>
      )}

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-1">
        {/* Field 1: Asset / CBRI ID */}
        <div className="space-y-1">
          <label className="text-[11.5px] font-semibold text-[#5d5b56]">
            Asset / CBRI ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="assetId"
            value={formData.assetId}
            onChange={handleChange}
            placeholder="CBRI/APEEG/0231"
            className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f] focus:ring-1 focus:ring-[#1b4d8f] transition-all"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Field 2: Instrument name & model */}
        <div className="space-y-1">
          <label className="text-[11.5px] font-semibold text-[#5d5b56]">
            Instrument name & model <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Testo 440 IAQ Kit"
            className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f] focus:ring-1 focus:ring-[#1b4d8f] transition-all"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Field 3: Make */}
        <div className="space-y-1">
          <label className="text-[11.5px] font-semibold text-[#5d5b56]">
            Make <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="make"
            value={formData.make}
            onChange={handleChange}
            placeholder="Testo"
            className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f] focus:ring-1 focus:ring-[#1b4d8f] transition-all"
            required
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
        </div>

        {/* Field 5: Location / lab */}
        <div className="space-y-1">
          <label className="text-[11.5px] font-semibold text-[#5d5b56]">
            Location / lab <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Energy Lab, Cabinet 4"
            className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f] focus:ring-1 focus:ring-[#1b4d8f] transition-all"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Field 6: Calibration validity */}
        <div className="space-y-1">
          <label className="text-[11.5px] font-semibold text-[#5d5b56]">
            Calibration valid until
          </label>
          <input
            type="date"
            name="calibrationValidity"
            value={formData.calibrationValidity}
            onChange={handleChange}
            className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f] focus:ring-1 focus:ring-[#1b4d8f] transition-all"
            disabled={isSubmitting}
          />
        </div>

        {/* Field 7: Purchase Date */}
        <div className="space-y-1">
          <label className="text-[11.5px] font-semibold text-[#5d5b56]">
            Purchase Date
          </label>
          <input
            type="date"
            name="purchaseDate"
            value={formData.purchaseDate}
            onChange={handleChange}
            className="w-full bg-white text-[13px] p-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f] focus:ring-1 focus:ring-[#1b4d8f] transition-all"
            disabled={isSubmitting}
          />
        </div>

        {/* Field 8: Purchase Cost */}
        <div className="space-y-1">
          <label className="text-[11.5px] font-semibold text-[#5d5b56]">
            Purchase Cost (₹)
          </label>
          <div className="relative flex items-center">
            <input
              type="number"
              name="purchaseCost"
              step="0.01"
              min="0"
              value={formData.purchaseCost}
              onChange={handleChange}
              placeholder="125000.00"
              className="w-full bg-white text-[13px] p-3 pl-8 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f] focus:ring-1 focus:ring-[#1b4d8f] transition-all"
              disabled={isSubmitting}
            />
            <IndianRupee
              size={14}
              className="absolute left-3 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Photo Upload Section */}
        <div className="space-y-1 pt-1">
          <label className="text-[11.5px] font-semibold text-[#5d5b56]">
            Instrument Photo (Optional)
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {!photoPreview ? (
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={startCamera}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-black/15 rounded-xl text-[12px] font-semibold text-[#1b4d8f] active:scale-98 transition-all hover:bg-black/5"
              >
                <Camera size={15} />
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-black/15 rounded-xl text-[12px] font-semibold text-[#5d5b56] active:scale-98 transition-all hover:bg-black/5"
              >
                <Upload size={15} />
                <span>Upload File</span>
              </button>
            </div>
          ) : (
            <div className="mt-1 p-2 bg-white rounded-xl border border-black/15 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={photoPreview}
                  alt="Instrument"
                  className="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-[#12695a] flex items-center gap-1">
                    <CheckCircle2 size={12} /> Photo Attached
                  </span>
                  <p className="text-[10px] text-gray-500 truncate">
                    Ready to save with instrument record
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setSelectedPhotoFile(null);
                  setPhotoPreview(null);
                }}
                className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Action Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1b4d8f] text-white py-3 rounded-xl text-[13.5px] font-semibold active:scale-98 transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving to register...</span>
              </>
            ) : (
              "Save to register"
            )}
          </button>
        </div>
      </form>

      {/* Live Camera Viewfinder */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm h-[70vh] bg-black rounded-3xl overflow-hidden flex flex-col justify-between p-3.5 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between text-white pb-1">
              <h3 className="text-xs font-bold flex items-center gap-1.5">
                <Camera size={14} className="text-[#1b4d8f]" />
                Capture Instrument Photo
              </h3>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative flex-1 bg-black rounded-2xl overflow-hidden flex items-center justify-center my-2">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-2 border-white/20 rounded-2xl pointer-events-none" />
            </div>

            <div className="pt-1 pb-1 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={stopCamera}
                className="bg-white/20 hover:bg-white/30 text-white text-xs px-4 py-2 rounded-xl transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={takePhoto}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border-4 border-[#1b4d8f]"
              >
                <div className="w-8 h-8 bg-[#1b4d8f] rounded-full" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, Tag, ShieldCheck, 
  IndianRupee, User, Clock, Trash2, Edit3, AlertTriangle, X, Camera, Upload, Loader2 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

// Helper utility: Convert Base64 Data URL (from camera) to binary Blob
const dataURLtoBlob = (dataurl) => {
  if (!dataurl || !dataurl.includes(',')) return null;
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export default function InstrumentDetailScreen({ instrument: initialInstrument, onBack, onNavigate, onShowToast }) {
  const [instrument, setInstrument] = useState(initialInstrument);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);

  const [editFormData, setEditFormData] = useState({
    name: initialInstrument?.name || '',
    assetId: initialInstrument?.assetId || initialInstrument?.asset_id || '',
    make: initialInstrument?.make || '',
    serialNo: initialInstrument?.serialNo || initialInstrument?.serial_no || '',
    location: initialInstrument?.location || '',
    calibrationValidTo: initialInstrument?.calibrationValidTo || initialInstrument?.calibration_valid_to || '',
    purchaseDate: initialInstrument?.purchaseDate || initialInstrument?.purchase_date || '',
    purchaseCost: initialInstrument?.purchaseCost || initialInstrument?.purchase_cost || '',
    photoPath: initialInstrument?.photoPath || initialInstrument?.photo_path || null,
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const fileInputRef = useRef(null);

  if (!instrument) {
    return (
      <div className="space-y-4 font-sans text-[#1b1a18]">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={onBack} className="p-1 rounded-lg hover:bg-black/5 active:scale-95 transition-all">
            <ArrowLeft size={18} className="text-[#1b4d8f]" />
          </button>
          <h2 className="text-base font-bold text-[#1b4d8f]">Instrument details</h2>
        </div>
        <p className="text-xs text-gray-500">No instrument selected.</p>
      </div>
    );
  }

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

  const instrumentId = instrument.id || instrument._id;

  const rawPhotoPath = instrument.photoPath || instrument.photo_path;
  const photoUrl = rawPhotoPath
    ? (rawPhotoPath.startsWith('http') 
        ? `${rawPhotoPath}?t=${Date.now()}` 
        : `http://localhost:8080${rawPhotoPath}?t=${Date.now()}`)
    : null;

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData((prev) => ({ ...prev, photoPath: reader.result }));
      };
      reader.readAsDataURL(file);
      if (onShowToast) onShowToast('New photo selected!');
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      if (onShowToast) onShowToast('Unable to access live camera.');
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
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg');
    const blob = dataURLtoBlob(dataUrl);
    if (blob) {
      const file = new File([blob], `instrument_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedPhotoFile(file);
      setEditFormData((prev) => ({ ...prev, photoPath: dataUrl }));
    }

    stopCamera();
    if (onShowToast) onShowToast('Instrument photo captured!');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!instrumentId) return;

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('asset_id', editFormData.assetId);
      formData.append('assetId', editFormData.assetId);
      formData.append('name', editFormData.name);
      formData.append('make', editFormData.make);
      formData.append('serial_no', editFormData.serialNo);
      formData.append('serialNo', editFormData.serialNo);
      formData.append('location', editFormData.location);
      formData.append('calibration_valid_to', editFormData.calibrationValidTo);
      formData.append('calibrationValidTo', editFormData.calibrationValidTo);
      formData.append('purchase_date', editFormData.purchaseDate);
      formData.append('purchaseDate', editFormData.purchaseDate);
      formData.append('purchase_cost', editFormData.purchaseCost);
      formData.append('purchaseCost', editFormData.purchaseCost);

      // Only attach file if a NEW file was picked or captured
      if (selectedPhotoFile) {
        // Keep the real filename/extension (e.g. .png or .webp).
        formData.append('photo', selectedPhotoFile, selectedPhotoFile.name);
      }

      // This endpoint consumes multipart/form-data. Axios will add the
      // required multipart boundary for the browser request.
      const response = await axiosClient.put(
        `/instruments/${instrumentId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const updatedInstrument = response.data || {
        ...instrument,
        ...editFormData,
      };

      setInstrument(updatedInstrument);
      setIsEditing(false);
      setSelectedPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onShowToast) {
        onShowToast(`Updated "${updatedInstrument.name || 'Instrument'}" successfully!`);
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.response?.data?.message || err.response?.data || 'Failed to update instrument details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInstrument = async () => {
    if (!instrumentId) return;

    try {
      setIsDeleting(true);
      await axiosClient.delete(`/instruments/${instrumentId}`);

      if (onShowToast) {
        onShowToast(`Instrument "${instrument.name || 'Item'}" deleted successfully.`);
      }

      setShowDeleteModal(false);
      if (onBack) onBack();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.response?.data?.message || 'Failed to delete instrument.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3.5 font-sans text-[#1b1a18]">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={onBack} className="p-1 rounded-lg hover:bg-black/5 active:scale-95 transition-all">
          <ArrowLeft size={18} className="text-[#1b4d8f]" />
        </button>
        <h2 className="text-base font-bold text-[#1b4d8f]">Instrument details</h2>
      </div>

      {!isEditing ? (
        <>
          {photoUrl ? (
            <div className="relative w-full h-48 bg-gray-100 rounded-2xl overflow-hidden border border-black/10 shadow-xs">
              <img src={photoUrl} alt={instrument.name || 'Instrument'} className="w-full h-full object-cover" />
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

          <div className="pt-2 space-y-2">
            {status === 'AVAILABLE' && (
              <button
                onClick={() => onNavigate && onNavigate('Issue')}
                className="w-full bg-[#1b4d8f] text-white py-3 rounded-xl text-[13.5px] font-semibold active:scale-98 transition-all shadow-xs text-center"
              >
                Issue this instrument
              </button>
            )}

            <button
              onClick={() => {
                setSelectedPhotoFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setEditFormData({
                  name: instrument.name || '',
                  assetId: instrument.assetId || instrument.asset_id || '',
                  make: instrument.make || '',
                  serialNo: instrument.serialNo || instrument.serial_no || '',
                  location: instrument.location || '',
                  calibrationValidTo: instrument.calibrationValidTo || instrument.calibration_valid_to || '',
                  purchaseDate: instrument.purchaseDate || instrument.purchase_date || '',
                  purchaseCost: instrument.purchaseCost || instrument.purchase_cost || '',
                  photoPath: instrument.photoPath || instrument.photo_path || null,
                });
                setIsEditing(true);
              }}
              className="w-full bg-[#1b4d8f]/10 text-[#1b4d8f] border border-[#1b4d8f]/20 py-3 rounded-xl text-[13.5px] font-semibold active:scale-98 transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Edit3 size={16} />
              <span>Edit Instrument Details</span>
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full bg-[#fcf2f2] text-[#c92a2a] border border-[#f5c2c2] py-3 rounded-xl text-[13.5px] font-semibold active:scale-98 transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              <span>Delete Instrument</span>
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSaveEdit} className="bg-white p-4 rounded-2xl border border-black/10 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-[#1b4d8f] uppercase tracking-wider border-b pb-2">
            Edit Instrument Details
          </h3>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#5d5b56]">
              Instrument Photo
            </label>
            <div className="flex items-center gap-3">
              {editFormData.photoPath ? (
                <div className="relative shrink-0">
                  <img
                    src={
                      editFormData.photoPath.startsWith('data:')
                        ? editFormData.photoPath
                        : editFormData.photoPath.startsWith('http')
                        ? editFormData.photoPath
                        : `http://localhost:8080${editFormData.photoPath}`
                    }
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover border border-[#1b4d8f]/30"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhotoFile(null);
                      setEditFormData((prev) => ({ ...prev, photoPath: null }));
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-xs hover:bg-red-600"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
                  <Tag size={20} />
                </div>
              )}

              <div className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex-1 bg-[#1b4d8f] text-white text-[11px] font-medium py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all"
                >
                  <Camera size={13} />
                  <span>Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#1b1a18] border border-black/10 text-[11px] font-medium py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all"
                >
                  <Upload size={13} />
                  <span>Upload</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#5d5b56]">
              Instrument Name
            </label>
            <input
              type="text"
              name="name"
              value={editFormData.name}
              onChange={handleEditChange}
              required
              className="w-full bg-white text-xs p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#5d5b56]">
              Asset ID
            </label>
            <input
              type="text"
              name="assetId"
              value={editFormData.assetId}
              onChange={handleEditChange}
              required
              className="w-full bg-white text-xs p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#5d5b56]">
                Make
              </label>
              <input
                type="text"
                name="make"
                value={editFormData.make}
                onChange={handleEditChange}
                className="w-full bg-white text-xs p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#5d5b56]">
                Serial No
              </label>
              <input
                type="text"
                name="serialNo"
                value={editFormData.serialNo}
                onChange={handleEditChange}
                className="w-full bg-white text-xs p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#5d5b56]">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={editFormData.location}
              onChange={handleEditChange}
              className="w-full bg-white text-xs p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#5d5b56]">
                Calibration Valid To
              </label>
              <input
                type="date"
                name="calibrationValidTo"
                value={editFormData.calibrationValidTo}
                onChange={handleEditChange}
                className="w-full bg-white text-xs p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#5d5b56]">
                Purchase Date
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={editFormData.purchaseDate}
                onChange={handleEditChange}
                className="w-full bg-white text-xs p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#5d5b56]">
              Purchase Cost (₹)
            </label>
            <input
              type="number"
              name="purchaseCost"
              value={editFormData.purchaseCost}
              onChange={handleEditChange}
              className="w-full bg-white text-xs p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setIsEditing(false);
                setSelectedPhotoFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="flex-1 py-2.5 rounded-xl text-xs font-medium border border-gray-300 text-gray-700 bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#1b4d8f] text-white flex items-center justify-center gap-1"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <span>Save Changes</span>}
            </button>
          </div>
        </form>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-4.5 w-full max-w-sm space-y-3 shadow-2xl border border-black/10 animate-fade-in">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-[#c92a2a]">
                <AlertTriangle size={18} />
                <h3 className="text-sm font-bold text-[#1b1a18]">Confirm Delete</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>

            <p className="text-[12.5px] text-[#5d5b56] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[#1b1a18]">{instrument.name}</strong> (Asset ID:{' '}
              <span className="font-mono text-xs">{instrument.assetId || instrument.asset_id || 'N/A'}</span>)?
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium border border-gray-300 text-gray-700 bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteInstrument}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#c92a2a] hover:bg-[#b02525] text-white disabled:opacity-50 transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
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
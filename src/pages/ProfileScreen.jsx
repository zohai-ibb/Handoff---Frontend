import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Edit3,
  CheckCircle2,
  Camera,
  X,
  Upload,
  LogOut,
  Loader2,
} from "lucide-react";

export default function ProfileScreen({
  user,
  onBack,
  onLogout,
  onShowToast,
  onUpdateUser,
}) {
  const BASE_URL = "http://localhost:8080";

  // State initialized with authenticated user data[cite: 1]
  const [person, setPerson] = useState({
    id: user?.id || "",
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    department: user?.department || "APEEG",
    photo_path: user?.photo_path || null,
    is_active: user?.is_active ?? true,
    created_at: user?.created_at || new Date().toISOString(),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...person });
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Camera Controls
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync state if user prop updates[cite: 1]
  useEffect(() => {
    if (user) {
      const updated = {
        id: user.id || "",
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        department: user.department || "APEEG",
        photo_path: user.photo_path || null,
        is_active: user.is_active ?? true,
        created_at: user.created_at || new Date().toISOString(),
      };
      setPerson(updated);
      setFormData(updated);
    }
  }, [user]);

  // Handle Edit Toggle[cite: 1]
  const handleEditClick = () => {
    setFormData({ ...person });
    setSelectedPhotoFile(null);
    setIsEditing(true);
  };

  // Handle Form Input Changes[cite: 1]
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // File Picker Handler[cite: 1]
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          photo_path: reader.result, // Temporary preview
        }));
      };
      reader.readAsDataURL(file);
      if (onShowToast) onShowToast("New photo selected!");
    }
  };

  // Camera Handlers[cite: 1]
  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      if (onShowToast) onShowToast("Unable to access live camera.");
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
        const file = new File([blob], `profile_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setSelectedPhotoFile(file);
        setFormData((prev) => ({
          ...prev,
          photo_path: canvas.toDataURL("image/jpeg"),
        }));
      }
    }, "image/jpeg");

    stopCamera();
    if (onShowToast) onShowToast("Photo captured!");
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!person.id) {
      if (onShowToast) onShowToast("Error: User ID missing.");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      // 1. Save Text Fields via PUT /api/persons/{id}
      const response = await fetch(`${BASE_URL}/api/persons/${person.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          department: formData.department,
          is_active: formData.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile details.");
      }

      let updatedPersonData = await response.json();

      // 2. Save Photo File via POST /api/persons/{id}/photo
      if (selectedPhotoFile) {
        const photoFormData = new FormData();
        photoFormData.append("photo", selectedPhotoFile);

        const photoResponse = await fetch(
          `${BASE_URL}/api/persons/${person.id}/photo`,
          {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: photoFormData,
          }
        );

        // Handle File Size Exceeded Error from Spring Boot
        if (photoResponse.status === 413 || photoResponse.status === 500) {
          const errorText = await photoResponse.text();
          if (
            errorText.includes("MaxUploadSizeExceededException") ||
            photoResponse.status === 413
          ) {
            throw new Error(
              "Image size is too large! Maximum allowed upload size is 10 MB."
            );
          }
        }

        if (!photoResponse.ok) {
          throw new Error("Failed to upload profile photo.");
        }

        updatedPersonData = await photoResponse.json();
      }

      setPerson(updatedPersonData);
      setFormData(updatedPersonData);
      setIsEditing(false);
      setSelectedPhotoFile(null);

      if (onUpdateUser) {
        onUpdateUser(updatedPersonData);
      }

      if (onShowToast) {
        onShowToast("Profile updated successfully!");
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || "Error updating profile.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to resolve the image URL
  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith("data:")) return photoPath;

    const baseUrl = "http://localhost:8080";
    const fullPath = photoPath.startsWith("http")
      ? photoPath
      : `${baseUrl}${photoPath}`;

    return `${fullPath}?t=${new Date().getTime()}`;
  };

  // Render avatar helper
  const renderAvatar = (photoPath, name) => {
    if (photoPath) {
      return (
        <img
          src={getPhotoUrl(photoPath)}
          alt={name || "Avatar"}
          className="w-14 h-14 rounded-full object-cover shrink-0 border-2 border-[#1b4d8f]/20"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = "none";
          }}
        />
      );
    }

    return (
      <div className="w-14 h-14 rounded-full bg-[#1b4d8f] text-white flex items-center justify-center font-bold text-lg shrink-0 border-2 border-[#1b4d8f]/20">
        {name
          ? name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()
          : "AP"}
      </div>
    );
  };

  return (
    <div className="space-y-4 font-sans text-[#1b1a18] animate-fade-in">
      {/* --- Header Title --- */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#1b4d8f]">User Profile</h2>
      </div>

      {/* --- Avatar & Key Info Card --- */}
      <div className="bg-white p-4 rounded-2xl border border-black/10 shadow-2xs flex items-center gap-3.5">
        {renderAvatar(person.photo_path, person.name)}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold text-[#1b1a18] truncate leading-tight">
              {person.name || "Scientist Profile"}
            </h3>
            {person.is_active && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <CheckCircle2 size={10} /> Active
              </span>
            )}
          </div>
          <p className="text-xs text-[#5d5b56] mt-0.5 font-medium">
            {person.department || "APEEG"} Department
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5 truncate">
            {person.email}
          </p>
        </div>
      </div>

      {/* --- View Mode --- */}
      {!isEditing ? (
        <div className="bg-white p-4 rounded-2xl border border-black/10 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold text-[#1b4d8f] uppercase tracking-wider border-b pb-2">
            Person Details
          </h4>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2.5 text-[#5d5b56]">
              <User size={15} className="text-[#1b4d8f] shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                  Name
                </span>
                <span className="font-semibold text-[#1b1a18]">
                  {person.name || "N/A"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-[#5d5b56]">
              <Mail size={15} className="text-[#1b4d8f] shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                  Official Email
                </span>
                <span className="font-mono text-[#1b1a18]">
                  {person.email || "N/A"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-[#5d5b56]">
              <Phone size={15} className="text-[#1b4d8f] shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                  Mobile Number
                </span>
                <span className="text-[#1b1a18]">
                  {person.mobile || "Not set"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-[#5d5b56]">
              <Building size={15} className="text-[#1b4d8f] shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                  Department
                </span>
                <span className="text-[#1b1a18]">
                  {person.department || "APEEG"}
                </span>
              </div>
            </div>

            {person.created_at && (
              <div className="flex items-center gap-2.5 text-[#5d5b56]">
                <Calendar size={15} className="text-[#1b4d8f] shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                    Account Created
                  </span>
                  <span className="font-mono text-[#1b1a18]">
                    {new Date(person.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Edit and Sign Out placed together */}
          <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
            <button
              type="button"
              onClick={handleEditClick}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1b4d8f] hover:bg-[#143d73] text-white rounded-xl text-xs font-semibold transition-all active:scale-98 shadow-2xs"
            >
              <Edit3 size={14} />
              <span>Edit Profile</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-all active:scale-98"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* --- Edit Form Mode --- */
        <form
          onSubmit={handleSave}
          className="bg-white p-4 rounded-2xl border border-black/10 shadow-2xs space-y-3.5 animate-fade-in"
        >
          <h4 className="text-xs font-bold text-[#1b4d8f] uppercase tracking-wider border-b pb-2">
            Edit Scientist Profile
          </h4>

          {/* Photo Section */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#5d5b56] block">
              Profile Photo
            </label>
            <div className="flex items-center gap-3">
              {formData.photo_path ? (
                <div className="relative shrink-0">
                  <img
                    src={
                      formData.photo_path.startsWith("data:")
                        ? formData.photo_path
                        : `${BASE_URL}${formData.photo_path}`
                    }
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border border-[#1b4d8f]/30"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhotoFile(null);
                      setFormData((prev) => ({ ...prev, photo_path: null }));
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-xs hover:bg-red-600"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
                  <User size={20} />
                </div>
              )}

              <div className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex-1 bg-[#1b4d8f] text-white text-[11px] font-medium py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all shadow-2xs"
                >
                  <Camera size={13} />
                  <span>Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current && fileInputRef.current.click()
                  }
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

          {/* Name Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#5d5b56]">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Dr. Kishor S. Kulkarni"
              required
              className="w-full bg-white text-xs p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
            />
          </div>

          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#5d5b56]">
              Official Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. kskulkarni@cbri.res.in"
              required
              className="w-full bg-white text-xs p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
            />
          </div>

          {/* Mobile Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#5d5b56]">
              Mobile Number
            </label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="e.g. +91 98765 43210"
              className="w-full bg-white text-xs p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
            />
          </div>

          {/* Department Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#5d5b56]">
              Department
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g. APEEG"
              className="w-full bg-white text-xs p-2.5 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
            />
          </div>

          {/* Active Status Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-[#1b4d8f] rounded focus:ring-0 cursor-pointer"
            />
            <label
              htmlFor="is_active"
              className="text-xs font-medium text-[#1b1a18] cursor-pointer"
            >
              Account Active Status (is_active)
            </label>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setFormData({ ...person });
                setSelectedPhotoFile(null);
                setIsEditing(false);
              }}
              className="flex-1 py-2.5 rounded-xl text-xs font-medium border border-gray-300 text-gray-700 active:scale-98 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#1b4d8f] text-white active:scale-98 shadow-2xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Camera Viewfinder Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm h-[70vh] bg-black rounded-3xl overflow-hidden flex flex-col justify-between p-3.5 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between text-white pb-1">
              <h3 className="text-xs font-bold flex items-center gap-1.5">
                <Camera size={14} className="text-[#1b4d8f]" />
                Capture Profile Photo
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
                className="w-full h-full object-cover transform -scale-x-100"
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
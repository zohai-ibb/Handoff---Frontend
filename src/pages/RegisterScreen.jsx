import React, { useState } from "react";
import { User, Mail, Lock, Phone, Building, ArrowRight, ShieldCheck } from "lucide-react";

export default function RegisterScreen({ onRegisterSuccess, onNavigateToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [department, setDepartment] = useState("APEEG");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all mandatory fields.");
      return;
    }

    if (!email.includes("@cbri.res.in")) {
      setError("Please use an official CSIR-CBRI email address (@cbri.res.in).");
      return;
    }

    setIsLoading(true);

    // Simulate backend registration API call
    setTimeout(() => {
      setIsLoading(false);

      const newUser = {
        id: "65f1a2b3c4d5e6f7a8b9c0d3",
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        department: department.trim() || "APEEG",
      };
      const token = "mock-jwt-token-newuser456";

      // Call parent handler to update auth state and trigger redirect
      onRegisterSuccess(newUser, token);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden font-sans text-[#1b1a18] p-1">
      {/* Header Banner */}
      <div className="shrink-0 text-center pb-2 pt-1 space-y-1">
        <div className="w-10 h-10 rounded-xl bg-[#1b4d8f] mx-auto flex items-center justify-center text-white shadow-xs">
          <ShieldCheck size={24} />
        </div>
        <h1 className="text-base font-bold text-[#1b4d8f]">Scientist Registration</h1>
        <p className="text-[11px] text-[#7a7872]">
          Create your account for the CSIR-CBRI APEEG register.
        </p>
      </div>

      {/* Form Area */}
      <div className="flex-1 overflow-y-auto py-1 pr-1 custom-scrollbar">
        <form onSubmit={handleSubmit} className="space-y-2.5 bg-white p-3.5 rounded-2xl border border-black/10 shadow-xs">
          {error && (
            <div className="bg-[#fcf2f2] border border-[#f5c2c2] text-[#c92a2a] text-[11px] p-2 rounded-xl">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-0.5">
            <label className="text-[10.5px] font-semibold text-[#5d5b56]">Full Name *</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Ankit Rawat"
                className="w-full bg-white text-[12px] py-2 pl-8 pr-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                required
              />
              <User size={15} className="absolute left-2.5 top-2.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Official Email */}
          <div className="space-y-0.5">
            <label className="text-[10.5px] font-semibold text-[#5d5b56]">CSIR Email Address *</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ankit.rawat@cbri.res.in"
                className="w-full bg-white text-[12px] py-2 pl-8 pr-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                required
              />
              <Mail size={15} className="absolute left-2.5 top-2.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-0.5">
            <label className="text-[10.5px] font-semibold text-[#5d5b56]">Password *</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-white text-[12px] py-2 pl-8 pr-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                required
              />
              <Lock size={15} className="absolute left-2.5 top-2.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="space-y-0.5">
            <label className="text-[10.5px] font-semibold text-[#5d5b56]">Mobile Number</label>
            <div className="relative">
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full bg-white text-[12px] py-2 pl-8 pr-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
              />
              <Phone size={15} className="absolute left-2.5 top-2.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Department */}
          <div className="space-y-0.5">
            <label className="text-[10.5px] font-semibold text-[#5d5b56]">Group / Department</label>
            <div className="relative">
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="APEEG"
                className="w-full bg-white text-[12px] py-2 pl-8 pr-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
              />
              <Building size={15} className="absolute left-2.5 top-2.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1b4d8f] text-white py-2.5 rounded-xl text-[12.5px] font-semibold active:scale-98 transition-all shadow-xs flex items-center justify-center gap-2 mt-1"
          >
            {isLoading ? (
              <span>Registering...</span>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Link */}
      <div className="shrink-0 pt-2 border-t border-gray-100 text-center">
        <p className="text-[11.5px] text-[#5d5b56]">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="font-bold text-[#1b4d8f] hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
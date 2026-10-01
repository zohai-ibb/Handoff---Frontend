import React, { useState } from "react";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    // Simulate authentication API call
    setTimeout(() => {
      setIsLoading(false);
      // Hardcoded validation check for demonstration
      if (password.length >= 6) {
        const userData = {
          id: "65f1a2b3c4d5e6f7a8b9c0d2",
          name: "Dr. Kishor S. Kulkarni",
          email: email.trim(),
          department: "APEEG",
        };
        const token = "mock-jwt-token-xyz123";

        // Call parent handler to update auth state and trigger redirect
        onLoginSuccess(userData, token);
      } else {
        setError("Invalid email or password. Please check your credentials.");
      }
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden font-sans text-[#1b1a18] p-1">
      {/* Top Branding Section */}
      <div className="shrink-0 text-center pt-4 pb-2 space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-[#1b4d8f] mx-auto flex items-center justify-center text-white shadow-md">
          <ShieldCheck size={32} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1b4d8f]">CSIR - CBRI</h1>
          <p className="text-[11px] font-mono tracking-wider uppercase text-[#7a7872] mt-0.5">
            APEEG Instrument Register
          </p>
        </div>
      </div>

      {/* Main Form Section */}
      <div className="flex-1 overflow-y-auto py-2 pr-1 custom-scrollbar">
        <form onSubmit={handleSubmit} className="space-y-3.5 bg-white p-4 rounded-2xl border border-black/10 shadow-xs">
          <h2 className="text-sm font-bold text-[#1b1a18]">Sign in to your account</h2>

          {error && (
            <div className="bg-[#fcf2f2] border border-[#f5c2c2] text-[#c92a2a] text-[11.5px] p-2.5 rounded-xl">
              {error}
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#5d5b56]">
              Official Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. kskulkarni@cbri.res.in"
                className="w-full bg-white text-[12.5px] py-2.5 pl-9 pr-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                required
              />
              <Mail size={16} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#5d5b56]">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white text-[12.5px] py-2.5 pl-9 pr-3 rounded-xl border border-black/15 focus:outline-none focus:border-[#1b4d8f]"
                required
              />
              <Lock size={16} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1b4d8f] text-white py-2.5 rounded-xl text-[13px] font-semibold active:scale-98 transition-all shadow-xs flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer / Switch to Register Link */}
      <div className="shrink-0 pt-2 border-t border-gray-100 text-center">
        <p className="text-[12px] text-[#5d5b56]">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="font-bold text-[#1b4d8f] hover:underline"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}
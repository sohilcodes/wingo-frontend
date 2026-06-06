"use client";

import Link from "next/link";
import axios from "axios";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API = "https://wingo-backend-gtqa.onrender.com";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [refCode, setRefCode] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setRefCode(ref);
  }, [searchParams]);

  const register = async () => {
    if (!mobile || !password || !confirmPassword) return alert("Please fill all fields");
    if (password !== confirmPassword) return alert("Passwords do not match");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/register`, {
        mobile,
        password,
        ref: refCode || null
      });
      if (res.data?.success) {
        alert("Account created! Please login.");
        router.push("/");
      } else {
        alert(res.data?.error || "Register Failed");
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Network Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "300px",
        background: "radial-gradient(ellipse at 50% 0%, rgba(245,197,24,0.1) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      <div className="top-header">
        <Link href="/">
          <button style={{ color: "var(--gold)", background: "none", border: "none", fontSize: 22 }}>←</button>
        </Link>
        <span className="shimmer" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>
          WINGO ROYAL
        </span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ flex: 1, padding: "32px 24px", maxWidth: 420, width: "100%", margin: "0 auto" }} className="fade-up">
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
            Create Account
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Join Wingo Royal today
          </p>
        </div>

        {/* Refer code badge */}
        {refCode && (
          <div style={{
            background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.25)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 8
          }}>
            <span style={{ fontSize: 16 }}>🎁</span>
            <div>
              <div style={{ fontSize: 12, color: "var(--gold)", fontWeight: 700 }}>Referred by a friend!</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Code: {refCode}</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Phone Number</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>📱</span>
              <input type="tel" placeholder="Enter your phone number" value={mobile}
                onChange={e => setMobile(e.target.value)} className="input-field" style={{ paddingLeft: 40 }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Password</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔒</span>
              <input type={showPass ? "text" : "password"} placeholder="Create a password" value={password}
                onChange={e => setPassword(e.target.value)} className="input-field" style={{ paddingLeft: 40, paddingRight: 44 }} />
              <button onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", fontSize: 18 }}>
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Confirm Password</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>✅</span>
              <input type="password" placeholder="Re-enter your password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} className="input-field" style={{ paddingLeft: 40 }} />
            </div>
          </div>

          {/* Refer code input (manual) */}
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>
              Refer Code (Optional)
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🎁</span>
              <input type="text" placeholder="Enter refer code" value={refCode}
                onChange={e => setRefCode(e.target.value.toUpperCase())}
                className="input-field" style={{ paddingLeft: 40 }} />
            </div>
          </div>

          {/* Password strength */}
          {password && (
            <div style={{ display: "flex", gap: 4, marginTop: -4 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: password.length > i * 3
                    ? (password.length >= 8 ? "var(--green)" : password.length >= 6 ? "var(--gold)" : "var(--red)")
                    : "var(--bg3)"
                }} />
              ))}
            </div>
          )}

          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={register} disabled={loading} className="btn-gold">
              {loading ? "Creating account..." : "Create Account →"}
            </button>
            <Link href="/">
              <button className="btn-outline">Already have an account? Login</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0a0a0a" }} />}>
      <RegisterForm />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = "https://wingo-backend-gtqa.onrender.com";

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const login = async () => {
    if (!mobile || !password) return alert("Please fill all fields");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/login`, { mobile, password });
      if (res.data?.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        router.push("/home");
      } else {
        alert(res.data?.error || "Login Failed");
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Network Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* BG decoration */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "300px",
        background: "radial-gradient(ellipse at 50% 0%, rgba(245,197,24,0.12) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      {/* Header */}
      <div className="top-header">
        <div style={{ width: 40 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--gold-light), var(--gold-dark))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16
          }}>♛</div>
          <span className="shimmer" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>
            WINGO ROYAL
          </span>
        </div>
        <button style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 600, background: "var(--bg3)", padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)" }}>EN</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: "32px 24px", maxWidth: 420, width: "100%", margin: "0 auto" }} className="fade-up">
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
            Welcome Back
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 400, fontFamily: "'Inter', sans-serif" }}>
            Login to your account
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Phone */}
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Phone Number</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--gold)", fontSize: 16 }}>📱</span>
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                className="input-field"
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Password</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--gold)", fontSize: 16 }}>🔒</span>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                style={{ paddingLeft: 40, paddingRight: 44 }}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", fontSize: 18 }}
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={login} disabled={loading} className="btn-gold">
              {loading ? "Logging in..." : "Login →"}
            </button>
            <Link href="/register">
              <button className="btn-outline">Create New Account</button>
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>WINGO ROYAL v1.0</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12, fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
          By continuing, you agree to our Terms & Conditions.<br/>Play responsibly. 18+
        </p>
      </div>
    </div>
  );
                }
          

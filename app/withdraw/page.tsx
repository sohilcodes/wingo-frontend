"use client";

import Link from "next/link";
import axios from "axios";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = "https://wingo-backend-gtqa.onrender.com";
const AMOUNTS = [200, 500, 1000, 2000, 5000, 10000];

export default function WithdrawPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [selectedAmt, setSelectedAmt] = useState<number | null>(null);
  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) { router.push("/"); return; }
    setUser(JSON.parse(u));
  }, []);

  const balance = user?.balance ?? 0;

  const submit = async () => {
    if (!amount || Number(amount) < 200) return alert("Minimum withdrawal is ₹200");
    if (Number(amount) > balance) return alert("Insufficient balance");
    if (!upiId.includes("@")) return alert("Please enter a valid UPI ID");
    if (!upiName) return alert("Please enter account holder name");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API}/api/wallet/withdraw`, {
        userId: user?.id,
        amount: Number(amount),
        upiId,
        upiName
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data?.success) {
        alert("✅ Withdrawal request submitted! You'll receive funds within 24 hours.");
        router.push("/home");
      } else {
        alert(res.data?.error || "Withdrawal Failed");
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || "Network Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 90 }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "200px",
        background: "radial-gradient(ellipse at 50% 0%, rgba(155,89,255,0.08) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      {/* Header */}
      <div className="top-header">
        <button onClick={() => router.push("/home")}
          style={{ color: "var(--gold)", background: "none", border: "none", fontSize: 22 }}>←</button>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 17, fontWeight: 700, color: "#fff" }}>
          💸 Withdraw
        </span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: "20px", maxWidth: 480, margin: "0 auto" }} className="fade-up">

        {/* Balance Card */}
        <div style={{
          background: "linear-gradient(135deg, #1a0a2e, #2d1b69)",
          border: "1px solid rgba(155,89,255,0.4)",
          borderRadius: 20, padding: "20px 24px", marginBottom: 20
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Available Balance</div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 30, fontWeight: 900, color: "#c084fc" }}>
                ₹{balance.toLocaleString("en-IN")}
              </div>
            </div>
            <div style={{ fontSize: 40 }}>🏦</div>
          </div>
          <div style={{ marginTop: 12, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${Math.min((balance / 10000) * 100, 100)}%`,
              background: "linear-gradient(90deg, #9B59FF, #c084fc)", borderRadius: 2, transition: "width 0.5s"
            }} />
          </div>
        </div>

        {/* Quick Amounts */}
        <div style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
          Select Amount
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {AMOUNTS.map(amt => (
            <button key={amt} onClick={() => { setSelectedAmt(amt); setAmount(String(amt)); }}
              disabled={amt > balance}
              style={{
                padding: "14px 8px", borderRadius: 12, fontWeight: 700, fontSize: 14,
                border: `1px solid ${selectedAmt === amt ? "#9B59FF" : "var(--border)"}`,
                background: selectedAmt === amt ? "rgba(155,89,255,0.15)" : "var(--card)",
                color: amt > balance ? "var(--text-muted)" : (selectedAmt === amt ? "#c084fc" : "#ccc"),
                transition: "all 0.15s", opacity: amt > balance ? 0.4 : 1
              }}>
              ₹{amt >= 1000 ? `${amt/1000}K` : amt}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>
            Custom Amount
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9B59FF", fontWeight: 700, fontSize: 16 }}>₹</span>
            <input type="number" placeholder="Enter amount (min ₹200)"
              value={amount} onChange={e => { setAmount(e.target.value); setSelectedAmt(null); }}
              className="input-field" style={{ paddingLeft: 32 }} />
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Payment Details</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* UPI Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>UPI ID</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>💳</span>
              <input type="text" placeholder="yourname@upi" value={upiId}
                onChange={e => setUpiId(e.target.value)} className="input-field" style={{ paddingLeft: 40 }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Account Holder Name</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>👤</span>
              <input type="text" placeholder="Full name as in bank" value={upiName}
                onChange={e => setUpiName(e.target.value)} className="input-field" style={{ paddingLeft: 40 }} />
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{
          background: "rgba(155,89,255,0.06)", border: "1px solid rgba(155,89,255,0.2)",
          borderRadius: 12, padding: "12px 16px", marginBottom: 20
        }}>
          <div style={{ fontSize: 13, color: "#c084fc", fontWeight: 600, marginBottom: 4 }}>ℹ️ Withdrawal Info</div>
          <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.7 }}>
            • Minimum withdrawal: ₹200<br />
            • Processing time: Up to 24 hours<br />
            • Ensure UPI ID is correct before submitting<br />
            • Contact support if not received in 24 hours
          </div>
        </div>

        <button onClick={submit} disabled={loading} className="btn-gold">
          {loading ? "Processing..." : "💸 Submit Withdrawal"}
        </button>
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav">
        <Link href="/home" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg><span>Home</span></Link>
        <Link href="/deposit" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7l5-5 5 5h-4v4z"/></svg><span>Deposit</span></Link>
        <Link href="/game" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5S14.67 12 15.5 12s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg><span>Game</span></Link>
        <Link href="/withdraw" className="nav-item active"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1-7v4h-3l4 4 4-4h-3V5h-2z" transform="scale(1,-1) translate(0,-24)"/></svg><span>Withdraw</span></Link>
        <Link href="/profile" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg><span>Profile</span></Link>
      </div>
    </div>
  );
                       }
          

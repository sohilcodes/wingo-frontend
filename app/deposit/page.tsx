"use client";

import Link from "next/link";
import axios from "axios";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = "https://wingo-backend-gtqa.onrender.com";

const AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function DepositPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [selectedAmt, setSelectedAmt] = useState<number | null>(null);
  const [utrCode, setUtrCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=amount, 2=payment

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) { router.push("/"); return; }
    setUser(JSON.parse(u));
  }, []);

  const selectAmount = (amt: number) => {
    setSelectedAmt(amt);
    setAmount(String(amt));
  };

  const proceedToPayment = () => {
    if (!amount || Number(amount) < 100) return alert("Minimum deposit is ₹100");
    setStep(2);
  };

  const submitDeposit = async () => {
    if (!utrCode || utrCode.length < 6) return alert("Please enter a valid UTR/Transaction ID");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API}/api/wallet/deposit`, {
        userId: user?.id,
        amount: Number(amount),
        utrCode
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data?.success) {
        alert("✅ Deposit request submitted! It will be verified within 15 minutes.");
        router.push("/home");
      } else {
        alert(res.data?.error || "Deposit Failed");
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
        background: "radial-gradient(ellipse at 50% 0%, rgba(0,208,132,0.08) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      {/* Header */}
      <div className="top-header">
        <button onClick={() => step === 2 ? setStep(1) : router.push("/home")}
          style={{ color: "var(--gold)", background: "none", border: "none", fontSize: 22 }}>←</button>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 17, fontWeight: 700, color: "#fff" }}>
          💰 Deposit
        </span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: "20px", maxWidth: 480, margin: "0 auto" }} className="fade-up">

        {/* Step 1: Select Amount */}
        {step === 1 && (
          <>
            {/* Balance */}
            <div className="glass-card" style={{ padding: "16px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Current Balance</div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 700, color: "var(--gold)" }}>
                  ₹{(user?.balance ?? 0).toLocaleString("en-IN")}
                </div>
              </div>
              <div style={{ fontSize: 32 }}>💳</div>
            </div>

            <div style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
              Select Amount
            </div>

            {/* Quick amounts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
              {AMOUNTS.map(amt => (
                <button key={amt}
                  onClick={() => selectAmount(amt)}
                  style={{
                    padding: "14px 8px", borderRadius: 12, fontWeight: 700, fontSize: 15,
                    border: `1px solid ${selectedAmt === amt ? "var(--green)" : "var(--border)"}`,
                    background: selectedAmt === amt ? "rgba(0,208,132,0.12)" : "var(--card)",
                    color: selectedAmt === amt ? "var(--green)" : "#ccc",
                    transition: "all 0.15s"
                  }}>
                  ₹{amt.toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>
                Or Enter Custom Amount
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--gold)", fontWeight: 700, fontSize: 16 }}>₹</span>
                <input
                  type="number"
                  placeholder="Enter amount (min ₹100)"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setSelectedAmt(null); }}
                  className="input-field"
                  style={{ paddingLeft: 32 }}
                />
              </div>
            </div>

            {/* Info */}
            <div style={{
              background: "rgba(0,208,132,0.06)", border: "1px solid rgba(0,208,132,0.2)",
              borderRadius: 12, padding: "12px 16px", marginBottom: 20
            }}>
              <div style={{ fontSize: 13, color: "var(--green)", fontWeight: 600, marginBottom: 4 }}>ℹ️ Deposit Info</div>
              <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>
                • Minimum deposit: ₹100<br/>
                • Instant credit after verification<br/>
                • Processing time: 5-15 minutes
              </div>
            </div>

            <button onClick={proceedToPayment} className="btn-gold">
              Proceed to Payment →
            </button>
          </>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Deposit Amount</div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 36, fontWeight: 900, color: "var(--green)" }}>
                ₹{Number(amount).toLocaleString("en-IN")}
              </div>
            </div>

            {/* UPI QR */}
            <div className="glass-card" style={{ padding: "24px", textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
                Scan QR or Pay to UPI
              </div>
              <div style={{
                width: 140, height: 140, margin: "0 auto 16px",
                background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                border: "3px solid var(--gold)", fontSize: 64
              }}>
                📱
              </div>
              <div style={{
                background: "var(--bg3)", borderRadius: 10, padding: "12px 16px",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>UPI ID</div>
                  <div style={{ fontWeight: 700, color: "var(--gold)", fontSize: 15 }}>wingo@paytm</div>
                </div>
                <button
                  onClick={() => { navigator.clipboard?.writeText("wingo@paytm"); alert("Copied!"); }}
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px", color: "var(--gold)", fontSize: 12 }}>
                  Copy
                </button>
              </div>
            </div>

            {/* UTR Input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>
                Enter UTR / Transaction ID
              </label>
              <input
                type="text"
                placeholder="12-digit UTR number"
                value={utrCode}
                onChange={e => setUtrCode(e.target.value)}
                className="input-field"
              />
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                Find UTR in your payment app under transaction history
              </div>
            </div>

            <div style={{
              background: "rgba(245,197,24,0.06)", border: "1px solid rgba(245,197,24,0.2)",
              borderRadius: 12, padding: "12px 16px", marginBottom: 20
            }}>
              <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>
                ⚠️ Please complete payment first, then submit UTR code. Wrong UTR will delay verification.
              </div>
            </div>

            <button onClick={submitDeposit} disabled={loading} className="btn-gold">
              {loading ? "Submitting..." : "✅ Submit Deposit"}
            </button>
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav">
        <Link href="/home" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg><span>Home</span></Link>
        <Link href="/deposit" className="nav-item active"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7l5-5 5 5h-4v4z"/></svg><span>Deposit</span></Link>
        <Link href="/game" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5S14.67 12 15.5 12s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg><span>Game</span></Link>
        <Link href="/withdraw" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor" transform="rotate(180)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7l5-5 5 5h-4v4z"/></svg><span>Withdraw</span></Link>
        <Link href="/profile" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg><span>Profile</span></Link>
      </div>
    </div>
  );
}

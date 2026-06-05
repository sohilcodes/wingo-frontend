"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "https://wingo-backend-gtqa.onrender.com";

export default function Game() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [time, setTime] = useState(60);
  const [period, setPeriod] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [betAmt, setBetAmt] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) { router.push("/"); return; }
    setUser(JSON.parse(u));

    const p = new Date().toISOString().slice(0, 10).replace(/-/g, "") + "001";
    setPeriod(p);

    const id = setInterval(() => {
      setTime(prev => prev <= 1 ? 60 : prev - 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const placeBet = async () => {
    if (!selected) return alert("Please select a color or number first");
    if (time < 5) return alert("Betting closed! Wait for next round.");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API}/api/game/bet`, {
        userId: user?.id, type: "color", value: selected, amount: betAmt, period_id: period
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data?.success ? `✅ Bet placed: ₹${betAmt} on ${selected}` : (res.data?.error || "Bet Failed"));
    } catch (err: any) {
      alert(err?.response?.data?.error || "Network Error");
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    { name: "Green", emoji: "🟢", color: "var(--green)", bg: "rgba(0,208,132,0.15)" },
    { name: "Violet", emoji: "🟣", color: "#c084fc", bg: "rgba(155,89,255,0.15)" },
    { name: "Red", emoji: "🔴", color: "var(--red)", bg: "rgba(255,69,96,0.15)" },
  ];
  const numbers = [0,1,2,3,4,5,6,7,8,9];
  const numColors = ["var(--red)","#22c55e","var(--red)","#22c55e","var(--red)","#c084fc","var(--red)","#22c55e","var(--red)","#22c55e"];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 90 }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "200px",
        background: "radial-gradient(ellipse at 50% 0%, rgba(245,197,24,0.1) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      {/* Header */}
      <div className="top-header">
        <button onClick={() => router.push("/home")} style={{ color: "var(--gold)", background: "none", border: "none", fontSize: 22 }}>←</button>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 17, fontWeight: 700, color: "#fff" }}>🎮 Wingo Game</span>
        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", fontSize: 13, color: "var(--gold)", fontWeight: 600 }}>
          ₹{(user?.balance ?? 0).toLocaleString("en-IN")}
        </div>
      </div>

      <div style={{ padding: "16px 20px", maxWidth: 480, margin: "0 auto" }} className="fade-up">

        {/* Period + Timer */}
        <div className="glass-card" style={{ padding: "16px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Period</div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color: "#fff", marginTop: 2 }}>{period}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Time Left</div>
            <div style={{
              fontFamily: "'Orbitron', sans-serif", fontSize: 32, fontWeight: 900,
              color: time <= 10 ? "var(--red)" : "var(--green)",
              marginTop: 2
            }}>
              {String(Math.floor(time / 60)).padStart(2, "0")}:{String(time % 60).padStart(2, "0")}
            </div>
          </div>
        </div>

        {/* Timer bar */}
        <div style={{ height: 4, background: "var(--bg3)", borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${(time / 60) * 100}%`,
            background: time <= 10 ? "var(--red)" : "linear-gradient(90deg, var(--gold), var(--green))",
            borderRadius: 2, transition: "width 1s linear, background 0.3s"
          }} />
        </div>

        {/* Colors */}
        <div style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>
          Choose Color
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {colors.map(c => (
            <button key={c.name} onClick={() => setSelected(c.name.toLowerCase())}
              style={{
                padding: "18px 8px", borderRadius: 14, fontWeight: 700, fontSize: 15,
                border: `2px solid ${selected === c.name.toLowerCase() ? c.color : "var(--border)"}`,
                background: selected === c.name.toLowerCase() ? c.bg : "var(--card)",
                color: c.color, transition: "all 0.15s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6
              }}>
              <span style={{ fontSize: 24 }}>{c.emoji}</span>
              {c.name}
            </button>
          ))}
        </div>

        {/* Numbers */}
        <div style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>
          Choose Number
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 20 }}>
          {numbers.map(n => (
            <button key={n} onClick={() => setSelected(String(n))}
              style={{
                padding: "14px 0", borderRadius: 12, fontWeight: 900,
                fontFamily: "'Orbitron', sans-serif", fontSize: 18,
                border: `2px solid ${selected === String(n) ? numColors[n] : "var(--border)"}`,
                background: selected === String(n) ? `${numColors[n]}20` : "var(--card)",
                color: numColors[n], transition: "all 0.15s"
              }}>
              {n}
            </button>
          ))}
        </div>

        {/* Bet Amount */}
        <div style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>
          Bet Amount
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
          {[10, 50, 100, 500].map(a => (
            <button key={a} onClick={() => setBetAmt(a)}
              style={{
                padding: "10px 0", borderRadius: 10, fontWeight: 700, fontSize: 14,
                border: `1px solid ${betAmt === a ? "var(--gold)" : "var(--border)"}`,
                background: betAmt === a ? "rgba(245,197,24,0.12)" : "var(--card)",
                color: betAmt === a ? "var(--gold)" : "#ccc", transition: "all 0.15s"
              }}>
              ₹{a}
            </button>
          ))}
        </div>

        {/* Selected summary */}
        {selected && (
          <div style={{
            background: "rgba(245,197,24,0.06)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "12px 16px", marginBottom: 16,
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Your Bet:</span>
            <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 15 }}>
              ₹{betAmt} on {selected.charAt(0).toUpperCase() + selected.slice(1)}
            </span>
          </div>
        )}

        <button onClick={placeBet} disabled={loading || !selected || time < 5} className="btn-gold"
          style={{ opacity: (!selected || time < 5) ? 0.5 : 1 }}>
          {loading ? "Placing bet..." : time < 5 ? "⏳ Betting Closed" : "🎯 Place Bet"}
        </button>
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav">
        <Link href="/home" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg><span>Home</span></Link>
        <Link href="/deposit" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7l5-5 5 5h-4v4z"/></svg><span>Deposit</span></Link>
        <Link href="/game" className="nav-item active"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5S14.67 12 15.5 12s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg><span>Game</span></Link>
        <Link href="/withdraw" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7l5-5 5 5h-4v4z" transform="rotate(180 12 12)"/></svg><span>Withdraw</span></Link>
        <Link href="/profile" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg><span>Profile</span></Link>
      </div>
    </div>
  );
      }
      

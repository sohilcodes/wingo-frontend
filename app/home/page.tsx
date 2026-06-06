"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "https://wingo-backend-gtqa.onrender.com";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) { router.push("/"); return; }
    const parsed = JSON.parse(u);
    setUser(parsed);
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.user) {
        setBalance(res.data.user.balance || 0);
        const u = localStorage.getItem("user");
        if (u) {
          const parsed = JSON.parse(u);
          parsed.balance = res.data.user.balance;
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      }
    } catch {
      const u = localStorage.getItem("user");
      if (u) setBalance(JSON.parse(u).balance || 0);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 90 }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "260px",
        background: "radial-gradient(ellipse at 30% 0%, rgba(245,197,24,0.1) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      {/* Header */}
      <div className="top-header">
        <div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 900, letterSpacing: 2 }} className="shimmer">
            WINGO ROYAL
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Welcome back, {user?.mobile?.slice(-4) ? `****${user.mobile.slice(-4)}` : "Player"}
          </div>
        </div>
        <Link href="/profile">
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--gold-dark), var(--gold))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, border: "2px solid var(--border-bright)"
          }}>👤</div>
        </Link>
      </div>

      <div style={{ padding: "20px 20px 0", maxWidth: 480, margin: "0 auto" }}>

        {/* Balance Card */}
        <div className="fade-up" style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          border: "1px solid var(--border-bright)",
          borderRadius: 20, padding: "24px", marginBottom: 20,
          position: "relative", overflow: "hidden"
        }}>
          <div style={{
            position: "absolute", right: -20, top: -20,
            width: 120, height: 120, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,197,24,0.15), transparent 70%)"
          }} />
          <div style={{
            position: "absolute", right: 20, top: 20,
            fontFamily: "'Orbitron', sans-serif", fontSize: 11, color: "var(--gold)", opacity: 0.6, letterSpacing: 2
          }}>BALANCE</div>

          <div style={{ marginTop: 8 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 4 }}>Available Balance</div>
            <div style={{
              fontFamily: "'Orbitron', sans-serif", fontSize: 38, fontWeight: 900,
              color: "var(--gold-light)", letterSpacing: 1
            }}>
              ₹{balance.toLocaleString("en-IN")}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Link href="/deposit" style={{ flex: 1 }}>
              <button style={{
                width: "100%", padding: "10px", borderRadius: 10,
                background: "var(--green)", color: "#fff", border: "none",
                fontWeight: 700, fontSize: 14
              }}>+ Deposit</button>
            </Link>
            <Link href="/withdraw" style={{ flex: 1 }}>
              <button style={{
                width: "100%", padding: "10px", borderRadius: 10,
                background: "transparent", color: "var(--gold)", border: "1px solid var(--border-bright)",
                fontWeight: 700, fontSize: 14
              }}>↑ Withdraw</button>
            </Link>
          </div>
        </div>

        {/* Games Section */}
        <div style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
          🎮 Games
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="fade-up">

          {/* Wingo 1 Min */}
          <Link href="/game">
            <div style={{
              background: "linear-gradient(135deg, #0f3460, #16213e)",
              border: "1px solid rgba(99,102,241,0.4)",
              borderRadius: 16, padding: "18px 20px",
              display: "flex", alignItems: "center", gap: 16,
              cursor: "pointer", position: "relative", overflow: "hidden"
            }}>
              <div style={{
                position: "absolute", right: -10, top: -10,
                width: 80, height: 80, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)"
              }} />
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, flexShrink: 0,
                boxShadow: "0 4px 16px rgba(99,102,241,0.4)"
              }}>🎯</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: "#fff", marginBottom: 3 }}>Wingo 1 Min</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Color prediction game • 1 min rounds</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <span style={{
                    background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
                    color: "#22c55e", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20
                  }}>🟢 LIVE</span>
                  <span style={{
                    background: "rgba(245,197,24,0.1)", border: "1px solid rgba(245,197,24,0.2)",
                    color: "var(--gold)", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20
                  }}>2x WIN</span>
                </div>
              </div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 20 }}>›</div>
            </div>
          </Link>

          {/* Aviator */}
          <Link href="/aviator">
            <div style={{
              background: "linear-gradient(135deg, #1a0a2e, #2d1b4e)",
              border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: 16, padding: "18px 20px",
              display: "flex", alignItems: "center", gap: 16,
              cursor: "pointer", position: "relative", overflow: "hidden"
            }}>
              <div style={{
                position: "absolute", right: -10, top: -10,
                width: 80, height: 80, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(239,68,68,0.2), transparent 70%)"
              }} />
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: "linear-gradient(135deg, #ef4444, #f87171)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, flexShrink: 0,
                boxShadow: "0 4px 16px rgba(239,68,68,0.4)"
              }}>✈️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: "#fff", marginBottom: 3 }}>Aviator</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Cash out before the plane flies away!</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <span style={{
                    background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                    color: "#f87171", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20
                  }}>🔥 HOT</span>
                  <span style={{
                    background: "rgba(245,197,24,0.1)", border: "1px solid rgba(245,197,24,0.2)",
                    color: "var(--gold)", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20
                  }}>100x WIN</span>
                </div>
              </div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 20 }}>›</div>
            </div>
          </Link>

        </div>
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav">
        <Link href="/home" className="nav-item active">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <span>Home</span>
        </Link>
        <Link href="/deposit" className="nav-item">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7l5-5 5 5h-4v4z"/></svg>
          <span>Deposit</span>
        </Link>
        <Link href="/refer" className="nav-item">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          <span>Refer</span>
        </Link>
        <Link href="/withdraw" className="nav-item">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7l5-5 5 5h-4v4z" transform="rotate(180 12 12)"/></svg>
          <span>Withdraw</span>
        </Link>
        <Link href="/profile" className="nav-item">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
}

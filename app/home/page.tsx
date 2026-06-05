"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) { router.push("/"); return; }
    setUser(JSON.parse(u));
  }, []);

  const balance = user?.balance ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 90 }}>
      {/* BG glow */}
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
          borderRadius: 20,
          padding: "24px 24px",
          marginBottom: 20,
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Card decoration */}
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
                fontWeight: 700, fontSize: 14, letterSpacing: 0.5
              }}>+ Deposit</button>
            </Link>
            <Link href="/withdraw" style={{ flex: 1 }}>
              <button style={{
                width: "100%", padding: "10px", borderRadius: 10,
                background: "transparent", color: "var(--gold)", border: "1px solid var(--border-bright)",
                fontWeight: 700, fontSize: 14, letterSpacing: 0.5
              }}>↑ Withdraw</button>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}
          className="fade-up">
          {[
            { label: "Today Wins", value: "0", icon: "🏆" },
            { label: "Total Bets", value: "0", icon: "🎯" },
            { label: "Win Rate", value: "0%", icon: "📊" },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--gold)", marginTop: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Section title */}
        <div style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
          Quick Actions
        </div>

        {/* Action Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="fade-up">
          <Link href="/game">
            <div className="glass-card" style={{
              padding: "20px 16px", textAlign: "center", cursor: "pointer",
              transition: "all 0.2s", position: "relative", overflow: "hidden"
            }}>
              <div style={{ fontSize: 36 }}>🎮</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8, color: "#fff" }}>Wingo Game</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>Predict & Win</div>
              <div style={{
                position: "absolute", top: 10, right: 10,
                background: "var(--green)", color: "#fff",
                fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5
              }}>LIVE</div>
            </div>
          </Link>

          <Link href="/deposit">
            <div className="glass-card" style={{ padding: "20px 16px", textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 36 }}>💰</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8, color: "#fff" }}>Deposit</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>Add Funds</div>
            </div>
          </Link>

          <Link href="/withdraw">
            <div className="glass-card" style={{ padding: "20px 16px", textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 36 }}>💸</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8, color: "#fff" }}>Withdraw</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>Cash Out</div>
            </div>
          </Link>

          <Link href="/profile">
            <div className="glass-card" style={{ padding: "20px 16px", textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 36 }}>👤</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8, color: "#fff" }}>Profile</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>My Account</div>
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
        <Link href="/game" className="nav-item">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5S14.67 12 15.5 12s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
          <span>Game</span>
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
      

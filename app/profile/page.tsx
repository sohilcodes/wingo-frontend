"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) { router.push("/"); return; }
    setUser(JSON.parse(u));
  }, []);

  const logout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/");
    }
  };

  const maskedMobile = user?.mobile
    ? user.mobile.slice(0, 3) + "****" + user.mobile.slice(-3)
    : "Loading...";

  const menuItems = [
    { icon: "💰", label: "Deposit History", sublabel: "View all deposits", href: "/deposit" },
    { icon: "💸", label: "Withdraw History", sublabel: "View all withdrawals", href: "/withdraw" },
    { icon: "🎮", label: "Game History", sublabel: "Past bets & results", href: "/game" },
    { icon: "🔒", label: "Change Password", sublabel: "Update your password", href: "#" },
    { icon: "📞", label: "Support", sublabel: "Contact us for help", href: "#" },
    { icon: "📋", label: "Terms & Conditions", sublabel: "Rules and policies", href: "#" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 90 }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "280px",
        background: "radial-gradient(ellipse at 50% 0%, rgba(245,197,24,0.1) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      {/* Header */}
      <div className="top-header">
        <button onClick={() => router.push("/home")}
          style={{ color: "var(--gold)", background: "none", border: "none", fontSize: 22 }}>←</button>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 17, fontWeight: 700, color: "#fff" }}>
          My Profile
        </span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* Profile Hero */}
        <div className="fade-up" style={{ padding: "28px 20px 20px", textAlign: "center" }}>
          {/* Avatar */}
          <div style={{
            width: 88, height: 88, borderRadius: "50%", margin: "0 auto 14px",
            background: "linear-gradient(135deg, var(--gold-dark), var(--gold), var(--gold-light))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 38, boxShadow: "0 0 32px rgba(245,197,24,0.3)",
            border: "3px solid var(--bg)"
          }}>👤</div>

          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
            Player #{user?.id || "000"}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>📱 {maskedMobile}</div>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(245,197,24,0.12)", border: "1px solid var(--border-bright)",
            borderRadius: 20, padding: "5px 14px", marginTop: 12
          }}>
            <span style={{ fontSize: 14 }}>♛</span>
            <span style={{ fontSize: 12, color: "var(--gold)", fontWeight: 600, letterSpacing: 0.5 }}>Bronze Member</span>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "0 20px", marginBottom: 24 }}>
          {[
            { label: "Balance", value: `₹${(user?.balance ?? 0).toLocaleString("en-IN")}`, color: "var(--gold)" },
            { label: "Total Wins", value: "0", color: "var(--green)" },
            { label: "Bets Placed", value: "0", color: "#c084fc" },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div style={{ padding: "0 20px" }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
            Account
          </div>
          <div className="glass-card" style={{ overflow: "hidden", marginBottom: 20 }}>
            {menuItems.map((item, i) => (
              <Link key={item.label} href={item.href}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 18px",
                  borderBottom: i < menuItems.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "background 0.15s"
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(245,197,24,0.05)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, border: "1px solid var(--border)"
                    }}>{item.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "#e8e8f0" }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{item.sublabel}</div>
                    </div>
                  </div>
                  <span style={{ color: "var(--text-muted)", fontSize: 18 }}>›</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Logout */}
          <button onClick={logout}
            style={{
              width: "100%", padding: "15px", borderRadius: 12,
              background: "rgba(255,69,96,0.08)", border: "1px solid rgba(255,69,96,0.3)",
              color: "var(--red)", fontWeight: 700, fontSize: 15, letterSpacing: 0.5,
              marginBottom: 20, transition: "all 0.2s"
            }}>
            🚪 Logout
          </button>

          <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", paddingBottom: 10 }}>
            Wingo Royal v1.0 • Play Responsibly
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav">
        <Link href="/home" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg><span>Home</span></Link>
        <Link href="/deposit" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7l5-5 5 5h-4v4z"/></svg><span>Deposit</span></Link>
        <Link href="/game" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5S14.67 12 15.5 12s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg><span>Game</span></Link>
        <Link href="/withdraw" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7l5-5 5 5h-4v4z" transform="rotate(180 12 12)"/></svg><span>Withdraw</span></Link>
        <Link href="/profile" className="nav-item active"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg><span>Profile</span></Link>
      </div>
    </div>
  );
      }
          

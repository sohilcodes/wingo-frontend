"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "https://wingo-backend-gtqa.onrender.com";

export default function ReferPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [referInfo, setReferInfo] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) { router.push("/"); return; }
    setUser(JSON.parse(u));
    fetchReferInfo();
  }, []);

  const fetchReferInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const [infoRes, logsRes] = await Promise.all([
        axios.get(`${API}/api/refer/info`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/refer/logs`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (infoRes.data?.success) setReferInfo(infoRes.data);
      if (logsRes.data?.success) setLogs(logsRes.data.logs);
    } catch {}
    finally { setLoading(false); }
  };

  const copyLink = () => {
    const link = referInfo?.referLink || "";
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    const link = referInfo?.referLink || "";
    if (navigator.share) {
      navigator.share({
        title: "Join Wingo Royal!",
        text: "🎮 Play Wingo Royal and win real money! Use my refer link to join:",
        url: link,
      });
    } else {
      copyLink();
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 90 }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "260px",
        background: "radial-gradient(ellipse at 50% 0%, rgba(245,197,24,0.08) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      {/* Header */}
      <div className="top-header">
        <button onClick={() => router.push("/home")} style={{
          color: "var(--gold)", background: "none", border: "none", fontSize: 22
        }}>←</button>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 900, letterSpacing: 2, color: "#fff" }}>
          🎁 Refer & Earn
        </span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: "20px", maxWidth: 480, margin: "0 auto" }}>

        {/* Hero Banner */}
        <div className="fade-up" style={{
          background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)",
          border: "1px solid rgba(245,197,24,0.25)",
          borderRadius: 20, padding: "24px",
          textAlign: "center", marginBottom: 20,
          position: "relative", overflow: "hidden"
        }}>
          <div style={{
            position: "absolute", left: "50%", top: -30,
            transform: "translateX(-50%)",
            width: 150, height: 150, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,197,24,0.1), transparent 70%)"
          }} />
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎁</div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 900, color: "var(--gold)", marginBottom: 6 }}>
            Earn 0.1% Forever!
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
            Invite friends — earn <span style={{ color: "var(--gold)", fontWeight: 700 }}>0.1%</span> of every deposit they make, for life!
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Loading...</div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }} className="fade-up">
              {[
                { label: "Friends Invited", value: referInfo?.totalReferred || 0, icon: "👥", color: "#6366f1" },
                { label: "Total Earned", value: `₹${(referInfo?.referEarnings || 0).toFixed(2)}`, icon: "💰", color: "#f1c40f" },
              ].map(s => (
                <div key={s.label} style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14, padding: "16px", textAlign: "center"
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Refer Code */}
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, padding: "16px", marginBottom: 16
            }} className="fade-up">
              <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                Your Refer Code
              </div>
              <div style={{
                background: "rgba(245,197,24,0.06)", border: "1px solid rgba(245,197,24,0.2)",
                borderRadius: 10, padding: "14px 16px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 12
              }}>
                <span style={{
                  fontFamily: "monospace", fontSize: 22, fontWeight: 900,
                  color: "var(--gold)", letterSpacing: 3
                }}>{referInfo?.referCode || "—"}</span>
                <button onClick={copyLink} style={{
                  background: copied ? "rgba(34,197,94,0.2)" : "rgba(245,197,24,0.15)",
                  border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "rgba(245,197,24,0.3)"}`,
                  borderRadius: 8, padding: "6px 12px",
                  color: copied ? "#22c55e" : "var(--gold)", fontSize: 12, fontWeight: 700
                }}>
                  {copied ? "✅ Copied!" : "📋 Copy"}
                </button>
              </div>

              {/* Refer Link */}
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Your Refer Link</div>
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8, padding: "10px 12px", fontSize: 11,
                color: "rgba(255,255,255,0.5)", fontFamily: "monospace",
                wordBreak: "break-all", marginBottom: 12
              }}>
                {referInfo?.referLink || "—"}
              </div>

              {/* Share buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={copyLink} style={{
                  flex: 1, padding: "12px", borderRadius: 10, border: "none",
                  background: "rgba(245,197,24,0.15)", color: "var(--gold)",
                  fontWeight: 700, fontSize: 14
                }}>📋 Copy Link</button>
                <button onClick={shareLink} style={{
                  flex: 1, padding: "12px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #6366f1, #818cf8)",
                  color: "#fff", fontWeight: 700, fontSize: 14
                }}>🚀 Share</button>
              </div>
            </div>

            {/* How it works */}
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, padding: "16px", marginBottom: 16
            }} className="fade-up">
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
                📖 How it works
              </div>
              {[
                { step: "1", text: "Share your refer link with friends", icon: "📤" },
                { step: "2", text: "Friend registers using your link", icon: "👤" },
                { step: "3", text: "Friend makes a deposit", icon: "💳" },
                { step: "4", text: "You earn 0.1% of their deposit — forever!", icon: "💰" },
              ].map(s => (
                <div key={s.step} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)"
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "rgba(245,197,24,0.1)", border: "1px solid rgba(245,197,24,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, flexShrink: 0
                  }}>{s.icon}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{s.text}</div>
                </div>
              ))}
            </div>

            {/* Refer Logs */}
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, overflow: "hidden"
            }} className="fade-up">
              <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: 700, fontSize: 13, color: "#fff" }}>
                📋 Earning History ({logs.length})
              </div>
              {logs.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                  No earnings yet — invite friends to start earning!
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} style={{
                    padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                        Friend: ****{log.referred?.mobile?.slice(-4) || "????"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        Deposit: ₹{log.deposit_amount?.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#22c55e" }}>
                        +₹{log.bonus_amount?.toFixed(2)}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {log.created_at?.slice(0, 10)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav">
        <Link href="/home" className="nav-item">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <span>Home</span>
        </Link>
        <Link href="/deposit" className="nav-item">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7l5-5 5 5h-4v4z"/></svg>
          <span>Deposit</span>
        </Link>
        <Link href="/refer" className="nav-item active">
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

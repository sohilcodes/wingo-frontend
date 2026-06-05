"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "https://wingo-backend-gtqa.onrender.com";

const numColor = (n: number) => {
  if (n === 0) return { bg: "linear-gradient(135deg, #e74c3c 60%, #9b59b6 40%)", border: "#e74c3c" };
  if (n === 5) return { bg: "linear-gradient(135deg, #27ae60 60%, #9b59b6 40%)", border: "#27ae60" };
  if (n % 2 === 0) return { bg: "linear-gradient(135deg, #e74c3c, #c0392b)", border: "#e74c3c" };
  return { bg: "linear-gradient(135deg, #27ae60, #1e8449)", border: "#27ae60" };
};

const MULTIPLIERS = [1, 5, 10, 20, 50, 100];
const BASE_BET = 10;

export default function Game() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [period, setPeriod] = useState("");
  const [gameMode, setGameMode] = useState<"1min" | "3min" | "5min">("1min");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"color" | "number" | "size">("color");
  const [modalValue, setModalValue] = useState<any>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [isRandom, setIsRandom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const offsetRef = useRef(0);
  const prevPeriodRef = useRef("");

  const roundTime = gameMode === "1min" ? 60 : gameMode === "3min" ? 180 : 300;

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) { router.push("/"); return; }
    const parsed = JSON.parse(u);
    setUser(parsed);
    setBalance(parsed.balance ?? 0);
    syncTime();
    fetchHistory();
  }, []);

  // Refresh history when new round starts
  useEffect(() => {
    if (timeLeft === roundTime - 1 && prevPeriodRef.current && prevPeriodRef.current !== period) {
      fetchHistory();
    }
    prevPeriodRef.current = period;
  }, [period]);

  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now() + offsetRef.current;
      const secs = Math.floor(now / 1000);
      const tl = roundTime - (secs % roundTime);
      setTimeLeft(tl);
      const yyyymmdd = new Date(now).toISOString().slice(0, 10).replace(/-/g, "");
      const mins = Math.floor(now / (roundTime * 1000));
      setPeriod(`${yyyymmdd}${String(mins).slice(-6)}`);
    }, 1000);
    return () => clearInterval(iv);
  }, [roundTime]);

  const syncTime = async () => {
    try {
      const res = await axios.get(`${API}/health`);
      offsetRef.current = new Date(res.data.time).getTime() - Date.now();
    } catch { offsetRef.current = 0; }
  };

  // ✅ REAL history from backend
  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/game/history`);
      if (res.data?.rounds?.length > 0) {
        setHistory(res.data.rounds.map((r: any) => ({
          period_id: r.period_id,
          result: r.num,
          color: r.color,
        })));
        return;
      }
    } catch {}
    setHistory([]);
  };

  const openBet = (type: "color" | "number" | "size", value: any) => {
    if (timeLeft < 5) return alert("⏳ Betting closed! Wait for next round.");
    setModalType(type);
    setModalValue(value);
    setMultiplier(1);
    setIsRandom(false);
    setShowModal(true);
  };

  const betAmount = BASE_BET * multiplier;

  const getProfit = () => {
    if (modalType === "number") return betAmount * 9 - betAmount;
    return betAmount * 2 - betAmount;
  };

  const confirmBet = async () => {
    const finalValue = isRandom
      ? (modalType === "color" ? ["green", "violet", "red"][Math.floor(Math.random() * 3)]
        : modalType === "number" ? String(Math.floor(Math.random() * 10))
        : ["big", "small"][Math.floor(Math.random() * 2)])
      : modalValue;

    if (balance < betAmount) { alert("Insufficient balance!"); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API}/api/game/bet`, {
        userId: user?.id,
        type: modalType === "size" ? "size" : modalType,
        value: String(finalValue),
        amount: betAmount,
        period_id: period,
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data?.success) {
        const newBal = balance - betAmount;
        setBalance(newBal);
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...u, balance: newBal }));
        setShowModal(false);
        alert(`✅ Bet placed! ₹${betAmount} on ${String(finalValue).toUpperCase()}\nPossible win: ₹${betAmount + getProfit()}`);
      } else {
        alert(res.data?.error || "Bet failed");
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const histColorDot: any = { green: "#27ae60", red: "#e74c3c", violet: "#9b59b6" };
  const timerPct = (timeLeft / roundTime) * 100;

  const modalColorMap: any = {
    green:  { bg: "#27ae60" },
    violet: { bg: "#9b59b6" },
    red:    { bg: "#e74c3c" },
    big:    { bg: "#f39c12" },
    small:  { bg: "#3498db" },
  };
  const mc = modalType === "number"
    ? numColor(modalValue)
    : { bg: modalColorMap[modalValue]?.bg || "#333", border: "transparent" };

  return (
    <div style={{ minHeight: "100vh", background: "#0e1117", paddingBottom: 80, fontFamily: "'Rajdhani', sans-serif" }}>

      {/* TOP TABS */}
      <div style={{ background: "#161b27", padding: "10px 12px 0", display: "flex", gap: 8 }}>
        {(["30sec", "1min", "3min", "5min"] as const).map((m) => {
          const active = m === gameMode || (m === "1min" && gameMode === "1min");
          return (
            <button key={m} onClick={() => { if (m !== "30sec") setGameMode(m as any); }}
              style={{
                flex: 1, padding: "10px 4px 12px", borderRadius: "10px 10px 0 0",
                background: active ? "#2196F3" : "#1e2433",
                color: active ? "#fff" : "#666",
                border: "none", fontSize: 12, fontWeight: 700,
                opacity: m === "30sec" ? 0.4 : 1,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4
              }}>
              <span style={{ fontSize: 20 }}>🕐</span>
              <span>WinGo</span>
              <span>{m === "1min" ? "1 Min" : m === "3min" ? "3 Min" : m === "5min" ? "5 Min" : "30sec"}</span>
            </button>
          );
        })}
      </div>

      {/* TIMER CARD */}
      <div style={{
        background: "linear-gradient(135deg, #1a8fd1, #2196F3)",
        padding: "14px 16px", position: "relative", overflow: "hidden"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <button style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 20, padding: "5px 12px", color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 8
            }}>📋 How to play</button>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 700, marginBottom: 6 }}>
              WinGo {gameMode === "1min" ? "1 Min" : gameMode === "3min" ? "3 Min" : "5 Min"}
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {history.slice(0, 5).map((h, i) => (
                <div key={i} style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: histColorDot[h.color] || "#555",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 900, fontSize: 14,
                  border: "2px solid rgba(255,255,255,0.3)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                }}>{h.result}</div>
              ))}
            </div>
          </div>

          <div style={{ width: 1, height: 80, background: "rgba(255,255,255,0.2)", margin: "0 16px" }} />

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>Time remaining</div>
            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", alignItems: "center" }}>
              {[0, 1, ":", 2, 3].map((d, i) => (
                d === ":" ? (
                  <span key={i} style={{ color: "#fff", fontSize: 32, fontWeight: 900, lineHeight: 1 }}>:</span>
                ) : (
                  <div key={i} style={{
                    width: 36, height: 44, background: "rgba(255,255,255,0.15)",
                    borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    color: timeLeft <= 10 ? "#ff4757" : "#fff", fontSize: 28, fontWeight: 900,
                    border: "1px solid rgba(255,255,255,0.2)"
                  }}>
                    {i === 0 ? String(Math.floor(timeLeft / 60)).padStart(2, "0")[0]
                      : i === 1 ? String(Math.floor(timeLeft / 60)).padStart(2, "0")[1]
                      : i === 3 ? String(timeLeft % 60).padStart(2, "0")[0]
                      : String(timeLeft % 60).padStart(2, "0")[1]}
                  </div>
                )
              ))}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 6, fontFamily: "monospace" }}>
              {period}
            </div>
          </div>
        </div>

        <div style={{ height: 3, background: "rgba(255,255,255,0.2)", borderRadius: 2, marginTop: 10, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${timerPct}%`,
            background: timeLeft <= 10 ? "#ff4757" : "#fff",
            borderRadius: 2, transition: "width 1s linear"
          }} />
        </div>
      </div>

      <div style={{ padding: "12px 12px 0", maxWidth: 500, margin: "0 auto" }}>

        {/* COLOR BUTTONS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[
            { val: "green", label: "Green", bg: "#27ae60" },
            { val: "violet", label: "Violet", bg: "#9b59b6" },
            { val: "red", label: "Red", bg: "#e74c3c" },
          ].map(c => (
            <button key={c.val} onClick={() => openBet("color", c.val)}
              style={{
                flex: 1, padding: "14px 8px", borderRadius: 10,
                background: c.bg, color: "#fff", border: "none",
                fontWeight: 800, fontSize: 16,
                boxShadow: `0 4px 12px ${c.bg}66`, transition: "transform 0.1s"
              }}
              onMouseDown={e => (e.currentTarget.style.transform = "scale(0.96)")}
              onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}>
              {c.label}
            </button>
          ))}
        </div>

        {/* NUMBER BALLS */}
        <div style={{
          background: "#161b27", borderRadius: 14, padding: "14px 10px", marginBottom: 12,
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8
        }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => {
            const nc = numColor(n);
            return (
              <button key={n} onClick={() => openBet("number", n)}
                style={{
                  width: "100%", aspectRatio: "1",
                  borderRadius: "50%", background: nc.bg,
                  border: "3px solid rgba(255,255,255,0.2)",
                  color: "#fff", fontWeight: 900, fontSize: 22,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 3px 10px rgba(0,0,0,0.4)", transition: "transform 0.1s"
                }}
                onMouseDown={e => (e.currentTarget.style.transform = "scale(0.9)")}
                onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}>
                {n}
              </button>
            );
          })}
        </div>

        {/* MULTIPLIER ROW */}
        <div style={{
          background: "#161b27", borderRadius: 12, padding: "10px 12px",
          display: "flex", gap: 6, alignItems: "center", marginBottom: 12, flexWrap: "wrap"
        }}>
          <button onClick={() => openBet("color", ["green", "violet", "red"][Math.floor(Math.random() * 3)])}
            style={{
              padding: "8px 14px", borderRadius: 8,
              background: "transparent", border: "1px solid #e74c3c",
              color: "#e74c3c", fontWeight: 700, fontSize: 13
            }}>
            Random
          </button>
          {MULTIPLIERS.map(m => (
            <button key={m}
              style={{
                flex: 1, padding: "8px 4px", borderRadius: 8,
                background: m === 1 ? "#27ae60" : "#1e2433",
                border: "none", color: "#fff", fontWeight: 700, fontSize: 13
              }}>
              X{m}
            </button>
          ))}
        </div>

        {/* BIG / SMALL */}
        <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
          <button onClick={() => openBet("size", "big")} style={{
            flex: 1, padding: 16, background: "#f39c12",
            border: "none", color: "#fff", fontWeight: 800, fontSize: 17
          }}>Big</button>
          <button onClick={() => openBet("size", "small")} style={{
            flex: 1, padding: 16, background: "#3498db",
            border: "none", color: "#fff", fontWeight: 800, fontSize: 17
          }}>Small</button>
        </div>

        {/* HISTORY TABLE */}
        <div style={{ background: "#161b27", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e2433", fontWeight: 700, color: "#fff", fontSize: 14 }}>
            📋 Game History
          </div>
          {history.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#555", fontSize: 13 }}>
              No history yet — play some rounds!
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#1a2035" }}>
                  <th style={{ padding: "8px 12px", fontSize: 11, color: "#666", textAlign: "left", fontWeight: 600 }}>Period</th>
                  <th style={{ padding: "8px 12px", fontSize: 11, color: "#666", textAlign: "center", fontWeight: 600 }}>Number</th>
                  <th style={{ padding: "8px 12px", fontSize: 11, color: "#666", textAlign: "center", fontWeight: 600 }}>Color</th>
                  <th style={{ padding: "8px 12px", fontSize: 11, color: "#666", textAlign: "center", fontWeight: 600 }}>Big/Small</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => {
                  const nc = numColor(h.result);
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #1a2035" }}>
                      <td style={{ padding: "10px 12px", fontSize: 11, color: "#666", fontFamily: "monospace" }}>{h.period_id?.slice(-6)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: nc.bg, margin: "0 auto",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 900, fontSize: 13
                        }}>{h.result}</div>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: (histColorDot[h.color] || "#555") + "22",
                          color: histColorDot[h.color] || "#fff", textTransform: "capitalize"
                        }}>{h.color}</span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: h.result >= 5 ? "#f39c12" : "#3498db"
                        }}>{h.result >= 5 ? "Big" : "Small"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* BET MODAL */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{
            background: "#161b27", borderRadius: "20px 20px 0 0",
            width: "100%", maxWidth: 500, padding: "0 0 32px",
            animation: "slideUp 0.25s ease"
          }}>
            <div style={{
              background: typeof mc.bg === "string" && mc.bg.startsWith("linear") ? mc.bg : mc.bg,
              borderRadius: "20px 20px 0 0", padding: "16px 20px",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, textTransform: "capitalize" }}>
                {modalType === "number" ? `Number ${modalValue}` : String(modalValue).toUpperCase()}
              </div>
              <button onClick={() => setShowModal(false)} style={{
                background: "rgba(255,255,255,0.2)", border: "none", color: "#fff",
                width: 28, height: 28, borderRadius: "50%", fontSize: 16, fontWeight: 700
              }}>✕</button>
            </div>

            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ color: "#888", fontSize: 13 }}>Balance</span>
                <span style={{ color: "#f1c40f", fontWeight: 700, fontFamily: "monospace" }}>₹{balance.toLocaleString("en-IN")}</span>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Select Multiplier</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {MULTIPLIERS.map(m => (
                    <button key={m} onClick={() => setMultiplier(m)}
                      style={{
                        flex: 1, padding: "10px 4px", borderRadius: 8, fontWeight: 700, fontSize: 14,
                        background: multiplier === m ? "#2196F3" : "#1e2433",
                        color: multiplier === m ? "#fff" : "#666",
                        border: `1px solid ${multiplier === m ? "#2196F3" : "#2a3040"}`,
                        transition: "all 0.15s"
                      }}>
                      X{m}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{
                background: "#0e1117", borderRadius: 12, padding: "14px 16px",
                marginBottom: 16, border: "1px solid #1e2433"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#888", fontSize: 13 }}>Bet Amount</span>
                  <span style={{ color: "#fff", fontWeight: 700, fontFamily: "monospace" }}>₹{betAmount}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#888", fontSize: 13 }}>Multiplier</span>
                  <span style={{ color: "#2196F3", fontWeight: 700 }}>X{multiplier} (Base ₹{BASE_BET})</span>
                </div>
                <div style={{ height: 1, background: "#1e2433", margin: "8px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#888", fontSize: 13 }}>Possible Win</span>
                  <span style={{ color: "#27ae60", fontWeight: 800, fontFamily: "monospace", fontSize: 16 }}>
                    ₹{(betAmount + getProfit()).toLocaleString("en-IN")}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#888", fontSize: 12 }}>Net Profit</span>
                  <span style={{ color: "#f1c40f", fontWeight: 700, fontFamily: "monospace" }}>
                    +₹{getProfit().toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div style={{
                background: "rgba(33,150,243,0.08)", border: "1px solid rgba(33,150,243,0.2)",
                borderRadius: 8, padding: "8px 12px", marginBottom: 16, fontSize: 12, color: "#888"
              }}>
                {modalType === "number"
                  ? "🎯 Number bet payout: 9× (net profit: 8×)"
                  : "🎯 Color/Size bet payout: 2× (net profit: 1×)"}
              </div>

              <button onClick={confirmBet} disabled={loading || balance < betAmount}
                style={{
                  width: "100%", padding: "15px",
                  background: balance < betAmount ? "#333" : "linear-gradient(135deg, #27ae60, #2ecc71)",
                  border: "none", borderRadius: 12, color: "#fff",
                  fontWeight: 800, fontSize: 17, transition: "all 0.2s",
                  opacity: balance < betAmount ? 0.5 : 1
                }}>
                {loading ? "Placing..." : balance < betAmount ? "Insufficient Balance" : `✅ Confirm ₹${betAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>

      {/* BOTTOM NAV */}
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

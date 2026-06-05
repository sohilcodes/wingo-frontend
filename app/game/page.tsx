"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "https://wingo-backend-gtqa.onrender.com";
const ROUND_TIME = 60;

// Color logic: 0=violet+red, 5=violet+green, even=red, odd=green
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
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [period, setPeriod] = useState("");
  const [gameMode, setGameMode] = useState<"1min" | "3min" | "5min">("1min");

  // Selection state
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null); // big/small

  // Bet modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"color" | "number" | "size">("color");
  const [modalValue, setModalValue] = useState<any>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [isRandom, setIsRandom] = useState(false);
  const [loading, setLoading] = useState(false);

  // History
  const [history, setHistory] = useState<any[]>([]);

  const offsetRef = useRef(0);

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

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/game/status`);
      if (res.data?.lastRound) {
        setHistory([res.data.lastRound]);
      }
    } catch {}
    // mock history
    setHistory([
      { period_id: "20250605001", color: "green",  result: 7 },
      { period_id: "20250605002", color: "red",    result: 2 },
      { period_id: "20250605003", color: "violet", result: 0 },
      { period_id: "20250605004", color: "green",  result: 3 },
      { period_id: "20250605005", color: "red",    result: 6 },
      { period_id: "20250605006", color: "green",  result: 9 },
      { period_id: "20250605007", color: "red",    result: 4 },
      { period_id: "20250605008", color: "violet", result: 5 },
    ]);
  };

  // Open modal
  const openBet = (type: "color" | "number" | "size", value: any) => {
    if (timeLeft < 5) return alert("⏳ Betting closed! Wait for next round.");
    setModalType(type);
    setModalValue(value);
    setMultiplier(1);
    setIsRandom(false);
    setShowModal(true);
  };

  const betAmount = BASE_BET * multiplier;
  // Profit: color=2x, number=9x, size=2x (minus original bet = net profit)
  const getProfit = () => {
    if (modalType === "number") return betAmount * 9 - betAmount; // 9x payout, so profit = 8x
    return betAmount * 2 - betAmount; // 2x payout, profit = 1x
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
  const roundSecs = gameMode === "1min" ? 60 : gameMode === "3min" ? 180 : 300;

  const modalColorMap: any = {
    green:  { bg: "#27ae60", text: "#fff" },
    violet: { bg: "#9b59b6", text: "#fff" },
    red:    { bg: "#e74c3c", text: "#fff" },
    big:    { bg: "#f39c12", text: "#fff" },
    small:  { bg: "#3498db", text: "#fff" },
  };
  const mc = modalType === "number"
    ? numColor(modalValue)
    : { bg: modalColorMap[modalValue]?.bg || "#333", border: "transparent" };

  return (
    <div style={{ minHeight: "100vh", background: "#0e1117", paddingBottom: 80, fontFamily: "'Rajdhani', sans-serif" }}>

      {/* ── TOP TABS ── */}
      <div style={{ background: "#161b27", padding: "10px 12px 0", display: "flex", gap: 8 }}>
        {(["30sec","1min","3min","5min"] as const).map((m, i) => {
          const active = (m === "1min" && gameMode === "1min") || (m === "3min" && gameMode === "3min") || (m === "5min" && gameMode === "5min");
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

      {/* ── TIMER CARD ── */}
      <div style={{
        background: "linear-gradient(135deg, #1a8fd1, #2196F3)",
        padding: "14px 16px", margin: "0", position: "relative", overflow: "hidden"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Left: how to play + history */}
          <div style={{ flex: 1 }}>
            <button style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 20, padding: "5px 12px", color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 8
            }}>📋 How to play</button>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 700, marginBottom: 6 }}>
              WinGo {gameMode === "1min" ? "1 Min" : gameMode === "3min" ? "3 Min" : "5 Min"}
            </div>
            {/* History dots */}
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

          {/* Divider */}
          <div style={{ width: 1, height: 80, background: "rgba(255,255,255,0.2)", margin: "0 16px" }} />

          {/* Right: timer */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>Time remaining</div>
            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", alignItems: "center" }}>
              {["0","0",":","5","5"].map((d, i) => (
                d === ":" ? (
                  <span key={i} style={{ color: "#fff", fontSize: 32, fontWeight: 900, lineHeight: 1 }}>:</span>
                ) : (
                  <div key={i} style={{
                    width: 36, height: 44, background: "rgba(255,255,255,0.15)",
                    borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 28, fontWeight: 900, border: "1px solid rgba(255,255,255,0.2)"
                  }}>
                    {i === 0 ? String(Math.floor(timeLeft / 60)).padStart(2,"0")[0]
                     : i === 1 ? String(Math.floor(timeLeft / 60)).padStart(2,"0")[1]
                     : i === 3 ? String(timeLeft % 60).padStart(2,"0")[0]
                     : String(timeLeft % 60).padStart(2,"0")[1]}
                  </div>
                )
              ))}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 6, fontFamily: "monospace" }}>
              {period}
            </div>
          </div>
        </div>

        {/* Timer bar */}
        <div style={{ height: 3, background: "rgba(255,255,255,0.2)", borderRadius: 2, marginTop: 10, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${timerPct}%`,
            background: timeLeft <= 10 ? "#ff4757" : "#fff",
            borderRadius: 2, transition: "width 1s linear"
          }} />
        </div>
      </div>

      <div style={{ padding: "12px 12px 0", maxWidth: 500, margin: "0 auto" }}>

        {/* ── COLOR BUTTONS ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[
            { val: "green",  label: "Green",  bg: "#27ae60" },
            { val: "violet", label: "Violet", bg: "#9b59b6" },
            { val: "red",    label: "Red",    bg: "#e74c3c" },
          ].map(c => (
            <button key={c.val} onClick={() => openBet("color", c.val)}
              style={{
                flex: 1, padding: "14px 8px", borderRadius: 10,
                background: c.bg, color: "#fff",
                border: "none", fontWeight: 800, fontSize: 16,
                boxShadow: `0 4px 12px ${c.bg}66`, transition: "transform 0.1s"
              }}
              onMouseDown={e => (e.currentTarget.style.transform = "scale(0.96)")}
              onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}>
              {c.label}
            </button>
          ))}
        </div>

        {/* ── NUMBER BALLS ── */}
        <div style={{
          background: "#161b27", borderRadius: 14, padding: "14px 10px", marginBottom: 12,
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8
        }}>
          {[0,1,2,3,4,5,6,7,8,9].map(n => {
            const nc = numColor(n);
            return (
              <button key={n} onClick={() => openBet("number", n)}
                style={{
                  width: "100%", aspectRatio: "1",
                  borderRadius: "50%", background: nc.bg,
                  border: `3px solid rgba(255,255,255,0.2)`,
                  color: "#fff", fontWeight: 900, fontSize: 22,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 3px 10px rgba(0,0,0,0.4)",
                  transition: "transform 0.1s"
                }}
                onMouseDown={e => (e.currentTarget.style.transform = "scale(0.9)")}
                onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}>
                {n}
              </button>
            );
          })}
        </div>

        {/* ── MULTIPLIER ROW ── */}
        <div style={{
          background: "#161b27", borderRadius: 12, padding: "10px 12px",
          display: "flex", gap: 6, alignItems: "center", marginBottom: 12, flexWrap: "wrap"
        }}>
          <button onClick={() => openBet("color", ["green","violet","red"][Math.floor(Math.random()*3)])}
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

        {/* ── BIG / SMALL ── */}
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

        {/* ── HISTORY TABLE ── */}
        <div style={{ background: "#161b27", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e2433", fontWeight: 700, color: "#fff", fontSize: 14 }}>
            📋 Game History
          </div>
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
                        background: histColorDot[h.color] + "22",
                        color: histColorDot[h.color], textTransform: "capitalize"
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
        </div>
      </div>

      {/* ── BET MODAL ── */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          zIndex: 200
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{
            background: "#161b27", borderRadius: "20px 20px 0 0",
            width: "100%", maxWidth: 500, padding: "0 0 32px",
            animation: "slideUp 0.25s ease"
          }}>
            {/* Modal header */}
            <div style={{
              background: typeof mc.bg === "string" && mc.bg.startsWith("linear") ? mc.bg : mc.bg,
              borderRadius: "20px 20px 0 0", padding: "16px 20px",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, textTransform: "capitalize" }}>
                {modalType === "number" ? `Number ${modalValue}` : modalType === "size" ? String(modalValue).toUpperCase() : String(modalValue).toUpperCase()}
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: "50%", fontSize: 16, fontWeight: 700 }}>✕</button>
            </div>

            <div style={{ padding: "16px 20px" }}>
              {/* Balance display */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ color: "#888", fontSize: 13 }}>Balance</span>
                <span style={{ color: "#f1c40f", fontWeight: 700, fontFamily: "monospace" }}>₹{balance.toLocaleString("en-IN")}</span>
              </div>

              {/* Multiplier selector */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Select Multiplier</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {MULTIPLIERS.map(m => (
                    <button key={m} onClick={() => setMultiplier(m)}
                      style={{
                        flex: 1, padding: "10px 4px", borderRadius: 8, fontWeight: 700, fontSize: 14,
                        background: multiplier === m ? "#2196F3" : "#1e2433",
                        color: multiplier === m ? "#fff" : "#666",
                        border: `1px solid ${multiplier === m ? "

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "https://wingo-backend-gtqa.onrender.com";

export default function AviatorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);

  // Game state
  const [status, setStatus] = useState<"waiting" | "flying" | "crashed">("waiting");
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [countdown, setCountdown] = useState(5);

  // Bet state
  const [betAmount, setBetAmount] = useState(100);
  const [autoCashout, setAutoCashout] = useState<string>("");
  const [activeBet, setActiveBet] = useState<any>(null);
  const [betPlaced, setBetPlaced] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [winAmount, setWinAmount] = useState<number | null>(null);

  const intervalRef = useRef<any>(null);
  const multiplierRef = useRef(1.00);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<any>(null);
  const planeYRef = useRef(0.8);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) { router.push("/"); return; }
    const parsed = JSON.parse(u);
    setUser(parsed);
    setBalance(parsed.balance ?? 0);
    fetchCurrentRound();
    fetchHistory();
  }, []);

  const fetchCurrentRound = async () => {
    try {
      const res = await axios.get(`${API}/api/aviator/current`);
      if (res.data?.round) {
        setCurrentRound(res.data.round);
        if (res.data.round.status === "flying") {
          setStatus("flying");
        }
      } else {
        startWaiting();
      }
    } catch {
      startWaiting();
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/aviator/history`);
      if (res.data?.rounds) {
        setHistory(res.data.rounds.map((r: any) => r.crash_point));
      }
    } catch {}
  };

  const startWaiting = () => {
    setStatus("waiting");
    setMultiplier(1.00);
    multiplierRef.current = 1.00;
    setBetPlaced(false);
    setCashedOut(false);
    setWinAmount(null);
    setCountdown(5);

    let c = 5;
    const ct = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(ct);
        startFlying();
      }
    }, 1000);
  };

  const startFlying = () => {
    setStatus("flying");
    multiplierRef.current = 1.00;
    setMultiplier(1.00);

    // Random crash between 1.1x and 20x (weighted towards lower)
    const crash = parseFloat((Math.random() < 0.5
      ? (1 + Math.random() * 2)
      : Math.random() < 0.8
        ? (1 + Math.random() * 5)
        : (1 + Math.random() * 19)
    ).toFixed(2));
    setCrashPoint(crash);

    intervalRef.current = setInterval(() => {
      const current = multiplierRef.current;
      const increment = current < 2 ? 0.01 : current < 5 ? 0.02 : current < 10 ? 0.05 : 0.1;
      const next = parseFloat((current + increment).toFixed(2));
      multiplierRef.current = next;
      setMultiplier(next);

      // Auto cashout check
      if (autoCashout && parseFloat(autoCashout) > 0 && next >= parseFloat(autoCashout)) {
        if (activeBet && !cashedOut) {
          handleCashout(next);
        }
      }

      if (next >= crash) {
        clearInterval(intervalRef.current);
        doCrash(crash);
      }
    }, 100);
  };

  const doCrash = (crash: number) => {
    setStatus("crashed");
    setCrashPoint(crash);
    setHistory(prev => [crash, ...prev].slice(0, 20));

    if (activeBet && !cashedOut) {
      setActiveBet(null);
    }

    setTimeout(() => {
      startWaiting();
    }, 3000);
  };

  const handlePlaceBet = async () => {
    if (status !== "waiting") return alert("Wait for next round!");
    if (betAmount < 10 || betAmount > 8000) return alert("Bet must be ₹10 - ₹8000");
    if (balance < betAmount) return alert("Insufficient balance!");
    if (!currentRound?.id) return alert("Round not ready, please wait!");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API}/api/aviator/bet`, {
        userId: user?.id,
        roundId: currentRound.id,
        amount: betAmount,
        autoCashout: autoCashout ? parseFloat(autoCashout) : null,
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data?.success) {
        setActiveBet(res.data.bet);
        setBetPlaced(true);
        setBalance(prev => prev - betAmount);
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...u, balance: balance - betAmount }));
      } else {
        alert(res.data?.error || "Bet failed");
      }
    } catch {
      alert("Network error");
    }
  };

  const handleCashout = async (currentMult?: number) => {
    if (!activeBet || cashedOut) return;
    const mult = currentMult || multiplierRef.current;
    setCashedOut(true);

    try {
      const res = await axios.post(`${API}/api/aviator/cashout`, {
        betId: activeBet.id,
        userId: user?.id,
        multiplier: mult,
      });

      if (res.data?.success) {
        const won = res.data.winAmount;
        setWinAmount(won);
        setBalance(prev => prev + won);
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...u, balance: balance + won }));
        setActiveBet(null);
      }
    } catch {
      setCashedOut(false);
    }
  };

  const getMultiplierColor = () => {
    if (status === "crashed") return "#ff4757";
    if (multiplier >= 5) return "#ffd700";
    if (multiplier >= 2) return "#2ed573";
    return "#ffffff";
  };

  const getCrashBadgeColor = (val: number) => {
    if (val < 1.5) return "#ff4757";
    if (val < 3) return "#ffa502";
    if (val < 10) return "#2ed573";
    return "#ffd700";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0e1a",
      paddingBottom: 80,
      fontFamily: "'Rajdhani', sans-serif",
      color: "#fff"
    }}>

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg, #0d1117, #161b27)",
        padding: "12px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.05)"
      }}>
        <button onClick={() => router.push("/home")} style={{
          background: "rgba(255,255,255,0.08)", border: "none", color: "#fff",
          width: 36, height: 36, borderRadius: "50%", fontSize: 18
        }}>←</button>
        <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 900, letterSpacing: 3, color: "#ff4757" }}>
          ✈️ AVIATOR
        </div>
        <div style={{
          background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)",
          borderRadius: 20, padding: "4px 12px", fontSize: 13, fontWeight: 700, color: "#ffd700"
        }}>₹{balance.toLocaleString("en-IN")}</div>
      </div>

      {/* CRASH HISTORY */}
      <div style={{
        background: "#0d1117", padding: "8px 12px",
        display: "flex", gap: 6, overflowX: "auto",
        borderBottom: "1px solid rgba(255,255,255,0.05)"
      }}>
        {history.slice(0, 12).map((h, i) => (
          <div key={i} style={{
            flexShrink: 0, padding: "3px 8px", borderRadius: 20,
            background: getCrashBadgeColor(h) + "22",
            border: `1px solid ${getCrashBadgeColor(h)}44`,
            color: getCrashBadgeColor(h), fontSize: 11, fontWeight: 700,
            fontFamily: "monospace"
          }}>{h.toFixed(2)}x</div>
        ))}
      </div>

      {/* GAME CANVAS */}
      <div style={{
        background: "linear-gradient(180deg, #0a0e1a 0%, #0d1428 100%)",
        height: 260, position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {/* Stars background */}
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: 2, height: 2, borderRadius: "50%",
            background: "rgba(255,255,255,0.4)"
          }} />
        ))}

        {/* Grid lines */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />

        {/* Multiplier display */}
        <div style={{ textAlign: "center", zIndex: 10 }}>
          {status === "waiting" ? (
            <div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Next round in</div>
              <div style={{
                fontSize: 72, fontWeight: 900, fontFamily: "monospace",
                color: "#fff", textShadow: "0 0 40px rgba(255,255,255,0.3)"
              }}>{countdown}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Place your bets!</div>
            </div>
          ) : status === "crashed" ? (
            <div>
              <div style={{ fontSize: 16, color: "#ff4757", marginBottom: 4, fontWeight: 700 }}>FLEW AWAY!</div>
              <div style={{
                fontSize: 64, fontWeight: 900, fontFamily: "monospace",
                color: "#ff4757", textShadow: "0 0 40px rgba(255,71,87,0.5)"
              }}>{crashPoint?.toFixed(2)}x</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Current Multiplier</div>
              <div style={{
                fontSize: 72, fontWeight: 900, fontFamily: "monospace",
                color: getMultiplierColor(),
                textShadow: `0 0 40px ${getMultiplierColor()}66`,
                transition: "color 0.3s"
              }}>{multiplier.toFixed(2)}x</div>

              {/* Plane emoji */}
              <div style={{
                fontSize: 36, marginTop: 8,
                animation: "fly 0.5s ease-in-out infinite alternate"
              }}>✈️</div>
            </div>
          )}
        </div>

        {/* Win popup */}
        {cashedOut && winAmount && (
          <div style={{
            position: "absolute", top: 16, right: 16,
            background: "linear-gradient(135deg, #27ae60, #2ecc71)",
            borderRadius: 12, padding: "10px 16px",
            fontWeight: 800, fontSize: 16,
            boxShadow: "0 4px 20px rgba(39,174,96,0.5)",
            animation: "popIn 0.3s ease"
          }}>
            +₹{winAmount.toFixed(2)} 🎉
          </div>
        )}
      </div>

      {/* BET PANEL */}
      <div style={{ padding: "16px 12px", maxWidth: 500, margin: "0 auto" }}>

        {/* Quick amounts */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 12 }}>
          {[50, 100, 500, 1000].map(amt => (
            <button key={amt} onClick={() => setBetAmount(amt)}
              style={{
                padding: "8px 4px", borderRadius: 8, fontWeight: 700, fontSize: 13,
                background: betAmount === amt ? "rgba(255,71,87,0.2)" : "#161b27",
                border: `1px solid ${betAmount === amt ? "#ff4757" : "#1e2433"}`,
                color: betAmount === amt ? "#ff4757" : "#888",
                transition: "all 0.15s"
              }}>₹{amt}</button>
          ))}
        </div>

        {/* Bet amount input */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              color: "#ffd700", fontWeight: 700
            }}>₹</span>
            <input
              type="number" min={10} max={8000}
              value={betAmount}
              onChange={e => setBetAmount(Number(e.target.value))}
              style={{
                width: "100%", padding: "12px 12px 12px 28px", borderRadius: 10,
                background: "#161b27", border: "1px solid #2a3040",
                color: "#fff", fontSize: 15, fontWeight: 700, boxSizing: "border-box"
              }}
            />
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              color: "#888", fontSize: 11
            }}>AUTO</span>
            <input
              type="number" placeholder="2.00"
              value={autoCashout}
              onChange={e => setAutoCashout(e.target.value)}
              style={{
                width: "100%", padding: "12px 12px 12px 44px", borderRadius: 10,
                background: "#161b27", border: "1px solid #2a3040",
                color: "#fff", fontSize: 15, fontWeight: 700, boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        {/* Action button */}
        {status === "waiting" && !betPlaced && (
          <button onClick={handlePlaceBet}
            style={{
              width: "100%", padding: 16, borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #ff4757, #ff6b81)",
              color: "#fff", fontWeight: 800, fontSize: 18,
              boxShadow: "0 4px 20px rgba(255,71,87,0.4)",
              transition: "transform 0.1s"
            }}
            onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}>
            🎰 Place Bet ₹{betAmount}
          </button>
        )}

        {status === "waiting" && betPlaced && (
          <div style={{
            width: "100%", padding: 16, borderRadius: 12,
            background: "rgba(39,174,96,0.15)", border: "1px solid rgba(39,174,96,0.4)",
            color: "#2ed573", fontWeight: 800, fontSize: 16, textAlign: "center"
          }}>
            ✅ Bet Placed! ₹{betAmount} — Waiting for round...
          </div>
        )}

        {status === "flying" && betPlaced && !cashedOut && (
          <button onClick={() => handleCashout()}
            style={{
              width: "100%", padding: 16, borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #27ae60, #2ecc71)",
              color: "#fff", fontWeight: 800, fontSize: 18,
              boxShadow: "0 4px 20px rgba(39,174,96,0.4)",
              animation: "pulse 0.5s ease-in-out infinite alternate"
            }}>
            💰 Cash Out @ {multiplier.toFixed(2)}x = ₹{(betAmount * multiplier).toFixed(0)}
          </button>
        )}

        {status === "flying" && betPlaced && cashedOut && (
          <div style={{
            width: "100%", padding: 16, borderRadius: 12,
            background: "rgba(39,174,96,0.15)", border: "1px solid rgba(39,174,96,0.4)",
            color: "#2ed573", fontWeight: 800, fontSize: 16, textAlign: "center"
          }}>
            ✅ Cashed out! Won ₹{winAmount?.toFixed(2)}
          </div>
        )}

        {status === "flying" && !betPlaced && (
          <div style={{
            width: "100%", padding: 16, borderRadius: 12,
            background: "#161b27", border: "1px solid #2a3040",
            color: "#555", fontWeight: 700, fontSize: 15, textAlign: "center"
          }}>
            ⏳ Round in progress — bet in next round
          </div>
        )}

        {status === "crashed" && (
          <div style={{
            width: "100%", padding: 16, borderRadius: 12,
            background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)",
            color: "#ff4757", fontWeight: 700, fontSize: 15, textAlign: "center"
          }}>
            💥 Crashed at {crashPoint?.toFixed(2)}x — Next round starting...
          </div>
        )}

        {/* Info */}
        <div style={{
          marginTop: 12, background: "#161b27", borderRadius: 10,
          padding: "10px 14px", fontSize: 12, color: "#555",
          display: "flex", justifyContent: "space-between"
        }}>
          <span>Min: ₹10</span>
          <span>Max: ₹8,000</span>
          <span>Auto cashout: {autoCashout ? `${autoCashout}x` : "Off"}</span>
        </div>
      </div>

      <style>{`
        @keyframes fly {
          from { transform: translateY(0px) rotate(-10deg); }
          to { transform: translateY(-10px) rotate(10deg); }
        }
        @keyframes pulse {
          from { box-shadow: 0 4px 20px rgba(39,174,96,0.4); }
          to { box-shadow: 0 4px 40px rgba(39,174,96,0.8); }
        }
        @keyframes popIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <Link href="/home" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg><span>Home</span></Link>
        <Link href="/deposit" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7l5-5 5 5h-4v4z"/></svg><span>Deposit</span></Link>
        <Link href="/game" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5S14.67 12 15.5 12s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg><span>Game</span></Link>
        <Link href="/withdraw" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7l5-5 5 5h-4v4z" transform="rotate(180 12 12)"/></svg><span>Withdraw</span></Link>
        <Link href="/profile" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg><span>Profile</span></Link>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "https://wingo-backend-gtqa.onrender.com";
const ROUND_TIME = 60; // 1 Min Wingo Game Loop

interface HistoryRow {
  period: string;
  number: number;
  size: string;
  colors: string[];
}

export default function Game() {
  const router = useRouter();

  // Authentication & Core User States
  const [user, setUser] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [period, setPeriod] = useState("");
  const [history, setHistory] = useState<HistoryRow[]>([]);
  
  // Custom Selection Interface States
  const [selected, setSelected] = useState<string | null>(null);
  const [baseAmt, setBaseAmt] = useState<number>(1); // Base amounts: ₹1, ₹10, ₹100
  const [multiplier, setMultiplier] = useState<number>(1); // Multipliers: X1, X5, X10, X20, X50, X100
  const [loading, setLoading] = useState(false);

  // Status Animation Overlay Modals
  const [gameResult, setGameResult] = useState<"win" | "loss" | null>(null);
  const [wonAmount, setWonAmount] = useState<number>(0);

  const offsetRef = useRef(0);
  const totalBetAmount = baseAmt * multiplier;
  const expectedPayout = totalBetAmount * 1.9; // Profit payout calculation logic

  // ---------------- FETCH USER PROFILE ----------------
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      // Agar backend par customize me get user endpoint hai toh direct use karein
      const res = await axios.get(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.log("Profile refresh failed, using cache storage.");
    }
  };

  // ---------------- FETCH GAME HISTORY ----------------
  const fetchGameHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/game/history`);
      if (res.data?.history) {
        setHistory(res.data.history);
      } else if (Array.isArray(res.data)) {
        setHistory(res.data);
      }
    } catch (err) {
      console.log("Error loading game history results from backend");
    }
  };

  // ---------------- TIME SYNCHRONIZATION ----------------
  const syncTime = async () => {
    try {
      const res = await axios.get(`${API}/health`);
      const serverTime = new Date(res.data.time).getTime();
      offsetRef.current = serverTime - Date.now();
    } catch (err) {
      offsetRef.current = 0;
    }
  };

  const getPeriod = (now: number) => {
    const base = new Date(now);
    const yyyymmdd = base.toISOString().slice(0, 10).replace(/-/g, "");
    const minutes = Math.floor(now / (60 * 1000));
    return `${yyyymmdd}1000${String(minutes).slice(-4)}`;
  };

  // ---------------- INITIAL CORE INITIALIZATION ----------------
  useEffect(() => {
    const cachedUser = localStorage.getItem("user");
    if (!cachedUser) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(cachedUser));
    
    syncTime();
    fetchUserProfile();
    fetchGameHistory();
  }, []);

  // ---------------- TICK ENGINE & GAME LOOP CALCULATION ----------------
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now() + offsetRef.current;
      const seconds = Math.floor(now / 1000);
      const currentTimeLeft = ROUND_TIME - (seconds % ROUND_TIME);
      
      setTimeLeft(currentTimeLeft);
      setPeriod(getPeriod(now));

      // Trigger automatic results and animations when a new game period cycle completes (At 00:59 seconds mark)
      if (currentTimeLeft === 59) {
        fetchGameHistory();
        // Dynamic balance sync helps verify if the last placed bet resulted in a win or loss balance jump
        const previousBalance = user?.balance || 0;
        
        setTimeout(async () => {
          await fetchUserProfile();
          const freshUser = JSON.parse(localStorage.getItem("user") || "{}");
          
          if (freshUser?.balance > previousBalance) {
            setWonAmount(freshUser.balance - previousBalance);
            setGameResult("win");
          } else if (selected && freshUser?.balance <= previousBalance) {
            setGameResult("loss");
          }
          setSelected(null); // Reset choice for next interval round
        }, 1500); 
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [user, selected]);

  // ---------------- PLACE BET ACTION ----------------
  const placeBet = async () => {
    if (!selected) return alert("Please select an option to trade!");
    if (timeLeft < 5) return alert("Betting closed for this round!");
    if (user?.balance < totalBetAmount) return alert("Insufficient balance!");

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const payload = {
        userId: user?.id,
        type: isNaN(Number(selected)) ? (["big", "small"].includes(selected) ? "size" : "color") : "number",
        value: selected,
        amount: totalBetAmount,
        period_id: period,
      };

      const res = await axios.post(`${API}/api/game/bet`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success || res.status === 200) {
        // Safe immediate local calculation state update
        const updatedBalance = user.balance - totalBetAmount;
        const updatedUser = { ...user, balance: updatedBalance };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        alert("Transaction declined. Try again.");
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || "Network connection error code.");
    } finally {
      setLoading(false);
    }
  };

  const getNumberColor = (num: number) => {
    if (num === 0) return "linear-gradient(135deg, #f44336 50%, #9c27b0 50%)";
    if (num === 5) return "linear-gradient(135deg, #00b060 50%, #9c27b0 50%)";
    return [1, 3, 7, 9].includes(num) ? "#00b060" : "#f44336";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#191c24", color: "#fff", paddingBottom: 110, fontFamily: "sans-serif" }}>
      
      {/* APP TOP NAVIGATION BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", background: "#222733", borderBottom: "1px solid #2d3548" }}>
        <button onClick={() => router.push("/home")} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>←</button>
        <span style={{ fontWeight: "bold", fontSize: 16 }}>DmWin Prediction Engine</span>
        <div style={{ background: "#2e374a", padding: "6px 14px", borderRadius: 20, color: "#ffb300", fontWeight: "bold" }}>
          ₹{user?.balance?.toFixed(2) || "0.00"}
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 480, margin: "auto" }}>
        
        {/* RECENT TIMER BANNER */}
        <div style={{ background: "#222733", borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }}>
          <div>
            <div style={{ color: "#8a94a6", fontSize: 13, marginBottom: 4 }}>Period Context</div>
            <div style={{ fontSize: 16, fontWeight: "bold", letterSpacing: 0.5 }}>{period}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#8a94a6", fontSize: 13, marginBottom: 4 }}>Time Remaining</div>
            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
              <span style={{ background: "#2d3548", padding: "4px 8px", borderRadius: 4, fontSize: 18, fontWeight: "bold", color: timeLeft <= 5 ? "#f44336" : "#2aaaf3" }}>
                {String(timeLeft).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* TRADING COLORS BUTTON MATRIX */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button onClick={() => setSelected("green")} style={{ flex: 1, padding: "14px", background: "#00b060", color: "#fff", border: selected === "green" ? "3px solid #fff" : "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Green</button>
          <button onClick={() => setSelected("violet")} style={{ flex: 1, padding: "14px", background: "#9c27b0", color: "#fff", border: selected === "violet" ? "3px solid #fff" : "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Violet</button>
          <button onClick={() => setSelected("red")} style={{ flex: 1, padding: "14px", background: "#f44336", color: "#fff", border: selected === "red" ? "3px solid #fff" : "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Red</button>
        </div>

        {/* 0-9 SELECTION WHEELS */}
        <div style={{ background: "#222733", borderRadius: 12, padding: 14, marginTop: 15, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => setSelected(String(n))}
              style={{
                aspectRatio: "1",
                background: typeof getNumberColor(n) === "string" ? (getNumberColor(n) as string) : undefined,
                backgroundImage: typeof getNumberColor(n) !== "string" ? (getNumberColor(n) as string) : undefined,
                border: selected === String(n) ? "3px solid #fff" : "none",
                color: "#fff",
                fontSize: 20,
                fontWeight: "bold",
                borderRadius: "50%",
                cursor: "pointer"
              }}
            >
              {n}
            </button>
          ))}
        </div>

        {/* BASE VALUE MULTIPLIER AND CALCULATION GRID */}
        <div style={{ background: "#222733", padding: 12, borderRadius: 12, marginTop: 15 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 10, 100].map((amt) => (
                <button key={amt} onClick={() => setBaseAmt(amt)} style={{ background: baseAmt === amt ? "#ffb300" : "#2d3548", color: baseAmt === amt ? "#000" : "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}>₹{amt}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {[1, 5, 10, 20, 50, 100].map((x) => (
                <button key={x} onClick={() => setMultiplier(x)} style={{ background: multiplier === x ? "#2aaaf3" : "#191c24", color: multiplier === x ? "#fff" : "#8a94a6", border: "1px solid #2d3548", padding: "6px 10px", borderRadius: 6, fontSize: 12, fontWeight: "bold", cursor: "pointer" }}>X{x}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", background: "#191c24", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
            <div>Selected Target: <span style={{ color: "#ffb300", fontWeight: "bold", textTransform: "uppercase" }}>{selected || "None"}</span></div>
            <div>Total Bet: <span style={{ color: "#fb4e4e", fontWeight: "bold" }}>₹{totalBetAmount}</span></div>
            <div>Profit Return: <span style={{ color: "#00b060", fontWeight: "bold" }}>₹{expectedPayout.toFixed(1)}</span></div>
          </div>
        </div>

        {/* SCALE OPTIONS - BIG & SMALL */}
        <div style={{ display: "flex", gap: 12, marginTop: 15 }}>
          <button onClick={() => setSelected("big")} style={{ flex: 1, padding: "14px", background: "#ffb300", color: "#000", border: selected === "big" ? "3px solid #fff" : "none", borderRadius: "8px 0 0 8px", fontWeight: "bold", cursor: "pointer" }}>Big</button>
          <button onClick={() => setSelected("small")} style={{ flex: 1, padding: "14px", background: "#2aaaf3", color: "#fff", border: selected === "small" ? "3px solid #fff" : "none", borderRadius: "0 8px 8px 0", fontWeight: "bold", cursor: "pointer" }}>Small</button>
        </div>

        {/* TRADE CONFIRMATION CALL UP */}
        <button
          onClick={placeBet}
          disabled={loading || !selected}
          style={{
            width: "100%", marginTop: 20, padding: 15,
            background: !selected ? "#444" : "linear-gradient(90deg, #ffb300, #ff8000)",
            color: "#000", fontSize: 18, fontWeight: "bold", border: "none", borderRadius: 30,
            cursor: !selected ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Processing..." : `Confirm & Place Trade (₹${totalBetAmount})`}
        </button>

        {/* REAL DYNAMIC HISTORY COMPONENT LOGIC */}
        <div style={{ marginTop: 30, background: "#222733", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "flex", background: "#2d3548", padding: "12px 10px", borderBottom: "1px solid #3d485e" }}>
            <span style={{ flex: 2, fontSize: 13, color: "#8a94a6", fontWeight: "bold" }}>Period</span>
            <span style={{ flex: 1, fontSize: 13, color: "#8a94a6", fontWeight: "bold", textAlign: "center" }}>Number</span>
            <span style={{ flex: 1, fontSize: 13, color: "#8a94a6", fontWeight: "bold", textAlign: "center" }}>Big Small</span>
            <span style={{ flex: 1, fontSize: 13, color: "#8a94a6", fontWeight: "bold", textAlign: "center" }}>Color</span>
          </div>

          {history.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#8a94a6", fontSize: 13 }}>No game records found.</div>
          ) : (
            history.slice(0, 10).map((row, i) => (
              <div key={i} style={{ display: "flex", padding: "12px 10px", alignItems: "center", borderBottom: "1px solid #2d3548", background: i % 2 === 0 ? "#222733" : "#1e232f" }}>
                <span style={{ flex: 2, fontSize: 12, color: "#cbd5e1" }}>{row.period}</span>
                <span style={{
                  flex: 1, fontSize: 16, fontWeight: "bold", textAlign: "center", 
                  color: row.number === 0 || row.number === 5 ? "#b64eff" : [1,3,7,9].includes(row.number) ? "#00b060" : "#f44336" 
                }}>{row.number}</span>
                <span style={{ flex: 1, fontSize: 13, color: "#cbd5e1", textAlign: "center" }}>{row.size || (row.number >= 5 ? "Big" : "Small")}</span>
                <div style={{ flex: 1, display: "flex", gap: 4, justifyContent: "center" }}>
                  {row.colors?.map((color, idx) => (
                    <span key={idx} style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                  )) || <span style={{ width: 10, height: 10, borderRadius: "50%", background: [1,3,7,9].includes(row.number) ? "#00b060" : "#f44336" }} />}
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* WIN ANIMATION OVERLAY */}
      {gameResult === "win" && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
          <div style={{ background: "linear-gradient(135deg, #232936 0%, #11141c 100%)", border: "2px solid #ffb300", borderRadius: 20, padding: "30px 20px", width: "85%", maxWidth: 360, textAlign: "center", boxShadow: "0 10px 30px rgba(255,179,0,0.4)" }}>
            <h2 style={{ color: "#ffb300", fontSize: 26, margin: "0 0 10px 0" }}>🎉 Congratulations!</h2>
            <p style={{ color: "#aaa", fontSize: 14 }}>Prediction match successful.</p>
            <div style={{ fontSize: 36, fontWeight: "bold", color: "#00b060", margin: "20px 0" }}>+₹{wonAmount.toFixed(2)}</div>
            <button onClick={() => setGameResult(null)} style={{ background: "#ffb300", color: "#000", border: "none", padding: "10px 30px", borderRadius: 20, fontWeight: "bold", cursor: "pointer" }}>Awesome</button>
          </div>
        </div>
      )}

      {/* LOSS ANIMATION OVERLAY */}
      {gameResult === "loss" && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
          <div style={{ background: "linear-gradient(135deg, #232936 0%, #11141c 100%)", border: "2px solid #444", borderRadius: 20, padding: "30px 20px", width: "85%", maxWidth: 360, textAlign: "center" }}>
            <h2 style={{ color: "#f44336", fontSize: 22, margin: "0 0 10px 0" }}>Better Luck Next Time! 💔</h2>
            <p style={{ color: "#aaa", fontSize: 14 }}>Analysis did not match result outcomes.</p>
            <div style={{ fontSize: 15, color: "#8a94a6", margin: "20px 0" }}>Keep practicing strategy rules.</div>
            <button onClick={() => setGameResult(null)} style={{ background: "#444", color: "#fff", border: "none", padding: "10px 30px", borderRadius: 20, fontWeight: "bold", cursor: "pointer" }}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}

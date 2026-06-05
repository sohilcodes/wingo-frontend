"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "https://wingo-backend-gtqa.onrender.com";
const ROUND_TIME = 60; // 1 Min Game

export default function Game() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [period, setPeriod] = useState("");
  
  // Selection States
  const [selected, setSelected] = useState<string | null>(null); // color, number, or big/small
  const [baseAmt, setBaseAmt] = useState<number>(1); // 1 rupee base bet
  const [multiplier, setMultiplier] = useState<number>(1); // X1, X5, X10, etc.
  const [loading, setLoading] = useState(false);

  const offsetRef = useRef(0);

  // Total amount calculated instantly
  const totalBetAmount = baseAmt * multiplier;
  // Profit calculation (₹10 bet yields ₹19 returns -> 1.9x ratio)
  const expectedPayout = totalBetAmount * 1.9;

  // ---------------- GET SERVER TIME ----------------
  const syncTime = async () => {
    try {
      const res = await axios.get(`${API}/health`);
      const serverTime = new Date(res.data.time).getTime();
      const clientTime = Date.now();
      offsetRef.current = serverTime - clientTime;
    } catch (err) {
      console.log("Time sync failed, using local time");
      offsetRef.current = 0;
    }
  };

  // ---------------- PERIOD CALCULATION ----------------
  const getPeriod = (now: number) => {
    const base = new Date(now);
    const yyyymmdd = base.toISOString().slice(0, 10).replace(/-/g, "");
    const minutes = Math.floor(now / (60 * 1000));
    return `${yyyymmdd}1000${String(minutes).slice(-4)}`;
  };

  // ---------------- INIT ----------------
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(u));
    syncTime();
  }, []);

  // ---------------- TIMER LOOP ----------------
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now() + offsetRef.current;
      const seconds = Math.floor(now / 1000);
      const currentTimeLeft = ROUND_TIME - (seconds % ROUND_TIME);
      
      setTimeLeft(currentTimeLeft);
      setPeriod(getPeriod(now));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ---------------- PLACE BET ----------------
  const placeBet = async () => {
    if (!selected) return alert("Please select an option to trade!");
    if (timeLeft < 5) return alert("Betting closed for this round!");
    if (user?.balance < totalBetAmount) return alert("Insufficient balance!");

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const res = await axios.post(
        `${API}/api/game/bet`,
        {
          userId: user?.id,
          type: isNaN(Number(selected)) ? (["big", "small"].includes(selected) ? "size" : "color") : "number",
          value: selected,
          amount: totalBetAmount,
          period_id: period,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success || res.status === 200) {
        // Instant Live Balance Update on Success
        const updatedBalance = user.balance - totalBetAmount;
        const updatedUser = { ...user, balance: updatedBalance };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        alert(`Bet placed successfully! Amount: ₹${totalBetAmount}`);
      } else {
        alert("Failed to place bet");
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || "Network error");
    } finally {
      setLoading(false);
    }
  };

  // Colors mapping for styling numbers exactly like screenshot
  const getNumberBg = (n: number) => {
    if (n === 0) return "linear-gradient(135deg, #fb4e4e 50%, #b64eff 50%)";
    if (n === 5) return "linear-gradient(135deg, #2aaaf3 50%, #b64eff 50%)";
    if ([1, 3, 7, 9].includes(n)) return "#2aaaf3"; // Green/Blueish as per image
    return "#fb4e4e"; // Red
  };

  return (
    <div style={{ minHeight: "100vh", background: "#191c24", color: "#fff", paddingBottom: 100, fontFamily: "sans-serif" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", background: "#222733", borderBottom: "1px solid #2d3548" }}>
        <button onClick={() => router.push("/home")} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>←</button>
        <span style={{ fontWeight: "bold", fontSize: 16 }}>🎮 WinGo 1 Min</span>
        <div style={{ background: "#2e374a", padding: "6px 12px", borderRadius: 20, color: "#ffb300", fontWeight: "bold" }}>
          ₹{user?.balance?.toFixed(2) || "0.00"}
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 480, margin: "auto" }}>
        
        {/* TIMER & PERIOD CARD */}
        <div style={{ background: "#222733", borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }}>
          <div>
            <div style={{ color: "#8a94a6", fontSize: 13, marginBottom: 4 }}>Period Record</div>
            <div style={{ fontSize: 16, fontWeight: "bold", letterSpacing: 0.5 }}>{period}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#8a94a6", fontSize: 13, marginBottom: 4 }}>Time remaining</div>
            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
              <span style={{ background: "#2d3548", padding: "4px 6px", borderRadius: 4, fontSize: 18, fontWeight: "bold" }}>0</span>
              <span style={{ background: "#2d3548", padding: "4px 6px", borderRadius: 4, fontSize: 18, fontWeight: "bold" }}>0</span>
              <span style={{ color: "#2aaaf3", fontSize: 18, fontWeight: "bold" }}>:</span>
              <span style={{ background: "#2d3548", padding: "4px 6px", borderRadius: 4, fontSize: 18, fontWeight: "bold", color: timeLeft <= 5 ? "#fb4e4e" : "#2aaaf3" }}>
                {String(Math.floor(timeLeft / 10))}
              </span>
              <span style={{ background: "#2d3548", padding: "4px 6px", borderRadius: 4, fontSize: 18, fontWeight: "bold", color: timeLeft <= 5 ? "#fb4e4e" : "#2aaaf3" }}>
                {String(timeLeft % 10)}
              </span>
            </div>
          </div>
        </div>

        {/* THREE MAIN COLOR BUTTONS */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button onClick={() => setSelected("green")} style={{ flex: 1, padding: "14px", background: "#00b060", color: "#fff", border: selected === "green" ? "3px solid #fff" : "none", borderRadius: 8, fontWeight: "bold", fontSize: 16, cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.2)" }}>Green</button>
          <button onClick={() => setSelected("violet")} style={{ flex: 1, padding: "14px", background: "#9c27b0", color: "#fff", border: selected === "violet" ? "3px solid #fff" : "none", borderRadius: 8, fontWeight: "bold", fontSize: 16, cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.2)" }}>Violet</button>
          <button onClick={() => setSelected("red")} style={{ flex: 1, padding: "14px", background: "#f44336", color: "#fff", border: selected === "red" ? "3px solid #fff" : "none", borderRadius: 8, fontWeight: "bold", fontSize: 16, cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.2)" }}>Red</button>
        </div>

        {/* NUMBERS GRID (0-9) */}
        <div style={{ background: "#222733", borderRadius: 12, padding: 14, marginTop: 15, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => setSelected(String(n))}
              style={{
                aspectRatio: "1",
                background: getNumberBg(n),
                border: selected === String(n) ? "3px solid #fff" : "none",
                color: "#fff",
                fontSize: 20,
                fontWeight: "bold",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 0 -4px 4px rgba(0,0,0,0.3)"
              }}
            >
              {n}
            </button>
          ))}
        </div>

        {/* MULTIPLIER SLIDER / SELECTOR */}
        <div style={{ background: "#222733", padding: 12, borderRadius: 12, marginTop: 15 }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "space-between", marginBottom: 10 }}>
            {/* Base Rupee Selectors */}
            {/* User can select starting base: ₹1, ₹10, ₹100 */}
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 10, 100].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setBaseAmt(amt)}
                  style={{
                    background: baseAmt === amt ? "#ffb300" : "#2d3548",
                    color: baseAmt === amt ? "#000" : "#fff",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {/* Multipliers */}
            <div style={{ display: "flex", gap: 5, overflowX: "auto" }}>
              {[1, 5, 10, 20, 50, 100].map((x) => (
                <button
                  key={x}
                  onClick={() => setMultiplier(x)}
                  style={{
                    background: multiplier === x ? "#2aaaf3" : "#191c24",
                    color: multiplier === x ? "#fff" : "#8a94a6",
                    border: "1px solid #2d3548",
                    padding: "6px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  X{x}
                </button>
              ))}
            </div>
          </div>

          {/* DYNAMIC PROFIT CALCULATION BOX */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#191c24", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
            <div>
              Selected: <span style={{ color: "#ffb300", fontWeight: "bold", textTransform: "uppercase" }}>{selected || "None"}</span>
            </div>
            <div>
              Total Bet: <span style={{ color: "#fb4e4e", fontWeight: "bold" }}>₹{totalBetAmount}</span>
            </div>
            <div>
              Est. Payout: <span style={{ color: "#00b060", fontWeight: "bold" }}>₹{expectedPayout.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* BIG & SMALL BUTTONS */}
        <div style={{ display: "flex", gap: 12, marginTop: 15 }}>
          <button onClick={() => setSelected("big")} style={{ flex: 1, padding: "14px", background: "#ffb300", color: "#000", border: selected === "big" ? "3px solid #fff" : "none", borderRadius: "8px 0 0 8px", fontWeight: "bold", fontSize: 16, cursor: "pointer" }}>Big</button>
          <button onClick={() => setSelected("small")} style={{ flex: 1, padding: "14px", background: "#2aaaf3", color: "#fff", border: selected === "small" ? "3px solid #fff" : "none", borderRadius: "0 8px 8px 0", fontWeight: "bold", fontSize: 16, cursor: "pointer" }}>Small</button>
        </div>

        {/* SUBMIT ACTION BUTTON */}
        <button
          onClick={placeBet}
          disabled={loading || !selected}
          style={{
            width: "100%",
            marginTop: 20,
            padding: 15,
            background: !selected ? "#444" : "linear-gradient(90deg, #ffb300, #ff8000)",
            color: !selected ? "#aaa" : "#000",
            fontSize: 18,
            fontWeight: "bold",
            border: "none",
            borderRadius: 30,
            cursor: !selected ? "not-allowed" : "pointer",
            boxShadow: "0 5px 15px rgba(255,128,0,0.3)"
          }}
        >
          {loading ? "Processing..." : `Confirm & Place Bet (₹${totalBetAmount})`}
        </button>

      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#222733", display: "flex", justifyContent: "space-around", padding: "12px 0", borderTop: "1px solid #2d3548", zIndex: 10 }}>
        {["Home", "Deposit", "Game", "Withdraw", "Profile"].map((tab) => (
          <Link 
            key={tab} 
            href={`/${tab.toLowerCase()}`} 
            style={{ 
              color: tab === "Game" ? "#2aaaf3" : "#8a94a6", 
              textDecoration: "none", 
              fontSize: 12, 
              fontWeight: tab === "Game" ? "bold" : "normal" 
            }}
          >
            {tab}
          </Link>
        ))}
      </div>

    </div>
  );
                         }
                                                                

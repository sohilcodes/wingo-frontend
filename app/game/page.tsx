"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "https://wingo-backend-gtqa.onrender.com";
const ROUND_TIME = 60; // 60 sec game cycle

export default function Game() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [period, setPeriod] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [betAmt, setBetAmt] = useState(10);
  const [loading, setLoading] = useState(false);

  const offsetRef = useRef(0);

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

  // ---------------- PERIOD CALC ----------------
  const getPeriod = (now: number) => {
    const base = new Date(now);
    const yyyymmdd = base.toISOString().slice(0, 10).replace(/-/g, "");

    const minutes = Math.floor(now / (60 * 1000));
    return `${yyyymmdd}${String(minutes).slice(-4)}`;
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

  // ---------------- BET ----------------
  const placeBet = async () => {
    if (!selected) return alert("Please select option");
    if (timeLeft < 5) return alert("Betting closed!");

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API}/api/game/bet`,
        {
          userId: user?.id,
          type: "color",
          value: selected,
          amount: betAmt,
          period_id: period,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(res.data?.success ? `Bet placed ₹${betAmt}` : "Failed");
    } catch (err: any) {
      alert(err?.response?.data?.error || "Network error");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div style={{ minHeight: "100vh", background: "#0b0f1a", paddingBottom: 90 }}>

      {/* HEADER */}
      <div className="top-header">
        <button onClick={() => router.push("/home")}>←</button>
        <span>🎮 WinGo 1 Min</span>
        <div>₹{user?.balance || 0}</div>
      </div>

      <div style={{ padding: 16, maxWidth: 480, margin: "auto" }}>

        {/* TIMER */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div>Period</div>
            <div>{period}</div>
          </div>

          <div>
            <div>Time Left</div>
            <div style={{ fontSize: 28, color: timeLeft <= 10 ? "red" : "green" }}>
              {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
              {String(timeLeft % 60).padStart(2, "0")}
            </div>
          </div>
        </div>

        {/* COLORS */}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          {["green", "violet", "red"].map((c) => (
            <button
              key={c}
              onClick={() => setSelected(c)}
              style={{
                flex: 1,
                padding: 15,
                background: selected === c ? "#222" : "#111",
                color: c,
                border: "1px solid #333",
                borderRadius: 10,
              }}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>

        {/* NUMBERS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginTop: 15 }}>
          {[0,1,2,3,4,5,6,7,8,9].map(n => (
            <button
              key={n}
              onClick={() => setSelected(String(n))}
              style={{
                padding: 12,
                background: selected === String(n) ? "#333" : "#111",
                border: "1px solid #222",
                color: "white",
                borderRadius: 8
              }}
            >
              {n}
            </button>
          ))}
        </div>

        {/* BET */}
        <button
          onClick={placeBet}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 20,
            padding: 14,
            background: "gold",
            color: "black",
            fontWeight: 700,
            borderRadius: 10,
          }}
        >
          {loading ? "Placing..." : "Place Bet"}
        </button>
      </div>

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <Link href="/home">Home</Link>
        <Link href="/deposit">Deposit</Link>
        <Link href="/game">Game</Link>
        <Link href="/withdraw">Withdraw</Link>
        <Link href="/profile">Profile</Link>
      </div>
    </div>
  );
      }

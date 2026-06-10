"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "https://wingo-backend-gtqa.onrender.com";

function generateCrash(): number {
  const r = Math.random();
  if (r < 0.01) return 1.00;
  return Math.max(1.00, parseFloat((0.99 / (1 - r)).toFixed(2)));
}

type Phase = "waiting" | "flying" | "crashed";

export default function AviatorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [multiplier, setMultiplier] = useState(1.00);
  const [countdown, setCountdown] = useState(5);
  const [history, setHistory] = useState<number[]>([]);
  const [betAmount, setBetAmount] = useState(100);
  const [betPlaced, setBetPlaced] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [winAmount, setWinAmount] = useState<number|null>(null);
  const [betId, setBetId] = useState<string|null>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [autoCashout, setAutoCashout] = useState("2.00");

  const multiplierRef = useRef(1.00);
  const flyRef = useRef<any>(null);
  const countRef = useRef<any>(null);
  const phaseRef = useRef<Phase>("waiting");
  const betPlacedRef = useRef(false);
  const cashedOutRef = useRef(false);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) { router.push("/"); return; }
    const p = JSON.parse(u);
    setUser(p);
    setBalance(p.balance ?? 0);
    fetchHistory();
    setTimeout(() => beginWaiting(), 100);
    return () => {
      clearInterval(flyRef.current);
      clearInterval(countRef.current);
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/aviator/history`);
      if (res.data?.rounds) setHistory(res.data.rounds.map((r: any) => r.crash_point).filter(Boolean));
    } catch {}
  };

  const fetchRound = async () => {
    try {
      const res = await axios.get(`${API}/api/aviator/current`);
      if (res.data?.round) setCurrentRound(res.data.round);
    } catch {}
  };

  const beginWaiting = () => {
    clearInterval(flyRef.current);
    clearInterval(countRef.current);

    phaseRef.current = "waiting";
    betPlacedRef.current = false;
    cashedOutRef.current = false;

    setPhase("waiting");
    setMultiplier(1.00);
    multiplierRef.current = 1.00;
    setBetPlaced(false);
    setCashedOut(false);
    setWinAmount(null);
    setBetId(null);
    setCountdown(5);

    fetchRound();

    let c = 5;
    countRef.current = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(countRef.current);
        beginFlying();
      }
    }, 1000);
  };

  const beginFlying = () => {
    const crash = generateCrash();
    phaseRef.current = "flying";
    setPhase("flying");
    multiplierRef.current = 1.00;
    setMultiplier(1.00);

    const start = Date.now();
    flyRef.current = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const next = parseFloat(Math.pow(Math.E, 0.06 * elapsed).toFixed(2));
      multiplierRef.current = next;
      setMultiplier(next);

      const ac = parseFloat(autoCashout);
      if (betPlacedRef.current && !cashedOutRef.current && ac > 1 && next >= ac) {
        doCashout(next);
      }

      if (next >= crash) {
        clearInterval(flyRef.current);
        beginCrash(crash);
      }
    }, 100);
  };

  const beginCrash = (crash: number) => {
    phaseRef.current = "crashed";
    setPhase("crashed");
    setMultiplier(crash);
    setHistory(prev => [crash, ...prev].slice(0, 20));
    setTimeout(() => beginWaiting(), 3000);
  };

  const placeBet = async () => {
    if (phaseRef.current === "crashed") return alert("Wait for next round!");
    if (betPlacedRef.current) return;
    if (betAmount < 10) return alert("Min ₹10");
    if (betAmount > balance) return alert("Insufficient balance!");

    betPlacedRef.current = true;
    setBetPlaced(true);
    setBalance(b => parseFloat((b - betAmount).toFixed(2)));

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API}/api/aviator/bet`, {
        userId: user?.id, roundId: currentRound?.id || "local",
        amount: betAmount, autoCashout: parseFloat(autoCashout) > 1 ? parseFloat(autoCashout) : null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.bet?.id) setBetId(res.data.bet.id);
    } catch {}
  };

  const doCashout = async (multi?: number) => {
    const m = multi || multiplierRef.current;
    if (!betPlacedRef.current || cashedOutRef.current) return;
    if (phaseRef.current !== "flying") return;

    cashedOutRef.current = true;
    setCashedOut(true);
    const win = parseFloat((betAmount * m).toFixed(2));
    setWinAmount(win);
    setBalance(b => parseFloat((b + win).toFixed(2)));

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/api/aviator/cashout`, {
        betId, multiplier: m, userId: user?.id
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch {}
  };

  const histColor = (v: number) => v < 2 ? "#ff4757" : v < 10 ? "#ffa502" : "#2ed573";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", color: "#fff", fontFamily: "'Rajdhani',sans-serif", paddingBottom: 80 }}>
      <div style={{ background: "rgba(10,14,26,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <button onClick={() => router.push("/home")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", color: "#fff", fontSize: 18 }}>←</button>
        <span style={{ fontSize: 22, color: "#ff4757", fontStyle: "italic", fontWeight: 900 }}>✈ Aviator</span>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "5px 14px", fontSize: 14, fontWeight: 700, color: "#ffd32a" }}>₹{balance.toLocaleString("en-IN")}</div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 6, padding: "8px 12px", overflowX: "auto", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          {history.slice(0, 10).map((v, i) => (
            <span key={i} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${histColor(v)}18`, color: histColor(v), border: `1px solid ${histColor(v)}44`, whiteSpace: "nowrap", flexShrink: 0 }}>{v.toFixed(2)}x</span>
          ))}
          {history.length === 0 && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>Waiting...</span>}
        </div>

        <div style={{ position: "relative", background: "linear-gradient(180deg,#0d1220,#0a0e1a)", height: 240, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {phase === "waiting" ? (
            <>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Next round in</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 80, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{countdown}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>Place your bets!</div>
            </>
          ) : phase === "flying" ? (
            <>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>Current Multiplier</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: multiplier < 10 ? 72 : 56, fontWeight: 900, color: multiplier < 2 ? "#fff" : multiplier < 5 ? "#ffd32a" : "#2ed573", lineHeight: 1, textShadow: `0 0 40px ${multiplier < 2 ? "#fff4" : multiplier < 5 ? "#ffd32a55" : "#2ed57355"}` }}>{multiplier.toFixed(2)}x</div>
              <div style={{ marginTop: 12, fontSize: 30 }}>✈️</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, color: "#ff4757", fontWeight: 700, marginBottom: 4 }}>FLEW AWAY! 💥</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 56, fontWeight: 900, color: "#ff4757", lineHeight: 1 }}>{multiplier.toFixed(2)}x</div>
            </>
          )}
        </div>

        <div style={{ padding: "12px 16px", background: "#0d1220", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {[50, 100, 500, 1000].map(a => (
              <button key={a} onClick={() => setBetAmount(a)} disabled={betPlaced}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 700, border: `1px solid ${betAmount === a ? "#ff4757" : "rgba(255,255,255,0.08)"}`, background: betAmount === a ? "rgba(255,71,87,0.15)" : "rgba(255,255,255,0.04)", color: betAmount === a ? "#ff4757" : "rgba(255,255,255,0.5)", cursor: betPlaced ? "not-allowed" : "pointer" }}>₹{a}</button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div style={{ background: "#0a0e1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#ffd32a", fontWeight: 700 }}>₹</span>
              <input type="number" value={betAmount} disabled={betPlaced} onChange={e => setBetAmount(Number(e.target.value))}
                style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: 16, fontWeight: 700, outline: "none", fontFamily: "'Rajdhani',sans-serif" }} />
            </div>
            <div style={{ background: "#0a0e1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>AUTO</span>
              <input type="text" value={autoCashout} onChange={e => setAutoCashout(e.target.value)} disabled={betPlaced}
                style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: 16, fontWeight: 700, outline: "none", fontFamily: "'Rajdhani',sans-serif" }} />
            </div>
          </div>

          {!betPlaced ? (
            <button onClick={placeBet} disabled={phase === "crashed"}
              style={{ width: "100%", padding: "15px", borderRadius: 12, border: "none", background: phase === "crashed" ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#ff4757,#ff6b81)", color: phase === "crashed" ? "rgba(255,255,255,0.2)" : "#fff", fontWeight: 800, fontSize: 18, cursor: phase === "crashed" ? "not-allowed" : "pointer", boxShadow: phase !== "crashed" ? "0 4px 20px rgba(255,71,87,0.4)" : "none" }}>
              🎰 Place Bet ₹{betAmount}
            </button>
          ) : cashedOut ? (
            <div style={{ width: "100%", padding: "15px", borderRadius: 12, textAlign: "center", background: "rgba(39,174,96,0.1)", border: "1px solid rgba(39,174,96,0.3)", color: "#2ed573", fontWeight: 800, fontSize: 16 }}>
              ✅ Cashed out! Won ₹{winAmount?.toFixed(2)}
            </div>
          ) : (
            <button onClick={() => doCashout()} disabled={phase !== "flying"}
              style={{ width: "100%", padding: "15px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#27ae60,#2ecc71)", color: "#fff", fontWeight: 800, fontSize: 18, cursor: phase === "flying" ? "pointer" : "not-allowed", animation: phase === "flying" ? "pulse 0.6s ease infinite alternate" : "none", boxShadow: "0 4px 20px rgba(39,174,96,0.4)" }}>
              💰 Cash Out @ {multiplier.toFixed(2)}x = ₹{(betAmount * multiplier).toFixed(0)}
            </button>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
            <span>Min: ₹10</span><span>Max: ₹8,000</span><span>Auto cashout: {parseFloat(autoCashout) > 1 ? `${autoCashout}x` : "Off"}</span>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse{from{opacity:1}to{opacity:0.8}}`}</style>

      <div className="bottom-nav">
        <Link href="/home" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg><span>Home</span></Link>
        <Link href="/deposit" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7l5-5 5 5h-4v4z"/></svg><span>Deposit</span></Link>
        <Link href="/game" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5S14.67 12 15.5 12s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg><span>Game</span></Link>
        <Link href="/aviator" className="nav-item active"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg><span>Aviator</span></Link>
        <Link href="/profile" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg><span>Profile</span></Link>
      </div>
    </div>
  );
}

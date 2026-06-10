"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "https://wingo-backend-gtqa.onrender.com";

// ── Game config ────────────────────────────────────────
const WAITING_SECS = 8;   // betting phase
const TICK_MS = 100;       // multiplier update interval

function generateCrash(): number {
  const r = Math.random();
  if (r < 0.05) return 1.00;
  if (r < 0.40) return parseFloat((1 + Math.random() * 1.5).toFixed(2));
  if (r < 0.70) return parseFloat((2 + Math.random() * 3).toFixed(2));
  if (r < 0.90) return parseFloat((5 + Math.random() * 10).toFixed(2));
  return parseFloat((15 + Math.random() * 85).toFixed(2));
}

type Phase = "waiting" | "flying" | "crashed";

interface BetSlot {
  amount: number;
  placed: boolean;
  cashedOut: boolean;
  cashoutMulti: number | null;
  winAmount: number | null;
  betId: string | null;
  autoCashout: string;
  mode: "bet" | "auto";
}

const defaultSlot = (): BetSlot => ({
  amount: 100, placed: false, cashedOut: false,
  cashoutMulti: null, winAmount: null, betId: null,
  autoCashout: "", mode: "bet"
});

export default function AviatorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);

  // Game state
  const [phase, setPhase] = useState<Phase>("waiting");
  const [multiplier, setMultiplier] = useState(1.00);
  const [countdown, setCountdown] = useState(WAITING_SECS);
  const [crashPoint, setCrashPoint] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all"|"my"|"top">("all");

  // 2 bet slots
  const [slots, setSlots] = useState<[BetSlot, BetSlot]>([defaultSlot(), defaultSlot()]);

  const phaseRef = useRef<Phase>("waiting");
  const multiRef = useRef(1.00);
  const crashRef = useRef(0);
  const tickRef = useRef<any>(null);
  const countRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<any>(null);
  const planeXRef = useRef(0.1);
  const planeYRef = useRef(0.85);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) { router.push("/"); return; }
    const p = JSON.parse(u);
    setUser(p); setBalance(p.balance ?? 0);
    fetchHistory();
    startRound();
    return () => {
      clearInterval(tickRef.current);
      clearInterval(countRef.current);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ── Canvas animation ────────────────────────────────
  useEffect(() => {
    drawCanvas();
  }, [phase, multiplier]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#060d1f";
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "rgba(99,179,237,0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i < W; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
    }
    for (let i = 0; i < H; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
    }

    if (phase === "crashed") {
      // Red flash on crash
      ctx.fillStyle = "rgba(239,68,68,0.08)";
      ctx.fillRect(0, 0, W, H);

      ctx.font = "bold 22px Orbitron, monospace";
      ctx.fillStyle = "#ef4444";
      ctx.textAlign = "center";
      ctx.fillText(`FLEW AWAY @ ${crashRef.current.toFixed(2)}x`, W/2, H/2 - 20);
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillText("Next round starting...", W/2, H/2 + 16);
      return;
    }

    if (phase === "waiting") {
      ctx.font = "bold 48px Orbitron, monospace";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText(String(countdown), W/2, H/2 - 10);
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillText("PLACE YOUR BETS", W/2, H/2 + 28);

      // Plane idle
      ctx.font = "32px serif";
      ctx.fillText("✈️", W * 0.15, H * 0.82);
      return;
    }

    // Flying — draw curve
    const progress = Math.min((multiRef.current - 1) / 20, 1);
    planeXRef.current = 0.08 + progress * 0.78;
    planeYRef.current = 0.88 - progress * 0.72;

    const pts: [number,number][] = [];
    for (let t = 0; t <= progress; t += 0.01) {
      pts.push([W * (0.08 + t * 0.78), H * (0.88 - t * 0.72)]);
    }

    if (pts.length > 1) {
      const grad = ctx.createLinearGradient(pts[0][0], pts[0][1], pts[pts.length-1][0], pts[pts.length-1][1]);
      grad.addColorStop(0, "rgba(56,97,251,0.1)");
      grad.addColorStop(1, "rgba(56,97,251,0.6)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      pts.forEach(([x,y]) => ctx.lineTo(x, y));
      ctx.stroke();

      // Fill under curve
      ctx.beginPath();
      ctx.moveTo(pts[0][0], H);
      pts.forEach(([x,y]) => ctx.lineTo(x, y));
      ctx.lineTo(pts[pts.length-1][0], H);
      ctx.closePath();
      ctx.fillStyle = "rgba(56,97,251,0.06)";
      ctx.fill();
    }

    // Plane
    const px = W * planeXRef.current;
    const py = H * planeYRef.current;
    ctx.font = "28px serif";
    ctx.textAlign = "left";
    ctx.fillText("✈️", px - 14, py + 10);

    // Glow
    const grd = ctx.createRadialGradient(px, py, 0, px, py, 30);
    grd.addColorStop(0, "rgba(56,97,251,0.25)");
    grd.addColorStop(1, "transparent");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(px, py, 30, 0, Math.PI*2);
    ctx.fill();
  }, [phase, multiplier, countdown]);

  // ── Start round ────────────────────────────────────
  const startRound = useCallback(() => {
    clearInterval(tickRef.current);
    clearInterval(countRef.current);

    const crash = generateCrash();
    crashRef.current = crash;
    setCrashPoint(crash);
    phaseRef.current = "waiting";
    setPhase("waiting");
    multiRef.current = 1.00;
    setMultiplier(1.00);
    setCountdown(WAITING_SECS);
    setSlots([defaultSlot(), defaultSlot()]);

    // Fetch round from backend
    axios.get(`${API}/api/aviator/current`).then(r => {
      if (r.data?.round?.id) setRoundId(r.data.round.id);
    }).catch(() => setRoundId("local-" + Date.now()));

    // Countdown
    let c = WAITING_SECS;
    countRef.current = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(countRef.current);
        beginFly(crash);
      }
    }, 1000);
  }, []);

  const beginFly = useCallback((crash: number) => {
    phaseRef.current = "flying";
    setPhase("flying");
    multiRef.current = 1.00;
    setMultiplier(1.00);

    const start = Date.now();
    tickRef.current = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const m = parseFloat(Math.pow(Math.E, 0.07 * elapsed).toFixed(2));
      multiRef.current = m;
      setMultiplier(m);

      // Auto cashout check
      setSlots(prev => prev.map(slot => {
        if (slot.placed && !slot.cashedOut && slot.mode === "auto" &&
            slot.autoCashout && m >= parseFloat(slot.autoCashout)) {
          doCashout(slot, m);
          return { ...slot, cashedOut: true, cashoutMulti: m, winAmount: parseFloat((slot.amount * m).toFixed(2)) };
        }
        return slot;
      }) as [BetSlot, BetSlot]);

      if (m >= crash) {
        clearInterval(tickRef.current);
        doCrash(crash);
      }
    }, TICK_MS);
  }, []);

  const doCrash = useCallback((crash: number) => {
    crashRef.current = crash;
    phaseRef.current = "crashed";
    setPhase("crashed");
    setHistory(prev => [crash, ...prev].slice(0, 20));
    setMultiplier(crash);
    setTimeout(() => startRound(), 3000);
  }, [startRound]);

  // ── Bet actions ────────────────────────────────────
  const placeBet = async (idx: 0|1) => {
    const slot = slots[idx];
    if (phaseRef.current !== "waiting") return alert("Wait for next round!");
    if (slot.amount < 10) return alert("Min bet ₹10");
    if (slot.amount > balance) return alert("Insufficient balance!");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API}/api/aviator/bet`, {
        userId: user?.id, roundId: roundId || "local", amount: slot.amount,
        autoCashout: slot.autoCashout ? parseFloat(slot.autoCashout) : null,
      }, { headers: { Authorization: `Bearer ${token}` } });

      const betId = res.data?.bet?.id || "local-" + Date.now();
      const newBal = balance - slot.amount;
      setBalance(newBal);
      setUser((u: any) => ({ ...u, balance: newBal }));
      localStorage.setItem("user", JSON.stringify({ ...user, balance: newBal }));

      setSlots(prev => {
        const n = [...prev] as [BetSlot, BetSlot];
        n[idx] = { ...n[idx], placed: true, betId };
        return n;
      });
    } catch {
      // Offline mode
      const newBal = balance - slot.amount;
      setBalance(newBal);
      setSlots(prev => {
        const n = [...prev] as [BetSlot, BetSlot];
        n[idx] = { ...n[idx], placed: true, betId: "local-" + Date.now() };
        return n;
      });
    }
  };

  const doCashout = async (slot: BetSlot, m: number) => {
    if (!slot.placed || slot.cashedOut) return;
    const win = parseFloat((slot.amount * m).toFixed(2));
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/api/aviator/cashout`, {
        betId: slot.betId, multiplier: m, userId: user?.id,
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch {}
    setBalance(prev => prev + win);
    setUser((u: any) => ({ ...u, balance: (u?.balance || 0) + win }));
    localStorage.setItem("user", JSON.stringify({ ...user, balance: (user?.balance || 0) + win }));
  };

  const cashout = async (idx: 0|1) => {
    const slot = slots[idx];
    if (!slot.placed || slot.cashedOut || phaseRef.current !== "flying") return;
    const m = multiRef.current;
    const win = parseFloat((slot.amount * m).toFixed(2));
    await doCashout(slot, m);
    setSlots(prev => {
      const n = [...prev] as [BetSlot, BetSlot];
      n[idx] = { ...n[idx], cashedOut: true, cashoutMulti: m, winAmount: win };
      return n;
    });
  };

  const updateSlot = (idx: 0|1, key: keyof BetSlot, val: any) => {
    setSlots(prev => {
      const n = [...prev] as [BetSlot, BetSlot];
      n[idx] = { ...n[idx], [key]: val };
      return n;
    });
  };

  const fetchHistory = async () => {
    try {
      const r = await axios.get(`${API}/api/aviator/history`);
      if (r.data?.rounds) setHistory(r.data.rounds.map((x: any) => x.crash_point));
    } catch {}
  };

  // ── Multiplier color ───────────────────────────────
  const multiColor = multiplier < 2 ? "#fff" : multiplier < 5 ? "#4ade80" : multiplier < 10 ? "#facc15" : "#f87171";

  return (
    <div style={{ minHeight:"100vh", background:"#060d1f", paddingBottom:80, fontFamily:"'Rajdhani',sans-serif" }}>

      {/* Header */}
      <div style={{
        background:"rgba(6,13,31,0.95)", borderBottom:"1px solid rgba(255,255,255,0.06)",
        padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:50, backdropFilter:"blur(10px)"
      }}>
        <button onClick={() => router.push("/home")}
          style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"6px 12px", color:"#fff", fontSize:18 }}>
          ←
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:20 }}>✈️</span>
          <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:"#ef4444", letterSpacing:2 }}>Aviator</span>
        </div>
        <div style={{
          background:"rgba(245,197,24,0.1)", border:"1px solid rgba(245,197,24,0.3)",
          borderRadius:20, padding:"5px 14px", color:"#f5c518", fontSize:14, fontWeight:700
        }}>
          ₹{balance.toLocaleString("en-IN")}
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto" }}>

        {/* History */}
        <div style={{
          display:"flex", gap:6, padding:"8px 12px", overflowX:"auto",
          background:"rgba(255,255,255,0.02)", borderBottom:"1px solid rgba(255,255,255,0.04)"
        }}>
          {history.map((h,i) => {
            const color = h < 2 ? "#ef4444" : h < 5 ? "#3b82f6" : "#4ade80";
            return (
              <div key={i} style={{
                flexShrink:0, padding:"3px 10px", borderRadius:20,
                background:`${color}18`, border:`1px solid ${color}44`,
                fontSize:12, fontWeight:700, color, whiteSpace:"nowrap"
              }}>{h.toFixed(2)}x</div>
            );
          })}
        </div>

        {/* Canvas */}
        <div style={{ position:"relative", background:"#060d1f" }}>
          <canvas ref={canvasRef} width={480} height={240}
            style={{ width:"100%", height:"auto", display:"block" }} />

          {/* Multiplier overlay */}
          {phase === "flying" && (
            <div style={{
              position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
              textAlign:"center", pointerEvents:"none"
            }}>
              <div style={{
                fontFamily:"'Orbitron',sans-serif", fontSize:52, fontWeight:900,
                color: multiColor, textShadow:`0 0 30px ${multiColor}80`,
                transition:"color 0.3s"
              }}>
                {multiplier.toFixed(2)}x
              </div>
            </div>
          )}
        </div>

        {/* Bet panels — 2 slots */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
          {([0,1] as const).map(idx => {
            const slot = slots[idx];
            const isWaiting = phase === "waiting";
            const isFlying = phase === "flying";
            const canBet = isWaiting && !slot.placed;
            const canCashout = isFlying && slot.placed && !slot.cashedOut;

            return (
              <div key={idx} style={{
                background: idx === 0 ? "#0d1525" : "#0a1020",
                borderTop:"1px solid rgba(255,255,255,0.06)",
                borderRight: idx === 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                padding:"12px 10px"
              }}>
                {/* Tabs */}
                <div style={{ display:"flex", gap:4, marginBottom:10 }}>
                  {(["bet","auto"] as const).map(m => (
                    <button key={m} onClick={() => !slot.placed && updateSlot(idx, "mode", m)}
                      style={{
                        flex:1, padding:"5px", borderRadius:6, fontWeight:700, fontSize:12,
                        background: slot.mode===m ? "rgba(255,255,255,0.12)" : "transparent",
                        color: slot.mode===m ? "#fff" : "rgba(255,255,255,0.35)",
                        border:`1px solid ${slot.mode===m ? "rgba(255,255,255,0.2)" : "transparent"}`,
                        cursor: slot.placed ? "not-allowed" : "pointer", textTransform:"capitalize"
                      }}>
                      {m === "bet" ? "Bet" : "Auto"}
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                  background:"#060d1f", borderRadius:10, padding:"8px 10px", marginBottom:8,
                  border:"1px solid rgba(255,255,255,0.08)"
                }}>
                  <button onClick={() => updateSlot(idx, "amount", Math.max(10, slot.amount - 50))}
                    disabled={slot.placed}
                    style={{ background:"rgba(255,255,255,0.06)", border:"none", borderRadius:6, width:28, height:28, color:"#fff", fontSize:18, cursor:"pointer" }}>−</button>
                  <span style={{ fontFamily:"'Orbitron',sans-serif", fontWeight:700, color:"#fff", fontSize:16 }}>
                    {slot.amount}
                  </span>
                  <button onClick={() => updateSlot(idx, "amount", slot.amount + 50)}
                    disabled={slot.placed}
                    style={{ background:"rgba(255,255,255,0.06)", border:"none", borderRadius:6, width:28, height:28, color:"#fff", fontSize:18, cursor:"pointer" }}>+</button>
                </div>

                {/* Quick amounts */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, marginBottom:8 }}>
                  {[10,100,500,1000].map(a => (
                    <button key={a} onClick={() => !slot.placed && updateSlot(idx, "amount", a)}
                      disabled={slot.placed}
                      style={{
                        padding:"4px", borderRadius:6, fontSize:11, fontWeight:600,
                        background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                        color:"rgba(255,255,255,0.5)", cursor: slot.placed ? "not-allowed" : "pointer"
                      }}>
                      {a}
                    </button>
                  ))}
                </div>

                {/* Auto cashout input */}
                {slot.mode === "auto" && (
                  <input type="number" placeholder="Auto ×"
                    value={slot.autoCashout}
                    onChange={e => updateSlot(idx, "autoCashout", e.target.value)}
                    disabled={slot.placed}
                    style={{
                      width:"100%", padding:"7px 10px", marginBottom:8, borderRadius:8,
                      background:"#060d1f", border:"1px solid rgba(255,255,255,0.1)",
                      color:"#fff", fontSize:13, fontFamily:"'Rajdhani',sans-serif", outline:"none"
                    }} />
                )}

                {/* Action button */}
                {canBet && (
                  <button onClick={() => placeBet(idx)}
                    style={{
                      width:"100%", padding:"12px", borderRadius:10, border:"none",
                      background:"linear-gradient(135deg, #22c55e, #16a34a)",
                      color:"#fff", fontWeight:800, fontSize:15,
                      boxShadow:"0 4px 16px rgba(34,197,94,0.35)", cursor:"pointer"
                    }}>
                    BET<br/>
                    <span style={{ fontSize:12, opacity:0.9 }}>₹{slot.amount}.00 INR</span>
                  </button>
                )}

                {isWaiting && slot.placed && (
                  <div style={{
                    width:"100%", padding:"12px", borderRadius:10, textAlign:"center",
                    background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)",
                    color:"#22c55e", fontWeight:700, fontSize:13
                  }}>
                    ✅ ₹{slot.amount} placed<br/>
                    <span style={{ fontSize:11, opacity:0.7 }}>Waiting for round...</span>
                  </div>
                )}

                {canCashout && (
                  <button onClick={() => cashout(idx)}
                    style={{
                      width:"100%", padding:"12px", borderRadius:10, border:"none",
                      background:"linear-gradient(135deg, #f59f00, #e67e00)",
                      color:"#fff", fontWeight:800, fontSize:14,
                      boxShadow:"0 4px 16px rgba(245,159,0,0.4)", cursor:"pointer",
                      animation:"pulse 0.6s ease-in-out infinite alternate"
                    }}>
                    CASH OUT<br/>
                    <span style={{ fontSize:12 }}>₹{(slot.amount * multiplier).toFixed(2)}</spa

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "https://wingo-backend-gtqa.onrender.com";

function calcMultiplier(total: number, bombs: number, revealed: number): number {
  if (revealed === 0) return 1;
  let multi = 1;
  for (let i = 0; i < revealed; i++) {
    multi *= (total - bombs - i) / (total - i);
  }
  return Math.max(1.01, parseFloat((0.97 / multi).toFixed(2)));
}

const GRID_SIZES = [{ label: "3×3", value: 3 }, { label: "4×4", value: 4 }, { label: "5×5", value: 5 }];
const BET_AMOUNTS = [10, 50, 100, 500, 1000];

type CellState = "hidden" | "safe" | "mine" | "exploded";

export default function MinesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [gridSize, setGridSize] = useState(5);
  const [bombCount, setBombCount] = useState(3);
  const [betAmount, setBetAmount] = useState(50);
  const [gameActive, setGameActive] = useState(false);
  const [gameId, setGameId] = useState<string|null>(null);
  const [cells, setCells] = useState<CellState[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [profit, setProfit] = useState(0);
  const [result, setResult] = useState<"win"|"lose"|null>(null);
  const [loading, setLoading] = useState(false);
  const [minePositions, setMinePositions] = useState<number[]>([]);

  const totalCells = gridSize * gridSize;

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) { router.push("/"); return; }
    const p = JSON.parse(u);
    setUser(p);
    setBalance(p.balance ?? 0);
  }, []);

  useEffect(() => {
    if (!gameActive) setCells(new Array(totalCells).fill("hidden"));
  }, [gridSize, gameActive]);

  const startGame = async () => {
    if (betAmount < 10) return alert("Min bet ₹10");
    if (betAmount > balance) return alert("Insufficient balance!");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API}/api/mines/start`, {
        userId: user?.id || JSON.parse(localStorage.getItem('user')||'{}').id, betAmount, bombs: bombCount, gridSize
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data?.success) {
        setBalance(b => b - betAmount);
        setGameId(res.data.gameId);
        setGameActive(true);
        setCells(new Array(totalCells).fill("hidden"));
        setRevealed(0);
        setMultiplier(1);
        setProfit(0);
        setResult(null);
        setMinePositions([]);
      } else {
        alert(res.data?.error || "Failed to start");
      }
    } catch {
      // Dev mode — local game
      const bombs: number[] = [];
      const avail = Array.from({ length: totalCells }, (_, i) => i);
      for (let i = 0; i < bombCount; i++) {
        const idx = Math.floor(Math.random() * avail.length);
        bombs.push(avail.splice(idx, 1)[0]);
      }
      setMinePositions(bombs);
      setBalance(b => b - betAmount);
      setGameId("local-" + Date.now());
      setGameActive(true);
      setCells(new Array(totalCells).fill("hidden"));
      setRevealed(0);
      setMultiplier(1);
      setProfit(0);
      setResult(null);
    } finally { setLoading(false); }
  };

  const revealCell = async (index: number) => {
    if (!gameActive || cells[index] !== "hidden" || result) return;

    const isMine = minePositions.includes(index);

    if (isMine) {
      const newCells = [...cells];
      newCells[index] = "exploded";
      minePositions.forEach(m => { if (newCells[m] === "hidden") newCells[m] = "mine"; });
      setCells(newCells);
      setGameActive(false);
      setResult("lose");
      setMultiplier(0);
      setProfit(-betAmount);
      return;
    }

    const newRevealed = revealed + 1;
    const newCells = [...cells];
    newCells[index] = "safe";
    setCells(newCells);
    setRevealed(newRevealed);

    const multi = calcMultiplier(totalCells, bombCount, newRevealed);
    setMultiplier(multi);
    setProfit(parseFloat((betAmount * multi - betAmount).toFixed(2)));

    if (newRevealed === totalCells - bombCount) {
      setTimeout(() => cashout(), 300);
      return;
    }

    if (gameId && !gameId.startsWith("local-")) {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.post(`${API}/api/mines/reveal`, {
          gameId, cellIndex: index, userId: user?.id
        }, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data?.multiplier) setMultiplier(res.data.multiplier);
      } catch {}
    }
  };

  const cashout = async () => {
    if (!gameActive || revealed === 0) return;
    const winAmount = parseFloat((betAmount * multiplier).toFixed(2));
    setBalance(b => parseFloat((b + winAmount).toFixed(2)));
    setGameActive(false);
    setResult("win");
    setProfit(parseFloat((winAmount - betAmount).toFixed(2)));

    setCells(prev => {
      const n = [...prev];
      minePositions.forEach(m => { if (n[m] === "hidden") n[m] = "mine"; });
      return n;
    });

    if (gameId && !gameId.startsWith("local-")) {
      try {
        const token = localStorage.getItem("token");
        await axios.post(`${API}/api/mines/cashout`, { gameId, userId: user?.id },
          { headers: { Authorization: `Bearer ${token}` } });
      } catch {}
    }
  };

  const resetGame = () => {
    setCells(new Array(totalCells).fill("hidden"));
    setMinePositions([]);
    setRevealed(0);
    setMultiplier(1);
    setProfit(0);
    setResult(null);
    setGameId(null);
    setGameActive(false);
  };

  const renderCell = (index: number) => {
    const state = cells[index];
    const size = gridSize === 3 ? 80 : gridSize === 4 ? 70 : 58;

    const base: React.CSSProperties = {
      width: size, height: size, borderRadius: 12,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: gridSize === 3 ? 30 : gridSize === 4 ? 26 : 22,
      cursor: gameActive && state === "hidden" ? "pointer" : "default",
      transition: "all 0.15s", userSelect: "none", border: "none",
    };

    if (state === "hidden") return (
      <button key={index} onClick={() => revealCell(index)} style={{
        ...base,
        background: gameActive ? "linear-gradient(145deg,#1e2d4d,#162040)" : "#131a2e",
        boxShadow: gameActive ? "0 2px 8px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
      }}>
        {gameActive && <div style={{ width: "35%", height: "35%", borderRadius: "50%", background: "rgba(99,179,237,0.15)", border: "1px solid rgba(99,179,237,0.2)" }} />}
      </button>
    );

    if (state === "safe") return (
      <div key={index} style={{ ...base, background: "linear-gradient(145deg,#1a4731,#0f3320)", border: "1px solid rgba(72,199,142,0.4)", boxShadow: "0 0 12px rgba(72,199,142,0.2)", animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>💎</div>
    );

    if (state === "mine") return (
      <div key={index} style={{ ...base, background: "linear-gradient(145deg,#3d1a1a,#2a0f0f)", border: "1px solid rgba(239,68,68,0.2)" }}>💣</div>
    );

    if (state === "exploded") return (
      <div key={index} style={{ ...base, background: "linear-gradient(145deg,#7b1a1a,#4a0f0f)", border: "1px solid rgba(239,68,68,0.6)", boxShadow: "0 0 20px rgba(239,68,68,0.4)", animation: "explode 0.4s ease" }}>💥</div>
    );
  };

  const nextMulti = calcMultiplier(totalCells, bombCount, (gameActive ? revealed : 0) + 1);

  return (
    <div style={{ minHeight: "100vh", background: "#080d1a", paddingBottom: 90, fontFamily: "'Rajdhani',sans-serif" }}>
      <div style={{
        background: "rgba(8,13,26,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50
      }}>
        <button onClick={() => router.push("/home")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", color: "#fff", fontSize: 18 }}>←</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>💣</span>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>MINES</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "5px 12px", color: "#f5c518", fontSize: 14, fontWeight: 700 }}>
          ₹{balance.toLocaleString("en-IN")}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
        {/* Grid */}
        <div style={{ background: "linear-gradient(145deg,#0d1525,#0a1020)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 16, marginBottom: 14 }}>
          <div style={{ textAlign: "center", minHeight: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            {result === "win" ? (
              <div style={{ animation: "fadeUp 0.3s ease" }}>
                <div style={{ fontSize: 13, color: "#48c78e", fontWeight: 600, marginBottom: 2 }}>🎉 YOU WON!</div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 900, color: "#48c78e" }}>+₹{profit.toFixed(2)}</div>
              </div>
            ) : result === "lose" ? (
              <div style={{ animation: "fadeUp 0.3s ease" }}>
                <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, marginBottom: 2 }}>💥 BOOM!</div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 900, color: "#ef4444" }}>-₹{betAmount}</div>
              </div>
            ) : gameActive ? (
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>MULTIPLIER</div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 34, fontWeight: 900, color: revealed > 0 ? "#48c78e" : "rgba(255,255,255,0.3)" }}>{multiplier.toFixed(2)}×</div>
                {revealed > 0 && <div style={{ fontSize: 12, color: "#48c78e" }}>Cash out: ₹{(betAmount * multiplier).toFixed(2)}</div>}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>Configure & start below</div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridSize},1fr)`, gap: gridSize === 3 ? 10 : gridSize === 4 ? 8 : 6 }}>
            {Array.from({ length: totalCells }, (_, i) => renderCell(i))}
          </div>

          {gameActive && revealed > 0 && !result && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>
                <span>Safe: {revealed}</span><span>Left: {totalCells - bombCount - revealed}</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, width: `${(revealed/(totalCells-bombCount))*100}%`, background: "linear-gradient(90deg,#3861fb,#48c78e)", transition: "width 0.3s" }} />
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ background: "linear-gradient(145deg,#0d1525,#0a1020)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 16, marginBottom: 14 }}>
          {/* Grid size */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Grid Size</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {GRID_SIZES.map(g => (
                <button key={g.value} disabled={gameActive} onClick={() => setGridSize(g.value)}
                  style={{ padding: "10px", borderRadius: 10, fontWeight: 700, fontSize: 15, border: `1px solid ${gridSize===g.value?"rgba(56,97,251,0.6)":"rgba(255,255,255,0.08)"}`, background: gridSize===g.value?"rgba(56,97,251,0.15)":"rgba(255,255,255,0.03)", color: gridSize===g.value?"#7aa2ff":"rgba(255,255,255,0.4)", opacity: gameActive?0.4:1, cursor: gameActive?"not-allowed":"pointer" }}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bombs */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5 }}>Mines</div>
              <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 700 }}>{bombCount} 💣</div>
            </div>
            <input type="range" min={1} max={totalCells-1} value={bombCount} disabled={gameActive}
              onChange={e => setBombCount(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#ef4444", cursor: gameActive?"not-allowed":"pointer" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>
              <span>Low risk</span><span>High risk</span>
            </div>
          </div>

          {/* Next multi preview */}
          <div style={{ background: "rgba(56,97,251,0.08)", border: "1px solid rgba(56,97,251,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[1,2,3].map(s => (
              <div key={s} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>+{s} tile{s>1?"s":""}</div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700, color: "#7aa2ff" }}>{calcMultiplier(totalCells, bombCount, (gameActive?revealed:0)+s).toFixed(2)}×</div>
              </div>
            ))}
          </div>

          {/* Bet amount */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Bet Amount</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {BET_AMOUNTS.map(a => (
                <button key={a} disabled={gameActive} onClick={() => setBetAmount(a)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontWeight: 700, fontSize: 12, border: `1px solid ${betAmount===a?"rgba(56,97,251,0.5)":"rgba(255,255,255,0.08)"}`, background: betAmount===a?"rgba(56,97,251,0.15)":"rgba(255,255,255,0.03)", color: betAmount===a?"#7aa2ff":"rgba(255,255,255,0.5)", opacity: gameActive?0.4:1, cursor: gameActive?"not-allowed":"pointer" }}>
                  ₹{a}
                </button>
              ))}
            </div>
          </div>

          {/* Action */}
          {!gameActive ? (
            <button onClick={startGame} disabled={loading}
              style={{ width: "100%", padding: "15px", borderRadius: 12, border: "none", background: loading?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#3861fb,#2040d0)", color: loading?"rgba(255,255,255,0.3)":"#fff", fontWeight: 800, fontSize: 17, cursor: loading?"not-allowed":"pointer", boxShadow: loading?"none":"0 4px 20px rgba(56,97,251,0.4)" }}>
              {loading?"Starting...":"💣 Start Game — ₹"+betAmount}
            </button>
          ) : (
            <button onClick={cashout} disabled={revealed===0||!!result}
              style={{ width: "100%", padding: "15px", borderRadius: 12, border: "none", background: revealed===0?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#48c78e,#2da870)", color: revealed===0?"rgba(255,255,255,0.3)":"#fff", fontWeight: 800, fontSize: 16, cursor: revealed===0?"not-allowed":"pointer", boxShadow: revealed>0?"0 4px 20px rgba(72,199,142,0.35)":"none" }}>
              {revealed===0?"Pick a tile first":`💰 Cash Out ₹${(betAmount*multiplier).toFixed(2)}`}
            </button>
          )}

          {result && (
            <button onClick={resetGame} style={{ width: "100%", marginTop: 10, padding: "12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              ↺ Play Again
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes popIn { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes explode { 0%{transform:scale(1)} 30%{transform:scale(1.3)} 60%{transform:scale(0.9)} 100%{transform:scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        input[type=range]{-webkit-appearance:none;height:4px;background:rgba(255,255,255,0.1);border-radius:2px}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px rgba(239,68,68,0.5)}
      `}</style>

      <div className="bottom-nav">
        <Link href="/home" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg><span>Home</span></Link>
        <Link href="/game" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5S14.67 12 15.5 12s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg><span>Game</span></Link>
        <Link href="/aviator" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg><span>Aviator</span></Link>
        <Link href="/mines" className="nav-item active"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2V8h2v9z"/></svg><span>Mines</span></Link>
        <Link href="/profile" className="nav-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg><span>Profile</span></Link>
      </div>
    </div>
  );
    }

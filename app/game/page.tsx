"use client";

import { useEffect, useState } from "react";

export default function Game() {
  const [time, setTime] = useState(60);
  const [period, setPeriod] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) return 60;
        return prev - 1;
      });
    }, 1000);

    // period id generate
    const p = new Date().toISOString().slice(0, 10).replace(/-/g, "") + "001";
    setPeriod(p);

    return () => clearInterval(id);
  }, []);

  const colors = ["Green", "Red", "Violet"];
  const numbers = [0,1,2,3,4,5,6,7,8,9];

  return (
    <div className="min-h-screen bg-black text-white p-4">

      <h1 className="text-xl font-bold">🎮 Wingo Game</h1>

      <div className="mt-4 bg-gray-900 p-3 rounded">
        <p>📅 Period: {period}</p>
        <p className={time <= 10 ? "text-red-500 text-2xl" : "text-green-400 text-2xl"}>
          ⏳ {time}s
        </p>
      </div>

      {/* COLORS */}
      <h2 className="mt-5 font-bold">🎨 Colors</h2>
      <div className="flex gap-2 mt-2">
        {colors.map((c) => (
          <button key={c} className="bg-blue-600 px-3 py-2 rounded">
            {c}
          </button>
        ))}
      </div>

      {/* NUMBERS */}
      <h2 className="mt-5 font-bold">🔢 Numbers</h2>
      <div className="grid grid-cols-5 gap-2 mt-2">
        {numbers.map((n) => (
          <button key={n} className="bg-gray-700 p-2 rounded">
            {n}
          </button>
        ))}
      </div>

      <div className="mt-6 text-gray-400">
        💡 Betting system coming next...
      </div>

    </div>
  );
}

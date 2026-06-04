"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [period, setPeriod] = useState("");
  const [time, setTime] = useState(60);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));

    loadPeriod();

    const interval = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          loadPeriod();
          return 60;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadPeriod = async () => {
    try {
      const res = await axios.get(
        `${API}/api/game/current-period`
      );
      setPeriod(res.data.period);
    } catch (err) {
      console.log(err);
    }
  };

  const placeBet = async (value: string) => {
    await axios.post(`${API}/api/game/bet`, {
      userId: user.id,
      type: "color",
      value,
      amount: 10,
      period_id: period,
    });

    alert("Bet Placed");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🎮 Wingo Game</h1>

      <div>
        <p>Period: {period}</p>
        <p>Time Left: {time}s</p>
        <p>Balance: ₹{user?.balance}</p>
      </div>

      <hr />

      <h3>Place Bet</h3>

      <button onClick={() => placeBet("red")}>🔴 Red</button>
      <button onClick={() => placeBet("green")}>🟢 Green</button>
      <button onClick={() => placeBet("violet")}>🟣 Violet</button>
    </div>
  );
}

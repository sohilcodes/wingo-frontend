"use client";

import Link from "next/link";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = "https://wingo-backend-gtqa.onrender.com";

export default function RegisterPage() {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (!mobile || !password || !confirmPassword) {
      return alert("Please fill all fields");
    }

    if (password !== confirmPassword) {
      return alert("Passwords do not match");
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${API}/api/auth/register`,
        { mobile, password }
      );

      if (res.data?.success) {
        alert("Register Success");
        router.push("/");
      } else {
        alert(res.data?.error || "Register Failed");
      }

    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Network Error";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-yellow-600">
        <button>←</button>
        <h1 className="text-2xl font-bold text-yellow-500">
          WINGO ROYAL
        </h1>
        <button>EN</button>
      </div>

      <div className="flex-1 p-6">
        <h2 className="text-3xl font-bold mb-6">Register</h2>

        <input
          type="text"
          placeholder="Phone Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className="w-full p-4 rounded-xl bg-zinc-900 border border-yellow-600 mb-4"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 rounded-xl bg-zinc-900 border border-yellow-600 mb-4"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-4 rounded-xl bg-zinc-900 border border-yellow-600 mb-4"
        />

        <button
          onClick={register}
          disabled={loading}
          className="w-full p-4 rounded-xl bg-yellow-500 text-black font-bold disabled:opacity-50"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <Link href="/">
          <button className="w-full p-4 rounded-xl border border-yellow-500 mt-4">
            Already have an account? Login
          </button>
        </Link>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      const res = await axios.post(
        `${API}/api/auth/login`,
        {
          mobile,
          password,
        }
      );

      localStorage.setItem(
        "token",
        res.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      alert("Login Success");

      router.push("/home");
    } catch (err: any) {
      alert(
        err?.response?.data?.error ||
          "Login Failed"
      );
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
        <h2 className="text-3xl font-bold mb-2">
          Log In
        </h2>

        <p className="text-gray-400 mb-8">
          Login with your phone number
        </p>

        <input
          type="text"
          placeholder="Phone Number"
          value={mobile}
          onChange={(e) =>
            setMobile(e.target.value)
          }
          className="w-full p-4 rounded-xl bg-zinc-900 border border-yellow-600 mb-4"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full p-4 rounded-xl bg-zinc-900 border border-yellow-600 mb-4"
        />

        <button
          onClick={login}
          className="w-full p-4 rounded-xl bg-yellow-500 text-black font-bold"
        >
          Login
        </button>

        <Link href="/register">
          <button className="w-full p-4 rounded-xl border border-yellow-500 mt-4">
            Register
          </button>
        </Link>
      </div>
    </div>
  );
}

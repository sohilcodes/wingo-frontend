"use client";

import Link from "next/link";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function RegisterPage() {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const register = async () => {
    if (password !== confirmPassword) {
      return alert(
        "Passwords do not match"
      );
    }

    try {
      await axios.post(
        `${API}/api/auth/register`,
        {
          mobile,
          password,
        }
      );

      alert("Register Success");

      router.push("/");
    } catch (err: any) {
      alert(
        err?.response?.data?.error ||
          "Register Failed"
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
          Register
        </h2>

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

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(
              e.target.value
            )
          }
          className="w-full p-4 rounded-xl bg-zinc-900 border border-yellow-600 mb-4"
        />

        <button
          onClick={register}
          className="w-full p-4 rounded-xl bg-yellow-500 text-black font-bold"
        >
          Register
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

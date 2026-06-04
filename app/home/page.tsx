"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="p-5 border-b border-yellow-600">
        <h1 className="text-3xl font-bold text-yellow-500">
          WINGO ROYAL
        </h1>
        <p className="text-gray-400">
          Welcome Back
        </p>
      </div>

      {/* Balance Card */}
      <div className="p-5">
        <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
          <p className="text-gray-400">
            Available Balance
          </p>

          <h2 className="text-4xl font-bold text-yellow-400 mt-2">
            ₹0
          </h2>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 px-5">
        <Link href="/deposit">
          <div className="bg-zinc-900 border border-yellow-500 rounded-xl p-5 text-center">
            💰
            <p className="mt-2">Deposit</p>
          </div>
        </Link>

        <Link href="/withdraw">
          <div className="bg-zinc-900 border border-yellow-500 rounded-xl p-5 text-center">
            💸
            <p className="mt-2">Withdraw</p>
          </div>
        </Link>

        <Link href="/game">
          <div className="bg-zinc-900 border border-yellow-500 rounded-xl p-5 text-center">
            🎮
            <p className="mt-2">Game</p>
          </div>
        </Link>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-yellow-600 flex justify-around p-4">
        <Link href="/home">🏠</Link>
        <Link href="/deposit">💰</Link>
        <Link href="/withdraw">💸</Link>
        <Link href="/game">🎮</Link>
      </div>
    </div>
  );
}

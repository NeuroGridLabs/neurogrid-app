import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

/** Top earner row for Node Onboarding panel */
export interface TopEarnerRow {
  name: string
  runtime: string
  unitPrice: string
  totalRevenue: string
}

/**
 * Returns top earning nodes from backend for guest view.
 * Set TOP_EARNERS_API_URL to your backend that returns { topEarners: TopEarnerRow[] }.
 * If unset, returns empty array.
 */
export async function GET() {
  const apiUrl =
    process.env.TOP_EARNERS_API_URL ?? process.env.NODES_API_URL
  if (!apiUrl) {
    return NextResponse.json({ topEarners: [] })
  }
  try {
    const base = apiUrl.replace(/\/?$/, "")
    const res = await fetch(`${base}/top-earners`, { cache: "no-store" })
    if (!res.ok) return NextResponse.json({ topEarners: [] })
    const data = (await res.json()) as { topEarners?: TopEarnerRow[] }
    const topEarners = Array.isArray(data.topEarners) ? data.topEarners : []
    return NextResponse.json({ topEarners })
  } catch {
    return NextResponse.json({ topEarners: [] })
  }
}

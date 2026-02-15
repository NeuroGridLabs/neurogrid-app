import { fetchTreasuryData } from "@/lib/treasury-api"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET() {
  try {
    const data = await fetchTreasuryData()
    return NextResponse.json(data)
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Treasury API] Unexpected error:", e instanceof Error ? e.message : "Unknown")
    }
    return NextResponse.json(
      { error: "Treasury fetch failed" },
      { status: 500 }
    )
  }
}

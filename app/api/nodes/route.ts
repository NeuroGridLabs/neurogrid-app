import { NextResponse } from "next/server"
import type { Node } from "@/lib/types/node"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * Returns list of rentable nodes from backend.
 * Set NEXT_PUBLIC_NODES_API_URL or NODES_API_URL to your Supabase/Postgres-backed endpoint
 * that returns { nodes: Node[] }. If unset, returns empty array.
 */
export async function GET() {
  const apiUrl =
    process.env.NODES_API_URL ?? process.env.NEXT_PUBLIC_NODES_API_URL
  if (!apiUrl) {
    return NextResponse.json({ nodes: [] })
  }
  try {
    const res = await fetch(apiUrl, {
      next: { revalidate: 0 },
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) {
      console.error("[Nodes API] upstream error", res.status, await res.text())
      return NextResponse.json({ nodes: [] })
    }
    const data = (await res.json()) as { nodes?: Node[] }
    const nodes = Array.isArray(data.nodes) ? data.nodes : []
    return NextResponse.json({ nodes })
  } catch (e) {
    console.error("[Nodes API]", e)
    return NextResponse.json({ nodes: [] })
  }
}

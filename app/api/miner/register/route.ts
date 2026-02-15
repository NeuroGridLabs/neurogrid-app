import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Request body: miner registration (sent after wallet connect + form submit).
 * Backend MUST: 1) Validate wallet 2) Create pending node 3) Check physical link / FRP
 * Only after FRP is established should the node appear in GET /api/nodes with status ACTIVE.
 */
export interface MinerRegisterBody {
  walletAddress: string
  pricePerHour?: string
  bandwidth?: string
  gpuModel?: string
  vram?: string
  gateway?: string
}

/**
 * Stub: returns PENDING_VERIFICATION and instructions.
 * Replace with real backend that:
 * 1. Persists pending node (DB)
 * 2. Generates FRP config / token for this miner
 * 3. Verifies physical connectivity (e.g. ping, port check) and FRP client handshake
 * 4. Only when FRP is established, marks node as verified and includes it in GET /api/nodes with status ACTIVE
 */
export async function POST(request: NextRequest) {
  let body: MinerRegisterBody
  try {
    body = (await request.json()) as MinerRegisterBody
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    )
  }
  const { walletAddress } = body
  if (!walletAddress || typeof walletAddress !== "string") {
    return NextResponse.json(
      { error: "walletAddress is required" },
      { status: 400 }
    )
  }

  // Stub: generate a deterministic nodeId for demo (real backend allocates from pool)
  const nodeId = "alpha-01"

  return NextResponse.json(
    {
      nodeId,
      status: "PENDING_VERIFICATION",
      message:
        "Node created. Connect your FRP client to complete verification. The node will appear in Node Command Center (ACTIVE) only after the backend confirms physical link and FRP handshake.",
      frpConfigInstructions:
        "1) Download FRP client from the link below. 2) Use the config token provided by the backend. 3) Run frpc; the backend will detect the connection and mark this node as verified.",
    },
    { status: 201 }
  )
}

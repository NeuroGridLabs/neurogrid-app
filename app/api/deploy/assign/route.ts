import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/** Request body after successful USDT split payment */
interface AssignBody {
  nodeId: string
  renterWalletAddress: string
  transactionSignature: string
}

/**
 * After frontend confirms the USDT split tx on Solana, backend verifies the transaction
 * and assigns FRP port / SSH key to the renter, then returns gateway and port.
 * Replace this stub with your real verification + assignment (e.g. Supabase, internal service).
 */
export async function POST(request: NextRequest) {
  let body: AssignBody
  try {
    body = (await request.json()) as AssignBody
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    )
  }
  const { nodeId, renterWalletAddress, transactionSignature } = body
  if (
    !nodeId ||
    typeof nodeId !== "string" ||
    !renterWalletAddress ||
    typeof renterWalletAddress !== "string" ||
    !transactionSignature ||
    typeof transactionSignature !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing nodeId, renterWalletAddress, or transactionSignature" },
      { status: 400 }
    )
  }

  // TODO: Verify transactionSignature on-chain (confirm correct USDT split to miner 95% + treasury 5%)
  // TODO: Assign FRP port and SSH key; persist rental in DB
  // Stub: return deterministic gateway/port for the given nodeId
  const gateway = process.env.DEPLOY_GATEWAY_TEMPLATE
    ? process.env.DEPLOY_GATEWAY_TEMPLATE.replace("{nodeId}", nodeId.replace(/-/g, ""))
    : `${nodeId.replace(/-/g, "")}.ngrid.xyz`
  const port = process.env.DEPLOY_PORT
    ? parseInt(process.env.DEPLOY_PORT, 10)
    : nodeId.charCodeAt(nodeId.length - 1) % 2 === 0
      ? 443
      : 7890

  return NextResponse.json({
    gateway,
    port: Number.isFinite(port) ? port : 443,
  })
}

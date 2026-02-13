"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"

interface WalletContextValue {
  isConnected: boolean
  address: string | null
  openConnectModal: () => void
  openAccountModal: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const [accountModalOpen, setAccountModalOpen] = useState(false)

  const openConnectModal = useCallback(() => setConnectModalOpen(true), [])
  const openAccountModal = useCallback(() => setAccountModalOpen(true), [])

  const handleConnect = useCallback(() => {
    setAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f5b291")
    setConnectModalOpen(false)
  }, [])

  const handleDisconnect = useCallback(() => {
    setAddress(null)
    setAccountModalOpen(false)
  }, [])

  return (
    <WalletContext.Provider
      value={{
        isConnected: !!address,
        address,
        openConnectModal,
        openAccountModal,
      }}
    >
      {children}

      {/* Connect Modal */}
      {connectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
          onClick={() => setConnectModalOpen(false)}
        >
          <div
            className="border border-border p-6"
            style={{
              backgroundColor: "var(--terminal-bg)",
              maxWidth: 360,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider" style={{ color: "#00FF41" }}>
              Connect Wallet
            </h3>
            <p className="mb-4 text-xs" style={{ color: "rgba(0,255,65,0.6)" }}>
              Connect your wallet to access Miner and Nodes features.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConnect}
                className="flex-1 border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:opacity-90"
                style={{ borderColor: "#00FF41", color: "#00FF41" }}
              >
                MetaMask (Demo)
              </button>
              <button
                type="button"
                onClick={() => setConnectModalOpen(false)}
                className="px-4 py-2 text-xs uppercase tracking-wider"
                style={{ color: "rgba(0,255,65,0.5)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Modal */}
      {accountModalOpen && address && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
          onClick={() => setAccountModalOpen(false)}
        >
          <div
            className="border border-border p-6"
            style={{
              backgroundColor: "var(--terminal-bg)",
              maxWidth: 360,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider" style={{ color: "#00FF41" }}>
              Account
            </h3>
            <p className="mb-2 font-mono text-xs" style={{ color: "#00FF41" }}>
              {address}
            </p>
            <button
              type="button"
              onClick={handleDisconnect}
              className="mt-4 border px-4 py-2 text-xs uppercase tracking-wider transition-colors hover:opacity-90"
              style={{ borderColor: "#ff4444", color: "#ff4444" }}
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error("useWallet must be used within WalletProvider")
  return ctx
}

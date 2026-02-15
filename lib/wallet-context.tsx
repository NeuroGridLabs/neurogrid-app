"use client"

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react"
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"

interface WalletContextValue {
  isConnected: boolean
  address: string | null
  openConnectModal: () => void
  openAccountModal: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

/** Must be used inside Solana WalletProvider + WalletModalProvider (e.g. SolanaProviders). */
export function WalletProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useSolanaWallet()
  const { setVisible } = useWalletModal()

  const value = useMemo<WalletContextValue>(
    () => ({
      isConnected: !!publicKey,
      address: publicKey?.toBase58() ?? null,
      openConnectModal: () => setVisible(true),
      openAccountModal: () => setVisible(true),
    }),
    [publicKey, setVisible]
  )

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error("useWallet must be used within WalletProvider")
  return ctx
}

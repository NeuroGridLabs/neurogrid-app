import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'

import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { SolanaProviders } from '@/lib/solana-providers'
import { WalletProvider } from '@/lib/wallet-context'
import { MinerRegistryProvider } from '@/lib/miner-registry-context'
import './globals.css'

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'NeuroGrid Protocol | The Liquidity Layer for AI Compute',
  description:
    'Decentralized GPU computing exchange powered by FRP tunneling and Proof-of-Inference. Community-driven, anti-VC, fair launch.',
  keywords: ['GPU', 'decentralized', 'computing', 'AI', 'blockchain', 'PoI', 'RTX4090'],
  icons: {
    icon: '/images/neurogrid-logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#00FF41',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistMono.variable} ${inter.variable} font-mono antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark">
          <SolanaProviders>
            <WalletProvider>
              <MinerRegistryProvider>
                <TooltipProvider delayDuration={200}>
                  {children}
                  <Toaster richColors position="top-center" />
                </TooltipProvider>
              </MinerRegistryProvider>
            </WalletProvider>
          </SolanaProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'

import { TooltipProvider } from '@/components/ui/tooltip'
import { WalletProvider } from '@/lib/wallet-context'
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
  keywords: ['GPU', 'decentralized', 'computing', 'AI', 'blockchain', 'PoI', 'RTX 4090'],
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
        <WalletProvider>
          <TooltipProvider delayDuration={200}>
            {children}
          </TooltipProvider>
        </WalletProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PromptMind - Prompt Stock Market',
  description: 'Buy, sell, and breed prompts as tokenized assets. Monetize your AI prompts on Arbitrum blockchain.',
  keywords: ['prompts', 'AI', 'tokenization', 'blockchain', 'Arbitrum', 'Web3'],
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    title: 'PromptMind',
    description: 'The first prompt stock market powered by Claude AI',
    type: 'website',
    url: 'https://promptmind.app',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {children}
        </div>
      </body>
    </html>
  )
}

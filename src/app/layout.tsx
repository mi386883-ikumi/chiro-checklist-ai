import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '問診チェックリストAI | 整体院サポートツール',
  description: '患者の問診票データからAIが施術前チェックリストとアドバイスを自動生成します。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}

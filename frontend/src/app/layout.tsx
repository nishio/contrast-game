import { Providers } from './providers'
import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Contrast Game',
  description: 'A board game where tile colors determine movement rules',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

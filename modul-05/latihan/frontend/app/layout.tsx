import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ClientProvider } from '@/components/client-provider'
import { ToastProvider } from '@/components/custom-toast'
import './globals.css'
import Link from 'next/link'
import CustomConnectButton from '@/components/custom-connect-button'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'PBALend',
  description: 'Pelita Bangsa Academy Lending',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ClientProvider>
          <ToastProvider>
            <div className="min-h-screen bg-background flex flex-col">
              {/* Header */}
              <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                      <Image src="/logo.png" alt="PBALend" width={32} height={32} />
                    </div>
                    <Link href="/" className="text-xl font-bold text-foreground">
                      PBALend
                    </Link>
                  </div>

                  <nav className="hidden md:flex items-center space-x-6">
                    <Link href="/#pools" className="text-muted-foreground hover:text-primary transition-colors">
                      Pools
                    </Link>
                    <Link href="/positions" className="text-muted-foreground hover:text-primary transition-colors">
                      Positions
                    </Link>
                  </nav>
                  <CustomConnectButton />
                </div>
              </header>

              {/* Content - This will grow to fill available space */}
              <main className="flex-1">
                {children}
              </main>

              {/* Footer - This will stick to the bottom */}
              <footer className="px-4 border-t border-border mt-auto">
                <div className="container mx-auto text-center py-4">
                  <p className="text-muted-foreground">© 2025 Pelita Bangsa Academy</p>
                </div>
              </footer>
            </div>
          </ToastProvider>
        </ClientProvider>
      </body>
    </html>
  )
}

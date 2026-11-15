import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Ignis Atelier — Microgravity Fire Experiment Lab",
  description: "See what real ISS flame experiments measured, and exactly where the evidence stops.",
  icons: {
    icon: "/icon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen bg-[#040206] text-slate-100 antialiased selection:bg-orange-500 selection:text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}

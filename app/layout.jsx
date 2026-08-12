import './globals.css';
import { ToastProvider } from './ToastProvider';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata = {
  title: 'Klasik Wardrobe | Zero Flow',
  description: "Klasik Wardrobe is Nigeria's premier luxury streetwear brand, offering premium 240-300 GSM organic cotton and silk-blend heavyweight t-shirts.",
}

import { Footer } from '../frontend/components/Footer';

import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Syne:wght@400..800&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <ToastProvider />
        <div id="root">
          {children}
          <Footer />
        </div>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}

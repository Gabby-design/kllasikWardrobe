import '../src/index.css';
import { ToastProvider } from './ToastProvider';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Footer } from '../src/components/Footer';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'Kllasik Wardrobe | Heavyweight Luxury Streetwear Essentials',
  description: "Nigeria's premier luxury streetwear house by Kllasik Wardrobe. Crafted from 240–300 GSM organic cotton and mulberry silk essentials.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body suppressHydrationWarning className="bg-[#F7F7F8] text-[#111111] font-sans antialiased">
        <ToastProvider />
        <div id="root" className="min-h-screen flex flex-col">
          {children}
          <Footer />
        </div>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

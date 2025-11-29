import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inconsolata } from "next/font/google";
import "./globals.css";

const inconsolata = Inconsolata({
  variable: "--font-inconsolata",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.lassor.com'),
  title: { default: 'Lassor Feasley', template: '%s · Lassor Feasley' },
  description: 'Portfolio of Lassor Feasley: interaction, UX and industrial design, and writing.',
  icons: {
    icon: '/favicon-32x32.png',
    shortcut: '/favicon-32x32.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Lassor Feasley',
    title: 'Lassor Feasley',
    description: 'Portfolio of Lassor Feasley',
    images: [{ url: '/og.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lassor Feasley',
    description: 'Portfolio of Lassor Feasley',
    images: ['/og.jpg'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="w-mod-js">
      <head>
        {/* Font Awesome Free CSS to render icon glyphs used in Webflow HTML */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body
        className={`${inconsolata.variable} antialiased body`}
      >
        {/* Scatter + window state primitives */}
        <Script src="/js/retro-window-state.js?v=1" strategy="afterInteractive" />
        <Script src="/js/retro-scatter-engine.js?v=1" strategy="afterInteractive" />
        {/* Core effects - critical functionality */}
        <Script src="/js/core-effects.js?v=2" strategy="afterInteractive" />
        {/* Visual effects - ensure it runs reliably */}
        <Script src="/js/visual-effects.js?v=2" strategy="afterInteractive" />
        {/* Guard for layout width early in head/body to prevent width jump */}
        <style
          // Using a plain style tag because this is a Server Component
          dangerouslySetInnerHTML={{
            __html:
              '.globalmargin{max-width:1500px!important;margin:0 auto!important;padding:40px 40px 80px!important;} body{overflow-x:hidden;}',
          }}
        />
        {children}
      </body>
    </html>
  );
}

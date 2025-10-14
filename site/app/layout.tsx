import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Montserrat, Inconsolata } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const inconsolata = Inconsolata({
  variable: "--font-inconsolata",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.lassor.com'),
  title: { default: 'Lassor Feasley', template: '%s · Lassor Feasley' },
  description: 'Portfolio of Lassor Feasley: interaction, UX and industrial design, and writing.',
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
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
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
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${inconsolata.variable} antialiased body`}
      >
        {/* Guard for layout width early in head/body to prevent width jump */}
        <style
          // Using a plain style tag because this is a Server Component
          dangerouslySetInnerHTML={{
            __html:
              '.globalmargin{max-width:1500px!important;margin:0 auto!important;padding:40px 40px 80px!important;}',
          }}
        />
        {children}
      </body>
    </html>
  );
}

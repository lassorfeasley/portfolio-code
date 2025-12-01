import type { Metadata, Viewport } from 'next';
import { Inconsolata } from 'next/font/google';
import './globals.css';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Font Awesome CDN for icons */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" 
          integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
      </head>
      <body className={`${inconsolata.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

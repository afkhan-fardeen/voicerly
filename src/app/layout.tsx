// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WebVitalsTracker } from "@/components/WebVitals";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap'
});

export const metadata: Metadata = {
  title: "Voicerly - Online Voice Recorder & Audio Sharing Tool",
  description: "Voicerly is the ultimate free online voice recorder. Record voice memos, upload audio files, and generate shareable links instantly. Perfect for podcasts, notes, and quick shares. Mobile-friendly, secure, and easy to use.",
  keywords: "online voice recorder, free audio recorder, share voice notes, upload audio online, voice memo app, browser voice recording, shareable audio links",
  openGraph: {
    title: "Voicerly - Record & Share Audio Effortlessly",
    description: "Discover Voicerly, the modern web app for recording and uploading voice with instant shareable links. No downloads required.",
    images: ["/og-image.png"], // Add an OG image in /public if available
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        {/* Script to set initial theme and prevent flicker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const savedTheme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const theme = savedTheme || (prefersDark ? 'dark' : 'light');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
        <ErrorBoundary>
          <Navigation />
          <main className="min-h-screen bg-white dark:bg-black">
            {children}
          </main>
          <Footer />
        </ErrorBoundary>
        <WebVitalsTracker />
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="bg-white/50 dark:bg-black/50 backdrop-blur-md py-6 border-t border-gray-200/50 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">&copy; {new Date().getFullYear()} Voicerly. All rights reserved.</p>
        <ul className="flex justify-center space-x-4 mt-2">
          <li><a href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-[var(--color-primary)] dark:hover:text-orange-400 transition">Privacy Policy</a></li>
          <li><a href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-[var(--color-primary)] dark:hover:text-orange-400 transition">Terms of Service</a></li>
          <li><a href="/about" className="text-gray-600 dark:text-gray-400 hover:text-[var(--color-primary)] dark:hover:text-orange-400 transition">About Us</a></li>
        </ul>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">The best online voice recorder for seamless audio sharing and collaboration.</p>
      </div>
    </footer>
  );
}
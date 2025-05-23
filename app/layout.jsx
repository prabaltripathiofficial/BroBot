// app/layout.jsx

import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { AppContextProvider } from '@/context/AppContext';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* any <meta> tags, title, etc. */}
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ClerkProvider>
          <AppContextProvider>
            {children}
          </AppContextProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

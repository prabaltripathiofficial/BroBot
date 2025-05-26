// app/layout.jsx
import { Inter } from 'next/font/google';
import './globals.css';
import './prism.css'
import { ClerkProvider } from '@clerk/nextjs';
import { AppContextProvider } from '@/context/AppContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>{/* meta tags, title, etc. */}</head>
      <body className={`${inter.variable} antialiased`}>
        <ClerkProvider>
          <AppContextProvider>
            {/* Toaster is self-closing */}
            <Toaster
              toastOptions={{
                success: { style: { background: 'black', color: 'white' } },
                error: { style: { background: 'black', color: 'white' } },
              }}
            />
            {/* Your page UI now mounts here */}
            {children}
          </AppContextProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

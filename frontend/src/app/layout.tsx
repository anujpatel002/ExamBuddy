import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import "./styles/mobile-emergency-fix.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from "react-hot-toast";
import { generateSEOMetadata } from "@/lib/seo";
import { StructuredDataGenerator, injectStructuredData } from "@/lib/structured-data";
import { GA4_SCRIPT_SRC, GA4_MEASUREMENT_ID, GA4_ENABLED } from "@/lib/analytics";

const poppins = Poppins({ subsets: ["latin"], weight: ['400', '600', '700'] });

export const metadata: Metadata = generateSEOMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google AdSense */}
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3631212035463885"
          crossOrigin="anonymous"
        ></script>
        
        {/* Google Analytics */}
        {GA4_ENABLED && (
          <>
            <script async src={GA4_SCRIPT_SRC}></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA4_MEASUREMENT_ID}', {
                    page_title: document.title,
                    page_location: window.location.href
                  });
                `,
              }}
            />
          </>
        )}
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        
        {/* Structured Data */}
        {injectStructuredData([
          StructuredDataGenerator.website(),
          StructuredDataGenerator.organization(),
          StructuredDataGenerator.educationalOrganization(),
          StructuredDataGenerator.softwareApplication()
        ])}
      </head>
      <body className={poppins.className}>
        <ThemeProvider>
          <AuthProvider>
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  maxWidth: '90vw',
                },
                success: {
                  duration: 3000,
                },
                error: {
                  duration: 4000,
                },
              }}
              containerStyle={{
                top: 20,
              }}
            />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
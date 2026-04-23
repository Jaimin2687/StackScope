import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StackScope — AI-Powered Project Scoping",
  description:
    "Transform raw project briefs into precise technical specifications with AI. Get structured proposals, sprint timelines, tech stack recommendations, and database schemas in seconds.",
  keywords: [
    "project scoping",
    "AI",
    "technical specification",
    "sprint planning",
    "tech stack",
    "SQL schema",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to services used at startup to reduce DNS + TLS latency */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MediaController from "@/components/MediaController";
import { PlayerProvider } from "@/components/PlayerContext";
import { GoogleOAuthProvider } from '@react-oauth/google';

export const metadata: Metadata = {
  title: "Jangplen - Music Generation",
  description: "Generate stunning AI music in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased pb-28">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <PlayerProvider>
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <Navbar />
              <main>{children}</main>
            </div>
            <MediaController />
          </PlayerProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}

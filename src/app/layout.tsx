import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "KingdomSol — Build Your Empire on Solana",
  description: "A time traveller stranded in 2030 must rebuild ancient African wealth in Solana. Play cards, stake SOL, conquer your enemies.",
  keywords: ["solana", "card game", "web3", "NFT", "WHOT", "African", "blockchain game"],
  openGraph: {
    title: "KingdomSol",
    description: "Ancient wealth meets modern chain. Play & earn on Solana.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}

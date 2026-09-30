import "./globals.css";

export const metadata = {
  title: "PackPulse — AI Food Packaging Recommendation System | MoFPI",
  description:
    "AI-powered intelligent packaging recommendation platform by the Ministry of Food Processing Industries. Get optimized packaging materials, barrier specifications, cost analysis, and sustainability scores for any food commodity.",
  keywords:
    "food packaging, AI recommendation, OTR, WVTR, MAP, modified atmosphere packaging, MoFPI, SIH 2026, FSSAI, sustainable packaging",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230f0f0f'/%3E%3Ccircle cx='16' cy='16' r='9' fill='none' stroke='%23f07c12' stroke-width='2.5' stroke-dasharray='2 2.2'/%3E%3C/svg%3E" />
      </head>
      <body>{children}</body>
    </html>
  );
}

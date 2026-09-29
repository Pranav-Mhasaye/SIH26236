import "./globals.css";

export const metadata = {
  title: "PackPulse — AI Food Packaging Recommendation System | MoFPI",
  description: "Ministry of Food Processing Industries (MoFPI) Intelligent Decision Support System for Food Packaging Materials & Digital Traceability (SIH Problem Statement ID: 26236)",
  keywords: "SIH26236, MoFPI, food packaging recommendation, OTR, WVTR, MAP, biodegradable packaging, FSSAI, EPR, digital packaging passport",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

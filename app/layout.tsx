import type { Metadata } from "next";
import { EB_Garamond, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const display = EB_Garamond({ variable: "--font-garamond", subsets: ["latin"] });
const body = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Whetstone",
  description: "AI that sharpens you instead of thinking for you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

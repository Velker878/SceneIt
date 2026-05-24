import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "SceneIt — Find what to watch together",
  description:
    "For when you and your Letterboxd friends spend hours trying to find what to watch together.",
  openGraph: {
    title: "SceneIt",
    description:
      "Compare Letterboxd watchlists and find your perfect movie night film.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

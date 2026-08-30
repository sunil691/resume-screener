import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Resume Screener", description: "A focused workspace for job applications and resume review." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

import type { Metadata } from "next";
import "../styles/index.css";              // your existing CSS (keep)
import "../styles/prism-vsc-dark-plus.css"; // keep if you need the blog/prism styles

export const metadata: Metadata = {
  title: "Sentinel",
  description: "Employee activity insights",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className="!scroll-smooth" lang="en">
      {children}
    </html>
  );
}

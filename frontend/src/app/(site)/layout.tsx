// src/app/(site)/layout.tsx
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import Providers from "../providers"; // your existing one

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <body>
    <Providers>
      <div className="isolate">
        <Header />
        {children}
        <Footer />
        <ScrollToTop />
      </div>
    </Providers>
    </body>
  );
}

import "./globals.css";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Providers from "../lib/providers";
import GlobalTour from "../components/GlobalTour";

export const metadata = {
  title: "Interop Dashboard",
  description: "Blockchain interoperability control plane"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          <div className="flex min-h-screen bg-[#0F172A] text-white">
            <Sidebar />
            <div className="flex-1">
              <Header />
              <main className="p-8">{children}</main>
            </div>
          </div>
          <GlobalTour />
        </Providers>
      </body>
    </html>
  );
}

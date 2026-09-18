import "./globals.css";

import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Providers } from "@/redux/provider";
import { Toaster } from "@/components/ui/sonner";
import { NotificationListener } from "@/components/NotificationListener";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans dark:bg-gray-900">
        <ThemeProvider>
          <SidebarProvider>
            <Providers>
              {children}
              <NotificationListener />
            </Providers>
            <Toaster position="top-right" />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


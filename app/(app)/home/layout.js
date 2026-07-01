"use client";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const isFullScreen = pathname.startsWith("/home");

  if (isFullScreen) {
    // Home manages its own layout — don't wrap it
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <div className="app-content">
        {children}
      </div>
    </div>
  );
}
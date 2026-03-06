"use client";

import { useState } from "react";
import { Sidebar, useSidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { collapsed, toggle } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--night)]">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setMobileOpen(false)}
          role="button"
          tabIndex={-1}
          aria-label="Close menu"
        />
      )}
      
      <div
        className={cn(
          "fixed z-30 h-screen w-60 bg-[var(--night-light)] border-r border-[var(--border)] transition-transform duration-[var(--transition-base)] md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-center border-b border-[var(--border)]">
          <span className="text-lg font-semibold text-[var(--lavender)]">
            CrewClaw
          </span>
        </div>
      </div>

      <Header 
        collapsed={collapsed} 
        onToggleSidebar={toggle}
        onMenuClick={() => setMobileOpen(!mobileOpen)}
      />

      <main
        className="pt-14 transition-[padding-left] duration-[var(--transition-base)]"
        style={{ paddingLeft: collapsed ? "64px" : "250px" }}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

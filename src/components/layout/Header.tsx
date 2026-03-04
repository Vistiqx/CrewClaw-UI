"use client";

import { Menu } from "lucide-react";

interface HeaderProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onMenuClick?: () => void;
}

export function Header({ collapsed, onMenuClick }: HeaderProps) {
  return (
    <header className="fixed top-0 right-0 z-30 h-14 bg-[var(--night)] border-b border-[var(--border)] flex items-center px-4 transition-[left] duration-[var(--transition-base)]"
      style={{ left: collapsed ? "64px" : "240px" }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-md text-[var(--lavender-muted)] hover:bg-[var(--night-lighter)] hover:text-[var(--lavender)] transition-[background-color,color] duration-[var(--transition-base)]"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

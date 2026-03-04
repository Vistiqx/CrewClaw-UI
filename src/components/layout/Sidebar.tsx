"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Bot,
  Shield,
  Key,
  BarChart3,
  Clock,
  Activity,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Settings,
  Calendar,
  Wrench,
  Puzzle,
  Hammer,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/businesses", label: "Businesses", icon: Building2 },
  { href: "/assistants", label: "Assistants", icon: Bot },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/audit-logs", label: "Audit Logs", icon: Shield },
  { href: "/credentials", label: "Credentials", icon: Key },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/scheduler", label: "Heartbeats", icon: Clock },
  { href: "/cron-jobs", label: "CRON Jobs", icon: Calendar },
  { href: "/skills", label: "Skills", icon: Wrench },
  { href: "/plugins", label: "Plugins", icon: Puzzle },
  { href: "/tools", label: "Tools", icon: Hammer },
  { href: "/commands", label: "Commands", icon: Terminal },
  { href: "/health", label: "Health", icon: Activity },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-[var(--night-light)] border-r border-[var(--border)] transition-[width] duration-[var(--transition-base)] flex flex-col",
        collapsed ? "w-16" : "w-60",
        "hidden md:flex"
      )}
    >
      <div className="flex h-14 items-center justify-center border-b border-[var(--border)]">
        {!collapsed && (
          <span className="text-lg font-semibold text-[var(--lavender)]">
            CrewClaw
          </span>
        )}
        {collapsed && (
          <span className="text-xl font-bold text-[var(--tropical-indigo)]">
            V
          </span>
        )}
      </div>

      <div className="border-b border-[var(--border)] py-1 px-2">
        <button
          onClick={onToggle}
          className={cn(
            "flex w-full items-center justify-center rounded-md p-0.5 text-[var(--lavender-muted)] hover:bg-[var(--night-lighter)] hover:text-[var(--lavender)] transition-[background-color,color] duration-[var(--transition-base)]",
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-[background-color,color] duration-[var(--transition-base)]",
                    isActive
                      ? "bg-[var(--tropical-indigo)] text-[var(--night)]"
                      : "text-[var(--lavender-muted)] hover:bg-[var(--night-lighter)] hover:text-[var(--lavender)]",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[var(--border)] p-2">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-[background-color,color] duration-[var(--transition-base)] text-[var(--lavender-muted)] hover:bg-[var(--night-lighter)] hover:text-[var(--lavender)]",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}

export function useSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((prev) => !prev);
  return { collapsed, toggle };
}

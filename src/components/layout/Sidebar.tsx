"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  UsersRound,
  Bot,

  Calendar,
  FolderKanban,
  ListTodo,
  GitBranch,
  Workflow,
  Timer,
  CheckCircle,
  Play,
  List,
  Brain,
  Search,
  Library,
  FileText,
  Hash,
  Trash2,
  Wrench,
  Puzzle,
  Terminal,
  GraduationCap,
  Cpu,
  FileCode,
  Route,
  Activity,
  HeartPulse,
  BarChart3,
  Gauge,
  DollarSign,
  Shield,
  AlertTriangle,
  Lock,
  Key,
  Webhook,
  Plug,
  ShieldCheck,
  Settings2,
  Zap,
  MessageSquare,
  UserCheck,
  ClipboardCheck,
  Target,
  RotateCcw,
  AlertOctagon,
  Star,
  Settings,
  ToggleLeft,
  Rocket,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  id: string;
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

// Dashboard as standalone top-level item (not in a section)
const dashboardItem: NavItem = { href: "/", label: "Dashboard", icon: LayoutDashboard };

const navSections: NavSection[] = [
  {
    id: "organization",
    title: "Organization",
    icon: Building2,
    items: [
      { href: "/businesses", label: "Businesses", icon: Building2 },
      { href: "/councils", label: "Councils", icon: Users },
      { href: "/teams", label: "Teams", icon: UsersRound },
      { href: "/assistants", label: "Assistants", icon: Bot },
      { href: "/assistants-rbac", label: "Assistants RBAC", icon: Shield },
    ],
  },
  {
    id: "execution",
    title: "Execution",
    icon: Play,
    items: [
      { href: "/calendar", label: "Calendar", icon: Calendar },
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/tasks", label: "Tasks", icon: ListTodo },
      { href: "/pipelines", label: "Pipelines", icon: GitBranch },
      { href: "/workflows", label: "Workflows", icon: Workflow },
      { href: "/cron-jobs", label: "CRON Jobs", icon: Timer },
      { href: "/approvals", label: "Approvals", icon: CheckCircle },
      { href: "/agent-runs", label: "Agent Runs", icon: Play },
      { href: "/task-queue", label: "Task Queue", icon: List },
    ],
  },
  {
    id: "intelligence",
    title: "Intelligence Layer",
    icon: Brain,
    items: [
      { href: "/memory", label: "Memory", icon: Brain },
      { href: "/memory-inspector", label: "Memory Inspector", icon: Search },
      { href: "/knowledge-bases", label: "Knowledge Bases", icon: Library },
      { href: "/documents", label: "Documents", icon: FileText },
      { href: "/embeddings-overview", label: "Embeddings Overview", icon: Hash },
      { href: "/retention-policies", label: "Retention Policies", icon: Trash2 },
    ],
  },
  {
    id: "capabilities",
    title: "Capabilities & Extensions",
    icon: Wrench,
    items: [
      { href: "/tools-registry", label: "Tools Registry", icon: Wrench },
      { href: "/plugins", label: "Plugins Registry", icon: Puzzle },
      { href: "/commands", label: "Commands Registry", icon: Terminal },
      { href: "/skills", label: "Skills Registry", icon: GraduationCap },
      { href: "/model-registry", label: "Model Registry", icon: Cpu },
      { href: "/prompt-templates", label: "Prompt Templates", icon: FileCode },
      { href: "/model-routing-rules", label: "Model Routing Rules", icon: Route },
    ],
  },
  {
    id: "monitoring",
    title: "Monitoring & Observability",
    icon: Activity,
    items: [
      { href: "/scheduler", label: "Heartbeats", icon: Activity },
      { href: "/health", label: "Health", icon: HeartPulse },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/usage-metrics", label: "Usage Metrics", icon: Gauge },
      { href: "/cost-monitoring", label: "Cost Monitoring", icon: DollarSign },
      { href: "/audit-logs", label: "Audit Logs", icon: Shield },
      { href: "/error-tracking", label: "Error Tracking", icon: AlertTriangle },
    ],
  },
  {
    id: "security",
    title: "Security & Infrastructure",
    icon: Lock,
    items: [
      { href: "/secrets-vault", label: "Secrets Vault", icon: Lock },
      { href: "/api-keys", label: "API Keys", icon: Key },
      { href: "/webhooks", label: "Webhooks", icon: Webhook },
      { href: "/integrations", label: "Integrations", icon: Plug },
      { href: "/access-control", label: "Access Control", icon: ShieldCheck },
      { href: "/environment-configuration", label: "Environment Configuration", icon: Settings2 },
      { href: "/rate-limiting", label: "Rate Limiting & Circuit Breakers", icon: Zap },
    ],
  },
  {
    id: "governance",
    title: "Feedback & Governance",
    icon: MessageSquare,
    items: [
      { href: "/feedback", label: "Feedback", icon: MessageSquare },
      { href: "/human-reviews", label: "Human Reviews", icon: UserCheck },
      { href: "/evaluation-runs", label: "Evaluation Runs", icon: ClipboardCheck },
      { href: "/benchmarks", label: "Benchmarks", icon: Target },
      { href: "/regression-tests", label: "Regression Tests", icon: RotateCcw },
      { href: "/red-team-logs", label: "Red Team Logs", icon: AlertOctagon },
      { href: "/output-scoring", label: "Output Scoring", icon: Star },
    ],
  },
  {
    id: "system",
    title: "System",
    icon: Settings,
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/feature-flags", label: "Feature Flags", icon: ToggleLeft },
      { href: "/deployment-settings", label: "Deployment Settings", icon: Rocket },
      { href: "/system-versioning", label: "System Versioning", icon: GitBranch },
      { href: "/backup-recovery", label: "Backup & Recovery", icon: Database },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(() =>
    navSections.map(s => s.id)
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-[var(--night-light)] border-r border-[var(--border)] transition-[width] duration-[var(--transition-base)] flex flex-col",
        collapsed ? "w-16" : "w-[250px]",
        "hidden md:flex"
      )}
    >
      <div className="flex h-14 items-center justify-center border-b border-[var(--border)]">
        {!collapsed && (
          <span className="text-lg font-semibold text-[var(--lavender)]">
            AI Assistant Mission Control
          </span>
        )}
        {collapsed && (
          <span className="text-xl font-bold text-[var(--tropical-indigo)]">
            AI
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

      <nav className="flex-1 overflow-y-auto py-2">
        {collapsed ? (
          // Collapsed view - show dashboard first, then all items flat
          <ul className="space-y-1 px-2">
            {/* Dashboard as first item */}
            <li key={dashboardItem.href}>
              <Link
                href={dashboardItem.href}
                className={cn(
                  "flex items-center justify-center rounded-md px-2 py-2 transition-[background-color,color] duration-[var(--transition-base)]",
                  pathname === dashboardItem.href
                    ? "bg-[var(--tropical-indigo)] text-[var(--night)]"
                    : "text-[var(--lavender-muted)] hover:bg-[var(--night-lighter)] hover:text-[var(--lavender)]"
                )}
                title={dashboardItem.label}
              >
                <dashboardItem.icon className="h-5 w-5 flex-shrink-0" />
              </Link>
            </li>
            {navSections.flatMap(section => section.items).map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center rounded-md px-2 py-2 transition-[background-color,color] duration-[var(--transition-base)]",
                      isActive
                        ? "bg-[var(--tropical-indigo)] text-[var(--night)]"
                        : "text-[var(--lavender-muted)] hover:bg-[var(--night-lighter)] hover:text-[var(--lavender)]"
                    )}
                    title={item.label}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          // Expanded view - show dashboard first, then sections with collapsible headers
          <div className="space-y-1">
            {/* Dashboard as standalone top-level item */}
            <div className="px-2 pb-2 border-b border-[var(--border)]">
              <Link
                href={dashboardItem.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-[background-color,color] duration-[var(--transition-base)]",
                  pathname === dashboardItem.href
                    ? "bg-[var(--tropical-indigo)] text-[var(--night)]"
                    : "text-[var(--lavender-muted)] hover:bg-[var(--night-lighter)] hover:text-[var(--lavender)]"
                )}
              >
                <dashboardItem.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{dashboardItem.label}</span>
              </Link>
            </div>
            
            {navSections.map((section) => {
              const isExpanded = expandedSections.includes(section.id);
              const hasActiveItem = section.items.some(item => pathname === item.href);
              
              return (
                <div key={section.id} className="px-2">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-[background-color,color] duration-[var(--transition-base)]",
                      hasActiveItem
                        ? "text-[var(--tropical-indigo)]"
                        : "text-[var(--lavender-muted)] hover:text-[var(--lavender)]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <section.icon className="h-4 w-4" />
                      <span>{section.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  
                  {/* Section Items */}
                  {isExpanded && (
                    <ul className="mt-1 space-y-0.5 pl-2">
                      {section.items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-[background-color,color] duration-[var(--transition-base)]",
                                isActive
                                  ? "bg-[var(--tropical-indigo)] text-[var(--night)]"
                                  : "text-[var(--lavender-muted)] hover:bg-[var(--night-lighter)] hover:text-[var(--lavender)]"
                              )}
                            >
                              <item.icon className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </nav>
    </aside>
  );
}

export function useSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((prev) => !prev);
  return { collapsed, toggle };
}

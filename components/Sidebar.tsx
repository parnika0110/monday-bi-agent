"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  PieChart,
  Bot,
  FileSpreadsheet,
  ShieldAlert,
  Settings,
  Plus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BarChart2,
} from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { useState } from "react";

const PRIMARY_NAV = [
  { href: "/copilot", label: "AI Copilot", icon: Bot, badge: "Hero" },
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard", label: "Executive Dashboard", icon: BarChart2 },
  { href: "/analytics", label: "Analytics Charts", icon: PieChart },
  { href: "/reports", label: "Reports & Export", icon: FileSpreadsheet },
  { href: "/data-quality", label: "Data Quality", icon: ShieldAlert },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { conversations, activeId, setActiveId, createConversation, deleteConversation } = useConversations();

  function handleNewChat() {
    const id = createConversation();
    setActiveId(id);
    router.push("/copilot");
  }

  function handleSelectChat(id: string) {
    setActiveId(id);
    if (pathname !== "/copilot") {
      router.push("/copilot");
    }
  }

  return (
    <aside
      className={clsx(
        "relative hidden shrink-0 flex-col border-r border-slate-200/70 bg-white transition-all duration-300 dark:border-slate-800/70 dark:bg-[#0e131f] lg:flex",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Collapse toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-2xs hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500 dark:hover:text-slate-200"
        aria-label="Toggle sidebar"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Header / Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 font-bold text-xs text-white dark:bg-slate-100 dark:text-slate-900">
          SD
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xs font-bold text-slate-900 dark:text-white">
              Skylark BI
            </h1>
            <p className="truncate text-[10px] text-slate-400">
              Executive Platform
            </p>
          </div>
        )}
      </div>

      {/* Action: New Chat */}
      <div className="px-3 py-1.5">
        <button
          onClick={handleNewChat}
          className={clsx(
            "flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2 text-xs font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200",
            collapsed ? "px-0" : "px-3"
          )}
          title="Start new chat"
        >
          <Plus size={14} />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Primary Nav */}
      <nav className="space-y-0.5 px-2.5 py-3">
        {PRIMARY_NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                active
                  ? "bg-slate-100 font-semibold text-slate-900 dark:bg-slate-800/60 dark:text-white"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/50"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={15} className={active ? "text-slate-900 dark:text-white" : "text-slate-400"} />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="rounded-md bg-slate-200/60 px-1.5 py-0.5 text-[9px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Chat History Section */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-2.5 py-2 border-t border-slate-100 dark:border-slate-800/40">
          <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Recent Chats
          </div>

          <div className="space-y-0.5">
            {conversations.slice(0, 10).map((c) => {
              const isActive = activeId === c.id && pathname === "/copilot";
              return (
                <div
                  key={c.id}
                  className={clsx(
                    "group flex items-center justify-between rounded-lg px-2 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/50",
                    isActive && "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800/60 dark:text-white"
                  )}
                >
                  <button
                    onClick={() => handleSelectChat(c.id)}
                    className="flex flex-1 items-center gap-2 truncate text-left"
                  >
                    <MessageSquare size={13} className="shrink-0 text-slate-400" />
                    <span className="truncate">{c.title}</span>
                  </button>

                  {conversations.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(c.id);
                      }}
                      className="hidden text-slate-400 hover:text-red-500 group-hover:block"
                      title="Delete chat"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Status Card */}
      {!collapsed && (
        <div className="m-3 rounded-lg border border-slate-200/60 bg-slate-50 p-2.5 text-xs dark:border-slate-800/60 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Monday Live API</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          </div>
        </div>
      )}
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  BarChart3,
  Bot,
  FileSpreadsheet,
  ShieldAlert,
  Settings,
  Plus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  PieChart,
} from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { useState } from "react";

const PRIMARY_NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/copilot", label: "AI Copilot", icon: Bot, badge: "AI" },
  { href: "/dashboard", label: "Executive Dashboard", icon: BarChart3 },
  { href: "/analytics", label: "Charts & Analytics", icon: PieChart },
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
        "relative hidden shrink-0 flex-col border-r border-slate-200/80 bg-white/75 backdrop-blur-xl transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-950/70 lg:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Collapse toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        aria-label="Toggle sidebar"
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Header / Brand */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-brand-500/20">
          SD
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              Skylark BI
            </h1>
            <p className="truncate text-[11px] font-medium text-slate-400 dark:text-slate-500">
              AI Analytics Platform
            </p>
          </div>
        )}
      </div>

      {/* Action: New Chat */}
      <div className="px-3 py-2">
        <button
          onClick={handleNewChat}
          className={clsx(
            "group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 py-2.5 font-medium text-white shadow-sm transition-all hover:shadow-md hover:shadow-brand-500/20 active:scale-98",
            collapsed ? "px-0" : "px-3 text-xs"
          )}
          title="Start new conversation"
        >
          <Plus size={16} className="transition-transform group-hover:rotate-90" />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Primary Nav */}
      <nav className="space-y-1 px-3 py-2">
        {PRIMARY_NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all",
                active
                  ? "bg-brand-50 text-brand-600 font-semibold dark:bg-brand-950/50 dark:text-brand-400 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-900/60"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={16} className={active ? "text-brand-600 dark:text-brand-400" : "text-slate-400"} />
              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Chat History Section */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="mb-2 flex items-center justify-between px-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
            <span>Recent Chats</span>
            <Sparkles size={11} className="text-amber-500" />
          </div>

          <div className="space-y-1">
            {conversations.slice(0, 10).map((c) => {
              const isActive = activeId === c.id && pathname === "/copilot";
              return (
                <div
                  key={c.id}
                  className={clsx(
                    "group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900",
                    isActive && "bg-slate-100 font-medium text-slate-900 dark:bg-slate-900 dark:text-slate-100"
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
        <div className="m-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Live Monday API</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            Realtime Board Connection Active
          </p>
        </div>
      )}
    </aside>
  );
}

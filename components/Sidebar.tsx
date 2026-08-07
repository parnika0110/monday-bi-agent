"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  Sparkles,
  LayoutDashboard,
  PieChart,
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
  { href: "/", label: "AI Copilot", icon: Sparkles, badge: "Hero" },
  { href: "/dashboard", label: "Executive Overview", icon: BarChart2 },
  { href: "/analytics", label: "Analytics Visuals", icon: PieChart },
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
    router.push("/");
  }

  function handleSelectChat(id: string) {
    setActiveId(id);
    if (pathname !== "/" && pathname !== "/copilot") {
      router.push("/");
    }
  }

  return (
    <aside
      className={clsx(
        "relative hidden shrink-0 flex-col transition-all duration-300 lg:flex my-3 ml-3",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Floating Card Wrapper */}
      <div className="floating-sidebar flex h-full flex-col">
        {/* Collapse toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-5 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 shadow-soft hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-purple-600 font-bold text-xs text-white shadow-soft">
            <Sparkles size={16} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xs font-bold text-slate-900 dark:text-white">
                Skylark AI
              </h1>
              <p className="truncate text-[10px] text-slate-400">
                Business Intelligence
              </p>
            </div>
          )}
        </div>

        {/* Action: New Chat */}
        <div className="px-3 py-1">
          <button
            onClick={handleNewChat}
            className={clsx(
              "flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-2.5 text-xs font-medium text-white shadow-soft transition hover:bg-purple-700 active:scale-95",
              collapsed ? "px-0" : "px-3"
            )}
            title="Start new chat"
          >
            <Plus size={14} />
            {!collapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Primary Nav */}
        <nav className="space-y-1 px-3 py-3">
          {PRIMARY_NAV.map((item) => {
            const isCopilot = item.href === "/" || item.href === "/copilot";
            const active = isCopilot ? (pathname === "/" || pathname === "/copilot") : pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs transition-all duration-150",
                  active
                    ? "bg-purple-50 text-purple-900 border border-purple-100/70 font-semibold dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/50"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={15} className={active ? "text-purple-600 dark:text-purple-300" : "text-slate-400"} />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-semibold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Chat History Section */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto px-3 py-2 border-t border-slate-100 dark:border-slate-800/60">
            <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Recent Conversations
            </div>

            <div className="space-y-0.5">
              {conversations.slice(0, 10).map((c) => {
                const isActive = activeId === c.id && (pathname === "/" || pathname === "/copilot");
                return (
                  <div
                    key={c.id}
                    className={clsx(
                      "group flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/50",
                      isActive && "bg-purple-50/70 font-medium text-purple-900 dark:bg-purple-950/30 dark:text-purple-300"
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
                        className="hidden text-slate-400 hover:text-rose-500 group-hover:block"
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

        {/* Bottom Live Feed Pill */}
        {!collapsed && (
          <div className="m-3 rounded-2xl bg-purple-50/50 p-2.5 text-xs border border-purple-100/50 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-purple-900 dark:text-purple-300">Monday Live API</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

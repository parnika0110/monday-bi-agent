"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatMessage, Conversation } from "@/lib/types";

const STORAGE_KEY = "skylark-bi-conversations";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function welcomeMessage(): ChatMessage {
  return {
    id: uid(),
    role: "assistant",
    content:
      "I'm the Skylark Drones BI Copilot. I read live data from your Monday.com boards - ask me about pipeline, revenue, sectors, risks, forecasts, or request a leadership update.",
    timestamp: Date.now(),
  };
}

function newConversation(): Conversation {
  const now = Date.now();
  return {
    id: uid(),
    title: "New conversation",
    messages: [welcomeMessage()],
    createdAt: now,
    updatedAt: now,
  };
}

function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New conversation";
  const words = firstUser.content.trim().split(/\s+/).slice(0, 8).join(" ");
  return words.length < firstUser.content.length ? `${words}...` : words;
}

function loadAll(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveAll(conversations: Conversation[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    // Graceful fallback if localStorage is restricted
  }
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadAll();
    if (loaded.length === 0) {
      const first = newConversation();
      setConversations([first]);
      setActiveId(first.id);
      saveAll([first]);
    } else {
      setConversations(loaded);
      setActiveId(loaded[0].id);
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: Conversation[]) => {
    setConversations(next);
    saveAll(next);
  }, []);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const createConversation = useCallback(() => {
    const conv = newConversation();
    persist([conv, ...conversations]);
    setActiveId(conv.id);
    return conv.id;
  }, [conversations, persist]);

  const deleteConversation = useCallback(
    (id: string) => {
      const next = conversations.filter((c) => c.id !== id);
      const finalList = next.length > 0 ? next : [newConversation()];
      persist(finalList);
      if (activeId === id) {
        setActiveId(finalList[0].id);
      }
    },
    [conversations, activeId, persist]
  );

  const clearCurrentConversation = useCallback(() => {
    if (!activeId) return;
    const next = conversations.map((c) => {
      if (c.id !== activeId) return c;
      return {
        ...c,
        title: "New conversation",
        messages: [welcomeMessage()],
        updatedAt: Date.now(),
      };
    });
    persist(next);
  }, [conversations, activeId, persist]);

  const clearAllConversations = useCallback(() => {
    const conv = newConversation();
    persist([conv]);
    setActiveId(conv.id);
  }, [persist]);

  const appendMessage = useCallback(
    (conversationId: string, message: ChatMessage) => {
      const next = conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const messages = [...c.messages, message];
        return {
          ...c,
          messages,
          title: c.title === "New conversation" ? deriveTitle(messages) : c.title,
          updatedAt: Date.now(),
        };
      });
      persist(next);
    },
    [conversations, persist]
  );

  const updateMessage = useCallback(
    (conversationId: string, messageId: string, patch: Partial<ChatMessage>) => {
      const next = conversations.map((c) => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          messages: c.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
          updatedAt: Date.now(),
        };
      });
      persist(next);
    },
    [conversations, persist]
  );

  const renameConversation = useCallback(
    (conversationId: string, title: string) => {
      const next = conversations.map((c) => (c.id === conversationId ? { ...c, title } : c));
      persist(next);
    },
    [conversations, persist]
  );

  return {
    conversations,
    active,
    activeId,
    hydrated,
    setActiveId,
    createConversation,
    deleteConversation,
    clearCurrentConversation,
    clearAllConversations,
    appendMessage,
    updateMessage,
    renameConversation,
  };
}

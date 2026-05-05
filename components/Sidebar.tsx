"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Plus, Trash2, MessageSquare, LogOut,
  PanelLeftClose, PanelLeftOpen, MoreHorizontal
} from "lucide-react";

interface Chat {
  id: string;
  title: string;
  updated_at: string;
}

export default function Sidebar({ onNewChat }: { onNewChat?: () => void }) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [chats, setChats] = useState<Chat[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    const res = await fetch("/api/chats");
    const data = await res.json();
    setChats(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { fetchChats(); }, [pathname, fetchChats]);

  const deleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    await fetch("/api/chats", {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
    });
    setChats(prev => prev.filter(c => c.id !== id));
    setDeletingId(null);
    if (pathname === `/chat/${id}`) router.push("/chat");
  };

  const groupByDate = () => {
    const now = new Date();
    const groups: { [key: string]: Chat[] } = { Today: [], Yesterday: [], "Previous 7 Days": [], Older: [] };
    chats.forEach(chat => {
      const d = new Date(chat.updated_at);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff === 0) groups["Today"].push(chat);
      else if (diff === 1) groups["Yesterday"].push(chat);
      else if (diff <= 7) groups["Previous 7 Days"].push(chat);
      else groups["Older"].push(chat);
    });
    return groups;
  };

  const groups = groupByDate();
  const activeId = pathname.startsWith("/chat/") ? pathname.split("/chat/")[1] : null;

  return (
    <aside className={`flex flex-col h-full bg-sidebar transition-all duration-300 ease-in-out border-r border-border/30 ${collapsed ? "w-16" : "w-64"} shrink-0`}>
      {/* Top bar */}
      <div className="flex items-center gap-2 p-3 h-14">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white transition-colors"
          title={collapsed ? "Open sidebar" : "Close sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        {!collapsed && (
          <button
            onClick={() => { router.push("/chat"); onNewChat?.(); }}
            className="ml-auto p-2 rounded-lg hover:bg-surface text-muted hover:text-white transition-colors"
            title="New chat"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* New chat (collapsed) */}
      {collapsed && (
        <button
          onClick={() => { router.push("/chat"); onNewChat?.(); }}
          className="mx-2 mb-1 p-2 rounded-lg hover:bg-surface text-muted hover:text-white transition-colors flex justify-center"
          title="New chat"
        >
          <Plus size={18} />
        </button>
      )}

      {/* Chat list */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <MessageSquare size={20} className="text-muted/40" />
              <p className="text-muted/60 text-xs text-center">No conversations yet</p>
            </div>
          ) : (
            Object.entries(groups).map(([label, items]) =>
              items.length > 0 ? (
                <div key={label} className="mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted/50 px-2 py-1.5">{label}</p>
                  <div className="space-y-0.5">
                    {items.map(chat => {
                      const isActive = chat.id === activeId;
                      const isDeleting = deletingId === chat.id;
                      return (
                        <div
                          key={chat.id}
                          onClick={() => router.push(`/chat/${chat.id}`)}
                          onMouseEnter={() => setHoveredId(chat.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-sm transition-all duration-150 ${
                            isActive
                              ? "bg-surface text-white"
                              : "text-muted hover:bg-surface/60 hover:text-white"
                          } ${isDeleting ? "opacity-50" : ""}`}
                        >
                          <span className="truncate flex-1 leading-snug">{chat.title}</span>
                          {(hoveredId === chat.id || isActive) && (
                            <button
                              onClick={(e) => deleteChat(e, chat.id)}
                              className="shrink-0 p-0.5 rounded text-muted hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null
            )
          )}
        </div>
      )}

      {/* User section */}
      <div className={`p-2 border-t border-border/30 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white transition-colors"
            title="Sign out"
          >
            {session?.user?.image ? (
              <img src={session.user.image} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <LogOut size={16} />
            )}
          </button>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface transition-colors group cursor-pointer"
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
            {session?.user?.image && (
              <img src={session.user.image} alt="" className="w-8 h-8 rounded-full shrink-0 ring-2 ring-border" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
              <p className="text-[11px] text-muted truncate">{session?.user?.email}</p>
            </div>
            <LogOut size={14} className="text-muted group-hover:text-red-400 shrink-0 transition-colors" />
          </div>
        )}
      </div>
    </aside>
  );
}

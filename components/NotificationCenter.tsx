import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, Check, CircleAlert, Sparkles, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationDocument } from "@/types";

export function NotificationCenter() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationDocument[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (_) {
      // ignore
    }
  };

  useEffect(() => {
    if (!session) return;
    fetchNotifications();

    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id })
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id || (n as any).id === id ? { ...n, read: true } : n))
        );
      }
    } catch (_) {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true })
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (_) {
      // ignore
    }
  };

  if (!session) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-full transition-colors ring-focus"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] w-80 origin-top-right glass-strong rounded-2xl p-2 shadow-2xl z-50 max-h-96 overflow-y-auto flex flex-col"
          >
            <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center">
                  <Inbox className="w-6 h-6 text-muted-foreground/45 mb-2" />
                  No notifications
                </div>
              ) : (
                notifications.map((n) => {
                  const id = n._id || (n as any).id;
                  return (
                    <div
                      key={id}
                      onClick={() => !n.read && markAsRead(id)}
                      className={`flex gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/40 transition-colors cursor-pointer text-left relative ${
                        !n.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {n.type === "approved" ? (
                          <Sparkles className="w-4 h-4 text-success" />
                        ) : n.type === "rejected" ? (
                          <CircleAlert className="w-4 h-4 text-destructive" />
                        ) : (
                          <Bell className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={`text-xs leading-relaxed text-foreground ${!n.read ? "font-semibold" : ""}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(n.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="w-1.5 h-1.5 bg-primary rounded-full absolute right-3 top-4" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

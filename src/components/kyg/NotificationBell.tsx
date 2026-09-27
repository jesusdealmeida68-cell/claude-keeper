import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyNotifications } from "@/lib/notifications";

function seenKey(userId: string) {
  return `kyg_notif_seen_${userId}`;
}

export function NotificationBell() {
  const { data: userId } = useQuery({
    queryKey: ["auth-user-id"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.id ?? null;
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => getMyNotifications(userId as string),
    enabled: !!userId,
    refetchInterval: 30_000,
  });

  let unseen = 0;
  if (userId && notifications?.length) {
    const lastSeen = localStorage.getItem(seenKey(userId));
    const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
    unseen = notifications.filter((n) => new Date(n.created_at).getTime() > lastSeenTime).length;
  }

  return (
    <Link
      to="/notificacoes"
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/80 hover:bg-secondary"
    >
      <Bell className="h-5 w-5" />
      {unseen > 0 ? (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
          {unseen > 9 ? "9+" : unseen}
        </span>
      ) : null}
    </Link>
  );
}

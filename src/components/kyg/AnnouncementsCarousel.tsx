import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { getActiveAnnouncements } from "@/lib/announcements";

export function AnnouncementsCarousel() {
  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements-active"],
    queryFn: getActiveAnnouncements,
  });

  if (!isLoading && !announcements?.length) return null;

  return (
    <div className="mt-8 animate-fade-up [animation-delay:150ms]">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-gold" />
        <h3 className="text-base font-semibold">Notificações</h3>
      </div>

      <div className="mt-3 -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-48 w-72 shrink-0 animate-pulse rounded-3xl bg-secondary" />
            ))
          : announcements!.map((a) => (
              <div
                key={a.id}
                className="w-72 shrink-0 snap-start overflow-hidden rounded-3xl bg-card shadow-card"
              >
                <img src={a.image_url} alt={a.sponsor_name} className="h-32 w-full object-cover" />
                <div className="p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gold">
                    Patrocinado · {a.sponsor_name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-foreground">{a.description}</p>
                  {a.button_label && a.button_url ? (
                    <div className="mt-3 flex gap-2">
                      <a
                        href={a.button_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 rounded-xl bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground"
                      >
                        {a.button_label}
                      </a>
                      {a.button2_label && a.button2_url ? (
                        <a
                          href={a.button2_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 rounded-xl border border-primary/30 px-3 py-2 text-center text-xs font-semibold text-primary"
                        >
                          {a.button2_label}
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

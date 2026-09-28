import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  getActiveAnnouncements,
  getAnnouncementLikes,
  likeAnnouncement,
  unlikeAnnouncement,
  type Announcement,
} from "@/lib/announcements";
import { cn } from "@/lib/utils";
import { Bell, Globe, Heart, Newspaper } from "lucide-react";

function domainLabel(url: string | null) {
  if (!url) return null;
  try {
    const { hostname } = new URL(url);
    if (hostname === "wa.me") return "WhatsApp";
    return hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function AnnouncementCard({
  a,
  userId,
  liked,
  likeCount,
  onToggleLike,
}: {
  a: Announcement;
  userId: string;
  liked: boolean;
  likeCount: number;
  onToggleLike: (a: Announcement, liked: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isNews = a.type === "noticia";
  const hasLongText = a.description.length > 90;
  const footerLabel = domainLabel(a.button_url) ?? (isNews ? "Notícia" : "Patrocinado");

  return (
    <div className="w-full overflow-hidden rounded-2xl border bg-card shadow-card">
      {/* Cabeçalho: avatar + nome + "Patrocinado" + globo, como no Facebook */}
      <div className="flex items-center gap-2.5 px-3.5 pt-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {a.image_url ? (
            <img src={a.image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            a.sponsor_name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-foreground">
            {a.sponsor_name}
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {isNews ? (
              <>
                <Newspaper className="h-3 w-3" /> Notícia
              </>
            ) : (
              <>
                Patrocinado <Globe className="h-3 w-3" />
              </>
            )}
          </p>
        </div>
      </div>

      {/* Texto do anúncio, com "Ver mais" tal como no Facebook */}
      <p className="mt-2.5 px-3.5 text-sm leading-snug text-foreground">
        <span className={cn(!expanded && hasLongText && "line-clamp-2")}>{a.description}</span>
        {hasLongText ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="ml-1 font-semibold text-muted-foreground hover:underline"
          >
            {expanded ? "Ver menos" : "Ver mais"}
          </button>
        ) : null}
      </p>

      {/* Imagem/criativo principal — completa, sem cortar */}
      <img src={a.image_url} alt={a.sponsor_name} className="mt-3 w-full object-contain" />

      {/* Curtir */}
      <div className="flex items-center gap-2 px-3.5 pt-3">
        <button
          type="button"
          onClick={() => onToggleLike(a, liked)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            liked ? "bg-destructive-soft text-destructive" : "bg-secondary text-muted-foreground",
          )}
        >
          <Heart className={cn("h-3.5 w-3.5", liked && "fill-destructive")} />
          {likeCount > 0 ? likeCount : "Gosto"}
        </button>
      </div>

      {/* Rodapé estilo "loja": ícone + domínio + nome */}
      <div className="mt-3 flex items-center gap-2.5 bg-secondary/60 px-3.5 py-2.5">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-card">
          <img src={a.image_url} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {footerLabel}
          </p>
          <p className="truncate text-sm font-semibold text-foreground">{a.sponsor_name}</p>
        </div>
      </div>

      {/* Botão(ões) — sempre abrem um link (site ou WhatsApp) */}
      {a.button_url ? (
        <div className="flex gap-2 p-3.5 pt-2.5">
          <a
            href={a.button_url}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-lg bg-[#1877F2] px-3 py-2.5 text-center text-sm font-semibold text-white"
          >
            {a.button_label || (isNews ? "Ler mais" : "Saiba mais")}
          </a>
          {a.button2_url ? (
            <a
              href={a.button2_url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-lg border border-primary/30 px-3 py-2.5 text-center text-sm font-semibold text-primary"
            >
              {a.button2_label || "Falar agora"}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function AnnouncementsCarousel({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements-active"],
    queryFn: getActiveAnnouncements,
  });

  const ids = (announcements ?? []).map((a) => a.id);
  const { data: likes } = useQuery({
    queryKey: ["announcement-likes", ids],
    enabled: ids.length > 0,
    queryFn: () => getAnnouncementLikes(ids, userId),
  });

  async function handleToggleLike(a: Announcement, liked: boolean) {
    // Otimista: atualiza a UI já, sem esperar o servidor.
    queryClient.setQueryData(
      ["announcement-likes", ids],
      (prev: { counts: Map<string, number>; likedByMe: Set<string> } | undefined) => {
        const counts = new Map(prev?.counts ?? []);
        const likedByMe = new Set(prev?.likedByMe ?? []);
        const current = counts.get(a.id) ?? 0;
        if (liked) {
          likedByMe.delete(a.id);
          counts.set(a.id, Math.max(0, current - 1));
        } else {
          likedByMe.add(a.id);
          counts.set(a.id, current + 1);
        }
        return { counts, likedByMe };
      },
    );
    try {
      if (liked) {
        await unlikeAnnouncement(a.id, userId);
      } else {
        await likeAnnouncement(a.id, userId);
      }
    } catch {
      toast.error("Não foi possível registar o gosto.");
      await queryClient.invalidateQueries({ queryKey: ["announcement-likes", ids] });
    }
  }

  if (!isLoading && !announcements?.length) return null;

  return (
    <div className="mt-8 animate-fade-up [animation-delay:150ms]">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-gold" />
        <h3 className="text-base font-semibold">Notificações</h3>
      </div>

      <div className="mt-3 space-y-4">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-80 w-full animate-pulse rounded-2xl bg-secondary" />
            ))
          : announcements!.map((a) => (
              <AnnouncementCard
                key={a.id}
                a={a}
                userId={userId}
                liked={likes?.likedByMe.has(a.id) ?? false}
                likeCount={likes?.counts.get(a.id) ?? 0}
                onToggleLike={handleToggleLike}
              />
            ))}
      </div>
    </div>
  );
}

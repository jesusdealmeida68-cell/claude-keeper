import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, Globe, Newspaper } from "lucide-react";
import { getActiveAnnouncements, type Announcement } from "@/lib/announcements";
import { cn } from "@/lib/utils";

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

function AnnouncementCard({ a }: { a: Announcement }) {
  const [expanded, setExpanded] = useState(false);
  const isNews = a.type === "noticia";
  const hasLongText = a.description.length > 90;
  const footerLabel = domainLabel(a.button_url) ?? (isNews ? "Notícia" : "Patrocinado");

  return (
    <div className="w-72 shrink-0 snap-start overflow-hidden rounded-2xl border bg-card shadow-card">
      {/* Cabeçalho: avatar + nome + "Patrocinado" + globo, como no Facebook */}
      <div className="flex items-center gap-2.5 px-3 pt-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {a.image_url ? (
            <img src={a.image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            a.sponsor_name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
            {a.sponsor_name}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            {isNews ? (
              <>
                <Newspaper className="h-2.5 w-2.5" /> Notícia
              </>
            ) : (
              <>
                Patrocinado <Globe className="h-2.5 w-2.5" />
              </>
            )}
          </p>
        </div>
      </div>

      {/* Texto do anúncio, com "Ver mais" tal como no Facebook */}
      <p className="mt-2 px-3 text-[13px] leading-snug text-foreground">
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

      {/* Imagem/criativo principal */}
      <img
        src={a.image_url}
        alt={a.sponsor_name}
        className="mt-2.5 h-40 w-full object-cover"
      />

      {/* Rodapé estilo "loja": ícone + domínio + nome */}
      <div className="flex items-center gap-2.5 bg-secondary/60 px-3 py-2">
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-card">
          <img src={a.image_url} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {footerLabel}
          </p>
          <p className="truncate text-[12px] font-semibold text-foreground">{a.sponsor_name}</p>
        </div>
      </div>

      {/* Botão(ões) — sempre abrem um link (site ou WhatsApp) */}
      {a.button_url ? (
        <div className="flex gap-2 p-3 pt-2.5">
          <a
            href={a.button_url}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-lg bg-[#1877F2] px-3 py-2.5 text-center text-[13px] font-semibold text-white"
          >
            {a.button_label || (isNews ? "Ler mais" : "Saiba mais")}
          </a>
          {a.button2_url ? (
            <a
              href={a.button2_url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-lg border border-primary/30 px-3 py-2.5 text-center text-[13px] font-semibold text-primary"
            >
              {a.button2_label || "Falar agora"}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

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
              <div key={i} className="h-64 w-72 shrink-0 animate-pulse rounded-2xl bg-secondary" />
            ))
          : announcements!.map((a) => <AnnouncementCard key={a.id} a={a} />)}
      </div>
    </div>
  );
}


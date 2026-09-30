import { Fragment } from "react";

// Só apanha http(s):// e www. — nunca javascript: ou outros esquemas.
const URL_RE = /((?:https?:\/\/|www\.)[^\s<]+)/gi;
const TRAILING_PUNCT_RE = /[.,;:!?)\]}'"]+$/;

/**
 * Mostra texto e transforma links em <a> clicáveis (abrem em nova aba).
 * Pontuação colada ao fim do link (ex.: "veja https://site.com.") fica fora do link.
 */
export function Linkify({ text, className }: { text: string; className?: string }) {
  // Com um grupo de captura, os índices ímpares do split são sempre os links.
  const parts = text.split(URL_RE);

  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;

        const trailing = part.match(TRAILING_PUNCT_RE)?.[0] ?? "";
        const url = trailing ? part.slice(0, -trailing.length) : part;
        const href = /^www\./i.test(url) ? `https://${url}` : url;

        return (
          <Fragment key={i}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={(e) => e.stopPropagation()}
              className={
                className ?? "break-all font-semibold text-primary underline underline-offset-2"
              }
            >
              {url}
            </a>
            {trailing}
          </Fragment>
        );
      })}
    </>
  );
}

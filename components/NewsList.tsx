import type { NewsItem } from "@/lib/sources";
import { timeAgo } from "@/lib/format";

export function NewsList({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border-soft bg-surface/40 p-6 text-center text-sm text-text-mute">
        No se encontraron noticias de los últimos 30 días.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border-soft/60 overflow-hidden rounded-xl border border-border-soft">
      {items.map((n, i) => (
        <li key={i}>
          <a
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-1 px-4 py-3 transition hover:bg-surface/60"
          >
            <span className="font-medium leading-snug">{n.title}</span>
            <span className="flex items-center gap-2 text-xs text-text-mute">
              {n.source && <span className="text-text-dim">{n.source}</span>}
              {n.source && n.date && <span>·</span>}
              {n.date && <span>{timeAgo(n.date)}</span>}
              <span className="ml-auto text-brand/80">Leer →</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

import type { CompanyProfile } from "@/lib/sources";

export function CompanyProfileCard({ profile }: { profile: CompanyProfile }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-soft bg-surface/40 p-4 sm:flex-row sm:p-5">
      {profile.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.thumbnail}
          alt={profile.title}
          className="h-16 w-16 shrink-0 self-start rounded-lg bg-white/90 object-contain p-1.5"
        />
      )}
      <div className="min-w-0">
        {profile.industry && (
          <span className="inline-block rounded-md bg-brand/10 px-2 py-0.5 text-xs font-semibold capitalize text-brand">
            {profile.industry}
          </span>
        )}
        <p className="mt-2 text-sm leading-relaxed text-text-dim">
          {profile.extract}
        </p>
        <a
          href={profile.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-brand/80 transition hover:text-brand"
        >
          Leer más en Wikipedia →
        </a>
      </div>
    </div>
  );
}

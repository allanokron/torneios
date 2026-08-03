import Link from "next/link"
import { notFound } from "next/navigation"
import { getPublicTournament } from "@/lib/public-tournament"
import { getCategoryLabel, CATEGORY_FORMATS, CATEGORY_GENDERS, CATEGORY_LEVELS, CATEGORY_SPORTS, CATEGORY_TEAM_SIZES } from "@/lib/category-config"

export default async function PublicTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tournament = await getPublicTournament(id)
  if (!tournament) notFound()

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <section className="border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-sm font-medium" style={{ color: "var(--accent-dark)" }}>
            {getCategoryLabel(CATEGORY_SPORTS, tournament.sport)}
          </p>
          <h1 className="mt-2 text-3xl font-semibold" style={{ color: "var(--text)" }}>{tournament.name}</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--neutral-500)" }}>
            {new Date(tournament.startDate).toLocaleDateString("pt-BR")}
            {tournament.endDate ? ` até ${new Date(tournament.endDate).toLocaleDateString("pt-BR")}` : ""}
            {tournament.location ? ` · ${tournament.location}` : ""}
            {tournament.city ? ` · ${tournament.city}/${tournament.state || ""}` : ""}
          </p>
          {tournament.description && (
            <p className="mt-4 max-w-3xl text-sm" style={{ color: "var(--neutral-600)" }}>{tournament.description}</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--text)" }}>Categorias</h2>
        {tournament.categories.length === 0 ? (
          <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--neutral-500)" }}>Nenhuma categoria publicada ainda.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tournament.categories.map(category => (
              <Link
                key={category.id}
                href={`/public/tournaments/${tournament.id}/categories/${category.id}`}
                className="rounded-xl border p-5 transition-all hover:shadow-md"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold" style={{ color: "var(--text)" }}>{category.name}</h3>
                    <p className="mt-1 text-sm" style={{ color: "var(--neutral-500)" }}>
                      {getCategoryLabel(CATEGORY_TEAM_SIZES, category.teamSize)} · {getCategoryLabel(CATEGORY_GENDERS, category.gender)} · {getCategoryLabel(CATEGORY_LEVELS, category.level)}
                    </p>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: "var(--neutral-50)", color: "var(--neutral-600)" }}>{category.status}</span>
                </div>
                <p className="mt-4 text-sm" style={{ color: "var(--neutral-600)" }}>
                  {getCategoryLabel(CATEGORY_FORMATS, category.format)}
                  {category.enableSilverSeries ? " · Série Ouro e Prata" : ""}
                </p>
                <p className="mt-2 text-xs" style={{ color: "var(--neutral-400)" }}>
                  {category._count.teams} equipes · {category._count.matches} jogos
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

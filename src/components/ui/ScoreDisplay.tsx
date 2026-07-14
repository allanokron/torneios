interface ScoreDisplayProps {
  homeScore: number
  awayScore: number
  sets?: Array<{
    homeGames: number
    awayGames: number
    isTiebreak?: boolean
    isSuperTiebreak?: boolean
  }>
  showSets?: boolean
  size?: "sm" | "md" | "lg"
}

export default function ScoreDisplay({
  homeScore,
  awayScore,
  sets,
  showSets = true,
  size = "md"
}: ScoreDisplayProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl"
  }

  const setClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base"
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Main Score */}
      <div className="flex items-center gap-3">
        <span className={`font-bold ${sizeClasses[size]} ${
          homeScore > awayScore ? "" : ""
        }`} style={{ color: homeScore > awayScore ? 'var(--accent)' : 'var(--neutral-400)' }}>
          {homeScore}
        </span>
        <span style={{ color: 'var(--neutral-300)' }} className="text-lg">×</span>
        <span className={`font-bold ${sizeClasses[size]} ${
          awayScore > homeScore ? "" : ""
        }`} style={{ color: awayScore > homeScore ? 'var(--accent)' : 'var(--neutral-400)' }}>
          {awayScore}
        </span>
      </div>

      {/* Sets */}
      {showSets && sets && sets.length > 0 && (
        <div className="flex gap-1">
          {sets.map((set, index) => (
            <div key={index} className="flex flex-col items-center gap-0.5">
              <span className={`score-set ${setClasses[size]}`}
                style={{
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: set.homeGames > set.awayGames ? 'rgba(184, 224, 0, 0.15)' : 'var(--neutral-100)',
                  color: set.homeGames > set.awayGames ? 'var(--accent-dark)' : 'var(--neutral-500)',
                  fontWeight: set.homeGames > set.awayGames ? 700 : 500,
                }}
              >
                {set.homeGames}
              </span>
              <span className={`score-set ${setClasses[size]}`}
                style={{
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: set.awayGames > set.homeGames ? 'rgba(184, 224, 0, 0.15)' : 'var(--neutral-100)',
                  color: set.awayGames > set.homeGames ? 'var(--accent-dark)' : 'var(--neutral-500)',
                  fontWeight: set.awayGames > set.homeGames ? 700 : 500,
                }}
              >
                {set.awayGames}
              </span>
              {set.isTiebreak && (
                <span className="text-[8px]" style={{ color: 'var(--neutral-400)' }}>TB</span>
              )}
              {set.isSuperTiebreak && (
                <span className="text-[8px]" style={{ color: 'var(--neutral-400)' }}>STB</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

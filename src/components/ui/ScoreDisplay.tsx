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
          homeScore > awayScore ? "text-[var(--court-green)]" : "text-gray-400"
        }`}>
          {homeScore}
        </span>
        <span className="text-gray-300 text-lg">×</span>
        <span className={`font-bold ${sizeClasses[size]} ${
          awayScore > homeScore ? "text-[var(--court-green)]" : "text-gray-400"
        }`}>
          {awayScore}
        </span>
      </div>

      {/* Sets */}
      {showSets && sets && sets.length > 0 && (
        <div className="flex gap-1">
          {sets.map((set, index) => (
            <div key={index} className="flex flex-col items-center gap-0.5">
              <span className={`score-set ${setClasses[size]} ${
                set.homeGames > set.awayGames ? "score-won" : "score-lost"
              }`}>
                {set.homeGames}
              </span>
              <span className={`score-set ${setClasses[size]} ${
                set.awayGames > set.homeGames ? "score-won" : "score-lost"
              }`}>
                {set.awayGames}
              </span>
              {set.isTiebreak && (
                <span className="text-[8px] text-gray-400">TB</span>
              )}
              {set.isSuperTiebreak && (
                <span className="text-[8px] text-gray-400">STB</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
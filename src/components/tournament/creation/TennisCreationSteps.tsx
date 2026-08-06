"use client"

import { TENNIS_FORMATS } from "@/lib/sports/tennis/config"

interface TennisCreationStepsProps {
  formData: {
    format: string
    knockoutQualifiers: string
    setsPerMatch: number
    setsToWin: number
    hasTiebreak: boolean
    tiebreakScore: number
    hasSuperTiebreak: boolean
    superTiebreakScore: number
    defaultMatchDuration: number
    delayTolerance: number
    woCriteria: string
    generalRules: string
    scoringConfig: {
      winWithoutLosingSet: number
      winLosingOneSet: number
      lossWinningOneSet: number
      lossWithoutWinningSet: number
      winByWO: number
      lossByWO: number
      winByForfeit: number
      lossByForfeit: number
      withdrawalPenalty: number
      delayPenalty: number
    }
  }
  onChange: (field: string, value: unknown) => void
  onScoringChange: (field: string, value: number) => void
}

const formatDescriptions: Record<string, { title: string; description: string }> = {
  points_ranking: {
    title: "Ranking Pontos Diretos",
    description: "Todos jogam contra todos e o primeiro colocado do ranking é o campeão.",
  },
  ranking_elimination: {
    title: "Ranking com Mata-Mata",
    description: "A fase inicial gera ranking; depois os melhores classificados entram no mata-mata.",
  },
}

export function TennisRulesStep({ formData, onChange }: TennisCreationStepsProps) {
  return (
    <div className="card space-y-6">
      <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Regras do Tênis</h3>

      <div>
        <label className="label">Formato do Torneio *</label>
        <select
          name="format"
          value={formData.format}
          onChange={(e) => onChange("format", e.target.value)}
          className="input"
        >
          {TENNIS_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        {formData.format && formatDescriptions[formData.format] && (
          <p className="mt-2 text-sm" style={{ color: "var(--neutral-500)" }}>
            {formatDescriptions[formData.format].description}
          </p>
        )}
      </div>

      {formData.format === "ranking_elimination" && (
        <div>
          <label className="label">Classificados para Mata-Mata</label>
          <input
            type="number"
            name="knockoutQualifiers"
            value={formData.knockoutQualifiers}
            onChange={(e) => onChange("knockoutQualifiers", e.target.value)}
            className="input"
            min="2"
            max="32"
            placeholder="Ex: 8"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Sets por Partida</label>
          <select
            name="setsPerMatch"
            value={formData.setsPerMatch}
            onChange={(e) => onChange("setsPerMatch", parseInt(e.target.value))}
            className="input"
          >
            <option value={3}>Melhor de 3</option>
            <option value={5}>Melhor de 5</option>
          </select>
        </div>

        <div>
          <label className="label">Sets para Vencer</label>
          <select
            name="setsToWin"
            value={formData.setsToWin}
            onChange={(e) => onChange("setsToWin", parseInt(e.target.value))}
            className="input"
          >
            <option value={1}>1 set</option>
            <option value={2}>2 sets</option>
            <option value={3}>3 sets</option>
          </select>
        </div>

        <div>
          <label className="label">Duração Padrão (min)</label>
          <input
            type="number"
            name="defaultMatchDuration"
            value={formData.defaultMatchDuration}
            onChange={(e) => onChange("defaultMatchDuration", parseInt(e.target.value))}
            className="input"
            min="60"
            max="240"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="hasTiebreak"
            checked={formData.hasTiebreak}
            onChange={(e) => onChange("hasTiebreak", e.target.checked)}
            className="w-4 h-4 rounded"
            style={{ accentColor: "var(--accent)" }}
          />
          <span className="text-sm" style={{ color: "var(--neutral-600)" }}>Tiebreak</span>
        </div>

        {formData.hasTiebreak && (
          <div>
            <label className="label">Placar do Tiebreak</label>
            <input
              type="number"
              name="tiebreakScore"
              value={formData.tiebreakScore}
              onChange={(e) => onChange("tiebreakScore", parseInt(e.target.value))}
              className="input"
              min="5"
              max="10"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="hasSuperTiebreak"
            checked={formData.hasSuperTiebreak}
            onChange={(e) => onChange("hasSuperTiebreak", e.target.checked)}
            className="w-4 h-4 rounded"
            style={{ accentColor: "var(--accent)" }}
          />
          <span className="text-sm" style={{ color: "var(--neutral-600)" }}>Super Tiebreak</span>
        </div>

        {formData.hasSuperTiebreak && (
          <div>
            <label className="label">Pontos do Super Tiebreak</label>
            <input
              type="number"
              name="superTiebreakScore"
              value={formData.superTiebreakScore}
              onChange={(e) => onChange("superTiebreakScore", parseInt(e.target.value))}
              className="input"
              min="7"
              max="15"
            />
          </div>
        )}
      </div>

      <div>
        <label className="label">Tolerância para Atraso (minutos)</label>
        <input
          type="number"
          name="delayTolerance"
          value={formData.delayTolerance}
          onChange={(e) => onChange("delayTolerance", parseInt(e.target.value))}
          className="input"
          min="5"
          max="60"
        />
      </div>

      <div>
        <label className="label">Critérios de W.O.</label>
        <textarea
          name="woCriteria"
          value={formData.woCriteria}
          onChange={(e) => onChange("woCriteria", e.target.value)}
          className="input"
          rows={2}
          placeholder="Descreva os critérios para W.O..."
        />
      </div>

      <div>
        <label className="label">Regras Gerais</label>
        <textarea
          name="generalRules"
          value={formData.generalRules}
          onChange={(e) => onChange("generalRules", e.target.value)}
          className="input"
          rows={3}
          placeholder="Regras adicionais do torneio..."
        />
      </div>
    </div>
  )
}

export function TennisScoringStep({ formData, onScoringChange }: TennisCreationStepsProps) {
  return (
    <div className="card space-y-6">
      <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Pontuação</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Vitória sem perder set</label>
          <input
            type="number"
            value={formData.scoringConfig.winWithoutLosingSet}
            onChange={(e) => onScoringChange("winWithoutLosingSet", parseInt(e.target.value))}
            className="input"
            min="0"
            max="10"
          />
        </div>
        <div>
          <label className="label">Vitória perdendo 1 set</label>
          <input
            type="number"
            value={formData.scoringConfig.winLosingOneSet}
            onChange={(e) => onScoringChange("winLosingOneSet", parseInt(e.target.value))}
            className="input"
            min="0"
            max="10"
          />
        </div>
        <div>
          <label className="label">Derrota ganhando 1 set</label>
          <input
            type="number"
            value={formData.scoringConfig.lossWinningOneSet}
            onChange={(e) => onScoringChange("lossWinningOneSet", parseInt(e.target.value))}
            className="input"
            min="0"
            max="10"
          />
        </div>
        <div>
          <label className="label">Derrota sem ganhar set</label>
          <input
            type="number"
            value={formData.scoringConfig.lossWithoutWinningSet}
            onChange={(e) => onScoringChange("lossWithoutWinningSet", parseInt(e.target.value))}
            className="input"
            min="0"
            max="10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Vitória por W.O.</label>
          <input
            type="number"
            value={formData.scoringConfig.winByWO}
            onChange={(e) => onScoringChange("winByWO", parseInt(e.target.value))}
            className="input"
            min="0"
            max="10"
          />
        </div>
        <div>
          <label className="label">Derrota por W.O.</label>
          <input
            type="number"
            value={formData.scoringConfig.lossByWO}
            onChange={(e) => onScoringChange("lossByWO", parseInt(e.target.value))}
            className="input"
            min="0"
            max="10"
          />
        </div>
        <div>
          <label className="label">Vitória por forfeit</label>
          <input
            type="number"
            value={formData.scoringConfig.winByForfeit}
            onChange={(e) => onScoringChange("winByForfeit", parseInt(e.target.value))}
            className="input"
            min="0"
            max="10"
          />
        </div>
        <div>
          <label className="label">Derrota por forfeit</label>
          <input
            type="number"
            value={formData.scoringConfig.lossByForfeit}
            onChange={(e) => onScoringChange("lossByForfeit", parseInt(e.target.value))}
            className="input"
            min="0"
            max="10"
          />
        </div>
        <div>
          <label className="label">Penalidade por desistência</label>
          <input
            type="number"
            value={formData.scoringConfig.withdrawalPenalty}
            onChange={(e) => onScoringChange("withdrawalPenalty", parseInt(e.target.value))}
            className="input"
            min="-10"
            max="0"
          />
        </div>
        <div>
          <label className="label">Penalidade por atraso</label>
          <input
            type="number"
            value={formData.scoringConfig.delayPenalty}
            onChange={(e) => onScoringChange("delayPenalty", parseInt(e.target.value))}
            className="input"
            min="-10"
            max="0"
          />
        </div>
      </div>
    </div>
  )
}

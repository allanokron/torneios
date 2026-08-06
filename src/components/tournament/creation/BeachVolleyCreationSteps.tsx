"use client"

import { useState } from "react"
import { BV_FORMATS, BV_GENDERS, BV_LEVELS, BV_TEAM_SIZES, formatBVCategoryName } from "@/lib/sports/beach-volleyball/config"

interface BeachVolleyCreationStepsProps {
  formData: {
    categoryFormat: string
    setsPerMatch: number
    normalSetPoints: number
    delayTolerance: number
    generalRules: string
    scoringConfig: {
      winWithoutLosingSet: number
      winLosingOneSet: number
      lossWinningOneSet: number
      lossWithoutWinningSet: number
      winByWO: number
      lossByWO: number
    }
  }
  onChange: (field: string, value: unknown) => void
  onScoringChange: (field: string, value: number) => void
  selectedCategories: Array<{ gender: string; level: string; teamSize: string }>
  onCategoriesChange: (categories: Array<{ gender: string; level: string; teamSize: string }>) => void
}

export function BeachVolleyRulesStep({ formData, onChange }: BeachVolleyCreationStepsProps) {
  return (
    <div className="card space-y-6">
      <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Regras do Vôlei de Praia</h3>

      <p className="text-sm" style={{ color: "var(--neutral-500)" }}>
        Regras simplificadas para vôlei de praia. As mesmas regras são herdadas por todas as categorias criadas.
      </p>

      <div>
        <label className="label">Formato do Torneio *</label>
        <select
          name="categoryFormat"
          value={formData.categoryFormat}
          onChange={(e) => onChange("categoryFormat", e.target.value)}
          className="input"
        >
          {BV_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Sets por Partida</label>
          <select
            name="setsPerMatch"
            value={formData.setsPerMatch}
            onChange={(e) => onChange("setsPerMatch", parseInt(e.target.value))}
            className="input"
          >
            <option value={1}>Melhor de 1</option>
            <option value={3}>Melhor de 3</option>
          </select>
        </div>

        <div>
          <label className="label">Pontos para Vencer o Set</label>
          <input
            type="number"
            name="normalSetPoints"
            value={formData.normalSetPoints}
            onChange={(e) => onChange("normalSetPoints", parseInt(e.target.value))}
            className="input"
            min="15"
            max="30"
          />
        </div>

        <div>
          <label className="label">Pontos do Tiebreak</label>
          <input
            type="number"
            value="15"
            className="input"
            disabled
            style={{ background: "var(--neutral-100)" }}
          />
          <p className="text-xs mt-1" style={{ color: "var(--neutral-400)" }}>Fixo em 15</p>
        </div>

        <div>
          <label className="label">Tolerância para Atraso (min)</label>
          <input
            type="number"
            name="delayTolerance"
            value={formData.delayTolerance}
            onChange={(e) => onChange("delayTolerance", parseInt(e.target.value))}
            className="input"
            min="0"
            max="15"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Simplificações para Vôlei de Praia</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Sem Super Tiebreak (3º set vai até 15 pontos)</li>
          <li>• Sem critérios de W.O.</li>
          <li>• Sem penalidades configuráveis (atraso, desistência)</li>
          <li>• Sem critérios de desempate</li>
          <li>• Apenas foto final da partida (sem foto de início)</li>
        </ul>
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

export function BeachVolleyCategoriesStep({ selectedCategories, onCategoriesChange }: BeachVolleyCreationStepsProps) {
  const [newCategory, setNewCategory] = useState({ gender: "male", level: "iniciante", teamSize: "double" })

  const addCategory = () => {
    onCategoriesChange([...selectedCategories, { ...newCategory }])
  }

  const removeCategory = (index: number) => {
    onCategoriesChange(selectedCategories.filter((_, i) => i !== index))
  }

  const updateCategory = (index: number, field: string, value: string) => {
    onCategoriesChange(
      selectedCategories.map((cat, i) => (i === index ? { ...cat, [field]: value } : cat))
    )
  }

  return (
    <div className="card space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Categorias</h3>
          <p className="text-sm" style={{ color: "var(--neutral-500)" }}>
            Selecione as categorias que serão disputadas neste torneio.
          </p>
        </div>
      </div>

      {selectedCategories.length === 0 && (
        <div className="text-center py-8" style={{ color: "var(--neutral-400)" }}>
          <p>Nenhuma categoria selecionada.</p>
          <p className="text-sm mt-1">Adicione categorias abaixo para começar.</p>
        </div>
      )}

      {selectedCategories.map((cat, index) => (
        <div key={index} className="p-4 rounded-lg border" style={{ borderColor: "var(--neutral-200)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Gênero</label>
              <select
                value={cat.gender}
                onChange={(e) => updateCategory(index, "gender", e.target.value)}
                className="input"
              >
                {BV_GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Nível</label>
              <select
                value={cat.level}
                onChange={(e) => updateCategory(index, "level", e.target.value)}
                className="input"
              >
                {BV_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Tamanho do Time</label>
              <select
                value={cat.teamSize}
                onChange={(e) => updateCategory(index, "teamSize", e.target.value)}
                className="input"
              >
                {BV_TEAM_SIZES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => removeCategory(index)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Remover
              </button>
            </div>
          </div>

          <div className="mt-2 text-sm font-medium" style={{ color: "var(--accent)" }}>
            {formatBVCategoryName(cat.gender, cat.level, cat.teamSize)}
          </div>
        </div>
      ))}

      <div className="p-4 rounded-lg border border-dashed" style={{ borderColor: "var(--neutral-300)" }}>
        <h4 className="font-medium mb-3" style={{ color: "var(--text)" }}>Adicionar Categoria</h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="label">Gênero</label>
            <select
              value={newCategory.gender}
              onChange={(e) => setNewCategory({ ...newCategory, gender: e.target.value })}
              className="input"
            >
              {BV_GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Nível</label>
            <select
              value={newCategory.level}
              onChange={(e) => setNewCategory({ ...newCategory, level: e.target.value })}
              className="input"
            >
              {BV_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Tamanho do Time</label>
            <select
              value={newCategory.teamSize}
              onChange={(e) => setNewCategory({ ...newCategory, teamSize: e.target.value })}
              className="input"
            >
              {BV_TEAM_SIZES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button type="button" onClick={addCategory} className="btn-primary text-sm w-full">
              + Adicionar
            </button>
          </div>
        </div>
      </div>

      {selectedCategories.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            <strong>{selectedCategories.length}</strong> {selectedCategories.length === 1 ? "categoria selecionada" : "categorias selecionadas"}.
            As regras do torneio serão herdadas por todas as categorias.
          </p>
        </div>
      )}
    </div>
  )
}

export function BeachVolleyScoringStep({ formData, onScoringChange }: BeachVolleyCreationStepsProps) {
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
      </div>
    </div>
  )
}

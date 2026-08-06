"use client"

import { type SportId } from "@/lib/sports/types"

interface SharedCreationStepsProps {
  formData: {
    name: string
    description: string
    sport: SportId
    location: string
    address: string
    city: string
    state: string
    startDate: string
    endDate: string
    registrationDeadline: string
    maxParticipants: string
    isPublic: boolean
    inviteCode: string
    coverImage: string
  }
  onChange: (field: string, value: unknown) => void
  step: number
}

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
]

export function SharedInfoStep({ formData, onChange }: SharedCreationStepsProps) {
  return (
    <div className="card space-y-6">
      <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Informações Gerais</h3>

      <div>
        <label className="label">Nome do Torneio *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={(e) => onChange("name", e.target.value)}
          className="input"
          placeholder="Ex: Liga de Tênis 2026"
          required
        />
      </div>

      <div>
        <label className="label">Descrição</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={(e) => onChange("description", e.target.value)}
          className="input"
          rows={3}
          placeholder="Descreva o torneio..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Local *</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={(e) => onChange("location", e.target.value)}
            className="input"
            placeholder="Nome do local"
            required
          />
        </div>
        <div>
          <label className="label">Endereço</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={(e) => onChange("address", e.target.value)}
            className="input"
            placeholder="Endereço completo"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Cidade *</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={(e) => onChange("city", e.target.value)}
            className="input"
            placeholder="Cidade"
            required
          />
        </div>
        <div>
          <label className="label">Estado *</label>
          <select
            name="state"
            value={formData.state}
            onChange={(e) => onChange("state", e.target.value)}
            className="input"
            required
          >
            <option value="">Selecione</option>
            {STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Data Início *</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">Data Fim</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={(e) => onChange("endDate", e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Inscrições até</label>
          <input
            type="date"
            name="registrationDeadline"
            value={formData.registrationDeadline}
            onChange={(e) => onChange("registrationDeadline", e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Máx. Participantes</label>
          <input
            type="number"
            name="maxParticipants"
            value={formData.maxParticipants}
            onChange={(e) => onChange("maxParticipants", e.target.value)}
            className="input"
            min="2"
            placeholder="Ex: 32"
          />
        </div>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={(e) => onChange("isPublic", e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: "var(--accent)" }}
            />
            <span className="text-sm" style={{ color: "var(--neutral-600)" }}>Público</span>
          </label>
          {!formData.isPublic && (
            <div className="flex-1">
              <label className="label">Código Convite</label>
              <input
                type="text"
                name="inviteCode"
                value={formData.inviteCode}
                onChange={(e) => onChange("inviteCode", e.target.value)}
                className="input"
                placeholder="Código"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface CourtData {
  name: string
  number?: number
  surfaceType?: string
  isCovered: boolean
  availabilities: {
    dayOfWeek: number
    startTime: string
    endTime: string
  }[]
}

interface SharedCourtsStepProps {
  courts: CourtData[]
  onAddCourt: () => void
  onUpdateCourt: (index: number, field: string, value: unknown) => void
  onRemoveCourt: (index: number) => void
  sport: SportId
}

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function SharedCourtsStep({ courts, onAddCourt, onUpdateCourt, onRemoveCourt, sport }: SharedCourtsStepProps) {
  const isBeachVolley = sport === "beach_volley"

  return (
    <div className="card space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Quadras</h3>
        <button type="button" onClick={onAddCourt} className="btn-secondary text-sm">
          + Adicionar Quadra
        </button>
      </div>

      {courts.length === 0 && (
        <p className="text-sm" style={{ color: "var(--neutral-500)" }}>
          Nenhuma quadra cadastrada. Adicione quadras para o torneio.
        </p>
      )}

      {courts.map((court, index) => (
        <div key={index} className="p-4 rounded-lg border" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium" style={{ color: "var(--text)" }}>
              {court.name || `Quadra ${index + 1}`}
            </span>
            <button
              type="button"
              onClick={() => onRemoveCourt(index)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remover
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Nome</label>
              <input
                type="text"
                value={court.name}
                onChange={(e) => onUpdateCourt(index, "name", e.target.value)}
                className="input text-sm"
                placeholder={`Quadra ${index + 1}`}
              />
            </div>
            {!isBeachVolley && (
              <div>
                <label className="label">Superfície</label>
                <select
                  value={court.surfaceType || ""}
                  onChange={(e) => onUpdateCourt(index, "surfaceType", e.target.value)}
                  className="input text-sm"
                >
                  <option value="">Selecione</option>
                  <option value="hard">Quadra Dura</option>
                  <option value="clay">Saibro</option>
                  <option value="grass">Grama</option>
                </select>
              </div>
            )}
            {isBeachVolley && (
              <div>
                <label className="label">Superfície</label>
                <input type="text" value="Areia" className="input text-sm" disabled style={{ background: "var(--neutral-100)" }} />
              </div>
            )}
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={court.isCovered}
                  onChange={(e) => onUpdateCourt(index, "isCovered", e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: "var(--accent)" }}
                />
                <span className="text-sm" style={{ color: "var(--neutral-600)" }}>Coberta</span>
              </label>
            </div>
          </div>

          <div className="mt-3">
            <label className="label">Horários de disponibilidade</label>
            <div className="grid grid-cols-7 gap-1">
              {DAY_LABELS.map((day, dayIndex) => (
                <div key={dayIndex} className="text-center">
                  <span className="text-xs" style={{ color: "var(--neutral-500)" }}>{day}</span>
                  <div className="mt-1 space-y-1">
                    <input
                      type="time"
                      value={court.availabilities[dayIndex]?.startTime || "07:00"}
                      onChange={(e) => {
                        const newAvail = [...court.availabilities]
                        if (newAvail[dayIndex]) {
                          newAvail[dayIndex] = { ...newAvail[dayIndex], startTime: e.target.value }
                        }
                        onUpdateCourt(index, "availabilities", newAvail)
                      }}
                      className="input text-xs p-1 w-full"
                    />
                    <input
                      type="time"
                      value={court.availabilities[dayIndex]?.endTime || "22:00"}
                      onChange={(e) => {
                        const newAvail = [...court.availabilities]
                        if (newAvail[dayIndex]) {
                          newAvail[dayIndex] = { ...newAvail[dayIndex], endTime: e.target.value }
                        }
                        onUpdateCourt(index, "availabilities", newAvail)
                      }}
                      className="input text-xs p-1 w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

import { format, parseISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TIMEZONE = 'America/Sao_Paulo'

export function toBrasiliaTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return toZonedTime(dateObj, TIMEZONE)
}

export function formatBrasiliaTime(date: Date | string, formatStr: string = 'dd/MM/yyyy HH:mm'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const zonedDate = toZonedTime(dateObj, TIMEZONE)
  return format(zonedDate, formatStr)
}

export function isWithinCourtHours(startTime: Date, endTime: Date, courtOpen: string, courtClose: string): boolean {
  const startHour = startTime.getHours() + startTime.getMinutes() / 60
  const endHour = endTime.getHours() + endTime.getMinutes() / 60
  
  const [openHour, openMin] = courtOpen.split(':').map(Number)
  const [closeHour, closeMin] = courtClose.split(':').map(Number)
  
  const openTime = openHour + openMin / 60
  const closeTime = closeHour + closeMin / 60
  
  return startHour >= openTime && endHour <= closeTime
}

export function isCourtAvailable(
  courtId: string,
  proposedStart: Date,
  proposedEnd: Date,
  existingReservations: { courtId: string; startTime: Date; endTime: Date; isCancelled: boolean }[]
): boolean {
  const conflictingReservations = existingReservations.filter(
    (r) =>
      r.courtId === courtId &&
      !r.isCancelled &&
      r.startTime < proposedEnd &&
      r.endTime > proposedStart
  )
  
  return conflictingReservations.length === 0
}

export function isPlayerAvailable(
  playerId: string,
  proposedStart: Date,
  proposedEnd: Date,
  existingMatches: { homePlayerId: string; awayPlayerId: string; scheduledAt: Date; duration: number; status: string }[]
): boolean {
  const playerMatches = existingMatches.filter(
    (m) =>
      (m.homePlayerId === playerId || m.awayPlayerId === playerId) &&
      m.status !== 'cancelled' &&
      m.scheduledAt
  )
  
  for (const match of playerMatches) {
    const matchEnd = new Date(match.scheduledAt.getTime() + match.duration * 60 * 1000)
    
    if (match.scheduledAt < proposedEnd && matchEnd > proposedStart) {
      return false
    }
  }
  
  return true
}
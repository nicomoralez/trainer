import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useProfile } from '../lib/ProfileContext'
import { getNextWorkoutDay } from '../lib/nextWorkoutDay'
import { fetchLastSessionSummary, fetchTrainingDayCount, fetchTrainingStreak, fetchWeekTrainingCount } from '../lib/workoutLogs'
import { fetchFirstAndLatestWeight } from '../lib/bodyMetrics'
import { fetchTodayIntake, setSupplementTaken } from '../lib/supplements'
import { GOAL_LABEL } from '../lib/profile'
import MonthCalendar from '../components/MonthCalendar'
import { IconFlame } from '../components/Icons'

function relativeDate(isoDate) {
  const diffDays = Math.round((Date.now() - new Date(`${isoDate}T00:00:00`).getTime()) / 86400000)
  if (diffDays === 0) return 'hoy'
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays} días`
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

export default function Inicio() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nextDay, setNextDay] = useState(null)
  const [lastSession, setLastSession] = useState(null)
  const [trainingDays, setTrainingDays] = useState(0)
  const [streak, setStreak] = useState(0)
  const [weekCount, setWeekCount] = useState(0)
  const [weightRange, setWeightRange] = useState({ first: null, latest: null })
  const [takenToday, setTakenToday] = useState(new Set())

  useEffect(() => {
    let active = true
    Promise.all([
      getNextWorkoutDay(user.id),
      fetchLastSessionSummary(user.id),
      fetchTrainingDayCount(user.id, 30),
      fetchTrainingStreak(user.id),
      fetchWeekTrainingCount(user.id),
      fetchFirstAndLatestWeight(user.id),
      fetchTodayIntake(user.id),
    ])
      .then(([next, last, days, streakCount, week, weights, intake]) => {
        if (!active) return
        setNextDay(next)
        setLastSession(last)
        setTrainingDays(days)
        setStreak(streakCount)
        setWeekCount(week)
        setWeightRange(weights)
        setTakenToday(intake)
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user.id])

  async function toggleSupplement(name) {
    const taken = !takenToday.has(name)
    setTakenToday((cur) => {
      const next = new Set(cur)
      if (taken) next.add(name)
      else next.delete(name)
      return next
    })
    try {
      await setSupplementTaken(user.id, name, taken)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div className="empty-hint">Cargando…</div>

  const lastSessionDay = lastSession && nextDay?.routineData?.days.find((d) => d.id === lastSession.routineDayId)
  const { first, latest } = weightRange
  const hasGoal = profile?.target_weight_kg != null && first && latest
  let goalPct = null
  let goalDone = false
  if (hasGoal) {
    const total = profile.target_weight_kg - first.weight_kg
    const progressed = latest.weight_kg - first.weight_kg
    if (total === 0) {
      goalPct = 100
      goalDone = true
    } else {
      const pct = (progressed / total) * 100
      goalPct = Math.max(0, Math.min(100, pct))
      goalDone = pct >= 100
    }
  }

  return (
    <div>
      <div className="screen-eyebrow">Inicio</div>
      <h1>{profile?.name ? `Hola, ${profile.name}` : 'Hola'}</h1>
      {profile?.goal && <p className="sub">Objetivo: {GOAL_LABEL[profile.goal]}</p>}

      {error && <div className="error-text">{error}</div>}

      {streak > 0 && (
        <div className="streak-card">
          <IconFlame />
          <div>
            <div className="num">{streak}</div>
            <div className="label">{streak === 1 ? 'día de racha' : 'días de racha'}</div>
          </div>
        </div>
      )}

      {nextDay?.day ? (
        <div className="ex-current" style={{ marginBottom: 16 }}>
          <div className="target" style={{ marginBottom: 4 }}>
            Próximo entrenamiento
          </div>
          <div className="n" style={{ marginBottom: 12 }}>
            {nextDay.day.label}
          </div>
          <Link to="/entrenar" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Empezar →
          </Link>
        </div>
      ) : (
        <div className="rest-day-card" style={{ marginBottom: 16 }}>
          Todavía no tenés una rutina generada.{' '}
          <Link to="/configuracion" style={{ color: 'var(--accent)' }}>
            Configurala acá
          </Link>
          .
        </div>
      )}

      {nextDay?.routineData && (
        <div className="week-bar-card">
          <div className="row-between">
            <div className="field-label">Esta semana</div>
            <div className="field-label" style={{ color: 'var(--text-dim)' }}>
              {weekCount} / {nextDay.routineData.routine.days_per_week}
            </div>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, (weekCount / nextDay.routineData.routine.days_per_week) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="stat-row">
        <div className="stat-tile">
          <div className="v">{trainingDays}</div>
          <div className="l">Entrenamientos en los últimos 30 días</div>
        </div>
        <div className="stat-tile">
          <div className="v">{lastSession ? relativeDate(lastSession.date) : '—'}</div>
          <div className="l">
            {lastSession ? `${lastSessionDay?.label ?? 'Último entrenamiento'} · ${lastSession.exerciseCount} ejercicios` : 'Todavía sin entrenamientos'}
          </div>
        </div>
      </div>

      <div className="field-label">Tu constancia</div>
      <MonthCalendar userId={user.id} />

      <div className="field-label">Progreso hacia tu objetivo</div>
      {hasGoal ? (
        <div className="chart-card">
          <div className="progress-track" style={{ marginBottom: 8 }}>
            <div className="progress-fill" style={{ width: `${goalPct}%` }} />
          </div>
          <div className="progress-caption" style={{ margin: 0 }}>
            <span>{first.weight_kg} kg (inicio)</span>
            <span>{latest.weight_kg} kg (hoy)</span>
            <span>{profile.target_weight_kg} kg (objetivo)</span>
          </div>
          {goalDone && (
            <p className="sub" style={{ color: 'var(--accent-2)', marginTop: 10, marginBottom: 0 }}>
              ¡Llegaste a tu objetivo!
            </p>
          )}
        </div>
      ) : (
        <p className="empty-hint">
          Cargá tu peso objetivo en{' '}
          <Link to="/configuracion" style={{ color: 'var(--accent)' }}>
            Configuración
          </Link>{' '}
          para ver tu progreso acá.
        </p>
      )}

      {profile?.tracked_supplements?.length > 0 && (
        <>
          <div className="field-label" style={{ marginTop: 24 }}>
            Suplementos de hoy
          </div>
          <div className="chip-grid">
            {profile.tracked_supplements.map((s) => (
              <button type="button" key={s} className={`chip ${takenToday.has(s) ? 'selected' : ''}`} onClick={() => toggleSupplement(s)}>
                <span className="dot" />
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

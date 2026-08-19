import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useProfile } from '../lib/ProfileContext'
import { getNextWorkoutDay } from '../lib/nextWorkoutDay'
import { fetchLastSessionSummary, fetchTrainingDayCount, fetchTrainingStreak, fetchWeekTrainingDays } from '../lib/workoutLogs'
import { fetchFirstAndLatestWeight } from '../lib/bodyMetrics'
import { fetchTodayIntake, setSupplementTaken } from '../lib/supplements'
import { GOAL_LABEL } from '../lib/profile'
import { useCountUp } from '../lib/useCountUp'
import MonthCalendar from '../components/MonthCalendar'
import { IconFlame } from '../components/Icons'

const WEEKDAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function toKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function currentWeekDates() {
  const now = new Date()
  const dow = (now.getDay() + 6) % 7
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() - dow)
  const todayKey = toKey(now)
  return WEEKDAY_LETTERS.map((letter, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const key = toKey(d)
    return { key, letter, isToday: key === todayKey }
  })
}

function motivationalLine(streak, weekCount, daysPerWeek) {
  if (streak >= 3) return `Racha de ${streak} días. No la cortes.`
  if (daysPerWeek) return `Vas ${weekCount} de ${daysPerWeek} esta semana.`
  return 'Un entrenamiento a la vez.'
}

function InicioSkeleton() {
  return (
    <div>
      <div className="screen-eyebrow">Inicio</div>
      <div className="skel" style={{ width: '55%', height: 28, marginBottom: 14 }} />
      <div className="skel" style={{ width: '100%', height: 70, borderRadius: 16, marginBottom: 16 }} />
      <div className="skel" style={{ width: '100%', height: 96, borderRadius: 14, marginBottom: 16 }} />
      <div className="stat-row">
        <div className="skel" style={{ height: 62, flex: 1 }} />
        <div className="skel" style={{ height: 62, flex: 1 }} />
      </div>
    </div>
  )
}

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
  const [weekDays, setWeekDays] = useState(new Set())
  const [weightRange, setWeightRange] = useState({ first: null, latest: null })
  const [takenToday, setTakenToday] = useState(new Set())

  useEffect(() => {
    let active = true
    Promise.all([
      getNextWorkoutDay(user.id),
      fetchLastSessionSummary(user.id),
      fetchTrainingDayCount(user.id, 30),
      fetchTrainingStreak(user.id),
      fetchWeekTrainingDays(user.id),
      fetchFirstAndLatestWeight(user.id),
      fetchTodayIntake(user.id),
    ])
      .then(([next, last, days, streakCount, week, weights, intake]) => {
        if (!active) return
        setNextDay(next)
        setLastSession(last)
        setTrainingDays(days)
        setStreak(streakCount)
        setWeekDays(week)
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

  const animatedStreak = useCountUp(streak)
  const animatedTrainingDays = useCountUp(trainingDays)

  if (loading) return <InicioSkeleton />

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

  const weekCount = weekDays.size
  const daysPerWeek = nextDay?.routineData?.routine.days_per_week
  const weekDates = currentWeekDates()

  return (
    <div>
      <div className="screen-eyebrow">Inicio</div>
      <h1>{profile?.name ? `Hola, ${profile.name}` : 'Hola'}</h1>
      <p className="sub">
        {motivationalLine(streak, weekCount, daysPerWeek)}
        {profile?.goal ? ` · Objetivo: ${GOAL_LABEL[profile.goal]}` : ''}
      </p>

      {error && <div className="error-text">{error}</div>}

      {nextDay?.day ? (
        <div className="hero-card enter" style={{ '--d': '40ms' }}>
          <div className="hero-top">
            <div>
              <div className="hero-eyebrow">Próximo entrenamiento</div>
              <div className="hero-day">{nextDay.day.label}</div>
              <div className="hero-meta">{nextDay.day.exercises.length} ejercicios</div>
            </div>
            {streak > 0 && (
              <span className="hero-streak-badge">
                <IconFlame />
                <span className="n">{Math.round(animatedStreak)}</span>
              </span>
            )}
          </div>
          <Link to="/entrenar" className="hero-cta">
            Empezar entrenamiento →
          </Link>
        </div>
      ) : (
        <div className="rest-day-card enter" style={{ '--d': '40ms', marginBottom: 16 }}>
          Todavía no tenés una rutina generada.{' '}
          <Link to="/configuracion" style={{ color: 'var(--accent)' }}>
            Configurala acá
          </Link>
          .
        </div>
      )}

      {nextDay?.routineData && (
        <div className="chart-card week-dots-card enter" style={{ '--d': '110ms' }}>
          <div className="row-between" style={{ marginBottom: 12 }}>
            <div className="field-label" style={{ marginBottom: 0 }}>
              Esta semana
            </div>
            <div className="field-label" style={{ marginBottom: 0, color: 'var(--text-dim)' }}>
              {weekCount} / {daysPerWeek}
            </div>
          </div>
          <div className="week-dots">
            {weekDates.map(({ key, letter, isToday }) => (
              <div key={key} className={`week-dot ${weekDays.has(key) ? 'trained' : ''} ${isToday ? 'today' : ''}`}>
                <span className="letter">{letter}</span>
                <span className="circle" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="stat-row">
        <div className="stat-tile enter" style={{ '--d': '180ms' }}>
          <div className="v">{Math.round(animatedTrainingDays)}</div>
          <div className="l">Entrenamientos en los últimos 30 días</div>
        </div>
        <div className="stat-tile enter" style={{ '--d': '220ms' }}>
          <div className="v">{lastSession ? relativeDate(lastSession.date) : '—'}</div>
          <div className="l">
            {lastSession ? `${lastSessionDay?.label ?? 'Último entrenamiento'} · ${lastSession.exerciseCount} ejercicios` : 'Todavía sin entrenamientos'}
          </div>
        </div>
      </div>

      <div className="field-label">Tu constancia</div>
      <div className="enter" style={{ '--d': '260ms' }}>
        <MonthCalendar userId={user.id} />
      </div>

      <div className="field-label">Progreso hacia tu objetivo</div>
      {hasGoal ? (
        <div className="chart-card enter" style={{ '--d': '300ms' }}>
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
            {profile.tracked_supplements.map((s, i) => (
              <button
                type="button"
                key={s}
                className={`chip enter ${takenToday.has(s) ? 'taken' : ''}`}
                style={{ '--d': `${340 + i * 40}ms` }}
                onClick={() => toggleSupplement(s)}
              >
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

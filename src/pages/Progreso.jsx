import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { addBodyMetric, fetchBodyMetrics, fetchFirstAndLatestWeight } from '../lib/bodyMetrics'
import { fetchPersonalRecords, fetchTrainingDayCount } from '../lib/workoutLogs'
import { EXERCISES_BY_ID } from '../data/exercises'
import { useCountUp } from '../lib/useCountUp'
import { IconUp } from '../components/Icons'

function ProgresoSkeleton() {
  return (
    <div>
      <div className="screen-eyebrow">Seguimiento</div>
      <div className="skel" style={{ width: '50%', height: 28, marginBottom: 14 }} />
      <div className="stat-row">
        <div className="skel" style={{ height: 62, flex: 1 }} />
        <div className="skel" style={{ height: 62, flex: 1 }} />
      </div>
      <div className="skel" style={{ width: '100%', height: 140, borderRadius: 14, marginBottom: 20 }} />
      <div className="skel" style={{ width: '100%', height: 46, borderRadius: 12 }} />
    </div>
  )
}

function shortDate(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

function buildChartPoints(metrics) {
  if (metrics.length === 0) return { points: '', area: '', min: 0, max: 0 }
  const weights = metrics.map((m) => m.weight_kg)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const range = max - min || 1
  const stepX = metrics.length > 1 ? (280 / (metrics.length - 1)) : 0
  const coords = metrics.map((m, i) => {
    const x = 10 + i * stepX
    const y = 10 + ((max - m.weight_kg) / range) * 80
    return [x, y]
  })
  const points = coords.map(([x, y]) => `${x},${y}`).join(' ')
  const area = `${points} ${coords[coords.length - 1][0]},100 ${coords[0][0]},100`
  return { points, area, min, max, coords }
}

export default function Progreso() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState([])
  const [records, setRecords] = useState([])
  const [trainingDays, setTrainingDays] = useState(0)
  const [weightRange, setWeightRange] = useState({ first: null, latest: null })
  const [loading, setLoading] = useState(true)
  const [weightInput, setWeightInput] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const reload = useCallback(() => {
    return Promise.all([
      fetchBodyMetrics(user.id, 8),
      fetchPersonalRecords(user.id, 3),
      fetchTrainingDayCount(user.id, 30),
      fetchFirstAndLatestWeight(user.id),
    ]).then(([m, r, t, w]) => {
      setMetrics(m)
      setRecords(r)
      setTrainingDays(t)
      setWeightRange(w)
    })
  }, [user.id])

  useEffect(() => {
    let active = true
    reload()
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [reload])

  async function handleLogWeight(e) {
    e.preventDefault()
    const n = parseFloat(weightInput)
    if (Number.isNaN(n) || n <= 0) return
    setSaving(true)
    try {
      await addBodyMetric(user.id, n)
      setWeightInput('')
      await reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const animatedTrainingDays = useCountUp(trainingDays)
  const animatedCurrentWeight = useCountUp(weightRange.latest?.weight_kg ?? 0)

  if (loading) return <ProgresoSkeleton />

  const { first: initialWeight, latest: currentWeight } = weightRange
  const delta = initialWeight && currentWeight && initialWeight.recorded_at !== currentWeight.recorded_at
    ? currentWeight.weight_kg - initialWeight.weight_kg
    : null
  const { points, area, coords } = buildChartPoints(metrics)
  const last = coords?.[coords.length - 1]

  return (
    <div>
      <div className="screen-eyebrow">Seguimiento</div>
      <h1>Tu progreso</h1>

      {error && <div className="error-text">{error}</div>}

      <div className="stat-row">
        <div className="stat-tile enter" style={{ '--d': '40ms' }}>
          <div className="v">{initialWeight ? `${initialWeight.weight_kg} kg` : '—'}</div>
          <div className="l">Peso inicial{initialWeight ? ` · ${shortDate(initialWeight.recorded_at)}` : ''}</div>
        </div>
        <div className="stat-tile enter" style={{ '--d': '80ms' }}>
          <div className="v">{currentWeight ? `${animatedCurrentWeight.toFixed(1)} kg` : '—'}</div>
          <div className="l">Peso actual{delta !== null ? ` · ${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg` : ''}</div>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat-tile enter" style={{ '--d': '120ms' }}>
          <div className="v">{Math.round(animatedTrainingDays)}</div>
          <div className="l">Días entrenados (últimos 30)</div>
        </div>
      </div>

      <div className="chart-card enter" style={{ '--d': '160ms' }}>
        <div className="ch-title">Peso corporal · últimos registros</div>
        {metrics.length >= 2 ? (
          <>
            <svg viewBox="0 0 300 100" preserveAspectRatio="none">
              <line x1="10" y1="30" x2="290" y2="30" stroke="var(--line)" strokeWidth="1" />
              <line x1="10" y1="55" x2="290" y2="55" stroke="var(--line)" strokeWidth="1" />
              <line x1="10" y1="80" x2="290" y2="80" stroke="var(--line)" strokeWidth="1" />
              <polygon points={area} fill="var(--accent-2-soft)" />
              <polyline
                points={points}
                fill="none"
                stroke="var(--accent-2)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw-line 1s ease-out forwards' }}
              />
              {last && <circle cx={last[0]} cy={last[1]} r="4" fill="var(--accent-2)" />}
            </svg>
            <div className="chart-axis">
              <span>{shortDate(metrics[0].recorded_at)}</span>
              <span>{shortDate(metrics[metrics.length - 1].recorded_at)}</span>
            </div>
          </>
        ) : (
          <p className="empty-hint">Cargá al menos dos registros de peso para ver la curva.</p>
        )}
      </div>

      <form className="log-weight-form" onSubmit={handleLogWeight}>
        <input
          className="text-input"
          type="number"
          inputMode="decimal"
          placeholder="Tu peso hoy (kg)"
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
          style={{ marginBottom: 0 }}
        />
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? '…' : 'Registrar'}
        </button>
      </form>

      <div className="field-label">Récords personales</div>
      {records.length === 0 ? (
        <p className="empty-hint">Todavía no registraste series con peso.</p>
      ) : (
        <div className="pr-list">
          {records.map((r, i) => (
            <div className="pr-item enter" style={{ '--d': `${i * 60}ms` }} key={r.exercise_id}>
              <span className="pn">
                <div className="n">{EXERCISES_BY_ID[r.exercise_id]?.name ?? r.exercise_id}</div>
                <div className="d">{shortDate(r.performed_at.slice(0, 10))}</div>
              </span>
              <span className="pv">
                {r.weight_kg} kg{r.reps ? `×${r.reps}` : ''}
              </span>
              <IconUp />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { addBodyMetric, fetchBodyMetrics } from '../lib/bodyMetrics'
import { fetchPersonalRecords, fetchTrainingDayCount } from '../lib/workoutLogs'
import { EXERCISES_BY_ID } from '../data/exercises'
import { IconUp } from '../components/Icons'

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
  const [loading, setLoading] = useState(true)
  const [weightInput, setWeightInput] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function reload() {
    return Promise.all([fetchBodyMetrics(user.id, 8), fetchPersonalRecords(user.id, 3), fetchTrainingDayCount(user.id, 30)]).then(
      ([m, r, t]) => {
        setMetrics(m)
        setRecords(r)
        setTrainingDays(t)
      },
    )
  }

  useEffect(() => {
    let active = true
    reload()
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user.id])

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

  if (loading) return <div className="empty-hint">Cargando tu progreso…</div>

  const current = metrics[metrics.length - 1]
  const oldest = metrics[0]
  const delta = current && oldest && metrics.length > 1 ? current.weight_kg - oldest.weight_kg : null
  const { points, area, coords } = buildChartPoints(metrics)
  const last = coords?.[coords.length - 1]

  return (
    <div>
      <div className="screen-eyebrow">Seguimiento</div>
      <h1>Tu progreso</h1>

      {error && <div className="error-text">{error}</div>}

      <div className="stat-row">
        <div className="stat-tile">
          <div className="v">{current ? `${current.weight_kg} kg` : '—'}</div>
          <div className="l">
            Peso actual{delta !== null ? ` · ${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg vs. primer registro` : ''}
          </div>
        </div>
        <div className="stat-tile">
          <div className="v">{trainingDays}</div>
          <div className="l">Días entrenados (últimos 30)</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="ch-title">Peso corporal · últimos registros</div>
        {metrics.length >= 2 ? (
          <>
            <svg viewBox="0 0 300 100" preserveAspectRatio="none">
              <line x1="10" y1="30" x2="290" y2="30" stroke="var(--line)" strokeWidth="1" />
              <line x1="10" y1="55" x2="290" y2="55" stroke="var(--line)" strokeWidth="1" />
              <line x1="10" y1="80" x2="290" y2="80" stroke="var(--line)" strokeWidth="1" />
              <polygon points={area} fill="var(--accent-2-soft)" />
              <polyline points={points} fill="none" stroke="var(--accent-2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
          {records.map((r) => (
            <div className="pr-item" key={r.exercise_id}>
              <span className="pn">
                <div className="n">{EXERCISES_BY_ID[r.exercise_id]?.name ?? r.exercise_id}</div>
                <div className="d">{shortDate(r.performed_at.slice(0, 10))}</div>
              </span>
              <span className="pv">
                {r.weight_kg} kg×{r.reps}
              </span>
              <IconUp />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

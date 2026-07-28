import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { fetchEquipmentConfig } from '../lib/equipmentConfig'
import { usableExercisesForSplit } from '../lib/routineGenerator'
import {
  addRoutineExercise,
  fetchActiveRoutine,
  removeRoutineExercise,
  swapExercisePositions,
  swapRoutineExercise,
} from '../lib/routines'
import { SPLIT_LABEL } from '../data/exercises'
import { IconEdit, IconRemove } from '../components/Icons'

export default function Rutina() {
  const { user } = useAuth()
  const [routineData, setRoutineData] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedDayId, setExpandedDayId] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([fetchActiveRoutine(user.id), fetchEquipmentConfig(user.id)])
      .then(([routine, cfg]) => {
        if (!active) return
        setRoutineData(routine)
        setConfig(cfg)
        setExpandedDayId(routine?.days?.[0]?.id ?? null)
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user.id])

  function updateDay(dayId, updater) {
    setRoutineData((rd) => ({
      ...rd,
      days: rd.days.map((d) => (d.id === dayId ? { ...d, exercises: updater(d.exercises) } : d)),
    }))
  }

  async function handleRemove(day, exercise) {
    try {
      await removeRoutineExercise(exercise.id)
      updateDay(day.id, (exs) => exs.filter((e) => e.id !== exercise.id))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSwap(day, exercise, newExerciseId) {
    try {
      await swapRoutineExercise(exercise.id, newExerciseId)
      updateDay(day.id, (exs) => exs.map((e) => (e.id === exercise.id ? { ...e, exercise_id: newExerciseId } : e)))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAdd(day) {
    const used = new Set(day.exercises.map((e) => e.exercise_id))
    const pool = usableExercisesForSplit(config, day.split_type)
    const next = pool.find((e) => !used.has(e.id))
    if (!next) return
    const position = day.exercises.length > 0 ? Math.max(...day.exercises.map((e) => e.position)) + 1 : 0
    try {
      await addRoutineExercise(user.id, day.id, next.id, position)
      updateDay(day.id, (exs) => [
        ...exs,
        { id: `temp-${next.id}-${Date.now()}`, exercise_id: next.id, position, sets: 3, reps_min: 8, reps_max: 12, routine_day_id: day.id },
      ])
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleMove(day, exercise, direction) {
    const sorted = [...day.exercises].sort((a, b) => a.position - b.position)
    const idx = sorted.findIndex((e) => e.id === exercise.id)
    const neighborIdx = idx + direction
    if (neighborIdx < 0 || neighborIdx >= sorted.length) return
    const neighbor = sorted[neighborIdx]
    try {
      await swapExercisePositions(exercise, neighbor)
      updateDay(day.id, (exs) =>
        exs.map((e) => {
          if (e.id === exercise.id) return { ...e, position: neighbor.position }
          if (e.id === neighbor.id) return { ...e, position: exercise.position }
          return e
        }),
      )
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div className="empty-hint">Cargando tu rutina…</div>

  if (!routineData) {
    return (
      <div>
        <div className="screen-eyebrow">Tu semana</div>
        <h1>Todavía no tenés rutina</h1>
        <p className="sub">Configurá tu equipo y generamos tu Push / Pull / Legs.</p>
        <Link to="/configuracion" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          Ir a configuración
        </Link>
      </div>
    )
  }

  const { routine, days } = routineData

  return (
    <div>
      <div className="screen-eyebrow">Tu semana</div>
      <h1>
        {routine.name} · {routine.days_per_week} días
      </h1>
      <p className="sub">Generada según tu equipo. Tocá un día para editar los ejercicios.</p>

      {error && <div className="error-text">{error}</div>}

      <div className="day-list">
        {days.map((day) => (
          <button
            key={day.id}
            type="button"
            className={`day-card ${expandedDayId === day.id ? 'active' : ''}`}
            onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)}
          >
            <span className={`tone ${day.split_type}`} />
            <span className="meta">
              <div className="name">{day.label}</div>
              <div className="count">{day.exercises.length} ejercicios</div>
            </span>
            <IconEdit className="edit" />
          </button>
        ))}
      </div>

      {days
        .filter((d) => d.id === expandedDayId)
        .map((day) => {
          const used = new Set(day.exercises.map((e) => e.exercise_id))
          const pool = usableExercisesForSplit(config, day.split_type)
          const canAdd = pool.some((e) => !used.has(e.id))
          const sorted = [...day.exercises].sort((a, b) => a.position - b.position)

          return (
            <div className="exercise-panel" key={day.id}>
              <div className="panel-title">
                {day.label} · {SPLIT_LABEL[day.split_type]}
              </div>
              {sorted.map((ex, i) => {
                const options = pool.filter((e) => e.id === ex.exercise_id || !used.has(e.id))
                return (
                  <div className="ex-row" key={ex.id}>
                    <span className="arrows">
                      <button
                        type="button"
                        onClick={() => handleMove(day, ex, -1)}
                        disabled={i === 0}
                        aria-label="Mover arriba"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(day, ex, 1)}
                        disabled={i === sorted.length - 1}
                        aria-label="Mover abajo"
                      >
                        ↓
                      </button>
                    </span>
                    <span className="info">
                      <select value={ex.exercise_id} onChange={(e) => handleSwap(day, ex, e.target.value)}>
                        {options.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                      <div className="s">
                        {ex.sets} × {ex.reps_min}-{ex.reps_max}
                      </div>
                    </span>
                    <button type="button" className="icon-btn" onClick={() => handleRemove(day, ex)} aria-label="Quitar ejercicio">
                      <IconRemove className="remove" />
                    </button>
                  </div>
                )
              })}
              {sorted.length === 0 && <p className="empty-hint">No hay ejercicios compatibles con tu equipo para este día.</p>}
              {canAdd && (
                <button type="button" className="add-ex" onClick={() => handleAdd(day)}>
                  + Agregar ejercicio
                </button>
              )}
            </div>
          )
        })}
    </div>
  )
}

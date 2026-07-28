import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getNextWorkoutDay } from '../lib/nextWorkoutDay'
import { fetchLastSession, logSet } from '../lib/workoutLogs'
import { EXERCISES_BY_ID } from '../data/exercises'
import { IconCheck } from '../components/Icons'

const DEFAULT_REST = 90

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function Entrenar() {
  const { user } = useAuth()
  const [routineData, setRoutineData] = useState(null)
  const [dayIndex, setDayIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [sets, setSets] = useState([])
  const [restDuration, setRestDuration] = useState(DEFAULT_REST)
  const [restRemaining, setRestRemaining] = useState(0)
  const [resting, setResting] = useState(false)
  const [showCues, setShowCues] = useState(false)

  useEffect(() => {
    let active = true
    getNextWorkoutDay(user.id)
      .then(({ routineData, dayIndex }) => {
        if (!active) return
        setRoutineData(routineData)
        setDayIndex(dayIndex === -1 ? 0 : dayIndex)
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user.id])

  const day = routineData?.days?.[dayIndex] ?? null
  const dayExercises = useMemo(() => [...(day?.exercises ?? [])].sort((a, b) => a.position - b.position), [day])
  const currentExercise = dayExercises[exerciseIndex] ?? null

  useEffect(() => {
    if (!currentExercise) return
    setSets(Array.from({ length: currentExercise.sets }, () => ({ weight: '', reps: '', done: false })))
    setShowCues(false)
    fetchLastSession(user.id, currentExercise.exercise_id)
      .then((last) => {
        if (!last || last.length === 0) return
        setSets((cur) => cur.map((s, i) => (last[i] ? { ...s, weight: s.weight || String(last[i].weight_kg ?? '') } : s)))
      })
      .catch(() => {})
  }, [currentExercise?.id, user.id])

  useEffect(() => {
    if (!resting) return
    if (restRemaining <= 0) {
      setResting(false)
      return
    }
    const t = setTimeout(() => setRestRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resting, restRemaining])

  function updateSet(i, field, value) {
    setSets((cur) => cur.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))
  }

  async function completeSet(i) {
    const s = sets[i]
    if (s.done) return
    try {
      await logSet(user.id, {
        routineDayId: day.id,
        exerciseId: currentExercise.exercise_id,
        setNumber: i + 1,
        weightKg: s.weight ? parseFloat(s.weight) : null,
        reps: s.reps ? parseInt(s.reps, 10) : null,
      })
      setSets((cur) => cur.map((set, idx) => (idx === i ? { ...set, done: true } : set)))
      const isLastSetOfDay = i === sets.length - 1 && exerciseIndex === dayExercises.length - 1
      if (!isLastSetOfDay) {
        setRestRemaining(restDuration)
        setResting(true)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  function adjustRest(delta) {
    setRestDuration((d) => Math.max(15, d + delta))
    setRestRemaining((r) => Math.max(0, r + delta))
  }

  function nextExercise() {
    setResting(false)
    setExerciseIndex((i) => i + 1)
  }

  if (loading) return <div className="empty-hint">Cargando…</div>

  if (!routineData) {
    return (
      <div>
        <div className="screen-eyebrow">Entrenamiento</div>
        <h1>Todavía no tenés rutina</h1>
        <p className="sub">Configurá tu equipo para generar tu Push / Pull / Legs.</p>
        <Link to="/configuracion" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          Ir a configuración
        </Link>
      </div>
    )
  }

  if (!day || dayExercises.length === 0) {
    return (
      <div>
        <div className="screen-eyebrow">Entrenamiento</div>
        <h1>{day ? day.label : 'Sin ejercicios'}</h1>
        <div className="rest-day-card">Este día no tiene ejercicios compatibles con tu equipo. Revisalo en Rutina.</div>
      </div>
    )
  }

  if (exerciseIndex >= dayExercises.length) {
    return (
      <div>
        <div className="screen-eyebrow">Entrenamiento</div>
        <h1>{day.label}</h1>
        <div className="rest-day-card">
          Terminaste {day.label}. Buen entrenamiento — la próxima vez que entres acá arrancás con el siguiente día de tu rotación.
        </div>
      </div>
    )
  }

  const completedCount = exerciseIndex
  const exerciseMeta = EXERCISES_BY_ID[currentExercise.exercise_id]
  const circumference = 2 * Math.PI * 34
  const fraction = restDuration > 0 ? restRemaining / restDuration : 0
  const dashoffset = circumference * (1 - fraction)

  return (
    <div>
      <div className="screen-eyebrow">Entrenamiento</div>
      <h1>{day.label}</h1>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(completedCount / dayExercises.length) * 100}%` }} />
      </div>
      <div className="progress-caption">
        <span>
          {completedCount} / {dayExercises.length} ejercicios
        </span>
        <span>{Math.round((completedCount / dayExercises.length) * 100)}%</span>
      </div>

      {error && <div className="error-text">{error}</div>}

      <div className="ex-current">
        <div className="n">{exerciseMeta?.name ?? currentExercise.exercise_id}</div>
        <div className="target">
          Objetivo · {currentExercise.sets} series × {currentExercise.reps_min}–{currentExercise.reps_max} reps
        </div>
        {exerciseMeta?.cues && (
          <>
            <button type="button" className="btn-link" style={{ marginTop: 10 }} onClick={() => setShowCues((v) => !v)}>
              {showCues ? 'Ocultar técnica' : '¿Cómo se hace?'}
            </button>
            {showCues && (
              <ul className="cue-list">
                {exerciseMeta.cues.map((cue, i) => (
                  <li key={i}>{cue}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <table className="set-table">
        <thead>
          <tr>
            <th>Serie</th>
            <th>Peso</th>
            <th>Reps</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sets.map((s, i) => (
            <tr key={i} className={s.done ? 'done' : ''}>
              <td>{i + 1}</td>
              <td>
                <input
                  type="number"
                  inputMode="decimal"
                  value={s.weight}
                  onChange={(e) => updateSet(i, 'weight', e.target.value)}
                  disabled={s.done}
                  placeholder="kg"
                />
              </td>
              <td>
                <input
                  type="number"
                  inputMode="numeric"
                  value={s.reps}
                  onChange={(e) => updateSet(i, 'reps', e.target.value)}
                  disabled={s.done}
                  placeholder="reps"
                />
              </td>
              <td>
                <button type="button" className={`check ${s.done ? 'on' : ''}`} onClick={() => completeSet(i)} aria-label={`Marcar serie ${i + 1} completa`}>
                  {s.done && <IconCheck />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="timer-block">
        <div className="timer-ring">
          <svg viewBox="0 0 80 80">
            <circle className="bg" cx="40" cy="40" r="34" />
            <circle className="fg" cx="40" cy="40" r="34" strokeDasharray={circumference} strokeDashoffset={dashoffset} />
          </svg>
          <div className="time">{formatTime(restRemaining)}</div>
        </div>
        <div className="timer-meta">
          <div className="label">Descanso entre series</div>
          <div className="timer-adjust">
            <button type="button" onClick={() => adjustRest(-15)}>
              −15s
            </button>
            <button type="button" onClick={() => adjustRest(15)}>
              +15s
            </button>
          </div>
        </div>
      </div>

      <button className="btn-primary" onClick={nextExercise} disabled={exerciseIndex >= dayExercises.length - 1 && !sets.every((s) => s.done)}>
        {exerciseIndex === dayExercises.length - 1 ? 'Terminar entrenamiento' : 'Siguiente ejercicio →'}
      </button>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getNextWorkoutDay } from '../lib/nextWorkoutDay'
import { fetchLastSession, fetchMaxWeightForExercise, logSet } from '../lib/workoutLogs'
import { fetchEquipmentConfig } from '../lib/equipmentConfig'
import { generateRoutine, usableExercisesForMuscles } from '../lib/routineGenerator'
import { addRoutineExercise, removeRoutineExercise, swapExercisePositions, swapRoutineExercise } from '../lib/routines'
import { EXERCISES_BY_ID, MUSCLE_LABEL } from '../data/exercises'
import { TRAINING_STYLE_LIST } from '../data/trainingStyles'
import { IconChevronLeft, IconClock, IconDayArms, IconDayLegs, IconDayPull, IconDayPush, IconRemove, IconSwap, IconCheck } from '../components/Icons'
import { feedbackPR, feedbackSetDone, feedbackWorkoutDone } from '../lib/feedback'
import { getGenderPref, setGenderPref } from '../lib/genderPref'
import BodyDiagram from '../components/BodyDiagram'
import ExerciseDemo from '../components/ExerciseDemo'
import ExercisePicker from '../components/ExercisePicker'
import ExerciseDetailSheet from '../components/ExerciseDetailSheet'

const DEFAULT_REST = 90

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function dayMuscles(day) {
  return day.split_type.split(',')
}

// Convierte el resultado de generateRoutine() (formato "para guardar en la
// base") al mismo shape que usan los días persistidos, con ids sintéticos —
// así el resto de la pantalla los puede tratar igual sin importar el origen.
function toDisplayDays(generated, styleId) {
  return generated.days.map((d, i) => ({
    id: `ephemeral-${styleId}-${i}`,
    label: d.label,
    split_type: d.splitType,
    exercises: d.exercises.map((ex, j) => ({
      id: `ephemeral-${styleId}-${i}-${j}`,
      exercise_id: ex.exerciseId,
      position: ex.position,
      sets: ex.sets,
      reps_min: ex.reps_min,
      reps_max: ex.reps_max,
    })),
  }))
}

function dayIcon(splitType) {
  const muscles = splitType.split(',')
  if (muscles.includes('legs')) return IconDayLegs
  if (muscles.includes('back')) return IconDayPull
  if (muscles.includes('chest') || muscles.includes('shoulders')) return IconDayPush
  return IconDayArms
}

function EntrenarSkeleton() {
  return (
    <div>
      <div className="screen-eyebrow">Entrenamiento</div>
      <div className="skel" style={{ width: '55%', height: 28, marginBottom: 16 }} />
      <div className="day-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skel" style={{ height: 68, borderRadius: 12 }} />
        ))}
      </div>
      <div className="skel" style={{ width: '100%', height: 260, borderRadius: 14, marginTop: 16 }} />
    </div>
  )
}

export default function Entrenar() {
  const { user } = useAuth()

  // ---- selección de sesión ----
  const [phase, setPhase] = useState('select')
  const [loading, setLoading] = useState(true)
  const [routineData, setRoutineData] = useState(null)
  const [config, setConfig] = useState(null)
  const [recommendedDayId, setRecommendedDayId] = useState(null)
  const [selectedDayId, setSelectedDayId] = useState(null)
  const [selectedStyleId, setSelectedStyleId] = useState(null)
  const [gender, setGender] = useState(getGenderPref)
  const [error, setError] = useState('')
  const [pickerTarget, setPickerTarget] = useState(null) // { day, exercise } | null
  const [detailExercise, setDetailExercise] = useState(null)

  // ---- sesión activa ----
  const [activeDay, setActiveDay] = useState(null)
  const [activeIsEphemeral, setActiveIsEphemeral] = useState(false)
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [sets, setSets] = useState([])
  const [restDuration, setRestDuration] = useState(DEFAULT_REST)
  const [restRemaining, setRestRemaining] = useState(0)
  const [resting, setResting] = useState(false)
  const [showCues, setShowCues] = useState(false)
  const [bestWeight, setBestWeight] = useState(null)
  const [prToast, setPrToast] = useState('')
  const [elapsedSec, setElapsedSec] = useState(0)
  const [focusedSetIndex, setFocusedSetIndex] = useState(0)

  useEffect(() => {
    let active = true
    Promise.all([getNextWorkoutDay(user.id), fetchEquipmentConfig(user.id)])
      .then(([next, cfg]) => {
        if (!active) return
        setRoutineData(next.routineData)
        setConfig(cfg)
        setRecommendedDayId(next.day?.id ?? null)
        setSelectedDayId(next.day?.id ?? next.routineData?.days?.[0]?.id ?? null)
        setSelectedStyleId(cfg.training_style ?? 'ppl')
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
    const pool = usableExercisesForMuscles(config, dayMuscles(day))
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

  function toggleGender(next) {
    setGender(next)
    setGenderPref(next)
  }

  function startSession(day, ephemeral) {
    setActiveDay(day)
    setActiveIsEphemeral(ephemeral)
    setExerciseIndex(0)
    setElapsedSec(0)
    setPhase('active')
  }

  // ---- sesión activa: día y ejercicio actuales ----
  const day = phase === 'active' ? activeDay : null
  const dayExercises = useMemo(() => [...(day?.exercises ?? [])].sort((a, b) => a.position - b.position), [day])
  const currentExercise = dayExercises[exerciseIndex] ?? null

  useEffect(() => {
    if (!currentExercise) return
    setSets(Array.from({ length: currentExercise.sets }, () => ({ weight: '', reps: '', done: false })))
    setFocusedSetIndex(0)
    setShowCues(false)
    fetchLastSession(user.id, currentExercise.exercise_id)
      .then((last) => {
        if (!last || last.length === 0) return
        setSets((cur) => cur.map((s, i) => (last[i] ? { ...s, weight: s.weight || String(last[i].weight_kg ?? '') } : s)))
      })
      .catch(() => {})
    fetchMaxWeightForExercise(user.id, currentExercise.exercise_id)
      .then((max) => setBestWeight(max))
      .catch(() => {})
  }, [currentExercise, user.id])

  useEffect(() => {
    if (!resting) return
    if (restRemaining <= 0) {
      setResting(false)
      return
    }
    const t = setTimeout(() => setRestRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resting, restRemaining])

  useEffect(() => {
    if (phase !== 'active') return
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [phase])

  // Steps peso/reps de a incrementos fijos (2.5kg / 1 rep) en vez de un
  // input de texto libre — pensado para tocar con el pulgar durante el
  // entrenamiento, sin necesidad de abrir el teclado.
  function stepValue(i, field, delta, min = 0) {
    setSets((cur) =>
      cur.map((s, idx) => {
        if (idx !== i) return s
        const current = parseFloat(s[field]) || 0
        const next = Math.max(min, +(current + delta).toFixed(2))
        return { ...s, [field]: String(next) }
      }),
    )
  }

  async function completeSet(i) {
    const s = sets[i]
    if (s.done) return
    const weightNum = s.weight ? parseFloat(s.weight) : null
    try {
      await logSet(user.id, {
        routineDayId: activeIsEphemeral ? null : day.id,
        exerciseId: currentExercise.exercise_id,
        setNumber: i + 1,
        weightKg: weightNum,
        reps: s.reps ? parseInt(s.reps, 10) : null,
      })
      const updatedSets = sets.map((set, idx) => (idx === i ? { ...set, done: true } : set))
      setSets(updatedSets)
      const nextUndone = updatedSets.findIndex((set) => !set.done)
      setFocusedSetIndex(nextUndone === -1 ? i : nextUndone)

      if (weightNum && bestWeight != null && weightNum > bestWeight) {
        setBestWeight(weightNum)
        feedbackPR()
        setPrToast(`¡Nuevo récord! ${exerciseMeta?.name ?? ''} · ${weightNum} kg`)
        setTimeout(() => setPrToast(''), 2600)
      } else {
        feedbackSetDone()
      }

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
    if (exerciseIndex === dayExercises.length - 1) feedbackWorkoutDone()
    setExerciseIndex((i) => i + 1)
  }

  if (loading) return <EntrenarSkeleton />

  if (!routineData) {
    return (
      <div>
        <div className="screen-eyebrow">Entrenamiento</div>
        <h1>Todavía no tenés rutina</h1>
        <p className="sub">Configurá tu equipo para generar tu rutina.</p>
        <Link to="/configuracion" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          Ir a configuración
        </Link>
      </div>
    )
  }

  // ================= fase: elegir sesión =================
  if (phase === 'select') {
    const persistedStyleId = config?.training_style ?? 'ppl'
    const isPersistedStyle = selectedStyleId === persistedStyleId

    const generated = !isPersistedStyle && config ? generateRoutine(config, config.days_per_week || 3, selectedStyleId) : null
    const ephemeralDays = generated ? toDisplayDays(generated, selectedStyleId) : []
    const daysForStyle = isPersistedStyle ? routineData.days : ephemeralDays

    const selectedDay = daysForStyle.find((d) => d.id === selectedDayId) ?? daysForStyle[0]
    const activeMuscles = new Set(selectedDay.exercises.map((e) => EXERCISES_BY_ID[e.exercise_id]?.muscle).filter(Boolean))
    const muscleNames = [...activeMuscles].map((m) => MUSCLE_LABEL[m] ?? m)
    const used = new Set(selectedDay.exercises.map((e) => e.exercise_id))
    const pool = config && isPersistedStyle ? usableExercisesForMuscles(config, dayMuscles(selectedDay)) : []
    const canAdd = isPersistedStyle && pool.some((e) => !used.has(e.id))
    const sortedExercises = [...selectedDay.exercises].sort((a, b) => a.position - b.position)

    return (
      <div>
        <div className="screen-eyebrow">Entrenamiento</div>
        <h1>¿Qué entrenás hoy?</h1>
        <p className="sub">Elegí un tipo de entrenamiento, después el día, ajustá si querés, y arrancá.</p>

        {error && <div className="error-text">{error}</div>}

        <div className="style-row-wrap">
          <div className="style-row">
            {TRAINING_STYLE_LIST.map((style) => (
              <button
                key={style.id}
                type="button"
                className={`style-pill ${selectedStyleId === style.id ? 'active' : ''}`}
                onClick={() => setSelectedStyleId(style.id)}
              >
                <span className="n">{style.label}</span>
                <span className="d">{style.id === persistedStyleId ? 'Tu plan' : 'Probar hoy'}</span>
              </button>
            ))}
          </div>
        </div>

        {!isPersistedStyle && (
          <div className="ephemeral-note">Sesión generada al toque para hoy — no toca tu plan guardado ni se puede editar.</div>
        )}

        <div className="day-grid">
          {daysForStyle.map((d, i) => {
            const DayIcon = dayIcon(d.split_type)
            return (
              <button
                key={d.id}
                type="button"
                className={`day-tile enter ${selectedDay.id === d.id ? 'selected' : ''}`}
                style={{ '--d': `${i * 50}ms` }}
                onClick={() => setSelectedDayId(d.id)}
              >
                {isPersistedStyle && d.id === recommendedDayId && <span className="badge-rec">Recomendado</span>}
                <DayIcon className="day-tile-icon" />
                <div className="name">{d.label}</div>
                <div className="count">{d.exercises.length} ejercicios</div>
              </button>
            )
          })}
        </div>

        <div className="day-detail-card chart-card enter" style={{ '--d': '80ms' }}>
          <div className="gender-toggle">
            <button type="button" className={gender === 'male' ? 'active' : ''} onClick={() => toggleGender('male')}>
              Hombre
            </button>
            <button type="button" className={gender === 'female' ? 'active' : ''} onClick={() => toggleGender('female')}>
              Mujer
            </button>
          </div>

          <BodyDiagram gender={gender} activeMuscles={activeMuscles} />

          {muscleNames.length > 0 && (
            <p className="sub" style={{ textAlign: 'center', margin: '2px 0 16px' }}>
              Vas a entrenar: {muscleNames.join(' · ')}
            </p>
          )}

          <div className="panel-title">{selectedDay.label}</div>
          {isPersistedStyle
            ? sortedExercises.map((ex, i) => {
                return (
                  <div className="ex-row" key={ex.id}>
                    <span className="arrows">
                      <button type="button" onClick={() => handleMove(selectedDay, ex, -1)} disabled={i === 0} aria-label="Mover arriba">
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(selectedDay, ex, 1)}
                        disabled={i === sortedExercises.length - 1}
                        aria-label="Mover abajo"
                      >
                        ↓
                      </button>
                    </span>
                    <span className="info">
                      <button type="button" className="ex-name-btn" onClick={() => setDetailExercise(EXERCISES_BY_ID[ex.exercise_id])}>
                        {EXERCISES_BY_ID[ex.exercise_id]?.name ?? ex.exercise_id}
                      </button>
                      <div className="s">
                        {ex.sets} × {ex.reps_min}-{ex.reps_max}
                      </div>
                    </span>
                    <button type="button" className="icon-btn" onClick={() => setPickerTarget({ day: selectedDay, exercise: ex })} aria-label="Cambiar ejercicio">
                      <IconSwap />
                    </button>
                    <button type="button" className="icon-btn" onClick={() => handleRemove(selectedDay, ex)} aria-label="Quitar ejercicio">
                      <IconRemove className="remove" />
                    </button>
                  </div>
                )
              })
            : sortedExercises.map((ex) => {
                const meta = EXERCISES_BY_ID[ex.exercise_id]
                return (
                  <div className="ex-row" key={ex.id}>
                    <span className="info">
                      <button type="button" className="ex-name-btn" onClick={() => setDetailExercise(meta)}>
                        {meta?.name ?? ex.exercise_id}
                      </button>
                      <div className="s">
                        {ex.sets} × {ex.reps_min}-{ex.reps_max}
                      </div>
                    </span>
                  </div>
                )
              })}
          {sortedExercises.length === 0 && <p className="empty-hint">No hay ejercicios compatibles con tu equipo para este día.</p>}
          {canAdd && (
            <button type="button" className="add-ex" onClick={() => handleAdd(selectedDay)}>
              + Agregar ejercicio
            </button>
          )}

          <button
            type="button"
            className="hero-cta"
            style={{ marginTop: 18 }}
            disabled={sortedExercises.length === 0}
            onClick={() => startSession(selectedDay, !isPersistedStyle)}
          >
            Empezar entrenamiento →
          </button>
        </div>
        {pickerTarget && (
          <ExercisePicker
            pool={pool.filter((e) => e.id === pickerTarget.exercise.exercise_id || !used.has(e.id))}
            currentExerciseId={pickerTarget.exercise.exercise_id}
            onSelect={(newId) => {
              handleSwap(pickerTarget.day, pickerTarget.exercise, newId)
              setPickerTarget(null)
            }}
            onPreview={(e) => setDetailExercise(e)}
            onClose={() => setPickerTarget(null)}
          />
        )}
        {detailExercise && <ExerciseDetailSheet exercise={detailExercise} gender={gender} onClose={() => setDetailExercise(null)} />}
      </div>
    )
  }

  // ================= fase: entrenando =================

  if (!day || dayExercises.length === 0) {
    return (
      <div>
        <div className="screen-eyebrow">Entrenamiento</div>
        <h1>{day ? day.label : 'Sin ejercicios'}</h1>
        <div className="rest-day-card">Este día no tiene ejercicios compatibles con tu equipo.</div>
        <button type="button" className="btn-secondary" style={{ marginTop: 14 }} onClick={() => setPhase('select')}>
          Volver a elegir
        </button>
      </div>
    )
  }

  if (exerciseIndex >= dayExercises.length) {
    return (
      <div>
        <div className="screen-eyebrow">Entrenamiento</div>
        <h1>{day.label}</h1>
        <div className="rest-day-card">
          Terminaste {day.label} en {formatTime(elapsedSec)}. Buen entrenamiento.
        </div>
        <button type="button" className="btn-primary" style={{ marginTop: 14 }} onClick={() => setPhase('select')}>
          Volver a elegir rutina
        </button>
      </div>
    )
  }

  const completedCount = exerciseIndex
  const exerciseMeta = EXERCISES_BY_ID[currentExercise.exercise_id]
  const nextExerciseMeta = dayExercises[exerciseIndex + 1] ? EXERCISES_BY_ID[dayExercises[exerciseIndex + 1].exercise_id] : null
  const restFraction = restDuration > 0 ? restRemaining / restDuration : 0

  return (
    <div>
      {prToast && <div className="pr-toast">{prToast}</div>}
      <button type="button" className="back-link" onClick={() => setPhase('select')}>
        <IconChevronLeft /> Cambiar rutina
      </button>
      <div className="screen-eyebrow">Entrenamiento</div>
      <h1>{day.label}</h1>
      <span className="session-timer">
        <IconClock />
        {formatTime(elapsedSec)}
      </span>
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

      <div className="ex-current enter" key={currentExercise.id}>
        <button type="button" className="ex-name-btn n" onClick={() => setDetailExercise(exerciseMeta)}>
          {exerciseMeta?.name ?? currentExercise.exercise_id}
        </button>
        <div className="target">
          Objetivo · {currentExercise.sets} series × {currentExercise.reps_min}–{currentExercise.reps_max} reps
        </div>
        <ExerciseDemo exercise={exerciseMeta} />
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
        {nextExerciseMeta && (
          <div className="next-up">
            Próximo: <b>{nextExerciseMeta.name}</b>
          </div>
        )}
      </div>

      {sets.length > 0 && (
        <div className="set-focus">
          <div className="set-dots">
            {sets.map((s, i) => (
              <button
                type="button"
                key={i}
                className={`set-dot ${s.done ? 'done' : ''} ${i === focusedSetIndex ? 'current' : ''}`}
                onClick={() => setFocusedSetIndex(i)}
                aria-label={`Serie ${i + 1}${s.done ? ', completada' : ''}`}
              >
                {s.done ? <IconCheck /> : i + 1}
              </button>
            ))}
          </div>

          {sets[focusedSetIndex].done ? (
            <>
              <div className="set-done-recap">
                Serie {focusedSetIndex + 1} registrada · {sets[focusedSetIndex].weight || 0} kg × {sets[focusedSetIndex].reps || 0} reps
              </div>
              <button type="button" className="btn-link" onClick={() => setFocusedSetIndex(sets.findIndex((s) => !s.done))} disabled={sets.every((s) => s.done)}>
                Ir a la próxima serie
              </button>
            </>
          ) : (
            <>
              <div className="set-steppers">
                <div className="stepper">
                  <span className="stepper-label">Peso</span>
                  <div className="stepper-row">
                    <button type="button" onClick={() => stepValue(focusedSetIndex, 'weight', -2.5)} aria-label="Menos peso">
                      −
                    </button>
                    <span className="stepper-value">{sets[focusedSetIndex].weight || 0} kg</span>
                    <button type="button" onClick={() => stepValue(focusedSetIndex, 'weight', 2.5)} aria-label="Más peso">
                      +
                    </button>
                  </div>
                </div>
                <div className="stepper">
                  <span className="stepper-label">Reps</span>
                  <div className="stepper-row">
                    <button type="button" onClick={() => stepValue(focusedSetIndex, 'reps', -1)} aria-label="Menos reps">
                      −
                    </button>
                    <span className="stepper-value">{sets[focusedSetIndex].reps || 0}</span>
                    <button type="button" onClick={() => stepValue(focusedSetIndex, 'reps', 1)} aria-label="Más reps">
                      +
                    </button>
                  </div>
                </div>
              </div>
              <button type="button" className="hero-cta" onClick={() => completeSet(focusedSetIndex)}>
                Marcar serie {focusedSetIndex + 1}
              </button>
            </>
          )}
        </div>
      )}

      <div className="rest-card">
        <div className="rest-label">Descanso entre series</div>
        <div className={`rest-time ${resting && restRemaining <= 5 && restRemaining > 0 ? 'low' : ''}`}>{formatTime(restRemaining)}</div>
        <div className="progress-track" style={{ marginBottom: 14 }}>
          <div className="progress-fill" style={{ width: `${restFraction * 100}%` }} />
        </div>
        <div className="timer-adjust">
          <button type="button" onClick={() => adjustRest(-15)}>
            −15s
          </button>
          <button type="button" onClick={() => adjustRest(15)}>
            +15s
          </button>
        </div>
      </div>

      <button className="btn-primary" onClick={nextExercise} disabled={exerciseIndex >= dayExercises.length - 1 && !sets.every((s) => s.done)}>
        {exerciseIndex === dayExercises.length - 1 ? 'Terminar entrenamiento' : 'Siguiente ejercicio →'}
      </button>
      {detailExercise && <ExerciseDetailSheet exercise={detailExercise} gender={gender} onClose={() => setDetailExercise(null)} />}
    </div>
  )
}

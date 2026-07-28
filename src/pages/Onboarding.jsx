import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useProfile } from '../lib/ProfileContext'
import { saveProfile, GOAL_LABEL, GYM_EQUIPMENT_DEFAULTS } from '../lib/profile'
import { addBodyMetric } from '../lib/bodyMetrics'
import { DEFAULT_CONFIG, saveEquipmentConfig } from '../lib/equipmentConfig'
import { generateRoutine } from '../lib/routineGenerator'
import { saveGeneratedRoutine } from '../lib/routines'

const GOAL_OPTIONS = Object.entries(GOAL_LABEL) // [['perder_grasa','Bajar de peso'], ...]

export default function Onboarding() {
  const { user } = useAuth()
  const { refresh } = useProfile()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [goal, setGoal] = useState('mantenerse')
  const [targetWeight, setTargetWeight] = useState('')
  const [location, setLocation] = useState('casa')
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await saveProfile(user.id, {
        name: name.trim() || null,
        age: age ? parseInt(age, 10) : null,
        height_cm: height ? parseFloat(height) : null,
        goal,
        target_weight_kg: targetWeight ? parseFloat(targetWeight) : null,
        training_location: location,
        tracked_supplements: [],
      })

      if (weight) await addBodyMetric(user.id, parseFloat(weight))

      if (location === 'gimnasio') {
        const config = { ...GYM_EQUIPMENT_DEFAULTS, days_per_week: daysPerWeek }
        await saveEquipmentConfig(user.id, config)
        const generated = generateRoutine(config, daysPerWeek)
        await saveGeneratedRoutine(user.id, generated)
        await refresh()
        navigate('/inicio')
      } else {
        await saveEquipmentConfig(user.id, { ...DEFAULT_CONFIG, days_per_week: daysPerWeek })
        await refresh()
        navigate('/configuracion')
      }
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <main className="app-main" style={{ paddingTop: 32 }}>
        <div className="screen-eyebrow">Antes de arrancar</div>
        <h1>Contanos de vos</h1>
        <p className="sub">Con estos datos armamos tu punto de partida y tu rutina.</p>

        <form onSubmit={handleSubmit}>
          <div className="field-label">Nombre</div>
          <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="¿Cómo te llamamos?" />

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div className="field-label">Edad</div>
              <input
                className="text-input"
                type="number"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="años"
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="field-label">Altura</div>
              <input
                className="text-input"
                type="number"
                inputMode="decimal"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="cm"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div className="field-label">Peso actual</div>
              <input
                className="text-input"
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="kg"
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="field-label">Peso objetivo (opcional)</div>
              <input
                className="text-input"
                type="number"
                inputMode="decimal"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="kg"
              />
            </div>
          </div>

          <div className="field-label">Tu objetivo</div>
          <div className="chip-grid">
            {GOAL_OPTIONS.map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={`chip ${goal === value ? 'selected' : ''}`}
                onClick={() => setGoal(value)}
              >
                <span className="dot" />
                {label}
              </button>
            ))}
          </div>

          <div className="field-label">¿Dónde entrenás?</div>
          <div className="chip-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <button type="button" className={`chip ${location === 'casa' ? 'selected' : ''}`} onClick={() => setLocation('casa')}>
              <span className="dot" />
              Casa
            </button>
            <button
              type="button"
              className={`chip ${location === 'gimnasio' ? 'selected' : ''}`}
              onClick={() => setLocation('gimnasio')}
            >
              <span className="dot" />
              Gimnasio
            </button>
          </div>
          {location === 'gimnasio' && (
            <p className="sub" style={{ marginTop: -16 }}>
              Asumimos que tenés acceso a todo el equipamiento típico. Lo podés ajustar después en Configuración.
            </p>
          )}
          {location === 'casa' && (
            <p className="sub" style={{ marginTop: -16 }}>
              Después de esto vas a poder cargar qué tenés exactamente en Configuración.
            </p>
          )}

          <div className="field-label">Días por semana</div>
          <div className="stepper">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                className={`step-pill ${daysPerWeek === n ? 'active' : ''}`}
                onClick={() => setDaysPerWeek(n)}
              >
                {n}
              </button>
            ))}
          </div>

          {error && <div className="error-text">{error}</div>}

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Continuar'}
          </button>
        </form>
      </main>
    </div>
  )
}

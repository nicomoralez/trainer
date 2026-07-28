import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useProfile } from '../lib/ProfileContext'
import { GOAL_LABEL, GYM_EQUIPMENT_DEFAULTS, saveProfile } from '../lib/profile'
import { SUPPLEMENT_OPTIONS } from '../lib/supplements'
import { fetchEquipmentConfig, saveEquipmentConfig } from '../lib/equipmentConfig'
import { generateRoutine } from '../lib/routineGenerator'
import { saveGeneratedRoutine } from '../lib/routines'

const GOAL_OPTIONS = Object.entries(GOAL_LABEL)

function maxBarbellLoad(config) {
  return config.plates.reduce((sum, p) => sum + p.weight * p.qty, config.barbell_weight)
}

function WeightChips({ label, weights, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')

  function confirmAdd() {
    const n = parseFloat(value)
    if (!Number.isNaN(n) && n > 0) onAdd(n)
    setValue('')
    setAdding(false)
  }

  return (
    <div className="weight-chips">
      {weights.map((w, i) => (
        <span className="weight-chip" key={`${w}-${i}`}>
          {w} kg
          <button type="button" onClick={() => onRemove(i)} aria-label={`Quitar ${w} kg de ${label}`}>
            ×
          </button>
        </span>
      ))}
      {adding ? (
        <span className="add-chip">
          <input
            type="number"
            inputMode="decimal"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmAdd()}
            onBlur={confirmAdd}
            placeholder="kg"
          />
        </span>
      ) : (
        <button type="button" className="add-chip" onClick={() => setAdding(true)}>
          + agregar peso
        </button>
      )}
    </div>
  )
}

function PersonalSection({ user, profile, refreshProfile }) {
  const [name, setName] = useState(profile.name ?? '')
  const [age, setAge] = useState(profile.age ?? '')
  const [height, setHeight] = useState(profile.height_cm ?? '')
  const [goal, setGoal] = useState(profile.goal ?? 'mantenerse')
  const [targetWeight, setTargetWeight] = useState(profile.target_weight_kg ?? '')
  const [location, setLocation] = useState(profile.training_location ?? 'casa')
  const [supplements, setSupplements] = useState(profile.tracked_supplements ?? [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function toggleSupplement(name) {
    setSupplements((cur) => (cur.includes(name) ? cur.filter((s) => s !== name) : [...cur, name]))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await saveProfile(user.id, {
        name: name.trim() || null,
        age: age ? parseInt(age, 10) : null,
        height_cm: height ? parseFloat(height) : null,
        goal,
        target_weight_kg: targetWeight ? parseFloat(targetWeight) : null,
        training_location: location,
        tracked_supplements: supplements,
      })
      await refreshProfile()
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="field-label">Nombre</div>
      <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="¿Cómo te llamamos?" />

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div className="field-label">Edad</div>
          <input className="text-input" type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="años" />
        </div>
        <div style={{ flex: 1 }}>
          <div className="field-label">Altura</div>
          <input className="text-input" type="number" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="cm" />
        </div>
      </div>

      <div className="field-label">Peso objetivo</div>
      <input
        className="text-input"
        type="number"
        inputMode="decimal"
        value={targetWeight}
        onChange={(e) => setTargetWeight(e.target.value)}
        placeholder="kg (opcional)"
      />

      <div className="field-label">Tu objetivo</div>
      <div className="chip-grid">
        {GOAL_OPTIONS.map(([value, label]) => (
          <button type="button" key={value} className={`chip ${goal === value ? 'selected' : ''}`} onClick={() => setGoal(value)}>
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
        <button type="button" className={`chip ${location === 'gimnasio' ? 'selected' : ''}`} onClick={() => setLocation('gimnasio')}>
          <span className="dot" />
          Gimnasio
        </button>
      </div>

      <div className="field-label">Suplementos que tomás</div>
      <div className="chip-grid">
        {SUPPLEMENT_OPTIONS.map((s) => (
          <button type="button" key={s} className={`chip ${supplements.includes(s) ? 'selected' : ''}`} onClick={() => toggleSupplement(s)}>
            <span className="dot" />
            {s}
          </button>
        ))}
      </div>
      <p className="sub" style={{ marginTop: -14 }}>
        Los que marques van a aparecer como recordatorio diario en Inicio.
      </p>

      {error && <div className="error-text">{error}</div>}
      {saved && (
        <p className="sub" style={{ color: 'var(--accent-2)' }}>
          Guardado.
        </p>
      )}

      <button className="btn-secondary" onClick={handleSave} disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar datos personales'}
      </button>
    </div>
  )
}

function AddDiscRow({ onAdd }) {
  const [adding, setAdding] = useState(false)
  const [weight, setWeight] = useState('')
  const [qty, setQty] = useState('2')

  function confirm() {
    const w = parseFloat(weight)
    const q = parseInt(qty, 10)
    if (!Number.isNaN(w) && w > 0 && !Number.isNaN(q) && q > 0) onAdd(w, q)
    setWeight('')
    setQty('2')
    setAdding(false)
  }

  if (!adding) {
    return (
      <button type="button" className="add-disc" onClick={() => setAdding(true)}>
        + Agregar disco
      </button>
    )
  }

  return (
    <div className="disc-row">
      <span className="disc-add-inputs">
        <input type="number" inputMode="decimal" autoFocus placeholder="kg" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <span>kg ×</span>
        <input type="number" inputMode="numeric" placeholder="cant." value={qty} onChange={(e) => setQty(e.target.value)} />
      </span>
      <button type="button" className="add-disc" style={{ marginTop: 0 }} onClick={confirm}>
        Agregar
      </button>
    </div>
  )
}

function EquipmentSection({ user }) {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    fetchEquipmentConfig(user.id)
      .then((data) => active && setConfig(data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user.id])

  function patch(fields) {
    setConfig((c) => ({ ...c, ...fields }))
  }

  function toggle(field) {
    patch({ [field]: !config[field] })
  }

  function updateDisc(index, delta) {
    const plates = config.plates.map((p, i) => (i === index ? { ...p, qty: Math.max(0, p.qty + delta) } : p))
    patch({ plates })
  }

  function addDisc(weight, qty) {
    const idx = config.plates.findIndex((p) => p.weight === weight)
    if (idx === -1) {
      patch({ plates: [...config.plates, { weight, qty }] })
    } else {
      patch({ plates: config.plates.map((p, i) => (i === idx ? { ...p, qty: p.qty + qty } : p)) })
    }
  }

  function removeDisc(index) {
    patch({ plates: config.plates.filter((_, i) => i !== index) })
  }

  function applyGymDefaults() {
    patch({ ...GYM_EQUIPMENT_DEFAULTS })
  }

  async function handleGenerate() {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await saveEquipmentConfig(user.id, config)
      const generated = generateRoutine(config, config.days_per_week)
      await saveGeneratedRoutine(user.id, generated)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config) return <div className="empty-hint">Cargando tu equipo…</div>

  return (
    <div>
      <p className="sub">Contános cuánto pesa cada cosa — así la rutina te sugiere cargas que realmente podés levantar.</p>

      <button type="button" className="btn-link" style={{ marginBottom: 16 }} onClick={applyGymDefaults}>
        Usar equipamiento típico de gimnasio
      </button>

      <div className="field-label">Con peso</div>

      <div className="equip-card">
        <div className="head">
          <div>
            <div className="name">Barra + discos</div>
            <div className="hint">olímpica o estándar</div>
          </div>
          <button type="button" className={`switch ${config.barbell_enabled ? 'on' : ''}`} onClick={() => toggle('barbell_enabled')} aria-label="Activar barra y discos">
            <span className="thumb" />
          </button>
        </div>
        {config.barbell_enabled && (
          <div className="equip-detail">
            <div className="row-between">
              <div className="field-label">Peso de la barra</div>
              <div className="num-input">
                <input
                  type="number"
                  inputMode="decimal"
                  value={config.barbell_weight}
                  onChange={(e) => patch({ barbell_weight: parseFloat(e.target.value) || 0 })}
                />
                <span>kg</span>
              </div>
            </div>
            {config.plates.map((p, i) => (
              <div className="disc-row" key={i}>
                <span>Discos de {p.weight} kg</span>
                <span className="qty-stepper">
                  <button type="button" onClick={() => updateDisc(i, -1)} aria-label="Quitar uno">
                    −
                  </button>
                  <span className="n">{p.qty}</span>
                  <button type="button" onClick={() => updateDisc(i, 1)} aria-label="Agregar uno">
                    +
                  </button>
                  <button type="button" onClick={() => removeDisc(i)} aria-label="Quitar este disco" style={{ marginLeft: 4 }}>
                    ×
                  </button>
                </span>
              </div>
            ))}
            <AddDiscRow onAdd={addDisc} />
            <div className="load-badge">Carga máx.: {maxBarbellLoad(config)} kg</div>
          </div>
        )}
      </div>

      <div className="equip-card">
        <div className="head">
          <div>
            <div className="name">Mancuernas</div>
            <div className="hint">pesos fijos que tenés</div>
          </div>
          <button type="button" className={`switch ${config.dumbbells_enabled ? 'on' : ''}`} onClick={() => toggle('dumbbells_enabled')} aria-label="Activar mancuernas">
            <span className="thumb" />
          </button>
        </div>
        {config.dumbbells_enabled && (
          <div className="equip-detail">
            <WeightChips
              label="mancuernas"
              weights={config.dumbbell_weights}
              onAdd={(w) => patch({ dumbbell_weights: [...config.dumbbell_weights, w].sort((a, b) => a - b) })}
              onRemove={(i) => patch({ dumbbell_weights: config.dumbbell_weights.filter((_, idx) => idx !== i) })}
            />
          </div>
        )}
      </div>

      <div className="equip-card">
        <div className="head">
          <div>
            <div className="name">Kettlebell</div>
            <div className="hint">opcional</div>
          </div>
          <button type="button" className={`switch ${config.kettlebell_enabled ? 'on' : ''}`} onClick={() => toggle('kettlebell_enabled')} aria-label="Activar kettlebell">
            <span className="thumb" />
          </button>
        </div>
        {config.kettlebell_enabled && (
          <div className="equip-detail">
            <WeightChips
              label="kettlebell"
              weights={config.kettlebell_weights}
              onAdd={(w) => patch({ kettlebell_weights: [...config.kettlebell_weights, w].sort((a, b) => a - b) })}
              onRemove={(i) => patch({ kettlebell_weights: config.kettlebell_weights.filter((_, idx) => idx !== i) })}
            />
          </div>
        )}
      </div>

      <div className="field-label" style={{ marginTop: 6 }}>
        Otros implementos
      </div>
      <div className="chip-grid">
        <button type="button" className={`chip ${config.bench ? 'selected' : ''}`} onClick={() => toggle('bench')}>
          <span className="dot" />
          Banco
        </button>
        <button type="button" className={`chip ${config.pullup_bar ? 'selected' : ''}`} onClick={() => toggle('pullup_bar')}>
          <span className="dot" />
          Barra dominadas
        </button>
        <button type="button" className={`chip ${config.bands ? 'selected' : ''}`} onClick={() => toggle('bands')}>
          <span className="dot" />
          Bandas elásticas
        </button>
        <button type="button" className={`chip ${config.cable ? 'selected' : ''}`} onClick={() => toggle('cable')}>
          <span className="dot" />
          Polea / cable
        </button>
        <button type="button" className="chip selected locked" disabled>
          <span className="dot" />
          Peso corporal
        </button>
      </div>

      <div className="field-label">Días por semana</div>
      <div className="stepper">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button key={n} type="button" className={`step-pill ${config.days_per_week === n ? 'active' : ''}`} onClick={() => patch({ days_per_week: n })}>
            {n}
          </button>
        ))}
      </div>

      {error && <div className="error-text">{error}</div>}
      {saved && (
        <p className="sub" style={{ color: 'var(--accent-2)' }}>
          Rutina actualizada.
        </p>
      )}

      <button className="btn-primary" onClick={handleGenerate} disabled={saving}>
        {saving ? 'Generando…' : 'Generar / actualizar rutina'}
      </button>
    </div>
  )
}

export default function Configuracion() {
  const { user, signOut } = useAuth()
  const { profile, refresh } = useProfile()

  if (!profile) return <div className="empty-hint">Cargando…</div>

  return (
    <div>
      <div className="screen-eyebrow">Configuración</div>
      <h1>Tu perfil y equipo</h1>

      <div className="field-label" style={{ fontSize: '0.8rem', marginTop: 4 }}>
        Datos personales
      </div>
      <PersonalSection user={user} profile={profile} refreshProfile={refresh} />

      <div className="field-label" style={{ fontSize: '0.8rem', marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
        Equipamiento
      </div>
      <EquipmentSection user={user} />

      <button type="button" className="btn-link" style={{ display: 'block', margin: '24px auto 0' }} onClick={signOut}>
        Cerrar sesión
      </button>
    </div>
  )
}

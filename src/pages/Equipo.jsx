import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { fetchEquipmentConfig, saveEquipmentConfig } from '../lib/equipmentConfig'
import { generateRoutine } from '../lib/routineGenerator'
import { saveGeneratedRoutine } from '../lib/routines'

const COMMON_PLATES = [1.25, 2.5, 5, 10, 15, 20, 25]

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

export default function Equipo() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

  function addDisc() {
    const existingWeights = new Set(config.plates.map((p) => p.weight))
    const next = COMMON_PLATES.find((w) => !existingWeights.has(w)) ?? COMMON_PLATES[0]
    patch({ plates: [...config.plates, { weight: next, qty: 2 }] })
  }

  function removeDisc(index) {
    patch({ plates: config.plates.filter((_, i) => i !== index) })
  }

  async function handleGenerate() {
    setSaving(true)
    setError('')
    try {
      await saveEquipmentConfig(user.id, config)
      const generated = generateRoutine(config, config.days_per_week)
      await saveGeneratedRoutine(user.id, generated)
      navigate('/rutina')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config) return <div className="empty-hint">Cargando tu equipo…</div>

  return (
    <div>
      <div className="screen-eyebrow">Configuración</div>
      <h1>Tu equipo en casa</h1>
      <p className="sub">Contános cuánto pesa cada cosa — así la rutina te sugiere cargas que realmente podés levantar.</p>

      <div className="field-label">Con peso</div>

      <div className="equip-card">
        <div className="head">
          <div>
            <div className="name">Barra + discos</div>
            <div className="hint">olímpica o estándar</div>
          </div>
          <button
            type="button"
            className={`switch ${config.barbell_enabled ? 'on' : ''}`}
            onClick={() => toggle('barbell_enabled')}
            aria-label="Activar barra y discos"
          >
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
            <button type="button" className="add-disc" onClick={addDisc}>
              + Agregar disco
            </button>
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
          <button
            type="button"
            className={`switch ${config.dumbbells_enabled ? 'on' : ''}`}
            onClick={() => toggle('dumbbells_enabled')}
            aria-label="Activar mancuernas"
          >
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
          <button
            type="button"
            className={`switch ${config.kettlebell_enabled ? 'on' : ''}`}
            onClick={() => toggle('kettlebell_enabled')}
            aria-label="Activar kettlebell"
          >
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
          <button
            key={n}
            type="button"
            className={`step-pill ${config.days_per_week === n ? 'active' : ''}`}
            onClick={() => patch({ days_per_week: n })}
          >
            {n}
          </button>
        ))}
      </div>

      {error && <div className="error-text">{error}</div>}

      <button className="btn-primary" onClick={handleGenerate} disabled={saving}>
        {saving ? 'Generando…' : 'Generar rutina'}
      </button>

      <button type="button" className="btn-link" style={{ display: 'block', margin: '18px auto 0' }} onClick={signOut}>
        Cerrar sesión
      </button>
    </div>
  )
}

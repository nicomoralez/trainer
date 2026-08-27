import { useMemo, useState } from 'react'
import { getExerciseFrames } from '../data/exerciseDemos'
import { EQUIPMENT_LABEL } from '../data/exercises'

function normalize(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// Hoja de búsqueda que reemplaza al <select> nativo para "cambiar
// ejercicio". `pool` ya viene filtrado por músculo del día + equipo
// disponible (ver usableExercisesForMuscles) — acá solo se busca/filtra por
// texto dentro de ese mismo pool, no se amplía el alcance.
export default function ExercisePicker({ pool, currentExerciseId, onSelect, onPreview, onClose }) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return pool
    return pool.filter((e) => normalize(e.name).includes(q))
  }, [pool, query])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet picker-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="panel-title" style={{ marginBottom: 0 }}>
            Cambiar ejercicio
          </span>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <input
          type="text"
          className="picker-search"
          placeholder="Buscar ejercicio…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="picker-list">
          {results.map((e) => {
            const frame = getExerciseFrames(e.demoSlug)?.[0]
            return (
              <div key={e.id} className={`picker-row ${e.id === currentExerciseId ? 'current' : ''}`}>
                <button type="button" className="picker-row-main" onClick={() => onSelect(e.id)}>
                  <span className="picker-row-thumb">{frame && <img src={frame} alt="" loading="lazy" />}</span>
                  <span className="picker-row-info">
                    <span className="n">{e.name}</span>
                    <span className="s">
                      {e.equipment.length === 0 ? 'Peso corporal' : e.equipment.map((tag) => EQUIPMENT_LABEL[tag] ?? tag).join(', ')}
                    </span>
                  </span>
                </button>
                <button type="button" className="picker-row-preview" onClick={() => onPreview(e)} aria-label={`Ver detalle de ${e.name}`}>
                  i
                </button>
              </div>
            )
          })}
          {results.length === 0 && <p className="empty-hint">No encontramos ejercicios con ese filtro.</p>}
        </div>
        <span className="demo-credit demo-credit-static">
          Ilustraciones:{' '}
          <a href="https://github.com/bryllim/workout-guide" target="_blank" rel="noreferrer">
            Workout Guide
          </a>{' '}
          (CC BY-SA 4.0)
        </span>
      </div>
    </div>
  )
}

import { useId } from 'react'
import { ANTERIOR, POSTERIOR, reshape } from '../lib/bodyRegions'

// Silueta humana con anatomía real (ver src/lib/bodyRegions.js), frente y
// espalda, coloreando en "calor" los grupos musculares que se van a
// entrenar. `gender` reproporciona la misma silueta (ver `reshape`), no hay
// segundo set de arte.

function Figure({ gender, view, activeMuscles, gradientId }) {
  const regions = view === 'front' ? ANTERIOR : POSTERIOR
  return (
    <svg viewBox="0 0 100 220" className="bd-figure" role="img" aria-label={`Cuerpo humano, vista ${view === 'front' ? 'frontal' : 'trasera'}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--heat-hi)" />
          <stop offset="100%" stopColor="var(--heat-lo)" />
        </linearGradient>
      </defs>
      {regions.map((r, i) => {
        const active = r.muscle != null && activeMuscles.has(r.muscle)
        const fill = active ? `url(#${gradientId})` : 'var(--bd-off)'
        return <polygon key={i} points={reshape(r.d, gender)} className={`bd-region ${active ? 'bd-active' : ''}`} fill={fill} />
      })}
    </svg>
  )
}

export default function BodyDiagram({ gender = 'male', activeMuscles }) {
  const uid = useId()
  const muscles = activeMuscles instanceof Set ? activeMuscles : new Set(activeMuscles ?? [])

  return (
    <div className="body-diagram">
      <div className="bd-col">
        <Figure gender={gender} view="front" activeMuscles={muscles} gradientId={`bd-grad-f-${uid}`} />
        <span className="bd-view-label">Frente</span>
      </div>
      <div className="bd-col">
        <Figure gender={gender} view="back" activeMuscles={muscles} gradientId={`bd-grad-b-${uid}`} />
        <span className="bd-view-label">Espalda</span>
      </div>
    </div>
  )
}

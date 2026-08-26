import ExerciseDemo from './ExerciseDemo'
import BodyDiagram from './BodyDiagram'
import { MUSCLE_DETAIL_LABEL, MUSCLE_LABEL } from '../data/exercises'

export default function ExerciseDetailSheet({ exercise, gender, onClose }) {
  if (!exercise) return null

  const tags = [
    MUSCLE_DETAIL_LABEL[exercise.muscleDetail] ?? MUSCLE_LABEL[exercise.muscle],
    ...(exercise.secondaryMuscles ?? []).map((d) => MUSCLE_DETAIL_LABEL[d]).filter(Boolean),
  ].filter(Boolean)
  const equipmentLabel = exercise.equipment.length === 0 ? 'Peso corporal' : exercise.equipment.join(', ')

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet detail-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="panel-title" style={{ marginBottom: 0 }}>
            {exercise.name}
          </span>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <ExerciseDemo exercise={exercise} />
        <BodyDiagram gender={gender} activeMuscles={[exercise.muscle]} primaryDetail={exercise.muscleDetail} secondaryDetails={exercise.secondaryMuscles} />
        <div className="detail-tags">
          {tags.map((t) => (
            <span className="detail-tag" key={t}>
              {t}
            </span>
          ))}
          <span className="detail-tag equip">{equipmentLabel}</span>
        </div>
        {exercise.cues && (
          <ul className="cue-list">
            {exercise.cues.map((cue, i) => (
              <li key={i}>{cue}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

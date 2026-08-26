import { useEffect, useRef, useState } from 'react'
import { getExerciseDemo, getExerciseFrames } from '../data/exerciseDemos'

const FRAME_INTERVAL_MS = 700

// Rebota entre el primer y último frame (0,1,2,1,0,1,2,1...) en vez de
// cortar de golpe del último al primero — se lee más como una repetición
// real (ida y vuelta) que como un slideshow.
function pingPongNext(i, length, dir) {
  let next = i + dir
  let nextDir = dir
  if (next >= length) {
    next = length - 2
    nextDir = -1
  } else if (next < 0) {
    next = 1
    nextDir = 1
  }
  return { next, nextDir }
}

export default function ExerciseDemo({ exercise }) {
  const frames = exercise?.demoSlug ? getExerciseFrames(exercise.demoSlug) : null
  const [frameIndex, setFrameIndex] = useState(0)
  const [frameError, setFrameError] = useState(false)
  const dirRef = useRef(1)

  useEffect(() => {
    setFrameIndex(0)
    setFrameError(false)
    dirRef.current = 1
  }, [exercise?.id])

  useEffect(() => {
    if (!frames || frames.length < 2) return
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      setFrameIndex((i) => {
        const { next, nextDir } = pingPongNext(i, frames.length, dirRef.current)
        dirRef.current = nextDir
        return next
      })
    }, FRAME_INTERVAL_MS)
    return () => clearInterval(id)
  }, [frames])

  if (!exercise) return null

  if (frames && !frameError) {
    return (
      <div className="demo-frames">
        <img
          key={frameIndex}
          src={frames[frameIndex]}
          alt={`${exercise.name} — animación`}
          className="demo-frame-img"
          loading="lazy"
          onError={() => setFrameError(true)}
        />
        <span className="demo-credit">
          Ilustraciones:{' '}
          <a href="https://github.com/bryllim/workout-guide" target="_blank" rel="noreferrer">
            Workout Guide
          </a>{' '}
          (CC BY-SA 4.0)
        </span>
      </div>
    )
  }

  if (frames && frameError) {
    return <div className="demo-frames demo-frame-fallback">{exercise.name?.[0] ?? '?'}</div>
  }

  const legacy = getExerciseDemo(exercise.id)
  if (!legacy) return null

  return (
    <div className="demo-wrap">
      <div className="demo-shot">
        <img src={legacy.start} alt={`${exercise.name} — posición inicial`} loading="lazy" />
        <span className="demo-label">Inicio</span>
      </div>
      <div className="demo-shot">
        <img src={legacy.end} alt={`${exercise.name} — posición final`} loading="lazy" />
        <span className="demo-label">Fin</span>
      </div>
    </div>
  )
}

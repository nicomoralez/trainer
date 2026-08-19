import { useEffect, useRef, useState } from 'react'

export function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(target ?? 0)
  const prevRef = useRef(target ?? 0)
  const frameRef = useRef()

  useEffect(() => {
    const from = prevRef.current
    const to = typeof target === 'number' && !Number.isNaN(target) ? target : 0

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (from === to || prefersReduced) {
      setValue(to)
      prevRef.current = to
      return
    }

    const start = performance.now()
    function tick(now) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setValue(from + (to - from) * eased)
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        prevRef.current = to
      }
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])

  return value
}

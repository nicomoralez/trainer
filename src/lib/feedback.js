// Sonido y vibración generados en el momento (Web Audio API), sin archivos
// de audio que descargar — así no pesa nada en el hosting.

let audioCtx

function getCtx() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) audioCtx = new Ctx()
  return audioCtx
}

export function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern)
}

function beep(freq, duration, volume = 0.15, delay = 0) {
  const ctx = getCtx()
  if (!ctx) return
  const start = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  osc.connect(gain)
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.start(start)
  osc.stop(start + duration)
}

export function feedbackSetDone() {
  vibrate(30)
  beep(660, 0.12)
}

export function feedbackWorkoutDone() {
  vibrate([40, 60, 40, 60, 80])
  beep(523, 0.14)
  beep(784, 0.18, 0.15, 0.14)
}

export function feedbackPR() {
  vibrate([30, 40, 30, 40, 30, 40, 100])
  beep(659, 0.12, 0.16)
  beep(880, 0.16, 0.16, 0.13)
  beep(1046, 0.22, 0.16, 0.28)
}

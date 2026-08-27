// Fotos reales de demostración por ejercicio — no las generamos nosotros:
// vienen de free-exercise-db (dominio público, licencia Unlicense, sin API
// key ni límites de uso): https://github.com/yuhonas/free-exercise-db
// Cada entrada mapea nuestro id (src/data/exercises.js) al id de ese
// dataset, que tiene 2 fotos por ejercicio (posición inicial y final) que
// se sirven directo desde GitHub. Los ejercicios sin match razonable (por
// ejemplo variantes muy específicas que no están en el dataset) quedan
// afuera a propósito antes que mostrar una foto que no corresponde.

const BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'

const DEMO_IDS = {
  'press-banca-barra': 'Barbell_Bench_Press_-_Medium_Grip',
  'press-banca-mancuernas': 'Dumbbell_Bench_Press',
  'press-inclinado-mancuernas': 'Incline_Dumbbell_Press',
  flexiones: 'Pushups',
  'flexiones-declinadas': 'Decline_Push-Up',
  'aperturas-mancuernas': 'Dumbbell_Flyes',
  'press-banda': 'Bench_Press_-_With_Bands',

  dominadas: 'Pullups',
  'remo-barra': 'Bent_Over_Barbell_Row',
  'peso-muerto-barra': 'Barbell_Deadlift',
  'remo-mancuerna': 'One-Arm_Dumbbell_Row',
  'jalon-polea': 'Wide-Grip_Lat_Pulldown',
  'remo-invertido': 'Inverted_Row',
  'remo-kettlebell': 'Two-Arm_Kettlebell_Row',
  superman: 'Superman',
  'remo-invertido-mesa': 'Inverted_Row',

  'press-militar-barra': 'Standing_Military_Press',
  'press-militar-mancuernas': 'Dumbbell_Shoulder_Press',
  'elevaciones-laterales': 'Side_Lateral_Raise',
  'press-militar-kettlebell': 'Two-Arm_Kettlebell_Military_Press',
  'face-pull-banda': 'Face_Pull',

  'fondos-banco': 'Bench_Dips',
  'fondos-sillas': 'Bench_Dips',
  'extension-triceps-mancuerna': 'Standing_Dumbbell_Triceps_Extension',

  'curl-biceps-barra': 'Barbell_Curl',
  'curl-biceps-mancuernas': 'Dumbbell_Bicep_Curl',

  'sentadilla-barra': 'Barbell_Squat',
  'peso-muerto-rumano-barra': 'Romanian_Deadlift',
  'sentadilla-goblet': 'Goblet_Squat',
  'sentadilla-bulgara': 'Split_Squat_with_Dumbbells',
  'peso-muerto-rumano-mancuernas': 'Stiff-Legged_Dumbbell_Deadlift',
  'zancadas-mancuernas': 'Dumbbell_Lunges',
  'swing-kettlebell': 'One-Arm_Kettlebell_Swings',
  'sentadilla-banda': 'Squats_-_With_Bands',
  'zancadas-peso-corporal': 'Bodyweight_Walking_Lunge',
  'sentadilla-peso-corporal': 'Bodyweight_Squat',
  'puente-gluteo': 'Single_Leg_Glute_Bridge',
  'elevacion-talones-mancuernas': 'Standing_Dumbbell_Calf_Raise',
  'sentadilla-bulgara-silla': 'Split_Squats',
  'salto-sentadilla': 'Freehand_Jump_Squat',

  plancha: 'Plank',
  'crunch-abdominal': 'Crunches',
  'elevacion-piernas-acostado': 'Flat_Bench_Lying_Leg_Raise',
  'elevacion-piernas-colgado': 'Hanging_Leg_Raise',
}

// Devuelve las URLs de las 2 fotos (inicio/fin) para un ejercicio, o null
// si no tenemos un match confiable en el dataset.
export function getExerciseDemo(exerciseId) {
  const demoId = DEMO_IDS[exerciseId]
  if (!demoId) return null
  return {
    start: `${BASE_URL}/${demoId}/0.jpg`,
    end: `${BASE_URL}/${demoId}/1.jpg`,
  }
}

// ---------------------------------------------------------------------------
// Frames SVG — @bryllim/workout-guide (302 ejercicios, 3 frames c/u, 512×512,
// transparentes): https://github.com/bryllim/workout-guide
// Código y manifest: MIT. Los assets (los SVG en sí) son CC BY-SA 4.0 —
// requieren atribución visible en la app y, si se modifican/redistribuyen,
// mantener la misma licencia. Ver ATTRIBUTION.md del repo. Se sirven directo
// desde GitHub (sin copia local), igual que los DEMO_IDS de arriba.
//
// `demoSlug` en src/data/exercises.js es el slug del ejercicio en ese
// repo (ej. 'bench-press'), no nuestro `id`. Cubre ~la mitad del catálogo
// hoy — el resto son ejercicios "custom" nuestros sin equivalente en la
// librería (quedan sin frames, no sin cues).

const FRAMES_BASE_URL = 'https://raw.githubusercontent.com/bryllim/workout-guide/main/packages/workout-guide/assets'
const FRAME_COUNT = 3

// Devuelve las 3 URLs (secuencia de inicio a fin) de los frames SVG de un
// ejercicio a partir de su `demoSlug` (ver src/data/exercises.js), o null
// si el ejercicio no tiene uno (sin match en la librería).
export function getExerciseFrames(demoSlug) {
  if (!demoSlug) return null
  return Array.from({ length: FRAME_COUNT }, (_, i) => `${FRAMES_BASE_URL}/${demoSlug}/frame-${i + 1}.svg`)
}

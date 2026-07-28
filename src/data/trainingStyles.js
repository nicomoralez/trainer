// Estilos de rutina disponibles. Cada uno define la secuencia de días que se
// repite según cuántos días por semana entrena el usuario (ver
// src/lib/routineGenerator.js). `muscles` es la lista de grupos musculares
// (ver src/data/exercises.js) de los que se eligen los ejercicios de ese día.

export const TRAINING_STYLES = {
  ppl: {
    id: 'ppl',
    label: 'Push / Pull / Legs',
    description: 'El clásico: empuje, tracción y pierna. Ideal de 3 a 6 días.',
    days: [
      { type: 'push', label: 'Push', muscles: ['chest', 'shoulders', 'triceps'] },
      { type: 'pull', label: 'Pull', muscles: ['back', 'biceps'] },
      { type: 'legs', label: 'Legs', muscles: ['legs'] },
    ],
  },
  upper_lower: {
    id: 'upper_lower',
    label: 'Torso / Pierna',
    description: 'Todo el tren superior un día, pierna al otro. Ideal de 2 a 4 días.',
    days: [
      { type: 'upper', label: 'Torso', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
      { type: 'lower', label: 'Pierna', muscles: ['legs', 'abs'] },
    ],
  },
  full_body: {
    id: 'full_body',
    label: 'Full Body',
    description: 'Cuerpo completo cada sesión, un compuesto por grupo grande. Ideal de 2 a 3 días.',
    days: [{ type: 'full', label: 'Full Body', muscles: ['legs', 'back', 'chest', 'shoulders', 'abs'] }],
  },
  bro_split: {
    id: 'bro_split',
    label: 'Por grupo muscular',
    description: 'Un foco distinto cada día, más volumen por músculo. Ideal de 4 a 6 días.',
    days: [
      { type: 'legs', label: 'Piernas', muscles: ['legs'] },
      { type: 'chest_shoulders', label: 'Pecho y hombro', muscles: ['chest', 'shoulders'] },
      { type: 'back_biceps', label: 'Espalda y bíceps', muscles: ['back', 'biceps'] },
      { type: 'shoulders_abs', label: 'Hombros y abdominales', muscles: ['shoulders', 'abs'] },
      { type: 'arms', label: 'Brazos', muscles: ['biceps', 'triceps'] },
    ],
  },
}

export const TRAINING_STYLE_LIST = Object.values(TRAINING_STYLES)

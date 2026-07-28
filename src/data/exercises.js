// Catálogo estático de ejercicios. No vive en la base de datos porque no
// cambia por usuario: el equipamiento de cada usuario solo filtra esta lista.
//
// equipment: tags que hacen falta para poder hacer el ejercicio (AND lógico).
// Un ejercicio con equipment: [] siempre está disponible (peso corporal).

export const EXERCISES = [
  // ---------- PUSH: pecho, hombro, tríceps ----------
  { id: 'press-banca-barra', name: 'Press banca con barra', split: 'push', equipment: ['barbell', 'bench'] },
  { id: 'press-banca-mancuernas', name: 'Press banca con mancuernas', split: 'push', equipment: ['dumbbells', 'bench'] },
  { id: 'press-militar-barra', name: 'Press militar con barra', split: 'push', equipment: ['barbell'] },
  { id: 'press-militar-mancuernas', name: 'Press militar con mancuernas', split: 'push', equipment: ['dumbbells'] },
  { id: 'press-inclinado-mancuernas', name: 'Press inclinado con mancuernas', split: 'push', equipment: ['dumbbells', 'bench'] },
  { id: 'fondos-banco', name: 'Fondos en banco', split: 'push', equipment: ['bench'] },
  { id: 'flexiones', name: 'Flexiones de brazos', split: 'push', equipment: [] },
  { id: 'flexiones-diamante', name: 'Flexiones diamante (tríceps)', split: 'push', equipment: [] },
  { id: 'flexiones-pike', name: 'Flexiones pike (hombro)', split: 'push', equipment: [] },
  { id: 'flexiones-declinadas', name: 'Flexiones declinadas (pies elevados)', split: 'push', equipment: [] },
  { id: 'fondos-sillas', name: 'Fondos entre dos sillas', split: 'push', equipment: [] },
  { id: 'aperturas-mancuernas', name: 'Aperturas con mancuernas', split: 'push', equipment: ['dumbbells', 'bench'] },
  { id: 'elevaciones-laterales', name: 'Elevaciones laterales', split: 'push', equipment: ['dumbbells'] },
  { id: 'extension-triceps-mancuerna', name: 'Extensión de tríceps con mancuerna', split: 'push', equipment: ['dumbbells'] },
  { id: 'press-militar-kettlebell', name: 'Press militar con kettlebell', split: 'push', equipment: ['kettlebell'] },
  { id: 'press-banda', name: 'Press con banda elástica', split: 'push', equipment: ['bands'] },

  // ---------- PULL: espalda, bíceps ----------
  { id: 'dominadas', name: 'Dominadas', split: 'pull', equipment: ['pullup_bar'] },
  { id: 'remo-barra', name: 'Remo con barra', split: 'pull', equipment: ['barbell'] },
  { id: 'peso-muerto-barra', name: 'Peso muerto con barra', split: 'pull', equipment: ['barbell'] },
  { id: 'remo-mancuerna', name: 'Remo con mancuerna a una mano', split: 'pull', equipment: ['dumbbells', 'bench'] },
  { id: 'jalon-polea', name: 'Jalón al pecho en polea', split: 'pull', equipment: ['cable'] },
  { id: 'remo-invertido', name: 'Remo invertido en barra', split: 'pull', equipment: ['pullup_bar'] },
  { id: 'remo-banda', name: 'Remo con banda elástica', split: 'pull', equipment: ['bands'] },
  { id: 'face-pull-banda', name: 'Face pull con banda', split: 'pull', equipment: ['bands'] },
  { id: 'curl-biceps-barra', name: 'Curl de bíceps con barra', split: 'pull', equipment: ['barbell'] },
  { id: 'curl-biceps-mancuernas', name: 'Curl de bíceps con mancuernas', split: 'pull', equipment: ['dumbbells'] },
  { id: 'remo-kettlebell', name: 'Remo con kettlebell', split: 'pull', equipment: ['kettlebell'] },
  { id: 'superman', name: 'Superman (extensión lumbar)', split: 'pull', equipment: [] },
  { id: 'remo-invertido-mesa', name: 'Remo invertido en mesa resistente', split: 'pull', equipment: [] },
  { id: 'retraccion-escapular', name: 'Retracción escapular en el piso', split: 'pull', equipment: [] },

  // ---------- LEGS: pierna completa ----------
  { id: 'sentadilla-barra', name: 'Sentadilla con barra', split: 'legs', equipment: ['barbell'] },
  { id: 'peso-muerto-rumano-barra', name: 'Peso muerto rumano con barra', split: 'legs', equipment: ['barbell'] },
  { id: 'sentadilla-goblet', name: 'Sentadilla goblet con mancuerna', split: 'legs', equipment: ['dumbbells'] },
  { id: 'sentadilla-bulgara', name: 'Sentadilla búlgara con mancuernas', split: 'legs', equipment: ['dumbbells', 'bench'] },
  { id: 'peso-muerto-rumano-mancuernas', name: 'Peso muerto rumano con mancuernas', split: 'legs', equipment: ['dumbbells'] },
  { id: 'zancadas-mancuernas', name: 'Zancadas con mancuernas', split: 'legs', equipment: ['dumbbells'] },
  { id: 'swing-kettlebell', name: 'Swing con kettlebell', split: 'legs', equipment: ['kettlebell'] },
  { id: 'sentadilla-banda', name: 'Sentadilla con banda elástica', split: 'legs', equipment: ['bands'] },
  { id: 'zancadas-peso-corporal', name: 'Zancadas sin peso', split: 'legs', equipment: [] },
  { id: 'sentadilla-peso-corporal', name: 'Sentadilla sin peso', split: 'legs', equipment: [] },
  { id: 'puente-gluteo', name: 'Puente de glúteo', split: 'legs', equipment: [] },
  { id: 'elevacion-talones-mancuernas', name: 'Elevación de talones con mancuernas', split: 'legs', equipment: ['dumbbells'] },
  { id: 'sentadilla-bulgara-silla', name: 'Sentadilla búlgara sin peso (silla)', split: 'legs', equipment: [] },
  { id: 'peso-muerto-pierna-sin-peso', name: 'Peso muerto a una pierna sin peso', split: 'legs', equipment: [] },
  { id: 'elevacion-talones-sin-peso', name: 'Elevación de talones sin peso', split: 'legs', equipment: [] },
  { id: 'sentadilla-pared', name: 'Sentadilla isométrica en pared', split: 'legs', equipment: [] },
  { id: 'salto-sentadilla', name: 'Salto en sentadilla', split: 'legs', equipment: [] },
]

export const EXERCISES_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))

export const SPLIT_LABEL = { push: 'Push', pull: 'Pull', legs: 'Legs' }

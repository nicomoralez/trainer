// Catálogo estático de ejercicios. No vive en la base de datos porque no
// cambia por usuario: el equipamiento de cada usuario solo filtra esta lista.
//
// muscle: grupo muscular principal — chest, back, shoulders, biceps,
//   triceps, legs o abs. Los estilos de rutina (src/data/trainingStyles.js)
//   combinan estos grupos para armar cada día.
// equipment: tags que hacen falta para poder hacer el ejercicio (AND lógico).
//   Un ejercicio con equipment: [] siempre está disponible (peso corporal).
// cues: 2-3 tips de técnica cortos, se muestran en Entrenar.

export const EXERCISES = [
  // ---------- CHEST: pecho ----------
  {
    id: 'press-banca-barra',
    name: 'Press banca con barra',
    muscle: 'chest',
    equipment: ['barbell', 'bench'],
    cues: ['Bajá la barra hasta rozar el pecho', 'Codos a ~45° del torso, no pegados al cuerpo', 'Empujá con los talones apoyados en el piso'],
  },
  {
    id: 'press-banca-mancuernas',
    name: 'Press banca con mancuernas',
    muscle: 'chest',
    equipment: ['dumbbells', 'bench'],
    cues: ['Bajá las mancuernas a la altura del pecho', 'Muñecas firmes, no las dejes caer hacia atrás', 'Extendé sin trabar los codos arriba'],
  },
  {
    id: 'press-inclinado-mancuernas',
    name: 'Press inclinado con mancuernas',
    muscle: 'chest',
    equipment: ['dumbbells', 'bench'],
    cues: ['Banco a 30-45°, no más', 'Bajá controlado hasta sentir el estiramiento en el pecho', 'Empujá hacia arriba y adentro'],
  },
  {
    id: 'flexiones',
    name: 'Flexiones de brazos',
    muscle: 'chest',
    equipment: [],
    cues: ['Cuerpo en línea recta de cabeza a talones', 'Bajá hasta que el pecho casi toque el piso', 'Codos a 45° del torso'],
  },
  {
    id: 'flexiones-declinadas',
    name: 'Flexiones declinadas (pies elevados)',
    muscle: 'chest',
    equipment: [],
    cues: ['Pies apoyados en una silla o banco', 'Manos un poco más separadas que el ancho de hombros', 'Cuerpo recto, sin hundir la cadera'],
  },
  {
    id: 'aperturas-mancuernas',
    name: 'Aperturas con mancuernas',
    muscle: 'chest',
    equipment: ['dumbbells', 'bench'],
    cues: ['Codos con una leve flexión fija durante todo el movimiento', 'Abrí los brazos como abrazando un árbol', 'No bajes más de la altura del pecho'],
  },
  {
    id: 'press-banda',
    name: 'Press con banda elástica',
    muscle: 'chest',
    equipment: ['bands'],
    cues: ['Anclá la banda detrás tuyo a la altura del pecho', 'Dá un paso adelante para generar tensión constante', 'Extendé completo sin encoger los hombros'],
  },

  // ---------- BACK: espalda ----------
  {
    id: 'dominadas',
    name: 'Dominadas',
    muscle: 'back',
    equipment: ['pullup_bar'],
    cues: ['Agarre un poco más ancho que los hombros', 'Subí hasta que el mentón pase la barra', 'Bajá controlado hasta extender los brazos'],
  },
  {
    id: 'remo-barra',
    name: 'Remo con barra',
    muscle: 'back',
    equipment: ['barbell'],
    cues: ['Espalda recta, torso inclinado ~45°', 'Llevá la barra hacia el abdomen, no al pecho', 'Apretá los omóplatos en la parte alta'],
  },
  {
    id: 'peso-muerto-barra',
    name: 'Peso muerto con barra',
    muscle: 'back',
    equipment: ['barbell'],
    cues: ['Barra pegada a las piernas todo el recorrido', 'Espalda neutra, no redondeada', 'Empujá el piso con los talones para levantarte'],
  },
  {
    id: 'remo-mancuerna',
    name: 'Remo con mancuerna a una mano',
    muscle: 'back',
    equipment: ['dumbbells', 'bench'],
    cues: ['Apoyá una rodilla y mano en el banco', 'Llevá el codo hacia atrás pegado al cuerpo', 'Evitá rotar el torso al final del movimiento'],
  },
  {
    id: 'jalon-polea',
    name: 'Jalón al pecho en polea',
    muscle: 'back',
    equipment: ['cable'],
    cues: ['Agarre un poco más ancho que los hombros', 'Llevá la barra hacia la parte alta del pecho', 'Sacá pecho, no te tires hacia atrás con todo el cuerpo'],
  },
  {
    id: 'remo-invertido',
    name: 'Remo invertido en barra',
    muscle: 'back',
    equipment: ['pullup_bar'],
    cues: ['Barra a la altura de la cintura, cuerpo recto debajo', 'Tirá el pecho hacia la barra', 'Cuanto más horizontal el cuerpo, más difícil'],
  },
  {
    id: 'remo-banda',
    name: 'Remo con banda elástica',
    muscle: 'back',
    equipment: ['bands'],
    cues: ['Anclá la banda adelante a la altura del pecho', 'Codos pegados al cuerpo al tirar', 'Apretá los omóplatos al final'],
  },
  {
    id: 'remo-kettlebell',
    name: 'Remo con kettlebell',
    muscle: 'back',
    equipment: ['kettlebell'],
    cues: ['Bisagra de cadera, espalda neutra', 'Tirá el codo hacia atrás pegado al cuerpo', 'Controlá la bajada, no la sueltes'],
  },
  {
    id: 'superman',
    name: 'Superman (extensión lumbar)',
    muscle: 'back',
    equipment: [],
    cues: ['Acostado boca abajo, brazos extendidos adelante', 'Levantá brazos y piernas a la vez', 'Sostené 1-2 segundos arriba'],
  },
  {
    id: 'remo-invertido-mesa',
    name: 'Remo invertido en mesa resistente',
    muscle: 'back',
    equipment: [],
    cues: ['Acostate debajo de una mesa firme, agarrando el borde', 'Tirá el pecho hacia la mesa', 'Cuerpo recto de la cabeza a los talones'],
  },
  {
    id: 'retraccion-escapular',
    name: 'Retracción escapular en el piso',
    muscle: 'back',
    equipment: [],
    cues: ['Boca abajo, brazos en forma de W', 'Apretá los omóplatos entre sí', 'Movimiento chico, con foco en la contracción'],
  },

  // ---------- SHOULDERS: hombro ----------
  {
    id: 'press-militar-barra',
    name: 'Press militar con barra',
    muscle: 'shoulders',
    equipment: ['barbell'],
    cues: ['Arrancá con la barra a la altura de los hombros', 'Apretá glúteos y abdomen para no arquear la espalda', 'Empujá hacia arriba y un poco atrás para esquivar la cara'],
  },
  {
    id: 'press-militar-mancuernas',
    name: 'Press militar con mancuernas',
    muscle: 'shoulders',
    equipment: ['dumbbells'],
    cues: ['Codos ligeramente adelante del cuerpo', 'No arquees la zona lumbar', 'Subí hasta casi extender el codo'],
  },
  {
    id: 'elevaciones-laterales',
    name: 'Elevaciones laterales',
    muscle: 'shoulders',
    equipment: ['dumbbells'],
    cues: ['Levantá los brazos hasta la altura de los hombros, no más', 'Liderá con los codos, no con las manos', 'Bajá controlado, sin usar impulso'],
  },
  {
    id: 'press-militar-kettlebell',
    name: 'Press militar con kettlebell',
    muscle: 'shoulders',
    equipment: ['kettlebell'],
    cues: ['Apoyá la pesa contra el antebrazo (rack position)', 'Empujá derecho hacia arriba, no hacia adelante', 'Abdomen firme durante todo el movimiento'],
  },
  {
    id: 'flexiones-pike',
    name: 'Flexiones pike (hombro)',
    muscle: 'shoulders',
    equipment: [],
    cues: ['Cadera bien elevada, forma de V invertida', 'Mirá hacia tus pies, no hacia adelante', 'Bajá la cabeza entre las manos como en un press de hombro'],
  },
  {
    id: 'face-pull-banda',
    name: 'Face pull con banda',
    muscle: 'shoulders',
    equipment: ['bands'],
    cues: ['Anclá la banda a la altura de la cara', 'Tirá separando las manos hacia las orejas', 'Codos altos, a la altura de los hombros'],
  },

  // ---------- TRICEPS ----------
  {
    id: 'fondos-banco',
    name: 'Fondos en banco',
    muscle: 'triceps',
    equipment: ['bench'],
    cues: ['Manos en el borde del banco, dedos hacia adelante', 'Bajá flexionando los codos hacia atrás, no hacia los costados', 'Hombros lejos de las orejas'],
  },
  {
    id: 'flexiones-diamante',
    name: 'Flexiones diamante (tríceps)',
    muscle: 'triceps',
    equipment: [],
    cues: ['Manos juntas formando un diamante con pulgares e índices', 'Codos pegados al cuerpo al bajar', 'Más exigente para el tríceps que la flexión clásica'],
  },
  {
    id: 'fondos-sillas',
    name: 'Fondos entre dos sillas',
    muscle: 'triceps',
    equipment: [],
    cues: ['Una mano en cada silla, piernas estiradas adelante', 'Bajá controlado hasta 90° de codo', 'Hombros lejos de las orejas todo el tiempo'],
  },
  {
    id: 'extension-triceps-mancuerna',
    name: 'Extensión de tríceps con mancuerna',
    muscle: 'triceps',
    equipment: ['dumbbells'],
    cues: ['Codo fijo apuntando al techo', 'Bajá la mancuerna detrás de la cabeza, controlado', 'Extendé sin trabar bruscamente el codo'],
  },

  // ---------- BICEPS ----------
  {
    id: 'curl-biceps-barra',
    name: 'Curl de bíceps con barra',
    muscle: 'biceps',
    equipment: ['barbell'],
    cues: ['Codos fijos pegados al torso', 'Subí sin balancear el cuerpo', 'Bajá controlado hasta casi extender del todo'],
  },
  {
    id: 'curl-biceps-mancuernas',
    name: 'Curl de bíceps con mancuernas',
    muscle: 'biceps',
    equipment: ['dumbbells'],
    cues: ['Codos pegados al cuerpo todo el recorrido', 'Podés rotar la muñeca (supinar) al subir', 'Evitá el impulso con la espalda'],
  },

  // ---------- LEGS: pierna completa ----------
  {
    id: 'sentadilla-barra',
    name: 'Sentadilla con barra',
    muscle: 'legs',
    equipment: ['barbell'],
    cues: ['Barra apoyada en la parte alta de la espalda', 'Rodillas en línea con la punta de los pies', 'Bajá hasta que el muslo pase de paralelo si podés'],
  },
  {
    id: 'peso-muerto-rumano-barra',
    name: 'Peso muerto rumano con barra',
    muscle: 'legs',
    equipment: ['barbell'],
    cues: ['Piernas casi rectas, leve flexión de rodilla', 'Bisagra de cadera, barra pegada a las piernas', 'Sentí el estiramiento en isquios, no redondees la espalda'],
  },
  {
    id: 'sentadilla-goblet',
    name: 'Sentadilla goblet con mancuerna',
    muscle: 'legs',
    equipment: ['dumbbells'],
    cues: ['Sostené la mancuerna contra el pecho con ambas manos', 'Codos entre las rodillas al bajar', 'Torso lo más vertical posible'],
  },
  {
    id: 'sentadilla-bulgara',
    name: 'Sentadilla búlgara con mancuernas',
    muscle: 'legs',
    equipment: ['dumbbells', 'bench'],
    cues: ['Pie de atrás apoyado en el banco', 'Bajá recto, no hacia adelante', 'La mayoría del peso en la pierna de adelante'],
  },
  {
    id: 'peso-muerto-rumano-mancuernas',
    name: 'Peso muerto rumano con mancuernas',
    muscle: 'legs',
    equipment: ['dumbbells'],
    cues: ['Mancuernas pegadas a las piernas', 'Bisagra de cadera, rodillas casi fijas', 'Espalda neutra todo el recorrido'],
  },
  {
    id: 'zancadas-mancuernas',
    name: 'Zancadas con mancuernas',
    muscle: 'legs',
    equipment: ['dumbbells'],
    cues: ['Paso largo, rodilla de atrás casi toca el piso', 'Torso erguido durante todo el movimiento', 'Empujá con el talón de adelante para volver'],
  },
  {
    id: 'swing-kettlebell',
    name: 'Swing con kettlebell',
    muscle: 'legs',
    equipment: ['kettlebell'],
    cues: ['Bisagra de cadera, no sentadilla', 'Impulso con la cadera, no con los brazos', 'Apretá glúteos fuerte arriba del movimiento'],
  },
  {
    id: 'sentadilla-banda',
    name: 'Sentadilla con banda elástica',
    muscle: 'legs',
    equipment: ['bands'],
    cues: ['Banda debajo de los pies y sobre los hombros', 'Bajá controlado contra la resistencia', 'Rodillas afuera, en línea con los pies'],
  },
  {
    id: 'zancadas-peso-corporal',
    name: 'Zancadas sin peso',
    muscle: 'legs',
    equipment: [],
    cues: ['Paso largo hacia adelante', 'Bajá hasta que ambas rodillas estén casi a 90°', 'Torso derecho, sin inclinarte adelante'],
  },
  {
    id: 'sentadilla-peso-corporal',
    name: 'Sentadilla sin peso',
    muscle: 'legs',
    equipment: [],
    cues: ['Pies al ancho de los hombros', 'Bajá como si te sentaras en una silla', 'Rodillas alineadas con los pies, sin colapsar hacia adentro'],
  },
  {
    id: 'puente-gluteo',
    name: 'Puente de glúteo',
    muscle: 'legs',
    equipment: [],
    cues: ['Acostado, pies apoyados cerca de los glúteos', 'Empujá con los talones y apretá glúteos arriba', 'Evitá arquear de más la zona lumbar'],
  },
  {
    id: 'elevacion-talones-mancuernas',
    name: 'Elevación de talones con mancuernas',
    muscle: 'legs',
    equipment: ['dumbbells'],
    cues: ['Subí lo más alto posible en la punta de los pies', 'Bajá controlado sin rebotar', 'Sostené 1 segundo arriba'],
  },
  {
    id: 'sentadilla-bulgara-silla',
    name: 'Sentadilla búlgara sin peso (silla)',
    muscle: 'legs',
    equipment: [],
    cues: ['Pie de atrás apoyado en una silla', 'Bajá recto controlando el equilibrio', 'Podés apoyarte en una pared si hace falta'],
  },
  {
    id: 'peso-muerto-pierna-sin-peso',
    name: 'Peso muerto a una pierna sin peso',
    muscle: 'legs',
    equipment: [],
    cues: ['Apoyate en una pared o silla si necesitás equilibrio', 'Bisagra de cadera con una sola pierna', 'Espalda recta, mirá al frente'],
  },
  {
    id: 'elevacion-talones-sin-peso',
    name: 'Elevación de talones sin peso',
    muscle: 'legs',
    equipment: [],
    cues: ['De pie, subí a la punta de los pies', 'Bajá controlado sin rebotar', 'Podés hacerlo a una pierna para más exigencia'],
  },
  {
    id: 'sentadilla-pared',
    name: 'Sentadilla isométrica en pared',
    muscle: 'legs',
    equipment: [],
    cues: ['Espalda apoyada contra la pared', 'Muslos paralelos al piso, rodillas a 90°', 'Sostené el tiempo que puedas, es isométrico'],
  },
  {
    id: 'salto-sentadilla',
    name: 'Salto en sentadilla',
    muscle: 'legs',
    equipment: [],
    cues: ['Bajá como en una sentadilla normal', 'Saltá explosivo hacia arriba', 'Aterrizá suave, flexionando las rodillas'],
  },

  // ---------- ABS: abdominales ----------
  {
    id: 'plancha',
    name: 'Plancha abdominal',
    muscle: 'abs',
    equipment: [],
    cues: ['Antebrazos y puntas de pie apoyados', 'Cuerpo en línea recta, sin levantar la cadera', 'Apretá abdomen y glúteos durante todo el tiempo'],
  },
  {
    id: 'plancha-lateral',
    name: 'Plancha lateral',
    muscle: 'abs',
    equipment: [],
    cues: ['Apoyo en un antebrazo, cuerpo en línea recta de costado', 'Cadera arriba, sin dejarla caer', 'Sostené el tiempo que puedas de cada lado'],
  },
  {
    id: 'abdominales-bicicleta',
    name: 'Abdominales bicicleta',
    muscle: 'abs',
    equipment: [],
    cues: ['Codo hacia la rodilla contraria, alternando', 'Movimiento controlado, no tironees del cuello', 'Exhalá al contraer'],
  },
  {
    id: 'crunch-abdominal',
    name: 'Crunch abdominal',
    muscle: 'abs',
    equipment: [],
    cues: ['Rodillas flexionadas, pies apoyados', 'Subí solo los omóplatos del piso', 'Foco en contraer el abdomen, no en tirar del cuello'],
  },
  {
    id: 'elevacion-piernas-acostado',
    name: 'Elevación de piernas acostado',
    muscle: 'abs',
    equipment: [],
    cues: ['Acostado boca arriba, manos bajo la zona lumbar', 'Subí las piernas rectas sin despegar la espalda del piso', 'Bajá controlado sin tocar el piso del todo'],
  },
  {
    id: 'elevacion-piernas-colgado',
    name: 'Elevación de piernas colgado',
    muscle: 'abs',
    equipment: ['pullup_bar'],
    cues: ['Colgado de la barra, brazos extendidos', 'Subí las piernas sin balancear el cuerpo', 'Bajá controlado, no dejes caer las piernas'],
  },
]

export const EXERCISES_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))

export const MUSCLE_LABEL = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombro',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  legs: 'Pierna',
  abs: 'Abdomen',
}

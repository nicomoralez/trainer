// Preferencia de género para el diagrama corporal — se guarda en el
// dispositivo, no en el perfil, así el usuario la cambia libremente sin
// que dependa de la base de datos.

const KEY = 'trainer.bodyDiagramGender'

export function getGenderPref() {
  try {
    return localStorage.getItem(KEY) === 'female' ? 'female' : 'male'
  } catch {
    return 'male'
  }
}

export function setGenderPref(value) {
  try {
    localStorage.setItem(KEY, value)
  } catch {
    // localStorage no disponible (modo privado, etc.) — no es crítico.
  }
}

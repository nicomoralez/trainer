import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { fetchProfile } from './profile'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(undefined) // undefined = cargando, null = sin perfil todavía
  const [error, setError] = useState('')

  async function refresh() {
    try {
      const p = await fetchProfile(user.id)
      setProfile(p)
      return p
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    refresh().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  if (error) {
    return (
      <div className="centered-loading" style={{ flexDirection: 'column', gap: 8, textAlign: 'center', padding: 24 }}>
        <span>No pudimos cargar tu perfil.</span>
        <span style={{ color: 'var(--danger)' }}>{error}</span>
      </div>
    )
  }

  return (
    <ProfileContext.Provider value={{ profile, loading: profile === undefined, refresh }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  return useContext(ProfileContext)
}

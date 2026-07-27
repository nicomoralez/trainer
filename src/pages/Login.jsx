import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    const { error } = mode === 'signin' ? await signIn(email, password) : await signUp(email, password)
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    if (mode === 'signup') {
      setInfo('Cuenta creada. Si tu proyecto de Supabase pide confirmar el email, revisá tu bandeja de entrada.')
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <span className="eyebrow">Tu Personal Trainer</span>
        <h1>{mode === 'signin' ? 'Iniciá sesión' : 'Creá tu cuenta'}</h1>
        <p className="sub">
          {mode === 'signin'
            ? 'Entrá para ver tu equipo, tu rutina y tu progreso.'
            : 'Un email y una contraseña alcanzan para empezar.'}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            className="text-input"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className="text-input"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />
          {error && <div className="error-text">{error}</div>}
          {info && <div className="sub" style={{ marginBottom: 16 }}>{info}</div>}
          <button className="btn-primary" type="submit" disabled={busy} style={{ marginBottom: 14 }}>
            {busy ? 'Un momento…' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <button
          className="btn-link"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError('')
            setInfo('')
          }}
        >
          {mode === 'signin' ? '¿No tenés cuenta? Creá una' : '¿Ya tenés cuenta? Iniciá sesión'}
        </button>
      </div>
    </div>
  )
}

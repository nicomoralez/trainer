import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { ProfileProvider, useProfile } from './lib/ProfileContext'
import { supabaseConfigured } from './lib/supabaseClient'
import SetupNeeded from './pages/SetupNeeded'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Inicio from './pages/Inicio'
import Entrenar from './pages/Entrenar'
import Progreso from './pages/Progreso'
import Configuracion from './pages/Configuracion'
import { IconConfig, IconInicio, IconPlay, IconProgreso } from './components/Icons'

function TabBar() {
  const tabs = [
    { to: '/inicio', label: 'Inicio', Icon: IconInicio },
    { to: '/entrenar', label: 'Entrenar', Icon: IconPlay, cta: true },
    { to: '/progreso', label: 'Progreso', Icon: IconProgreso },
    { to: '/configuracion', label: 'Ajustes', Icon: IconConfig },
  ]
  return (
    <nav className="tabbar">
      {tabs.map(({ to, label, Icon, cta }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `tab-btn ${cta ? 'cta' : ''} ${isActive ? 'active' : ''}`}>
          {cta ? (
            <span className="fab">
              <Icon />
            </span>
          ) : (
            <Icon />
          )}
          <span className="tab-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function AppShell() {
  const location = useLocation()
  return (
    <div className="app-shell">
      <main className="app-main">
        <div key={location.pathname} className="page-enter">
          <Routes>
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/entrenar" element={<Entrenar />} />
            <Route path="/progreso" element={<Progreso />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="*" element={<Navigate to="/inicio" replace />} />
          </Routes>
        </div>
      </main>
      <TabBar />
    </div>
  )
}

function ProfileGate() {
  const { profile, loading } = useProfile()
  if (loading) return <div className="centered-loading">Cargando…</div>
  if (!profile) return <Onboarding />
  return <AppShell />
}

function AuthGate() {
  const { user, loading } = useAuth()
  if (loading) return <div className="centered-loading">Cargando…</div>
  if (!user) return <Login />
  return (
    <ProfileProvider>
      <ProfileGate />
    </ProfileProvider>
  )
}

export default function App() {
  if (!supabaseConfigured) return <SetupNeeded />
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </BrowserRouter>
  )
}

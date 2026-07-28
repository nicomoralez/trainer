import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { ProfileProvider, useProfile } from './lib/ProfileContext'
import { supabaseConfigured } from './lib/supabaseClient'
import SetupNeeded from './pages/SetupNeeded'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Inicio from './pages/Inicio'
import Rutina from './pages/Rutina'
import Entrenar from './pages/Entrenar'
import Progreso from './pages/Progreso'
import Configuracion from './pages/Configuracion'
import { IconConfig, IconInicio, IconPlay, IconProgreso, IconRutina } from './components/Icons'

function TabBar() {
  const tabs = [
    { to: '/inicio', label: 'Inicio', Icon: IconInicio },
    { to: '/rutina', label: 'Rutina', Icon: IconRutina },
    { to: '/entrenar', label: 'Entrenar', Icon: IconPlay },
    { to: '/progreso', label: 'Progreso', Icon: IconProgreso },
    { to: '/configuracion', label: 'Config.', Icon: IconConfig },
  ]
  return (
    <nav className="tabbar">
      {tabs.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
          <Icon />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function AppShell() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Routes>
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/rutina" element={<Rutina />} />
          <Route path="/entrenar" element={<Entrenar />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
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

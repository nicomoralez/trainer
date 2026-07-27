import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { supabaseConfigured } from './lib/supabaseClient'
import SetupNeeded from './pages/SetupNeeded'
import Login from './pages/Login'
import Equipo from './pages/Equipo'
import Rutina from './pages/Rutina'
import Hoy from './pages/Hoy'
import Progreso from './pages/Progreso'
import { IconEquipo, IconHoy, IconProgreso, IconRutina } from './components/Icons'

function TabBar() {
  const tabs = [
    { to: '/equipo', label: 'Equipo', Icon: IconEquipo },
    { to: '/rutina', label: 'Rutina', Icon: IconRutina },
    { to: '/hoy', label: 'Hoy', Icon: IconHoy },
    { to: '/progreso', label: 'Progreso', Icon: IconProgreso },
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
          <Route path="/equipo" element={<Equipo />} />
          <Route path="/rutina" element={<Rutina />} />
          <Route path="/hoy" element={<Hoy />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="*" element={<Navigate to="/hoy" replace />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  )
}

function AuthGate() {
  const { user, loading } = useAuth()
  if (loading) return <div className="centered-loading">Cargando…</div>
  if (!user) return <Login />
  return <AppShell />
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

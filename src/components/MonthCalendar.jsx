import { useEffect, useState } from 'react'
import { fetchMonthActivity } from '../lib/calendar'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function toKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function MonthCalendar({ userId }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [activity, setActivity] = useState({ trained: new Set(), supplements: new Set() })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchMonthActivity(userId, year, month)
      .then((data) => active && setActivity(data))
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [userId, year, month])

  function changeMonth(delta) {
    let m = month + delta
    let y = year
    if (m < 0) {
      m = 11
      y -= 1
    } else if (m > 11) {
      m = 0
      y += 1
    }
    setMonth(m)
    setYear(y)
  }

  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7 // lunes = 0

  const cells = []
  for (let i = 0; i < leadingBlanks; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

  return (
    <div className="chart-card">
      <div className="cal-nav">
        <button type="button" onClick={() => changeMonth(-1)} aria-label="Mes anterior">
          ‹
        </button>
        <div className="ch-title" style={{ marginBottom: 0 }}>
          {MONTH_NAMES[month]} {year}
        </div>
        <button type="button" onClick={() => changeMonth(1)} aria-label="Mes siguiente">
          ›
        </button>
      </div>

      <div className="cal-grid">
        {WEEKDAYS.map((w) => (
          <div className="cal-weekday" key={w}>
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div className="cal-cell empty" key={`b${i}`} />
          const key = toKey(year, month, d)
          const trained = activity.trained.has(key)
          const supplements = activity.supplements.has(key)
          const isToday = isCurrentMonth && d === today.getDate()
          return (
            <div className={`cal-cell ${isToday ? 'today' : ''}`} key={key}>
              <span>{d}</span>
              {(trained || supplements) && (
                <span className="cal-dots">
                  {trained && <span className="cal-dot trained" />}
                  {supplements && <span className="cal-dot supp" />}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="cal-legend">
        <span>
          <span className="cal-dot trained" /> Entrenaste
        </span>
        <span>
          <span className="cal-dot supp" /> Suplementos
        </span>
      </div>
      {loading && <p className="empty-hint" style={{ padding: '8px 0 0' }}>Cargando…</p>}
    </div>
  )
}

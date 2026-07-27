export default function SetupNeeded() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <span className="eyebrow">Falta un paso</span>
        <h1>Conectá tu base de datos</h1>
        <p className="sub">
          Esta app usa Supabase para guardar tu equipo, tu rutina y tu progreso. Todavía no configuraste las
          credenciales.
        </p>
        <ol style={{ color: 'var(--text-dim)', fontSize: '0.88rem', lineHeight: 1.7, paddingLeft: 20 }}>
          <li>
            Creá un proyecto gratis en <strong>supabase.com</strong>.
          </li>
          <li>
            En el SQL Editor del proyecto, corré el archivo <code>supabase/schema.sql</code> de este repo.
          </li>
          <li>
            En Project Settings → API, copiá la <strong>Project URL</strong> y la <strong>anon public key</strong>.
          </li>
          <li>
            Creá un archivo <code>.env.local</code> en la raíz del proyecto (podés copiar <code>.env.example</code>)
            con:
            <pre
              style={{
                background: 'var(--bg-elev)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                padding: 10,
                marginTop: 8,
                fontSize: '0.78rem',
                overflowX: 'auto',
              }}
            >
{`VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key`}
            </pre>
          </li>
          <li>Reiniciá el servidor (`npm run dev`).</li>
        </ol>
      </div>
    </div>
  )
}

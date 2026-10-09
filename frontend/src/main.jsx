import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { isSupabaseConfigured } from './lib/supabase'

function MissingConfig() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 text-neutral-100">
      <div className="max-w-md rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h1 className="text-lg font-semibold">Supabase is not configured</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Set <code className="text-neutral-200">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-neutral-200">VITE_SUPABASE_PUBLISHABLE_KEY</code> in the
          project environment variables, then reload the preview.
        </p>
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isSupabaseConfigured ? <App /> : <MissingConfig />}
  </StrictMode>,
)

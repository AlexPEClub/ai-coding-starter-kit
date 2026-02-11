import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles.css'

// Auto-detect API base from the script tag's src attribute
function getApiBase(): string {
  const scripts = document.querySelectorAll('script[src*="storefinder"]')
  for (const script of scripts) {
    const src = script.getAttribute('src')
    if (src) {
      try {
        const url = new URL(src, window.location.href)
        return url.origin
      } catch { /* ignore */ }
    }
  }
  return window.location.origin
}

function init() {
  const container = document.getElementById('heizmann-storefinder')
  if (!container) {
    console.error('[Heizmann Storefinder] Element #heizmann-storefinder not found')
    return
  }

  const apiBase = getApiBase()
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <App apiBase={apiBase} />
    </React.StrictMode>
  )
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker + background periodic sync
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      // Register periodic background sync (Android Chrome 80+)
      if ('periodicSync' in registration) {
        try {
          const status = await navigator.permissions.query({
            name: 'periodic-background-sync' as PermissionName,
          });
          if (status.state === 'granted') {
            await (registration as unknown as { periodicSync: { register: (tag: string, opts: { minInterval: number }) => Promise<void> } })
              .periodicSync.register('check-alarms', {
                minInterval: 60 * 1000, // Check every minute minimum
              });
          }
        } catch {}
      }

      // Listen for messages from the service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'CHECK_ALARMS') {
          // The SW asked us to check alarms — the interval in alarm.ts handles this
          // This is just a wake-up signal for the tab
        }
      });
    } catch {}
  });
}

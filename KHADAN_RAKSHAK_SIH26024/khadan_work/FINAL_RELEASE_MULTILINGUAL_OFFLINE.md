# Khadan Rakshak — Multilingual + Offline Website Update

## Included
- English/Hindi language toggle now persists via localStorage; key priority workflow headings and buttons have Hindi translations.
- Language changes re-render the currently active checklist/review/close-out screens where applicable.
- PWA manifest, app icons, and service worker registration added.
- Service worker caches the local website shell and selected UI CDN resources after they are first loaded online. API/WebSocket traffic is not cached.
- IndexedDB-based offline inspection submission queue added. If the user submits while offline, the inspection payload is saved locally and a queued status is shown.
- Queue count/status badge and Online/Offline indicator added.
- Pending submissions are automatically retried when the browser emits the `online` event; successful submissions are removed from the queue.

## Out of scope
- Native/mobile app work was not added.
- Offline mode does not make backend dashboards, server-generated reports, OCR, live WebSocket updates, or other server-dependent features available without connectivity.
- Offline queued submission requires the same backend endpoint to be reachable again to sync.

## Run
Serve the `frontend/` directory from localhost or HTTPS (service workers do not run on ordinary insecure LAN/HTTP origins):

```bash
cd frontend
python -m http.server 8080
```

Open `http://localhost:8080/index.html`. The first online visit caches the shell; subsequent offline use can load the cached shell. Browser storage and service worker support are required.

## Validation
- JavaScript syntax checked with `node --check` for app.js, phase3.js, offline-queue.js, and sw.js.
- ZIP integrity checked after packaging.
- A live browser/device offline-sync rehearsal was not performed in this environment; verify with the target browser and backend before the SIH demo.

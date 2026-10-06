# SkipQ frontend

This is the separate React frontend for the ICT381 SkipQ TMA. In the original workspace, read `../QWEN.md` and the canonical briefing `../backend/docs/assessment/qwen-project-context.md`, then the design and implementation plan linked there. If the backend is elsewhere, locate it using the README cross-link; do not invent missing assessment requirements.

Preserve the verified lab adaptation and unrelated changes. Use JavaScript, React 18, React Router 6, Bootstrap and Create React App `react-scripts` 5.0.1. Keep TypeScript 4.9.5 as its compatible build peer. Use Node 22.17.0 from `.nvmrc`, `npm ci`, `npm start` and `npm run build`. The local frontend uses `http://127.0.0.1:5173` and the backend `http://127.0.0.1:5001`; configure the API URL and CORS as documented.

Implement the approved persona flows and shared API/token/error handling from the plan. US10 uses the existing Order List All/Current/Past controls; Past maps to API `view=history`, and historical detail uses purchase snapshots. Clean up three-second polling, guard duplicate checkout and show actionable feedback.

Use backend Python Playwright for assessed browser tests. Sign both roles in through the UI in separate contexts, following the same order. Use locator/expect waits; fixed sleeps and mandatory `networkidle` waits are unsuitable for this polling app. No frontend unit/component suite is requested. Apply `webapp-testing`, `systematic-debugging` and `verification-before-completion` with these project commands, rather than their generic examples.

Capture real persona screenshots and update architecture notes and AI disclosure in the backend. Make local frontend commits after verification. Push/publish/submission requires a separate user instruction. Skills and startup checks do not establish assignment completion or a guaranteed grade.

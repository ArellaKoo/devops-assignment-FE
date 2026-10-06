# SkipQ frontend

Frontend repository: [devops-assignment-FE](https://github.com/ArellaKoo/devops-assignment-FE). Backend: [devops-assignment-BE](https://github.com/ArellaKoo/devops-assignment-BE).

This is the React startup foundation adapted from the StaycationX_Frontend/myReactApp lab. It retains React 18, React Router 6, Bootstrap and Create React App. **The current screen is a SkipQ landing page; diner/vendor sign-in and ordering flows are later plan tasks, not implemented yet.**

## Install and configure

Prerequisites: Node 22.17.0 (in `.nvmrc`), npm 10, and the separate Flask API at `http://127.0.0.1:5001` when the persona flows are implemented.

```bash
nvm install
nvm use
npm ci
cp .env.example .env
```

If Node 22.17.0 is already installed, skip `nvm install`. `.env` configures `REACT_APP_API_BASE_URL`, host and port. The unused lab proxy is removed; the future API client uses the configured backend URL with backend CORS. `src/config.js` and the shared API client will be added with the frontend architecture task; no current page makes an API request.

## Run and build

```bash
npm start
```

Open `http://127.0.0.1:5173`. The local `.env` uses `BROWSER=none`, so startup does not open a browser automatically.

```bash
npm run build
```

CRA uses `build/`; this output and node_modules are ignored. The backend will hold the required Playwright test against the running frontend/API. The TMA does not require a frontend unit/component suite, so the lab's test files/scripts are omitted.

## Adaptation record

Source: [StaycationX_Frontend](https://github.com/ArellaKoo/StaycationX_Frontend), commit `bc3367629ff31b920634dc3c046684f8c3877059`.

The lab's original clean install failed because its lockfile did not match the manifest. Regenerating it exposed a Webpack 4/OpenSSL build failure on Node 22. The adapted manifest uses `react-scripts` 5.0.1 and its Webpack 5 toolchain. TypeScript 4.9.5 is explicitly pinned as a build dependency because npm otherwise selected an incompatible optional peer and `npm ci` failed; application source remains JavaScript. The regenerated `package-lock.json` has passed `npm ci`, dependency-tree validation and the production build. Hotel/OneMap pages, unused scaffold-generator/test dependencies, web-vitals and deployment files are not copied.

The backend repository contains `docs/report/provenance.md` with per-module explanations and `docs/assessment/setup-guide.md` with workspace setup instructions. The original lab source repositories are unchanged. Add the narrated screencast link here when the actual recording is available.

CRA's proxy configuration also produced an invalid `allowedHosts` option with the selected loopback `HOST`; removing that unused proxy permits local development startup. This foundation keeps the lab build tool and is verified on the pinned runtime. Dependency installation emits deprecation notices from the older CRA dependency tree.

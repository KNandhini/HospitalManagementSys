# HealthHub

A hospital management web app frontend — patient records, appointments, and doctor scheduling — built with React + Vite.

## Setup (in VS Code)

1. Unzip this project and open the folder in VS Code (`code healthhub`).
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and set your backend API URL:
   ```
   cp .env.example .env
   ```
4. Run the dev server:
   ```
   npm run dev
   ```
5. Open the app at `http://localhost:3000`.

## Project structure

```
src/
├── api/            # axios instance + one file per resource (auth, patients, appointments, doctors)
├── components/
│   ├── common/     # shared/reusable UI (ProtectedRoute, buttons, etc.)
│   └── layout/     # navbar, footer, sidebar
├── pages/          # one folder per page (Home, Login, Dashboard, Appointments, PatientRecords)
├── routes/         # AppRoutes.jsx — all route definitions
├── context/         # AuthContext.jsx — global login state
├── hooks/          # useFetch.js — reusable data-fetching hook
├── utils/          # helper functions (formatDate, etc.)
├── App.jsx
└── main.jsx
```

## Connecting your backend

Every API call goes through `src/api/axiosInstance.js`, which reads `VITE_API_URL` from `.env`
and auto-attaches the auth token from `localStorage`. Point it at your actual backend
(Node/Express, Django, Spring Boot, etc.) and the existing `authApi.js`, `patientApi.js`,
`appointmentApi.js`, and `doctorApi.js` files should work with minimal changes — just match
the endpoint paths to your API.

## Next steps

- Wire up your real backend endpoints (adjust paths in `src/api/*.js` if they differ).
- Add role-based views if you have separate patient/doctor/admin logins.
- Add form validation (e.g. with `react-hook-form` or `zod`).
- Style it — current styling is minimal inline CSS, ready for a UI library (MUI, Tailwind, etc.) if you want one.

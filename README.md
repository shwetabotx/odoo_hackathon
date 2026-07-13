# TransitOps — Smart Transport Operations Platform

#live website - https://demo-project-frontend-a8no.onrender.com/
#login credintials - 
Fleet Manager → Dispatcher → Safety Officer → Financial Analyst
passwords: password123 
meera@transitops.in / Fleet manager    
raven@transitops.in / Dispatcher 
karan@transitops.in (Safety Officer) 
anjali@transitops.in (Financial Analyst) 


A full MERN-stack rebuild of the TransitOps hackathon brief: vehicle registry,
driver & safety profiles, trip dispatcher with lifecycle rules, maintenance
workflow, fuel & expense tracking, analytics, and role-based access control
(RBAC) — all enforced on the backend, not just hidden in the UI.

This isn't a copy of the wireframe's look — it uses a dark slate + violet
theme instead of the navy/amber/blue palette from the mockup, but every
screen and business rule from the spec is implemented.

## Stack

- **Backend:** Node.js, Express, Mongoose (MongoDB Atlas), JWT auth, bcrypt
- **Frontend:** React 18 (Vite), React Router, Tailwind CSS, Recharts, Axios, lucide-react

## Project structure

```
odoo-hackathon/
├── backend/
│   ├── config/         # db connection, RBAC permission matrix
│   ├── middleware/      # JWT auth + RBAC guards
│   ├── models/          # User, Vehicle, Driver, Trip, Maintenance, FuelLog, Settings
│   ├── routes/           # one router per module
│   ├── seed.js           # demo users + sample fleet/drivers
│   └── server.js
└── frontend/
    └── src/
        ├── api/axios.js         # axios instance w/ JWT interceptor
        ├── context/AuthContext.jsx
        ├── permissions.js       # RBAC matrix mirrored from backend
        ├── components/
        └── pages/                # Login, Dashboard, Fleet, Drivers, Trips,
                                   # Maintenance, FuelExpenses, Analytics, Settings
```

## 1. Backend setup

You said you already created a `Cluster0` cluster with a `TransitOps`
database in MongoDB Atlas — you're set. Mongoose will automatically create
its own collections inside that database (`users`, `vehicles`, `drivers`,
`trips`, `maintenances`, `fuellogs`, `settings`) the first time each is
written to — it does **not** need the empty `TransitOps` collection you
pre-created; that one will simply sit unused, which is fine.

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/TransitOps?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=<any long random string>
```

Get the exact connection string from Atlas → **Connect → Drivers**, and
make sure the database name in the path is `TransitOps` (it is by default
if that's the DB you created).

Seed demo accounts + sample fleet/drivers (optional but recommended):
```bash
npm run seed
```
This creates 4 demo logins (password for all: `password123`):
| Role | Email |
|---|---|
| Fleet Manager | meera@transitops.in |
| Dispatcher | raven@transitops.in |
| Safety Officer | karan@transitops.in |
| Financial Analyst | anjali@transitops.in |

Run the API:
```bash
npm run dev
```
It starts on `http://localhost:5000`. Check `http://localhost:5000/api/health`.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Opens on `http://localhost:5173`. It talks to the API at `VITE_API_URL`
(defaults to `http://localhost:5000/api`).

## 3. Login

Go to `/login`, pick a role from the dropdown (must match the account's
actual role), enter email/password. Or use `/register` to create a new
account with any of the 4 roles.

## RBAC matrix (enforced both client & server side)

| Role | Fleet | Drivers | Trips | Fuel/Exp | Analytics |
|---|---|---|---|---|---|
| Fleet Manager | edit | edit | – | – | view |
| Dispatcher | view | – | edit | – | – |
| Safety Officer | – | edit | view | – | – |
| Financial Analyst | view | – | – | edit | edit |

Dashboard is visible to every authenticated role. The Maintenance module
follows the same edit/view rule as Fleet, since it's part of the vehicle
lifecycle. The backend re-checks every one of these on every request
(`middleware/auth.js` + `config/permissions.js`) — the frontend sidebar/buttons
just mirror it for UX, so this can't be bypassed by editing the client.

## Business rules implemented

- Registration No. and License No. are unique (`409` on collision).
- Retired / In Shop vehicles are excluded from `/api/vehicles/available`,
  so they never show up in the Trip Dispatcher.
- Drivers with an expired license or `Suspended` status are excluded from
  `/api/drivers/available` and are also re-validated server-side at dispatch time.
- A vehicle or driver already `On Trip` cannot be dispatched again.
- Cargo weight vs. vehicle capacity is validated at dispatch (handles both
  `kg` and `Ton` capacity units) — dispatch is blocked with the exact
  over-capacity amount, mirroring the wireframe's error state.
- Dispatch flips vehicle + driver to `On Trip`; Complete flips them back to
  `Available`, adds the distance to the odometer, and writes a fuel log entry
  if fuel was recorded; Cancel restores `Available` only if the trip had been
  dispatched.
- Creating an active maintenance record flips the vehicle to `In Shop` and
  pulls it out of the dispatch pool; closing the record restores `Available`
  unless the vehicle is `Retired`.
- Total Operational Cost, Fuel Efficiency (distance/fuel across completed
  trips), Fleet Utilization, and Vehicle ROI are computed live from the data
  — nothing is hardcoded.
- Login lockout: 5 failed attempts locks the account for 15 minutes.
- CSV export of all trips is available from the Analytics page.

## Notes / things you may want to extend

- PDF export, email reminders for expiring licenses, dark mode, and vehicle
  document uploads were bonus items in the brief and are not included —
  happy to add any of them next.
- Revenue is entered manually per trip when it's marked Completed (used for
  the ROI and monthly revenue chart) since the spec didn't define a fare/pricing
  model.
- `capacity` on Vehicle can be `kg` or `Ton`; the backend normalizes to kg
  for the cargo-weight comparison.

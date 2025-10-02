# NafasBaru Backend (Express + MongoDB)

## Environment
Create `.env` based on `.env.example`:

```
PORT=8080
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=change_me
CORS_ORIGIN=https://your-frontend.vercel.app,https://localhost:3000
```

## Run locally
```
npm install
npm run dev
```

## API Endpoints
- POST `/api/register` — body: `{ name, email, password }`
- POST `/api/login` — body: `{ email, password }` → returns `{ token }`
- POST `/api/challenge` (auth) — body: `{ durationDays }`
- GET `/api/challenge/:id` (auth)
- POST `/api/challenge/:id/progress` (auth) — body: `{ progressDays?, status?, badge? }`
- POST `/api/money/save` (auth) — body: `{ dailyCigarettes, pricePerPack, cigarettesPerPack, startDate }`
- GET `/api/health/:id` (auth) — `id` = userId
- POST `/api/health/:id` (auth) — body: `{ milestones }`

## Deploy
- Use Railway/Render.
- Set env vars: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`.
- Expose `web` service on `PORT`.

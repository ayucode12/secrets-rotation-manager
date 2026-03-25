# secrets-rotation-manager

## Frontend Integration

A minimal frontend has been added under `public/` and is served from `/app`.

- Open in browser: http://localhost:5000/app
- Main files:
  - `public/index.html`
  - `public/app.js`
  - `public/styles.css`

### Available operations

- load secrets list via GET `/api/rotations/secrets`
- trigger manual rotation via POST `/api/rotations/manual` with JSON `{ "secretName": "..." }`
- check backend health via GET `/health`

### Run

1. `npm install`
2. `npm run dev` (or `npm start`)
3. navigate to `http://localhost:5000/app`

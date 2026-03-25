# secrets-rotation-manager

## Frontend Integration

A professional dashboard has been added under `public/` and is served from `/app`.

- Open in browser: http://localhost:5000/app
- Main files:
  - `public/index.html` - Dashboard layout with tabs
  - `public/app.js` - Frontend logic and API calls
  - `public/styles.css` - Professional dark theme styling

### Available operations

- **Dashboard**: Overview stats and quick setup
- **Secrets**: Register new secrets and view existing ones
- **Rotations**: Trigger manual secret rotation
- **Schedules**: Create rotation schedules and view active ones
- **Logs**: View rotation history and logs
- **Health**: Check API and system status

### Quick Setup

Use the "Quick Setup" button on the Dashboard to create sample secrets and schedules for testing.

### Manual Operations

- Register secret: Enter name, type, and policy in the Secrets tab
- Create schedule: Enter secret name, cron expression, and affected services in the Schedules tab
- Trigger rotation: Enter secret name in the Rotations tab

### Run

1. `npm install`
2. `npm run dev` (or `npm start`)
3. navigate to `http://localhost:5000/app`

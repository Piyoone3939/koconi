# Koconi Mobile

This folder contains the main Koconi product application.

## Scope

- Audience: signed-in users
- Purpose: photo workflows, AI match, placement, personal map experience
- This app is separated from the public landing page in `apps/LP`

## Stack

- Expo
- React Native
- TypeScript

## Setup

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npm run start
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

## Type Checking

```bash
npm run typecheck
```

## API Type Generation

Types are generated from the shared OpenAPI file at `../../docs/openapi.yaml`.

```bash
npm run gen:api-types
```

Generated file:

- `src/types/api.generated.ts`

## Environment Variables

Set API endpoint through Expo public env var:

- `EXPO_PUBLIC_API_BASE_URL`

Example:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

If you run backend via nginx proxy (docker compose), use:

```bash
EXPO_PUBLIC_API_BASE_URL=http://<YOUR_PC_LAN_IP>/api
```

Example on this machine:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.4/api
```

If you expose API service directly on host port 3000 via docker compose, use:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.4:3000
```

If not set, the app currently falls back to `http://localhost:3000`.

### Recommended Local Setup (mobile on real device)

1. Use a LAN reachable URL in `.env`.

```bash
EXPO_PUBLIC_API_BASE_URL=http://<YOUR_PC_LAN_IP>:3000
```

2. Restart Expo after changing `.env`.

```bash
npx expo start
```

3. App startup now runs API health check automatically.

If the app shows API connection error banner:

1. Start API server/container.
2. Ensure phone and PC are on same Wi-Fi.
3. Verify endpoint value in `.env`.

## Architecture Notes

The app follows a clean architecture layout:

- `src/domain`: core models and ports
- `src/application`: use cases
- `src/infrastructure`: API client and gateway implementations
- `src/presentation`: screen components

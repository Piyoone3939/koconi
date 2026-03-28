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

If not set, the app currently falls back to `http://localhost:3000`.

## Architecture Notes

The app follows a clean architecture layout:

- `src/domain`: core models and ports
- `src/application`: use cases
- `src/infrastructure`: API client and gateway implementations
- `src/presentation`: screen components

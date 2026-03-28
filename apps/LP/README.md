# Koconi LP

This folder contains the landing page application for Koconi.

## Scope

- Audience: new users
- Purpose: explain product value, features, terms, privacy, and contact
- Non-goal: authenticated app workflows (those live in mobile)

## Stack

- React
- TypeScript
- Vite

## Development

Install dependencies:

```bash
npm install
```

Start dev server:

```bash
npm run dev
```

Build production assets:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## API Type Generation

Types are generated from the shared OpenAPI file at `../../docs/openapi.yaml`.

```bash
npm run gen:api-types
```

Generated file:

- `src/types/api.generated.ts`

## Deployment Notes

- In docker-compose, this app is served as the LP service.
- Built files are mounted into nginx from `apps/LP/dist`.

## Folder Role Convention

- `apps/LP`: public landing page only
- `apps/mobile`: actual product app workflows

# DUCK'S GameClub Backend

Node.js v22, TypeScript, Express, Prisma and SQLite backend for the DUCK'S GameClub web application and Telegram bot API.

## Quick Start

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

API documentation is available at `http://localhost:4000/docs`.

## Module Documentation

- [Auth module](src/modules/auth/README.md)

## Admin user game stats

Admin-only user endpoints provide the data contract for the rating and bounty table:

- `GET /api/users` returns every user with a `ratings` item for each supported game. Each item
  contains `gameType`, `points`, and `bounty`; missing results are returned as zeroes.
- `PATCH /api/users/:id/stats/:game` sets absolute `points` and/or `bounty` values for one user
  and game. The JSON body must contain at least one of these fields.

Example:

```json
{
  "points": 150,
  "bounty": 3
}
```

Both endpoints require an admin bearer token. Manual bounty changes are stored as adjustments,
so completed event results remain unchanged.

## Scripts

- `npm run dev` - start development server with watch mode
- `npm run build` - compile TypeScript
- `npm start` - run compiled server
- `npm run prisma:migrate` - create/apply dev migrations
- `npm run prisma:deploy` - apply migrations in deployment
- `npm run prisma:seed` - seed local data
- `npm test` - run unit/integration tests

## Default Seed Accounts

- Admin: `admin@ducksgameclub.local` / `Admin12345!`
- User: `player@ducksgameclub.local` / `Player12345!`

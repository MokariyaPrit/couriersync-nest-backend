# CourierSync Nest Backend

Standard NestJS layout (one `package.json`, one `src/`).

```text
couriersync-nest-backend/
  package.json
  src/
    main.ts
    shared/          # enums & shared types
    auth/ billing/ …
  docker-compose.yml
  sample.data.json
```

## Setup

```bash
npm install
cp .env.example .env
npm run db:up
npm run seed
npm run seed:demo
npm run dev
```

API: http://localhost:3001/api/v1

Import shared enums with `import { Role } from '@/shared'`.

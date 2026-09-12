```
pnpm install
pnpm db:migrate
pnpm prisma:contract
pnpm dev
```

`pnpm db:migrate` initializes or updates the local study-guide database from
`prisma/schema.prisma`. `pnpm prisma:contract` emits the generated Prisma
contract into `src/generated/prisma`.

The API and worker can also be started separately:

```bash
pnpm dev:api
pnpm dev:worker
```

```
open http://localhost:3000
```

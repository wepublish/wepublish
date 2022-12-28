# Prisma

The required migrations, schema and seeding can be found at: `@wepublish/api/prisma`.
It is important that the seeding includes `@wepublish/api/prisma/seed.ts` as this sets up all the required roles.

## Setup schema generation/seeding

In your `package.json` you can add a new key called `prisma`.
In that space you can add the path to the schema and seeding that should be executed.

```json
"prisma": {
  "schema": "@wepublish/api/prisma/schema.prisma",
  "seed": "npx ts-node seed.ts"
},
```

To automate the generating of the prisma schema, we recommend to add the following script to your `package.json`:

```json
"scripts": {
  "prepare": "prisma generate"
}
```

[Prepare](https://docs.npmjs.com/cli/v8/using-npm/scripts#prepare-and-prepublish) will automatically run on `npm` install.

Your `seed.ts` should seed atleast 1 user, so that you can login with it and change the password:

```typescript
import {PrismaClient} from '@prisma/client'
import {hashPassword} from '@wepublish/api'
import {seed as rootSeed} from '@wepublish/api/prisma/seed'

async function seed() {
  const prisma = new PrismaClient()
  await prisma.$connect()

  const [adminUserRole, editorUserRole] = await rootSeed(prisma)

  if (!adminUserRole || !editorUserRole) {
    throw new Error('@wepublish/api seeding has not been done')
  }

  await prisma.user.createMany({
    data: [
      {
        email: 'dev@wepublish.ch',
        emailVerifiedAt: new Date(),
        name: 'Dev User',
        active: true,
        roleIDs: [adminUserRole.id],
        password: await hashPassword('123') // <-- Change password after first login
      }
    ]
  })

  await prisma.$disconnect()
}

seed()
```

## Basic Usage

For a more detailed documentation, see the [official prisma documentation](https://www.prisma.io/docs/concepts/components/prisma-client).

### How to query a single entry

If you want to find a single entry by a unique index (such as by id, email or similar), you can use `findUnique` as it is faster due to the fact it only has to search inside the indexes.

```typescript
import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()
await prisma.$connect()

const entry = await prisma.table.findUnique({
  where: {
    id: 'my-id'
  }
})
```

If you want to find a single entry without a unique index (such as the oldest article), you can use `findFirst`.
Sometimes you want to combine this with orderBy depending on your use case.

```typescript
import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()
await prisma.$connect()

const entry = await prisma.table.findFirst({
  where: {
    articleId: 'my-article-id'
  }
})

const lastUpdatedEntry = await prisma.table.findFirst({
  orderBy: {
    modifiedAt: 'asc'
  }
})
```

### How to query a list of entries

To query a list of entries you can use `findMany`. Usually you want to pair this with `take` to limit the amount of entries being returned and `orderBy` to sort them according to something.

```typescript
import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()
await prisma.$connect()

const entries = await prisma.table.findMany({
  where: {
    publishedAt: {
      not: null
    }
  },
  take: 50,
  orderBy: {
    createdAt: 'desc'
  }
})
```

### How to delete a single entry

If you want to delete a single entry you can use `delete`.

```typescript
import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()
await prisma.$connect()

const deletedEntry = await prisma.table.delete({
  where: {
    id: 'my-id'
  }
})
```

### How to delete a list of entries

If you want to delete a list of entries you can use `deleteMany`.

```typescript
import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()
await prisma.$connect()

const deletedEntries = await prisma.table.deleteMany({
  where: {
    modifiedAt: {
      lte: new Date('2020-01-01 00:00') // delete all entries that haven't been updated since January 1st 2020
    }
  }
})
```

## Create new migration

To create a new migration you can run

```sh
npx prisma migrate dev
```

This will diff the database with the schema and create a migration accordingly.

## Reset database

You can reset the database by running the following command:

```sh
npx prisma migrate reset
```

This will completely wipe the database, migrate and seed it.

## See more

- [Official Documentation](https://www.prisma.io/docs/concepts)
- [Reference](https://www.prisma.io/docs/reference)
- [Guides](https://www.prisma.io/docs/guides)

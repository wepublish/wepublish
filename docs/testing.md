# Automated Testing

Automated testing is a crucial aspect of software development that helps to ensure the quality of a codebase by
automating the testing process.

## CLI
**!Make sure database is running! `npm run dev`**

- `npm run test`: run all tests locally
- `npm run test-u`: run all tests and update snapshots

## API Unit Testing

API unit testing is a type of automated testing that focuses on testing individual units of code that make up an API.

### Setting up the Testing Environment

To set up the testing environment, you need to ensure that you have the following entry in your `jest.config.ts` file: `globalSetup: '<rootDir>/setup-database.js'`. You can find an example of this in the `libs/membership/api/src` folder.

In the `setup-database.js` file, you should have code that looks like the following:

```typescript
import execa from 'execa'

export default async () => {
    const databaseUrl = 'postgresql://postgres@localhost:5432/wepublish_test?schema=public'
    process.env.DATABASE_URL = databaseUrl
    process.env.TZ = 'UTC'

    await execa(`npx`, ['prisma', 'migrate', 'reset', '--force'])
}
```
This code sets up a test database called `wepublish_test` and resets it each time you run a test.

### Running Tests
To run tests, you need to ensure that all your changes to the `schema.prisma` file are reflected in a migration. 
You can do this by running `prisma migrate dev --name name_of_my_migration`. Otherwise, your test database may 
rely on an incomplete schema.
Also, make sure, you have a database up and running. You may want run `docker-compose up database`

Once you have done this, you should be able to run a single test using the command `npx jest -t 'my test'`

### ! Do not forget adding tests to the pipeline !
In order to run your tests within the pipeline, you have to add an entry in the `package.json` in the root folder.
To test, if it works, run `nx test` from your cli. Your specs should now be tested.


## UI Testing
The UI is tested using Storybook and Jest. For further help, consult the documentation of NX, Jest and Storybook.


## Troubleshooting
### Failing Snapshots
- It might happen that your tests are failing. Try to update your snapshots
by running (eventually in the package in question) `npm run test-u` For more information: 
[https://jestjs.io/docs/cli#--updatesnapshot](https://jestjs.io/docs/cli#--updatesnapshot)


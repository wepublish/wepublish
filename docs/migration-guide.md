# Migration Guide: Migrating to NestJS GraphQL Navigation API

## **Introduction**

This guide will help you set up a feature-based GraphQL API using a modular approach in an NX Monorepo, focusing on
the "navigation" feature. The guide covers generating the necessary libraries, integrating GraphQL functionality, and
configuring the main application module.

## Step 1: Create New NX Libraries

**Preliminary Step: Set Environment Variable** Before you begin, set an environment variable to define the module name.
This will be used across various commands to
ensure consistency and ease of use.

```bash
export MODULE=navigation
```

1. **Generate API Library**: Create a library to hold the NestJS GraphQL resolver, service, and related code:

```bash
nx g @nx/nest:lib ${MODULE}-api --importPath=@wepublish/${MODULE}/api --directory=libs/${MODULE}/api --projectNameAndRootFormat=as-provided
```

2. **Generate Frontend Libraries**: Create two libraries for different usage scenarios:

- **Editor Interface**: Components for managing navigation within the editor.
- **End-User Website**: Components for displaying navigation to end-users.

Commands:

```bash
nx g @nx/react:library ${MODULE}-editor --importPath=@wepublish/${MODULE}/editor --directory=libs/${MODULE}/editor --projectNameAndRootFormat=as-provided
nx g @nx/react:library ${MODULE}-website --importPath=@wepublish/${MODULE}/website --directory=libs/${MODULE}/website --projectNameAndRootFormat=as-provided
```

## **Step 2: Implement the Navigation API Library**

### **Organizing GraphQL Files**

Within the API library (`libs/navigation/api`), your GraphQL files are typically structured
under `src/lib/graphql/navigation/`. This includes:

- `navigation.public-queries.ts`
- `navigation.public-mutations.ts`
- `navigation.private-queries.ts`
- `navigation.private-mutations.ts`

### **Service and Resolver Creation**

1. **Create the Service**: Implement the navigation service that interacts with your database or other services:

```typescript
// libs/navigation/src/lib/navigation.service.ts
import {Injectable} from '@nestjs/common';

@Injectable()
export class NavigationService {
  // Define service methods like getNavigation, getNavigations, etc.
}
```

2. **Create the Resolvers**: Depending on the logic, split functionalities from the GraphQL files into one or more
   resolver classes:


- Map existing functions from `libs/api/src/lib/graphql/${FEATURE}` to resolver methods in the new API library.

```typescript
// libs/navigation/src/lib/navigation.resolver.ts
import {Resolver, Query, Args, Mutation} from '@nestjs/graphql';
import {NavigationService} from './navigation.service';
import {NavigationType} from './graphql/types/navigation.type';

@Resolver()
export class NavigationResolver {
  constructor(private navigationService: NavigationService) {
  }

  // Implement queries and mutations based on the old GraphQL files
}
```

Make sure:

- Identify authorization logic in the old functions.
- Use the `@Permissions` decorator to enforce required permissions for each method.
- Add `@Query()` or `@Mutation()` decorators to each resolver method.
- Use `@ArgsType()` for top-level arguments objects and `@InputType()` for nested arguments.
- Apply `@ObjectType()` to all return types.

## **Step 3: Configure and Export from the Navigation API**

1. **Define the Navigation Module**: Ensure the module is properly set up to include your service and resolver.

```typescript
// libs/navigation/src/lib/navigation.module.ts
import {Module} from '@nestjs/common';
import {NavigationService} from './navigation.service';
import {NavigationResolver} from './navigation.resolver';

@Module({
  providers: [NavigationService, NavigationResolver],
})
export class NavigationModule {
}
```

2. **Export Navigation API**: In the main export file of your API library (`libs/navigation/api/src/index.ts`), add:

```typescript
export * from '@wepublish/navigation/api';
```

3. **Integrate Navigation Module into AppModule**: Update the root `AppModule` to include the new module.

```typescript
// apps/api-example/src/nestapp/app.module.ts
import {Module} from '@nestjs/common';
import {NavigationModule} from '@wepublish/navigation/api';

@Module({
  imports: [
    NavigationModule,
    // other imports...
  ],
})
export class AppModule {
}
```

## **Step 4: Test and Verify Integration**

1. **Testing**:
    - **Resolver Tests**: Write tests using GraphQL testing utilities.
    - **Service Tests**: Write basic regression tests to confirm service behavior.
    - **Snapshot Tests**: Use snapshots to verify GraphQL responses.

```bash
npm run test
```    

2. **Start the Application**: Restart your server:

```bash
npm run dev
```




# We.Publish Coding Conventions

## NestJS Backend Patterns

### Module Structure

Every domain module follows this pattern:

```typescript
@Module({
  imports: [PrismaModule, /* other domain modules */],
  providers: [MyService, MyResolver, MyDataloaderService],
  exports: [MyService, MyDataloaderService],
})
export class MyModule {}
```

### Service Pattern

Services are `@Injectable()` and inject `PrismaClient` directly. Use `@PrimeDataLoader()` to populate the dataloader cache on service calls:

```typescript
@Injectable()
export class ArticleService {
  constructor(
    private prisma: PrismaClient,
    private trackingPixelService: TrackingPixelService
  ) {}

  @PrimeDataLoader(ArticleDataloaderService)
  async getArticleBySlug(slug: string) {
    return this.prisma.article.findFirst({ where: { slug } });
  }
}
```

### Resolver Pattern

Resolvers use NestJS GraphQL decorators with auth/permission decorators:

```typescript
@Resolver(() => Article)
export class ArticleResolver {
  constructor(
    private articleDataloader: ArticleDataloaderService,
    private articleService: ArticleService
  ) {}

  @Public()
  @Query(() => Article)
  async article(@Args('id', { nullable: true }) id?: string) { ... }

  @Permissions(CanCreateArticle)
  @Mutation(() => Article)
  async createArticle(
    @Args() input: CreateArticleInput,
    @CurrentUser() user: UserSession | undefined
  ) { ... }

  @ResolveField(() => [Tag])
  async tags(@Parent() parent: PArticle) { ... }
}
```

### Dataloader Pattern

Every entity that is resolved as a field should have a dataloader to prevent N+1 queries:

```typescript
@Injectable()
export class ArticleDataloaderService {
  constructor(private prisma: PrismaClient) {}
  // Batches multiple IDs into a single query
}
```

### GraphQL Models

Models use `@ObjectType()`, `@Field()`, and `@InputType()` decorators. Input validation uses class-validator or Zod. Args classes use `@ArgsType()`:

```typescript
@ObjectType()
export class Article {
  @Field() id!: string;
  @Field() title!: string;
}

@ArgsType()
export class ArticleListArgs {
  @Field(() => Int, { nullable: true }) take?: number;
  @Field({ nullable: true }) cursorId?: string;
}
```

### Auth Decorators

- `@Public()` — endpoint requires no authentication
- `@CurrentUser()` — injects the current `UserSession` (or undefined)
- `@Permissions(CanCreateArticle)` — requires specific permission
- `@PreviewMode()` — checks if the user has preview access

## React Frontend Patterns

### Component Structure

Components use MUI with Emotion styled components:

```typescript
import { Button as MuiButton } from '@mui/material';
import { ComponentProps, PropsWithChildren } from 'react';

export type ButtonProps = PropsWithChildren<ComponentProps<typeof MuiButton>>;

export function Button({ children, variant = 'contained', ...props }: ButtonProps) {
  return <MuiButton {...props} variant={variant}>{children}</MuiButton>;
}
```

### Styling

Use `@emotion/styled` with tagged template literals for custom styling:

```typescript
import styled from '@emotion/styled';

const Wrapper = styled('div')`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
`;
```

Do NOT use CSS files or CSS modules. All styling is CSS-in-JS via Emotion.

### GraphQL Integration

Use Apollo Client with generated hooks from GraphQL Code Generator:

```typescript
import { useArticleQuery, useCreateArticleMutation } from '@wepublish/editor/api';

function ArticlePage({ id }: { id: string }) {
  const { data, loading } = useArticleQuery({ variables: { id } });
  const [createArticle] = useCreateArticleMutation();
}
```

### Forms

Use React Hook Form with Zod for validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({ title: z.string().min(1) });
const { register, handleSubmit } = useForm({ resolver: zodResolver(schema) });
```

### i18n

Use `react-i18next` for translations:

```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
```

## File Naming Conventions

- NestJS files: `<name>.module.ts`, `<name>.service.ts`, `<name>.resolver.ts`, `<name>.model.ts`
- Test files: `<name>.spec.ts` (co-located with source)
- React components: PascalCase function names, kebab-case file names
- Storybook: `<name>.stories.tsx`

## Import Conventions

Always use `@wepublish/` path aliases, never relative imports across library boundaries:

```typescript
// Correct
import { ArticleModule } from '@wepublish/article/api';

// Wrong — never cross lib boundaries with relative imports
import { ArticleModule } from '../../../article/api/src';
```

## Error Handling

- Backend: throw NestJS exceptions (`NotFoundException`, `BadRequestException`) or custom error classes
- Frontend: Apollo Client error handling via `onError` link and per-query error states
- Sentry integration for error tracking in both frontend and backend

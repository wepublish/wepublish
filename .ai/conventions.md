# We.Publish Coding Conventions

Repo-specific Nest and React patterns. Formatting, Emotion, lint-enforced rules
and the React/Nest style rules live in
[code-style.md](../.claude/docs/code-style.md); the schema → codegen flow is in
[graphql-prisma.md](../.claude/docs/graphql-prisma.md).

## NestJS

### Module shape

```typescript
@Module({
  imports: [PrismaModule, /* other domain modules */],
  providers: [MyService, MyResolver, MyDataloaderService],
  exports: [MyService, MyDataloaderService],
})
export class MyModule {}
```

### `@PrimeDataLoader`

Services inject `PrismaClient` directly. Decorating a service method with
`@PrimeDataLoader(<Dataloader>)` populates the dataloader cache from that
method's result, so resolving that entity as a field later does not re-query:

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

Every entity resolved as a field needs a `*-dataloader.service.ts`. Resolving a
relation with a direct Prisma call inside a list query is an N+1.

### Resolver shape

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

### Auth decorators

| Decorator | Effect |
| --- | --- |
| `@Public()` | Endpoint requires no authentication |
| `@CurrentUser()` | Injects the current `UserSession`, or `undefined` |
| `@Permissions(CanCreateArticle)` | Requires that specific permission |
| `@PreviewMode()` | Checks whether the user has preview access |
| `@Feature('key')` | Requires the feature to be switched on for this medium, **in addition** to the above |

Guard every field that exposes user or payment data, and **test the deny
path** — note the caveat about unguarded resolver specs in
[testing.md](../.claude/docs/testing.md).

### Feature toggles (per medium)

Ship unfinished work on master behind a flag instead of on a deploy branch:

1. Add `{key, description, stage}` to `FEATURES` in
   `libs/features/src/lib/features.ts`.
2. Gate the API with `@Feature('key')` (`@wepublish/features/api`).
3. Gate the editor with `<FeatureControl feature="key">` around nav items and
   `createCheckedFeatureComponent('key')` around routes (`@wepublish/ui/editor`).
4. Once the CMS reports the key, staff switch it on per medium in One
   (Clients → features); see [external-services.md](../.claude/docs/external-services.md).

The schema and the migrations stay the same for every medium; only access is
gated. When the feature is ready for every medium, delete the entry and its
`@Feature` / `FeatureControl` checks in the same change. `FeatureKey` is typed
from the registry, so a forgotten check fails to compile.

### Models

`@ObjectType()` / `@Field()` for output, `@InputType()` for input, `@ArgsType()`
for query arguments; validation via class-validator or Zod. List args are
cursor-based:

```typescript
@ArgsType()
export class ArticleListArgs {
  @Field(() => Int, { nullable: true }) take?: number;
  @Field({ nullable: true }) cursorId?: string;
}
```

## React

Styling, forms, i18n and Website Builder rules are in
[code-style.md](../.claude/docs/code-style.md). Apollo hooks are generated —
import them from `@wepublish/editor/api` or `@wepublish/website/api`, never
hand-write a query hook; see
[graphql-prisma.md](../.claude/docs/graphql-prisma.md).

Frontend errors surface through the Apollo `onError` link plus per-query error
state, and report to Sentry alongside the backend.

## File naming

- Nest: `<name>.module.ts`, `<name>.service.ts`, `<name>.resolver.ts`,
  `<name>.model.ts`, `<name>-dataloader.service.ts`
- Specs: `<name>.spec.ts`, co-located with the source — never `.test.ts`
- React components: PascalCase function, kebab-case file name
- Storybook: `<name>.stories.tsx`

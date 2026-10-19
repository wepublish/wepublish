# We.Publish — the block-content framework, in full

**Scope.** This document describes the block-content framework that the ported BKa events must
use for their body content: every block type in `libs/block-content/**` (API models, GraphQL input
types, editor components, website renderers), the richtext library in `libs/richtext/**`, the
exact mechanism by which a model acquires a `blocks` field (union type, discriminator, Prisma
column and its JSON shape, input mapping, validation, read path), a step-by-step recipe for giving
a *new* entity a blocks field with real excerpts from Article, Page and BlockTemplate, the editor's
block-list machinery and how a restricted subset of blocks could be offered, and the per-entity
allow-listing that already exists. It ends with an honest assessment of how BKa's
HTML-entity-encoded `labels.description` / `labels.printDescription` should be modelled, grounded
in a tag-and-entity census of the live BKa database. Everything is anchored to a file path and,
where it matters, a line number. The We.Publish Postgres database was **stopped** during this
research, so no block rows were read from it; the stored-JSON shapes below are derived from
committed migration SQL, from the two mapping functions that write and read the column, and from
the repo's own fixtures — any claim that would need a live We.Publish row is marked
**UNVERIFIED**. The BKa database *was* available and every BKa number here is a live aggregate.
Companion documents: [`wp-01`](wp-01-current-event-implementation.md) (the event code being
deleted) and the not-yet-written `wp-05` (revision/publication system) — this document deliberately
stops at the edge of the revision machinery and only describes where the `blocks` column sits
inside it.

---

## 1. The projects, and what is *not* where you expect it

| Nx project | Path | tsconfig alias | Contains |
| --- | --- | --- | --- |
| `block-content-api` | `libs/block-content/api` | `@wepublish/block-content/api` | Every block's `@ObjectType` + `@InputType`, the `BlockContent` union, `BlockContentInput`, `mapBlockUnionMap`, block styles, block templates, the slot-teaser loader |
| `block-content-website` | `libs/block-content/website` | `@wepublish/block-content/website` | One React renderer per block + a type guard per block, the `BlockRenderer` dispatcher, block *styles* renderers |
| `richtext` | `libs/richtext` | `@wepublish/richtext` | The TypeScript shape of a richtext document (`RichtextJSONDocument`), `toPlaintext`, `truncate`, `normalizeListNesting` |
| `richtext-api` | `libs/richtext/api` | `@wepublish/richtext/api` | The `RichText` GraphQL scalar, the Slate→ProseMirror migration crons |
| `richtext-editor` | `libs/richtext/editor` | `@wepublish/richtext/editor`, `@wepublish/richtext/editor/config` | The TipTap editor component and its extension configuration |
| `richtext-website` | `libs/richtext/website` | `@wepublish/richtext/website` | `RenderRichtext` / `RenderElement` / `RenderLeaf` |

**There is no `libs/block-content/editor`.** The editor-side block components live in
`libs/ui/editor/src/lib/blocks/` (project `ui-editor`, alias `@wepublish/ui/editor`) together with
the generic block-list atoms in `libs/ui/editor/src/lib/atoms/`. Anyone grepping
`libs/block-content/**` for the editor half will find nothing.

Aliases are declared in `tsconfig.base.json:39-42` and `:106-112`.

Verification commands (per `.claude/docs/repo-map.md` conventions):

```
npx nx test block-content-api
npx nx test block-content-website
npx nx test richtext richtext-api richtext-website
npx nx test ui-editor
```

---

## 2. Three different "block type" vocabularies

This is the single most confusing thing in the framework. There are **three** enums, they do not
have the same members, and they are all called some variation of "block type".

### 2.1 `BlockType` — the discriminator (32 members)

`libs/block-content/api/src/lib/block-type.model.ts:3-40`. A TypeScript string enum registered in
GraphQL as `BlockType`. **Its value is what gets written into the JSON column as `"type"`** and
what `BlockContent.resolveType` switches on.

```ts
export enum BlockType {
  Title = 'title',
  RichText = 'richText',
  FacebookPost = 'facebookPost',
  /* … 28 more … */
  FlexBlock = 'flexBlock',
  BlockTemplate = 'blockTemplate',
}

registerEnumType(BlockType, { name: 'BlockType' });
```

### 2.2 `EditorBlockType` — the Prisma enum (22 members)

`libs/api/prisma/schema.prisma:1580-1604`, a real Postgres enum type `"BlockType"`, re-registered
in GraphQL under the name `EditorBlockType` to avoid a clash
(`libs/block-content/api/src/lib/block-styles/block-styles.model.ts:9-13`):

```ts
import { BlockType as EditorBlockType } from '@prisma/client';
registerEnumType(EditorBlockType, { name: 'EditorBlockType' });
```

It exists for exactly two purposes: it types the `BlockStyle.blocks` array (which block types a
style may be applied to), and it is the key of the editor's `BlockMap`. It differs from §2.1:

| Difference | Detail |
| --- | --- |
| Teaser grids are split | `teaserGrid1` + `teaserGrid6` instead of one `teaserGrid` |
| Embeds are collapsed | one `embed` member covers all 11 concrete embed object types (`facebookPost`, `youTubeVideo`, …) |
| Missing entirely | `facebookPost`, `facebookVideo`, `instagramPost`, `twitterTweet`, `vimeoVideo`, `streamableVideo`, `youTubeVideo`, `soundCloudTrack`, `polisConversation`, `tikTokVideo`, `bildwurfAd`, `teaserGrid` |

Consequence: **a block style cannot target one embed provider** — only "embed" as a whole.

### 2.3 `EmbedType` — editor only (12 members)

`libs/ui/editor/src/lib/blocks/types.ts:241-253`. Splits the editor's single `embed` entry back
into the concrete API block types at save time
(`mapBlockValueToBlockInput`, `types.ts:776-888`). `EmbedType.Other` maps to the API's
`BlockType.Embed` (`IFrameBlock`).

---

## 3. The full block catalogue

33 object types are members of the `BlockContent` union
(`libs/block-content/api/src/lib/block-content.model.ts:109-218`): 32 real blocks plus
`UnknownBlock`. 22 of them are offered in the editor (the 11 concrete embeds are reached through
one `Embed` entry; `teaserGrid` splits into two entries).

### 3.1 Text and layout blocks

| `BlockType` value | GraphQL type | Own fields | Input type | Editor `BlockMap` key / component | Website component / guard |
| --- | --- | --- | --- | --- | --- |
| `title` | `TitleBlock` | `preTitle?`, `title?`, `lead?` | `TitleBlockInput` = `OmitType(TitleBlock, ['type'])` | `Title` → `blocks/titleBlock.tsx` | `title/title-block.tsx` / `isTitleBlock` |
| `richText` | `RichTextBlock` | `richText?: RichText` | `RichTextBlockInput` = omit `type` | `RichText` → `blocks/richTextBlock/rich-text-block.tsx` (`bare: true`) | `richtext/richtext-block.tsx` / `isRichTextBlock` |
| `listicle` | `ListicleBlock` | `items: ListicleItem[]` where `ListicleItem implements HasImage { imageID?, image?, richText?, title? }` | `ListicleBlockInput` (items → `ListicleItemInput`, `image` omitted, `imageID` re-added) | `Listicle` → `blocks/listicleBlock.tsx` | `listicle/listicle-block.tsx` / `isListicleBlock` |
| `quote` | `QuoteBlock implements HasImage` | `author?`, `quote?`, `imageID?`, `image?` | `QuoteBlockInput` (omit `image`,`type`; re-add `imageID`) | `Quote` → `blocks/quoteBlock.tsx` | `quote/quote-block.tsx` / `isQuoteBlock` |
| `html` | `HTMLBlock` | `html?` | `HTMLBlockInput` = omit `type` | `HTML` → `blocks/htmlBlock.tsx` | `html/html-block.tsx` / `isHtmlBlock` — renders via `dangerously-set-html-content`, **no sanitisation** |
| `linkPageBreak` | `BreakBlock implements HasImage` | `text?`, `richText?`, `linkURL?`, `linkText?`, `linkTarget?`, `hideButton?`, `imageID?`, `image?` | `BreakBlockInput` | `LinkPageBreak` → `blocks/linkPageBreakBlock.tsx` | `break/break-block.tsx` / `isBreakBlock` |
| `flexBlock` | `FlexBlock` | `blocks: BlockWithAlignment[]`; `BlockWithAlignment implements HasOneBlockContent { alignment: FlexAlignment, block?: BlockContent }` | `FlexBlockInput` / `BlockWithAlignmentInput` (uses a **lazy `require`**, see §5.6) | `FlexBlock` → `blocks/flexBlock.tsx` (741 lines, react-grid-layout) | `nested-blocks/flex-block.tsx` / `isFlexBlock` |
| `blockTemplate` | `BlockTemplateBlock` | `templateId`, `template?: BlockTemplate` | `BlockTemplateBlockInput` (omit `template`,`type`) | `BlockTemplate` → `blocks/blockTemplateBlock.tsx` | `block-template/block-template-block.tsx` / `isBlockTemplateBlock` — **not wired into the default `BlockRenderer`**, see §10.2 |

`FlexAlignment` (`flex/flex-alignment.model.ts`): `i: String!`, `x/y/w/h: Int!`, `static: Boolean`.

### 3.2 Media blocks

| `BlockType` value | GraphQL type | Own fields | Editor | Website |
| --- | --- | --- | --- | --- |
| `image` | `ImageBlock implements HasImage` | `imageID?`, `image?`, `caption?`, `linkUrl?` | `Image` → `blocks/imageBlock.tsx` | `image/image-block.tsx` / `isImageBlock` |
| `imageGallery` | `ImageGalleryBlock` | `images: ImageGalleryImage[]`; `ImageGalleryImage = PickType(ImageBlock, ['imageID','image','caption']) implements HasImage` | `ImageGallery` → `blocks/imageGalleryBlock.tsx` | `image-gallery/image-gallery-block.tsx` / `isImageGalleryBlock` |

### 3.3 Embed blocks (all behind the editor's single `Embed` entry)

All eleven live in `libs/block-content/api/src/lib/embed/`, all `implements BaseBlock`, all inputs
are `OmitType(<Block>, ['type'], InputType)`. The editor sub-components are in
`libs/ui/editor/src/lib/blocks/embeds/`.

| `BlockType` value | GraphQL type | Own fields | `EmbedType` | Website component |
| --- | --- | --- | --- | --- |
| `embed` | `IFrameBlock` | `url?`, `title?`, `width?: Int`, `height?: Int`, `styleCustom?`, `sandbox?` | `Other` | `iframe/iframe-block.tsx` |
| `bildwurfAd` | `BildwurfAdBlock` | `zoneID?` | `BildwurfAd` | `bildwurf-ad/bildwurf-ad-block.tsx` |
| `facebookPost` | `FacebookPostBlock` | `userID?`, `postID?` | `FacebookPost` | `facebook/facebook-post-block.tsx` |
| `facebookVideo` | `FacebookVideoBlock` | `userID?`, `videoID?` | `FacebookVideo` | `facebook/facebook-video-block.tsx` |
| `instagramPost` | `InstagramPostBlock` | `postID?` | `InstagramPost` | `instagram/instagram-post-block.tsx` |
| `twitterTweet` | `TwitterTweetBlock` | `userID?`, `tweetID?` | `TwitterTweet` | `twitter/twitter-tweet-block.tsx` |
| `vimeoVideo` | `VimeoVideoBlock` | `videoID?` | `VimeoVideo` | `vimeo/vimeo-video-block.tsx` |
| `streamableVideo` | `StreamableVideoBlock` | `videoID?` | `StreamableVideo` | `streamable/streamable-video-block.tsx` |
| `youTubeVideo` | `YouTubeVideoBlock` | `videoID?` | `YouTubeVideo` | `youtube/youtube-video-block.tsx` |
| `soundCloudTrack` | `SoundCloudTrackBlock` | `trackID?` | `SoundCloudTrack` | `sound-cloud/sound-cloud-block.tsx` |
| `polisConversation` | `PolisConversationBlock` | `conversationID?` | `PolisConversation` | `polis-conversation/polis-conversation-block.tsx` |
| `tikTokVideo` | `TikTokVideoBlock` | `userID?`, `videoID?` | `TikTokVideo` | `tik-tok/tik-tok-video-block.tsx` |

### 3.4 Interaction blocks (blocks that resolve other entities)

| `BlockType` value | GraphQL type | Stored fields | Resolved fields | Resolver |
| --- | --- | --- | --- | --- |
| `poll` | `PollBlock implements HasOptionalPoll` | `pollId?` | `poll: FullPoll` | `HasOptionalPoll` resolver in `@wepublish/poll/api` |
| `crowdfunding` | `CrowdfundingBlock implements HasOptionalCrowdfunding` | `crowdfundingId?` | `crowdfunding` | `@wepublish/crowdfunding/api` |
| `comment` | `CommentBlock` | `filter: { item?, tags: [String], comments: [String] }` | `comments: [Comment!]!` | `comment/comment-block.resolver.ts:8-39` (`prisma.comment.findMany` + `@PrimeDataLoader(CommentDataloaderService)`) |
| `event` | `EventBlock` | `filter: { tags: [String], events: [String] }` | `events: [Event!]!` | `event/event-block.resolver.ts:7-34` (`prisma.event.findMany` by tag OR id) |
| `subscribe` | `SubscribeBlock` | `fields: [SubscribeBlockField]`, `memberPlanIds`, `periodicityDisplay?`, `memberPlanRenderSettings`, `showDiscountCodes`, `showGoodies`, `goodieMinValue?`, `goodieMinValueAppliesToUpgrade`, `hideRepeatGoodieOnUpgrade` | `memberPlans: [MemberPlan!]!`, plus `memberPlanIds` and `memberPlanRenderSettings` are **re-resolved** (filtered to plans that still exist, defaulted, first marked default) | `subscribe/subscribe-block.resolver.ts:15-89` |
| `mailchimpForm` | `MailchimpFormBlock` | `syncProviderId?`, `listId?`, `interests`, `autoFocus`, `doubleOptIn?`, `buttonColor?`, `buttonFontColor?`, `submitButtonLabel?`, `steps: MailchimpFormStep[]`, `successUrl?`, `successPage?` | — | ships its own mutation: `mailchimp-form/mailchimp-subscribe.resolver.ts` |

`SubscribeBlock` also declares three registered enums and an interface-typed sub-object:
`SubscribeBlockField`, `SubscribePeriodicityDisplay`, `SubscribeBlockRenderLayout`, and
`SubscribeBlockLayoutConfig` — itself an `@InterfaceType` with its own `resolveType`
(`subscribe/subscribe-block.model.ts:48-61`) producing `SubscribeBlockLayoutNoneConfig` /
`…SliderConfig` / `…PickerConfig`. This is the only block with a *nested* union/interface, and it
is a useful precedent if an event block ever needs one.

### 3.5 Teaser blocks

| `BlockType` value | GraphQL type | Stored fields | Resolved fields |
| --- | --- | --- | --- |
| `teaserGrid` | `TeaserGridBlock` | `title?`, `numColumns: Int!`, `teasers: [Teaser]` (nullable items) | — (teasers are stored inline) |
| `teaserGridFlex` | `TeaserGridFlexBlock` | `title?`, `flexTeasers: [FlexTeaser!]!` (`{ alignment: FlexAlignment, teaser? }`) | — |
| `teaserList` | `TeaserListBlock` | `title?`, `teaserType: TeaserType!`, `take?`, `skip?`, `sort?: TeaserListBlockSort`, `filter: { tags }` | `teasers` (`teaser/teaser-list.resolver.ts:28-…`), `filter.tagObjects` |
| `teaserSlots` | `TeaserSlotsBlock` | `title?`, `autofillConfig: TeaserSlotsAutofillConfig`, `slots: [TeaserSlot!]!` (`{ type: Autofill\|Manual, teaser? }`) | `autofillTeasers`, `teasers` — filled by `SlotTeasersLoader` (§5.5) |

The `Teaser` union (`teaser/teaser.model.ts:129-147`) is a *second* discriminated union inside the
block system, built exactly like `BlockContent`: four object types (`ArticleTeaser`, `PageTeaser`,
`EventTeaser`, `CustomTeaser`), an abstract `BaseTeaser` interface carrying
`type/preTitle/title/lead` plus `HasImage`, a one-key-per-variant `TeaserInput`
(`teaser.model.ts:149-159`) and a `mapTeaserUnionMap` with the same
"exactly one key" rule (`teaser.model.ts:161-186`).

### 3.6 `UnknownBlock`

`base-block.model.ts:19-20`:

```ts
@ObjectType()
export class UnknownBlock extends BaseBlock<any> {}
```

`BlockContent.resolveType` falls through to it with `console.warn(\`Block ${value.type} not implemented!\`)`
(`block-content.model.ts:215-217`). It is a member of the union but **has no input type** and no
website renderer, so an unrecognised stored `type` degrades to an empty object in the API and
renders nothing. This is the safety valve that lets a block type be removed from the code without
breaking every stored revision — relevant when the old event blocks are deleted.

### 3.7 Editor block labels and groups

`BlockMap` (`libs/ui/editor/src/lib/blocks/blockMap.tsx:60-410`) assigns every editor entry a
`group`, an icon, an i18n `label` key and a `defaultValue`. Groups are declared in
`libs/ui/editor/src/lib/atoms/blockGroups.ts`:

```ts
export const BLOCK_GROUPS = ['text', 'media', 'teasers', 'interaction', 'layout'] as const;
```

| Group | Entries (English labels from `apps/editor/src/app/locales/en.json`) |
| --- | --- |
| `text` | Title, Rich text, Listicle, Quote, HTML |
| `media` | Image, Gallery, Embed |
| `teasers` | Teaser List, 1 Col, 6 Col, Teaser Slots, Flex Grid Teasers |
| `interaction` | Subscribe, Newsletter form, Poll, Crowdfunding, Comments, Events |
| `layout` | Break, Flex Block, Block Template |

Only `RichText` sets `bare: true`, which drops the surrounding `Card` in the block list
(`blockMap.tsx:71`, consumed at `atoms/blockList.tsx:568-575`).

---

## 4. Block styles

A *block style* is a named tag an editor can attach to any block; the website then renders that
block with a different component.

| Piece | Location |
| --- | --- |
| Prisma model | `libs/api/prisma/schema.prisma:1605-1614` → table `"block-content.styles"`, columns `id`, `createdAt`, `modifiedAt`, `name` (unique), `blocks BlockType[]` |
| GraphQL model | `block-styles/block-styles.model.ts` — `BlockStyle { id, createdAt, modifiedAt, name, blocks: [EditorBlockType!]! }` |
| Service | `block-styles/block-styles.service.ts` — CRUD + `publicContentCache.invalidate()` / `invalidateArticleLayout()` on update/delete |
| Resolver | `block-styles/block-styles.resolver.ts` — `@Public()` query `blockStyles`, mutations guarded by `CanCreateBlockStyle` / `CanUpdateBlockStyle` / `CanDeleteBlockStyle` (`libs/permissions/src/lib/permissions.ts:885-901`) |
| Dataloader | `block-styles/block-styles-dataloader.service.ts` (request-scoped) |
| Editor UI | the per-block `<BlockStyleSelect>` in `libs/ui/editor/src/lib/atoms/blockList.tsx:578-607`, filtered by `blockStyle.blocks.includes(value.type)` (`:494-500`); admin list at `apps/editor/src/app/routes/blockStyles/blockStyleList.tsx` |

**Stored vs. exposed.** The block JSON stores `blockStyle` = the style's **UUID**.
`BaseBlockResolver` (`base-block.resolver.ts:8-22`) resolves `blockStyleName` from it via the
dataloader. The *website* GraphQL fragments then alias the name back onto the short field:

```graphql
fragment FullRichTextBlock on RichTextBlock {
  disabled
  blockStyle: blockStyleName     # libs/website/api/src/lib/schemas/block-content.graphql:99-103
  richText
}
```

so on the website `block.blockStyle === 'Lightbox'`, while in the editor `blockStyle` is the UUID
and `blockStyleName` the label. Website style dispatch is name-based:

```ts
// libs/block-content/website/src/lib/has-blockstyle.tsx
export const hasBlockStyle =
  (blockStyle: string) =>
  <T extends { blockStyle?: string | null }>(block: T) =>
    block.blockStyle === blockStyle;
```

Seeded styles (committed migrations):

| Style | Applies to | Migration |
| --- | --- | --- |
| `Banner` | `linkPageBreak` | `20240711144540_add_default_block_styles` |
| `ContextBox` | `linkPageBreak` | same |
| `Focus` | `teaserList`, `teaserSlots` | same + `20250529142256_teaser_slots_block_styles` |
| `Slider` | `teaserList`, `teaserGrid6`, `teaserSlots`, `imageGallery` | same + `20250529142256` |
| `Alternating` | `teaserList`, `teaserSlots`, `teaserGrid6` | `20250519094403_add_alternating_blockstyle` |
| `Lightbox` | `imageGallery` | `20260911093000_add_lightbox_block_style` |

Website renderers live in `libs/block-content/website/src/lib/block-styles/*`, and
`BlockRenderer` tests block styles **before** block type
(`libs/block-content/website/src/lib/blocks.tsx:90-172, 348-353`), so a style wins over the
default renderer.

---

## 5. How a model gets a `blocks` field

### 5.1 The output side — one union, one discriminator

`libs/block-content/api/src/lib/block-content.model.ts:109-218`:

```ts
export const BlockContent = createUnionType({
  name: 'BlockContent',
  types: () => [UnknownBlock, QuoteBlock, RichTextBlock, /* … 30 more … */] as const,
  resolveType: (value: BaseBlock<BlockType>) => {
    switch (value.type) {
      case BlockType.RichText: return RichTextBlock.name;
      /* … one case per BlockType … */
    }
    console.warn(`Block ${value.type} not implemented!`);
    return UnknownBlock.name;
  },
});
```

The discriminator is the plain `type` string on the stored object. Nothing else — no
`__typename` in the database, no Prisma discriminator column.

Every block object type declares `implements: BaseBlock` (`base-block.model.ts:4-17`):

```ts
@InterfaceType()
export abstract class BaseBlock<Type extends BlockType> {
  @Field(() => BlockType) type!: Type;
  @Field({ nullable: true }) disabled?: boolean;
  @Field({ nullable: true }) blockStyle?: string;
  @Field({ nullable: true }) blockStyleName?: string;
}
```

A model exposes a list of blocks by implementing the `HasBlockContent` interface
(`block-content.model.ts:379-383`), or a single block via `HasOneBlockContent` (`:385-389`):

```ts
@InterfaceType()
export class HasBlockContent {
  @Field(() => [BlockContent])
  blocks!: Array<typeof BlockContent>;
}
```

Three types implement `HasBlockContent` today: `ArticleRevision`
(`libs/article/api/src/lib/article.model.ts:57-61`), `PageRevision`
(`libs/page/api/src/lib/page.model.ts:36-39`) and `BlockTemplate`
(`libs/block-content/api/src/lib/block-template/block-template.model.ts:22-40`). Two implement
`HasOneBlockContent`: `BlockWithAlignment` (flex) and the dead `NestedBlock` (§10.1).

### 5.2 The input side — one optional key per block type

There is no GraphQL input union, so `BlockContentInput`
(`block-content.model.ts:221-290`) is an input object with **one nullable field per block type**,
keyed by the enum *value*:

```ts
@InputType()
export class BlockContentInput {
  @Field(() => RichTextBlockInput, { nullable: true })
  [BlockType.RichText]?: RichTextBlockInput;
  @Field(() => QuoteBlockInput, { nullable: true })
  [BlockType.Quote]?: QuoteBlockInput;
  /* … 30 more … */
}
```

which produces the SDL at `apps/api-example/schema-v2.graphql:423-456`:

```graphql
input BlockContentInput {
  bildwurfAd: BildwurfAdBlockInput
  blockTemplate: BlockTemplateBlockInput
  comment: CommentBlockInput
  /* … */
  youTubeVideo: YouTubeVideoBlockInput
}
```

Per-block input types are almost always generated by `OmitType(<Block>, [...], InputType)`:
`type` is always omitted (it is re-added by the mapper), resolved relations
(`image`, `poll`, `events`, `comments`, `memberPlans`, `template`) are omitted, and the raw id
field is re-declared as a `@Field` because it carries no decorator on the object type. Example
(`image/image-block.model.ts:23-31`):

```ts
@InputType()
export class ImageBlockInput extends OmitType(ImageBlock, ['image', 'type'] as const, InputType) {
  @Field({ nullable: true })
  override imageID?: string;
}
```

### 5.3 `mapBlockUnionMap` — the one-key rule and the only real validation

`block-content.model.ts:293-378`:

```ts
export function mapBlockUnionMap(value: BlockContentInput): typeof BlockContent {
  const valueKeys = Object.keys(value);

  if (valueKeys.length === 0) {
    throw new Error(`Received no block types.`);
  }

  if (valueKeys.length > 1) {
    throw new Error(
      `Received multiple block types (${JSON.stringify(Object.keys(value))}), they're mutually exclusive.`
    );
  }

  const type = Object.keys(value)[0] as BlockType;

  switch (type) {
    /* TeaserGrid / TeaserGridFlex / TeaserSlots / FlexBlock get recursive treatment */
    default: {
      const blockValue = value[type];
      return { type, ...blockValue };
    }
  }
}
```

So the stored object is literally `{ type: <enum value>, ...<the one input object> }`. Four cases
need extra work:

| Case | Extra mapping |
| --- | --- |
| `teaserGrid` | `teasers.map(mapTeaserUnionMap)` |
| `teaserGridFlex` | `flexTeasers.map(({teaser, ...v}) => ({...v, teaser: mapTeaserUnionMap(teaser)}))` |
| `teaserSlots` | `slots.map(...)` + injects empty `teasers: []`, `autofillTeasers: []` |
| `flexBlock` | `blocks.map(b => ({ alignment, block: b.block ? mapBlockUnionMap(b.block) : undefined }))` — recursion |

**That is the entire server-side validation of block content.** There are no `class-validator`
decorators anywhere in `libs/block-content/api` (`grep -rn "class-validator\|@Is[A-Z]"` returns
nothing). A `richText` payload is only checked for being an object (§6.3); an `imageID` pointing at
a non-existent image is accepted and resolves to `null`; a `templateId` pointing at nothing
resolves to `null` (the only exception is `BlockTemplateService`, which rejects empty template ids
and circular template references — §7.3).

### 5.4 Prisma storage

| Model | Column | Prisma type | Table |
| --- | --- | --- | --- |
| `ArticleRevision` | `blocks` | `Json` (NOT NULL, no default) | `articles.revisions` (`schema.prisma:23`) |
| `PageRevision` | `blocks` | `Json` (NOT NULL, no default) | `pages.revisions` (`schema.prisma:845`) |
| `BlockTemplate` | `blocks` | `Json` (NOT NULL, no default) | `block_templates` (`schema.prisma:1622`) |

It is a single `jsonb` column holding a **JSON array of block objects**. It was once a
`jsonb[]`; `20221229154844_unwrap_array_of_jsonb/migration.sql` flattened it:

```sql
ALTER TABLE "articles.revisions" ALTER COLUMN "blocks" TYPE jsonb USING to_json("blocks");
UPDATE "articles.revisions" set "blocks" = '[]' where blocks IS NULL;
ALTER TABLE "articles.revisions" ALTER COLUMN "blocks" SET NOT NULL;
```

**A real stored value, quoted verbatim from committed migration SQL**
(`libs/api/prisma/migrations/20250902161151_add_hidden_404_page/migration.sql`, the seeded 404
page — note this predates the ProseMirror migration, so its `richText` is still Slate):

```json
[
  {
    "lead": "Sorry. Diese Seite wurde nicht gefunden.",
    "type": "title",
    "title": "Oh nein, etwas ist schiefgelaufen.",
    "blockStyle": null
  },
  {
    "type": "richText",
    "richText": [
      {
        "type": "paragraph",
        "children": [
          { "text": "" },
          {
            "url": "/",
            "type": "link",
            "title": "Hier geht's zurück zur Startseite.",
            "children": [{ "text": "Hier geht's zurück zur Startseite." }]
          },
          { "text": "" }
        ]
      }
    ],
    "blockStyle": null
  }
]
```

The ProseMirror migration (`20260420120001_migrate_slate_to_prosemirror/migration.sql:56-68`)
rewrote **every** block in place with a pure string replacement, parking the old value under a
sibling key:

```sql
UPDATE "articles.revisions"
SET blocks = REPLACE(
    blocks::text,
    '"richText":',
    '"richText": null, "slateRichText":'
)::jsonb
WHERE blocks::text LIKE '%"richText":%';
```

So **every richtext-bearing block in the live database carries both `richText` (TipTap JSON) and
`slateRichText` (the legacy Slate array)**. The same migration is applied to `pages.revisions`.
The second block above therefore now reads
`{"type":"richText","richText":{…tiptap…},"slateRichText":[{…slate…}],"blockStyle":null}`.
**UNVERIFIED** against a live We.Publish row (database stopped), but it follows mechanically from
the committed SQL and from `SlateToPmMigrator.migrateBlocksFromSlate`
(`libs/richtext/api/src/lib/slate-to-pm-migrator.ts:1011-1044`), which only ever writes the
`richText` key and never deletes `slateRichText`.

A current-shape example for a styled, hidden richtext block, reconstructed from
`mapBlockValueToBlockInput` (`libs/ui/editor/src/lib/blocks/types.ts:741-748`) and
`mapBlockUnionMap`:

```json
{
  "type": "richText",
  "richText": {
    "type": "doc",
    "content": [
      { "type": "paragraph", "attrs": { "textAlign": null },
        "content": [ { "type": "text", "text": "Lorem ipsum" } ] }
    ]
  },
  "blockStyle": "5a0f2f0c-0b9e-4f0a-9d9e-6f6a1f1c2b3d",
  "disabled": false
}
```

(The document shape is the one `mockRichText()` produces —
`libs/storybook/mocks/src/lib/richtext.ts:4-…`.)

Note what is *not* stored: `__typename`, `blockStyleName` (resolved), and anything the
`OmitType(...)` call removed. Note what *is* stored by accident: the editor only sends
`blockStyle`/`disabled` plus the block's own fields, but every `*BlockInput` still accepts
`blockStyleName`, so a hand-written mutation could persist a stale name — it would be ignored,
because `BaseBlockResolver.blockStyleName` always overrides it.

### 5.5 The read path

1. The revision row is loaded with `blocks` as a raw JSON array (Prisma returns `JsonValue`).
2. A `@ResolveField` on the revision hands the array to `SlotTeasersLoader`
   (`libs/article/api/src/lib/article-revision.resolver.ts:26-31`,
   `libs/page/api/src/lib/page-revision.resolver.ts:55`):

   ```ts
   @ResolveField(() => [BlockContent])
   async blocks(@Parent() parent: ArticleRevision) {
     return await this.slotTeasersLoader.loadSlotTeasersIntoBlocks(parent.blocks);
   }
   ```

3. `SlotTeasersLoader.loadSlotTeasersIntoBlocks`
   (`libs/block-content/api/src/lib/teaser/slot-teasers-loader.ts:254-280`) does three passes:
   - `expandBlockTemplates` — replaces each `blockTemplate` block's `template` with the loaded
     `BlockTemplate` *including its own expanded blocks*, guarding against cycles with a
     `visitedTemplateIDs` list (`:187-242`);
   - `extractManualTeasers` — walks flex blocks, templates, teaser grids/flex/slots and collects
     every manually placed teaser so autofill will not duplicate it (`:30-92`);
   - `processBlock` — recurses into flex blocks and templates and fills every `teaserSlots`
     block's `slots`/`teasers`/`autofillTeasers` (`:106-185`, `:282-361`).
   Blocks with `disabled: true` have their teasers harvested as "already used" but are otherwise
   passed through unchanged (`:134-137`).
4. `BlockContent.resolveType` picks the object type from `type`.
5. Per-block `@ResolveField`s run: `BaseBlockResolver.blockStyleName`, `HasImageResolver.image`,
   `EventBlockResolver.events`, `CommentBlockResolver.comments`,
   `SubscribeBlockResolver.memberPlans`, `TeaserListBlockResolver.teasers`,
   `BlockTemplateBlockResolver.template`.

### 5.6 `inheritResolversFromInterfaces` — the load-bearing flag

`apps/api-example/src/nestapp/app.module.ts:125` sets

```ts
inheritResolversFromInterfaces: true,
```

This is what makes `@Resolver(() => BaseBlock)` and `@Resolver(() => HasImage)` apply to the 32
concrete block object types. Without it, every block would need its own `blockStyleName` and
`image` resolver. Any new entity that re-uses `HasBlockContent` / `HasImage` depends on this flag
being on.

The same factory registers the richtext scalar (`app.module.ts:111`):

```ts
resolvers: { RichText: GraphQLRichText },
```

### 5.7 Module wiring

`BlockContentModule` (`libs/block-content/api/src/lib/block-content.module.ts:26-53`) imports
`PrismaModule`, `BlockStylesModule`, `forwardRef(() => BlockTemplateModule)`, `ImageModule`,
`forwardRef(() => ArticleModule)`, `forwardRef(() => PageModule)`, `EventModule`, `PeerModule`,
`CommentModule`, `TagModule`, `forwardRef(() => MemberPlanModule)`, `SettingModule`; provides the
seven block resolvers plus `SlotTeasersLoader`; exports only `SlotTeasersLoader`. It is registered
once at `apps/api-example/src/nestapp/app.module.ts:18,276`.

**The forwardRefs are not cosmetic.** `block-content/api` depends on `article/api`, `page/api` and
`event/api`, and each of those depends back on `block-content/api`. `flex/flex-block.model.ts`
goes further and `require()`s `../block-content.model` lazily, with a comment explaining why
(`:1-10`):

> A static `import` of it here would close the import cycle between the two modules, which makes
> webpack initialize `block-content.model` first. Its `emitDecoratorMetadata` output then reads
> `FlexBlockInput` eagerly while this module is still in its temporal dead zone, throwing
> "Cannot access 'FlexBlockInput' before initialization" at boot.

`block-template/block-template.model.ts` uses the same `require()` trick (`:23`, `:38`, `:101`).

### 5.8 Caching and full-text search over blocks

Block content participates in two cross-cutting mechanisms:

- **Public content cache.** `BlockStylesService` and `BlockTemplateService` call
  `publicContentCache.invalidate()` + `invalidateArticleLayout()` whenever a style or template
  changes, because those change the rendering of every article/page that references them.
  `ArticleService.createArticle` / `createPage` call `invalidateDraft('articles'|'pages')`.
- **Full-text search.** A GIN index indexes richtext *inside the blocks column*
  (`libs/api/prisma/migrations/20250527020202_add_fulltext_search_index/migration.sql`):

  ```sql
  CREATE INDEX "article_revisions_fulltext_search_idx" ON "articles.revisions" USING GIN (
    to_tsvector('german', COALESCE(title, '')) ||
    to_tsvector('german', COALESCE("preTitle", '')) ||
    to_tsvector('german', COALESCE(lead, '')) ||
    jsonb_to_tsvector('german',
      jsonb_path_query_array(blocks, 'strict $.**."richText"'::jsonpath), '["string"]'::jsonb)
  );
  ```

  and `ArticleService` issues the matching query
  (`libs/article/api/src/lib/__snapshots__/article.service.spec.ts:718-724`). Note the page index
  (`20240925103400_full_text_search_inx`) still uses `$.**.text`, which matched Slate leaves; after
  the ProseMirror migration `text` is still the key on a TipTap text node, so it keeps working.

---

## 6. Richtext

### 6.1 It is TipTap/ProseMirror, not Slate — since April 2026

The name "Slate node shape" in the brief is out of date. `libs/richtext/src/lib/json-format.interface.ts`
is built on `@tiptap/core`'s `NodeType`/`MarkType`, and the migration
`20260420120001_migrate_slate_to_prosemirror` plus the `SlateToPmMigrator` cron service converted
the whole database. The Slate shape still exists in the database, under `slate*` columns and the
`slateRichText` key inside blocks (§5.4, §6.5).

### 6.2 The document shape

`libs/richtext/src/lib/json-format.interface.ts:113-118`:

```ts
export type RichtextJSONDocument = NodeType<'doc', undefined, never, RichtextElements[]>;
```

i.e. `{ type: 'doc', content: RichtextElements[] }`.

**Nodes** (`:40-111`):

| `type` | `attrs` | Children |
| --- | --- | --- |
| `text` | — | none; carries `text: string` and `marks: RichtextMarks[]` |
| `paragraph` | `{ textAlign?: 'left'\|'right'\|'center'\|null }` | `Text[]` |
| `heading` | `{ level: 1..6, id?: string\|null, textAlign? }` | inline |
| `hardBreak` | — | — |
| `blockquote` | — | block |
| `codeBlock` | `{ language: string }` | inline |
| `image` | `{ src?, title?, alt? }` | — |
| `bulletList` | — | `ListItem[]` |
| `orderedList` | `{ start: number, type?: string\|null }` | `ListItem[]` |
| `listItem` | — | `paragraph block*` |
| `table` | — | `TableRow[]` |
| `tableRow` | — | `(TableHeader\|TableCell)[]` |
| `tableHeader` | `{ colspan, rowspan, colwidth: number[]\|null, borderColor: string }` | block |
| `tableCell` | `{ colspan, rowspan, colwidth: number[]\|null, borderColor?: string\|null }` | block |

**Marks** (`:3-38`): `bold`, `italic`, `underline`, `strike`, `subscript`, `superscript`,
`link { href, target?, rel?, id?, variant?: string|null }`,
`textStyle { backgroundColor?, color?, fontFamily?, fontSize?, lineHeight? }`.

A real document (from `libs/storybook/mocks/src/lib/richtext.ts`):

```json
{
  "type": "doc",
  "content": [
    { "type": "heading", "attrs": { "textAlign": null, "level": 3 },
      "content": [ { "type": "text", "text": "…" } ] },
    { "type": "paragraph", "attrs": { "textAlign": null },
      "content": [
        { "type": "text", "text": "Lorem ipsum dolor sit amet consectetur " },
        { "type": "text",
          "marks": [ { "type": "textStyle",
            "attrs": { "backgroundColor": null, "color": "#ff0000",
                       "fontFamily": null, "fontSize": null, "lineHeight": null } } ],
          "text": "adipiscing" },
        { "type": "text", "marks": [ { "type": "bold" } ], "text": "id cursus" }
      ] }
  ]
}
```

### 6.3 The GraphQL scalar — and the validation that is switched off

`libs/richtext/api/src/lib/richtext-scalar.ts`:

```ts
export const GraphQLRichText = new GraphQLScalarType({
  name: 'RichText',
  serialize(value) { return value; },
  parseValue(value) { return parseRichTextNode(value); },
  parseLiteral(literal) { return parseRichTextNode(valueFromASTUntyped(literal)); },
});

export function parseRichTextNode(value: unknown, path: string[] = []) {
  if (!is(Object, value)) {
    throw createRichTextError(`Expected object, found ${value}.`, path);
  }

  // const valid = validateSchema(value, editorConfig.extensions ?? []);
  //
  // if (!valid) {
  //   throw new Error();
  // }

  return value;
}
```

The `validateSchema` helper (`:7-17`) does exist and does the right thing —
`Node.fromJSON(getSchema(extensions), doc).check()` — but **the call is commented out**. The
effective contract of the `RichText` scalar today is "any JSON object". `serialize` is the
identity, so whatever is in the column goes out to clients unmodified.

There is **no HTML sanitisation anywhere in the richtext path**. The website renderer maps node
types to React elements (§6.7), so arbitrary HTML cannot be injected through richtext — except via
the `image` node, which does `<img {...element.attrs} />`
(`libs/richtext/website/src/lib/render-element.tsx:47-49`). Raw HTML gets into pages only through
`HTMLBlock`, which uses `dangerously-set-html-content`
(`libs/block-content/website/src/lib/html/html-block.tsx:7,18-21`).

`RichText` is declared in the schema at `apps/api-example/schema-v2.graphql:4882` and mapped to
`RichtextJSONDocument` in codegen (`codegen.yml`, `scalars: RichText: RichtextJSONDocument`).

### 6.4 Where richtext lives

Inside blocks: `RichTextBlock.richText`, `BreakBlock.richText`, `ListicleItem.richText`
(`libs/richtext/api/src/lib/slate-to-pm-migrator.ts:1031-1036` enumerates exactly these three
plus flex-nesting). Outside blocks, as plain `Json?` columns on entities:

| Table | Column | Legacy Slate column |
| --- | --- | --- |
| `authors` | `bio` | `slateBio` |
| `comments.revisions` | `text` | `slateText` |
| `events` | `description` | `slateDescription` |
| `peerProfiles` | `callToActionText` | `slateCallToActionText` |
| `peers` | `information` | `slateInformation` |
| `polls` | `infoText` | `slateInfoText` |
| `tags` | `description` | `slateDescription` |
| `member.plans` | `description`, `shortDescription` | `slateDescription`, `slateShortDescription` |
| `paywalls` | `description`, `circumventDescription`, `upgradeDescription`, `upgradeCircumventDescription` | `slate*` equivalents |

(from `slate-to-pm-migrator.ts:1184-1210` and `20260420120001_migrate_slate_to_prosemirror/migration.sql`)

**This is the existing precedent for "a richtext field that is not a block list": the current
`Event.description`.**

### 6.5 The migration service

`libs/richtext/api/src/lib/slate-to-pm-migrator.ts` (1429 lines) is a `@Injectable()` with a dozen
`@Cron` jobs that convert Slate → ProseMirror in the background and then `deleteCronJob` themselves
once nothing is left. Relevant mechanics for anyone importing legacy content:

- `slateToPm(content)` (`:23-217`) is the node mapper: `heading-one|two|three` → `heading` level
  **3/4/5**, `paragraph` → `paragraph{textAlign:'left'}`, `unordered-list` → `bulletList`,
  `ordered-list` → `orderedList{start:1}`, `list-item` → `listItem` with the inline run **wrapped
  in a leading paragraph** (tiptap requires `paragraph block*`), `quote` → `blockquote`,
  `table/table-row/table-cell` → `table/tableRow/tableCell`; Slate leaf booleans
  (`italic/bold/underline/strikethrough/subscript/superscript`) become marks; Slate `link` nodes
  become a `link` mark on each text leaf with `rel: 'noopener noreferrer nofollow'`.
- Empty text nodes are dropped, because "ProseMirror rejects text nodes whose `text` is not a
  non-empty string (RangeError: Invalid text node in JSON)" (`:37-47`).
- `migrate()` (`:933-946`) wraps the result in `{type:'doc', content}` and runs
  `normalizeListNesting`.
- `migrateBlocksFromSlate()` (`:1011-1044`) only rewrites a block when
  `slateRichText` is a non-empty array **and** `richText` is null or contains a buggy text node —
  never clobbering editor edits.
- Two jsonpath predicates drive the repair passes (`:1070-1079`):
  `'$.** ? (@.type == "text" && (!exists(@.text) || @.text == ""))'` and
  `'$.** ? (@.richText.type() == "null" && exists(@.slateRichText[0]))'`.

Anyone writing a BKa importer should read `slateToPm` first: it is the repo's worked example of
"foreign rich content → `RichtextJSONDocument`", including every ProseMirror validity trap.

### 6.6 The editor

`libs/richtext/editor/src/lib/richtext-editor.config.ts` configures TipTap v3
(`@tiptap/starter-kit@3.26.1`):

| Extension | Configuration |
| --- | --- |
| `TextStyleKit` | `fontSize: false, fontFamily: false, lineHeight: false` → only `color` / `backgroundColor` survive |
| `StarterKit` | `trailingNode: {node:'paragraph'}`; `link: { openOnClick:false, autolink:true, defaultProtocol:'https', protocols:['http','https','mailto'] }`; `orderedList/bulletList/listItem/listKeymap: false` (handed to `ListKit`) |
| `ListKit` | `taskList: false` |
| `Highlight` | `multicolor: true` — **configured but not in `RichtextMarks` and not handled by `RenderLeaf`** |
| `Superscript`, `Subscript` | — |
| `TextAlign` | `types: ['heading','paragraph']` |
| `Typography` | smart quotes/dashes |
| `TableKit` | `table: {resizable:true}`, custom `TableCellWithBorder` / `TableHeaderWithBorder` |
| `InvisibleCharacters` | `visible:false` |
| `Placeholder` | i18n placeholders for heading/paragraph |
| `HeadingId` | adds `attrs.id` to headings |
| `SmilieReplacer`, `Commands` | We.Publish extensions; `Commands` drives the `/` menu (table, quote, code — `editor/extensions/commands/command-suggestions.tsx`) |
| `LinkVariant` | adds `variant: 'buttonLinkMain' \| 'buttonLinkSecondary'` to links |

The component is `RichtextEditor` (`richtext-editor.tsx:174-274`):

```ts
type RichtextEditorProps = {
  defaultValue?: UseEditorOptions['content'];
  value?: UseEditorOptions['content'];
  disabled?: boolean;
  autofocus?: boolean;
  onChange?: (values: { json: RichtextJSONDocument; html: string }) => void;
};
```

The editor's menu bar offers headings 1–6, bold/italic/underline/strike/sub/sup, text + background
colour, link, bullet/ordered list (task list is commented out, `menu-bar.tsx:349-354`), text align,
table, code block, blockquote, invisible characters. There is **no UI for `horizontalRule`, the
`code` inline mark, `highlight` or `image`** even though the extensions are loaded — so those node
and mark types can appear only through an import.

`RichTextBlock` in the editor is a thin wrapper
(`libs/ui/editor/src/lib/blocks/richTextBlock/rich-text-block.tsx`) and is reused for *plain*
richtext fields all over the admin: `apps/editor/src/app/routes/events/eventForm.tsx:194`,
`polls/pollEditView.tsx:294`, `tags/tagForm.tsx:103`, `goodie/goodieForm.tsx:173`,
`paywall/paywallForm.tsx:212,227,255,270`. The event form is the exact precedent:

```tsx
<FormControl fullWidth>
  <FormLabel>{t('event.form.description')}</FormLabel>
  <Controller
    control={control}
    name="description"
    render={({ field }) => (
      <RichTextBlock value={field.value} onChange={field.onChange} />
    )}
  />
</FormControl>
```

### 6.7 The website renderer

`libs/richtext/website/src/lib/render-richtext.tsx` walks `document.content`;
`render-element.tsx` switches on `element.type` and delegates headings/paragraph/lists to the
website-builder `elements` registry (`H1..H6`, `Paragraph`, `ListItem`, `OrderedList`,
`UnorderedList`); `render-leaf.tsx` folds marks around the text. Handled: `image`, `heading`,
`paragraph`, `text`, `listItem`, `orderedList`, `bulletList`, `table`, `tableRow`, `tableHeader`,
`tableCell`, `codeBlock`, `blockquote`, `hardBreak`. Everything else returns `null`
(`render-element.tsx:243`). Marks handled: `bold`, `italic`, `underline`, `strike`, `superscript`,
`subscript`, `link` (through the builder's `Link`, honouring `class` and `id`), `textStyle`
(inline `style`); unknown marks pass through transparently.

Wiring: `richtext={{ RenderElement, RenderLeaf, RenderRichtext }}` in
`libs/website/src/lib/website.provider.tsx`.

### 6.8 Richtext utilities (`libs/richtext/src/lib`)

| Export | Signature | Use |
| --- | --- | --- |
| `toPlaintext(nodes)` | accepts a `doc`, a node array, and tolerates Slate's `children` as well as TipTap's `content` | comment length check (`libs/comments/api/src/lib/comment.service.ts:641`), editor previews, flex-block labels |
| `firstParagraphToPlaintext(nodes)` | first `paragraph` → text | teaser leads |
| `findFirstParagraph(nodes)` / `truncateParagraph(max)` / `truncateFirstParagraph(max)` | truncate to N characters inside the richtext structure | `EventBlock` website component uses `truncateFirstParagraph(255)` (`libs/block-content/website/src/lib/event/event-block.tsx:23`) |
| `normalizeListNesting(node)` | repairs `listItem > listItem` by wrapping orphan runs in a synthetic list; returns the same reference when nothing changed | run by the Slate migrator; worth running on any import |

---

## 7. Block templates

A block template is a **named, reusable block list** stored in its own table and referenced from
other block lists by a `blockTemplate` block. Added 2026-09
(`20260908074237_create_block_template`), it is the newest entity to have been given a `blocks`
field, and therefore the cleanest worked example for §8.

| Piece | Location |
| --- | --- |
| Prisma | `schema.prisma:1616-1626` → `block_templates (id, createdAt, modifiedAt, name UNIQUE, blocks Json)` |
| Model | `block-template/block-template.model.ts` — `BlockTemplate implements HasBlockContent`, `PaginatedBlockTemplate`, `BlockTemplateListArgs` (cursor/take/skip/filter/sort/order), `CreateBlockTemplateInput`, `UpdateBlockTemplateInput`, and the `BlockTemplateBlock` block itself |
| Service | `block-template/block-template.service.ts` |
| Resolvers | `block-template/block-template.resolver.ts` — `BlockTemplateResolver` (+ a `blocks` ResolveField that runs the slot loader) and `BlockTemplateBlockResolver` (resolves `template` from `templateId`) |
| Dataloader | `block-template/block-template-dataloader.service.ts` |
| Permissions | `CanCreateBlockTemplate` / `CanUpdateBlockTemplate` / `CanDeleteBlockTemplate` (`libs/permissions/src/lib/permissions.ts:913-929`); queries are `@Public()` |
| Editor | `apps/editor/src/app/routes/blockTemplate/blockTemplateList.tsx`, `blockTemplateEditView.tsx`, `deleteBlockTemplateModal.tsx`; routes at `apps/editor/src/app/app.tsx:418-434` |
| Website | `libs/block-content/website/src/lib/block-template/block-template-block.tsx` |

### 7.1 The only real content validation in the framework

`block-template.service.ts:116-171`:

```ts
private async mapBlocks(blocks: BlockContentInput[], id?: string): Promise<Prisma.InputJsonValue> {
  const referencedIDs = getInputTemplateIDs(blocks);

  if (referencedIDs.some(referencedID => !referencedID)) {
    throw new BadRequestException(
      `Block template blocks without a referenced block template can not be saved.`
    );
  }

  if (id) {
    await this.assertNoCircularReference(id, referencedIDs);
  }

  return blocks.map(mapBlockUnionMap) as unknown as Prisma.InputJsonValue;
}
```

`assertNoCircularReference` does a breadth-first walk over stored templates
(`getStoredTemplateIDs`, `:236-256`) and throws
`Block templates can not contain circular references.`

### 7.2 Expansion at read time

`BlockTemplateResolver.blocks` (`:94-103`) runs the slot loader over the template's own blocks
unless `SlotTeasersLoader` has already populated them (tracked with a `WeakSet`, `:97`, `:244-246`).
`SlotTeasersLoader.expandBlockTemplates` (`:187-242`) recursively inlines templates up to the cycle
guard.

### 7.3 In the editor

`blocks/blockTemplateBlock.tsx` shows a read-only preview of the template's blocks rendered with
the same `BlockMap` fields in `disabled` mode, filters out `disabled` template blocks for the
preview (`:178-180`), links to the template editor, and offers **"use content"** — which calls
`onReplace(blocks)` to *detach* the template into plain blocks in the host list
(`:214-217`, handled by `BlockList.handleReplace`, `atoms/blockList.tsx:354-364`).

---

## 8. Recipe: giving a NEW entity a `blocks` field

Worked from the two existing precedents: `ArticleRevision` (blocks on a revision) and
`BlockTemplate` (blocks on a plain entity). Every path below is real.

### Step 1 — Prisma

Add a non-nullable `Json` column. Do **not** give it a default; both existing models require it.

```prisma
// libs/api/prisma/schema.prisma — cf. :23 (ArticleRevision) and :1622 (BlockTemplate)
model EventRevision {
  id        String   @id @default(dbgenerated("gen_random_uuid()"))
  createdAt DateTime @default(now()) @db.Timestamptz(3)
  /* … */
  blocks    Json
  /* … */
  @@map("events.revisions")
}
```

Then `npx prisma migrate dev --name add_event_revision_blocks` (per the repo's runner table). If
the entity should be searchable, add the GIN index copied from
`20250527020202_add_fulltext_search_index`.

### Step 2 — the GraphQL object type implements `HasBlockContent`

`libs/article/api/src/lib/article.model.ts:57-61` is the template:

```ts
@ObjectType({
  implements: () => [HasBlockContent, HasOptionalUserLc],
})
export class ArticleRevision implements HasBlockContent, HasOptionalUserLc {
  blocks!: Array<typeof BlockContent>;
  /* … */
}
```

Note: **no `@Field` decorator on `blocks`.** The field comes from the interface; decorating it
again would double-register it. Import from `@wepublish/block-content/api`:

```ts
import { BlockContent, BlockContentInput, HasBlockContent } from '@wepublish/block-content/api';
```

### Step 3 — the input type takes `[BlockContentInput!]!`

`article.model.ts:222-268` omits `blocks` from the `OmitType` base and re-adds it as the input
array:

```ts
@ArgsType()
export class CreateArticleInput extends OmitType(
  ArticleRevision,
  ['id', 'createdAt', 'publishedAt', 'archivedAt', 'userId', 'user', 'image',
   'socialMediaImage', 'authors', 'socialMediaAuthors', 'blocks', 'properties'] as const,
  ArgsType
) {
  @Field(() => [BlockContentInput])
  blocks!: BlockContentInput[];
  /* … */
}
```

`BlockTemplate` does the same with `PickType` (`block-template.model.ts:95-109`):

```ts
@ArgsType()
export class CreateBlockTemplateInput extends PickType(BlockTemplate, ['name'] as const, ArgsType) {
  @Field(() => [require('../block-content.model').BlockContentInput])
  blocks!: BlockContentInput[];
}
```

(the `require` is only needed *inside* `block-content/api` because of the import cycle — an
external lib can `import` normally.)

### Step 4 — the service maps the input before writing

`libs/article/api/src/lib/article.service.ts:159,181`:

```ts
const mappedBlocks = blocks.map(mapBlockUnionMap);
/* … */
revisions: { create: { ...revision, userId, blocks: mappedBlocks as any[], /* … */ } }
```

`libs/page/api/src/lib/page.service.ts:138,191` inlines it:

```ts
blocks: blocks.map(mapBlockUnionMap) as any[],
```

The `as any[]` cast is unavoidable: Prisma's `InputJsonValue` and the union type do not line up.
`BlockTemplateService` casts to `Prisma.InputJsonValue` instead
(`block-template.service.ts:132`).

### Step 5 — the resolver runs the slot loader

`libs/article/api/src/lib/article-revision.resolver.ts:16-31`:

```ts
@Resolver(() => ArticleRevision)
export class ArticleRevisionResolver {
  constructor(
    @Inject(forwardRef(() => SlotTeasersLoader))
    private slotTeasersLoader: SlotTeasersLoader,
    /* … */
  ) {}

  @ResolveField(() => [BlockContent])
  async blocks(@Parent() parent: ArticleRevision) {
    return await this.slotTeasersLoader.loadSlotTeasersIntoBlocks(parent.blocks);
  }
}
```

Skipping this step means `teaserSlots` blocks come back with empty `teasers` and `blockTemplate`
blocks with `template: null`. If the new entity will never carry teaser or template blocks (see
§9.3 for how to enforce that), the ResolveField can be omitted — but the loader is cheap and
idempotent, so copying it is the safer default.

The owning module must import `BlockContentModule` (usually behind a `forwardRef`, since
`BlockContentModule` likely imports the new module back) and inject `SlotTeasersLoader`, which is
the module's only export.

### Step 6 — register the module

`BlockContentModule` is already registered globally
(`apps/api-example/src/nestapp/app.module.ts:276`), so nothing is needed there unless the new
entity's own module is new.

### Step 7 — regenerate the schema, then the client types

The schema is code-first with `autoSchemaFile: './apps/api-example/schema-v2.graphql'` and
`sortSchema: true` (`app.module.ts:112-116`) — start the API once to rewrite it, then:

```
npm run generate-api     # graphql-codegen --config codegen.yml && nx run-many -t build -p editor-api,website-api
```

Never hand-edit `schema-v2.graphql`, `libs/*/api/src/lib/gql/**` or `schema-types.ts`.

### Step 8 — GraphQL documents

Editor documents live in `libs/editor/api/src/lib/schemas/*.graphql`, website documents in
`libs/website/api/src/lib/schemas/*.graphql`. Select `...FullBlock` for the read and declare
`[BlockContentInput!]!` for the write. From `libs/editor/api/src/lib/schemas/article.graphql:1-6`
and `:65-91`:

```graphql
fragment FullArticleRevision on ArticleRevision {
  ...FullArticleRevisionWithoutBlocks
  blocks { ...FullBlock }
}

mutation CreateArticle($blocks: [BlockContentInput!]!, /* … */) {
  createArticle(blocks: $blocks, /* … */) { ...FullArticle }
}
```

`FullBlock` is defined once per side:
`libs/editor/api/src/lib/schemas/block.graphql:433-552` (editor; builds on
`BlockWithoutTeaser` at `:1-351`) and `libs/website/api/src/lib/schemas/block-content.graphql:627-660`
(website; builds on `BlockWithoutTeaser` at `:338-473`). The editor fragment selects `blockStyle`
*and* `blockStyleName`; the website fragment aliases `blockStyle: blockStyleName`.

To restrict which blocks the new entity can carry **at the wire level**, write an entity-specific
fragment instead of reusing `FullBlock` — `BlockTemplateContent`
(`libs/editor/api/src/lib/schemas/block-template.graphql:1-…`) is the precedent: it reuses
`BlockWithoutTeaser` but only re-adds the teaser/flex/template variants it wants, and it uses a
*shallower* `NestedBlockTemplateBlock` fragment so nested templates are not expanded forever.

### Step 9 — the editor screen

From `apps/editor/src/app/routes/blockTemplate/blockTemplateEditView.tsx`:

```tsx
const initialBlocks: BlockValue[] = [];                              // :53
const [blocks, setBlocks] = useState<BlockValue[]>(isNew ? initialBlocks : []);  // :65

const handleChange = useCallback((blocks: SetStateAction<BlockValue[]>) => {     // :87
  setBlocks(blocks);
  setChanged(true);
}, []);

// hydrate from the query
setBlocks((blocks as FullBlockFragment[]).map(blockForQueryBlock));   // :120

// serialise for the mutation
return { name, blocks: blocks.map(mapBlockValueToBlockInput) };       // :128-133

// render
<BlockList value={blocks} onChange={handleChange} disabled blockMap={BlockMap} />  // :245
```

`blockForQueryBlock` (`libs/ui/editor/src/lib/blocks/types.ts:1065-1593`) switches on
`__typename` and produces `{key: nanoid(), type: EditorBlockType, value}`;
`mapBlockValueToBlockInput` (`:564-1009`) switches on `type` and produces the one-key
`BlockContentInput`. **Both must gain a case if a new block type is ever added**; `blockForQueryBlock`
throws `new Error('Invalid Block')` on an unknown `__typename` (`:1591`).

`ArticleEditor` additionally seeds a new document with a Title + Image block
(`apps/editor/src/app/routes/articles/articleEditor.tsx:112-123`) and passes `itemId` to
`BlockList` so blocks can reference the owning entity.

### Step 10 — the website

Nothing entity-specific is needed if the entity renders its blocks with the builder's `Blocks`
component (`libs/article/website/src/lib/article.tsx:85,103-108`):

```tsx
const { blocks: { Blocks } } = useWebsiteBuilder();
/* … */
<Blocks key={article.id} blocks={article.latest.blocks ?? []} type="Article" />
```

Note `BuilderBlockRendererProps['type']` is the string union `'Page' | 'Article'`
(`libs/website/builder/src/lib/blocks.interface.ts:37-48`) — adding `'Event'` means touching that
type and the three tenant `Blocks` overrides (`apps/mannschaft`, `apps/reflekt`, `apps/tsri`).

### Step 11 — checklist

| # | File | Change |
| --- | --- | --- |
| 1 | `libs/api/prisma/schema.prisma` + a new migration | `blocks Json` (+ optional GIN index) |
| 2 | `libs/<domain>/api/src/lib/<entity>.model.ts` | `implements HasBlockContent`, undecorated `blocks!: Array<typeof BlockContent>` |
| 3 | same file | create/update input: `@Field(() => [BlockContentInput]) blocks!: BlockContentInput[]` |
| 4 | `libs/<domain>/api/src/lib/<entity>.service.ts` | `blocks.map(mapBlockUnionMap) as any[]` on create **and** update |
| 5 | `libs/<domain>/api/src/lib/<entity>-revision.resolver.ts` | `@ResolveField(() => [BlockContent]) blocks()` → `slotTeasersLoader.loadSlotTeasersIntoBlocks` |
| 6 | `libs/<domain>/api/src/lib/<entity>.module.ts` | import `forwardRef(() => BlockContentModule)` |
| 7 | `libs/editor/api/src/lib/schemas/<entity>.graphql` | `blocks { ...FullBlock }` + `$blocks: [BlockContentInput!]!` |
| 8 | `libs/website/api/src/lib/schemas/<entity>.graphql` | `blocks { ...FullBlock }` |
| 9 | run the API once, then `npm run generate-api` | regenerates `schema-v2.graphql`, `gql/`, `schema-types.ts` |
| 10 | `apps/editor/src/app/routes/<entity>/<entity>Editor.tsx` | `BlockList` + `blockForQueryBlock` + `mapBlockValueToBlockInput` |
| 11 | `libs/<domain>/website/src/lib/<entity>.tsx` | `<Blocks blocks={…} type={…} />` |
| 12 | *(optional)* `libs/website/builder/src/lib/blocks.interface.ts` | widen `type` if a new renderer context is needed |

Nothing needs to change in `libs/block-content/**` itself unless a **new block type** is being
added — that is a different, longer list: `block-type.model.ts`, the new model file, the union
`types` array and `resolveType`, `BlockContentInput`, possibly `mapBlockUnionMap`, `index.ts`, the
Prisma `BlockType` enum (if it should be style-able) with an `ALTER TYPE … ADD VALUE` migration
(see `20260904083051_add_missing_block_enum_value`), both `FullBlock` fragments, `BlockMap`,
`BlockValue`, `blockForQueryBlock`, `mapBlockValueToBlockInput`, the website component + guard,
`BlockRenderer`'s `cond` list, `blocks.interface.ts`, `website-builder.context.tsx` and
`website.provider.tsx`.

---

## 9. The editor side

### 9.1 `BlockList` — the whole list editor

`libs/ui/editor/src/lib/atoms/blockList.tsx` (610 lines). Key types:

```ts
export interface BlockListValue<T extends string = string, V = any> {
  key: string;     // nanoid, client-side only, never persisted
  type: T;         // EditorBlockType
  value: V;        // the block's own fields + blockStyle + disabled
}

export interface BlockCaseProps<V = any> {
  label: string;                    // i18n key
  icon: ReactElement;
  group: BlockGroup;
  defaultValue: ValueConstructor<V>;
  field: BlockConstructorFn<V>;     // (props: BlockProps<V>) => JSX.Element
  bare?: boolean;
}

export type BlockMapForValue<R extends BlockListValue> = /* maps each type to its BlockCaseProps */;

export interface BlockListProps<V extends BlockListValue> extends BlockProps<V[]> {
  blockMap: BlockMapForValue<V>;
}
```

`BlockList` owns the whole array: `handleAdd` (splices a new entry built from `defaultValue` with
a fresh `nanoid` key), `handleItemChange`, `handleReplace` (used by the block-template detach),
`handleRemove`, `handleMoveUp`/`handleMoveDown`, and renders an `AddBlockButton` *before every
item and after the last* (`:414-457`). Each item is wrapped in `ListItemWrapper`
(`:479-609`) which supplies the hide/show toggle (`value.value.disabled`), delete, move up/down,
and the per-block **block style `<Select>`** populated from the `BlockStylesDocument` query and
filtered to styles whose `blocks` array contains this block's type (`:492-500`).

`BlockMap` itself is at `libs/ui/editor/src/lib/blocks/blockMap.tsx:60-410`, typed
`BlockMapForValue<BlockValue>` where `BlockValue` is the 22-member union at
`libs/ui/editor/src/lib/blocks/types.ts:540-562`.

The "add block" menu (`atoms/addBlockInput.tsx:38-89`) groups entries by `BLOCK_GROUPS` and
renders a `ListSubheader` per non-empty group — so an allow-list that empties a group simply
removes that heading.

### 9.2 Who uses `BlockList`

| Caller | Block map |
| --- | --- |
| `apps/editor/src/app/routes/articles/articleEditor.tsx:978-984` | full `BlockMap` |
| `apps/editor/src/app/routes/pages/pageEditor.tsx:787` | full `BlockMap` |
| `apps/editor/src/app/routes/blockTemplate/blockTemplateEditView.tsx:245` | full `BlockMap` |
| `libs/ui/editor/src/lib/panel/revisionContentPreview.tsx:134-140` | full `BlockMap`, `disabled` (read-only revision preview) |
| `libs/ui/editor/src/lib/blocks/blockTemplateBlock.spec.tsx:138` | test |

`FlexBlock` does not use `BlockList`; it renders `BlockListItem` directly inside a
`react-grid-layout` and picks the nested block through `BlockSelectAndEditPanel`
(`libs/ui/editor/src/lib/blocks/flexBlock.tsx:422,553,705-708`).

### 9.3 Offering a restricted subset of blocks to a new entity

Three independent levers already exist, and they compose:

**(a) Pass a narrowed `blockMap` to `BlockList`.** `blockMap` is a prop, not a global. A subset
map is a plain object literal — the add-menu, the default values and the per-item renderers all
derive from it, and `AddBlockInput` will only show the groups that still have entries:

```tsx
// a hypothetical apps/editor/src/app/routes/events/eventEditor.tsx
import { BlockMap } from '@wepublish/ui/editor';
import { EditorBlockType } from '@wepublish/editor/api';

const EventBlockMap = {
  [EditorBlockType.RichText]:      BlockMap[EditorBlockType.RichText],
  [EditorBlockType.Image]:         BlockMap[EditorBlockType.Image],
  [EditorBlockType.ImageGallery]:  BlockMap[EditorBlockType.ImageGallery],
  [EditorBlockType.Quote]:         BlockMap[EditorBlockType.Quote],
  [EditorBlockType.Embed]:         BlockMap[EditorBlockType.Embed],
  [EditorBlockType.Html]:          BlockMap[EditorBlockType.Html],
};

<BlockList value={blocks} onChange={handleChange} blockMap={EventBlockMap} />
```

This is purely a UI restriction — the API would still accept any `BlockContentInput`.

**(b) Narrow the GraphQL fragment.** Write an `EventBlockContent` fragment that only inlines the
allowed `... on XBlock` selections, the way `BlockTemplateContent` does. Then
`blockForQueryBlock` never sees a disallowed variant, and a block that somehow got stored would
come back with only `__typename` populated.

**(c) Enforce it server-side.** Nothing does this today. The cheapest honest enforcement is a
guard in the entity's service, next to the `mapBlockUnionMap` call:

```ts
const ALLOWED = new Set<BlockType>([BlockType.RichText, BlockType.Image, /* … */]);
const mapped = blocks.map(mapBlockUnionMap);
const rejected = mapped.filter(b => !ALLOWED.has(b.type));
if (rejected.length) {
  throw new BadRequestException(`Block type(s) not allowed on an event: …`);
}
```

`BlockTemplateService.mapBlocks` (`:116-133`) is the existing precedent for throwing a
`BadRequestException` from inside the block-mapping step.

---

## 10. Per-entity allow-listing that already exists

### 10.1 `allowedBlockTypes` — the flex-block nested picker

`libs/ui/editor/src/lib/panel/blockSelectAndEditPanel.tsx:9-34` is the **only** explicit block
allow-list in the repo:

```ts
export type AllowedBlockTypes = { [K in EditorBlockType]?: boolean };

export const allowedBlockTypes: AllowedBlockTypes = {
  [EditorBlockType.TeaserSlots]: true,
  [EditorBlockType.Image]: true,
  [EditorBlockType.Embed]: true,
  [EditorBlockType.RichText]: true,
  [EditorBlockType.Crowdfunding]: true,
  [EditorBlockType.LinkPageBreak]: true,
};
```

It is consumed by `BlockSelectPanel` (`blockSelectPanel.tsx:52-57`), which filters the
`Object.entries(BlockMap)` list by `item.id in allowedBlockTypes`. `BlockSelectAndEditPanel` is
used only by `FlexBlock` (`blocks/flexBlock.tsx:51`), so **inside a flex block you can only insert
those six block types**, while the top-level list offers all 22. It is a module-level constant, not
a prop of `BlockSelectAndEditPanel` — making it per-entity would mean threading it through
`FlexBlock` first.

### 10.2 `BlockStyle.blocks` — per-block-type style allow-list

Described in §4. This is a *data-driven* allow-list stored in the database, but it restricts
styles-per-block, not blocks-per-entity.

### 10.3 Fragment-level restriction

`BlockTemplateContent` / `NestedBlockTemplateBlock`
(`libs/editor/api/src/lib/schemas/block-template.graphql`) restrict how deeply nested templates are
fetched, and `NestedTeaserBlock` (`block.graphql:553-605`) is the shallower variant used inside
flex blocks. Same mechanism, different purpose.

### 10.4 There is no per-entity allow-listing for Article vs Page

`articleEditor.tsx`, `pageEditor.tsx` and `blockTemplateEditView.tsx` all pass the **identical,
complete** `BlockMap`. An article can contain a `TeaserSlots` block, a page can contain a `Title`
block, and nothing prevents either. Any restriction for events would be the first of its kind.

---

## 11. Known gaps and rough edges

These are stated from code reading; the We.Publish database was stopped, so none is confirmed
against a running system.

1. **`disabled` is not honoured on the website.** Every website block fragment selects `disabled`
   (`libs/website/api/src/lib/schemas/block-content.graphql`, ~30 occurrences), and the editor
   comments assert hidden blocks "are not rendered on the website"
   (`libs/ui/editor/src/lib/blocks/blockTemplateBlock.tsx:178`), but no website code path filters
   on it: `Blocks` (`libs/block-content/website/src/lib/blocks.tsx:477-507`) maps the whole array,
   `BlockRenderer` never tests it, no tenant `Blocks` override tests it
   (`grep -rn "\.disabled" apps --include="*.tsx"` finds nothing block-related), and the API does
   not strip disabled blocks. The only consumers are `SlotTeasersLoader` (teaser-autofill
   accounting, `slot-teasers-loader.ts:34,134`) and the editor's opacity/visibility toggle.
   **UNVERIFIED** at runtime, but there is no code that could do it.
2. **`BlockTemplateBlock` has no branch in the default `BlockRenderer`.** `blocks.tsx` imports 30
   type guards but not `isBlockTemplateBlock`, even though `blocks.BlockTemplate` is registered in
   `libs/website/src/lib/website.provider.tsx:321` and the component exists. `cond` returns
   `undefined` when nothing matches, so a `blockTemplate` block renders nothing on the public site.
   (There is an in-progress worktree named `flatten-block-templates`, which suggests this is being
   addressed.)
3. **Richtext schema validation is commented out** (`richtext-scalar.ts:45-49`). Any JSON object is
   accepted as a `RichText`. This is why the Slate migration could write invalid documents that
   "the website tolerates … the editor throws `Invalid text node in JSON`"
   (`slate-to-pm-migrator.ts:949-955`).
4. **Dead code:** `libs/block-content/api/src/lib/nested-blocks/flex-block.model.ts` declares a
   second, incompatible `FlexBlock`/`FlexBlockInput` (with `nestedBlocks` instead of `blocks`) and
   is neither exported from `src/index.ts` nor imported anywhere. The live one is
   `flex/flex-block.model.ts`. (The website's `nested-blocks/flex-block.tsx` *is* live — same
   folder name, different library.)
5. **`RichtextMarks` omits `highlight` and the `code` mark**, and `RichtextElements` omits
   `horizontalRule`, although all three extensions are loaded by `editorConfig`. `RenderLeaf`
   passes unknown marks through and `RenderElement` returns `null` for unknown nodes, so these
   degrade quietly rather than crashing.
6. **`slateRichText` is still in every migrated block** and in the `slate*` columns. Nothing
   deletes it; the re-migration crons depend on it. Any BKa importer writing new blocks should
   simply not emit the key.
7. **The page full-text index still targets `$.**.text`** (`20240925103400_full_text_search_inx`)
   while the article index targets `$.**."richText"` (`20250527020202`). Both happen to work after
   the TipTap migration, but they are not the same expression.

---

## 12. Modelling the BKa event description — assessment

### 12.1 What BKa actually stores

From [`bka-01`](bka-01-data-model.md) §2.3 plus a live census of the restored production database
(SELECT-only, aggregates only):

| Key | Rows with key | `de` non-null | `fr` non-null | Validator |
| --- | --- | --- | --- | --- |
| `event.labels.description` | 34 279 | 34 279 | 3 212 | `EventDescription`: non-empty, **HTML-stripped length ≤ 6400** |
| `event.labels.printDescription` | 25 164 | 25 164 | 3 114 | `EventPrintDescription`: **HTML-stripped length ≤ 256** |

Shape of the German `description` values (34 275 non-null rows measured):

| Measure | Value |
| --- | --- |
| Raw length min / mean / max | 8 / 1 021 / 8 665 characters |
| Rows containing **no** `<` at all (plain text) | 6 087 (17.8 %) |
| Rows containing `<a ` | 3 426 (10.0 %) |
| Rows containing `<ul` or `<ol` | 59 (0.17 %) |
| Rows containing `<span` | 46 (0.13 %) |
| Rows containing `style=` | 54 (0.16 %) |
| Rows containing `<img` | **0** |
| Rows containing an HTML entity (`&…;`) | 28 678 (83.7 %) |

Complete tag census (every distinct tag name in the corpus, with total occurrences):

| Tag | Occurrences | Tag | Occurrences |
| --- | --- | --- | --- |
| `p` | 118 910 | `span` | 201 |
| `br` | 61 771 | `ul` | 65 |
| `strong` | 19 632 | `ol` | 5 |
| `a` | 4 897 | `div` | 4 |
| `em` | 332 | `u` | 4 |
| `li` | 240 | `h2` | 1 |
| | | `b` | 1 |

Complete attribute census: `class` (4 949), `href` (4 859), `rel` (2 743), `target` (2 743),
`style` (292), `title` (263), `lang` (33). Top entities: `&uuml;` 114 401, `&auml;` 90 544,
`&ouml;` 45 968, `&nbsp;` 42 860, `&ndash;` 25 124, `&laquo;`/`&raquo;` ~19 740 each,
`&eacute;` 9 556, `&amp;` 7 413, `&rsquo;` 7 163, `&shy;` 3 850, `&szlig;` 1 567, `&hellip;` 1 523.

`printDescription` is the same material, smaller: 18 288 non-null German values, 1–1 619 raw
characters (mean 191), **14 989 of them contain markup** and 13 814 contain entities; tags are
`p` 19 655, `br` 4 354, `strong` 1 737, `a` 166, `span` 26, `em` 3, `h2` 2, `b` 2. So the
"256-character print summary" is **not** plain text today — it is short HTML whose *stripped*
length is capped at 256.

### 12.2 The three options, assessed

**Option A — a full block list (`blocks Json` on the event revision).**

- *For:* uniform with Article and Page; an editor can add an image gallery, a YouTube embed, a
  teaser or a flex layout to an event body; the revision/draft/pending machinery, the block-style
  system and the website `Blocks` renderer all come for free; it is what the brief asks for.
- *Against:* for 100 % of the migrated corpus the import would produce a **single `richText`
  block**, because nothing in the BKa data maps to any other block type (no `<img>` at all, no
  embeds, no tables). The entity gains a nullable-free `Json` column it mostly uses at arity 1.
  Teaser and template blocks inside an event body are probably unwanted and nothing currently
  prevents them (§10.4).
- *Verdict:* **this is the right choice**, and it is already a taken constraint ("the new events
  must additionally use We.Publish's block-content framework"). The 1-block-after-import outcome
  is not an argument against it — it is the normal starting state of any imported article too. The
  thing to add is the restriction of §9.3(a)+(c).

**Option B — a single richtext *block* (`blocks` with a fixed arity of 1).**

- Strictly worse than A: identical storage and identical code, but with an artificial invariant the
  framework has no way to express. `BlockList` has no "max items" prop. Reject.

**Option C — a plain `description Json?` richtext field.**

- This is exactly what the *current* event does (`schema.prisma:1396`,
  `libs/event/api` — see [`wp-01`](wp-01-current-event-implementation.md) §2.2), and the editor
  already renders it with `<RichTextBlock>` inside a `Controller`
  (`apps/editor/src/app/routes/events/eventForm.tsx:190-199`).
- *For:* trivially matches the BKa data; `firstParagraphToPlaintext` / `truncateFirstParagraph`
  already work on it (`base-teaser.tsx:69`, `event-block.tsx:23`); no block-type policing needed.
- *Against:* it is the thing being replaced, and it forecloses images, galleries and embeds in an
  event body forever. BKa's *own* data has 0 `<img>` because images live in a separate `image`
  table with 27 571 `legend` labels — in other words, BKa events *do* have images, just not inside
  the description. A block list is where those would naturally go in We.Publish.
- *Verdict:* reject for the body; **keep it in mind for the print summary** (below).

**The print summary (`printDescription`, ≤ 256 stripped characters).** Modelling it as a block list
would be absurd. The two live precedents in the repo are:

| Pattern | Example | Type |
| --- | --- | --- |
| Short **plain-text** summary | `ArticleRevision.lead`, `ArticleRevision.seoDescription`, `ArticleRevision.socialMediaDescription`, `PageRevision.description`, `Event.lead` | `String?` — plain Postgres `text`, **no length constraint anywhere in the schema** (`grep -n "VarChar" schema.prisma` returns nothing) |
| Short **richtext** summary | `MemberPlan.shortDescription` (`schema.prisma:753`) | `Json?` |

Given that 82 % of BKa `printDescription` values *contain* markup — overwhelmingly just `<p>` and
`<br>` — but that the field is semantically a 256-character teaser line, the honest options are:

- `String?` + strip tags and decode entities at import, mirroring `ArticleRevision.lead` and
  `Event.lead`. Loses the `<strong>` in 1 737 occurrences and the 166 links. Simplest, and it
  matches how every other short summary in the repo is modelled.
- `Json?` richtext, mirroring `MemberPlan.shortDescription`, editable with the same
  `<RichTextBlock>` the event form already uses. Keeps the bold and the links.

Either way the 256-character rule must be re-implemented: **the repo enforces no string lengths in
Prisma at all**, and the only length check that exists anywhere is
`CommentService.addUserComment`, which counts `toPlaintext(input.text.content).length` against a
runtime setting and throws `CommentLengthError`
(`libs/comments/api/src/lib/comment.service.ts:641-649`). That is the pattern to copy for a
richtext-typed summary; for a `String?` a `zod` rule in the editor form (the event form is already
zod-based, `eventForm.tsx:41`) plus a service-side check is the equivalent.

### 12.3 What an HTML → richtext conversion involves

The repo already has both directions of the conversion and one worked importer.

**The tool.** `@tiptap/html@3.14.0` is a direct dependency (`package.json:284`) and
`generateJSON(html, extensions)` is already used by the event importer
(`libs/event/import/api/src/lib/import/kulturagenda-parser.ts:3,109`) — though that importer
*strips all tags first* (`replace(/(<([^>]+)>)/gi, '')`) and then patches the first node's type,
which is a cautionary example rather than a model. The reverse direction is used by the RSS feed
generator (`libs/feed/website/src/lib/feed-generator.ts:8-18`):

```ts
export const toHtml = async (document: RichtextJSONDocument) => {
  const { editorConfig } = await import('@wepublish/richtext/editor/config');
  return generateHTML(document, editorConfig.extensions ?? []);
};
```

Importantly, `editorConfig.extensions` is importable from the API side through the
`@wepublish/richtext/editor/config` alias (`tsconfig.base.json:109-111`) — so an importer can parse
HTML against **exactly the schema the editor will later edit**, which is what prevents the
"invalid document, editor throws" class of bug that the Slate migration hit.

**The steps, for this corpus specifically.**

1. **HTML-entity decode.** 83.7 % of values are entity-encoded (`&uuml;`, `&nbsp;`, `&laquo;`, …).
   `generateJSON` runs the markup through a DOM parser, which decodes named entities for free, so
   a separate decode pass is only needed for the 17.8 % of values that contain *no* tags at all and
   would otherwise be inserted verbatim. Watch `&shy;` (3 850 occurrences, a soft hyphen — it
   survives as U+00AD and is invisible but real) and `&nbsp;` (42 860, becomes U+00A0).
2. **Wrap tag-free values.** 6 087 German descriptions have no markup; they must become
   `{type:'doc',content:[{type:'paragraph',attrs:{textAlign:null},content:[{type:'text',text}]}]}`.
   Splitting on blank lines is optional; BKa's TinyMCE output suggests these are genuinely single
   paragraphs.
3. **Map the 13 tags.** Every one has a target in the configured schema:
   `p`→`paragraph`, `br`→`hardBreak`, `strong`/`b`→`bold` mark, `em`→`italic` mark,
   `u`→`underline` mark, `a`→`link` mark, `ul`→`bulletList`, `ol`→`orderedList`,
   `li`→`listItem`, `h2`→`heading{level:2}`, `div`→`paragraph`, `span`→drop (keep children).
   TipTap's StarterKit + ListKit parse rules already do all of this; nothing custom is required
   except deciding what to do with `span`/`class`/`style`.
4. **Decide the attribute policy.** `class` appears 4 949 times and `style` 292 times. The
   configured `TextStyleKit` keeps only `color` and `backgroundColor`
   (`richtext-editor.config.ts:22-26`), so inline `style="font-size:…"` is dropped automatically;
   `class` has no home in the schema except `link` (`RenderLeaf` reads a `class` attr off the link
   mark, `render-leaf.tsx:34-46`). `rel`/`target` on 2 743 links map cleanly onto the `link` mark's
   `rel`/`target` attrs. The Slate migrator's choice — force
   `rel: 'noopener noreferrer nofollow'` (`slate-to-pm-migrator.ts:61-69`) — is the house style.
5. **Normalise lists.** Only 59 rows have lists and only 240 `li` occurrences, but `li` without a
   wrapping `ul`/`ol`, and `li` directly containing `li`, are exactly the malformations
   `normalizeListNesting` exists for (`libs/richtext/src/lib/normalize-list-nesting.ts:51-99`).
   Run it on every converted document — it returns the same reference when nothing changed, so it
   is free for the 99.8 % that are clean.
6. **Validate.** Re-enable the check that the scalar has commented out, locally in the importer:
   `Node.fromJSON(getSchema(editorConfig.extensions), doc).check()`. The Slate migration's whole
   repair-cron saga (`slate-to-pm-migrator.ts:948-1210`) is what happens when this step is skipped.
7. **Wrap in a block.** `[{ type: 'richText', richText: <doc>, blockStyle: null }]` — exactly what
   `mapBlockUnionMap` would have produced from
   `{ richText: { richText: doc, blockStyle: undefined, disabled: undefined } }`. Do **not** emit
   `slateRichText`.
8. **French.** 3 212 events have a French description and 3 114 a French print summary. We.Publish
   has no per-field translation mechanism in the block system — `blocks` is a single column. That
   is a modelling decision outside this document's scope; flagging it because the conversion code
   will have to pick one language or produce two rows. **UNVERIFIED** whether the ported events are
   meant to be multilingual at all.

**Risk assessment.** Low. Thirteen tags, seven attributes, no images, no tables, no nesting deeper
than `ul > li`, and a parser that already exists in the dependency tree and is already used
elsewhere in this repo for precisely this transformation. The two things that will actually bite
are entity decoding for the tag-free 17.8 % and the `&shy;`/`&nbsp;` artefacts.

---

## 13. Porting notes

*Implications, clearly separated from the description above.*

1. **Use a full block list for the event body, and restrict it.** The framework-level restriction
   does not exist yet, so budget for it: a narrowed `blockMap` in the new event editor screen
   (§9.3a), a narrowed `FullBlock`-equivalent fragment (§9.3b), and a server-side allow-list check
   next to the `mapBlockUnionMap` call modelled on `BlockTemplateService.mapBlocks` (§9.3c). A
   sensible starting set: `RichText`, `Image`, `ImageGallery`, `Quote`, `Embed`, `HTML`,
   `LinkPageBreak` — i.e. the `text`, `media` and part of the `layout` groups, with the whole
   `teasers` group and `Event`/`Comment`/`Subscribe`/`MailchimpForm`/`BlockTemplate`/`FlexBlock`
   excluded. Excluding teaser blocks also means the `blocks` ResolveField could skip
   `SlotTeasersLoader` entirely, which removes the `forwardRef` dependency on `ArticleModule`.
2. **Model the print summary as a short field, not a block.** `String?` matches every other short
   summary in the repo (`ArticleRevision.lead`, `Event.lead`, `PageRevision.description`);
   `Json?` matches `MemberPlan.shortDescription` and preserves BKa's bold and links. Either way the
   256-character rule is new code — the schema has no length constraints and the only precedent is
   the comment-length check in `CommentService`.
3. **Two independent block-type vocabularies will both need an entry if events get their own block
   style.** Adding a new block type means touching `BlockType` (TS) *and* the Prisma `BlockType`
   enum with an `ALTER TYPE … ADD VALUE` migration. Reusing existing blocks avoids both.
4. **The existing `EventBlock` and `EventTeaser` are block-content citizens that survive the
   deletion of `libs/event/**`.** `EventBlockResolver` queries `prisma.event` directly
   (`event/event-block.resolver.ts:14-33`) and `SlotTeasersLoader.getAutofillTeasers` calls
   `EventService.getEvents` (`slot-teasers-loader.ts:335-358`). Both must be re-pointed at the new
   event service, and `BlockContentModule`'s `EventModule` import updated — this is work *inside*
   `libs/block-content/api`, which §8 otherwise says is untouched.
5. **The revision column is a single `Json`, which makes "blocks per revision" free.** Whatever
   `wp-05` concludes about draft/pending/published for events, the block list rides along in the
   revision row with no extra joins — exactly as it does for Article and Page. Conversely, the
   occurrence-expansion question in the open-questions list has no bearing on blocks: 118 021
   occurrences sharing one revision's block list costs nothing.
6. **Import directly into the ProseMirror shape.** Do not import Slate and let the migrator convert
   it; the `slate*` columns and the `slateRichText` key are legacy, the crons self-delete, and
   nothing guarantees they will still be running when a BKa import happens.
7. **Watch the import cycle.** Any new `event/api` that both consumes `BlockContentInput` and is
   consumed by `block-content/api` (for `EventBlock`/`EventTeaser`) re-creates the Article/Page
   cycle. Copy the `forwardRef(() => …)` pattern from `block-content.module.ts:30-39`, and if a
   model in `block-content/api` ever has to reference an event input type, copy the lazy-`require`
   pattern and its comment from `flex/flex-block.model.ts:1-10` — this exact cycle has already cost
   this repo a boot-time crash.
8. **`disabled` not being honoured on the website (§11.1) is a pre-existing bug, not something the
   event port introduces** — but an event body with a hidden block that still renders would be
   discovered during this work, so it is worth fixing or at least recording before it is blamed on
   the port.

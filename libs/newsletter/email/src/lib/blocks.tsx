/**
 * The newsletter's block vocabulary, rendered as email HTML.
 *
 * Everything is built from `@react-email/components` used as its documentation
 * shows: `Row`/`Column` for the tables and cells, `Text` for paragraphs,
 * `Heading`, `Img`, `Link` and `Button`. The library's markup is what mail
 * clients see, so the Outlook and Gmail workarounds baked into it are ours for
 * free — but each component also carries default colours, sizes and margins, so
 * every one of those is overridden from `theme.ts`. Two rules follow from that,
 * and both are load-bearing:
 *
 *   - a `Text` style must set `marginTop` *and* `marginBottom`; the component
 *     substitutes 16px for whichever one is missing;
 *   - a `Link` style must set the colour and the underline, since the component's
 *     defaults are a blue of its own and no underline at all.
 *
 * The layout reproduces campaign 6e2162b16f; see `theme.ts` for where each
 * measurement comes from.
 */
import {
  Button as EmailButton,
  Column,
  Heading as EmailHeading,
  Img,
  Link,
  Row,
  Text as EmailText,
} from '@react-email/components';
import { Fragment } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { MergeCondition } from './merge-tags';
import { conditionTags } from './merge-tags';
import { linkStyle, renderLines, renderParagraphs } from './inline';
import { theme } from './theme';

/**
 * How far a block sits in from the column edge — the editor's "Einzug".
 *
 * Three named values rather than a number: the issue this renderer reproduces
 * uses exactly these insets, and a free pixel field would let an editor produce
 * a column of blocks each a few pixels off from their neighbours.
 */
export type Gutter = 'article' | 'intro' | 'none';

/**
 * One entry of the document the editor builds. This is also the shape stored in
 * the database, which is why every variant is plain data: a block holds article
 * and image *ids* and text, never rendered HTML, so nothing the browser posts can
 * reach the email as markup.
 *
 * The `Einzug` and the dynamic-content `condition` are factored out of the union
 * rather than repeated in all nine variants: every block carries both, so
 * `parseDocument` validates them once and `renderBlock` applies them once.
 */
export type NewsletterBlock = {
  gutter?: Gutter;
  condition?: MergeCondition;
} & (
  | { type: 'rubric'; name: string }
  | {
      type: 'teaser';
      variant: 'big' | 'short';
      /**
       * The wepublish article this teaser shows. It is the *only* thing stored:
       * headline, kicker, lead, link and image are read from the CMS every time
       * the issue is rendered, so a correction to an article reaches an issue
       * that was drafted before it and no copy of the text can go stale here.
       */
      articleId: string;
      /** Filled by `resolveTeasers` before rendering; never stored. */
      teaser?: Teaser;
    }
  | { type: 'heading'; text: string }
  | { type: 'text'; paragraphs: string[] }
  | {
      type: 'image';
      /** An image of the media library. Absent until the editor picks one. */
      imageId?: string;
      /** Filled by `resolveImages` before rendering; never stored. */
      src?: string;
      alt: string;
      href?: string;
      caption?: string;
    }
  | { type: 'button'; label: string; href: string }
  | {
      type: 'panel';
      title: string;
      paragraphs: string[];
      link?: { label: string; href: string };
      /** Optional cover image on the left, as the "Gewusst?" box has. */
      imageId?: string;
      /** Filled by `resolveImages` before rendering; never stored. */
      imageUrl?: string;
    }
  /** The header row under the logo: a label on the left, the date on the right. */
  | { type: 'meta'; left: string; right: string }
  | { type: 'divider' }
  /**
   * The closing block. Pinned rather than optional — see `NewsletterFooter` for
   * why the editor cannot delete, move or duplicate it.
   */
  | ({ type: 'footer' } & FooterContent)
);

/**
 * What a block's `Einzug` falls back to when the document does not name one.
 *
 * The masthead region — the label row and the issue title — sits further in
 * than the article region, which is what the reproduced issue does; every other
 * block starts at the article gutter. Documents written before the field
 * existed therefore render exactly as they did.
 */
export const DEFAULT_GUTTER: Record<NewsletterBlock['type'], Gutter> = {
  rubric: 'article',
  teaser: 'article',
  heading: 'intro',
  text: 'article',
  image: 'article',
  button: 'article',
  panel: 'article',
  meta: 'intro',
  divider: 'article',
  footer: 'intro',
};

export interface Teaser {
  /** The source line above the headline, e.g. an institute or a company. */
  kicker?: string;
  /**
   * Empty is legitimate *before* resolution: a teaser that carries an
   * `articleId` stores blanks and takes its text from the CMS. After
   * `resolveTeasers` a blank title means the article could not be loaded.
   */
  title: string;
  lead: string;
  url: string;
  /** Big teasers only; a big teaser without one falls back to the short layout. */
  imageUrl?: string;
}

/** The chosen gutter as `theme` records it — a CSS length. */
function gutterWidth(gutter: Gutter): string {
  if (gutter === 'intro') {
    return theme.space.introGutter;
  }

  return gutter === 'none' ? theme.space.noGutter : theme.space.gutter;
}

/**
 * `nl-pad` is what the mobile media query narrows to 16px, so a block set to the
 * 48px intro gutter still fits a phone.
 *
 * A block set to `keiner` must not carry it: a full-width image would keep its
 * edge-to-edge layout on the desktop but gain 16px of white on either side on a
 * phone, which reads as a broken image rather than as a masthead.
 */
function mobilePad(gutter: Gutter): string | undefined {
  return gutter === 'none' ? undefined : 'nl-pad';
}

/** Shared by every block: the side inset the editor picked. */
function blockPadding(gutter: Gutter): CSSProperties {
  const side = gutterWidth(gutter);

  return { paddingLeft: side, paddingRight: side };
}

/**
 * The width left over between the two gutters.
 *
 * Images fill it rather than carrying a width of their own: Word sizes an image
 * from its `width` attribute and ignores `max-width`, so an attribute wider than
 * the cell makes Outlook widen the whole column and break the layout.
 */
function columnWidth(gutter: Gutter): number {
  return theme.contentWidth - 2 * Number.parseInt(gutterWidth(gutter), 10);
}

/** Both margins, because `Text` fills in 16px for either one left undefined. */
const paragraphStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 0,
  fontFamily: theme.font.body,
  fontSize: theme.size.body,
  lineHeight: theme.lineHeight.body,
  color: theme.color.text,
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: theme.font.body,
  fontSize: theme.size.heading,
  lineHeight: theme.lineHeight.heading,
  fontWeight: 700,
  color: theme.color.brand,
};

/** A link that carries the template's bold, underlined call-to-action look. */
const actionStyle: CSSProperties = {
  ...linkStyle(theme.color.link),
  fontWeight: 700,
};

/**
 * A full-width block container: one `Row` holding one padded `Column`.
 *
 * Every block is its own table rather than a row in one big table: Outlook
 * recovers from a broken table far better when the damage is contained to one
 * block, and it keeps background colours from bleeding between blocks.
 *
 * `Row`/`Column` rather than `Section`, whose single cell takes neither a class
 * nor a style — and the padding has to sit on the `<td>`, because Word drops
 * padding declared on a `<table>`.
 */
function Block({
  children,
  background,
  style,
  // Only for the mobile override: the side padding itself arrives through
  // `style`, because a block like the big teaser pads its inner columns instead.
  gutter = 'article',
}: {
  children: ReactNode;
  background?: string;
  style?: CSSProperties;
  gutter?: Gutter;
}) {
  return (
    <Row
      style={{
        borderCollapse: 'separate',
        backgroundColor: background ?? 'transparent',
      }}
    >
      <Column
        className={mobilePad(gutter)}
        style={{
          paddingTop: theme.space.block,
          paddingBottom: theme.space.block,
          ...style,
        }}
      >
        {children}
      </Column>
    </Row>
  );
}

/** A block whose content is inset by the editor's chosen `Einzug`. */
function PaddedBlock({
  children,
  gutter,
  background,
  style,
}: {
  children: ReactNode;
  gutter: Gutter;
  background?: string;
  style?: CSSProperties;
}) {
  return (
    <Block
      gutter={gutter}
      background={background}
      style={{ ...blockPadding(gutter), ...style }}
    >
      {children}
    </Block>
  );
}

/** `Text` at the newsletter's type scale, with both margins always written. */
function Paragraph({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <EmailText style={{ ...paragraphStyle, ...style }}>{children}</EmailText>
  );
}

/** `Lesen >>`, bold and underlined — the template's own call to action. */
function ReadMore({ href }: { href: string }) {
  return (
    <Paragraph style={{ marginTop: theme.space.block }}>
      <Link
        href={href}
        style={actionStyle}
      >
        {'Lesen >>'}
      </Link>
    </Paragraph>
  );
}

function Kicker({ text }: { text: string }) {
  return (
    <Paragraph style={{ fontWeight: 700, color: theme.color.brand }}>
      {text}
    </Paragraph>
  );
}

function TeaserHeadline({ teaser }: { teaser: Teaser }) {
  return (
    <EmailHeading
      as="h4"
      style={{ ...headingStyle, margin: `${theme.space.tight} 0 0 0` }}
    >
      <Link
        href={teaser.url}
        style={linkStyle(theme.color.brand, false)}
      >
        {teaser.title}
      </Link>
    </EmailHeading>
  );
}

function TeaserBody({ teaser }: { teaser: Teaser }) {
  return (
    <>
      {teaser.kicker ?
        <Kicker text={teaser.kicker} />
      : null}
      <TeaserHeadline teaser={teaser} />
      <Paragraph style={{ marginTop: theme.space.block }}>
        {teaser.lead}
      </Paragraph>
      <ReadMore href={teaser.url} />
    </>
  );
}

/**
 * Image left, text right, on the template's 12-column grid split 4/8.
 *
 * The two cells carry `class="nl-col"`, which the stylesheet turns into
 * `display: block; width: 100%` below 480px — the same mechanism Mailchimp's own
 * `.mceColumn` rule uses. Outlook never sees the media query and keeps the
 * `width` attributes, which is exactly what we want there.
 */
function TwoColumn({
  image,
  gutter,
  children,
}: {
  image: ReactNode;
  gutter: Gutter;
  children: ReactNode;
}) {
  return (
    <Row>
      {/* The left inset stays at the template's 20px whatever the block's
          Einzug is: `theme.bigTeaser.imageWidth` is derived from it, so a
          wider one would make the framed image overflow its column. The
          Einzug moves the text column, which is the side an editor sees. */}
      <Column
        className="nl-col"
        width={theme.bigTeaser.imageColumnPercent}
        valign="top"
        style={{ paddingLeft: '20px' }}
      >
        {image}
      </Column>
      <Column
        className={mobilePad(gutter) ? 'nl-col nl-pad' : 'nl-col'}
        width={theme.bigTeaser.textColumnPercent}
        valign="top"
        style={blockPadding(gutter)}
      >
        {children}
      </Column>
    </Row>
  );
}

/** The image in a `TwoColumn` left cell. `framed` adds the teaser's tint border. */
function ColumnImage({ src, framed }: { src: string; framed?: boolean }) {
  return (
    <Img
      src={src}
      alt=""
      width={theme.bigTeaser.imageWidth}
      className="nl-image"
      style={{
        width: '100%',
        maxWidth: `${theme.bigTeaser.imageWidth}px`,
        height: 'auto',
        // The pale-blue frame is a border on the image itself rather than a
        // wrapper cell: Word drops padding on images but honours borders, so
        // this is the one that survives Outlook.
        ...(framed ?
          {
            border: `${theme.bigTeaser.frameWidth}px solid ${theme.color.tint}`,
          }
        : {}),
      }}
    />
  );
}

function BigTeaser({ teaser, gutter }: { teaser: Teaser; gutter: Gutter }) {
  // Without an image there is nothing left to distinguish the two variants, so
  // the short one *is* the fallback rather than a second copy of its markup.
  if (!teaser.imageUrl) {
    return (
      <ShortTeaser
        teaser={teaser}
        gutter={gutter}
      />
    );
  }

  return (
    <Block>
      <TwoColumn
        gutter={gutter}
        image={
          <Link
            href={teaser.url}
            style={linkStyle(theme.color.brand, false)}
          >
            <ColumnImage
              src={teaser.imageUrl}
              framed
            />
          </Link>
        }
      >
        <TeaserBody teaser={teaser} />
      </TwoColumn>
    </Block>
  );
}

/** Text-only teaser: kicker, headline, lead, `Lesen >>`, then a rule. */
function ShortTeaser({ teaser, gutter }: { teaser: Teaser; gutter: Gutter }) {
  return (
    <PaddedBlock gutter={gutter}>
      <TeaserBody teaser={teaser} />
    </PaddedBlock>
  );
}

function MissingTeaser({
  articleId,
  gutter,
}: {
  articleId?: string;
  gutter: Gutter;
}) {
  return (
    <PaddedBlock gutter={gutter}>
      <Paragraph style={{ color: '#a11', fontWeight: 700 }}>
        {articleId ?
          `Artikel konnte nicht geladen werden (${articleId}). Bitte im Editor neu wählen.`
        : 'Für diesen Teaser ist kein Artikel gewählt.'}
      </Paragraph>
    </PaddedBlock>
  );
}

/** The rubric bar: an h4 on the pale-blue tint, 6px above and 12px below. */
function RubricHeading({ name, gutter }: { name: string; gutter: Gutter }) {
  return (
    <PaddedBlock
      gutter={gutter}
      background={theme.color.tint}
      style={{ paddingTop: '6px' }}
    >
      <EmailHeading
        as="h4"
        style={{ ...headingStyle, color: theme.color.text }}
      >
        {name}
      </EmailHeading>
    </PaddedBlock>
  );
}

function Divider({ gutter }: { gutter: Gutter }) {
  return (
    <PaddedBlock
      gutter={gutter}
      style={{ paddingTop: 0, paddingBottom: 0 }}
    >
      {/* A bordered cell, not the library's `Hr` — Outlook renders `<hr>` at its
          own width and colour and ignores most styling on it. */}
      <Row>
        <Column
          style={{
            borderTop: `1px solid ${theme.color.rule}`,
            fontSize: '1px',
            lineHeight: '1px',
          }}
        >
          &nbsp;
        </Column>
      </Row>
    </PaddedBlock>
  );
}

function Button({
  label,
  href,
  gutter,
}: {
  label: string;
  href: string;
  gutter: Gutter;
}) {
  return (
    <PaddedBlock gutter={gutter}>
      {/* The library's `Button` is an `<a>` carrying the mso-font-width padding
          hack, which is the one construction that pads a link in Outlook without
          a wrapper table. Padding must be part of `style` for it to compute. */}
      <EmailButton
        href={href}
        style={{
          backgroundColor: theme.color.brand,
          borderRadius: '4px',
          padding: '16px 28px',
          fontFamily: theme.font.body,
          fontSize: '16px',
          fontWeight: 700,
          color: theme.color.body,
        }}
      >
        {label}
      </EmailButton>
    </PaddedBlock>
  );
}

/** The "Gewusst?" style panel — a tinted box holding its own heading and text. */
function Panel({
  title,
  paragraphs,
  link,
  imageUrl,
  gutter,
}: {
  title: string;
  paragraphs: string[];
  link?: { label: string; href: string };
  imageUrl?: string;
  gutter: Gutter;
}) {
  const body = (
    <>
      <EmailHeading
        as="h4"
        style={{ ...headingStyle, margin: `0 0 ${theme.space.block} 0` }}
      >
        {title}
      </EmailHeading>
      {renderParagraphs(paragraphs, paragraphStyle)}
      {link ?
        <Paragraph style={{ marginTop: theme.space.block }}>
          <Link
            href={link.href}
            style={actionStyle}
          >
            {link.label}
          </Link>
        </Paragraph>
      : null}
    </>
  );

  const vertical: CSSProperties = {
    paddingTop: theme.space.section,
    paddingBottom: theme.space.section,
  };

  // With an image the padding stays on the outer cell and the columns take the
  // Einzug themselves, so the frame sits flush with the panel's own inset.
  if (imageUrl) {
    return (
      <Block
        gutter={gutter}
        background={theme.color.highlight}
        style={vertical}
      >
        <TwoColumn
          gutter={gutter}
          image={<ColumnImage src={imageUrl} />}
        >
          {body}
        </TwoColumn>
      </Block>
    );
  }

  return (
    <PaddedBlock
      gutter={gutter}
      background={theme.color.highlight}
      style={vertical}
    >
      {body}
    </PaddedBlock>
  );
}

function TextBlock({
  paragraphs,
  gutter,
}: {
  paragraphs: string[];
  gutter: Gutter;
}) {
  return (
    <PaddedBlock gutter={gutter}>
      {renderParagraphs(paragraphs, paragraphStyle)}
    </PaddedBlock>
  );
}

/** Logo-row companion: a label left, the issue date right. */
function MetaRow({
  left,
  right,
  gutter,
}: {
  left: string;
  right: string;
  gutter: Gutter;
}) {
  const cell: CSSProperties = { fontSize: '13px', color: theme.color.brand };

  return (
    <PaddedBlock
      gutter={gutter}
      style={{ paddingTop: '5px', paddingBottom: '5px' }}
    >
      <Row>
        <Column
          valign="top"
          style={{ textAlign: 'left' }}
        >
          <Paragraph style={cell}>{left}</Paragraph>
        </Column>
        {/* Not `.nl-col`: this row is short enough to stay side by side on a
            phone, and stacking a date under a label reads as a mistake. */}
        <Column
          valign="top"
          style={{ textAlign: 'right' }}
        >
          <Paragraph style={{ ...cell, textAlign: 'right' }}>{right}</Paragraph>
        </Column>
      </Row>
    </PaddedBlock>
  );
}

function Heading({ text, gutter }: { text: string; gutter: Gutter }) {
  return (
    <PaddedBlock gutter={gutter}>
      <EmailHeading
        as="h2"
        style={{ ...headingStyle, fontSize: '36px' }}
      >
        {text}
      </EmailHeading>
    </PaddedBlock>
  );
}

function ImageBlock({
  src,
  alt,
  href,
  caption,
  gutter,
}: {
  src: string;
  alt: string;
  href?: string;
  caption?: string;
  gutter: Gutter;
}) {
  // An image spans the column its Einzug leaves, so the only size decision an
  // editor makes is the gutter — the same one every other block makes.
  const natural = columnWidth(gutter);
  const image = (
    <Img
      src={src}
      alt={alt}
      // The attribute as well as the CSS: Word sizes images from the attribute
      // and ignores `max-width`, so without it the logo renders at its intrinsic
      // pixel size in Outlook.
      width={natural}
      className="nl-image"
      style={{
        width: '100%',
        maxWidth: `${natural}px`,
        height: 'auto',
        margin: '0 auto',
      }}
    />
  );

  return (
    <PaddedBlock gutter={gutter}>
      {href ?
        <Link
          href={href}
          style={{ ...linkStyle(theme.color.brand, false), display: 'block' }}
        >
          {image}
        </Link>
      : image}
      {caption ?
        <Paragraph
          style={{
            marginTop: theme.space.tight,
            fontSize: '13px',
            color: theme.color.brand,
          }}
        >
          {caption}
        </Paragraph>
      : null}
    </PaddedBlock>
  );
}

export interface FooterContent {
  title: string;
  lines: string[];
  /**
   * The small centred notice under the masthead, as prose lines.
   *
   * Absent means `DEFAULT_FOOTER_LEGAL`, which is what a new footer block starts
   * from. Present and *empty* is a different thing and is honoured: the editor
   * cleared it, and `missingRequiredFooterTags` refuses the publish rather than
   * this quietly putting the line back.
   */
  legal?: string[];
}

/**
 * The legal notice an issue starts from, as the markup an editor edits.
 *
 * The merge tags are the ones the ee-news template itself uses:
 *   *|ARCHIVE|*        the campaign's browser version
 *   *|UPDATE_PROFILE|* the subscriber's preferences page
 *   *|UNSUB|*          the unsubscribe link Mailchimp requires
 * and `*|IFNOT:ARCHIVE_PAGE|*…*|END:IF|*` hides the postal address on the
 * archive page, where it would be shown to the public rather than to a
 * subscriber. `*|LIST:ADDRESSLINE|*` expands to the audience's own address, so
 * it follows a change made in Mailchimp without a deploy here.
 *
 * The second line is why `inlineMarkup` consumes merge tags before it looks for
 * bold: the three tags run together, and the `|**|` between the first two is
 * exactly the bold delimiter.
 */
export const DEFAULT_FOOTER_LEGAL: string[] = [
  '[Im Browser ansehen](*|ARCHIVE|*)',
  '*|IFNOT:ARCHIVE_PAGE|**|LIST:ADDRESSLINE|**|END:IF|*',
  '[Einstellungen ändern](*|UPDATE_PROFILE|*) oder [Vom Newsletter abmelden](*|UNSUB|*)',
];

/**
 * The closing block: masthead, then the legal notice.
 *
 * Lives here rather than in `document.tsx` so the Puck canvas draws it too.
 *
 * A block, but a pinned one: `config.tsx` denies it drag, duplicate, delete and
 * insert, so every issue has exactly one and cannot lose it. The footer is not
 * optional — Mailchimp refuses to *send* a campaign without an unsubscribe link
 * and a physical address, while preview and Inbox Preview work fine without them
 * — so what makes it safe to edit is the check in `merge-tags.ts`: publishing
 * refuses an issue whose rendered HTML has lost either tag, and the failure
 * surfaces here rather than at the send.
 */
export function NewsletterFooter({
  footer,
  gutter = 'intro',
}: {
  footer?: FooterContent;
  gutter?: Gutter;
}) {
  const text: CSSProperties = {
    ...paragraphStyle,
    fontSize: '14px',
    color: theme.color.page,
  };
  const legal: CSSProperties = {
    ...text,
    fontSize: '11px',
    textAlign: 'center',
  };

  return (
    <PaddedBlock
      gutter={gutter}
      background={theme.color.brand}
      style={{
        paddingTop: theme.space.section,
        paddingBottom: theme.space.section,
      }}
    >
      {footer ?
        <>
          <EmailHeading
            as="h2"
            style={{
              ...headingStyle,
              margin: `0 0 ${theme.space.block} 0`,
              fontSize: '32px',
              color: theme.color.page,
            }}
          >
            {footer.title}
          </EmailHeading>
          {renderParagraphs(footer.lines, text, {
            linkColor: theme.color.page,
          })}
        </>
      : null}

      <Paragraph style={{ ...legal, marginTop: theme.space.section }}>
        {renderLines(footer?.legal ?? DEFAULT_FOOTER_LEGAL, {
          linkColor: theme.color.page,
        })}
      </Paragraph>
    </PaddedBlock>
  );
}

/**
 * Dispatches one document entry to its renderer, wrapped in its condition.
 *
 * The tags are emitted as bare text either side of the block's own table, which
 * is where Mailchimp needs them and the only place they can go: they have to
 * enclose the whole block — background, padding and all — so a subscriber the
 * condition excludes is left with no trace of it rather than an empty tinted row.
 * Inside the container's `<td>` a text node is legal markup, so an issue whose
 * blocks are all unconditional renders exactly as it would without this.
 *
 * Never through `inline.tsx`: an `IF` tag carries a value an editor typed, and
 * `MERGE_TAG_SOURCE` does not match `*|IF:GROUPING=Cacti|*` — the `=` and the
 * lower-case letters are outside its character class. These tags are text nodes
 * rather than part of a paragraph for exactly that reason.
 */
export function renderBlock(block: NewsletterBlock, key: number) {
  const body = renderBlockBody(block, key);
  const condition = conditionTags(block.condition);

  if (!condition) {
    return body;
  }

  return (
    <Fragment key={key}>
      {condition.open}
      {body}
      {condition.close}
    </Fragment>
  );
}

function renderBlockBody(block: NewsletterBlock, key: number) {
  const gutter = block.gutter ?? DEFAULT_GUTTER[block.type];

  switch (block.type) {
    case 'rubric':
      return (
        <RubricHeading
          key={key}
          name={block.name}
          gutter={gutter}
        />
      );
    case 'teaser': {
      // Unresolved means the article did not load. Publishing refuses in that
      // case; this is what the *preview* shows, because an empty gap where a
      // teaser should be is the one outcome an editor would not notice.
      const { teaser } = block;

      if (!teaser?.title.trim()) {
        return (
          <MissingTeaser
            key={key}
            articleId={block.articleId}
            gutter={gutter}
          />
        );
      }

      return block.variant === 'big' ?
          <BigTeaser
            key={key}
            teaser={teaser}
            gutter={gutter}
          />
        : <ShortTeaser
            key={key}
            teaser={teaser}
            gutter={gutter}
          />;
    }
    case 'heading':
      return (
        <Heading
          key={key}
          text={block.text}
          gutter={gutter}
        />
      );
    case 'text':
      return (
        <TextBlock
          key={key}
          paragraphs={block.paragraphs}
          gutter={gutter}
        />
      );
    // Nothing picked yet, or the image was deleted from the media library. The
    // canvas draws a placeholder of its own; the mail simply has no block here.
    case 'image':
      return block.src ?
          <ImageBlock
            key={key}
            src={block.src}
            alt={block.alt}
            href={block.href}
            caption={block.caption}
            gutter={gutter}
          />
        : null;
    case 'button':
      return (
        <Button
          key={key}
          label={block.label}
          href={block.href}
          gutter={gutter}
        />
      );
    case 'panel':
      return (
        <Panel
          key={key}
          title={block.title}
          paragraphs={block.paragraphs}
          link={block.link}
          imageUrl={block.imageUrl}
          gutter={gutter}
        />
      );
    case 'meta':
      return (
        <MetaRow
          key={key}
          left={block.left}
          right={block.right}
          gutter={gutter}
        />
      );
    case 'divider':
      return (
        <Divider
          key={key}
          gutter={gutter}
        />
      );
    case 'footer':
      return (
        <NewsletterFooter
          key={key}
          footer={block}
          gutter={gutter}
        />
      );
  }
}

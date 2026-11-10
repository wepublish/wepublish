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
 * Every block is shared between the media; what it looks like comes from the
 * theme of the kit it is drawn in (`useNewsletterTheme`), and which blocks an
 * issue may hold from the kit's `blocks`. See `kits/` for where each
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
import { useNewsletterKit, useNewsletterTheme } from './kit';
import type { NewsletterTheme } from './theme';

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

/** The chosen gutter as the theme records it — a CSS length. */
function gutterWidth(gutter: Gutter, theme: NewsletterTheme): string {
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
function blockPadding(gutter: Gutter, theme: NewsletterTheme): CSSProperties {
  const side = gutterWidth(gutter, theme);

  return { paddingLeft: side, paddingRight: side };
}

/**
 * The width left over between the two gutters.
 *
 * Images fill it rather than carrying a width of their own: Word sizes an image
 * from its `width` attribute and ignores `max-width`, so an attribute wider than
 * the cell makes Outlook widen the whole column and break the layout.
 */
export function columnWidth(gutter: Gutter, theme: NewsletterTheme): number {
  return (
    theme.contentWidth - 2 * Number.parseInt(gutterWidth(gutter, theme), 10)
  );
}

/** Both margins, because `Text` fills in 16px for either one left undefined. */
const paragraphStyle = (theme: NewsletterTheme): CSSProperties => ({
  marginTop: 0,
  marginBottom: 0,
  fontFamily: theme.font.body,
  fontSize: theme.size.body,
  lineHeight: theme.lineHeight.body,
  color: theme.color.text,
});

const headingStyle = (theme: NewsletterTheme): CSSProperties => ({
  margin: 0,
  fontFamily: theme.font.body,
  fontSize: theme.size.heading,
  lineHeight: theme.lineHeight.heading,
  fontWeight: 700,
  color: theme.color.brand,
});

/** A link that carries the template's bold, underlined call-to-action look. */
const actionStyle = (theme: NewsletterTheme): CSSProperties => ({
  ...linkStyle(theme.color.link),
  fontWeight: 700,
});

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
  const theme = useNewsletterTheme();

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
  const theme = useNewsletterTheme();

  return (
    <Block
      gutter={gutter}
      background={background}
      style={{ ...blockPadding(gutter, theme), ...style }}
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
  const theme = useNewsletterTheme();

  return (
    <EmailText style={{ ...paragraphStyle(theme), ...style }}>
      {children}
    </EmailText>
  );
}

/** `Lesen >>`, bold and underlined — the template's own call to action. */
function ReadMore({ href }: { href: string }) {
  const theme = useNewsletterTheme();

  return (
    <Paragraph style={{ marginTop: theme.space.block }}>
      <Link
        href={href}
        style={actionStyle(theme)}
      >
        {'Lesen >>'}
      </Link>
    </Paragraph>
  );
}

function Kicker({ text }: { text: string }) {
  const theme = useNewsletterTheme();

  return (
    <Paragraph style={{ fontWeight: 700, color: theme.color.brand }}>
      {text}
    </Paragraph>
  );
}

function TeaserHeadline({ teaser }: { teaser: Teaser }) {
  const theme = useNewsletterTheme();

  return (
    <EmailHeading
      as="h4"
      style={{ ...headingStyle(theme), margin: `${theme.space.tight} 0 0 0` }}
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
  const theme = useNewsletterTheme();

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
  const theme = useNewsletterTheme();

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
        style={blockPadding(gutter, theme)}
      >
        {children}
      </Column>
    </Row>
  );
}

/** The image in a `TwoColumn` left cell. `framed` adds the teaser's tint border. */
function ColumnImage({ src, framed }: { src: string; framed?: boolean }) {
  const theme = useNewsletterTheme();

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
  const theme = useNewsletterTheme();

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
    // `none` so the outer cell adds no `nl-pad` on mobile: the text column of
    // `TwoColumn` carries it, and a second one would double the text's inset.
    <Block gutter="none">
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
  const theme = useNewsletterTheme();

  return (
    <PaddedBlock
      gutter={gutter}
      background={theme.color.tint}
      style={{ paddingTop: '6px' }}
    >
      <EmailHeading
        as="h4"
        style={{ ...headingStyle(theme), color: theme.color.text }}
      >
        {name}
      </EmailHeading>
    </PaddedBlock>
  );
}

function Divider({ gutter }: { gutter: Gutter }) {
  const { divider } = useNewsletterTheme();

  return (
    <PaddedBlock
      gutter={gutter}
      style={{ paddingTop: divider.space, paddingBottom: divider.space }}
    >
      {/* A bordered cell, not the library's `Hr` — Outlook renders `<hr>` at its
          own width and colour and ignores most styling on it. */}
      <Row>
        <Column
          style={{
            borderTop: `${divider.width} solid ${divider.color}`,
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
  const { button } = useNewsletterTheme();

  return (
    <PaddedBlock
      gutter={gutter}
      // The button is an inline-block `<a>`, so the cell's alignment places it.
      style={button.align ? { textAlign: button.align } : undefined}
    >
      {/* The library's `Button` is an `<a>` carrying the mso-font-width padding
          hack, which is the one construction that pads a link in Outlook without
          a wrapper table. Padding must be part of `style` for it to compute. */}
      <EmailButton
        href={href}
        style={{
          backgroundColor: button.background,
          borderRadius: button.radius,
          padding: button.padding,
          fontFamily: button.fontFamily,
          fontSize: button.fontSize,
          fontWeight: 700,
          color: button.color,
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
  const theme = useNewsletterTheme();
  const body = (
    <>
      <EmailHeading
        as="h4"
        style={{ ...headingStyle(theme), margin: `0 0 ${theme.space.block} 0` }}
      >
        {title}
      </EmailHeading>
      {renderParagraphs(paragraphs, paragraphStyle(theme), { theme })}
      {link ?
        <Paragraph style={{ marginTop: theme.space.block }}>
          <Link
            href={link.href}
            style={actionStyle(theme)}
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
      // `none` so the outer cell adds no `nl-pad` on mobile: `TwoColumn`'s text
      // column carries it, and a second one would double the text's inset.
      <Block
        gutter="none"
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
  const theme = useNewsletterTheme();

  return (
    <PaddedBlock gutter={gutter}>
      {renderParagraphs(paragraphs, paragraphStyle(theme), { theme })}
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
  const { meta } = useNewsletterTheme();
  const cell: CSSProperties = {
    fontFamily: meta.fontFamily,
    fontSize: meta.fontSize,
    color: meta.color,
  };

  return (
    <PaddedBlock
      gutter={gutter}
      background={meta.background}
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
  const theme = useNewsletterTheme();

  return (
    <PaddedBlock gutter={gutter}>
      <EmailHeading
        as="h2"
        style={{
          ...headingStyle(theme),
          fontSize: theme.heading.fontSize,
          color: theme.heading.color,
        }}
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
  const theme = useNewsletterTheme();
  const { caption: captionStyle } = theme;
  // An image spans the column its Einzug leaves, so the only size decision an
  // editor makes is the gutter — the same one every other block makes.
  const natural = columnWidth(gutter, theme);
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
            fontFamily: captionStyle.fontFamily,
            fontSize: captionStyle.fontSize,
            lineHeight: captionStyle.lineHeight,
            color: captionStyle.color,
            fontStyle: captionStyle.fontStyle,
            textAlign: captionStyle.textAlign,
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
  const theme = useNewsletterTheme();
  const { footer: look } = theme;
  const text: CSSProperties = {
    ...paragraphStyle(theme),
    fontSize: look.textSize,
    color: look.color,
    textAlign: look.align,
  };
  const legal: CSSProperties = {
    ...paragraphStyle(theme),
    fontFamily: look.legal.fontFamily,
    fontSize: look.legal.fontSize,
    color: look.legal.color,
    textAlign: 'center',
  };
  const vertical: CSSProperties = {
    paddingTop: theme.space.section,
    paddingBottom: theme.space.section,
  };
  // A band of its own puts the notice at the top of it; inside the closing
  // block it keeps a section's distance from the lines above.
  const notice = (
    <Paragraph
      style={{
        ...legal,
        marginTop: look.legal.background ? 0 : theme.space.section,
      }}
    >
      {renderLines(footer?.legal ?? DEFAULT_FOOTER_LEGAL, {
        theme,
        linkColor: look.legal.linkColor,
      })}
    </Paragraph>
  );

  return (
    <>
      <PaddedBlock
        gutter={gutter}
        background={look.background}
        style={vertical}
      >
        {footer ?
          <>
            <EmailHeading
              as="h2"
              style={{
                ...headingStyle(theme),
                margin: `0 0 ${theme.space.block} 0`,
                fontSize: look.titleSize,
                color: look.titleColor,
                textAlign: look.align,
              }}
            >
              {look.titleHighlight ?
                <span
                  style={{
                    backgroundColor: look.titleHighlight,
                    color: look.titleColor,
                  }}
                >
                  {footer.title}
                </span>
              : footer.title}
            </EmailHeading>
            {renderParagraphs(footer.lines, text, {
              theme,
              linkColor: look.linkColor,
            })}
          </>
        : null}

        {look.legal.background ? null : notice}
      </PaddedBlock>

      {look.legal.background ?
        <PaddedBlock
          gutter={gutter}
          background={look.legal.background}
          style={vertical}
        >
          {notice}
        </PaddedBlock>
      : null}
    </>
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
 *
 * Must be drawn inside a `NewsletterKitProvider`: the kit decides the Einzug a
 * block gets when it names none, and the theme every block is drawn in.
 */
export function renderBlock(block: NewsletterBlock, key: number) {
  return (
    <KitBlock
      key={key}
      block={block}
    />
  );
}

/** A component rather than a function so it can read the kit from context. */
function KitBlock({ block }: { block: NewsletterBlock }) {
  const kit = useNewsletterKit();
  const body = renderBlockBody(
    block,
    block.gutter ?? kit.defaultGutter[block.type]
  );
  const condition = conditionTags(block.condition);

  if (!condition) {
    return body;
  }

  return (
    <Fragment>
      {condition.open}
      {body}
      {condition.close}
    </Fragment>
  );
}

function renderBlockBody(block: NewsletterBlock, gutter: Gutter) {
  switch (block.type) {
    case 'rubric':
      return (
        <RubricHeading
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
            articleId={block.articleId}
            gutter={gutter}
          />
        );
      }

      return block.variant === 'big' ?
          <BigTeaser
            teaser={teaser}
            gutter={gutter}
          />
        : <ShortTeaser
            teaser={teaser}
            gutter={gutter}
          />;
    }
    case 'heading':
      return (
        <Heading
          text={block.text}
          gutter={gutter}
        />
      );
    case 'text':
      return (
        <TextBlock
          paragraphs={block.paragraphs}
          gutter={gutter}
        />
      );
    // Nothing picked yet, or the image was deleted from the media library. The
    // canvas draws a placeholder of its own; the mail simply has no block here.
    case 'image':
      return block.src ?
          <ImageBlock
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
          label={block.label}
          href={block.href}
          gutter={gutter}
        />
      );
    case 'panel':
      return (
        <Panel
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
          left={block.left}
          right={block.right}
          gutter={gutter}
        />
      );
    case 'divider':
      return <Divider gutter={gutter} />;
    case 'footer':
      return (
        <NewsletterFooter
          footer={block}
          gutter={gutter}
        />
      );
  }
}

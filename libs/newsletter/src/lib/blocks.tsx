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
import { DEFAULT_FOOTER_LEGAL } from './document';
import { linkStyle, renderLines, renderParagraphs } from './inline';
import type { MergeCondition } from './merge-tags';
import { conditionTags } from './merge-tags';
import { theme } from './theme';

/**
 * Everything is built from `@react-email/components`, so the client fixes
 * baked into the library are ours for free. Two rules are load-bearing: a
 * `Text` style must set `marginTop` and `marginBottom` (the component
 * substitutes 16px for a missing one), and every `Link` takes `linkStyle`
 * (the component's defaults are its own blue and no underline).
 */

export type Gutter = 'article' | 'intro' | 'none';

/**
 * A stored image reference: a CMS image by id, or an external https URL an
 * editor pasted. `src` is filled from `imageId` before rendering.
 */
export interface ImageRef {
  imageId?: string;
  src?: string;
}

export type NewsletterBlock = {
  gutter?: Gutter;
  condition?: MergeCondition;
} & (
  | { type: 'rubric'; name: string }
  | {
      type: 'teaser';
      variant: 'big' | 'short';
      /**
       * The only thing stored. Headline, kicker, lead, link and image are
       * read from the CMS on every render.
       */
      articleId: string;
      /** Filled by `resolveTeasers` before rendering; never stored. */
      teaser?: Teaser;
    }
  | { type: 'heading'; text: string }
  | { type: 'text'; paragraphs: string[] }
  | ({ type: 'image'; alt: string; href?: string; caption?: string } & ImageRef)
  | { type: 'button'; label: string; href: string }
  | {
      type: 'panel';
      title: string;
      paragraphs: string[];
      link?: { label: string; href: string };
      image?: ImageRef;
    }
  | { type: 'meta'; left: string; right: string }
  | { type: 'divider' }
  | ({ type: 'footer' } & FooterContent)
);

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
  kicker?: string;
  title: string;
  lead: string;
  url: string;
  imageUrl?: string;
}

export interface FooterContent {
  title: string;
  lines: string[];
  /** Absent means `DEFAULT_FOOTER_LEGAL`; present and empty is honoured. */
  legal?: string[];
}

function gutterWidth(gutter: Gutter): string {
  if (gutter === 'intro') {
    return theme.space.introGutter;
  }

  return gutter === 'none' ? theme.space.noGutter : theme.space.gutter;
}

function mobilePad(gutter: Gutter): string | undefined {
  return gutter === 'none' ? undefined : 'nl-pad';
}

function blockPadding(gutter: Gutter): CSSProperties {
  const side = gutterWidth(gutter);

  return { paddingLeft: side, paddingRight: side };
}

/**
 * Word sizes an image from its `width` attribute and ignores `max-width`, so
 * images fill the column their gutter leaves rather than carrying a width.
 */
export function columnWidth(gutter: Gutter): number {
  return theme.contentWidth - 2 * Number.parseInt(gutterWidth(gutter), 10);
}

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

const actionStyle: CSSProperties = {
  ...linkStyle(theme.color.link),
  fontWeight: 700,
};

/**
 * Every block is its own table: Outlook recovers from a broken table far
 * better when the damage is contained, and background colours do not bleed.
 * `Row`/`Column` rather than `Section`, whose single cell takes neither a
 * class nor a style, and Word drops padding declared on a `<table>`.
 */
function Block({
  children,
  background,
  style,
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
 * Image left, text right on a 4/8 split. `nl-col` stacks the cells below
 * 480px; Outlook never sees the media query and keeps the width attributes.
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

/** The frame is a border on the image: Word drops padding on images. */
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

function MissingImage({ gutter }: { gutter: Gutter }) {
  return (
    <PaddedBlock gutter={gutter}>
      <Paragraph style={{ color: '#a11', fontWeight: 700 }}>
        Für diesen Block ist kein Bild gewählt.
      </Paragraph>
    </PaddedBlock>
  );
}

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

/** A bordered cell, not `Hr`: Outlook renders `<hr>` at its own width. */
function Divider({ gutter }: { gutter: Gutter }) {
  return (
    <PaddedBlock
      gutter={gutter}
      style={{ paddingTop: 0, paddingBottom: 0 }}
    >
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
  const natural = columnWidth(gutter);
  const image = (
    <Img
      src={src}
      alt={alt}
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

/**
 * The closing block. Pinned in the editor (no drag, duplicate, delete or
 * insert) so every issue has exactly one; publishing refuses an issue whose
 * rendered HTML has lost the unsubscribe link or the address.
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
 * The condition tags are emitted as bare text either side of the block's own
 * table, which is where Mailchimp needs them: they have to enclose the whole
 * block so an excluded subscriber is left with no trace of it.
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
    case 'image':
      if (!block.src) {
        return (
          <MissingImage
            key={key}
            gutter={gutter}
          />
        );
      }

      return (
        <ImageBlock
          key={key}
          src={block.src}
          alt={block.alt}
          href={block.href}
          caption={block.caption}
          gutter={gutter}
        />
      );
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
          imageUrl={block.image?.src}
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

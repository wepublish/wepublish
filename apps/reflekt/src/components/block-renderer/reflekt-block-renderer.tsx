import styled from '@emotion/styled';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  css,
  Typography,
} from '@mui/material';
import {
  BlockRenderer,
  hasBlockStyle,
  isBreakBlock,
  isFlexBlock,
  isQuoteBlock,
  isRichTextBlock,
  isTeaserGridBlock,
  isTeaserSlotsBlock,
} from '@wepublish/block-content/website';
import {
  BuilderBlockRendererProps,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';

import { ReflektHeroBlock } from '../blocks/reflekt-hero-block';
import { ReflektTextOnImageBlock } from '../blocks/reflekt-text-on-image-block';
import { ReflektTeaser } from '../blocks/reflekt-teaser';
import { ReflektTeaserMono } from '../blocks/reflekt-teaser-mono';

// ─── Breakblock ─────────────────────────────────────────────────────────────

const ReflektDivider = styled('hr')`
  border: none;
  border-top: 2px solid ${({ theme }) => theme.palette.primary.main};
  margin: ${({ theme }) => theme.spacing(2)} 0;
  width: 100%;
`;

// ─── QuoteBlock ──────────────────────────────────────────────────────────────

const ReflektQuoteWrapper = styled('blockquote')`
  border-left: 4px solid ${({ theme }) => theme.palette.primary.main};
  margin: ${({ theme }) => theme.spacing(4)} 0;
  padding: ${({ theme }) => `${theme.spacing(2)} ${theme.spacing(4)}`};

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      margin-left: calc(100% / 6);
      padding: ${theme.spacing(3)} ${theme.spacing(5)};
    }
  `}
`;

const ReflektQuoteText = styled(Typography)`
  font-family: 'Euclid', sans-serif;
  font-weight: 700;
  font-size: clamp(1.2rem, 3vw, 1.8rem);
  line-height: 1.3;
  font-style: italic;
`;

const ReflektQuoteAuthor = styled(Typography)`
  margin-top: ${({ theme }) => theme.spacing(1.5)};
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.text.secondary};
`;

// ─── Accordion (RichTextBlock with blockStyle "accordion") ───────────────────

const getFirstNodeText = (richText: unknown): string => {
  if (!Array.isArray(richText) || richText.length === 0) return 'Mehr lesen';
  const first = richText[0] as { children?: Array<{ text?: string }> };
  return (
    first?.children
      ?.map(c => c.text ?? '')
      .join('')
      .trim() || 'Mehr lesen'
  );
};

// ─── Main renderer ───────────────────────────────────────────────────────────

export const ReflektBlockRenderer = (props: BuilderBlockRendererProps) => {
  const {
    blocks: { TeaserGrid, TeaserSlots, RichText },
  } = useWebsiteBuilder();

  const { block } = props;

  // Hero header: FlexBlock with blockStyle "Header"
  if (isFlexBlock(block) && hasBlockStyle('Header')(block)) {
    return <ReflektHeroBlock {...block} />;
  }

  // Text-on-image: FlexBlock with blockStyle "text-on-image"
  if (isFlexBlock(block) && hasBlockStyle('text-on-image')(block)) {
    return <ReflektTextOnImageBlock {...block} />;
  }

  // TeaserSlotsBlock — dispatch teaser variant by blockStyle
  if (isTeaserSlotsBlock(block)) {
    const Teaser =
      hasBlockStyle('monochrom')(block) ? ReflektTeaserMono : ReflektTeaser;
    return (
      <WebsiteBuilderProvider blocks={{ Teaser }}>
        <TeaserSlots {...block} />
      </WebsiteBuilderProvider>
    );
  }

  // TeaserGridBlock — dispatch teaser variant by blockStyle
  if (isTeaserGridBlock(block)) {
    const Teaser =
      hasBlockStyle('monochrom')(block) ? ReflektTeaserMono : ReflektTeaser;
    return (
      <WebsiteBuilderProvider blocks={{ Teaser }}>
        <TeaserGrid {...block} />
      </WebsiteBuilderProvider>
    );
  }

  // QuoteBlock — large Euclid bold quote with blue left border
  if (isQuoteBlock(block)) {
    return (
      <ReflektQuoteWrapper>
        <ReflektQuoteText>{block.quote}</ReflektQuoteText>
        {block.author && (
          <ReflektQuoteAuthor>— {block.author}</ReflektQuoteAuthor>
        )}
      </ReflektQuoteWrapper>
    );
  }

  // BreakBlock — thin blue divider line
  if (isBreakBlock(block)) {
    return <ReflektDivider />;
  }

  // RichTextBlock with blockStyle "accordion" — collapsible section
  if (isRichTextBlock(block) && hasBlockStyle('accordion')(block)) {
    const title = getFirstNodeText(block.richText);
    const bodyRichText =
      Array.isArray(block.richText) ? block.richText.slice(1) : block.richText;

    return (
      <Accordion>
        <AccordionSummary expandIcon="▼">
          <Typography fontWeight={700}>{title}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <RichText richText={bodyRichText} />
        </AccordionDetails>
      </Accordion>
    );
  }

  return <BlockRenderer {...props} />;
};

import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import { hasBlockStyle, isBreakBlock } from '@wepublish/block-content/website';
import { RichtextJSONDocument, toPlaintext } from '@wepublish/richtext';
import {
  FullBlockFragment,
  FullBreakBlockFragment,
} from '@wepublish/website/api';
import {
  BuilderBreakBlockProps,
  Button,
  Image,
  Link,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { designText } from '../../theme';
import { WepBlockStyles } from '../block-styles/wep-block-styles';
import { primaryButton } from '../button-styles';
import { extraColumn } from '../page-columns';

export const isFeature = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullBreakBlockFragment =>
  allPass([hasBlockStyle(WepBlockStyles.Feature), isBreakBlock])(block);

const tagPattern = /#(\S+)/g;

/**
 * Splits the text from the editor into paragraphs and tags: every word with
 * a # in front is a tag, the rest stays text.
 */
export const splitTags = (
  richText: RichtextJSONDocument | null | undefined
) => {
  const paragraphs = (richText?.content ?? []).map(
    node => toPlaintext([node]) ?? ''
  );

  return {
    tags: paragraphs.flatMap(paragraph =>
      Array.from(paragraph.matchAll(tagPattern), ([, tag]) => tag)
    ),
    paragraphs: paragraphs
      .map(paragraph => paragraph.replace(tagPattern, '').trim())
      .filter(Boolean),
  };
};

export const FeatureWrapper = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};
  align-items: center;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 30px;
  }

  // All 12 columns, as wide as the navbar
  ${({ theme }) => theme.breakpoints.up('lg')} {
    margin-inline: calc(
      -1 * ${({ theme }) => extraColumn(theme, '100%', '100vw')}
    );
  }
`;

export const FeatureImage = styled(Image)`
  width: 100%;
  height: auto;
`;

export const FeatureContent = styled('div')`
  display: grid;
  justify-items: start;
`;

export const FeatureTitle = styled('h2')`
  ${designText.h2 as CSSObject}
  margin: 0;
`;

export const FeatureText = styled('p')`
  ${designText.text as CSSObject}
  margin: 30px 0 0;
`;

export const FeatureTags = styled('ul')`
  display: flex;
  flex-wrap: wrap;
  gap: 15px 10px;
  margin: 30px 0 0;
  padding: 0;
  list-style: none;
`;

export const FeatureTag = styled('li')`
  ${designText.textSmallMono as CSSObject}
  padding: 5px 15px;
  border-radius: 63px;
  background-color: ${({ theme }) => theme.palette.primary.light};
`;

export const FeatureButton = styled(Button)`
  ${({ theme }) => primaryButton(theme)}
  margin-top: 60px;
`;

/**
 * An image next to a title, the tags and a button. The tags are the words
 * with a # in front in the text of the block.
 */
export const Feature = ({
  className,
  text,
  richText,
  image,
  hideButton,
  linkText,
  linkURL,
  linkTarget,
}: BuilderBreakBlockProps) => {
  const { tags, paragraphs } = splitTags(richText);

  return (
    <FeatureWrapper className={className}>
      {image && <FeatureImage image={image} />}

      <FeatureContent>
        {text && <FeatureTitle>{text}</FeatureTitle>}

        {paragraphs.map((paragraph, index) => (
          <FeatureText key={index}>{paragraph}</FeatureText>
        ))}

        {tags.length > 0 && (
          <FeatureTags>
            {tags.map((tag, index) => (
              <FeatureTag key={index}>{tag}</FeatureTag>
            ))}
          </FeatureTags>
        )}

        {!hideButton && linkURL && linkText && (
          <FeatureButton
            variant="contained"
            disableElevation
            disableRipple
            LinkComponent={Link}
            href={linkURL}
            target={linkTarget ?? undefined}
          >
            {linkText}
          </FeatureButton>
        )}
      </FeatureContent>
    </FeatureWrapper>
  );
};

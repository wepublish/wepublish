import { CSSObject, Theme } from '@emotion/react';
import styled from '@emotion/styled';
import { isBreakBlock } from '@wepublish/block-content/website';
import {
  FullBlockFragment,
  FullBreakBlockFragment,
} from '@wepublish/website/api';
import {
  BuilderBreakBlockProps,
  Button,
  Image,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

import { designText } from '../../theme';
import { WepBlockStyles } from '../block-styles/wep-block-styles';
import { primaryButton } from '../button-styles';

/** One block style per colour of We.Publish; the editor picks the colour with the style */
const colours: Record<string, (theme: Theme) => string> = {
  [WepBlockStyles.AttentionCatcher]: theme => theme.palette.primary.main,
  [WepBlockStyles.AttentionCatcherMint]: theme => theme.palette.primary.light,
  [WepBlockStyles.AttentionCatcherRose]: () => '#f3d5e1',
  [WepBlockStyles.AttentionCatcherBlue]: () => '#87f5fb',
};

export const isAttentionCatcher = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullBreakBlockFragment =>
  isBreakBlock(block) && !!block.blockStyle && block.blockStyle in colours;

export const AttentionCatcherWrapper = styled('section', {
  shouldForwardProp: prop => prop !== 'colour' && prop !== 'hasImage',
})<{ colour: (theme: Theme) => string; hasImage: boolean }>`
  display: grid;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(4)};
  padding: ${({ theme }) => theme.spacing(4, 3)};
  border-radius: 20px;
  background-color: ${({ theme, colour }) => colour(theme)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: ${({ hasImage }) =>
      hasImage ? 'minmax(0, 451px) minmax(0, 1fr)' : 'minmax(0, 778px)'};
    gap: 50px;
    padding: 55px;
  }
`;

// Rounded like a photo needs it; on an illustration with a transparent background the corners don't show
export const AttentionCatcherImage = styled(Image)`
  width: 100%;
  height: auto;
  max-height: 260px;
  object-fit: contain;
  border-radius: 20px;

  ${({ theme }) => theme.breakpoints.up('md')} {
    max-height: 420px;
  }
`;

export const AttentionCatcherContent = styled('div')`
  display: grid;
  justify-items: start;
`;

export const AttentionCatcherTitle = styled('h2')`
  ${designText.h2 as CSSObject}
  margin: 0;
  hyphens: manual;
`;

export const AttentionCatcherText = styled('div')`
  margin-top: 20px;

  p {
    ${designText.text as CSSObject}
    margin: 0;
    hyphens: manual;
  }
`;

export const AttentionCatcherButton = styled(Button)`
  ${({ theme }) => primaryButton(theme)}
  margin-top: 60px;
`;

/**
 * A coloured box with an optional image (illustration or photo) next to the
 * title, the text and a button. The block style sets the colour.
 */
export const AttentionCatcher = ({
  className,
  blockStyle,
  text,
  richText,
  image,
  hideButton,
  linkText,
  linkURL,
  linkTarget,
}: BuilderBreakBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();
  const hasText = !!richText?.content?.length;

  return (
    <AttentionCatcherWrapper
      className={className}
      colour={
        colours[blockStyle ?? ''] ?? colours[WepBlockStyles.AttentionCatcher]
      }
      hasImage={!!image}
    >
      {image && <AttentionCatcherImage image={image} />}

      <AttentionCatcherContent>
        {text && <AttentionCatcherTitle>{text}</AttentionCatcherTitle>}

        {hasText && (
          <AttentionCatcherText>
            <RichText richText={richText} />
          </AttentionCatcherText>
        )}

        {!hideButton && linkURL && linkText && (
          <AttentionCatcherButton
            variant="contained"
            disableElevation
            disableRipple
            LinkComponent={Link}
            href={linkURL}
            target={linkTarget ?? undefined}
          >
            {linkText}
          </AttentionCatcherButton>
        )}
      </AttentionCatcherContent>
    </AttentionCatcherWrapper>
  );
};

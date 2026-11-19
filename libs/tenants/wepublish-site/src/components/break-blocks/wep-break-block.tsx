import { CSSObject } from '@emotion/react';
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
import { primaryButton } from '../button-styles';

/** A break block without block style (styled ones are e.g. the hero or the attention catcher) */
export const isPlainBreakBlock = (block: Partial<FullBlockFragment>) =>
  isBreakBlock(block) && !(block as FullBreakBlockFragment).blockStyle;

export const WepBreakBlockWrapper = styled('section', {
  shouldForwardProp: prop => prop !== 'hasImage',
})<{ hasImage: boolean }>`
  display: grid;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(4)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: ${({ hasImage }) =>
      hasImage ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 778px)'};
    gap: 30px;
  }
`;

export const WepBreakBlockImage = styled(Image)`
  width: 100%;
  aspect-ratio: 622 / 400;
  object-fit: cover;
`;

export const WepBreakBlockContent = styled('div')`
  display: grid;
  justify-items: start;
`;

export const WepBreakBlockTitle = styled('h2')`
  ${designText.h3 as CSSObject}
  margin: 0;
  hyphens: manual;
`;

export const WepBreakBlockText = styled('div')`
  margin-top: 30px;

  p {
    ${designText.text as CSSObject}
    margin: 0;
    hyphens: manual;
  }
`;

export const WepBreakBlockButton = styled(Button)`
  ${({ theme }) => primaryButton(theme)}
  margin-top: 50px;
`;

/**
 * A break block without style: an optional image next to the title, the text
 * and a button (e.g. "Als Stiftung fördern wir Medienvielfalt").
 */
export const WepBreakBlock = ({
  className,
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
    <WepBreakBlockWrapper
      className={className}
      hasImage={!!image}
    >
      {image && <WepBreakBlockImage image={image} />}

      <WepBreakBlockContent>
        {text && <WepBreakBlockTitle>{text}</WepBreakBlockTitle>}

        {hasText && (
          <WepBreakBlockText>
            <RichText richText={richText} />
          </WepBreakBlockText>
        )}

        {!hideButton && linkURL && linkText && (
          <WepBreakBlockButton
            variant="contained"
            disableElevation
            disableRipple
            LinkComponent={Link}
            href={linkURL}
            target={linkTarget ?? undefined}
          >
            {linkText}
          </WepBreakBlockButton>
        )}
      </WepBreakBlockContent>
    </WepBreakBlockWrapper>
  );
};

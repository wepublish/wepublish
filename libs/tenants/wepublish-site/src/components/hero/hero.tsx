import { css, Theme } from '@emotion/react';
import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { hasBlockStyle, isBreakBlock } from '@wepublish/block-content/website';
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

import heroIllustration from '../../assets/hero-illustration.webp';
import { staticImageSrc } from '../../assets/static-image';
import { WepBlockStyles } from '../block-styles/wep-block-styles';
import { primaryButton } from '../button-styles';

/**
 * Paints the primary colour over the full viewport width (and `top` above the
 * element) without changing the layout of the centred page column.
 */
export const heroBackground = (theme: Theme, top: string) => css`
  background-color: ${theme.palette.primary.main};
  box-shadow: 0 0 0 100vmax ${theme.palette.primary.main};
  clip-path: inset(-${top} -100vmax 0);
`;

export const isHero = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullBreakBlockFragment =>
  allPass([hasBlockStyle(WepBlockStyles.Hero), isBreakBlock])(block);

export const HeroWrapper = styled('section')`
  ${({ theme }) => heroBackground(theme, '100vmax')}
  display: grid;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(5)};
  padding-top: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    // The image sits right next to the heading and takes the remaining space
    grid-template-columns: max-content minmax(0, 482px);
    justify-content: start;
    column-gap: ${({ theme }) => theme.spacing(6)};
    padding-top: ${({ theme }) => theme.spacing(6)};
  }
`;

export const HeroContent = styled('div')`
  display: grid;
  justify-items: start;
  gap: ${({ theme }) => theme.spacing(5)};

  // Breaks "Das Ökosystem / unabhängiger Medien." at every font size
  h1 {
    max-width: 11.5em;
    hyphens: manual;
  }
`;

export const HeroButton = styled(Button)`
  ${({ theme }) => primaryButton(theme)}
`;

const illustrationStyles = css`
  width: 100%;
  max-width: 482px;
  height: auto;
`;

export const HeroIllustration = styled('img')`
  ${illustrationStyles}
`;

export const HeroImage = styled(Image)`
  ${illustrationStyles}
  object-fit: contain;
`;

export const Hero = ({
  className,
  text,
  image,
  hideButton,
  linkText,
  linkURL,
  linkTarget,
}: BuilderBreakBlockProps) => (
  <HeroWrapper className={className}>
    <HeroContent>
      {text && <Typography variant="h1">{text}</Typography>}

      {!hideButton && linkURL && linkText && (
        <HeroButton
          variant="contained"
          disableElevation
          disableRipple
          LinkComponent={Link}
          href={linkURL}
          target={linkTarget ?? undefined}
        >
          {linkText}
        </HeroButton>
      )}
    </HeroContent>

    {image ?
      <HeroImage image={image} />
    : <HeroIllustration
        src={staticImageSrc(heroIllustration)}
        alt=""
      />
    }
  </HeroWrapper>
);

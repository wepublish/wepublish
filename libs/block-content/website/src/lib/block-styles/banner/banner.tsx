import styled from '@emotion/styled';
import { BlockContent, BreakBlock } from '@wepublish/website/api';
import { BuilderBlockStyleProps, Image } from '@wepublish/website/builder';
import { isBreakBlock } from '../../break/break-block';
import { hasBlockStyle } from '../../has-blockstyle';
import { allPass } from 'ramda';

export const BannerWrapper = styled('a')`
  aspect-ratio: 2.7/1;
  min-width: 100%;
  background-color: ${({ theme }) => theme.palette.info.main};
  text-decoration: none;
  color: inherit;
`;

export const BannerImage = styled(Image)`
  width: 100%;
  object-fit: cover;
`;

export const Banner = ({
  image,
  linkURL,
  linkTarget,
}: BuilderBlockStyleProps['Banner']) => {
  return (
    <BannerWrapper
      href={linkURL ?? ''}
      target={linkTarget ?? '_blank'}
    >
      {image && <BannerImage image={image} />}
    </BannerWrapper>
  );
};

export const isBannerBlockStyle = (
  block: Pick<BlockContent, '__typename'>
): block is BreakBlock =>
  allPass([hasBlockStyle('Banner'), isBreakBlock])(block);

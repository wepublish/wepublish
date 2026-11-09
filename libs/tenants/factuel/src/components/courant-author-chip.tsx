import styled from '@emotion/styled';
import { css } from '@mui/material';
import {
  BuilderAuthorChipProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

import { courantTokens } from '../brand-tokens';

const { blockGaps } = courantTokens.layout;
const { warmGray } = courantTokens.colors;
const { courant } = courantTokens.colors;
const { caption } = courantTokens.typography.sizes;

const CourantAuthorChipWrapper = styled('a')`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  column-gap: ${({ theme }) => theme.spacing(blockGaps.authorChip)};
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: none;
  }
`;

const CourantAuthorChipImageWrapper = styled('div')`
  display: flex;
  border-radius: 50%;
  width: ${blockGaps.authorChipAvatar}px;
  border: 3px solid ${courant[500]};
`;

const CourantAuthorChipMeta = styled('div')`
  display: grid;
  row-gap: 0;
`;

const CourantAuthorChipName = styled('div')`
  font-family: var(--courant-captions);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.065em;
  color: ${warmGray[700]};
  font-size: ${caption};
`;

const imageStyles = css`
  border-radius: 50%;
`;

export const CourantAuthorChip = ({
  className,
  author,
}: BuilderAuthorChipProps) => {
  const {
    elements: { Image, Link },
  } = useWebsiteBuilder();

  return (
    <CourantAuthorChipWrapper
      as={Link}
      href={author.url}
      className={className}
    >
      {author.image && (
        <CourantAuthorChipImageWrapper>
          <Image
            image={author.image}
            square
            css={imageStyles}
            maxWidth={200}
          />
        </CourantAuthorChipImageWrapper>
      )}

      <CourantAuthorChipMeta>
        <CourantAuthorChipName>{author.name}</CourantAuthorChipName>
      </CourantAuthorChipMeta>
    </CourantAuthorChipWrapper>
  );
};

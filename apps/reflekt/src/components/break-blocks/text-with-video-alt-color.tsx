import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  BreakBlockButton,
  BreakBlockHeading,
  BreakBlockSegment,
  BreakBlockWrapper,
  hasBlockStyle,
  isBreakBlock,
  RichTextBlockWrapper,
} from '@wepublish/block-content/website';
import { BlockContent } from '@wepublish/website/api';
import {
  BuilderBreakBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import theme, { euclidCircularB } from '../../theme';
import { ReflektBlockStyles } from '../block-styles/reflekt-block-styles';
import { BreakBlockVideo, classifyBreakVideo } from './break-block-video';

export const isTextWithVideoAltColorBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderBreakBlockProps =>
  allPass([
    isBreakBlock,
    hasBlockStyle(ReflektBlockStyles.TextWithVideoAltColor),
  ])(block);

const VideoBreakBlock = ({
  className,
  text,
  richText,
  linkURL,
}: BuilderBreakBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();

  const video = classifyBreakVideo(linkURL);

  return (
    <BreakBlockWrapper className={className}>
      {video && (
        <BreakBlockSegment>
          <BreakBlockVideo video={video} />
        </BreakBlockSegment>
      )}

      <BreakBlockSegment>
        {text && (
          <Typography
            variant="blockBreakTitle"
            component={BreakBlockHeading}
          >
            {text}
          </Typography>
        )}

        <RichText richText={richText} />
      </BreakBlockSegment>
    </BreakBlockWrapper>
  );
};

export const TextWithVideoAltColorBreakBlock = styled(
  VideoBreakBlock
)<BuilderBreakBlockProps>`
  background-color: ${({ theme }) => theme.palette.secondary.main};
  color: ${({ theme }) => theme.palette.common.black};
  padding-left: 0;
  padding-right: 0;

  ${BreakBlockHeading} {
    font-size: 2.125rem;
    margin-bottom: ${({ theme }) => theme.spacing(2)};
  }

  ${RichTextBlockWrapper} {
    max-width: unset;

    h1,
    h2 {
      font-size: 2.125rem;
      margin-bottom: ${({ theme }) => theme.spacing(2)};
      text-wrap: wrap;
    }

    h3 {
      font-size: 1.5rem;
      margin-bottom: ${({ theme }) => theme.spacing(2)};
      text-wrap: wrap;
    }

    .MuiTypography-root.MuiTypography-buttonLinkSecondary {
      margin-top: ${({ theme }) => theme.spacing(3)};
    }
  }

  ul {
    padding-left: ${theme.spacing(3)};

    li,
    li p {
      font-family: ${[euclidCircularB.style.fontFamily, 'sans-serif'].join(
        ','
      )};
      font-size: 1.125rem;

      ${theme.breakpoints.up('md')} {
        font-size: 1.5rem;
      }
    }
  }

  ${BreakBlockSegment} + ${BreakBlockSegment} {
    order: -1;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    ${BreakBlockButton} {
      justify-self: end;
    }
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: 5fr 3fr;
    padding: 2rem 1rem;
    column-gap: 3rem;
    row-gap: 0;
  }
`;

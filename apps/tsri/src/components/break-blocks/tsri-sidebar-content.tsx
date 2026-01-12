import styled from '@emotion/styled';
import { css, Theme, Typography, useTheme } from '@mui/material';
import {
  BuilderBreakBlockProps,
  Button,
  Image,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { BlockSiblings } from '../tsri-block-renderer';
import { TsriBreakBlockType } from './tsri-base-break-block';

export const SidebarContentWrapper = styled('div')`
  grid-column: 2 / 3 !important;
  width: 100%;
  position: relative;

  z-index: 6;
`;

//   top: calc(var(--navbar-height, 0px) + 10px);
export const SidebarContentBox = styled('div')`
  display: block;
  background-color: cyan;
  border-radius: 1cqw;
  width: 100%;
  position: sticky;
  top: var(--navbar-height, 0px);
  padding: 0 0 1.5cqw 0;
`;

export const SidebarContentBody = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  margin: 1cqw 1cqw 0 1cqw;
`;

const siblingSidebarContentWrapperStyles = css`
  & ~ ${SidebarContentWrapper} {
    z-index: 5;
  }
`;

export const SidebarContentHeading = styled('div')`
  background-color: black;
  color: white;
  font-size: 1.2cqw !important;
  line-height: 1.2cqw !important;
  text-align: left;
  font-weight: 700 !important;
  padding: 0.75cqw 1cqw !important;
  border-top-left-radius: 1cqw;
  border-top-right-radius: 1cqw;
`;

const subTitleStyles = css`
  padding: 0;
  margin: 0;

  & .MuiTypography-root {
    color: black !important;
    font-size: 1.8cqw !important;
    line-height: 2.2cqw !important;
    font-weight: 700 !important;
  }
`;

const richTextStyles = (theme: Theme) => css`
  p {
    font-size: 1.48cqw !important;
    line-height: 2.04cqw !important;
    font-weight: 700 !important;
    color: black;
  }
`;

export const SidebarContentImage = styled(Image)`
  object-fit: cover;
  width: 100%;
  margin: 0 auto;
  aspect-ratio: 1 / 1;
  border-radius: 1cqw;
`;

export const SidebarContentButton = styled(Button)`
  width: fit-content;
  background-color: black;
  color: white;
  justify-self: end;
  padding-right: 8cqw;
  margin-top: 1cqw;
`;

export const isTsriSidebarContent = allPass([
  ({ blockStyle }: BuilderBreakBlockProps) => {
    return blockStyle === TsriBreakBlockType.SidebarContent;
  },
]);

export const TsriSidebarContent = ({
  blockStyle,
  className,
  hideButton,
  image,
  imageID,
  linkTarget,
  linkText,
  linkURL,
  richText,
  text,
  index,
  count,
  siblings,
}: BuilderBreakBlockProps & {
  index: number;
  count: number;
  siblings: BlockSiblings;
}) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();

  const theme = useTheme();

  const nextOfTypeIndex = (() => {
    for (let i = index + 1; i < count; i++) {
      if (
        siblings[i].typeName === 'BreakBlock' &&
        siblings[i].blockStyle === TsriBreakBlockType.SidebarContent
      ) {
        return i;
      }
    }

    return undefined;
  })();

  const sidebarContentWrapperStyles = css`
    ${siblingSidebarContentWrapperStyles};
    grid-row-start: ${index};
    grid-row-end: ${nextOfTypeIndex ?? count + 4};
    background-color: white;
    margin-bottom: ${nextOfTypeIndex ? theme.spacing(-4) : 0};

    & ${SidebarContentBox} {
      background: ${
        text && text === 'Shop' ?
          'linear-gradient(to bottom, #F5FF64, color-mix(in srgb, white 40%, #F5FF64))'
        : 'linear-gradient(to bottom, rgb(12, 159, 237), color-mix(in srgb, white 40%, rgb(12, 159, 237)))'
      };
  `;

  const sidebarContentButtonStyles = css`
      &:hover {
        background-color: ${
          text && text === 'Shop' ? 'rgb(12, 159, 237)' : '#E6E600'
        };
        color: ${text && text === 'Shop' ? 'white' : 'black'};
      }
    }
  `;

  return (
    <SidebarContentWrapper css={sidebarContentWrapperStyles}>
      <SidebarContentBox>
        {text && (
          <Typography component={SidebarContentHeading}>{text}</Typography>
        )}
        <SidebarContentBody>
          {text && text === 'Newsletter' && richText && (
            <RichText
              richText={[richText[0]]}
              css={[richTextStyles(theme), subTitleStyles]}
            />
          )}
          {image && <SidebarContentImage image={image} />}
          {richText && richText.length > 1 && (
            <RichText
              richText={[...richText].splice(1, richText.length - 1)}
              css={richTextStyles(theme)}
            />
          )}

          {!hideButton && linkURL && linkText && (
            <SidebarContentButton
              css={sidebarContentButtonStyles}
              variant="contained"
              size="medium"
              LinkComponent={Link}
              href={linkURL}
            >
              {linkText}
            </SidebarContentButton>
          )}
        </SidebarContentBody>
      </SidebarContentBox>
    </SidebarContentWrapper>
  );
};

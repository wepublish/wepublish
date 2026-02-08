import styled from '@emotion/styled';
import { css, Theme, Typography, useTheme } from '@mui/material';
import { useMemo } from 'react';
import { allPass } from 'ramda';
import { hasBlockStyle, isBreakBlock } from '@wepublish/block-content/website';
import { BlockContent, BreakBlock } from '@wepublish/website/api';
import {
  BuilderBreakBlockProps,
  Button,
  Image,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

import { BlockSiblings } from '../tsri-block-renderer';
import { TsriBreakBlockType } from './tsri-base-break-block';

export const SidebarContentWrapper = styled('div')`
  width: 100%;
  position: relative;
  z-index: 6;
  --sizing-factor: 2.5;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: 2 / 3 !important;
    --sizing-factor: 1;
  }
`;

//   top: calc(var(--navbar-height, 0px) + 10px);
export const SidebarContentBox = styled('div')`
  display: block;
  background-color: cyan;
  border-radius: 1cqw;
  width: 100%;
  position: sticky;
  top: var(--navbar-height, 0px);
  padding: 0 0 calc(var(--sizing-factor) * 1.5cqw) 0;
`;

export const SidebarContentBody = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  margin: calc(var(--sizing-factor) * 1cqw) calc(var(--sizing-factor) * 1cqw) 0
    calc(var(--sizing-factor) * 1cqw);
`;

const siblingSidebarContentWrapperStyles = css`
  & ~ ${SidebarContentWrapper} {
    z-index: 5;
  }
`;

export const SidebarContentHeading = styled('div')`
  background-color: ${({ theme }) => theme.palette.common.black};
  color: ${({ theme }) => theme.palette.common.white};
  font-size: calc(var(--sizing-factor) * 1.3cqw) !important;
  line-height: calc(var(--sizing-factor) * 1.3cqw) !important;
  text-align: left;
  font-weight: 700 !important;
  padding: calc(var(--sizing-factor) * 0.75cqw)
    calc(var(--sizing-factor) * 1cqw) !important;
  border-top-left-radius: 2cqw;
  border-top-right-radius: 2cqw;

  ${({ theme }) => theme.breakpoints.up('md')} {
    border-top-left-radius: 1cqw;
    border-top-right-radius: 1cqw;
  }
`;

const subTitleStyles = (theme: Theme) => css`
  padding: 0;
  margin: 0;

  & .MuiTypography-root {
    color: ${theme.palette.common.black} !important;
    font-size: calc(var(--sizing-factor) * 1.8cqw) !important;
    line-height: calc(var(--sizing-factor) * 2.2cqw) !important;
    font-weight: 700 !important;
  }
`;

const richTextStyles = (theme: Theme) => css`
  p {
    font-size: calc(var(--sizing-factor) * 1.48cqw) !important;
    line-height: calc(var(--sizing-factor) * 2.04cqw) !important;
    font-weight: 700 !important;
    color: ${theme.palette.common.black};
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
  background-color: ${({ theme }) => theme.palette.common.black};
  color: ${({ theme }) => theme.palette.common.white};
  justify-self: end;
  padding-right: calc(var(--sizing-factor) * 8cqw);
  margin-top: calc(var(--sizing-factor) * 1cqw);
`;

const sidebarContentWrapperStyles = (
  theme: Theme,
  index: number,
  nextOfTypeIndex: number | undefined,
  count: number,
  text: string | null | undefined
) => css`
  ${siblingSidebarContentWrapperStyles};

  ${theme.breakpoints.up('md')} {
    grid-row-start: ${index};
    grid-row-end: ${nextOfTypeIndex ?? count + 4};
    background-color: ${theme.palette.common.white};
    margin-bottom: ${nextOfTypeIndex ? theme.spacing(-4) : 0};
  }

  & ${SidebarContentBox} {
    background: ${text && text === 'Shop' ?
      `linear-gradient(to bottom, ${theme.palette.primary.light}, color-mix(in srgb, ${theme.palette.common.white} 60%, ${theme.palette.primary.light}))`
    : `linear-gradient(to bottom, ${theme.palette.primary.main}, color-mix(in srgb, ${theme.palette.common.white} 60%, ${theme.palette.primary.main}))`};
  }
`;

const sidebarContentButtonStyles = (
  theme: Theme,
  text: string | null | undefined
) => css`
  &:hover {
    background-color: ${text && text === 'Shop' ?
      theme.palette.primary.main
    : theme.palette.primary.light};
    color: ${text && text === 'Shop' ?
      theme.palette.common.white
    : theme.palette.common.black};
  }
`;

export const isTsriSidebarContent = (
  block: Pick<BlockContent, '__typename'>
): block is BreakBlock =>
  allPass([hasBlockStyle(TsriBreakBlockType.SidebarContent), isBreakBlock])(
    block
  );

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

  const nextOfTypeIndex = useMemo(() => {
    for (let i = index + 1; i < count; i++) {
      if (
        siblings[i].typeName === 'BreakBlock' &&
        siblings[i].blockStyle === TsriBreakBlockType.SidebarContent
      ) {
        return i;
      }
    }

    return undefined;
  }, [index, count, siblings]);

  return (
    <SidebarContentWrapper
      css={sidebarContentWrapperStyles(
        theme,
        index,
        nextOfTypeIndex,
        count,
        text
      )}
    >
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
              css={sidebarContentButtonStyles(theme, text)}
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

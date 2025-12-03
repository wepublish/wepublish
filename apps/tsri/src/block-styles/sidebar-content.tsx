import styled from '@emotion/styled';
import { css, Theme, Typography, useTheme } from '@mui/material';
import { hasBlockStyle, isBreakBlock } from '@wepublish/block-content/website';
import { BlockContent, BreakBlock } from '@wepublish/website/api';
import {
  BuilderBreakBlockProps,
  Button,
  Image,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
export const IsSidebarContent = (block: BlockContent): block is BreakBlock =>
  allPass([hasBlockStyle('Sidebar Content'), isBreakBlock])(block);

export const SidebarContentWrapper = styled('div')`
  grid-column: 2 / 3 !important;
  width: 100%;
  position: relative;

  z-index: 6;
`;

export const SidebarContentBox = styled('div')`
  display: block;
  background-color: cyan;
  border-radius: 1cqw;
  width: 100%;
  position: sticky;
  top: calc(var(--navbar-height, 0px) + 10px);
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
  color: black !important;
  font-size: 1.6cqw !important;
  line-height: 2.2cqw !important;
  font-weight: 700 !important;
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
  margin-top: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(3)};
  width: fit-content;
  background-color: black;
  color: white;
  justify-self: end;
  padding-right: 8cqw;
  margin-top: 4cqw;
`;

export const SidebarContent = ({
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
}: BuilderBreakBlockProps & {
  index: number;
  count: number;
}) => {
  const {
    elements: { H2 },
    blocks: { RichText },
  } = useWebsiteBuilder();

  const theme = useTheme();

  const sidebarContentWrapperStyles = css`
    ${siblingSidebarContentWrapperStyles};
    grid-row-start: ${index};
    grid-row-end: ${index + 2};
    background-color: white;

    & ${SidebarContentBox} {
      background: ${
        text && text === 'Shop' ?
          'linear-gradient(to bottom, #F5FF64, color-mix(in srgb, white 40%, #F5FF64))'
        : 'linear-gradient(to bottom, rgb(12, 159, 237), color-mix(in srgb, white 40%, rgb(12, 159, 237)))'
      }
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
          {text && text === 'Newsletter' && (
            <H2 css={subTitleStyles}>Das Wichtigste aus Züri</H2>
          )}
          {image && <SidebarContentImage image={image} />}
          {richText && (
            <RichText
              richText={richText}
              css={richTextStyles(theme)}
            />
          )}

          {!hideButton && linkURL && linkText && (
            <SidebarContentButton
              css={sidebarContentButtonStyles}
              variant="contained"
              size="medium"
              LinkComponent={Link}
              href={
                linkURL && !linkURL.startsWith('javascript:') ? linkURL : ''
              }
              target={linkTarget ?? '_blank'}
              onClick={
                linkURL?.startsWith('javascript:') ?
                  e => {
                    e.preventDefault();
                    linkURL.split('javascript:')[1] &&
                      eval(linkURL.split('javascript:')[1]);
                  }
                : undefined
              }
            >
              {linkText}
            </SidebarContentButton>
          )}
        </SidebarContentBody>
      </SidebarContentBox>
    </SidebarContentWrapper>
  );
};

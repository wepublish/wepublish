import styled from '@emotion/styled';
import { css, Theme, useTheme } from '@mui/material';
import {
  BuilderBreakBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useMemo } from 'react';
import { IoLogoInstagram } from 'react-icons/io';

const Banner = styled('a')`
  width: 100%;
  background-color: ${({ theme }) => theme.palette.common.black};
  display: grid;
  grid-template-columns: 1fr;
  padding: ${({ theme }) => theme.spacing(4)};
  text-decoration: none;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    padding: ${({ theme }) => `${theme.spacing(8)} ${theme.spacing(4)}`};
    grid-template-columns: 1fr 1fr;
    column-gap: ${({ theme }) => theme.spacing(4)};
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    aspect-ratio: 2.7/1;
    column-gap: ${({ theme }) => theme.spacing(8)};
  }
`;

const Content = styled('div')`
  color: ${({ theme }) => theme.palette.common.white};
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing(4)};
  align-items: center;
  font-size: 30px;
  font-weight: 600;
  font-style: italic;
  padding-top: ${({ theme }) => theme.spacing(4)};
  order: 1;

  ${({ theme }) => theme.breakpoints.up('md')} {
    order: -1;
    font-size: 40px;
    padding-left: ${({ theme }) => theme.spacing(8)};
    padding-top: 0;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    font-size: 45px;
    padding-left: ${({ theme }) => theme.spacing(6)};
  }
`;

const ContentText = styled('div')`
  align-self: end;
  text-transform: uppercase;
`;

const ContentLogo = styled('div')`
  align-self: start;
`;

const imageStyles = (theme: Theme) => css`
  width: 100%;
  height: 100%;
  object-fit: cover;
  min-height: ${theme.spacing(24)};

  ${theme.breakpoints.up('sm')} {
    min-height: unset;
  }
`;

export const InstagramBanner = ({
  richText,
  text,
  image,
}: BuilderBreakBlockProps) => {
  const theme = useTheme();
  const styles = useMemo(() => imageStyles(theme), [theme]);
  const {
    elements: { Image },
  } = useWebsiteBuilder();
  return (
    <Banner
      href="https://www.instagram.com/babanews.ch/"
      target="_blank"
    >
      <Content>
        <ContentText>{text}</ContentText>
        <ContentLogo>
          <IoLogoInstagram size={94} />
        </ContentLogo>
      </Content>

      {image && (
        <Image
          image={image}
          css={styles}
        />
      )}
    </Banner>
  );
};

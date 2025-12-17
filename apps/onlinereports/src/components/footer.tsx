import styled from '@emotion/styled';
import { css, Theme, useTheme } from '@mui/material';
import {
  FooterCategory,
  FooterCategoryLinks,
  FooterIcons,
  FooterIconsWrapper,
  FooterMainLinks,
  FooterName,
  FooterPaperWrapper,
  FooterWrapper as FooterWrapperDefault,
  navigationLinkToUrl,
  WepublishDark,
  WepublishLight,
} from '@wepublish/navigation/website';
import { TextToIcon } from '@wepublish/ui';
import { FullNavigationFragment } from '@wepublish/website/api';
import {
  BuilderFooterProps,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { PropsWithChildren, useMemo } from 'react';
import { useIntersectionObserver } from 'usehooks-ts';

export const FooterWrapper = styled(FooterWrapperDefault)`
  grid-column: -1/1;
  display: grid;
  grid-template-columns: 1fr;
  row-gap: ${({ theme }) => theme.spacing(8)};
  background-color: #323232;

  ${({ theme }) => theme.breakpoints.up('md')} {
    column-gap: ${({ theme }) => theme.spacing(6)};
    row-gap: ${({ theme }) => theme.spacing(12)};
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
    grid-template-rows: min-content min-content;
    grid-row-gap: 0;
  }

  ${FooterPaperWrapper} {
    color: ${({ theme }) => theme.palette.common.white};
    background-color: #323232;
    font-size: 18px !important;

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-template-columns: subgrid;
      grid-area: 1 / 1 / 1 / 3;
    }
  }

  ${FooterName} {
    font-size: 18px;
    text-transform: unset;
    display: none;
  }

  ${FooterCategoryLinks} {
    font-size: 18px;

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-area: 2 / 1 / 3 / 1;
    }
  }

  ${FooterMainLinks} {
    gap: 0;
  }

  ${FooterIconsWrapper} {
    background-color: #323232;
    padding: calc(var(--footer-paddingY) / 2) var(--footer-paddingX);

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-area: 2 / 1 / 3 / 3;
      grid-template-columns: subgrid;
      display: grid;
    }
  }

  ${FooterIcons} {
    display: block !important;
    overflow: hidden;
    width: 100%;

    & > a {
      float: left;
      margin: ${({ theme }) => theme.spacing(0, 2, 2, 0)} !important;
      display: block;

      &[href*='wepublish'] {
        clear: left;
      }
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      float: unset;
      display: grid;
      overflow: unset;

      & > a {
        margin: 0;
        clear: unset;
        display: unset;
      }
      grid-area: 2 / 2 / 3 / 3;
      justify-self: unset;
      grid-auto-rows: auto;
      row-break: auto;
    }
  }
`;

export const footerPaperCSS = (
  theme: Theme,
  iconItems: { links: [] },
  wepublishLogo: 'hidden' | 'light' | 'dark'
) => css`
  ${theme.breakpoints.up('md')} {
    padding-bottom: ${iconItems?.links.length || wepublishLogo !== 'hidden' ?
      '0'
    : 'calc(var(--footer-paddingY) / 2)'};
  }
`;

export function OnlineReportsFooter({
  className,
  categorySlugs,
  slug,
  iconSlug,
  data,
  loading,
  error,
  hideBannerOnIntersecting,
  wepublishLogo = 'hidden',
  children,
}: BuilderFooterProps) {
  const {
    elements: { H6 },
  } = useWebsiteBuilder();
  const { ref } = useIntersectionObserver({
    initialIsIntersecting: false,
    threshold: 0.9,
  });
  const theme = useTheme();

  const mainItems = data?.navigations?.find(({ key }) => key === slug);
  const iconItems = data?.navigations?.find(({ key }) => key === iconSlug);

  const footerPaperStyles = useMemo(
    () =>
      footerPaperCSS(
        theme,
        iconItems as unknown as { links: [] },
        wepublishLogo
      ),
    [theme, iconItems, wepublishLogo]
  );

  return (
    <FooterWrapper
      className={className}
      ref={ref}
    >
      <FooterPaper
        main={mainItems}
        categories={[]}
        css={footerPaperStyles}
      >
        {children}
      </FooterPaper>

      {(!!iconItems?.links.length || wepublishLogo !== 'hidden') && (
        <FooterIconsWrapper>
          <FooterIcons>
            {iconItems?.links.map((link, index) => (
              <Link
                key={index}
                href={navigationLinkToUrl(link)}
                color="inherit"
              >
                <TextToIcon
                  title={link.label}
                  size={32}
                />
              </Link>
            ))}

            {wepublishLogo === 'light' && (
              <Link href="https://wepublish.ch/de/das-projekt/#cms">
                <WepublishLight height={40} />
              </Link>
            )}

            {wepublishLogo === 'dark' && (
              <Link href="https://wepublish.ch/de/das-projekt/#cms">
                <WepublishDark height={40} />
              </Link>
            )}
          </FooterIcons>
        </FooterIconsWrapper>
      )}
    </FooterWrapper>
  );
}

export const FooterPaper = ({
  className,
  main,
  categories,
  children,
}: PropsWithChildren<{
  className?: string;
  main: FullNavigationFragment | null | undefined;
  categories: FullNavigationFragment[][];
}>) => {
  const {
    elements: { H6 },
  } = useWebsiteBuilder();

  return (
    <FooterPaperWrapper className={className}>
      <FooterName>OnlineReports</FooterName>
      {!!main?.links.length && (
        <FooterMainLinks>
          {main.links.map((link, index) => (
            <Link
              key={index}
              href={navigationLinkToUrl(link)}
              color="inherit"
              underline="none"
            >
              <H6
                component="span"
                css={{ lineHeight: 1.4 }}
              >
                {link.label}
              </H6>
            </Link>
          ))}
        </FooterMainLinks>
      )}

      <FooterCategory>
        <FooterCategoryLinks>
          <H6>OnlineReports GmbH</H6>
          <H6>Münsterplatz 8, 4051 Basel</H6>
          <H6>redaktion@onlinereports.ch</H6>
          <H6>+41 76 392 04 76 / +41 77 443 36 35</H6>
        </FooterCategoryLinks>
      </FooterCategory>

      {children}
    </FooterPaperWrapper>
  );
};

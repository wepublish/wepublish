import styled from '@emotion/styled';
import { alpha, Link as MuiLink, Typography, useTheme } from '@mui/material';
import { forceHideBanner } from '@wepublish/banner/website';
import { BlockRenderer } from '@wepublish/block-content/website';
import {
  FooterCategory as FooterCategoryDefault,
  navigationLinkToUrl,
} from '@wepublish/navigation/website';
import { TextToIcon } from '@wepublish/ui';
import { FullNavigationFragment } from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  BuilderFooterProps,
  Link,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { PropsWithChildren } from 'react';
import { useIntersectionObserver } from 'usehooks-ts';

import { useLoginLinkSwap } from './hooks/use-login-link-swap';
import { useGetFooterContent } from './hooks/useGetFooterContent';

export const FooterWrapper = styled('footer')`
  display: grid;
  grid-template-rows: repeat(2, min-content);
`;

export const FooterMain = styled('div')`
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  container: footer-main/inline-size;
  display: flex;
  flex-direction: row;
  align-content: flex-end;
  justify-content: flex-end;
  column-gap: 3rem;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-row: 1/2;
    grid-column: 2/3;
    margin: 0 2.5% 0 0;
    padding: 0;
    gap: unset;
    justify-content: unset;
    align-content: unset;
    column-gap: 0.9%;
    display: grid;
    grid-template-columns: auto repeat(3, min-content);
    align-items: center;
    justify-self: end;
    align-self: flex-start;
    width: 100%;
    padding-right: 0;
  }
`;

const FooterBlockRenderer = (props: BuilderBlockRendererProps) => (
  <BlockRenderer {...props} />
);

const FooterContentWrapper = styled('div')`
  grid-column: -1 / 1;
  grid-row: 4 / 5;
  display: grid;
  padding-top: ${({ theme }) => theme.spacing(8)};
  row-gap: ${({ theme }) => theme.spacing(7)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
    grid-template-columns: 1fr 200px;
    column-gap: ${({ theme }) => theme.spacing(4)};
    display: grid;
    padding-top: ${({ theme }) => theme.spacing(10)};
  }
`;

export function Footer({
  className,
  categorySlugs,
  slug,
  iconSlug,
  data,
  hideBannerOnIntersecting,
  children,
}: BuilderFooterProps) {
  const { isIntersecting, ref } = useIntersectionObserver({
    initialIsIntersecting: false,
    threshold: 0.9,
  });

  const mainItems = data?.navigations?.find(({ key }) => key === slug);
  const iconItems = data?.navigations?.find(({ key }) => key === iconSlug);

  const categories = categorySlugs.map(categorySlugArray => {
    return categorySlugArray.reduce((navigations, categorySlug) => {
      const navItem = data?.navigations?.find(
        ({ key }) => key === categorySlug
      );

      if (navItem) {
        navigations.push(navItem);
      }

      return navigations;
    }, [] as FullNavigationFragment[]);
  });

  return (
    <FooterWrapper
      className={className}
      ref={ref}
    >
      <FooterPaper
        main={mainItems}
        categories={categories}
        iconItems={iconItems}
        children={children} // eslint-disable-line react/no-children-prop
      />

      {isIntersecting && hideBannerOnIntersecting && forceHideBanner}
    </FooterWrapper>
  );
}

export const FooterPaperWrapper = styled('div')`
  background-color: ${({ theme }) => theme.palette.primary.dark};
  color: ${({ theme }) => theme.palette.common.white};
  display: grid;
  grid-template-rows: repeat(3, auto);
  grid-template-columns: 1fr;
  padding: ${({ theme }) => theme.spacing(8, 2, 16, 2)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-rows: repeat(2, min-content);
    grid-template-columns: 1fr minmax(max-content, 1130px) 1fr;
    padding: ${({ theme }) => theme.spacing(6, 3, 8, 3)};
    row-gap: 0;
  }
`;

export const FooterCategory = styled(FooterCategoryDefault)`
  grid-column: 1 / 2;
  grid-row: 2 / 3;

  &:nth-of-type(n + 2) {
    grid-column: 1 / 2;
    grid-row: 3 / 4;
  }

  &:nth-of-type(n + 3) {
    grid-column: 2 / 3;
    grid-row: 3 / 4;
    padding-left: 0;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    &:nth-of-type(n) {
      grid-column: unset;
      grid-row: unset;
      padding: 0;
    }
  }
`;

export const FooterLinksGroup = styled('div')`
  display: grid;
  grid-column: -1 / 1;
  grid-row: 1 / 4;
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(2, auto);
    grid-row: 1 / 2;
    grid-column: 2 / 3;
  }
`;

export const RefFooter = styled(Footer)``;

const PoweredBy = styled(Link)`
  align-self: end;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  color: rgba(255, 255, 255, 0.78);
  color: ${({ theme }) => theme.palette.common.white};
  text-decoration: none;
  transition: color 140ms;
  font-size: 0.75rem;
  font-family: ${({ theme }) => theme.typography.fontFamily};

  & > span {
    margin: 0 0 0 0.25rem;
  }

  & > svg {
    margin: -0.35rem 0 0 0;
  }

  &:hover {
    color: ${({ theme }) => theme.palette.common.white};
  }
`;

const WePublishLogo = styled('svg')`
  height: auto;
  width: calc(50vw - ${({ theme }) => theme.spacing(4)});
  display: block;

  .wep-shape,
  .wep-shape-clip {
    transition: d 0.45s cubic-bezier(0.55, 0.1, 0.25, 1);
  }

  ${PoweredBy}:hover & .wep-shape,
  ${PoweredBy}:hover & .wep-shape-clip {
    d: path('M4 0 L0 23.7 L43.9 23.7 L47.9 0 Z');
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    height: 22px;
    width: auto;
  }
`;
export const FooterRightColumn = styled('div')`
  display: grid;
  grid-template-rows: min-content 1fr;
  height: 100%;
  gap: ${({ theme }) => theme.spacing(4)};
  grid-column: 1 / 2;
  grid-row: 3 / 4;
  padding-top: ${({ theme }) => theme.spacing(8)};

  ${({ theme }) => theme.breakpoints.down('md')} {
    ${FooterCategory} {
      grid-column: auto;
      grid-row: 1 / 2;
    }
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding-top: 0;
    grid-column: unset;
    grid-row: unset;
  }
`;

export const FooterIconItemsWrapper = styled('div')`
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(3)};
  color: ${({ theme }) => alpha(theme.palette.common.white, 1)};

  & a {
    color: inherit;
    transition: color 140ms;
  }

  & a:hover {
    color: ${({ theme }) => theme.palette.common.white};
  }
`;

export const FooterPaper = ({
  main,
  categories,
  iconItems,
  children,
}: PropsWithChildren<{
  main: FullNavigationFragment | null | undefined;
  categories: FullNavigationFragment[][];
  iconItems?: FullNavigationFragment | null;
}>) => {
  const footerContent = useGetFooterContent();
  const theme = useTheme();
  const {
    blocks: { Blocks },
  } = useWebsiteBuilder();
  const { hasUser, logout, mounted, matchesLoginUrl } = useLoginLinkSwap();

  return (
    <FooterPaperWrapper>
      {categories.map((categoryArray, arrayIndex) => (
        <FooterLinksGroup key={arrayIndex}>
          {categoryArray.map(nav => (
            <FooterCategory key={nav.id}>
              <Typography variant="categoryLinkList">
                {nav.links?.map((link, index) => {
                  const url = navigationLinkToUrl(link);
                  const isLogin = matchesLoginUrl(url);

                  if (isLogin && !mounted) {
                    return null;
                  }

                  if (isLogin && hasUser) {
                    return (
                      <Typography
                        variant="categoryLinkItem"
                        key={index}
                      >
                        <MuiLink
                          variant="categoryLink"
                          component="button"
                          onClick={() => logout()}
                        >
                          Logout
                        </MuiLink>
                      </Typography>
                    );
                  }

                  return (
                    <Typography
                      variant="categoryLinkItem"
                      key={index}
                    >
                      <Link
                        variant={'categoryLink'}
                        href={url}
                      >
                        {link.label}
                      </Link>
                    </Typography>
                  );
                })}
              </Typography>
            </FooterCategory>
          ))}
          <FooterRightColumn>
            <FooterCategory>
              <Typography variant="categoryAddress">
                <Typography variant="categoryAddressText">
                  Verein REFLEKT
                  <br />
                  Postfach
                  <br />
                  3000 Bern 22
                </Typography>
                <Typography variant="categoryAddressText">
                  <Link
                    variant="categoryLink"
                    href="mailto:info@reflekt.ch"
                    sx={{ textDecoration: 'underline' }}
                  >
                    info@reflekt.ch
                  </Link>
                </Typography>
                <Typography variant="categoryAddressText">
                  IBAN: CH 74 0900 0000 1530 5569 6
                </Typography>
              </Typography>
            </FooterCategory>

            {!!iconItems?.links.length && (
              <FooterIconItemsWrapper>
                {iconItems.links.map((link, index) => (
                  <Link
                    key={index}
                    href={navigationLinkToUrl(link)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <TextToIcon
                      title={link.label}
                      size={24}
                    />
                  </Link>
                ))}
              </FooterIconItemsWrapper>
            )}
          </FooterRightColumn>
        </FooterLinksGroup>
      ))}
      {children}
      {footerContent && footerContent.blocks.length > 0 && (
        <FooterContentWrapper>
          <WebsiteBuilderProvider blocks={{ Renderer: FooterBlockRenderer }}>
            <Blocks
              key={'footer'}
              blocks={footerContent.blocks}
              type="Page"
            />
          </WebsiteBuilderProvider>

          <PoweredBy
            href="https://wepublish.ch/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Powered by We.Publish Foundation"
          >
            <Typography
              variant="footerLink"
              component="span"
            >
              Powered by
            </Typography>
            <WePublishLogo
              viewBox="0 0 141.6 23.7"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="We.Publish Logo"
            >
              <title>We.Publish — Das Ökosystem unabhängiger Medien</title>
              <defs>
                <clipPath id="wep-clip">
                  <path
                    className="wep-shape-clip"
                    d="M47.9 0 L43.9 23.7 L137.6 23.7 L141.6 0 Z"
                  />
                </clipPath>
              </defs>
              <rect
                width="141.6"
                height="23.7"
                fill={theme.palette.primary.dark}
              />
              <g fill="currentColor">
                <path d="M73.6 10.3v3.2q0 2.4-1.8 2.4c-1.8 0-1.7-.8-1.7-2.2V7.3h-3.3v7.4c0 2.6 1.6 4.4 4 4.4s2.5-.5 3.2-1.4v1.2h3.2V7.1h-3.4v3.1h-.2zm21.8-3.8v12.1h3.3V3.4h-3.3zm10.3-3.1h-3.3v3.1h3.3zm-3.4 6.9v8.4h3.3V9.4h-3.3zm-44-3.4c-1.4 0-2.4.5-3.2 1.6V7.2h-4.6l-.5 3.1h1.8v11.8h3.3v-4.5c1.2 1 2 1.3 3.4 1.3 3 0 5.5-2.7 5.5-5.9s-2.6-6-5.7-6m-.4 8.7c-1.6 0-2.8-1.2-2.8-2.8s1.3-2.8 2.8-2.8 2.8 1.2 2.8 2.8-1.2 2.8-2.8 2.8m74.1-.2v-3.7c0-3-1.6-4.9-4-4.9s-2.4.6-3.1 1.8V3.4h-3.3v15.3h3.3v-6.1c0-1.5.7-2.3 2-2.3s1.9.7 1.9 2.4v6h4.5l.5-3.1H132zm-16.8-8.2c-.5-.4-1.2-.6-2-.6-2.4 0-4.3 1.7-4.3 3.8s.5 2.2 1.5 2.7c.7.5.9.5 3 1.1 1.2.4 1.6.6 1.6 1.2s-.5 1-1.2 1-1.7-.1-1.8-1h-2.8l-.5 2.9h3.1c.7.4 1.5.7 2.4.7 2.4 0 4.3-1.7 4.3-3.9s0-1-.3-1.5c-.5-1-1.2-1.5-2.7-2l-1.5-.4c-1.2-.3-1.5-.6-1.5-1.1s.5-.8 1.1-.8 1.5 0 1.6.8h2.8l.5-2.9zm-27.8-.4c-1.4 0-2.4.4-3.1 1.3V3.4h-4.6l-.5 3.1H81v12.1h3.3v-1.3c.9 1.1 1.9 1.5 3.2 1.5 3 0 5.5-2.7 5.5-6s-2.5-6-5.6-6m-.5 8.9c-1.5 0-2.7-1.3-2.7-2.8s1.2-2.8 2.7-2.8 2.7 1.2 2.7 2.8-1.2 2.8-2.7 2.8" />
                <path d="M34.9 17.4c-1.1 0-2.1-.6-2.6-1.5-.2-.3-.4-.8-.4-1.2 3.3.4 6.1-.3 7.8-1.9 1.1-1.1 1.6-2.5 1.4-4S39.6 6 37.8 5.6c-3.2-.7-5.8 1.5-7.2 3.9-.3.5-.6 1.1-.8 1.6-2.3-1.4-3.4-4.5-3.6-5.4v-.3l-2.6.7v.3c.7 2.9-.5 7.3-2.6 9.5-.9.9-1.8 1.3-2.6 1.1-.2 0-.7 0-1.1-1.3 0-.4-.2-.8-.2-1.3 1.5-3 2.6-6.7 1.9-8.1s.8-.9-1.4-.9-2.9 4.2-3.1 6v2.4c-.5.8-1.1 1.7-1.7 2.3-.8.8-1.6 1.2-2.3 1.1-.5 0-.9-.3-1.1-.8-.9-2 .2-6.6 1.9-9.5v-.3L8.9 5.3v.2c-.4.4-1.9 1.6-4.4 1.2l-.4 2.7c1.1.3 2.2.2 3.1 0-.8 2.8-1.2 6-.2 8.1.6 1.4 1.7 2.2 3.1 2.4 1.3.2 3.2-.1 5.2-2.5.6 1.2 1.5 2 2.7 2.3 1.8.4 3.6-.3 5.1-1.9s2.6-3.9 3.1-6.3c.8 1 1.8 1.9 3.1 2.5 0 1.2.3 2.3.8 3.3 1 1.8 2.9 2.9 4.9 2.9 2.4 0 4.6-1.1 5.8-2.6l-2.1-1.7c-.6.8-1.9 1.5-3.7 1.5zM32.3 12c.1-.3.3-.7.5-1 1.8-3 3.8-2.8 4.4-2.7.7.2 1.2.6 1.2.9 0 .7-.1 1.2-.6 1.7-.8.9-2.7 1.5-5.5 1.2z" />
              </g>
              <path
                className="wep-shape"
                d="M47.9 0 L43.9 23.7 L137.6 23.7 L141.6 0 Z"
                fill="currentColor"
              />
              <g
                fill={theme.palette.primary.dark}
                clipPath="url(#wep-clip)"
              >
                <path d="M73.6 10.3v3.2q0 2.4-1.8 2.4c-1.8 0-1.7-.8-1.7-2.2V7.3h-3.3v7.4c0 2.6 1.6 4.4 4 4.4s2.5-.5 3.2-1.4v1.2h3.2V7.1h-3.4v3.1h-.2zm21.8-3.8v12.1h3.3V3.4h-3.3zm10.3-3.1h-3.3v3.1h3.3zm-3.4 6.9v8.4h3.3V9.4h-3.3zm-44-3.4c-1.4 0-2.4.5-3.2 1.6V7.2h-4.6l-.5 3.1h1.8v11.8h3.3v-4.5c1.2 1 2 1.3 3.4 1.3 3 0 5.5-2.7 5.5-5.9s-2.6-6-5.7-6m-.4 8.7c-1.6 0-2.8-1.2-2.8-2.8s1.3-2.8 2.8-2.8 2.8 1.2 2.8 2.8-1.2 2.8-2.8 2.8m74.1-.2v-3.7c0-3-1.6-4.9-4-4.9s-2.4.6-3.1 1.8V3.4h-3.3v15.3h3.3v-6.1c0-1.5.7-2.3 2-2.3s1.9.7 1.9 2.4v6h4.5l.5-3.1H132zm-16.8-8.2c-.5-.4-1.2-.6-2-.6-2.4 0-4.3 1.7-4.3 3.8s.5 2.2 1.5 2.7c.7.5.9.5 3 1.1 1.2.4 1.6.6 1.6 1.2s-.5 1-1.2 1-1.7-.1-1.8-1h-2.8l-.5 2.9h3.1c.7.4 1.5.7 2.4.7 2.4 0 4.3-1.7 4.3-3.9s0-1-.3-1.5c-.5-1-1.2-1.5-2.7-2l-1.5-.4c-1.2-.3-1.5-.6-1.5-1.1s.5-.8 1.1-.8 1.5 0 1.6.8h2.8l.5-2.9zm-27.8-.4c-1.4 0-2.4.4-3.1 1.3V3.4h-4.6l-.5 3.1H81v12.1h3.3v-1.3c.9 1.1 1.9 1.5 3.2 1.5 3 0 5.5-2.7 5.5-6s-2.5-6-5.6-6m-.5 8.9c-1.5 0-2.7-1.3-2.7-2.8s1.2-2.8 2.7-2.8 2.7 1.2 2.7 2.8-1.2 2.8-2.7 2.8" />
                <path d="M34.9 17.4c-1.1 0-2.1-.6-2.6-1.5-.2-.3-.4-.8-.4-1.2 3.3.4 6.1-.3 7.8-1.9 1.1-1.1 1.6-2.5 1.4-4S39.6 6 37.8 5.6c-3.2-.7-5.8 1.5-7.2 3.9-.3.5-.6 1.1-.8 1.6-2.3-1.4-3.4-4.5-3.6-5.4v-.3l-2.6.7v.3c.7 2.9-.5 7.3-2.6 9.5-.9.9-1.8 1.3-2.6 1.1-.2 0-.7 0-1.1-1.3 0-.4-.2-.8-.2-1.3 1.5-3 2.6-6.7 1.9-8.1s.8-.9-1.4-.9-2.9 4.2-3.1 6v2.4c-.5.8-1.1 1.7-1.7 2.3-.8.8-1.6 1.2-2.3 1.1-.5 0-.9-.3-1.1-.8-.9-2 .2-6.6 1.9-9.5v-.3L8.9 5.3v.2c-.4.4-1.9 1.6-4.4 1.2l-.4 2.7c1.1.3 2.2.2 3.1 0-.8 2.8-1.2 6-.2 8.1.6 1.4 1.7 2.2 3.1 2.4 1.3.2 3.2-.1 5.2-2.5.6 1.2 1.5 2 2.7 2.3 1.8.4 3.6-.3 5.1-1.9s2.6-3.9 3.1-6.3c.8 1 1.8 1.9 3.1 2.5 0 1.2.3 2.3.8 3.3 1 1.8 2.9 2.9 4.9 2.9 2.4 0 4.6-1.1 5.8-2.6l-2.1-1.7c-.6.8-1.9 1.5-3.7 1.5zM32.3 12c.1-.3.3-.7.5-1 1.8-3 3.8-2.8 4.4-2.7.7.2 1.2.6 1.2.9 0 .7-.1 1.2-.6 1.7-.8.9-2.7 1.5-5.5 1.2z" />
              </g>
            </WePublishLogo>
          </PoweredBy>
        </FooterContentWrapper>
      )}
    </FooterPaperWrapper>
  );
};

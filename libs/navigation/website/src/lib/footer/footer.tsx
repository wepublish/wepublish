import { css } from '@mui/material';
import styled from '@emotion/styled';
import { FullNavigationFragment } from '@wepublish/website/api';
import {
  BuilderFooterProps,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { navigationLinkToUrl } from '../link-to-url';
import { PropsWithChildren } from 'react';
import { TextToIcon } from '@wepublish/ui';
import { useIntersectionObserver } from 'usehooks-ts';
import { forceHideBanner } from '@wepublish/banner/website';
import { ReactComponent as WepublishLight } from './wepublish-light.svg';
import { ReactComponent as WepublishDark } from './wepublish-dark.svg';

export const FooterWrapper = styled('footer')`
  position: sticky;
  top: 0;

  --footer-paddingX: ${({ theme }) => theme.spacing(2.5)};
  --footer-paddingY: ${({ theme }) => theme.spacing(2.5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    --footer-paddingX: calc(100% / 6);
    --footer-paddingY: calc(100% / 12);
  }
`;

export const FooterMain = styled('div')`
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-self: start;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const FooterMainItems = styled('div')<{ show: boolean }>`
  display: none;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: ${({ theme }) => theme.spacing(2)};
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: 1.125rem;
  text-transform: uppercase;

  ${({ theme, show }) => css`
    ${theme.breakpoints.up('sm')} {
      display: ${show && 'grid'};
    }
  `}
`;

export const FooterIconsWrapper = styled.div`
  padding: calc(var(--footer-paddingY) / 2) var(--footer-paddingX);
  background: #000;
  color: ${({ theme }) => theme.palette.getContrastText('#000')};
  display: grid;
  grid-template-columns: 1fr;
`;

export const FooterIcons = styled.div`
  display: flex;
  justify-content: space-evenly;
  flex-flow: row wrap;
  align-items: center;
  justify-self: center;
  gap: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    justify-self: end;
  }
`;

export function Footer({
  className,
  categorySlugs,
  slug,
  iconSlug,
  data,
  loading,
  error,
  hideBannerOnIntersecting,
  wepublishLogo,
  children,
}: BuilderFooterProps) {
  const { isIntersecting, ref } = useIntersectionObserver({
    initialIsIntersecting: false,
    threshold: 0.9,
  });

  const mainItems = data?.navigations?.find(({ key }) => key === slug);

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

  const iconItems = data?.navigations?.find(({ key }) => key === iconSlug);

  return (
    <FooterWrapper
      className={className}
      ref={ref}
    >
      <FooterPaper
        main={mainItems}
        categories={categories}
        children={children}
      />

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

      {isIntersecting && hideBannerOnIntersecting && forceHideBanner}
    </FooterWrapper>
  );
}

export const FooterPaperWrapper = styled('div')`
  padding: var(--footer-paddingY) var(--footer-paddingX);
  background-color: ${({ theme }) => theme.palette.grey[800]};
  color: ${({ theme }) =>
    theme.palette.getContrastText(theme.palette.grey[800])};
  display: grid;
  column-gap: ${({ theme }) => theme.spacing(3)};
  row-gap: ${({ theme }) => theme.spacing(8)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    column-gap: ${({ theme }) => theme.spacing(6)};
    row-gap: ${({ theme }) => theme.spacing(12)};
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
  }
`;

export const FooterCategory = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  grid-auto-rows: max-content;
`;

export const FooterName = styled('span')`
  text-transform: uppercase;
  font-weight: 300;
  font-size: 14px;
`;

export const FooterLinksGroup = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => css`
    ${theme.breakpoints.up('sm')} {
      grid-template-columns: repeat(auto-fill, minmax(max-content, 25ch));
    }
  `}
`;

export const FooterPaperLink = styled(Link)`
  ${({ theme }) => theme.breakpoints.up('sm')} {
    border-bottom: 0;
  }
`;

export const FooterCategoryLinks = styled('div')`
  display: grid;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
  font-size: ${({ theme }) => theme.typography.h6.fontSize};

  a {
    color: inherit;
    text-decoration: none;
  }
`;

export const FooterMainLinks = styled(FooterCategoryLinks)`
  gap: ${({ theme }) => theme.spacing(1)};
  grid-auto-rows: max-content;
`;

export const FooterPaper = ({
  main,
  categories,
  children,
}: PropsWithChildren<{
  main: FullNavigationFragment | null | undefined;
  categories: FullNavigationFragment[][];
}>) => {
  const {
    elements: { H4, H6 },
  } = useWebsiteBuilder();

  return (
    <FooterPaperWrapper>
      {!!main?.links.length && (
        <FooterMainLinks>
          {main.links.map((link, index) => (
            <Link
              key={index}
              href={navigationLinkToUrl(link)}
              color="inherit"
              underline="none"
            >
              <H4
                component="span"
                css={{ fontWeight: '700' }}
              >
                {link.label}
              </H4>
            </Link>
          ))}
        </FooterMainLinks>
      )}

      {categories.map((categoryArray, arrayIndex) => (
        <FooterLinksGroup key={arrayIndex}>
          {categoryArray.map(nav => (
            <FooterCategory key={nav.id}>
              {nav.name && <FooterName>{nav.name}</FooterName>}

              <FooterCategoryLinks>
                {nav.links?.map((link, index) => (
                  <FooterPaperLink
                    href={navigationLinkToUrl(link)}
                    key={index}
                    color="inherit"
                    underline="none"
                  >
                    <H6
                      component="span"
                      css={{ fontWeight: '700' }}
                    >
                      {link.label}
                    </H6>
                  </FooterPaperLink>
                ))}
              </FooterCategoryLinks>
            </FooterCategory>
          ))}
        </FooterLinksGroup>
      ))}

      {children}
    </FooterPaperWrapper>
  );
};

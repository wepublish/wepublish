import styled from '@emotion/styled';
import { alpha } from '@mui/material';
import {
  navigationLinkToUrl,
  WepublishDark,
  WepublishLight,
} from '@wepublish/navigation/website';
import { TextToIcon } from '@wepublish/ui';
import { FullNavigationFragment } from '@wepublish/website/api';
import { BuilderFooterProps, Link } from '@wepublish/website/builder';
import { forceHideBanner } from '@wepublish/banner/website';
import { useIntersectionObserver } from 'usehooks-ts';

import { courantTokens } from '../brand-tokens';
import { AminimaLogo } from './aminima-logo';
import { CourantLogo } from './courant-logo';

const { footer, pageMaxWidth, pageInline } = courantTokens.layout;
const { colors } = courantTokens;
const { sizes } = courantTokens.typography;

const CourantFooterWrapper = styled('footer')`
  position: sticky;
  top: 0;
`;

const CourantFooterPaper = styled('div')`
  background-color: ${colors.warmGray[900]};
  color: ${({ theme }) => theme.palette.common.white};
  padding-top: ${({ theme }) => theme.spacing(20)};
  padding-bottom: ${({ theme }) => theme.spacing(40)};
  border-top: 5px solid ${colors.courant[500]};
`;

const CourantFooterContent = styled('div')`
  width: 100%;
  max-width: ${pageMaxWidth}px;
  margin-inline: auto;
  padding-inline: ${({ theme }) => theme.spacing(pageInline.xs)};
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  column-gap: ${({ theme }) => theme.spacing(3)};
  row-gap: ${({ theme }) => theme.spacing(footer.rowGap)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    padding-inline: ${({ theme }) => theme.spacing(pageInline.sm)};
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding-inline: ${({ theme }) => theme.spacing(pageInline.md)};
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    column-gap: ${({ theme }) => theme.spacing(footer.desktopGap)};
    row-gap: ${({ theme }) => theme.spacing(footer.desktopGap)};
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    padding-inline: ${({ theme }) => theme.spacing(pageInline.lg)};
  }
`;

const CourantFooterContact = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(footer.contactGap)};
  grid-auto-rows: max-content;
  min-width: 0;

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding-right: ${({ theme }) => theme.spacing(footer.contactPadding)};
    border-right: ${footer.dividerWidth} solid
      ${({ theme }) => alpha(theme.palette.common.white, 0.2)};
  }
`;

const CourantFooterLogo = styled(CourantLogo)`
  height: ${({ theme }) => theme.spacing(6)};
  width: auto;
  color: ${({ theme }) => theme.palette.common.white};
  display: block;
`;

const CourantFooterTagline = styled('p')`
  margin: ${({ theme }) => theme.spacing(1)} 0 0 0;
  font-family: var(--courant-sans);
  font-size: ${sizes.body2};
  line-height: 1.4;
  color: ${colors.warmGray[400]};
`;

const CourantCategoriesGrid = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(3)};
  min-width: 0;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: repeat(auto-fill, minmax(0, 25ch));
  }
`;

const CourantFooterCategory = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};
  grid-auto-rows: max-content;
`;

const CourantFooterCategoryName = styled('span')`
  font-family: var(--courant-kicker);
  font-weight: var(--courant-kicker-weight);
  line-height: var(--courant-kicker-lh);
  letter-spacing: var(--courant-kicker-tracking);
  font-size: ${sizes.teaserPretitle};
  text-transform: uppercase;
  color: ${colors.warmGray[400]};
`;

const CourantFooterCategoryLinks = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const CourantFooterLink = styled(Link)`
  font-family: var(--courant-sans);
  font-size: ${sizes.footerLink};
  font-weight: 500;
  color: ${({ theme }) => theme.palette.common.white};
  text-decoration: none;

  &:hover {
    color: ${colors.courant[500]};
  }
`;

const CourantFooterIconsWrapper = styled('div')`
  background-color: ${colors.warmGray[950]};
  color: ${({ theme }) => theme.palette.getContrastText(colors.black)};
  padding-block: ${({ theme }) => theme.spacing(8)};
  padding-inline: ${({ theme }) => theme.spacing(pageInline.xs)};
  display: grid;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    padding-inline: ${({ theme }) => theme.spacing(pageInline.sm)};
  }
  ${({ theme }) => theme.breakpoints.up('md')} {
    padding-inline: ${({ theme }) => theme.spacing(pageInline.md)};
  }
  ${({ theme }) => theme.breakpoints.up('lg')} {
    padding-inline: ${({ theme }) => theme.spacing(pageInline.lg)};
  }
`;

const CourantFooterIcons = styled('div')`
  width: 100%;
  max-width: ${pageMaxWidth}px;
  margin-inline: auto;
  display: flex;
  flex-flow: row wrap;
  align-items: flex-end;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(12)};
  ${({ theme }) => theme.breakpoints.up('sm')} {
    justify-content: flex-end;
  }
`;

export const CourantFooter = ({
  className,
  categorySlugs,
  iconSlug,
  data,
  wepublishLogo,
  hideBannerOnIntersecting,
}: BuilderFooterProps) => {
  const { isIntersecting, ref } = useIntersectionObserver({
    initialIsIntersecting: false,
    threshold: 0.9,
  });

  const categories = categorySlugs.map(slugs =>
    slugs.reduce((acc, s) => {
      const nav = data?.navigations?.find(({ key }) => key === s);
      if (nav) acc.push(nav);
      return acc;
    }, [] as FullNavigationFragment[])
  );

  const iconItems = data?.navigations?.find(({ key }) => key === iconSlug);

  return (
    <CourantFooterWrapper
      className={className}
      ref={ref}
    >
      <CourantFooterPaper>
        <CourantFooterContent>
          <CourantFooterContact>
            <CourantFooterLogo />

            <CourantFooterTagline>
              Votre nouveau média genevois
            </CourantFooterTagline>
          </CourantFooterContact>

          {!!categories.length && (
            <CourantCategoriesGrid>
              {categories.flat().map(nav => (
                <CourantFooterCategory key={nav.id}>
                  {nav.name && (
                    <CourantFooterCategoryName>
                      {nav.name}
                    </CourantFooterCategoryName>
                  )}

                  <CourantFooterCategoryLinks>
                    {nav.links?.map((link, index) => (
                      <CourantFooterLink
                        href={navigationLinkToUrl(link)}
                        key={index}
                      >
                        {link.label}
                      </CourantFooterLink>
                    ))}
                  </CourantFooterCategoryLinks>
                </CourantFooterCategory>
              ))}
            </CourantCategoriesGrid>
          )}
        </CourantFooterContent>
      </CourantFooterPaper>

      {(!!iconItems?.links.length || wepublishLogo !== 'hidden') && (
        <CourantFooterIconsWrapper>
          <CourantFooterIcons>
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

            <Link
              href="https://aminima.ch?ref=courant"
              target="_blank"
              rel="noopener"
              color="inherit"
            >
              <AminimaLogo height={38} />
            </Link>

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
          </CourantFooterIcons>
        </CourantFooterIconsWrapper>
      )}

      {isIntersecting && hideBannerOnIntersecting && forceHideBanner}
    </CourantFooterWrapper>
  );
};

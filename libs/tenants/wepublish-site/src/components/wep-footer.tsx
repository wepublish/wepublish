import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import { forceHideBanner } from '@wepublish/banner/website';
import { navigationLinkToUrl } from '@wepublish/navigation/website';
import { FullNavigationFragment } from '@wepublish/website/api';
import { BuilderFooterProps, Link } from '@wepublish/website/builder';
import { useId } from 'react';
import { useIntersectionObserver } from 'usehooks-ts';

import github from '../assets/github.svg';
import linkedin from '../assets/linkedin.svg';
import mail from '../assets/mail.svg';
import { staticImageSrc } from '../assets/static-image';
import logo from '../assets/wepublish-logo-alt.svg';
import { designText } from '../theme';
import { tertiaryButtonOnDark } from './button-styles';
import { contentWidth, extraColumn } from './page-columns';
import {
  LanguageSwitch,
  LanguageSwitchButton,
  LanguageSwitchChevron,
  LanguageSwitchList,
} from './wep-navbar';

type NavigationLink = NonNullable<FullNavigationFragment['links']>[number];

export const FooterWrapper = styled('footer')`
  background-color: ${({ theme }) => theme.palette.primary.dark};
  color: ${({ theme }) => theme.palette.common.white};
  padding: ${({ theme }) => theme.spacing(6, 2, 10)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    padding-inline: ${({ theme }) => theme.spacing(3)};
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: 60px ${({ theme }) => theme.spacing(3)} 120px;
  }

  // As wide as the navbar
  ${({ theme }) => theme.breakpoints.up('lg')} {
    padding-inline: calc(
      (100% - ${({ theme }) => contentWidth(theme)}) / 2 -
        ${({ theme }) => extraColumn(theme, contentWidth(theme), '100%')}
    );
  }
`;

export const FooterInner = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(6)};

  ${({ theme }) => theme.breakpoints.up('lg')} {
    // The groups start a quarter of the way in, as in the design
    grid-template-columns: minmax(0, 1fr) minmax(0, 3fr);
  }
`;

export const FooterBrand = styled('div')`
  display: grid;
  align-content: start;
  gap: 40px;
`;

export const FooterLogo = styled('img')`
  width: 180px;
  height: auto;

  ${({ theme }) => theme.breakpoints.up('md')} {
    width: 237px;
  }
`;

export const FooterAddress = styled('address')`
  ${designText.text as CSSObject}
  font-style: normal;
`;

// Two groups below each other per column, the language switch in the last column
export const FooterGroups = styled('div')`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, max-content));
  justify-content: space-between;
  gap: 40px ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-rows: repeat(2, auto);
    grid-template-columns: none;
    grid-auto-flow: column;
    grid-auto-columns: max-content;
  }
`;

export const FooterGroup = styled('section')`
  display: grid;
  align-content: start;
  justify-items: start;
  gap: 10px;
`;

export const FooterGroupTitle = styled('h2')`
  ${designText.textSmallMono as CSSObject}
  margin: 0;
  color: #888888;
`;

export const FooterLink = styled('a')`
  ${designText.text as CSSObject}
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: none;
  }
`;

export const FooterIcons = styled('div')`
  display: flex;
  gap: 15px;
`;

export const FooterIconLink = styled('a')`
  display: block;
  line-height: 0;
`;

export const FooterIcon = styled('img')`
  width: 32px;
  height: 32px;
`;

// The language switch of the navbar, in white on the dark background
export const FooterLanguageSwitch = styled(LanguageSwitch)`
  grid-column: 1 / -1;
  justify-self: start;
  align-self: start;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: auto;
    grid-row: 1 / 2;
  }

  ${LanguageSwitchButton} {
    ${({ theme }) => tertiaryButtonOnDark(theme)}
  }

  ${LanguageSwitchChevron} {
    filter: invert(1);
  }

  ${LanguageSwitchList} {
    background-color: ${({ theme }) => theme.palette.primary.dark};

    a:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
`;

const icons = [
  { matches: (url: string) => url.includes('linkedin.com'), src: linkedin },
  { matches: (url: string) => url.startsWith('mailto:'), src: mail },
  { matches: (url: string) => url.includes('github.com'), src: github },
];

const iconFor = (link: NavigationLink) => {
  const url = navigationLinkToUrl(link) ?? '';

  return icons.find(({ matches }) => matches(url))?.src;
};

const FooterLinkGroup = ({
  navigation,
  iconLinks = [],
}: {
  navigation: FullNavigationFragment;
  iconLinks?: NavigationLink[];
}) => {
  const titleId = useId();

  return (
    <FooterGroup aria-labelledby={titleId}>
      <FooterGroupTitle id={titleId}>{navigation.name}</FooterGroupTitle>

      {iconLinks.length > 0 && (
        <FooterIcons>
          {iconLinks.map((link, index) => {
            const icon = iconFor(link);

            return (
              icon && (
                <FooterIconLink
                  key={index}
                  as={Link}
                  href={navigationLinkToUrl(link)}
                  aria-label={link.label}
                >
                  <FooterIcon
                    src={staticImageSrc(icon)}
                    alt=""
                  />
                </FooterIconLink>
              )
            );
          })}
        </FooterIcons>
      )}

      {navigation.links.map((link, index) => (
        <FooterLink
          key={index}
          as={Link}
          href={navigationLinkToUrl(link)}
        >
          {link.label}
        </FooterLink>
      ))}
    </FooterGroup>
  );
};

/**
 * One group per navigation (`slug` first, then `categorySlugs`), titled with
 * the name of the navigation. The links of the `iconSlug` navigation are shown
 * as icons in the last group.
 */
export function WepFooter({
  className,
  categorySlugs,
  slug,
  iconSlug,
  data,
  hideBannerOnIntersecting,
}: BuilderFooterProps) {
  const { isIntersecting, ref } = useIntersectionObserver({
    initialIsIntersecting: false,
    threshold: 0.9,
  });

  const navigationByKey = (key: string) =>
    data?.navigations?.find(navigation => navigation.key === key);

  const groups = [slug, ...categorySlugs.flat()]
    .map(navigationByKey)
    .filter((navigation): navigation is FullNavigationFragment => !!navigation);
  const iconLinks = (iconSlug && navigationByKey(iconSlug)?.links) || [];

  return (
    <FooterWrapper
      className={className}
      ref={ref}
    >
      <FooterInner>
        <FooterBrand>
          <FooterLogo
            src={staticImageSrc(logo)}
            alt="WePublish Logo"
          />

          <FooterAddress>
            We.Publish Foundation
            <br />
            Friedensgasse 52
            <br />
            4056 Basel
          </FooterAddress>
        </FooterBrand>

        <FooterGroups>
          {groups.map((navigation, index) => (
            <FooterLinkGroup
              key={navigation.id}
              navigation={navigation}
              iconLinks={index === groups.length - 1 ? iconLinks : undefined}
            />
          ))}

          <FooterLanguageSwitch />
        </FooterGroups>
      </FooterInner>

      {isIntersecting && hideBannerOnIntersecting && forceHideBanner}
    </FooterWrapper>
  );
}

import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { isFilledTeaser } from '@wepublish/block-content/website';
import {
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { useRouter } from 'next/router';

import { enrichTeasersWithAds } from '../teasers/eenews-teaser-ads';
import { EenewsTeaser } from './eenews-teaser';

const Section = styled('section')`
  background: ${({ theme }) => theme.palette.background.default};
  padding: 56px;
  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 36px 20px;
  }
`;

const Head = styled('div')`
  max-width: var(--max-width);
  margin: 0 auto 28px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  ${({ theme }) => theme.breakpoints.down('md')} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Title = styled(Typography)`
  display: block;
  color: ${({ theme }) => theme.palette.primary.main};
  margin: 0;
`;

const Toggle = styled('div')`
  display: inline-flex;
  gap: 18px;
  align-items: center;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const ToggleSep = styled('span')`
  display: inline-block;
  width: 1px;
  height: 22px;
  background: ${({ theme }) => theme.palette.primary.main};
  opacity: 0.6;
  margin: 0 2px;
`;

const ToggleLink = styled('a', {
  shouldForwardProp: p => p !== 'isActive',
})<{ isActive: boolean }>`
  background: none;
  border: 0;
  padding: 4px 2px;
  color: ${({ theme }) => theme.palette.primary.main};
  opacity: ${({ isActive }) => (isActive ? 1 : 0.55)};
  font-weight: ${({ isActive }) => (isActive ? 700 : 400)};
  text-decoration: none;
  cursor: pointer;
  &:hover {
    opacity: 1;
  }
`;

const Grid = styled('div')`
  max-width: var(--max-width);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 36px 32px;

  ${({ theme }) => theme.breakpoints.down('lg')} {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
  ${({ theme }) => theme.breakpoints.down('sm')} {
    grid-template-columns: 1fr;
  }
`;

export const EenewsAktuellGrid = ({
  title,
  teasers,
  blockStyle,
  className,
}: BuilderTeaserSlotsBlockProps) => {
  const router = useRouter();
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();
  const filled = enrichTeasersWithAds((teasers ?? []).filter(isFilledTeaser));

  const isCH = router.asPath === '/';
  const isIntl = router.asPath.startsWith('/a/tag/international');
  const isFR = router.asPath.startsWith('/a/tag/articles');

  return (
    <Section className={className}>
      <Head>
        <Title variant="sectionTitle">{title ?? 'Aktuell'}</Title>
        <Toggle
          role="navigation"
          aria-label="Region"
        >
          <ToggleLink
            href="/"
            isActive={isCH}
          >
            <Typography
              variant="sectionToggle"
              component="span"
            >
              Schweiz
            </Typography>
          </ToggleLink>
          <ToggleLink
            href="/a/tag/international"
            isActive={isIntl}
          >
            <Typography
              variant="sectionToggle"
              component="span"
            >
              Welt
            </Typography>
          </ToggleLink>
          <ToggleSep aria-hidden />
          <ToggleLink
            href="/a/tag/articles%20en%20fran%C3%A7ais"
            isActive={isFR}
          >
            <Typography
              variant="sectionToggle"
              component="span"
            >
              Articles en français
            </Typography>
          </ToggleLink>
        </Toggle>
      </Head>
      <Grid>
        <WebsiteBuilderProvider blocks={{ Teaser: EenewsTeaser }}>
          {filled.map((teaser, idx) => (
            <Teaser
              key={idx}
              teaser={teaser}
              index={idx}
              blockStyle={blockStyle}
              numColumns={3}
              alignment={{
                i: String(idx),
                x: 0,
                y: 0,
                w: 4,
                h: 1,
                static: false,
              }}
            />
          ))}
        </WebsiteBuilderProvider>
      </Grid>
    </Section>
  );
};

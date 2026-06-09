import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { isFilledTeaser } from '@wepublish/block-content/website';
import {
  BuilderTeaserSlotsBlockProps,
  Link,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';

import { EenewsTeaser } from './eenews-teaser';

const Section = styled('section')`
  background: ${({ theme }) => theme.palette.background.alt};
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

const AllLink = styled(Link)`
  color: ${({ theme }) => theme.palette.primary.main};
  text-decoration: underline;
  text-underline-offset: 4px;
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

export const EenewsDossierGrid = ({
  title,
  teasers,
  blockStyle,
  className,
}: BuilderTeaserSlotsBlockProps) => {
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();
  const filled = (teasers ?? []).filter(isFilledTeaser);

  return (
    <Section className={className}>
      <Head>
        <Title variant="sectionTitle">{title ?? 'Dossiers'}</Title>
        <AllLink href="/a/tag">
          <Typography
            variant="sectionLink"
            component="span"
          >
            Alle Dossiers →
          </Typography>
        </AllLink>
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

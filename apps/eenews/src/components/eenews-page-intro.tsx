import styled from '@emotion/styled';
import { Container, Typography } from '@mui/material';
import { ReactNode } from 'react';

import { eenewsColors } from '../theme';

/**
 * Reusable page-intro section used across the v2 design — same shape on
 * archive, events, authors, mitmachen, imprint, search, etc.: large display
 * headline left, descriptive lede + optional stat-tiles right, with a
 * sage-band background and a thick ink underline below.
 */
const Frame = styled('section')`
  background: ${eenewsColors.section};
  padding: 64px 0 56px;
  border-bottom: 2px solid ${eenewsColors.ink};
`;

const Grid = styled('div')`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 56px;
  align-items: end;
  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

// Note: avoid `styled(Typography)` — it drops MUI's OverridableComponent
// generic and breaks the `component` prop in TS strict mode. Use plain
// `<Typography variant component sx>` instead. See pattern in
// `wepublish-redesign-patterns.md` anti-patterns.
const RightCol = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const StatRow = styled('div')`
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
`;

const StatItem = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const EyebrowWrap = styled('div')`
  margin-bottom: 12px;
`;

export type Stat = {
  label: string;
  value: ReactNode;
};

export type EenewsPageIntroProps = {
  eyebrow?: string;
  headline: ReactNode;
  lede?: ReactNode;
  stats?: Stat[];
  variant?: 'topic' | 'large';
  className?: string;
};

export const EenewsPageIntro = ({
  eyebrow,
  headline,
  lede,
  stats,
  variant = 'topic',
  className,
}: EenewsPageIntroProps) => {
  const headlineVariant =
    variant === 'large' ? 'displayPageH1' : 'displayTopicH1';
  return (
    <Frame className={className}>
      <Container>
        {eyebrow ?
          <EyebrowWrap>
            <Typography
              variant="metaEyebrow"
              component="div"
              sx={{ color: eenewsColors.inkSoft }}
            >
              {eyebrow}
            </Typography>
          </EyebrowWrap>
        : null}
        <Grid>
          <Typography
            variant={headlineVariant}
            component="h1"
            sx={{ margin: 0, color: eenewsColors.ink }}
          >
            {headline}
          </Typography>
          <RightCol>
            {lede ?
              <Typography
                variant="bodyLead"
                component="p"
                sx={{ margin: 0, color: eenewsColors.ink, maxWidth: '52ch' }}
              >
                {lede}
              </Typography>
            : null}
            {stats && stats.length ?
              <StatRow>
                {stats.map(s => (
                  <StatItem key={s.label}>
                    <Typography
                      variant="metaEyebrowSmall"
                      component="span"
                      sx={{ color: eenewsColors.inkSoft }}
                    >
                      {s.label}
                    </Typography>
                    <Typography
                      variant="displayStatNum"
                      component="span"
                      sx={{ color: eenewsColors.ink }}
                    >
                      {s.value}
                    </Typography>
                  </StatItem>
                ))}
              </StatRow>
            : null}
          </RightCol>
        </Grid>
      </Container>
    </Frame>
  );
};

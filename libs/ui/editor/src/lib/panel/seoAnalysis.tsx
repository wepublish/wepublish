import styled from '@emotion/styled';
import { Card, CardContent, CardHeader } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { SeoContentStats } from './seoBlockContext';

const Stats = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  margin: 0;
`;

const StatTitle = styled.dt`
  font-size: 12px;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const StatVal = styled.dd`
  margin: 0;
  font-weight: 600;
`;

export interface SeoAnalysisProps {
  stats?: SeoContentStats;
}

export function SeoAnalysis({ stats }: SeoAnalysisProps) {
  const { t } = useTranslation();

  if (!stats) {
    return null;
  }

  return (
    <Card variant="outlined">
      <CardHeader
        title={t('seoAnalysis.title')}
        subheader={t('seoAnalysis.description')}
      />

      <CardContent>
        <Stats>
          <div>
            <StatTitle>{t('seoAnalysis.stats.wordCount')}</StatTitle>
            <StatVal>{stats.wordCount}</StatVal>
          </div>
          <div>
            <StatTitle>{t('seoAnalysis.stats.headingCount')}</StatTitle>
            <StatVal>{stats.headingCount}</StatVal>
          </div>
          <div>
            <StatTitle>{t('seoAnalysis.stats.linkCount')}</StatTitle>
            <StatVal>{stats.linkCount}</StatVal>
          </div>
          <div>
            <StatTitle>
              {t('seoAnalysis.stats.imagesWithoutDescription')}
            </StatTitle>
            <StatVal>{stats.imagesWithoutDescription}</StatVal>
          </div>
        </Stats>
      </CardContent>
    </Card>
  );
}

import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { Form, Panel } from 'rsuite';

import { SeoContentStats } from '../blocks/blocksToPlaintext';

const Stats = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  margin: 12px 0;
`;

const StatTitle = styled.dt`
  font-size: 12px;
  color: var(--rs-text-secondary, #8e8e93);
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
    <Panel
      bordered
      header={t('seoAnalysis.title')}
    >
      <Form.Text>{t('seoAnalysis.description')}</Form.Text>

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
          <StatVal>
            {stats.imagesWithoutDescription}/{stats.imageCount}
          </StatVal>
        </div>
      </Stats>
    </Panel>
  );
}

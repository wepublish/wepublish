import styled from '@emotion/styled';
import {
  AnalyzeSeoContentQuery,
  getApiClientV2,
  SeoFindingSeverity,
  SeoMetadataContentType,
  useAnalyzeSeoContentLazyQuery,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdInsights } from 'react-icons/md';
import { Button, ButtonToolbar, Form, Loader, Message, Panel } from 'rsuite';

import { SeoContentStats } from '../blocks/blocksToPlaintext';

type SeoFindings = AnalyzeSeoContentQuery['analyzeSeoContent']['findings'];

const SEVERITY_ORDER = [
  SeoFindingSeverity.High,
  SeoFindingSeverity.Medium,
  SeoFindingSeverity.Low,
];

const MESSAGE_TYPE: Record<SeoFindingSeverity, 'error' | 'warning' | 'info'> = {
  [SeoFindingSeverity.High]: 'error',
  [SeoFindingSeverity.Medium]: 'warning',
  [SeoFindingSeverity.Low]: 'info',
};

export const sortSeoFindings = (findings: SeoFindings) =>
  [...findings].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );

const Stats = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  margin: 12px 0;

  dt {
    font-size: 12px;
    color: var(--rs-text-secondary, #8e8e93);
  }

  dd {
    margin: 0;
    font-weight: 600;
  }
`;

const Findings = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 12px;
`;

const Suggestion = styled.p`
  margin-top: 4px;
  font-style: italic;
`;

export interface SeoAnalysisProps {
  readonly type: SeoMetadataContentType;
  readonly context: {
    readonly title?: string | null;
    readonly lead?: string | null;
    readonly body?: string | null;
  };
  readonly metadata: {
    readonly seoTitle?: string | null;
    readonly seoDescription?: string | null;
    readonly socialMediaTitle?: string | null;
    readonly socialMediaDescription?: string | null;
    readonly slug?: string | null;
  };
  readonly stats?: SeoContentStats;
  readonly hasShareImage: boolean;
  readonly disabled?: boolean;
}

export function SeoAnalysis({
  type,
  context,
  metadata,
  stats,
  hasShareImage,
  disabled,
}: SeoAnalysisProps) {
  const { t, i18n } = useTranslation();
  const [analysis, setAnalysis] = useState<
    AnalyzeSeoContentQuery['analyzeSeoContent'] | null
  >(null);

  const [analyze, { loading, error }] = useAnalyzeSeoContentLazyQuery({
    fetchPolicy: 'no-cache',
    client: getApiClientV2(),
  });

  const hasContent = [context.title, context.body].some(text => text?.trim());

  const onAnalyze = async () => {
    const result = await analyze({
      variables: {
        input: {
          type,
          title: context.title,
          lead: context.lead,
          body: context.body,
          seoTitle: metadata.seoTitle,
          seoDescription: metadata.seoDescription,
          socialMediaTitle: metadata.socialMediaTitle,
          socialMediaDescription: metadata.socialMediaDescription,
          slug: metadata.slug,
          locale: i18n.language,
          stats: {
            wordCount: stats?.wordCount ?? 0,
            headingCount: stats?.headingCount ?? 0,
            linkCount: stats?.linkCount ?? 0,
            imageCount: stats?.imageCount ?? 0,
            imagesWithoutDescription: stats?.imagesWithoutDescription ?? 0,
            hasShareImage,
          },
        },
      },
    });

    if (!result.error && result.data) {
      setAnalysis(result.data.analyzeSeoContent);
    }
  };

  return (
    <Panel
      bordered
      header={t('seoAnalysis.title')}
    >
      <Form.Text>{t('seoAnalysis.description')}</Form.Text>

      {stats && (
        <Stats>
          <div>
            <dt>{t('seoAnalysis.stats.wordCount')}</dt>
            <dd>{stats.wordCount}</dd>
          </div>
          <div>
            <dt>{t('seoAnalysis.stats.headingCount')}</dt>
            <dd>{stats.headingCount}</dd>
          </div>
          <div>
            <dt>{t('seoAnalysis.stats.linkCount')}</dt>
            <dd>{stats.linkCount}</dd>
          </div>
          <div>
            <dt>{t('seoAnalysis.stats.imagesWithoutDescription')}</dt>
            <dd>
              {stats.imagesWithoutDescription}/{stats.imageCount}
            </dd>
          </div>
        </Stats>
      )}

      <ButtonToolbar>
        <Button
          startIcon={loading ? <Loader size="xs" /> : <MdInsights />}
          disabled={disabled || loading || !hasContent}
          onClick={onAnalyze}
        >
          {analysis ? t('seoAnalysis.reanalyze') : t('seoAnalysis.analyze')}
        </Button>
      </ButtonToolbar>

      {!hasContent && (
        <Form.Text>{t('seoAnalysis.notEnoughContent')}</Form.Text>
      )}

      {error && (
        <Message
          showIcon
          type="error"
        >
          {error.message}
        </Message>
      )}

      {analysis && (
        <Findings>
          <p>{analysis.summary}</p>

          {!analysis.findings.length && (
            <Message
              showIcon
              type="success"
            >
              {t('seoAnalysis.noFindings')}
            </Message>
          )}

          {sortSeoFindings(analysis.findings).map((finding, index) => (
            <Message
              key={index}
              showIcon
              type={MESSAGE_TYPE[finding.severity]}
              header={`${t(`seoAnalysis.severity.${finding.severity}`)} · ${t(
                `seoAnalysis.category.${finding.category}`
              )}`}
              data-testid="seo-finding"
            >
              {finding.message}
              {finding.suggestion && (
                <Suggestion>{finding.suggestion}</Suggestion>
              )}
            </Message>
          ))}

          <Form.Text>{t('seoAnalysis.disclaimer')}</Form.Text>
        </Findings>
      )}
    </Panel>
  );
}

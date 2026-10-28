import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { FullImageFragment, SeoCheckStatus } from '@wepublish/editor/api';
import { Trans, useTranslation } from 'react-i18next';
import { MdCheck, MdInfoOutline, MdWarning } from 'react-icons/md';

import { SeoContentStats } from './seoBlockContext';
import { GOOGLE_DESCRIPTION_LIMIT, GOOGLE_TITLE_LIMIT } from './seoPreviews';

const MIN_WORDS_FOR_HEADINGS = 300;
const MIN_SHARE_IMAGE_WIDTH = 1200;
const SLUG_LIMIT = 100;

interface SeoDocumentCheckValues {
  count?: number;
  limit?: number;
}

// item ids of the writing guides in the SEO checklist (/settings/seo)
export type SeoGuide = 'seo-titles' | 'meta-descriptions';

export const getSeoGuideUrl = (guide: SeoGuide) => `/settings/seo#${guide}`;

export function SeoGuideHelpText({
  i18nKey,
  guide,
}: {
  i18nKey: string;
  guide: SeoGuide;
}) {
  return (
    <Trans i18nKey={i18nKey}>
      text{' '}
      <a
        href={getSeoGuideUrl(guide)}
        target="_blank"
        rel="noreferrer"
      >
        more text
      </a>
    </Trans>
  );
}

export type SeoDocumentCheck =
  | { id: string; status: SeoCheckStatus.Ok }
  | ({
      id: string;
      status: Exclude<SeoCheckStatus, SeoCheckStatus.Ok>;
      reason: string;
    } & SeoDocumentCheckValues);

export interface SeoDocumentChecklistProps {
  metadata: {
    seoTitle?: string | null;
    seoDescription?: string | null;
    slug?: string | null;
  };
  stats?: SeoContentStats;
  shareImage?: Pick<FullImageFragment, 'width'> | null;
}

const ok = (id: string): SeoDocumentCheck => ({
  id,
  status: SeoCheckStatus.Ok,
});

const warning = (
  id: string,
  reason: string,
  values?: SeoDocumentCheckValues
): SeoDocumentCheck => ({
  id,
  status: SeoCheckStatus.Warning,
  reason,
  ...values,
});

const info = (id: string, reason: string): SeoDocumentCheck => ({
  id,
  status: SeoCheckStatus.Info,
  reason,
});

const checkText = (
  id: string,
  value: string | null | undefined,
  limit: number
) => {
  if (!value?.trim()) {
    return warning(id, 'missing');
  }

  return value.length > limit ? warning(id, 'tooLong', { limit }) : ok(id);
};

export const getSeoDocumentChecks = ({
  metadata,
  stats,
  shareImage,
}: SeoDocumentChecklistProps): SeoDocumentCheck[] => [
  checkText('seo-titles', metadata.seoTitle, GOOGLE_TITLE_LIMIT),
  checkText(
    'meta-descriptions',
    metadata.seoDescription,
    GOOGLE_DESCRIPTION_LIMIT
  ),
  !stats || stats.wordCount < MIN_WORDS_FOR_HEADINGS ?
    info('structure', 'short')
  : stats.headingCount ? ok('structure')
  : warning('structure', 'missing'),

  !stats ? info('internal-links', 'unknown')
  : stats.linkCount ? ok('internal-links')
  : warning('internal-links', 'missing'),

  checkText('stable-slugs', metadata.slug, SLUG_LIMIT),

  !shareImage ? warning('share-images', 'missing')
  : shareImage.width < MIN_SHARE_IMAGE_WIDTH ?
    warning('share-images', 'tooSmall', { limit: MIN_SHARE_IMAGE_WIDTH })
  : ok('share-images'),

  stats?.imagesWithoutDescription ?
    warning('image-descriptions', 'missing', {
      count: stats.imagesWithoutDescription,
    })
  : ok('image-descriptions'),
];

const Items = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
`;

const Item = styled.li`
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 8px;
  align-items: start;
`;

const ItemTitle = styled.div`
  font-weight: 600;
`;

const StatusIcon = ({ status }: { status: SeoCheckStatus }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const label = t(`seoChecklist.status.${status}`);

  switch (status) {
    case SeoCheckStatus.Ok:
      return (
        <MdCheck
          size={24}
          aria-label={label}
          color={theme.vars.palette.success.main}
        />
      );
    case SeoCheckStatus.Warning:
      return (
        <MdWarning
          size={24}
          aria-label={label}
          color={theme.vars.palette.warning.main}
        />
      );
    default:
      return (
        <MdInfoOutline
          size={24}
          aria-label={label}
          color={theme.vars.palette.info.main}
        />
      );
  }
};

export function SeoDocumentChecklist(props: SeoDocumentChecklistProps) {
  const { t } = useTranslation();
  const checks = getSeoDocumentChecks(props);
  const done = checks.filter(
    check => check.status !== SeoCheckStatus.Warning
  ).length;

  return (
    <Card variant="outlined">
      <CardHeader
        title={t('seoDocumentChecklist.title')}
        subheader={t('seoChecklist.progress', { done, total: checks.length })}
      />

      <CardContent>
        <Items>
          {checks.map(check => (
            <Item
              key={check.id}
              data-testid={`seo-document-check-${check.id}`}
            >
              <StatusIcon status={check.status} />

              <div>
                <ItemTitle>
                  {t(`seoChecklist.items.${check.id}.title`)}
                </ItemTitle>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {check.status !== SeoCheckStatus.Ok ?
                    t(
                      `seoDocumentChecklist.reasons.${check.id}.${check.reason}`,
                      {
                        count: check.count,
                        limit: check.limit,
                      }
                    )
                  : t(`seoChecklist.items.${check.id}.description`)}
                </Typography>
              </div>
            </Item>
          ))}
        </Items>
      </CardContent>
    </Card>
  );
}

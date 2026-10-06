import styled from '@emotion/styled';
import { FullImageFragment, SeoCheckStatus } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { MdCheck, MdInfoOutline, MdWarning } from 'react-icons/md';
import { Form, Panel } from 'rsuite';

import { SeoContentStats } from '../blocks/blocksToPlaintext';
import { GOOGLE_DESCRIPTION_LIMIT, GOOGLE_TITLE_LIMIT } from './seoPreviews';
import { SEO_SUGGESTION_LIMITS } from './seoSuggestions';

const MIN_WORDS_FOR_HEADINGS = 300;
const MIN_SHARE_IMAGE_WIDTH = 1200;

export interface SeoDocumentCheck {
  readonly id: string;
  readonly status: SeoCheckStatus;
  readonly reason?: string;
  readonly count?: number;
  readonly limit?: number;
}

export interface SeoDocumentChecklistProps {
  readonly metadata: {
    readonly seoTitle?: string | null;
    readonly seoDescription?: string | null;
    readonly socialMediaTitle?: string | null;
    readonly socialMediaDescription?: string | null;
    readonly slug?: string | null;
  };
  readonly stats?: SeoContentStats;
  readonly shareImage?: Pick<FullImageFragment, 'width'> | null;
}

const ok = (id: string): SeoDocumentCheck => ({
  id,
  status: SeoCheckStatus.Ok,
});

const warning = (
  id: string,
  reason: string,
  values?: Pick<SeoDocumentCheck, 'count' | 'limit'>
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
  checkText('stable-slugs', metadata.slug, SEO_SUGGESTION_LIMITS.slug),
  !shareImage ? warning('share-images', 'missing')
  : shareImage.width < MIN_SHARE_IMAGE_WIDTH ?
    warning('share-images', 'tooSmall', { limit: MIN_SHARE_IMAGE_WIDTH })
  : ok('share-images'),
  !stats?.imageCount ? info('image-descriptions', 'none')
  : stats.imagesWithoutDescription ?
    warning('image-descriptions', 'missing', {
      count: stats.imagesWithoutDescription,
    })
  : ok('image-descriptions'),
  metadata.socialMediaTitle?.trim() || metadata.socialMediaDescription?.trim() ?
    ok('social-texts')
  : info('social-texts', 'missing'),
  info('preview-before-publishing', 'below'),
];

const Items = styled.ul`
  list-style: none;
  margin: 12px 0 0;
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
  const label = t(`seoChecklist.status.${status}`);

  switch (status) {
    case SeoCheckStatus.Ok:
      return (
        <MdCheck
          size={24}
          aria-label={label}
          color="var(--rs-green-500)"
        />
      );
    case SeoCheckStatus.Warning:
      return (
        <MdWarning
          size={24}
          aria-label={label}
          color="var(--rs-orange-500)"
        />
      );
    default:
      return (
        <MdInfoOutline
          size={24}
          aria-label={label}
          color="var(--rs-blue-500)"
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
    <Panel
      bordered
      header={t('seoDocumentChecklist.title')}
    >
      <Form.Text>
        {t('seoChecklist.progress', { done, total: checks.length })}
      </Form.Text>

      <Items>
        {checks.map(check => (
          <Item
            key={check.id}
            data-testid={`seo-document-check-${check.id}`}
          >
            <StatusIcon status={check.status} />

            <div>
              <ItemTitle>{t(`seoChecklist.items.${check.id}.title`)}</ItemTitle>
              <Form.Text>
                {check.reason ?
                  t(
                    `seoDocumentChecklist.reasons.${check.id}.${check.reason}`,
                    {
                      count: check.count,
                      limit: check.limit,
                    }
                  )
                : t(`seoChecklist.items.${check.id}.description`)}
              </Form.Text>
            </div>
          </Item>
        ))}
      </Items>
    </Panel>
  );
}

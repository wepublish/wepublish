import { usePuck } from '@measured/puck';
import type { NewsletterReportFragment } from '@wepublish/editor/api';
import {
  CLIP_LIMIT_BYTES,
  CLIP_WARN_RATIO,
  documentText,
  missingRequiredFooterTags,
} from '@wepublish/newsletter';
import { useTranslation } from 'react-i18next';
import { fromPuckData } from './convert';
import {
  colors,
  Meter,
  Note,
  ReportCount,
  ReportHeading,
  ReportList,
  ReportNote,
  ReportPanel,
  ReportSize,
} from './styles';

/**
 * The left sidebar's check section, in place of Puck's outline: how close the
 * issue is to Gmail's 102 KB clip, and what would stop it being sent. The
 * footer's tags are checked against the live document; the size can only be
 * measured on rendered HTML and describes the last saved state.
 */
export interface ReportState {
  report: NewsletterReportFragment | null;
  /** The document the report was measured on, serialised. */
  measured: string | null;
  error: string;
}

export const EMPTY_REPORT: ReportState = {
  report: null,
  measured: null,
  error: '',
};

type Kind = 'error' | 'warn' | 'info';

interface Item {
  kind: Kind;
  text: string;
}

const RANK: Record<Kind, number> = { error: 0, warn: 1, info: 2 };

const kb = (bytes: number) =>
  `${(bytes / 1024).toLocaleString('de-CH', { maximumFractionDigits: 1 })} KB`;

export function ReportSection({ state }: { state: ReportState }) {
  const { t } = useTranslation();
  const { report, error } = state;
  const { appState } = usePuck();
  const doc = fromPuckData(appState.data);
  const stale = report !== null && JSON.stringify(doc) !== state.measured;

  const missingFooter = new Set(
    missingRequiredFooterTags(documentText(doc)).map(tag => tag.key)
  );

  if (report && !stale) {
    for (const missing of report.missingFooter) {
      missingFooter.add(missing as 'unsubscribe' | 'address');
    }
  }

  const items: Item[] = [...missingFooter].map(key => ({
    kind: 'error',
    text: t('newsletter.report.missingFooter', {
      what: t(`newsletter.report.required.${key}`),
    }),
  }));

  if (report?.missingArticles.length) {
    items.push({
      kind: 'error',
      text: t('newsletter.report.missingArticles', {
        count: report.missingArticles.length,
        ids: report.missingArticles.join(', '),
      }),
    });
  }

  if (report?.missingImages.length) {
    items.push({
      kind: 'error',
      text: t('newsletter.report.missingImages', {
        count: report.missingImages.length,
      }),
    });
  }

  if (error) {
    items.push({
      kind: 'warn',
      text: t('newsletter.report.sizeFailed', { error }),
    });
  } else if (report) {
    const share = report.bytes / CLIP_LIMIT_BYTES;

    items.push(
      share >= 1 ? { kind: 'error', text: t('newsletter.report.clipped') }
      : share >= CLIP_WARN_RATIO ?
        { kind: 'warn', text: t('newsletter.report.nearLimit') }
      : {
          kind: 'info',
          text: t('newsletter.report.headroom', {
            free: kb(CLIP_LIMIT_BYTES - report.bytes),
          }),
        }
    );

    if (stale) {
      items.push({ kind: 'warn', text: t('newsletter.report.stale') });
    }
  }

  items.sort((a, b) => RANK[a.kind] - RANK[b.kind]);

  const errors = items.filter(item => item.kind === 'error').length;
  const warnings = items.filter(item => item.kind === 'warn').length;
  const kind: Kind =
    errors ? 'error'
    : warnings ? 'warn'
    : 'info';
  const percent =
    report ? Math.round((report.bytes / CLIP_LIMIT_BYTES) * 100) : 0;
  const fill =
    kind === 'error' ? colors.error
    : kind === 'warn' ? '#a8741a'
    : colors.accent;

  return (
    <ReportPanel>
      <ReportHeading>
        <h2>{t('newsletter.report.title')}</h2>
        <ReportCount kind={kind}>
          {errors ?
            t('newsletter.report.problems', { count: errors })
          : warnings ?
            t('newsletter.report.hints', { count: warnings })
          : t('newsletter.report.ok')}
        </ReportCount>
      </ReportHeading>

      <Meter stale={stale}>
        <span
          style={{ width: `${Math.min(percent, 100)}%`, background: fill }}
        />
      </Meter>
      <ReportSize>
        {report ?
          t('newsletter.report.size', {
            size: kb(report.bytes),
            limit: kb(CLIP_LIMIT_BYTES),
            percent,
          })
        : t('newsletter.report.measuring')}
      </ReportSize>
      {stale ?
        <Note>{t('newsletter.report.savedState')}</Note>
      : null}

      <ReportList>
        {items.map((item, index) => (
          <ReportNote
            key={index}
            kind={item.kind}
          >
            {item.text}
          </ReportNote>
        ))}
      </ReportList>
    </ReportPanel>
  );
}

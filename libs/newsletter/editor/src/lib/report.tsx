/**
 * The «Prüfung» plugin in the left sidebar: how close the issue is to the 102 KB
 * Gmail clips a mail at, and what would stop it being sent.
 *
 * A Puck plugin rather than a bar along the bottom, because a bar has to be
 * `position: fixed` over a layout Puck sizes to `100dvh`, which means overriding
 * the height of one of its CSS-module classes and feeding it a measured height so
 * an opened panel does not swallow the foot of both sidebars. Here the notes are
 * in normal flow inside a column that already scrolls.
 *
 * The trade is that it is one tab of the sidebar, so this is a section an editor
 * consults rather than a warning that finds them. `publish` is still the
 * backstop for the two failures that must not ship.
 *
 * Two sources of truth on purpose, and the section says which is which:
 *
 * - The **footer's merge tags** are checked against the document Puck is holding,
 *   so deleting `*|UNSUB|*` from the legal notice is reported as it happens.
 * - The **size** can only be measured on rendered HTML, so it comes from
 *   `newsletterCampaignReport` and describes the last *saved* state. It
 *   is marked stale rather than quietly ageing, because a number that is
 *   silently three teasers out of date is the one that gets trusted wrongly.
 */
import { usePuck } from '@puckeditor/core';
import { createContext, useContext } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import type { NewsletterReport } from '@wepublish/newsletter/email';
import {
  CLIP_LIMIT_BYTES,
  CLIP_WARN_RATIO,
  documentText,
} from '@wepublish/newsletter/email';
import {
  describeRequiredTag,
  missingRequiredFooterTags,
} from '@wepublish/newsletter/email';
import { fromPuckData } from './convert';

export interface ReportState {
  report: NewsletterReport | null;
  /**
   * The document the report was measured on, serialised.
   *
   * Compared against the document in the editor rather than against a dirty
   * flag: `save` and `push` both refresh the report, so what matters is whether
   * the issue has moved on since, not which button was pressed last.
   */
  measured: string | null;
  /** Why the last attempt to measure failed, if it did. */
  error: string;
}

export const EMPTY_REPORT: ReportState = {
  report: null,
  measured: null,
  error: '',
};

/**
 * How the editor page hands the state to the panel. A plugin's `render` takes no
 * props, but it renders inside the page's own tree, so a context reaches it.
 */
export const ReportContext = createContext<ReportState>(EMPTY_REPORT);

type Kind = 'error' | 'warn' | 'info';

interface Note {
  kind: Kind;
  text: string;
}

const RANK: Record<Kind, number> = { error: 0, warn: 1, info: 2 };

/** `65 536` → `64 KB`. One decimal, so adding a teaser visibly moves it. */
const kb = (bytes: number) =>
  `${(bytes / 1024).toLocaleString('de-CH', { maximumFractionDigits: 1 })} KB`;

const LIMIT = kb(CLIP_LIMIT_BYTES);

/**
 * What the size *means*, and only that — the figures are on the line above it.
 *
 * Said in terms of what happens to the mail rather than as another percentage,
 * because the point of the note is that an editor at 96 % knows why that is a
 * problem.
 */
function sizeNote(t: TFunction, bytes: number): Note {
  const share = bytes / CLIP_LIMIT_BYTES;

  if (share >= 1) {
    return {
      kind: 'error',
      text: t('newsletter.report.clipped'),
    };
  }

  if (share >= CLIP_WARN_RATIO) {
    return {
      kind: 'warn',
      text: t('newsletter.report.nearLimit'),
    };
  }

  return {
    kind: 'info',
    text: t('newsletter.report.room', { size: kb(CLIP_LIMIT_BYTES - bytes) }),
  };
}

/** Names the ids as well: an id is the only thing that identifies a teaser. */
function articleNote(t: TFunction, missing: string[]): Note {
  return {
    kind: 'error',
    text: t('newsletter.report.missingArticles', {
      count: missing.length,
      ids: missing.join(', '),
    }),
  };
}

/**
 * Everything wrong with the issue, worst first.
 *
 * The document check comes first because it is the current one. The rendered
 * issue can name a tag the document walk cannot see — see `documentText` — so a
 * report for *this* document is allowed to add to the list, never to replace it:
 * a stale report would otherwise keep reporting a footer already fixed.
 */
function collectNotes(
  t: TFunction,
  state: ReportState,
  stale: boolean,
  documentTags: string
): Note[] {
  const { report, error } = state;
  const missingFooter = new Set(
    missingRequiredFooterTags(documentTags).map(describeRequiredTag)
  );

  if (report && !stale) {
    for (const missing of report.missingFooter) {
      missingFooter.add(missing);
    }
  }

  const notes: Note[] = [...missingFooter].map(missing => ({
    kind: 'error',
    text: t('newsletter.report.missingFooter', { missing }),
  }));

  if (report?.missingArticles.length) {
    notes.push(articleNote(t, report.missingArticles));
  }

  if (error) {
    notes.push({
      kind: 'warn',
      text: t('newsletter.report.sizeFailed', { error }),
    });
  } else if (report) {
    notes.push(sizeNote(t, report.bytes));

    if (stale) {
      notes.push({
        kind: 'warn',
        text: t('newsletter.report.unsaved'),
      });
    }
  }

  return notes.sort((a, b) => RANK[a.kind] - RANK[b.kind]);
}

export function ReportSection() {
  const state = useContext(ReportContext);
  const { t } = useTranslation();
  const { report } = state;
  // The live document, from Puck's own state — the same source `Actions` reads,
  // and the only one that is current while the editor is being typed into.
  const { appState } = usePuck();
  // `doc`, not `document`: this runs in the browser, where that name is taken.
  const doc = fromPuckData(appState.data);
  const stale = report !== null && JSON.stringify(doc) !== state.measured;
  const notes = collectNotes(t, state, stale, documentText(doc));

  const errors = notes.filter(note => note.kind === 'error').length;
  const warnings = notes.filter(note => note.kind === 'warn').length;
  const kind: Kind =
    errors ? 'error'
    : warnings ? 'warn'
    : 'info';
  const percent =
    report ? Math.round((report.bytes / CLIP_LIMIT_BYTES) * 100) : 0;

  return (
    <div
      className="report-panel"
      data-kind={kind}
    >
      <div className="report-heading">
        <h2>{t('newsletter.report.heading')}</h2>
        <span className="report-count">
          {errors ?
            t('newsletter.report.problems', { count: errors })
          : warnings ?
            t('newsletter.report.warnings', { count: warnings })
          : t('newsletter.report.ok')}
        </span>
      </div>

      <span
        className="report-meter"
        data-stale={stale || undefined}
      >
        <span
          className="report-meter-fill"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </span>
      <p className="report-size">
        {report ?
          t('newsletter.report.size', {
            size: kb(report.bytes),
            limit: LIMIT,
            percent,
          })
        : t('newsletter.report.measuring')}
      </p>
      {/* Spelled out rather than marked with an asterisk: the number is the one
          thing here an editor acts on, and «82 %» read as current when it is
          three teasers old is the whole failure this section exists to prevent. */}
      {stale ?
        <p className="report-stale">{t('newsletter.report.stale')}</p>
      : null}

      <ul className="report-list">
        {notes.map((note, index) => (
          <li
            key={index}
            className="report-note"
            data-kind={note.kind}
          >
            {note.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

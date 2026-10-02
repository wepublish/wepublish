/**
 * The editor's header: Puck's own, with a way back to the overview in the
 * corner above the sidebar tabs, and the save and transfer actions.
 */
import { usePuck } from '@puckeditor/core';
import type { Data } from '@puckeditor/core';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowBack } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { snapshotOf } from './settings';

/**
 * Puck's `header` override, wrapping the default header. Puck leaves the cell
 * above its tab rail empty — the header's left padding — and the back link
 * fills it; see `.editor-back`.
 */
export function EditorHeader({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="editor-header">
      <Link
        className="editor-back"
        to="/newsletter"
        title={t('newsletter.editor.back')}
        aria-label={t('newsletter.editor.back')}
      >
        <MdArrowBack size={24} />
      </Link>
      {children}
    </div>
  );
}

/**
 * The header's actions: save — which also syncs the issue into its Mailchimp
 * draft — and, once that has worked, a link to the draft.
 *
 * The current document comes from `usePuck`: this renders inside Puck's own
 * header, where the app state is the only source that is current while the
 * editor is typed into. Save stays live on a clean document — a *disabled* save
 * is indistinguishable from a broken one, and saving again re-syncs — and the
 * label carries the state instead.
 *
 * The link is only offered while Mailchimp holds exactly what the editor shows:
 * a draft opened from an issue edited since would show the older text as if it
 * were current. It is a plain link and does not save, so the browser opens it
 * as the click it is rather than as a pop-up after a request.
 */
export function Actions({
  title,
  save,
  saved,
  synced,
  editUrl,
  status,
  failed,
}: {
  title: string;
  save: (data: Data) => Promise<void> | void;
  saved: string | null;
  synced: string | null;
  editUrl: string | null | undefined;
  status: string;
  failed: boolean;
}) {
  const { t } = useTranslation();
  const { appState } = usePuck();
  const [busy, setBusy] = useState(false);

  // Serialising on every render is affordable — a whole issue is a few
  // kilobytes of JSON — and it is the only way to keep the hint honest.
  const current = snapshotOf(title, appState.data);
  const dirty = current !== saved;
  const inSync = synced !== null && synced === current;

  const run = async () => {
    setBusy(true);

    try {
      await save(appState.data);
    } finally {
      setBusy(false);
    }
  };

  // What is running or what just happened wins over the hint: a server
  // rejection has to be readable even though the document is unchanged.
  const hint =
    dirty ? t('newsletter.editor.notSaved')
    : inSync ? t('newsletter.editor.pushed')
    : t('newsletter.editor.notPushed');

  return (
    <>
      <span
        className="editor-state"
        data-kind={
          failed ? 'error'
          : status ?
            'busy'
          : inSync ?
            'clean'
          : 'stale'
        }
        title={status || undefined}
      >
        {status || hint}
      </span>
      <button
        type="button"
        className="editor-save"
        disabled={busy}
        onClick={run}
      >
        {busy ? t('newsletter.editor.saving') : t('newsletter.editor.save')}
      </button>
      {inSync && editUrl && !busy ?
        <a
          className="editor-view"
          href={editUrl}
          target="_blank"
          rel="noreferrer"
        >
          {t('newsletter.editor.openInMailchimp')}
        </a>
      : null}
    </>
  );
}

/**
 * The «Einstellungen» plugin in the left sidebar: what belongs to the issue
 * rather than to one of its blocks — the title and the preview text.
 *
 * The two live in different places. The title is not part of the document — it
 * is a column of its own and never rendered into the mail — so it is held by
 * the editor page next to the document rather than in Puck's data, and reaches
 * this panel through a context the way the report does. The preview text *is*
 * part of the document, Puck's root props, so it is read and written through
 * Puck, which keeps it in undo and in the unsaved-changes check. Both are saved
 * by the same button.
 */
import { usePuck } from '@puckeditor/core';
import type { Data } from '@puckeditor/core';
import { createContext, useContext, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { fromPuckData } from './convert';

export interface SettingsState {
  title: string;
  setTitle: (title: string) => void;
}

export const SettingsContext = createContext<SettingsState>({
  title: '',
  setTitle: () => undefined,
});

/**
 * What the save and push states compare: the title together with the document,
 * so a renamed issue counts as unsaved — and, because the title is the subject
 * of the Mailchimp draft, as not yet pushed. Trimmed as the server trims it.
 */
export const snapshotOf = (title: string, data: Data) =>
  JSON.stringify([title.trim(), fromPuckData(data)]);

export function SettingsSection() {
  const { t } = useTranslation();
  const { title, setTitle } = useContext(SettingsContext);
  const { appState, dispatch } = usePuck();
  const root = appState.data.root;
  const id = useId();

  return (
    <div className="settings-panel">
      <div className="report-heading">
        <h2>{t('newsletter.settings.heading')}</h2>
      </div>

      <label
        className="settings-label"
        htmlFor={id}
      >
        {t('newsletter.settings.title')}
      </label>
      <input
        id={id}
        className="settings-input"
        value={title}
        onChange={event => setTitle(event.target.value)}
      />
      <p className="settings-hint">{t('newsletter.settings.titleHint')}</p>

      <label
        className="settings-label"
        htmlFor={`${id}-preheader`}
      >
        {t('newsletter.blocks.preheader')}
      </label>
      <input
        id={`${id}-preheader`}
        className="settings-input"
        value={String(root.props?.preheader ?? '')}
        onChange={event => {
          // Puck types root props as its own default (`title`) only; ours are
          // `{ preheader }`, as `createConfig` declares them.
          const props: Record<string, unknown> = {
            ...root.props,
            preheader: event.target.value,
          };

          dispatch({ type: 'replaceRoot', root: { ...root, props } });
        }}
      />
    </div>
  );
}

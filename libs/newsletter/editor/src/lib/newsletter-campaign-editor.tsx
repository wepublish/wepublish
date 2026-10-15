/**
 * The editor page: Puck, wired to the newsletter API.
 *
 * Puck owns the document while the page is open; the database owns it between
 * sessions. There is no autosave: a newsletter is written over an hour of small
 * edits and an autosave would turn every one of them into a write, a render and
 * a query and a Mailchimp sync. Saving syncs the issue into its Mailchimp
 * draft as well, so the two never hold different versions.
 */
import { useMutation } from '@apollo/client/react';
import { Puck } from '@puckeditor/core';
import type { Config, Data } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import {
  getApiClientV2,
  NewsletterCampaignDocument,
  NewsletterCampaignQuery,
  NewsletterCampaignQueryVariables,
  NewsletterCampaignReportDocument,
  NewsletterCampaignReportQuery,
  PublishNewsletterCampaignDocument,
  PublishNewsletterCampaignMutation,
  UpdateNewsletterCampaignDocument,
} from '@wepublish/editor/api';
import { articleIdsIn, NewsletterDocument } from '@wepublish/newsletter/email';
import { createCheckedPermissionComponent } from '@wepublish/ui/editor';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { loadArticles, loadArticlesByIds } from './articles';
import { createConfig } from './config';
import { fromPuckData, toPuckData } from './convert';
import { EditorStyles } from './editor-styles';
import { Actions, EditorHeader } from './header';
import { rememberImages } from './images';
import type { ReportState } from './report';
import { EMPTY_REPORT, ReportContext } from './report';
import { SettingsContext, snapshotOf } from './settings';
import { INITIAL_PLUGIN, sidebarPlugins } from './sidebar';

type Campaign = NewsletterCampaignQuery['newsletterCampaign'];
type DraftCampaign =
  PublishNewsletterCampaignMutation['publishNewsletterCampaign']['campaign'];

const time = () => new Date().toLocaleTimeString();

function NewsletterCampaignEditor() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [title, setTitle] = useState('');
  const [data, setData] = useState<Data | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [status, setStatus] = useState(t('newsletter.editor.loading'));
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState<DraftCampaign | null>(null);
  // The issue as the database last saw it, and as Mailchimp last saw it, both as
  // `snapshotOf` — title and document. Comparing serialised documents rather
  // than Puck data is what keeps the header honest: Puck rewrites its own data
  // on selection and drag, none of which changes the issue, so a `data`
  // comparison would report everything as unsaved. `null` for `synced` means
  // not synced in this session.
  const [saved, setSaved] = useState<string | null>(null);
  const [synced, setSynced] = useState<string | null>(null);
  const [reportState, setReportState] = useState<ReportState>(EMPTY_REPORT);
  // Which measurement is the current one. A save while the previous request is
  // still in flight would otherwise let the older answer land last and be
  // labelled with the newer document.
  const measurement = useRef(0);

  const plugins = useMemo(() => sidebarPlugins(t), [t]);

  const settings = useMemo(() => ({ title, setTitle }), [title]);

  const [updateCampaign] = useMutation(UpdateNewsletterCampaignDocument);
  const [publishCampaign] = useMutation(PublishNewsletterCampaignDocument);

  /**
   * Ask the API how big the stored issue renders, and what is wrong with it.
   *
   * It measures what is stored rather than what the editor is holding: the
   * number has to be the real one, and the real one only exists once the HTML
   * has been rendered. Called after the load and after every save rather than
   * while typing, for the same reason there is no autosave.
   */
  const measure = useCallback(
    async (documentJson: string) => {
      const attempt = ++measurement.current;

      try {
        const { data } =
          await getApiClientV2().query<NewsletterCampaignReportQuery>({
            query: NewsletterCampaignReportDocument,
            variables: { id },
          });

        if (measurement.current === attempt) {
          setReportState({
            report: data!.newsletterCampaignReport,
            measured: documentJson,
            error: '',
          });
        }
      } catch (cause) {
        // The previous numbers are kept rather than blanked: a failure to
        // measure once does not make the last measurement wrong.
        if (measurement.current === attempt) {
          setReportState(state => ({
            ...state,
            error: (cause as Error).message,
          }));
        }
      }
    },
    [id]
  );

  useEffect(() => {
    // The articles are awaited *before* the first paint, not alongside it: the
    // canvas reads the cache synchronously, so a teaser that stores only an
    // article id would render as "nicht geladen" for a frame and then correct
    // itself.
    Promise.all([
      getApiClientV2().query<
        NewsletterCampaignQuery,
        NewsletterCampaignQueryVariables
      >({ query: NewsletterCampaignDocument, variables: { id } }),
      loadArticles().catch(() => []),
    ])
      .then(async ([{ data }, articles]) => {
        const loaded = data!.newsletterCampaign;
        const document = loaded.document as NewsletterDocument;

        rememberImages(loaded.images);
        await loadArticlesByIds(articleIdsIn(document)).catch(() => undefined);

        setCampaign(loaded);
        setTitle(loaded.title);
        setConfig(createConfig(articles, t));

        const initial = toPuckData(document);

        setData(initial);
        // The baseline goes through `fromPuckData` like a save would, so the
        // round trip's own normalisation does not make a freshly opened issue
        // look edited.
        setSaved(snapshotOf(loaded.title, initial));
        setStatus('');
        void measure(JSON.stringify(fromPuckData(initial)));
      })
      .catch((cause: Error) => {
        setStatus(cause.message);
        setFailed(true);
      });
  }, [id, measure, t]);

  /**
   * Write the current title and document. Returns the saved snapshot so `save`
   * can chain onto it: publishing renders the *stored* issue, so what Mailchimp
   * receives is whatever this wrote, never what the editor happens to be
   * showing.
   */
  const write = useCallback(
    async (next: Data): Promise<string | null> => {
      const document = fromPuckData(next);

      setStatus(t('newsletter.editor.saving'));
      setFailed(false);

      try {
        const { data: result } = await updateCampaign({
          variables: { id, title, document },
        });
        // The server keeps the old title when given a blank one, so the stored
        // title is the one to show and to compare against.
        const stored = result?.updateNewsletterCampaign.title ?? title;
        const snapshot = snapshotOf(stored, next);

        setTitle(stored);
        setSaved(snapshot);
        setStatus(t('newsletter.editor.savedAt', { time: time() }));
        void measure(JSON.stringify(document));

        return snapshot;
      } catch (cause) {
        // The server validates the document; a rejection names what is wrong.
        setStatus((cause as Error).message);
        setFailed(true);

        return null;
      }
    },
    [id, measure, t, title, updateCampaign]
  );

  /**
   * Save, then render the stored issue into its Mailchimp draft, so the database
   * and Mailchimp never hold two versions of the issue. A clean issue is written
   * again rather than skipped: Save is also how an editor re-syncs.
   *
   * A refused sync — an article gone, a footer tag missing, no Mailchimp set up —
   * leaves the save standing, and the status says the two apart.
   */
  const save = useCallback(
    async (next: Data) => {
      const document = JSON.stringify(fromPuckData(next));
      const snapshot = await write(next);

      if (snapshot === null) {
        return;
      }

      setStatus(t('newsletter.editor.publishing'));
      setFailed(false);
      setDraft(null);

      try {
        const { data } = await publishCampaign({ variables: { id } });
        const result = data?.publishNewsletterCampaign;

        if (!result) {
          return;
        }

        setDraft(result.campaign);
        setSynced(snapshot);
        // The publish measured the HTML it actually uploaded, so it retires any
        // `measure` still in flight, whose answer would be the older one.
        measurement.current += 1;
        setReportState({
          report: result.report,
          measured: document,
          error: '',
        });
        setStatus(
          t(
            result.created ?
              'newsletter.editor.createdAt'
            : 'newsletter.editor.updatedAt',
            { time: time() }
          )
        );
      } catch (cause) {
        setStatus(
          t('newsletter.editor.savedNotSynced', {
            reason: (cause as Error).message,
          })
        );
        setFailed(true);
      }
    },
    [id, publishCampaign, t, write]
  );

  if (!data || !campaign || !config) {
    return (
      <EditorStyles>
        <p
          className="editor-status"
          data-kind={failed ? 'error' : 'info'}
        >
          {status}
        </p>
      </EditorStyles>
    );
  }

  const editUrl = draft?.editUrl ?? campaign.mailchimpEditUrl;

  return (
    <EditorStyles>
      <ReportContext.Provider value={reportState}>
        <SettingsContext.Provider value={settings}>
          <Puck
            config={config}
            data={data}
            onPublish={save}
            headerTitle={title}
            plugins={plugins}
            ui={{ plugin: { current: INITIAL_PLUGIN } }}
            overrides={{
              header: EditorHeader,
              // Puck's own «Publish» button is deliberately not rendered: saving
              // and syncing are one action, and `Actions` carries it.
              headerActions: () => (
                <>
                  <Link
                    className="editor-link"
                    to={`/newsletter/preview/${id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('newsletter.editor.preview')}
                  </Link>
                  <Actions
                    title={title}
                    save={save}
                    saved={saved}
                    synced={synced}
                    editUrl={editUrl}
                    status={status}
                    failed={failed}
                  />
                </>
              ),
            }}
          />
        </SettingsContext.Provider>
      </ReportContext.Provider>
    </EditorStyles>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_NEWSLETTER_CAMPAIGNS',
])(NewsletterCampaignEditor);
export { CheckedPermissionComponent as NewsletterCampaignEditor };

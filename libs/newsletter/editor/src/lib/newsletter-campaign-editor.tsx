/**
 * The editor page: Puck, wired to the newsletter API.
 *
 * Puck owns the document while the page is open; the database owns it between
 * sessions. There is no autosave: a newsletter is written over an hour of small
 * edits and an autosave would turn every one of them into a write, a render and
 * a query. Saving and pushing to Mailchimp are two separate actions.
 */
import { useMutation } from '@apollo/client/react';
import { Puck, usePuck } from '@puckeditor/core';
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
import { MdFactCheck } from 'react-icons/md';
import { Link, useParams } from 'react-router-dom';
import { loadArticles, loadArticlesByIds } from './articles';
import { createConfig } from './config';
import { fromPuckData, toPuckData } from './convert';
import { EditorStyles } from './editor-styles';
import { rememberImages } from './images';
import type { ReportState } from './report';
import { EMPTY_REPORT, ReportContext, ReportSection } from './report';

type Campaign = NewsletterCampaignQuery['newsletterCampaign'];
type DraftCampaign =
  PublishNewsletterCampaignMutation['publishNewsletterCampaign']['campaign'];

const time = () => new Date().toLocaleTimeString();

function NewsletterCampaignEditor() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [status, setStatus] = useState(t('newsletter.editor.loading'));
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState<DraftCampaign | null>(null);
  // The document as the database last saw it, and as Mailchimp last saw it,
  // both as JSON. Comparing serialised documents rather than Puck data is what
  // makes the two buttons honest: Puck rewrites its own data on selection and
  // drag, none of which changes the issue, so a `data` comparison would report
  // everything as unsaved. `null` for `pushed` means not pushed in this session.
  const [saved, setSaved] = useState<string | null>(null);
  const [pushed, setPushed] = useState<string | null>(null);
  const [reportState, setReportState] = useState<ReportState>(EMPTY_REPORT);
  // Which measurement is the current one. A save while the previous request is
  // still in flight would otherwise let the older answer land last and be
  // labelled with the newer document.
  const measurement = useRef(0);

  const plugins = useMemo(
    () => [
      {
        name: 'report',
        label: t('newsletter.report.heading'),
        icon: <MdFactCheck />,
        render: () => <ReportSection />,
      },
    ],
    [t]
  );

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
        setConfig(createConfig(articles, t));

        const initial = toPuckData(document);

        setData(initial);
        // The baseline goes through `fromPuckData` like a save would, so the
        // round trip's own normalisation does not make a freshly opened issue
        // look edited.
        const json = JSON.stringify(fromPuckData(initial));

        setSaved(json);
        setStatus('');
        void measure(json);
      })
      .catch((cause: Error) => {
        setStatus(cause.message);
        setFailed(true);
      });
  }, [id, measure, t]);

  /**
   * Write the current document. Returns the saved JSON so `push` can chain onto
   * it: publishing renders the *stored* issue, so what Mailchimp receives is
   * whatever this wrote, never what the editor happens to be showing.
   */
  const save = useCallback(
    async (next: Data): Promise<string | null> => {
      const document = fromPuckData(next);

      setStatus(t('newsletter.editor.saving'));
      setFailed(false);

      try {
        await updateCampaign({
          variables: { id, title: campaign?.title, document },
        });

        const json = JSON.stringify(document);

        setSaved(json);
        setStatus(t('newsletter.editor.savedAt', { time: time() }));
        void measure(json);

        return json;
      } catch (cause) {
        // The server validates the document; a rejection names what is wrong.
        setStatus((cause as Error).message);
        setFailed(true);

        return null;
      }
    },
    [campaign, id, measure, t, updateCampaign]
  );

  /**
   * Render the stored issue into the Mailchimp draft. Saves first when there are
   * unsaved changes: a transfer that quietly leaves out the last paragraph typed
   * is worse than one extra write.
   */
  const push = useCallback(
    async (next: Data) => {
      const document = JSON.stringify(fromPuckData(next));

      if (document !== saved && (await save(next)) === null) {
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
        setPushed(document);
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
        setStatus((cause as Error).message);
        setFailed(true);
      }
    },
    [id, publishCampaign, save, saved, t]
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
        <Puck
          config={config}
          data={data}
          onPublish={push}
          headerTitle={campaign.title}
          plugins={plugins}
          overrides={{
            // Puck's own «Publish» button is deliberately not rendered: one
            // button cannot carry both actions.
            headerActions: () => (
              <>
                <Link
                  className="editor-link"
                  to="/newsletter"
                >
                  {t('newsletter.editor.back')}
                </Link>
                <Link
                  className="editor-link"
                  to={`/newsletter/preview/${id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('newsletter.editor.preview')}
                </Link>
                {editUrl ?
                  <a
                    className="editor-link"
                    href={editUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('newsletter.editor.openInMailchimp')}
                  </a>
                : null}
                <Actions
                  save={save}
                  push={push}
                  saved={saved}
                  pushed={pushed}
                  status={status}
                  failed={failed}
                />
              </>
            ),
          }}
        />
      </ReportContext.Provider>
    </EditorStyles>
  );
}

/**
 * The header's two actions: save, and push to Mailchimp.
 *
 * The current document comes from `usePuck`: this renders inside Puck's own
 * header, where the app state is the only source that is current while the
 * editor is typed into. Both buttons stay live on a clean document — a
 * *disabled* save is indistinguishable from a broken one — and the label carries
 * the state instead.
 */
function Actions({
  save,
  push,
  saved,
  pushed,
  status,
  failed,
}: {
  save: (data: Data) => Promise<string | null>;
  push: (data: Data) => Promise<void>;
  saved: string | null;
  pushed: string | null;
  status: string;
  failed: boolean;
}) {
  const { t } = useTranslation();
  const { appState } = usePuck();
  const [busy, setBusy] = useState<'save' | 'push' | null>(null);

  // Serialising on every render is affordable — a whole issue is a few
  // kilobytes of JSON — and it is the only way to keep the hint honest.
  const current = JSON.stringify(fromPuckData(appState.data));
  const dirty = current !== saved;
  const stale = pushed === null || pushed !== current;

  const run = async (action: 'save' | 'push') => {
    setBusy(action);

    try {
      await (action === 'save' ? save(appState.data) : push(appState.data));
    } finally {
      setBusy(null);
    }
  };

  // What is running or what just happened wins over the save/push hint: a
  // server rejection has to be readable even though the document is unchanged.
  const hint =
    dirty ? t('newsletter.editor.notSaved')
    : !stale ? t('newsletter.editor.pushed')
    : pushed === null ? t('newsletter.editor.notPushed')
    : t('newsletter.editor.changesNotPushed');

  return (
    <>
      <span
        className="editor-state"
        data-kind={
          failed ? 'error'
          : status ?
            'busy'
          : stale ?
            'stale'
          : 'clean'
        }
        title={status || undefined}
      >
        {status || hint}
      </span>
      <button
        type="button"
        className="editor-save"
        disabled={busy !== null}
        onClick={() => run('save')}
      >
        {busy === 'save' ?
          t('newsletter.editor.saving')
        : t('newsletter.editor.save')}
      </button>
      <button
        type="button"
        className="editor-publish"
        disabled={busy !== null}
        onClick={() => run('push')}
      >
        {busy === 'push' ?
          t('newsletter.editor.publishingShort')
        : t('newsletter.editor.publish')}
      </button>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_NEWSLETTER_CAMPAIGNS',
])(NewsletterCampaignEditor);
export { CheckedPermissionComponent as NewsletterCampaignEditor };

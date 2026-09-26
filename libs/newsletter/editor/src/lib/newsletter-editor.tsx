import { useApolloClient } from '@apollo/client';
import { Global, css } from '@emotion/react';
import { Puck, usePuck } from '@measured/puck';
import type { Config, Data } from '@measured/puck';
import '@measured/puck/puck.css';
import {
  NewsletterArticleFragment,
  NewsletterArticlesDocument,
  NewsletterArticlesQuery,
  NewsletterDocument as NewsletterQueryDocument,
  NewsletterPreviewDocument,
  NewsletterPreviewQuery,
  NewsletterQuery,
  usePublishNewsletterToMailchimpMutation,
  useUpdateNewsletterMutation,
} from '@wepublish/editor/api';
import type { NewsletterDocument } from '@wepublish/newsletter';
import { theme } from '@wepublish/newsletter';
import { createCheckedPermissionComponent } from '@wepublish/ui/editor';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Drawer, Message, toaster } from 'rsuite';
import { rememberArticles, sortNewestFirst } from './articles';
import { fromPuckData, toPuckData } from './convert';
import { rememberImages } from './images';
import { resetMergeTags } from './merge-tags';
import { createConfig } from './puck-config';
import { EMPTY_REPORT, ReportSection } from './report-section';
import type { ReportState } from './report-section';
import { HeaderButton, HeaderLink, HeaderState, colors } from './styles';

/**
 * The block editor. Puck owns the document while the tab is open, the API
 * owns it between sessions. There is no autosave: saving and pushing to
 * Mailchimp are two explicit actions.
 */

const PICKER_DAYS = 90;

// Puck lays itself out against the viewport and offers no slot left of its
// header, so the back link is positioned over it; the wrapper has to claim the
// header's grid area or auto-placement drops the header into the canvas row.
// Puck's own «Outline» heading is hidden because the check section draws its
// own; the canvas gets the mail's cream backdrop so the 660px column shows.
const puckStyles = css`
  .newsletter-editor {
    height: 100vh;
  }

  .newsletter-editor-header {
    position: relative;
    grid-area: header;
  }

  .newsletter-editor-backlink {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 84px;
    z-index: 1;
    display: flex;
    align-items: center;
  }

  .newsletter-editor
    [class*='SidebarSection_']:has(.newsletter-report)
    [class*='SidebarSection-title'] {
    display: none;
  }

  .newsletter-editor iframe[title='Puck'] {
    background: ${theme.color.page};
  }
`;

const BackLink = HeaderLink.withComponent(Link);

type Campaign = { id: string; webId: number; title: string; editUrl: string };

function toChoices(articles: NewsletterArticleFragment[]) {
  return sortNewestFirst(
    articles.map(article => ({
      id: article.id,
      title: article.title,
      preTitle: article.preTitle ?? null,
      lead: article.lead ?? null,
      url: article.url,
      imageUrl: article.imageUrl ?? null,
      publishedAt: article.publishedAt ?? null,
      tags: article.tags,
    }))
  );
}

function NewsletterEditorPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const client = useApolloClient();
  const [title, setTitle] = useState('');
  const [data, setData] = useState<Data | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [status, setStatus] = useState('');
  const [failed, setFailed] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  // The document as the API last saw it and as Mailchimp last saw it, as
  // JSON. Puck rewrites its own data on selection and drag, so comparing
  // serialised documents is what keeps the two buttons honest.
  const [saved, setSaved] = useState<string | null>(null);
  const [pushed, setPushed] = useState<string | null>(null);
  const [reportState, setReportState] = useState<ReportState>(EMPTY_REPORT);
  const measurement = useRef(0);
  const [updateNewsletter] = useUpdateNewsletterMutation();
  const [publishNewsletter] = usePublishNewsletterToMailchimpMutation();

  /**
   * Measures what is stored, not what the editor holds: the size only exists
   * once the HTML has been rendered. Called after the load and after every
   * save rather than while typing.
   */
  const measure = useCallback(
    async (documentJson: string) => {
      const attempt = ++measurement.current;

      try {
        const { data: result } = await client.query<NewsletterPreviewQuery>({
          query: NewsletterPreviewDocument,
          variables: { id },
          fetchPolicy: 'network-only',
        });

        if (measurement.current === attempt) {
          setReportState({
            report: result.newsletterPreview.report,
            measured: documentJson,
            error: '',
          });
          setPreview(result.newsletterPreview.html);
        }
      } catch (cause) {
        if (measurement.current === attempt) {
          setReportState(state => ({
            ...state,
            error: (cause as Error).message,
          }));
        }
      }
    },
    [client, id]
  );

  useEffect(() => {
    let live = true;

    resetMergeTags();

    // The article list is awaited before the first paint: the canvas reads
    // the cache synchronously, so a teaser would otherwise flash as missing.
    Promise.all([
      client.query<NewsletterQuery>({
        query: NewsletterQueryDocument,
        variables: { id },
        fetchPolicy: 'network-only',
      }),
      client
        .query<NewsletterArticlesQuery>({
          query: NewsletterArticlesDocument,
          variables: { days: PICKER_DAYS },
          fetchPolicy: 'network-only',
        })
        .then(result => result.data.newsletterArticles)
        .catch(() => [] as NewsletterArticleFragment[]),
    ])
      .then(([{ data: result }, recent]) => {
        if (!live) {
          return;
        }

        const newsletter = result.newsletter;
        const choices = toChoices(recent);

        // Teased articles outside the picker window still have to draw.
        rememberArticles(toChoices(newsletter.teaserArticles));
        rememberArticles(choices);
        rememberImages(newsletter.images);

        setTitle(newsletter.title);
        setConfig(createConfig(choices, t));

        const initial = toPuckData(newsletter.document as NewsletterDocument);
        const json = JSON.stringify(fromPuckData(initial));

        setData(initial);
        setSaved(json);
        setStatus('');
        void measure(json);
      })
      .catch((cause: Error) => {
        if (live) {
          setStatus(cause.message);
          setFailed(true);
        }
      });

    return () => {
      live = false;
    };
  }, [client, id, measure, t]);

  const save = useCallback(
    async (next: Data): Promise<string | null> => {
      const document = fromPuckData(next);

      setStatus(t('newsletter.editor.saving'));
      setFailed(false);

      try {
        await updateNewsletter({ variables: { input: { id, document } } });

        const json = JSON.stringify(document);

        setSaved(json);
        setStatus(
          t('newsletter.editor.savedAt', {
            time: new Date().toLocaleTimeString('de-CH'),
          })
        );
        void measure(json);

        return json;
      } catch (cause) {
        setStatus((cause as Error).message);
        setFailed(true);

        return null;
      }
    },
    [id, measure, t, updateNewsletter]
  );

  /** Saves first when the editor has unsaved changes rather than pushing stale text. */
  const push = useCallback(
    async (next: Data) => {
      const document = JSON.stringify(fromPuckData(next));

      if (document !== saved && (await save(next)) === null) {
        return;
      }

      setStatus(t('newsletter.editor.publishing'));
      setFailed(false);
      setCampaign(null);

      try {
        const { data: result } = await publishNewsletter({ variables: { id } });
        const published = result?.publishNewsletterToMailchimp;

        if (!published) {
          throw new Error(t('newsletter.editor.publishFailed'));
        }

        setCampaign(published.campaign);
        setPushed(document);
        measurement.current += 1;
        setReportState({
          report: published.report,
          measured: document,
          error: '',
        });
        setStatus(
          t(
            published.created ?
              'newsletter.editor.campaignCreated'
            : 'newsletter.editor.campaignUpdated',
            { time: new Date().toLocaleTimeString('de-CH') }
          )
        );
        toaster.push(
          <Message
            type="success"
            showIcon
            closable
            duration={4000}
          >
            {t(
              published.created ?
                'newsletter.editor.campaignCreated'
              : 'newsletter.editor.campaignUpdated',
              { time: new Date().toLocaleTimeString('de-CH') }
            )}
          </Message>
        );
      } catch (cause) {
        setStatus((cause as Error).message);
        setFailed(true);
      }
    },
    [id, publishNewsletter, save, saved, t]
  );

  if (!data || !config) {
    return (
      <div style={{ padding: 24, color: failed ? colors.error : colors.muted }}>
        {status || t('newsletter.editor.loading')}
      </div>
    );
  }

  return (
    <div className="newsletter-editor">
      <Global styles={puckStyles} />
      <Puck
        config={config}
        data={data}
        onPublish={push}
        headerTitle={title}
        overrides={{
          header: ({ children }) => (
            <div className="newsletter-editor-header">
              <BackLink
                to="/newsletters"
                className="newsletter-editor-backlink"
              >
                ← {t('newsletter.editor.backToList')}
              </BackLink>
              {children}
            </div>
          ),
          // Puck's own English "Publish" button is deliberately not rendered.
          headerActions: () => (
            <>
              <HeaderLink
                as="button"
                type="button"
                style={{ background: 'none', border: 0, cursor: 'pointer' }}
                onClick={() => setPreviewOpen(true)}
              >
                {t('newsletter.editor.preview')}
              </HeaderLink>
              {campaign ?
                <HeaderLink
                  href={campaign.editUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('newsletter.editor.openInMailchimp')}
                </HeaderLink>
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
          outline: () => (
            <div className="newsletter-report">
              <ReportSection state={reportState} />
            </div>
          ),
        }}
      />
      <Drawer
        open={previewOpen}
        size="lg"
        onClose={() => setPreviewOpen(false)}
      >
        <Drawer.Header>
          <Drawer.Title>{t('newsletter.editor.preview')}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body style={{ padding: 0 }}>
          {preview ?
            <iframe
              title={t('newsletter.editor.preview')}
              srcDoc={preview}
              style={{ width: '100%', height: '100%', border: 0 }}
            />
          : <div style={{ padding: 24, color: colors.muted }}>
              {t('newsletter.report.measuring')}
            </div>
          }
        </Drawer.Body>
      </Drawer>
    </div>
  );
}

/**
 * Save, and transfer to Mailchimp. Both stay enabled on a clean document: a
 * disabled save is indistinguishable from a broken one, so the label carries
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

  const hint =
    dirty ? t('newsletter.editor.unsaved')
    : !stale ? t('newsletter.editor.pushed')
    : pushed === null ? t('newsletter.editor.notPushed')
    : t('newsletter.editor.changesNotPushed');

  return (
    <>
      <HeaderState
        kind={
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
      </HeaderState>
      <HeaderButton
        type="button"
        disabled={busy !== null}
        onClick={() => run('save')}
      >
        {busy === 'save' ? t('newsletter.editor.saving') : t('save')}
      </HeaderButton>
      <HeaderButton
        type="button"
        primary
        disabled={busy !== null}
        onClick={() => run('push')}
      >
        {busy === 'push' ?
          t('newsletter.editor.publishing')
        : t('newsletter.editor.publish')}
      </HeaderButton>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_NEWSLETTER',
  'CAN_UPDATE_NEWSLETTER',
])(NewsletterEditorPage);
export { CheckedPermissionComponent as NewsletterEditor };

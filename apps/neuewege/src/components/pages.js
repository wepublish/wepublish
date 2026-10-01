// Route views of the live site, ported from its bundle (functions Mf, Yf,
// Xf, ad, sd, cd, hd, md, vd, bd, Fs).
import Head from 'next/head';
import Router, { useRouter } from 'next/router';
import React from 'react';

import * as S from '../lib/styles';
import { useAppContext } from './AppContext';
import { Footer, FrontPopup, Header, Nav } from './header';
import { Headroom, HeadroomProvider } from './layout';
import { Overview } from './Overview';
import { Agenda, Paragraphs } from './paragraphs';
import { DateComponent, IconButton, ShallowLink } from './primitives';
import { ArticleTeaser, Tag, Tags } from './teasers';

const SITE_URL = 'https://www.neuewege.ch';
const SITE_TITLE = 'Aktuelle Artikel';

// bundle function `Mf`
function AuthorBio({ firstname, lastname, bio, mail, links }) {
  return (
    <div className={S.authorBio.root}>
      <div>
        {`${firstname} ${lastname}`}
        {bio && (
          <>
            {', '}
            <span dangerouslySetInnerHTML={{ __html: bio.processed }} />
          </>
        )}
      </div>
      {mail && (
        <div className={S.authorBio.link}>
          <a href={`mailto:${mail}`}>{mail}</a>
        </div>
      )}
      {links &&
        links.map((link, index) => (
          <div
            className={S.authorBio.link}
            key={index}
          >
            <a
              href={link.uri}
              target="_blank"
            >
              {link.title}
            </a>
          </div>
        ))}
    </div>
  );
}

// bundle function `Yf`: previous/next article within the loaded list
function Pager({ list, path, onClick }) {
  const n = list.length;
  const index = list.indexOf(path);
  const prev = list[(index + n - 1) % n];
  const next = list[(index + 1) % n];

  return (
    <div className={S.pager.root}>
      <div className={S.pager.nav}>
        {prev && (
          <ShallowLink
            query={{ slug: prev }}
            onClick={event => onClick?.(event)}
          >
            <IconButton type="prev" />
          </ShallowLink>
        )}
      </div>
      <div className={S.pager.nav}>
        {next && (
          <ShallowLink
            query={{ slug: next }}
            onClick={event => onClick?.(event)}
          >
            <IconButton type="next" />
          </ShallowLink>
        )}
      </div>
    </div>
  );
}

// bundle function `Xf`
function SocialMedia({ path, title }) {
  const subject = `neuewege.ch – ${title}`;
  const url = `http://www.neuewege.ch${path}`;
  const body = `${title} → ${url}`;

  return (
    <div className={S.socialMedia.SocialMedia}>
      <ul className={S.socialMedia.links}>
        <li className={S.socialMedia.link}>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURI(url)}&t=${encodeURI(subject)}`}
            target="_blank"
          >
            Facebook
          </a>
        </li>
        <li className={S.socialMedia.link}>
          <a
            href={`https://twitter.com/share?text=${encodeURI(title)}&url=${encodeURI(url)}`}
            target="_blank"
          >
            Twitter
          </a>
        </li>
        <li className={S.socialMedia.link}>
          <a
            href={`mailto:?subject=${encodeURI(subject)}&body=${encodeURI(body)}`}
            target="_blank"
          >
            Mail
          </a>
        </li>
      </ul>
    </div>
  );
}

// bundle function `ad`
function ArticleView({
  title,
  publication,
  date,
  paragraphs,
  lead,
  pageType,
  authors,
  relatedArticles,
  socialMediaImage,
}) {
  const image = socialMediaImage?.entity?.fieldMediaFile?.entity?.url;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta
          property="og:title"
          content={title}
          key="facebook-title"
        />
        <meta
          property="og:description"
          content={lead}
          key="facebook-description"
        />
        {image && (
          <meta
            property="og:image"
            content={image}
            key="facebook-image"
          />
        )}
        {image && (
          <meta
            name="twitter:image"
            content={image}
            key="twitter-image"
          />
        )}
      </Head>
      <div className={S.article.root}>
        <div className={S.article.article}>
          <div className={S.article.articleInner}>
            <h1 className={S.article.title}>{title}</h1>
            <div className={S.article.info}>
              {authors &&
                authors.map(({ author, entity }) => (
                  <span key={entity.uuid}>
                    {`${author.firstname} ${author.lastname}, `}
                  </span>
                ))}
              {date && <DateComponent {...date} />}
              <br />
              {publication && <>{publication}</>}
            </div>
            {lead && <h2 className={S.article.lead}>{lead}</h2>}
            <Paragraphs
              paragraphs={paragraphs}
              pageType={pageType}
            />
            {authors && (
              <ul className={S.article.authorsBio}>
                {authors.map(entry => (
                  <li key={entry.entity.uuid}>
                    <AuthorBio {...entry.author} />
                  </li>
                ))}
              </ul>
            )}
            {relatedArticles && (
              <div className={S.article.relatedArticles}>
                <div className={S.article.relatedArticlesTitle}>
                  Weitere Artikel
                </div>
                <div className={S.article.relatedArticlesItems}>
                  {relatedArticles.map(related => (
                    <div
                      className={S.article.relatedArticlesItem}
                      key={related.uuid}
                    >
                      <ArticleTeaser
                        style="related"
                        {...related}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// bundle classes `sd`/`cd`: an article also fills the header submenu (pager,
// tags, close) and the footer submenu (share links)
class ArticleRoute extends React.Component {
  componentDidMount() {
    const { context, tags, url, title } = this.props;

    if (context.header.submenu.url === this.props.url) {
      return;
    }

    context.action.header.setSubMenu(
      this.props.url,
      <Nav
        left={
          context.pager.list.length > 1 ?
            <Pager
              list={context.pager.list}
              path={url.path}
              onClick={() => context.action.header.setSubMenu('', null, null)}
            />
          : null
        }
        center={
          <div className={S.articleTags.tags}>
            <Tags>
              {tags.map(tag => (
                <Tag
                  key={tag.entity.label}
                  query={{ slug: '/', search: tag.entity.label }}
                  label={tag.entity.label}
                  onClick={() =>
                    context.action.header.setOpen({
                      search: true,
                      menu: false,
                      submenu: null,
                    })
                  }
                />
              ))}
            </Tags>
          </div>
        }
        right={
          <ShallowLink
            query={{ slug: '/' }}
            onClick={() =>
              context.action.header.setOpen({
                search: !!Router.query.search,
                menu: false,
                submenu: null,
              })
            }
          >
            <IconButton type="close" />
          </ShallowLink>
        }
      />,
      <SocialMedia
        path={url.path}
        title={title}
      />
    );
  }

  render() {
    return <ArticleView {...this.props} />;
  }
}

function Article(props) {
  const context = useAppContext();

  return (
    <ArticleRoute
      context={context}
      {...props}
    />
  );
}

// bundle function `hd`
function PageView({ pageType, title, paragraphs, children }) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className={S.page.root}>
        <div className={S.page.page}>
          <Paragraphs
            paragraphs={paragraphs}
            pageType={pageType}
          />
          {children && children}
        </div>
      </div>
    </>
  );
}

// bundle classes `md`/`vd`: a page puts its title into the header submenu
class PageRoute extends React.Component {
  componentDidMount() {
    const { context, title } = this.props;

    if (context.header.submenu.url === this.props.url) {
      return;
    }

    context.action.header.setSubMenu(
      this.props.url,
      <Nav
        center={<div className={S.page.title}>{title}</div>}
        right={
          <ShallowLink query={{ slug: '/' }}>
            <IconButton type="close" />
          </ShallowLink>
        }
      />,
      null
    );
  }

  render() {
    return <PageView {...this.props} />;
  }
}

function Page(props) {
  const context = useAppContext();

  return (
    <PageRoute
      context={context}
      {...props}
    />
  );
}

// bundle function `bd`
export function RouteResolver({ queryString, url, loading, data }) {
  if (loading) {
    return <div className="loading">{null}</div>;
  }

  const entity = data && data.route && data.route.entity;
  let content;

  switch (entity && entity.__typename) {
    case 'NodeArticle':
      content = (
        <Article
          url={url}
          query={queryString}
          {...entity}
        />
      );
      break;
    case 'NodePage':
      content = (
        <Page
          url={url}
          query={queryString}
          {...entity}
        />
      );
      break;
    case 'NodeEvent':
      content = (
        <Page
          title="Agenda"
          paragraphs={[]}
        >
          <Agenda singleEvent={entity} />
        </Page>
      );
      break;
    default:
      console.log('404 typename', entity && entity.__typename);
      content = <span>404 – Seite wurde nicht gefunden</span>;
  }

  return <div className="done">{content}</div>;
}

// bundle function `Fs`
export function SiteLayout({ overlay }) {
  const { search } = useRouter().query;

  return (
    <>
      <Head>
        <title>{SITE_TITLE}</title>
        <link
          rel="icon"
          type="image/x-icon"
          href="/static/favicon.ico?v=1"
        />
        <meta
          property="og:type"
          content="website"
          key="facebook-type"
        />
        <meta
          property="og:title"
          content={SITE_TITLE}
          key="facebook-title"
        />
        <meta
          property="og:description"
          content="Die Zeitschrift Neue Wege begleitet und analysiert weltweit die Sehnsucht nach und die Arbeit für Frieden, Gerechtigkeit und eine Wirtschaft, die den Menschen dient und die Lebensgrundlagen nicht zerstört."
          key="facebook-description"
        />
        <meta
          property="og:image"
          content={`${SITE_URL}/static/social/180424_Neuewege_Facebook_Bild.jpg`}
          key="facebook-image"
        />
        <meta
          name="twitter:site"
          content="@neue_wege"
          key="twitter-site"
        />
        <meta
          name="twitter:image"
          content={`${SITE_URL}/static/social/180424_Neuewege_Twitter-Bild.jpg`}
          key="twitter-image"
        />
        <meta
          name="twitter:card"
          content="summary"
          key="twitter-card"
        />
      </Head>
      <div
        className={S.layout.root}
        data-now="Update: $NOW"
        data-git="GIT: $GIT-HASH $GIT-DATE"
      >
        <HeadroomProvider>
          <Headroom
            top={
              <>
                <Header />
                <FrontPopup key="front-popup" />
              </>
            }
            main={
              <div className={S.layout.inner}>
                <Overview queryString={search || ''} />
              </div>
            }
            bottom={<Footer />}
            overlay={overlay}
          />
        </HeadroomProvider>
      </div>
    </>
  );
}

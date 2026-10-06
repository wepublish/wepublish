// Header, menu, search, popups and footer bar of the live site, ported from
// its bundle (functions Ia, Ga, Aa, za, Ha, ts, vs, xs, Is).
import { useQuery } from '@apollo/client';
import Router, { useRouter } from 'next/router';
import React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import { rewriteLegacyLinks } from '../lib/links';
import {
  ArticlePopupQuery,
  FrontPopupQuery,
  MainMenuQuery,
} from '../lib/queries';
import * as S from '../lib/styles';
import { useAppContext } from './AppContext';
import { HeadroomConsumer } from './layout';
import { IconButton, ShallowLink } from './primitives';
import { Tag, Tags } from './teasers';

// bundle function `Ia`
export function Nav({ left, center, right }) {
  return (
    <div className={`${S.nav.Nav} root`}>
      <div className={`${S.nav.main} main`}>
        <div className={`${S.nav.left} left`}>{left}</div>
        <div className={`${S.nav.center} center`}>{center}</div>
        <div className={`${S.nav.right} right`}>{right}</div>
      </div>
    </div>
  );
}

// bundle function `Ga`
export function SubMenu({ active, children, type, color, size }) {
  return (
    <div className={S.subMenu.subMenu}>
      <div
        className={`anim main ${active ? 'active' : 'inactive'} anim--${type || 'normal'} ${size ? 'anim--' + size : ''}`}
      >
        <div
          className={`${S.subMenu.border} ${type ? 'border--' + type : 'border--bottom'} ${color ? 'border--color-' + color : ''}`}
        >
          <div className={`${S.subMenu.inner} inner`}>
            <div className={`${S.subMenu.bottom} bottom`}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// bundle function `Aa`
function MainMenu() {
  const context = useAppContext();
  const { loading, data } = useQuery(MainMenuQuery, {
    variables: { name: 'main' },
  });

  return (
    <div className={`${S.menu.Menu} root`}>
      {data && !loading && (
        <div className="tags">
          <Tags>
            {data.menu.links.map(link => (
              <Tag
                key={link.label}
                query={{ slug: link.url.path }}
                label={link.label}
                onClick={() =>
                  context.action.header.setOpen({
                    search: false,
                    menu: false,
                    submenu: null,
                  })
                }
              />
            ))}
          </Tags>
        </div>
      )}
    </div>
  );
}

// bundle class `za`
class SearchInput extends React.Component {
  state = { value: '', delay: 2000, blocked: true };

  onInputChange = event => {
    this.setState({ value: event.target.value, blocked: false });
  };

  callAPI = () => {
    if (!this.state.blocked) {
      Router.push(
        {
          pathname: '/',
          query: this.state.value ? { search: this.state.value } : {},
        },
        undefined,
        { shallow: true }
      );
    }
  };

  onKeyDown = event => {
    if (this.keydownID) {
      clearTimeout(this.keydownID);
    }

    this.keydownID = setTimeout(() => this.callAPI(), this.state.delay);

    if (event.key === 'Enter') {
      this.callAPI();
    }
  };

  componentDidMount() {
    this.setState({ value: this.props.search });
    Router.events.on('routeChangeComplete', this.syncValue);
  }

  componentWillUnmount() {
    Router.events.off('routeChangeComplete', this.syncValue);
    clearTimeout(this.keydownID);
  }

  syncValue = () => {
    this.setState({ value: Router.query.search ?? '' });
  };

  render() {
    const { context, search } = this.props;

    return (
      <div className={S.searchBar.search}>
        <ShallowLink
          className={S.searchBar.right}
          query={{ search: null, slug: null }}
          onClick={() =>
            context.action.header.setOpen({
              search: false,
              menu: false,
              submenu: null,
            })
          }
        >
          <div className={`bullet ${search ? 'filled' : 'placeholder'}`} />
        </ShallowLink>
        <input
          type="text"
          ref={context.header.search.inputRef}
          placeholder="Suchen..."
          value={this.state.value ?? ''}
          onChange={event => this.onInputChange(event)}
          onKeyDown={event => this.onKeyDown(event)}
        />
      </div>
    );
  }
}

// bundle function `Ha`
export function Header() {
  const context = useAppContext();
  const { search, slug } = useRouter().query;
  const subMenuRef = React.useRef(null);

  return (
    <HeadroomConsumer>
      {({ isOpen }) => (
        <>
          <div className={S.header.home}>
            <SubMenu active={isOpen}>
              <Nav
                left={
                  <ShallowLink
                    query={{ slug: '/' }}
                    onClick={() => {
                      context.action.header.setOpen({
                        search: true,
                        menu: false,
                        submenu: null,
                      });
                      context.action.search.focusSearchInput();
                    }}
                  >
                    <IconButton
                      type="search"
                      desktopText="Suchen"
                    />
                  </ShallowLink>
                }
                center={
                  <ShallowLink
                    query={{ slug: '/', search: '' }}
                    onClick={() =>
                      context.action.header.setOpen({
                        search: false,
                        menu: false,
                        submenu: null,
                      })
                    }
                  >
                    Neue Wege
                  </ShallowLink>
                }
                right={
                  (context.header.menu.open && (
                    <ShallowLink
                      onClick={() =>
                        context.action.header.setOpen({
                          search: !!search,
                          menu: false,
                        })
                      }
                    >
                      <IconButton type="close" />
                    </ShallowLink>
                  )) || (
                    <ShallowLink
                      onClick={() =>
                        context.action.header.setOpen({
                          search: false,
                          menu: true,
                        })
                      }
                    >
                      <IconButton
                        type="menu"
                        desktopText="Menu"
                      />
                    </ShallowLink>
                  )
                }
              />
            </SubMenu>
          </div>
          <div className={S.header.mainMenu}>
            <SubMenu active={isOpen && context.header.menu.open}>
              <Nav center={<MainMenu />} />
            </SubMenu>
          </div>
          <SubMenu active={slug}>
            <TransitionGroup className={S.header.subMenuTransition}>
              <CSSTransition
                key={slug}
                nodeRef={subMenuRef}
                timeout={550}
                appear
                classNames="subMenuTransition--item subMenuTransition--item"
              >
                <div ref={subMenuRef}>
                  <div
                    className={
                      (
                        React.Children.count(context.header.submenu.component) >
                        0
                      ) ?
                        'done'
                      : 'loading'
                    }
                  >
                    {context.header.submenu.component}
                  </div>
                </div>
              </CSSTransition>
            </TransitionGroup>
          </SubMenu>
          <div className={S.header.search}>
            <SubMenu active={isOpen && context.header.search.open}>
              <Nav
                left={
                  <SearchInput
                    context={context}
                    search={search}
                  />
                }
                right={
                  <ShallowLink
                    className={S.header.right}
                    query={{ search: null, slug: null, submenu: null }}
                    onClick={() =>
                      context.action.header.setOpen({
                        search: false,
                        menu: false,
                        submenu: null,
                      })
                    }
                  >
                    <IconButton type="close" />
                  </ShallowLink>
                }
              />
            </SubMenu>
          </div>
        </>
      )}
    </HeadroomConsumer>
  );
}

const popupText = data =>
  data?.collection?.entities?.[0]?.fieldText?.processed ?? null;

// bundle functions `ns`/`ts`
export function FrontPopup() {
  const context = useAppContext();
  const { slug } = useRouter().query;
  const { loading, data } = useQuery(FrontPopupQuery);
  const html = popupText(data);

  if (loading || !html) {
    return null;
  }

  return (
    <SubMenu
      active={!slug && context.header.frontPopup.open}
      color="primary"
      size="tall"
    >
      <Nav
        center={
          <div
            className={S.frontPopup.FrontPopup}
            dangerouslySetInnerHTML={{ __html: rewriteLegacyLinks(html) }}
          />
        }
        right={
          <a
            href="#"
            onClick={() => context.action.frontPopup.toggle()}
          >
            <IconButton type="closePrimary" />
          </a>
        }
      />
    </SubMenu>
  );
}

// bundle functions `ys`/`vs`
class NewsletterInner extends React.Component {
  componentDidMount() {
    this.timeout = setTimeout(
      this.props.context.action.newsletter.toggle,
      60000
    );
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  render() {
    const { context } = this.props;

    return (
      <Nav
        center={
          <div className={S.newsletter.newsletter}>
            <ShallowLink
              className={S.newsletter.right}
              query={{ slug: '/newsletter' }}
              onClick={() => context.action.newsletter.toggle()}
            >
              Newsletter abonnieren?
            </ShallowLink>
          </div>
        }
        right={
          <a
            href="#"
            onClick={() => context.action.newsletter.toggle()}
          >
            <IconButton type="close" />
          </a>
        }
      />
    );
  }
}

function Newsletter() {
  const context = useAppContext();

  return <NewsletterInner context={context} />;
}

// bundle functions `_s`/`xs`
function ArticlePopup() {
  const context = useAppContext();
  const { loading, data } = useQuery(ArticlePopupQuery);
  const html = popupText(data);

  if (loading || !html) {
    return null;
  }

  return (
    <div className={S.articlePopup.root}>
      <Nav
        center={
          <div dangerouslySetInnerHTML={{ __html: rewriteLegacyLinks(html) }} />
        }
        right={
          <a
            href="#"
            onClick={context.action.articlePopup.toggle}
          >
            <IconButton type="closePrimary" />
          </a>
        }
      />
    </div>
  );
}

// bundle function `Is`
export function Footer() {
  const context = useAppContext();
  const { slug } = useRouter().query;

  return (
    <>
      <SubMenu
        active={slug && context.footer.articlePopup.open}
        color="primary"
        type="top"
      >
        <ArticlePopup />
      </SubMenu>
      <div className={S.footer.topborder} />
      <SubMenu
        active={!slug && context.footer.newsletter.open}
        type="none"
      >
        <Newsletter />
      </SubMenu>
      <SubMenu
        active={slug && context.footer.submenu.open}
        type="none"
      >
        {context.footer.submenu.component}
      </SubMenu>
    </>
  );
}

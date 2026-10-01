// Page shell of the live site, ported from its bundle (functions O, W, Z,
// ue, ce, ge, xe, De, Te). Home stays mounted in `main`, every other route
// renders into `overlay` which slides over it.
import Router, { useRouter } from 'next/router';
import React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import * as S from '../lib/styles';
import { useAppContext } from './AppContext';
import { IntersectionObserver } from './primitives';

// bundle function `O`
export function PageContainer({ children }) {
  return <div className={S.pageContainer.pageContainer}>{children}</div>;
}

function closeOverlay(context) {
  Router.push(
    {
      pathname: '/',
      query: Router.query.search ? { search: Router.query.search } : {},
    },
    undefined,
    { shallow: true }
  );
  context.action.header.setOpen({
    search: !!Router.query.search,
    menu: false,
    submenu: null,
  });
}

// bundle function `W`: scrolling the overlay past its end closes it
function CloseScroll() {
  const context = useAppContext();

  return (
    <>
      <div className={S.closeScroll.CloseScroll} />
      <IntersectionObserver
        onChange={entry => {
          if (entry.isIntersecting) {
            closeOverlay(context);
          }
        }}
      >
        <div className={S.closeScroll.close} />
      </IntersectionObserver>
    </>
  );
}

// bundle function `Z`
function ColumnContainer({ children }) {
  return (
    <div
      onClick={event => event.stopPropagation()}
      className={S.columnContainer.ColumnContainer}
    >
      <div className={S.columnContainer.inner}>
        <div className={`${S.columnContainer.column} column`}>{children}</div>
      </div>
    </div>
  );
}

// bundle class `ce`: a div that also closes the overlay on Escape
function EscapeListener({ onClick, ...rest }) {
  React.useEffect(() => {
    const handler = event => {
      if (event.keyCode === 27) {
        onClick();
      }
    };

    document.addEventListener('keydown', handler);

    return () => document.removeEventListener('keydown', handler);
  }, [onClick]);

  return (
    <div
      onClick={onClick}
      {...rest}
    />
  );
}

// bundle class `ue`
function ContentTransition({ show, children }) {
  const context = useAppContext();
  const nodeRef = React.useRef(null);
  const close = React.useCallback(() => closeOverlay(context), [context]);

  return (
    <CSSTransition
      in={show}
      nodeRef={nodeRef}
      timeout={800}
      appear
      classNames={{
        appear: 'transition transition-appear',
        appearActive: 'transition transition-appear transition-appear-active',
        enter: 'transition transition-enter',
        enterActive: 'transition transition-enter transition-enter-active',
        enterDone: 'transition transition-enter transition-enter-done',
        exit: 'transition transition-exit',
        exitActive: 'transition transition-exit transition-exit-active',
        exitDone: 'transition transition-exit transition-exit-done',
      }}
    >
      {state => (
        <div
          ref={nodeRef}
          className={`${S.contentTransition.root} ContentTransition--root ${show ? 'show' : 'hidden'} `}
        >
          <EscapeListener
            onClick={close}
            className={`bg ${show ? 'show' : 'hidden'} `}
          >
            <div className={`${S.contentTransition.slide} ${state}`}>
              {children}
            </div>
          </EscapeListener>
        </div>
      )}
    </CSSTransition>
  );
}

// bundle class `ge` + consumer `be`: whether the header is shown
const HeadroomContext = React.createContext({
  isOpen: true,
  dispatch: () => undefined,
});

export const HeadroomConsumer = HeadroomContext.Consumer;

function headroomReducer(state, action) {
  switch (action.type) {
    case 'OPEN':
      return { ...state, isOpen: true };
    case 'CLOSE':
      return { ...state, isOpen: false };
    default:
      return state;
  }
}

export function HeadroomProvider({ children }) {
  const [state, dispatch] = React.useReducer(headroomReducer, { isOpen: true });
  const value = React.useMemo(() => ({ ...state, dispatch }), [state]);

  return (
    <HeadroomContext.Provider value={value}>
      {children}
    </HeadroomContext.Provider>
  );
}

// bundle class `xe`: scroll container that hides the header when scrolling
// down past 80px and shows it again when scrolling up
class ScrollContainer extends React.Component {
  lastKnownScrollY = 0;
  doUpdate = true;
  url = this.props.url && this.props.url.asPath;

  handleScroll = () => {
    window.requestAnimationFrame(this.update);
  };

  getScrollY = () => {
    const node = this.inner;

    if (node.scrollTop !== undefined) {
      return node.scrollTop;
    }

    if (node.pageYOffset !== undefined) {
      return node.pageYOffset;
    }

    return (
      document.documentElement ||
      document.body.parentNode ||
      document.body
    ).scrollTop;
  };

  update = () => {
    if (!this.inner) {
      return;
    }

    const scrollY = this.getScrollY();

    if (this.doUpdate) {
      if (this.props.dispatch && this.lastKnownScrollY < scrollY) {
        if (this.props.isOpen === true && scrollY > 80) {
          this.props.dispatch({ type: 'CLOSE' });
        }

        this.doUpdate = false;
        setTimeout(() => (this.doUpdate = true), 1000);
      }

      if (this.props.dispatch && this.lastKnownScrollY > scrollY) {
        if (this.props.isOpen === false) {
          this.props.dispatch({ type: 'OPEN' });
        }

        this.doUpdate = false;
        setTimeout(() => (this.doUpdate = true), 1000);
      }
    }

    this.lastKnownScrollY = scrollY;
  };

  setRef = node => {
    this.inner = node;
  };

  componentDidMount() {
    if (this.inner) {
      this.lastKnownScrollY = this.getScrollY();
      this.inner.addEventListener('scroll', this.handleScroll);
    }
  }

  componentDidUpdate() {
    const url = this.props.url && this.props.url.asPath;

    if (url !== this.url) {
      this.url = url;
      const delay = this.url === '/' ? 800 : 0;

      setTimeout(() => {
        if (this.inner) {
          this.inner.scrollTop = 0;
        }
        this.lastKnownScrollY = 0;
      }, delay);
      this.props.dispatch({ type: 'OPEN' });
    }
  }

  componentWillUnmount() {
    this.inner?.removeEventListener('scroll', this.handleScroll);
  }

  render() {
    return (
      <div
        className={S.scrollContainer.root}
        ref={this.setRef}
      >
        {this.props.children}
      </div>
    );
  }
}

// bundle functions `De`/`Te`; the wrapping div is TransitionItem's node
function OverlayPage({ children }) {
  return (
    <>
      <PageContainer>
        <ColumnContainer>{children}</ColumnContainer>
      </PageContainer>
      <CloseScroll />
    </>
  );
}

function TransitionItem({ children, ...props }) {
  const nodeRef = React.useRef(null);

  return (
    <CSSTransition
      {...props}
      nodeRef={nodeRef}
      timeout={550}
      appear
      classNames="pageTransition--item pageTransition--item"
    >
      <div ref={nodeRef}>{children}</div>
    </CSSTransition>
  );
}

export function Headroom({ top, main, overlay, bottom }) {
  const router = useRouter();
  const { slug } = router.query;

  return (
    <HeadroomConsumer>
      {({ isOpen, dispatch }) => (
        <div className={S.headroom.Headroom}>
          {top && (
            <div className={S.headroom.top}>
              <PageContainer>{top}</PageContainer>
            </div>
          )}
          <div className={S.headroom.mainScroll}>
            <ScrollContainer
              dispatch={dispatch}
              isOpen={isOpen}
            >
              <PageContainer>{main}</PageContainer>
            </ScrollContainer>
            <ContentTransition show={React.Children.count(overlay) > 0}>
              <ScrollContainer
                dispatch={dispatch}
                isOpen={isOpen}
                url={router}
              >
                <TransitionGroup className={S.headroom.pageTransition}>
                  <TransitionItem key={slug}>
                    <OverlayPage>{overlay}</OverlayPage>
                  </TransitionItem>
                </TransitionGroup>
              </ScrollContainer>
            </ContentTransition>
          </div>
          {bottom && (
            <div className={S.headroom.bottom}>
              <PageContainer>{bottom}</PageContainer>
            </div>
          )}
        </div>
      )}
    </HeadroomConsumer>
  );
}

// Port of the live site's _app context provider (bundle module OvDt in
// app.js). State shape and actions are kept 1:1 because every ported
// component reads them.
import React from 'react';

const AppContext = React.createContext();

export const AppConsumer = AppContext.Consumer;

export function useAppContext() {
  return React.useContext(AppContext);
}

export class AppProvider extends React.Component {
  state = {
    header: {
      menu: { open: false },
      submenu: { open: false, component: null, url: null },
      search: { open: false, inputRef: React.createRef() },
      frontPopup: { open: true },
    },
    footer: {
      open: true,
      articlePopup: { open: true },
      newsletter: { open: false },
      submenu: { open: false, component: null, url: null },
    },
    pager: { list: [] },
  };

  setSubMenu = (url, component, footerComponent) => {
    this.setState(state => ({
      header: {
        ...state.header,
        submenu: { ...state.header.submenu, url, component },
      },
      footer: {
        ...state.footer,
        submenu: {
          ...state.footer.submenu,
          url,
          open: !!footerComponent,
          component: footerComponent,
        },
      },
    }));
  };

  setHeaderState = next => {
    this.setState(state => {
      const has = key => Object.prototype.hasOwnProperty.call(next, key);

      return {
        header: {
          ...state.header,
          menu: {
            ...state.header.menu,
            open: has('menu') ? next.menu : state.header.menu.open,
          },
          submenu: {
            ...state.header.submenu,
            component:
              has('submenu') ? next.submenu : state.header.submenu.component,
            url: has('submenu') ? null : state.header.submenu.url,
          },
          search: {
            ...state.header.search,
            open: has('search') ? next.search : state.header.search.open,
          },
        },
      };
    });
  };

  toggleNewsletterOpen = () => {
    this.setState(state => ({
      footer: {
        ...state.footer,
        newsletter: { open: !state.footer.newsletter.open },
      },
    }));
  };

  toggleFrontPopupOpen = () => {
    this.setState(state => ({
      header: {
        ...state.header,
        frontPopup: { open: !state.header.frontPopup.open },
      },
    }));
  };

  toggleArticlePopupOpen = () => {
    this.setState(state => ({
      footer: {
        ...state.footer,
        articlePopup: { open: !state.footer.articlePopup.open },
      },
    }));
  };

  setPagerList = list => {
    this.setState(state => ({ pager: { ...state.pager, list } }));
  };

  clearPagerList = () => {
    this.setState(state => ({ pager: { ...state.pager, list: [] } }));
  };

  focusSearchInput = () => {
    this.state.header.search.inputRef.current?.focus();
  };

  render() {
    const value = {
      ...this.state,
      action: {
        header: { setOpen: this.setHeaderState, setSubMenu: this.setSubMenu },
        newsletter: { toggle: this.toggleNewsletterOpen },
        frontPopup: { toggle: this.toggleFrontPopupOpen },
        articlePopup: { toggle: this.toggleArticlePopupOpen },
        search: { focusSearchInput: this.focusSearchInput },
        pager: { setList: this.setPagerList, clearList: this.clearPagerList },
      },
      pager: {
        ...this.state.pager,
        setList: this.setPagerList,
        clearList: this.clearPagerList,
      },
    };

    return (
      <AppContext.Provider value={value}>
        {this.props.children}
      </AppContext.Provider>
    );
  }
}

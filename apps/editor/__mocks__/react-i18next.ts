import React from 'react';
import * as reactI18next from 'react-i18next';

const hasChildren = (node: any) =>
  node && (node.children || (node.props && node.props.children));

const getChildren = (node: any) =>
  node && node.children ? node.children : node.props && node.props.children;

const renderNodes = (reactNodes: any): any => {
  if (typeof reactNodes === 'string') {
    return reactNodes;
  }

  return Object.keys(reactNodes).map((key, i) => {
    const child = reactNodes[key];
    const isElement = React.isValidElement(child);

    if (typeof child === 'string') {
      return child;
    }
    if (hasChildren(child)) {
      const inner = renderNodes(getChildren(child));
      return React.cloneElement(child, { ...child.props, key: i }, inner);
    }
    if (typeof child === 'object' && !isElement) {
      return Object.keys(child).reduce(
        (str, childKey) => `${str}${child[childKey]}`,
        ''
      );
    }

    return child;
  });
};

const useMock: any = [(k: any) => k, {}];
useMock.t = (k: any) => k;
useMock.i18n = {};

module.exports = {
  // this mock makes sure any components using the translate HoC receive the t function as a prop
  // withTranslation: () => (Component: any) => (props: any) => <Component t={k => k} {...props} />,
  Trans: ({ children }: any) => renderNodes(children),
  Translation: ({ children }: any) => children((k: any) => k, { i18n: {} }),
  useTranslation: () => useMock,

  // mock if needed
  I18nextProvider: reactI18next.I18nextProvider,
  initReactI18next: reactI18next.initReactI18next,
  setDefaults: reactI18next.setDefaults,
  getDefaults: reactI18next.getDefaults,
  setI18n: reactI18next.setI18n,
  getI18n: reactI18next.getI18n,
};

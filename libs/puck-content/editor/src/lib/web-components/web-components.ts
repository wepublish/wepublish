import { Plugin } from '@puckeditor/core';
import { CustomElementsBridge } from './web-components.component';

// Without this, web components don't work
export const webComponentsPlugin: Plugin = {
  name: 'web-components',
  overrides: {
    iframe: CustomElementsBridge,
  },
};

export const bridgeCustomElements = (frameDocument: Document) => {
  const editorDocument = document;
  const editorWindow = editorDocument.defaultView;

  if (!editorWindow || frameDocument === editorDocument) {
    return () => undefined;
  }

  const hadOwnCreateElement = Object.prototype.hasOwnProperty.call(
    frameDocument,
    'createElement'
  );
  const originalCreateElement = frameDocument.createElement;

  frameDocument.createElement = function createElement(
    this: Document,
    tagName: string,
    options?: ElementCreationOptions
  ) {
    const name = String(tagName).toLowerCase();

    // Probably needs a better way to detect custom elements than checking for `-`
    if (name.includes('-') && editorWindow.customElements.get(name)) {
      return frameDocument.adoptNode(
        editorDocument.createElement(name, options)
      );
    }

    return originalCreateElement.call(this, tagName, options);
  } as Document['createElement'];

  return () => {
    if (hadOwnCreateElement) {
      frameDocument.createElement = originalCreateElement;
    } else {
      delete (frameDocument as Partial<Document>).createElement;
    }
  };
};

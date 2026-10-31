import {
  bridgeCustomElements,
  bridgeDocument,
  isDocumentBridged,
  subscribeToBridgedDocuments,
} from './web-components.helpers';

class BridgedGreeting extends HTMLElement {}

if (!customElements.get('bridged-greeting')) {
  customElements.define('bridged-greeting', BridgedGreeting);
}

const createFrameDocument = () =>
  document.implementation.createHTMLDocument('frame');

describe('bridgeCustomElements', () => {
  it('creates registered custom elements through the editor document', () => {
    const frameDocument = createFrameDocument();
    const createInEditor = vi.spyOn(document, 'createElement');

    const restore = bridgeCustomElements(frameDocument);

    frameDocument.createElement('bridged-greeting');
    expect(createInEditor).toHaveBeenCalledWith('bridged-greeting', undefined);

    createInEditor.mockClear();
    frameDocument.createElement('div');
    frameDocument.createElement('unknown-element');
    expect(createInEditor).not.toHaveBeenCalled();

    restore();
    expect(
      Object.prototype.hasOwnProperty.call(frameDocument, 'createElement')
    ).toBe(false);
  });

  it('leaves the editor document alone', () => {
    const createElement = document.createElement;

    bridgeCustomElements(document)();

    expect(document.createElement).toBe(createElement);
  });
});

describe('bridgeDocument', () => {
  it('marks the frame document as bridged until it is restored', () => {
    const frameDocument = createFrameDocument();
    const listener = vi.fn();
    const unsubscribe = subscribeToBridgedDocuments(listener);

    expect(isDocumentBridged(frameDocument)).toBe(false);

    const restore = bridgeDocument(frameDocument);
    expect(isDocumentBridged(frameDocument)).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);

    restore();
    expect(isDocumentBridged(frameDocument)).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    bridgeDocument(frameDocument)();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('never treats a missing document as bridged', () => {
    expect(isDocumentBridged(undefined)).toBe(false);
  });
});

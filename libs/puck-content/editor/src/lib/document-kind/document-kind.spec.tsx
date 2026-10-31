import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';

import {
  PuckDocumentKindContext,
  PuckEditorDocumentKind,
  usePuckDocumentKind,
  usePuckDocumentKindLabel,
} from './document-kind';

const withKind =
  (kind: PuckEditorDocumentKind) =>
  ({ children }: { children: ReactNode }) => (
    <PuckDocumentKindContext.Provider value={kind}>
      {children}
    </PuckDocumentKindContext.Provider>
  );

describe('usePuckDocumentKind', () => {
  it('edits a page unless the route says otherwise', () => {
    expect(renderHook(() => usePuckDocumentKind()).result.current).toBe('page');
  });

  it('reads the kind the route provides', () => {
    expect(
      renderHook(() => usePuckDocumentKind(), { wrapper: withKind('article') })
        .result.current
    ).toBe('article');
  });
});

describe('usePuckDocumentKindLabel', () => {
  it('names the kind of document', () => {
    expect(
      renderHook(() => usePuckDocumentKindLabel(), {
        wrapper: withKind('page'),
      }).result.current
    ).toBe('Page');
    expect(
      renderHook(() => usePuckDocumentKindLabel(), {
        wrapper: withKind('article'),
      }).result.current
    ).toBe('Article');
  });
});

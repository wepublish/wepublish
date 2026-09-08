import { ApolloLink, execute, gql, Observable } from '@apollo/client';

import { previewLink, PREVIEW_MODE_KEY } from './preview-link';

const query = gql`
  query Test {
    __typename
  }
`;

const getPreviewHeader = () =>
  new Promise<string>(resolve => {
    const terminatingLink = new ApolloLink(operation => {
      resolve(operation.getContext().headers.preview);

      return Observable.of({ data: { __typename: 'Query' } });
    });

    execute(ApolloLink.from([previewLink, terminatingLink]), {
      query,
    }).subscribe(() => undefined);
  });

describe('previewLink', () => {
  afterEach(() => {
    sessionStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('sends no preview header by default', async () => {
    await expect(getPreviewHeader()).resolves.toBe('');
  });

  it('sends the preview header when preview mode is stored', async () => {
    sessionStorage.setItem(PREVIEW_MODE_KEY, '1');

    await expect(getPreviewHeader()).resolves.toBe('preview');
  });

  it('sends the preview header when the url contains ?preview', async () => {
    window.history.replaceState(null, '', '/a/foobar?preview');

    await expect(getPreviewHeader()).resolves.toBe('preview');
  });

  it('sends no preview header when preview mode was stored as disabled', async () => {
    sessionStorage.setItem(PREVIEW_MODE_KEY, '0');

    await expect(getPreviewHeader()).resolves.toBe('');
  });
});

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { DocumentTitle } from './documentTitle';

const renderAt = (pathname: string) =>
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <DocumentTitle />
    </MemoryRouter>
  );

describe('DocumentTitle', () => {
  afterEach(() => {
    document.title = '';
  });

  it('puts the page in front of the product name', () => {
    renderAt('/articles/edit/abc-123');

    expect(document.title).toBe('pageTitles.articleEdit · We.Publish');
  });

  it('falls back to the product name on a page it cannot name', () => {
    renderAt('/nowhere');

    expect(document.title).toBe('We.Publish');
  });
});

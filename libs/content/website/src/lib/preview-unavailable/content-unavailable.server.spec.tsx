// @vitest-environment node
import { createTheme, ThemeProvider } from '@mui/material';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { ComponentProps, PropsWithChildren } from 'react';
import { renderToString } from 'react-dom/server';

import { ContentUnavailable } from './content-unavailable';

type BuilderElements = ComponentProps<
  typeof WebsiteBuilderProvider
>['elements'];

const elements = {
  H5: ({ children }: PropsWithChildren<{ component?: string }>) => (
    <h5>{children}</h5>
  ),
  Paragraph: ({ children }: PropsWithChildren) => <p>{children}</p>,
};

describe('ContentUnavailable on the server', () => {
  it('keeps search engines from indexing the empty page in the server html, without any note', () => {
    // React 19 hoists `<meta>` itself, in Next and in TanStack Start alike,
    // so the component no longer goes through a framework-specific Head and
    // this assertion no longer needs Next's head manager.
    const html = renderToString(
      <ThemeProvider theme={createTheme()}>
        <WebsiteBuilderProvider elements={elements as BuilderElements}>
          <ContentUnavailable />
        </WebsiteBuilderProvider>
      </ThemeProvider>
    );

    expect(html).toContain('name="robots"');
    expect(html).toContain('content="noindex"');
    expect(html).not.toContain('nicht verfügbar');
  });
});

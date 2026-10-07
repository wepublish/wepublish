// @vitest-environment node
import { createTheme, ThemeProvider } from '@mui/material';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { HeadManagerContext } from 'next/dist/shared/lib/head-manager-context.shared-runtime';
import {
  ComponentProps,
  isValidElement,
  PropsWithChildren,
  ReactNode,
} from 'react';
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
    const heads: ReactNode[][] = [];
    const headManager = {
      mountedInstances: new Set(),
      updateHead: (head: ReactNode[]) => heads.push(head),
    };

    const html = renderToString(
      <HeadManagerContext.Provider value={headManager as never}>
        <ThemeProvider theme={createTheme()}>
          <WebsiteBuilderProvider elements={elements as BuilderElements}>
            <ContentUnavailable />
          </WebsiteBuilderProvider>
        </ThemeProvider>
      </HeadManagerContext.Provider>
    );

    expect(
      heads
        .flat()
        .some(
          head =>
            isValidElement<{ name?: string; content?: string }>(head) &&
            head.props.name === 'robots' &&
            head.props.content === 'noindex'
        )
    ).toBe(true);
    expect(html).not.toContain('nicht verfügbar');
  });
});

import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { Config, Data, Plugin, Puck } from '@puckeditor/core';
import { act, render, screen } from '@testing-library/react';
import { CSSProperties } from 'react';

import { OutlinePlugin } from '../defaultPlugins';
import { HeadingAnalyzerPlugin } from '../heading-analyzer';
import { RawDataPlugin } from '../raw-data/raw-data';
import { RevisionHistoryPlugin } from '../revision-history/revision-history';
import { SEOPreviewPlugin } from '../seo-preview/seo-preview';
import { PluginPanelHeader } from './plugin-panel-header.component';

const tokens = {
  '--puck-color-surface': 'rgb(1, 2, 3)',
  '--puck-color-border': 'rgb(4, 5, 6)',
  '--puck-color-text': 'rgb(7, 8, 9)',
  '--puck-color-text-secondary': 'rgb(10, 11, 12)',
  '--puck-font-size-xs': '16px',
  '--puck-font-size-xxxs': '12px',
} as CSSProperties;

const config: Config = {
  components: {},
  root: { fields: { title: { type: 'text' } } },
};

const data: Data = { root: { props: { title: 'Home' } }, content: [] };

const theme = createTheme({ cssVariables: true });

const renderPanel = async (plugin: Plugin) => {
  render(
    <ThemeProvider theme={theme}>
      <MockedProvider mocks={[]}>
        <div style={tokens}>
          <Puck
            config={config}
            data={data}
            plugins={[plugin]}
            ui={{ plugin: { current: plugin.name }, leftSideBarVisible: true }}
          />
        </div>
      </MockedProvider>
    </ThemeProvider>
  );

  await act(
    () => new Promise(resolve => requestAnimationFrame(() => resolve(null)))
  );
};

const titleStyle = {
  'font-size': '16px',
  'font-weight': '600',
  color: 'rgb(7, 8, 9)',
};

const headerStyle = {
  position: 'sticky',
  'background-color': 'rgb(1, 2, 3)',
  'border-bottom': '1px solid rgb(4, 5, 6)',
};

describe('plugin panel headers', () => {
  it('renders the reference title and subtitle', () => {
    render(
      <div style={tokens}>
        <PluginPanelHeader
          title="Panel"
          subtitle="Meta"
          actions={<button type="button">Act</button>}
        />
      </div>
    );

    const title = screen.getByRole('heading', { level: 2, name: 'Panel' });

    expect(title).toHaveStyle(titleStyle);
    expect(screen.getByText('Meta')).toHaveStyle({
      'font-size': '12px',
      color: 'rgb(10, 11, 12)',
    });
    expect(title.closest('[data-plugin-panel-header]')).toContainElement(
      screen.getByRole('button', { name: 'Act' })
    );
  });

  it.each([
    ['Outline', OutlinePlugin],
    ['Version history', RevisionHistoryPlugin],
    ['Raw data', RawDataPlugin],
    ['SEO preview', SEOPreviewPlugin],
    ['Heading audit', HeadingAnalyzerPlugin],
  ])('renders the %s title through the shared header', async (name, plugin) => {
    await renderPanel(plugin as Plugin);

    const title = screen.getByRole('heading', { level: 2, name });
    const header = title.parentElement?.closest(
      '[data-plugin-panel-header], [class*="_OutlineHeader_"]'
    );

    expect(header).toHaveStyle(headerStyle);
    expect(title).toHaveStyle(titleStyle);
  });
});

import { render, screen } from '@testing-library/react';
import { CSSProperties, ReactNode } from 'react';

import {
  PluginPanelHeader,
  PuckPluginPanel,
} from './plugin-panel-header.component';

const tokens = {
  '--puck-color-surface': 'rgb(1, 2, 3)',
  '--puck-color-border': 'rgb(4, 5, 6)',
} as CSSProperties;

const renderWithTokens = (children: ReactNode) =>
  render(<div style={tokens}>{children}</div>);

const headerStyle = {
  position: 'sticky',
  'background-color': 'rgb(1, 2, 3)',
  'border-bottom': '1px solid rgb(4, 5, 6)',
};

describe('PluginPanelHeader', () => {
  it('renders its content on the shared sticky surface', () => {
    renderWithTokens(
      <PluginPanelHeader data-testid="header">
        <input aria-label="Search blocks" />
      </PluginPanelHeader>
    );

    const header = screen.getByTestId('header');

    expect(header).toContainElement(
      screen.getByRole('textbox', { name: 'Search blocks' })
    );
    expect(header).toHaveStyle(headerStyle);
  });
});

describe('PuckPluginPanel', () => {
  it('gives a Puck-owned panel header the same surface', () => {
    renderWithTokens(
      <PuckPluginPanel>
        <div
          className="_OutlineHeader_ntv8r_1"
          data-testid="outline-header"
        >
          Outline
        </div>
      </PuckPluginPanel>
    );

    expect(screen.getByTestId('outline-header')).toHaveStyle(headerStyle);
  });
});

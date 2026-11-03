import { createTheme, ThemeProvider } from '@mui/material';
import { act, render, screen } from '@testing-library/react';
import {
  FullPuckBlockFragment,
  FullPuckRegistryFragment,
  PuckBlockKind,
} from '@wepublish/website/api';

import {
  emptyPuckBlockData,
  PuckBlockComponent,
  PuckBlockRegistry,
} from './block.types';
import { PuckBlocks } from './puck-blocks-renderer.component';

const loadedPuckModules = vi.hoisted(() => new Set<string>());

vi.mock('@puckeditor/core/rsc', async importOriginal => {
  loadedPuckModules.add('@puckeditor/core/rsc');

  return importOriginal();
});

vi.mock('@puckeditor/plugin-ai', async importOriginal => {
  loadedPuckModules.add('@puckeditor/plugin-ai');

  return importOriginal();
});

vi.mock('../generated/generated-block.component', async importOriginal => {
  loadedPuckModules.add('generated-block.component');

  return importOriginal();
});

const block = (
  fields: Pick<FullPuckBlockFragment, 'id' | 'type'> &
    Partial<FullPuckBlockFragment>
): FullPuckBlockFragment => ({
  __typename: 'PuckBlock',
  kind: PuckBlockKind.Puck,
  parentId: null,
  puckSlot: null,
  position: 0,
  props: {},
  visibility: null,
  styling: null,
  datasources: null,
  data: { __typename: 'PuckBlockData', ...emptyPuckBlockData },
  ...fields,
});

const Text: PuckBlockComponent<{ text: string }> = ({ props, className }) => (
  <p className={className}>{props.text}</p>
);

const components: PuckBlockRegistry = { Text: { component: Text } };

const theme = createTheme();

const registry: FullPuckRegistryFragment = {
  __typename: 'PuckRegistry',
  components: {
    Hero: { html: '<h2 data-puck-field-name="title">Placeholder</h2>' },
  },
  styles: '.page{margin:0}',
  script: null,
};

describe('PuckBlocks loading Puck', () => {
  it('renders a document without generated blocks without loading Puck', async () => {
    await act(async () =>
      render(
        <ThemeProvider theme={theme}>
          <PuckBlocks
            blocks={[
              block({ id: 'text', type: 'Text', props: { text: 'Plain' } }),
            ]}
            registry={registry}
            components={components}
          />
        </ThemeProvider>
      )
    );

    expect(screen.getByText('Plain')).toBeInTheDocument();
    expect([...loadedPuckModules]).toEqual([]);
  });

  it('loads Puck for a document with a generated block', async () => {
    await act(async () =>
      render(
        <ThemeProvider theme={theme}>
          <PuckBlocks
            blocks={[
              block({
                id: 'hero',
                type: 'Hero',
                kind: PuckBlockKind.Generated,
                props: { title: 'Generated' },
              }),
            ]}
            registry={registry}
            components={components}
          />
        </ThemeProvider>
      )
    );

    expect(
      await screen.findByRole(
        'heading',
        { name: 'Generated' },
        { timeout: 10_000 }
      )
    ).toBeInTheDocument();
    expect([...loadedPuckModules].sort()).toEqual([
      '@puckeditor/core/rsc',
      '@puckeditor/plugin-ai',
      'generated-block.component',
    ]);
  });
});

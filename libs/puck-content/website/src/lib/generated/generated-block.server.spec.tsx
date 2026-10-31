// @vitest-environment node
import {
  FullPuckBlockFragment,
  FullPuckRegistryFragment,
  PuckBlockKind,
} from '@wepublish/website/api';
import { ReactElement } from 'react';
import { prerenderToNodeStream } from 'react-dom/static';

import { buildPuckBlockTree } from '../blocks/block-tree';
import { emptyPuckBlockData } from '../blocks/block.types';
import {
  GeneratedBlock,
  GeneratedBlocksProvider,
} from './generated-blocks.component';

const registry = (level: number): FullPuckRegistryFragment => ({
  __typename: 'PuckRegistry',
  components: {
    Hero: {
      html: `<h${level} data-puck-field-name="title">Placeholder</h${level}>`,
    },
  },
  styles: null,
  script: null,
});

const hero: FullPuckBlockFragment = {
  __typename: 'PuckBlock',
  id: 'hero',
  type: 'Hero',
  kind: PuckBlockKind.Generated,
  parentId: null,
  puckSlot: null,
  position: 0,
  props: { title: 'Stored title' },
  visibility: null,
  styling: null,
  datasources: null,
  data: { __typename: 'PuckBlockData', ...emptyPuckBlockData },
};

const ChildBlock = () => null;

const page = (level: number) => (
  <GeneratedBlocksProvider registry={registry(level)}>
    <GeneratedBlock
      node={buildPuckBlockTree([hero]).roots[0]}
      ChildBlock={ChildBlock}
    />
  </GeneratedBlocksProvider>
);

const renderToHtml = async (ui: ReactElement) => {
  const { prelude } = await prerenderToNodeStream(ui);
  let html = '';

  for await (const chunk of prelude) {
    html += String(chunk);
  }

  return html;
};

const heading = (level: number) =>
  `<h${level} data-puck-field-name="title">Stored title</h${level}>`;

describe('GeneratedBlock on a server that renders many documents', () => {
  it('renders each document with its own markup when documents that name a component alike render one after another', async () => {
    for (const level of [2, 3, 2]) {
      const html = await renderToHtml(page(level));

      expect(html).toContain('data-puck-design="Hero"');
      expect(html).toContain(heading(level));
    }
  });

  it('renders each document with its own markup when the renders of documents that name a component alike interleave', async () => {
    const levels = [2, 3, 4, 2, 3, 4];
    const pages = await Promise.all(
      levels.map(level => renderToHtml(page(level)))
    );

    pages.forEach((html, index) =>
      expect(html).toContain(heading(levels[index]))
    );
  });
});

import { act, render, screen, waitFor, within } from '@testing-library/react';
import {
  FullPuckBlockFragment,
  FullPuckRegistryFragment,
  PuckBlockKind,
} from '@wepublish/website/api';
import { ReactElement, StrictMode } from 'react';
import { createRoot, hydrateRoot, Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { prerenderToNodeStream } from 'react-dom/static';

import { buildPuckBlockTree, PuckBlockNode } from '../blocks/block-tree';
import { emptyPuckBlockData } from '../blocks/block.types';
import {
  GeneratedBlock,
  GeneratedBlocksProvider,
} from './generated-blocks.component';

type Node = PuckBlockNode<FullPuckBlockFragment>;

const heroHtml =
  '<section class="hero"><h2 data-puck-field-name="title">Placeholder</h2><a data-puck-field-href="link" href="#">More</a><div data-puck-slot="content" class="hero-content"></div><aside data-puck-slot="side.panel"></aside></section>';

const hero = {
  label: 'Hero',
  html: heroHtml,
  styles: '.hero{color:rebeccapurple}',
  defaultProps: { title: 'Placeholder' },
};

const registry = (
  fields: Partial<FullPuckRegistryFragment> = {}
): FullPuckRegistryFragment => ({
  __typename: 'PuckRegistry',
  components: { Hero: hero },
  styles: null,
  script: null,
  ...fields,
});

const heroWith = (fields: Record<string, unknown>) =>
  registry({ components: { Hero: { ...hero, ...fields } } });

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

const heroNode = (type = 'Hero', id = 'hero'): Node =>
  buildPuckBlockTree([
    block({
      id,
      type,
      kind: PuckBlockKind.Generated,
      props: {
        title: 'Stored title',
        link: 'https://example.com/more',
        content: [],
        'side.panel': [],
      },
    }),
    block({
      id: 'child-b',
      type: 'Text',
      parentId: id,
      puckSlot: 'content',
      position: 1,
    }),
    block({
      id: 'child-a',
      type: 'Text',
      parentId: id,
      puckSlot: 'content',
      position: 0,
    }),
    block({
      id: 'child-side',
      type: 'Text',
      parentId: id,
      puckSlot: 'side.panel',
      position: 0,
    }),
  ]).roots[0];

const ChildBlock = ({ node }: { node: Node }) => <span>{node.block.id}</span>;

const NestedBlock = ({ node }: { node: Node }) =>
  node.block.kind === PuckBlockKind.Generated ?
    <GeneratedBlock
      node={node}
      ChildBlock={NestedBlock}
    />
  : <span>{node.block.id}</span>;

const generated = (
  registryValue: FullPuckRegistryFragment | null,
  node = heroNode(),
  className?: string
) => (
  <GeneratedBlocksProvider registry={registryValue}>
    <GeneratedBlock
      node={node}
      className={className}
      ChildBlock={ChildBlock}
    />
  </GeneratedBlocksProvider>
);

const generatedDocument = (
  registryValue: FullPuckRegistryFragment | null,
  nodes: Node[]
) => (
  <GeneratedBlocksProvider registry={registryValue}>
    {nodes.map(node => (
      <GeneratedBlock
        key={node.block.id}
        node={node}
        ChildBlock={ChildBlock}
      />
    ))}
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

const renderSettled = (ui: ReactElement) => act(async () => render(ui));

const settle = (update: () => void) => act(async () => update());

const scriptsWith = (text: string) =>
  Array.from(document.body.querySelectorAll('script')).filter(script =>
    script.textContent?.includes(text)
  );

const countWhenScriptRuns = (text: string, selector: string) => {
  const counts: number[] = [];
  const appendChild = document.body.appendChild.bind(document.body);
  const spy = vi
    .spyOn(document.body, 'appendChild')
    .mockImplementation(<T extends globalThis.Node>(child: T): T => {
      if (
        child instanceof HTMLScriptElement &&
        child.textContent?.includes(text)
      ) {
        counts.push(document.querySelectorAll(selector).length);
      }

      return appendChild(child);
    });

  return { counts, restore: () => spy.mockRestore() };
};

const renderOutsideTransition = async (ui: ReactElement) => {
  const container = document.body.appendChild(document.createElement('div'));
  const root = createRoot(container);

  await act(async () => root.render(ui));

  return () => {
    act(() => root.unmount());
    container.remove();
  };
};

beforeAll(async () => {
  await import('./generated-block.component');
}, 60_000);

describe('GeneratedBlock', () => {
  it('never updates another component while rendering a new registry', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    try {
      const { rerender } = await renderSettled(generated(registry()));

      await settle(() => rerender(generated(registry())));
      await settle(() =>
        rerender(
          generated(
            heroWith({ html: '<h3 data-puck-field-name="title">Changed</h3>' })
          )
        )
      );

      expect(
        screen.getByRole('heading', { level: 3, name: 'Stored title' })
      ).toBeInTheDocument();

      await settle(() => rerender(generated(registry())));

      expect(
        screen.getByRole('heading', { level: 2, name: 'Stored title' })
      ).toBeInTheDocument();
      expect(consoleError.mock.calls.flat().join('\n')).not.toMatch(
        /Cannot update a component/
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it('renders the slot children through the block component in the slot host', async () => {
    await renderSettled(generated(registry()));

    const slot = screen
      .getByText('child-a')
      .closest('[data-puck-slot="content"]');

    expect(slot?.textContent).toBe('child-achild-b');
    expect(screen.getByText('child-a').parentElement).toHaveClass(
      'hero-content'
    );
  });

  it('keeps dotted slot names of generated blocks flat', async () => {
    await renderSettled(generated(registry()));

    expect(
      screen.getByText('child-side').closest('[data-puck-slot="side.panel"]')
    ).not.toBeNull();
  });

  it('puts the class name on the element around the markup', async () => {
    const { container } = await renderSettled(
      generated(registry(), heroNode(), 'styled')
    );

    expect(container.firstElementChild).toHaveClass('styled');
    expect(
      container.firstElementChild?.querySelector('[data-puck-design]')
    ).not.toBeNull();
  });

  it('renders nothing for a component the registry does not have', () => {
    expect(renderToString(generated(registry(), heroNode('Unknown')))).toBe('');
    expect(renderToString(generated(registry(), heroNode('toString')))).toBe(
      ''
    );
  });

  it('renders nothing without a registry', () => {
    expect(renderToString(generated(null))).toBe('');
    expect(
      renderToString(
        <GeneratedBlock
          node={heroNode()}
          ChildBlock={ChildBlock}
        />
      )
    ).toBe('');
  });

  it('renders a document with its own markup after a document of another registry that names a component alike', async () => {
    const other = heroWith({
      html: '<h3 data-puck-field-name="title">Other</h3>',
    });

    for (const [value, level] of [
      [registry(), 2],
      [other, 3],
      [registry(), 2],
    ] as const) {
      const { unmount } = await renderSettled(generated(value));

      expect(
        screen.getByRole('heading', { level, name: 'Stored title' })
      ).toBeInTheDocument();

      unmount();
    }
  });

  it('shows the markup of one registry in two documents mounted together that name a component alike', async () => {
    const other = heroWith({
      html: '<h3 data-puck-field-name="title">Other</h3>',
    });

    await renderSettled(
      <>
        <section aria-label="first">{generated(registry())}</section>
        <section aria-label="second">{generated(other)}</section>
      </>
    );

    const headings = (name: string) =>
      within(screen.getByRole('region', { name }))
        .getAllByRole('heading')
        .map(heading => heading.tagName);

    expect(headings('first')).toHaveLength(1);
    expect(headings('second')).toEqual(headings('first'));
  });

  it('renders nothing for a block Puck cannot build and keeps the rest of the document', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const broken = registry({
      script: 'window.__puckBrokenScript = true;',
      components: {
        Hero: {
          html: '<section class="broken">Broken</section>',
          fields: { title: null },
        },
      },
    });

    try {
      const { unmount } = await renderSettled(
        <GeneratedBlocksProvider registry={broken}>
          <p>Other content</p>
          <GeneratedBlock
            node={heroNode()}
            ChildBlock={ChildBlock}
          />
        </GeneratedBlocksProvider>
      );

      await waitFor(() =>
        expect(scriptsWith('__puckBrokenScript')).toHaveLength(1)
      );
      expect(screen.getByText('Other content')).toBeInTheDocument();
      expect(document.querySelector('.broken')).toBeNull();

      unmount();
      await renderSettled(generated(registry()));

      expect(
        screen.getByRole('heading', { level: 2, name: 'Stored title' })
      ).toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('keeps the rendered blocks for a new registry object with the same content', async () => {
    const { rerender } = await renderSettled(generated(registry()));
    const heading = screen.getByRole('heading', { name: 'Stored title' });

    await settle(() => rerender(generated(registry())));

    expect(screen.getByRole('heading', { name: 'Stored title' })).toBe(heading);
  });

  it('runs a component script once for all its instances and removes it with the last', async () => {
    const script = 'window.__puckHeroScript = true;';
    const nodes = [heroNode('Hero', 'first'), heroNode('Hero', 'second')];
    const { rerender, unmount } = await renderSettled(
      generatedDocument(heroWith({ script }), nodes)
    );

    expect(
      screen.getAllByRole('heading', { name: 'Stored title' })
    ).toHaveLength(2);

    const scripts = scriptsWith('__puckHeroScript');

    expect(scripts).toHaveLength(1);

    await settle(() =>
      rerender(generatedDocument(heroWith({ script }), nodes))
    );

    expect(scriptsWith('__puckHeroScript')).toEqual(scripts);

    await settle(() =>
      rerender(generatedDocument(heroWith({ script }), nodes.slice(1)))
    );

    expect(scriptsWith('__puckHeroScript')).toEqual(scripts);

    unmount();

    expect(scriptsWith('__puckHeroScript')).toHaveLength(0);
  });
});

describe('GeneratedBlocksProvider', () => {
  it('renders the registry styles ahead of the blocks', async () => {
    const { container } = await renderSettled(
      generated(registry({ styles: '.page{margin:0}' }))
    );

    expect(container.firstElementChild?.tagName).toBe('STYLE');
    expect(container.firstElementChild?.textContent).toBe('.page{margin:0}');
    expect(screen.getByText('Stored title')).toBeInTheDocument();
  });

  it('runs the registry script once after mount and removes it on unmount', async () => {
    const value = registry({ script: 'window.__puckClientScript = true;' });
    const { rerender, unmount } = await renderSettled(generated(value));

    expect(scriptsWith('__puckClientScript')).toHaveLength(1);

    await settle(() => rerender(generated(value)));

    expect(scriptsWith('__puckClientScript')).toHaveLength(1);

    unmount();

    expect(scriptsWith('__puckClientScript')).toHaveLength(0);
  });

  it('runs the registry script only once every generated block has mounted, also outside a transition', async () => {
    const value = registry({ script: 'window.__puckAfterBlocks = true;' });
    const heroes = countWhenScriptRuns('__puckAfterBlocks', '.hero');

    try {
      const unmount = await renderOutsideTransition(
        generatedDocument(value, [
          heroNode('Hero', 'first'),
          heroNode('Hero', 'second'),
        ])
      );

      await waitFor(() => expect(heroes.counts).toEqual([2]));

      unmount();
    } finally {
      heroes.restore();
    }
  });

  it('runs the registry script only once every generated block has mounted in strict mode', async () => {
    const value = registry({ script: 'window.__puckStrictBlocks = true;' });
    const heroes = countWhenScriptRuns('__puckStrictBlocks', '.hero');

    try {
      const unmount = await renderOutsideTransition(
        <StrictMode>
          {generatedDocument(value, [
            heroNode('Hero', 'first'),
            heroNode('Hero', 'second'),
          ])}
        </StrictMode>
      );

      await waitFor(() => expect(heroes.counts).toEqual([2]));

      unmount();
    } finally {
      heroes.restore();
    }
  });

  it('waits for the generated blocks in the slots of generated blocks before it runs the registry script', async () => {
    const value = registry({
      script: 'window.__puckAfterNestedBlocks = true;',
      components: {
        Hero: hero,
        Card: { html: '<article class="card">Card</article>' },
      },
    });
    const node = buildPuckBlockTree([
      block({
        id: 'outer',
        type: 'Hero',
        kind: PuckBlockKind.Generated,
        props: { title: 'Outer', content: [], 'side.panel': [] },
      }),
      block({
        id: 'inner',
        type: 'Card',
        kind: PuckBlockKind.Generated,
        parentId: 'outer',
        puckSlot: 'content',
      }),
    ]).roots[0];
    const cards = countWhenScriptRuns('__puckAfterNestedBlocks', '.card');

    try {
      const unmount = await renderOutsideTransition(
        <GeneratedBlocksProvider registry={value}>
          <GeneratedBlock
            node={node}
            ChildBlock={NestedBlock}
          />
        </GeneratedBlocksProvider>
      );

      await waitFor(() => expect(cards.counts).toEqual([1]));

      unmount();
    } finally {
      cards.restore();
    }
  });

  it('runs the registry script once for all documents with the same registry', async () => {
    const script = 'window.__puckSharedScript = true;';
    const documents = (count: number) => (
      <>
        {Array.from({ length: count }, (_, index) => (
          <GeneratedBlocksProvider
            key={index}
            registry={registry({ script })}
          >
            <p>Document {index}</p>
          </GeneratedBlocksProvider>
        ))}
      </>
    );
    const { rerender, unmount } = await renderSettled(documents(2));
    const scripts = scriptsWith('__puckSharedScript');

    expect(scripts).toHaveLength(1);

    await settle(() => rerender(documents(1)));

    expect(scriptsWith('__puckSharedScript')).toEqual(scripts);

    unmount();

    expect(scriptsWith('__puckSharedScript')).toHaveLength(0);
  });

  it('renders nothing of its own without a registry', () => {
    const { container } = render(
      <GeneratedBlocksProvider registry={null}>
        <p>Content</p>
      </GeneratedBlocksProvider>
    );

    expect(container.innerHTML).toBe('<p>Content</p>');
  });
});

describe('GeneratedBlock on the server', () => {
  it('renders the registry component with the stored props through Puck', async () => {
    const html = await renderToHtml(generated(registry()));

    expect(html).toContain('data-puck-design="Hero"');
    expect(html).toContain(
      '<h2 data-puck-field-name="title">Stored title</h2>'
    );
    expect(html).toContain('href="https://example.com/more"');
    expect(html).toContain('<style>.hero{color:rebeccapurple}</style>');
  });

  it('never runs a component script on the server', async () => {
    const html = await renderToHtml(
      generated(heroWith({ script: 'window.__puckServerHero = true;' }))
    );

    expect(html).toContain('Stored title');
    expect(html).not.toContain('<script');
    expect(scriptsWith('__puckServerHero')).toHaveLength(0);
  });

  it('never runs the registry script on the server', async () => {
    const html = await renderToHtml(
      generated(registry({ script: 'window.__puckServerScript = true;' }))
    );

    expect(html).not.toContain('<script');
    expect(html).not.toContain('__puckServerScript');
    expect(scriptsWith('__puckServerScript')).toHaveLength(0);
  });

  it('hydrates the markup the server rendered', async () => {
    const ui = generated(
      heroWith({ script: 'window.__puckHydratedScript = true;' })
    );
    const container = document.createElement('div');
    const onRecoverableError = vi.fn();
    let root: Root | undefined;

    container.innerHTML = await renderToHtml(ui);
    document.body.appendChild(container);

    await act(async () => {
      root = hydrateRoot(container, ui, { onRecoverableError });
    });

    await waitFor(() =>
      expect(scriptsWith('__puckHydratedScript')).toHaveLength(1)
    );
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Stored title');

    act(() => root?.unmount());
    container.remove();
  });
});

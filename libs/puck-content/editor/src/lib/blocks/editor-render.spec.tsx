import { PuckContext, SlotComponent } from '@puckeditor/core';
import { render, screen } from '@testing-library/react';
import { mockArticle } from '@wepublish/mocks/website';
import {
  emptyPuckBlockData,
  getSlot,
  PuckBlockData,
  PuckBlockRenderProps,
  PuckSlotValue,
  useTeaserSlot,
} from '@wepublish/puck-content/website';
import { createElement, ReactNode, Ref } from 'react';

import { PuckBlockDataContext } from '../block-data/puck-block-data.context';
import { editorRender } from './editor-render';

const puck = (isEditing = true): PuckContext => ({
  renderDropZone: () => null,
  isEditing,
  dragRef: null,
  metadata: {},
});

type GridProps = {
  title: ReactNode;
  content: PuckSlotValue;
  items: { content: PuckSlotValue }[];
};

const received: PuckBlockRenderProps<GridProps, { onToggle: () => void }>[] =
  [];

const Grid = (
  renderProps: PuckBlockRenderProps<GridProps, { onToggle: () => void }>
) => {
  received.push(renderProps);

  return (
    <section
      aria-label="Grid"
      className={renderProps.className}
    >
      {renderProps.props.title}
      {getSlot(renderProps.slots, 'content')({ className: 'grid-content' })}
    </section>
  );
};

const lastReceived = () => received[received.length - 1];

const puckSlot = (label: string) =>
  vi.fn<SlotComponent>(props => (
    <div
      aria-label={label}
      data-min-empty-height={props?.minEmptyHeight}
      className={props?.className}
    />
  ));

const renderGrid = (
  render: ReturnType<typeof editorRender<GridProps>>,
  props: Record<string, unknown> = {},
  data = new Map<string, PuckBlockData>()
) =>
  createElement(
    PuckBlockDataContext.Provider,
    { value: data },
    createElement(render, {
      id: 'Grid-1',
      puck: puck(),
      title: 'Grid title',
      content: puckSlot('Content'),
      items: [{ content: puckSlot('First item') }],
      ...props,
    } as Parameters<typeof render>[0])
  );

beforeEach(() => {
  received.length = 0;
});

describe('editorRender', () => {
  it('turns the Puck slot functions into slots, including items[i].content', () => {
    const GridRender = editorRender(Grid);

    render(renderGrid(GridRender));

    expect(Object.keys(lastReceived().slots)).toEqual([
      'content',
      'items[0].content',
    ]);
    expect(lastReceived().props).toEqual({
      title: 'Grid title',
      content: [],
      items: [{ content: [] }],
    });
    expect(screen.getByLabelText('Content').className).toBe('grid-content');
  });

  it('gives every slot the minimum empty height of the component', () => {
    render(renderGrid(editorRender(Grid, { minEmptyHeight: 300 })));

    expect(
      screen.getByLabelText('Content').getAttribute('data-min-empty-height')
    ).toBe('300');
  });

  it('reads the data of the block from the preview', () => {
    const data: PuckBlockData = {
      ...emptyPuckBlockData,
      articles: [mockArticle()],
    };

    render(renderGrid(editorRender(Grid), {}, new Map([['Grid-1', data]])));

    expect(lastReceived().data).toBe(data);
  });

  it('starts without data until the preview answers', () => {
    render(renderGrid(editorRender(Grid)));

    expect(lastReceived().data).toBe(emptyPuckBlockData);
  });

  it('passes the drag handle as ref to inline components', () => {
    const dragRef = vi.fn();

    render(
      renderGrid(editorRender(Grid, { inline: true }), {
        puck: { ...puck(), dragRef },
      })
    );

    expect(lastReceived().ref).toBe(dragRef);
  });

  it('passes no ref to components that are not inline', () => {
    render(
      renderGrid(editorRender(Grid), { puck: { ...puck(), dragRef: vi.fn() } })
    );

    expect(lastReceived().ref).toBeUndefined();
  });

  it('applies the editing props and extras only while editing', () => {
    const onToggle = vi.fn();
    const GridRender = editorRender(Grid, {
      editingProps: () => ({ title: 'Editing' }),
      useExtra: () => ({ onToggle }),
    });

    render(renderGrid(GridRender));

    expect(lastReceived().props.title).toBe('Editing');
    expect(lastReceived().onToggle).toBe(onToggle);

    render(renderGrid(GridRender, { puck: puck(false) }));

    expect(lastReceived().props.title).toBe('Grid title');
    expect(lastReceived()).not.toHaveProperty('onToggle');
  });

  it('passes contentEditable nodes through', () => {
    const title = <span>Editable title</span>;

    render(renderGrid(editorRender(Grid), { title }));

    expect(lastReceived().props.title).toBe(title);
    expect(screen.getByText('Editable title')).toBeTruthy();
  });

  it('never hands the envelope to the component', () => {
    render(
      renderGrid(editorRender(Grid), {
        locked: true,
        editMode: true,
        datasources: { article: { type: 'slot' } },
        className: 'styled',
      })
    );

    expect(lastReceived().props).not.toHaveProperty('puck');
    expect(lastReceived().props).not.toHaveProperty('id');
    expect(lastReceived().props).not.toHaveProperty('locked');
    expect(lastReceived().props).not.toHaveProperty('editMode');
    expect(lastReceived().props).not.toHaveProperty('datasources');
    expect(lastReceived().props).not.toHaveProperty('className');
    expect(lastReceived()).not.toHaveProperty('puck');
    expect(lastReceived()).not.toHaveProperty('datasources');
    expect(lastReceived().id).toBe('Grid-1');
    expect(lastReceived().className).toBe('styled');
  });

  it('provides the teaser of its datasource to the blocks inside', () => {
    const article = mockArticle();
    const TeaserProbe = () => {
      const teaser = useTeaserSlot();

      return (
        <output aria-label="Teaser">
          {teaser?.__typename === 'ArticleTeaser' ? teaser.article?.id : 'none'}
        </output>
      );
    };
    const slotWithProbe = vi.fn<SlotComponent>(() => <TeaserProbe />);

    render(
      renderGrid(
        editorRender(Grid),
        {
          content: slotWithProbe,
          datasources: { article: { type: 'single', id: article.id } },
        },
        new Map([['Grid-1', { ...emptyPuckBlockData, articles: [article] }]])
      )
    );

    expect(screen.getByRole('status', { name: 'Teaser' }).textContent).toBe(
      article.id
    );
  });

  it('decorates the block with editor chrome while editing', () => {
    render(
      renderGrid(
        editorRender(Grid, {
          decorate: element => (
            <>
              <p>Editor hint</p>
              {element}
            </>
          ),
        })
      )
    );

    expect(screen.getByText('Editor hint')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Grid' })).toBeTruthy();
  });
});

describe('editorRender types', () => {
  it('accepts a ref for inline components', () => {
    expectTypeOf<PuckBlockRenderProps<GridProps>['ref']>().toEqualTypeOf<
      Ref<HTMLElement> | undefined
    >();
  });
});

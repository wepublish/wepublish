import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import {
  FullPuckBlockFragment,
  PuckBlockKind,
  TemplatePuckBlockFragment,
} from '@wepublish/website/api';

import {
  emptyPuckBlockData,
  PuckBlockComponent,
} from '../../../blocks/block.types';
import { PuckBlocks } from '../../../blocks/puck-blocks-renderer.component';
import { getSlot } from '../../../blocks/slots';
import { LINKED_TEMPLATE_TYPE } from './linked-template';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

const theme = createTheme();

const fields = {
  __typename: 'PuckBlock' as const,
  kind: PuckBlockKind.Puck,
  parentId: null,
  puckSlot: null,
  position: 0,
  props: {},
  visibility: null,
  styling: null,
  datasources: null,
  locked: null,
  grouped: null,
};

const templateBlock = (
  id: string,
  type: string,
  extra: Partial<TemplatePuckBlockFragment> = {}
): TemplatePuckBlockFragment =>
  ({
    ...fields,
    id,
    type,
    data: { __typename: 'PuckBlockData', ...emptyPuckBlockData },
    ...extra,
  }) as TemplatePuckBlockFragment;

const linkedBlock = (
  template: FullPuckBlockFragment['data']['template']
): FullPuckBlockFragment =>
  ({
    ...fields,
    id: 'linked-1',
    type: LINKED_TEMPLATE_TYPE,
    props: { templateId: 'tpl' },
    data: { __typename: 'PuckBlockData', ...emptyPuckBlockData, template },
  }) as FullPuckBlockFragment;

const Probe: PuckBlockComponent<{ text?: string }> = ({ props, className }) => (
  <p className={className}>{props.text}</p>
);

const Box: PuckBlockComponent<object> = ({ slots }) => (
  <section aria-label="box">{getSlot(slots, 'content')()}</section>
);

const renderBlocks = (blocks: FullPuckBlockFragment[]) =>
  render(
    <ThemeProvider theme={theme}>
      <PuckBlocks
        blocks={blocks}
        components={{ Probe: { component: Probe }, Box: { component: Box } }}
      />
    </ThemeProvider>
  );

describe('LinkedTemplateRender', () => {
  it('renders the current blocks of the linked template inside its own element', () => {
    const { container } = renderBlocks([
      linkedBlock({
        __typename: 'PuckBlockTemplateData',
        id: 'tpl',
        name: 'Rubric',
        puckRegistry: null,
        puckBlocks: [
          templateBlock('linked-1/box', 'Box'),
          templateBlock('linked-1/text', 'Probe', {
            parentId: 'linked-1/box',
            puckSlot: 'content',
            props: { text: 'From the template' },
          }),
        ],
      }),
    ]);

    expect(screen.getByRole('region', { name: 'box' })).toHaveTextContent(
      'From the template'
    );
    expect(container.firstElementChild?.tagName).toBe('DIV');
  });

  it('renders nothing when the template is missing', () => {
    const { container } = renderBlocks([linkedBlock(null)]);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders a linked template inside a linked template from its template slot', () => {
    renderBlocks([
      linkedBlock({
        __typename: 'PuckBlockTemplateData',
        id: 'outer',
        name: 'Outer',
        puckRegistry: null,
        puckBlocks: [
          templateBlock('linked-1/inner', LINKED_TEMPLATE_TYPE, {
            props: { templateId: 'inner' },
          }),
          templateBlock('linked-1/inner/text', 'Probe', {
            parentId: 'linked-1/inner',
            puckSlot: 'template',
            props: { text: 'Nested content' },
          }),
        ],
      }),
    ]);

    expect(screen.getByText('Nested content')).toBeInTheDocument();
  });
});

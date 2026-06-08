import { render } from '@testing-library/react';
import * as stories from './flex-block.stories';
import { composeStories } from '@storybook/react';
import {
  BuilderBlockRendererProps,
  BuilderFlexBlockProps,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { FlexBlock } from './flex-block';
import { ThemeProvider } from '@emotion/react';

const storiesCmp = composeStories(stories);

describe('Flex Block', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });

  it('passes sibling metadata to nested blocks', () => {
    const renderedBlocks: BuilderBlockRendererProps[] = [];
    const theme = {
      spacing: (factor: number) => `${factor * 8}px`,
      breakpoints: {
        up: () => '@media (min-width:0px)',
      },
    };
    const nestedBlocks = [
      {
        alignment: { i: 'one', x: 0, y: 0, w: 1, h: 1 },
        block: {
          __typename: 'TitleBlock',
          blockStyle: 'hero',
        },
      },
      {
        alignment: { i: 'two', x: 1, y: 0, w: 1, h: 1 },
        block: {
          __typename: 'BreakBlock',
          blockStyle: 'sidebar-content',
        },
      },
    ] as unknown as BuilderFlexBlockProps['blocks'];

    render(
      <WebsiteBuilderProvider
        blocks={{
          Renderer: props => {
            renderedBlocks.push(props);
            return <div />;
          },
        }}
      >
        <ThemeProvider theme={theme}>
          <FlexBlock
            type="Page"
            blocks={nestedBlocks}
          />
        </ThemeProvider>
      </WebsiteBuilderProvider>
    );

    expect(renderedBlocks).toHaveLength(2);
    expect(renderedBlocks[0].siblings).toEqual([
      { typeName: 'TitleBlock', blockStyle: 'hero' },
      { typeName: 'BreakBlock', blockStyle: 'sidebar-content' },
    ]);
    expect(renderedBlocks[1].siblings).toEqual(renderedBlocks[0].siblings);
  });
});

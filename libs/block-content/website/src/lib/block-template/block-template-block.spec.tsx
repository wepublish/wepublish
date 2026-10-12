import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import {
  mockBlockTemplateBlock,
  mockBreakBlock,
  mockQuoteBlock,
  mockTitleBlock,
} from '@wepublish/storybook/mocks';
import {
  BuilderBlockRendererProps,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { FullBlockTemplateBlockFragment } from '@wepublish/website/api';

import {
  BlockTemplateBlock,
  isBlockTemplateBlock,
} from './block-template-block';
import * as stories from './block-template-block.stories';

const storiesCmp = composeStories(stories);
const { Default } = storiesCmp;

type TemplateBlocks = NonNullable<
  FullBlockTemplateBlockFragment['template']
>['blocks'];

const templateOf = (blocks: unknown[], name = 'Block Template') => ({
  id: '1234-1234',
  name,
  blocks: blocks as TemplateBlocks,
});

const blockTemplate = (blocks: unknown[], name = 'Block Template') =>
  mockBlockTemplateBlock({ template: templateOf(blocks, name) });

const renderWithSpyRenderer = (
  props: Partial<Parameters<typeof BlockTemplateBlock>[0]>
) => {
  const Renderer = vi.fn((_: BuilderBlockRendererProps) => null);

  const result = render(
    <WebsiteBuilderProvider blocks={{ Renderer }}>
      <BlockTemplateBlock
        {...(props as Parameters<typeof BlockTemplateBlock>[0])}
      />
    </WebsiteBuilderProvider>
  );

  return { ...result, Renderer };
};

describe('Block Template Block', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });

  describe('isBlockTemplateBlock', () => {
    it('should match a block template block', () => {
      expect(isBlockTemplateBlock(mockBlockTemplateBlock())).toBe(true);
    });

    it('should not match another block', () => {
      expect(isBlockTemplateBlock(mockTitleBlock())).toBe(false);
    });
  });

  describe('rendering the template content', () => {
    it('should render every block of the template with its predefined content', () => {
      render(
        <Default
          {...blockTemplate([
            mockTitleBlock({
              preTitle: 'Predefined Pre-Title',
              title: 'Predefined Title',
              lead: 'Predefined Lead',
            }),
            mockQuoteBlock({
              quote: 'Predefined Quote',
              author: 'Predefined Author',
            }),
          ])}
        />
      );

      expect(screen.getByText('Predefined Pre-Title')).toBeInTheDocument();
      expect(screen.getByText('Predefined Title')).toBeInTheDocument();
      expect(screen.getByText('Predefined Lead')).toBeInTheDocument();
      expect(screen.getByText('Predefined Quote')).toBeInTheDocument();
      expect(screen.getByText('Predefined Author')).toBeInTheDocument();
    });

    it('should keep the order of the blocks of the template', () => {
      const { Renderer } = renderWithSpyRenderer({
        template: templateOf([
          mockTitleBlock({ title: 'First' }),
          mockQuoteBlock({ quote: 'Second' }),
          mockBreakBlock(),
        ]),
      });

      expect(Renderer).toHaveBeenCalledTimes(3);
      expect(
        Renderer.mock.calls.map(([{ block }]) => block.__typename)
      ).toEqual(['TitleBlock', 'QuoteBlock', 'BreakBlock']);
    });

    it('should render the updated content once the template has been modified', () => {
      const { rerender } = render(
        <Default {...blockTemplate([mockTitleBlock({ title: 'Old Title' })])} />
      );

      expect(screen.getByText('Old Title')).toBeInTheDocument();

      rerender(
        <Default
          {...blockTemplate([
            mockTitleBlock({ title: 'New Title' }),
            mockQuoteBlock({ quote: 'Added Quote' }),
          ])}
        />
      );

      expect(screen.queryByText('Old Title')).not.toBeInTheDocument();
      expect(screen.getByText('New Title')).toBeInTheDocument();
      expect(screen.getByText('Added Quote')).toBeInTheDocument();
    });
  });

  describe('props handed to the nested blocks', () => {
    it('should default to the page type and increase the level', () => {
      const { Renderer } = renderWithSpyRenderer({
        template: templateOf([mockTitleBlock(), mockQuoteBlock()]),
      });

      expect(Renderer).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ type: 'Page', level: 1, index: 0, count: 2 }),
        undefined
      );
      expect(Renderer).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ type: 'Page', level: 1, index: 1, count: 2 }),
        undefined
      );
    });

    it('should forward the type and increase the given level', () => {
      const { Renderer } = renderWithSpyRenderer({
        template: templateOf([mockTitleBlock()]),
        type: 'Article',
        level: 2,
      });

      expect(Renderer).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'Article', level: 3 }),
        undefined
      );
    });
  });

  describe('edge cases', () => {
    it('should render nothing when the template is null', () => {
      const { container, Renderer } = renderWithSpyRenderer({
        template: null,
      });

      expect(Renderer).not.toHaveBeenCalled();
      expect(container).toBeEmptyDOMElement();
    });

    it('should render nothing when the template is missing', () => {
      const { container, Renderer } = renderWithSpyRenderer({});

      expect(Renderer).not.toHaveBeenCalled();
      expect(container).toBeEmptyDOMElement();
    });

    it('should render nothing when the template has no blocks', () => {
      const { container, Renderer } = renderWithSpyRenderer({
        template: templateOf([]),
      });

      expect(Renderer).not.toHaveBeenCalled();
      expect(container).toBeEmptyDOMElement();
    });
  });
});

import { screen } from '@testing-library/react';
import {
  mockBlockWithAlignment,
  mockFlexAlignment,
  mockFlexBlock,
  mockImage,
  mockImageBlock,
  mockTitleBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { BuilderBlockRendererProps } from '@wepublish/website/builder';
import { FlexBlock, isFlexBlock } from './flex-block';

const titleAt = (title: string, x: number, y: number) =>
  mockBlockWithAlignment({
    alignment: mockFlexAlignment({ x, y, w: 6, h: 1 }),
    block: mockTitleBlock({ title }),
  });

describe('FlexBlock', () => {
  it('renders the nested blocks', () => {
    renderWithProviders(
      <FlexBlock
        blocks={[
          mockBlockWithAlignment({
            block: mockTitleBlock({ title: 'Nested' }),
          }),
          mockBlockWithAlignment({
            alignment: mockFlexAlignment({ y: 1 }),
            block: mockImageBlock({
              image: mockImage({ description: 'Nested image' }),
            }),
          }),
        ]}
      />
    );

    expect(screen.getByRole('heading', { name: 'Nested' })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Nested image' })
    ).toBeInTheDocument();
  });

  it('renders the nested blocks row by row, left to right', () => {
    renderWithProviders(
      <FlexBlock
        blocks={[
          titleAt('Bottom right', 6, 1),
          titleAt('Top right', 6, 0),
          titleAt('Bottom left', 0, 1),
          titleAt('Top left', 0, 0),
        ]}
      />
    );

    expect(
      screen.getAllByRole('heading').map(heading => heading.textContent)
    ).toEqual(['Top left', 'Top right', 'Bottom left', 'Bottom right']);
  });

  it('defaults to the page type and renders the nested blocks one level deeper', () => {
    const Renderer = vi.fn((_: BuilderBlockRendererProps) => null);

    renderWithProviders(
      <FlexBlock blocks={[titleAt('First', 0, 0), titleAt('Second', 0, 1)]} />,
      { builder: { blocks: { Renderer } } }
    );

    expect(Renderer).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'Page', level: 1, index: 1, count: 2 }),
      undefined
    );
  });

  it('forwards the type and increases the given level', () => {
    const Renderer = vi.fn((_: BuilderBlockRendererProps) => null);

    renderWithProviders(
      <FlexBlock
        blocks={[titleAt('First', 0, 0)]}
        type="Article"
        level={2}
      />,
      { builder: { blocks: { Renderer } } }
    );

    expect(Renderer).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Article', level: 3 }),
      undefined
    );
  });

  it('recognises flex blocks', () => {
    expect(isFlexBlock(mockFlexBlock())).toBe(true);
    expect(isFlexBlock(mockTitleBlock())).toBe(false);
  });
});

import {
  mockBlockWithAlignment,
  mockFlexBlock,
  mockTitleBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { BuilderBlockRendererProps } from '@wepublish/website/builder';

import { ReflektBlockStyles } from './block-styles/reflekt-block-styles';
import { ReflektBlockRenderer } from './reflekt-block-renderer';

describe('ReflektBlockRenderer', () => {
  it('tells the blocks nested in a fullsize image flex block which type of content they are on', () => {
    const Renderer = vi.fn((_: BuilderBlockRendererProps) => null);

    renderWithProviders(
      <ReflektBlockRenderer
        block={mockFlexBlock({
          blockStyle: ReflektBlockStyles.FlexBlockFullsizeImage,
          blocks: [
            mockBlockWithAlignment({
              block: mockTitleBlock({ title: 'Nested' }),
            }),
          ],
        })}
        type="Article"
        level={1}
        index={0}
        count={1}
      />,
      { builder: { blocks: { Renderer } } }
    );

    expect(Renderer).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Article', level: 2 }),
      undefined
    );
  });
});

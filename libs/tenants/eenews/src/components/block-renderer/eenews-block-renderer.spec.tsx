import {
  mockBlockWithAlignment,
  mockFlexBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { BuilderFlexBlockProps } from '@wepublish/website/builder';

import { EeNewsBlockType } from '../block-styles/eenews-block-styles';
import { EenewsBlockRenderer } from './eenews-block-renderer';

describe('EenewsBlockRenderer', () => {
  it('tells the blocks nested in a section band which type of content they are on', () => {
    const FlexBlock = vi.fn((_: BuilderFlexBlockProps) => null);

    renderWithProviders(
      <EenewsBlockRenderer
        block={mockFlexBlock({
          blockStyle: EeNewsBlockType.FlexBlockSectionBand,
          blocks: [mockBlockWithAlignment({ block: mockFlexBlock() })],
        })}
        type="Article"
        index={0}
        count={1}
      />,
      { builder: { blocks: { FlexBlock } } }
    );

    expect(FlexBlock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Article', level: 1 }),
      undefined
    );
  });
});

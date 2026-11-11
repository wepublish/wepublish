import { BlockType } from '../block-type.model';
import { displayedBlocks } from './displayed-blocks';

const now = new Date('2026-01-05T09:00:00Z');

const title = (name: string, overrides: object = {}) => ({
  type: BlockType.Title,
  title: name,
  ...overrides,
});

describe('displayedBlocks', () => {
  it('keeps blocks that should display', () => {
    const blocks = [title('a'), title('b')];

    expect(displayedBlocks(blocks, now)).toEqual(blocks);
  });

  it('drops disabled blocks', () => {
    expect(
      displayedBlocks([title('a'), title('b', { disabled: true })], now)
    ).toEqual([title('a')]);
  });

  it('drops blocks outside their timing', () => {
    expect(
      displayedBlocks(
        [
          title('a'),
          title('b', { timing: { from: new Date('2026-02-01T00:00:00Z') } }),
        ],
        now
      )
    ).toEqual([title('a')]);
  });

  it('drops hidden blocks nested in a flex block', () => {
    const flex = {
      type: BlockType.FlexBlock,
      blocks: [
        { alignment: { i: '1' }, block: title('a') },
        { alignment: { i: '2' }, block: title('b', { disabled: true }) },
      ],
    };

    expect(displayedBlocks([flex], now)).toEqual([
      {
        type: BlockType.FlexBlock,
        blocks: [{ alignment: { i: '1' }, block: title('a') }],
      },
    ]);
  });

  it('drops hidden blocks nested in a block template', () => {
    const blockTemplate = {
      type: BlockType.BlockTemplate,
      templateId: 'tpl',
      template: {
        id: 'tpl',
        blocks: [title('a'), title('b', { disabled: true })],
      },
    };

    expect(displayedBlocks([blockTemplate], now)).toEqual([
      {
        type: BlockType.BlockTemplate,
        templateId: 'tpl',
        template: { id: 'tpl', blocks: [title('a')] },
      },
    ]);
  });

  it('drops a flex block whose own timing hides it, nested blocks included', () => {
    const flex = {
      type: BlockType.FlexBlock,
      timing: { from: new Date('2026-02-01T00:00:00Z') },
      blocks: [{ alignment: { i: '1' }, block: title('a') }],
    };

    expect(displayedBlocks([flex], now)).toEqual([]);
  });

  it('leaves the blocks it filters untouched', () => {
    const flex = {
      type: BlockType.FlexBlock,
      blocks: [
        { alignment: { i: '1' }, block: title('a') },
        { alignment: { i: '2' }, block: title('b', { disabled: true }) },
      ],
    };

    displayedBlocks([flex], now);

    expect(flex.blocks).toHaveLength(2);
  });

  it('reports a rebuilt template together with the template it came from', () => {
    const onTemplateRebuilt = vi.fn();
    const blockTemplate = {
      type: BlockType.BlockTemplate,
      template: {
        id: 'tpl',
        blocks: [title('a'), title('b', { disabled: true })],
      },
    };

    displayedBlocks([blockTemplate], now, { onTemplateRebuilt });

    expect(onTemplateRebuilt).toHaveBeenCalledWith(
      { id: 'tpl', blocks: [title('a')] },
      blockTemplate.template
    );
  });

  it('leaves blocks untouched when nothing is hidden', () => {
    const blocks = [title('a')];

    expect(displayedBlocks(blocks, now)[0]).toBe(blocks[0]);
  });
});

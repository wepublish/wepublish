import { act, renderHook } from '@testing-library/react';
import { EditorBlockType } from '@wepublish/editor/api';
import { BlockValue } from '@wepublish/ui/editor';

import { useTemplateEditor } from './useTemplateEditor';

type Metadata = { title: string; hidden: boolean };
type TemplateMetadata = { title?: string | null };

const emptyMetadata: Metadata = { title: '', hidden: false };
const initialBlocks: BlockValue[] = [
  {
    key: '0',
    type: EditorBlockType.Title,
    value: { preTitle: '', title: '', lead: '' },
  },
];
const toMetadata = ({ title }: TemplateMetadata) => ({ title: title ?? '' });

const template = (modifiedAt = '2026-01-01T00:00:00.000Z', name = 'News') => ({
  id: 'template-1',
  modifiedAt,
  blockTemplate: {
    name,
    modifiedAt,
    blocks: [
      {
        __typename: 'TitleBlock',
        type: 'title',
        blockStyle: null,
        disabled: false,
        preTitle: null,
        title: 'Saved Title',
        lead: null,
      },
    ],
  },
  metadata: { title: 'Metadata Title' },
});

type Template = ReturnType<typeof template>;

const renderEditor = (initialTemplate?: Template) =>
  renderHook(
    ({ template }: { template?: Template }) =>
      useTemplateEditor({ emptyMetadata, initialBlocks, toMetadata, template }),
    { initialProps: { template: initialTemplate } }
  );

describe('useTemplateEditor', () => {
  it('should start empty', () => {
    const { result } = renderEditor();

    expect(result.current.name).toBe('');
    expect(result.current.blocks).toBe(initialBlocks);
    expect(result.current.metadata).toEqual(emptyMetadata);
    expect(result.current.hasChanged).toBe(false);
  });

  it('should take over a loaded template', () => {
    const { result } = renderEditor(template());

    expect(result.current.name).toBe('News');
    expect(result.current.blocks).toEqual([
      expect.objectContaining({
        type: EditorBlockType.Title,
        value: expect.objectContaining({ title: 'Saved Title' }),
      }),
    ]);
    expect(result.current.metadata).toEqual({
      title: 'Metadata Title',
      hidden: false,
    });
    expect(result.current.hasChanged).toBe(false);
  });

  it('should keep unsaved changes while the revision stays the same', () => {
    const { result, rerender } = renderEditor(template());

    act(() => result.current.changeName('Renamed'));
    rerender({ template: template() });

    expect(result.current.name).toBe('Renamed');
    expect(result.current.hasChanged).toBe(true);
  });

  it('should take over a new revision of the template', () => {
    const { result, rerender } = renderEditor(template());

    act(() => result.current.changeName('Renamed'));
    rerender({ template: template('2026-02-02T00:00:00.000Z', 'Saved') });

    expect(result.current.name).toBe('Saved');
  });

  it('should track changes to the name, the blocks and the metadata', () => {
    const { result } = renderEditor();

    act(() => result.current.changeBlocks([]));
    expect(result.current.blocks).toEqual([]);
    expect(result.current.hasChanged).toBe(true);

    act(() => result.current.setChanged(false));
    act(() =>
      result.current.changeMetadata({ title: 'Changed', hidden: true })
    );
    expect(result.current.metadata).toEqual({ title: 'Changed', hidden: true });
    expect(result.current.hasChanged).toBe(true);
  });

  it('should not track metadata set without a change', () => {
    const { result } = renderEditor();

    act(() => result.current.setMetadata(meta => ({ ...meta, hidden: true })));

    expect(result.current.metadata.hidden).toBe(true);
    expect(result.current.hasChanged).toBe(false);
  });

  it('should apply a prefill on top of the current metadata', () => {
    const { result } = renderEditor();

    act(() => result.current.setMetadata(meta => ({ ...meta, hidden: true })));
    act(() =>
      result.current.applyPrefill({
        name: 'Prefilled',
        blocks: [],
        metadata: { title: 'Prefilled Title' },
      })
    );

    expect(result.current.name).toBe('Prefilled');
    expect(result.current.blocks).toEqual([]);
    expect(result.current.metadata).toEqual({
      title: 'Prefilled Title',
      hidden: true,
    });
    expect(result.current.hasChanged).toBe(true);
  });
});

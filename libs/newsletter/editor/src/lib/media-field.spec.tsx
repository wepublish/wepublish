import { fireEvent, render, screen } from '@testing-library/react';
import type { FullImageFragment } from '@wepublish/editor/api';
import { lookupImage } from './images';
import { mediaField } from './media-field';

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  ChooseEditImage: ({
    openChooseModalOpen,
  }: {
    openChooseModalOpen: () => void;
  }) => <button onClick={openChooseModalOpen}>choose</button>,
  ImageSelectPanel: ({
    onSelect,
  }: {
    onSelect: (image: FullImageFragment) => void;
  }) => (
    <button
      onClick={() =>
        onSelect({
          id: 'image-1',
          url: 'https://media.example.com/image-1',
        } as FullImageFragment)
      }
    >
      pick
    </button>
  ),
}));

describe('mediaField', () => {
  it('picks an image in a drawer and stores only its id', async () => {
    const onChange = vi.fn();

    render(<>{mediaField('Bild').render({ value: '', onChange } as never)}</>);

    expect(screen.queryByText('pick')).toBeNull();

    fireEvent.click(screen.getByText('choose'));
    fireEvent.click(await screen.findByText('pick'));

    expect(onChange).toHaveBeenCalledWith('image-1');
    // The canvas draws the picture from the cache, not from the stored id.
    expect(lookupImage('image-1')?.url).toBe(
      'https://media.example.com/image-1'
    );
    await vi.waitFor(() => expect(screen.queryByText('pick')).toBeNull());
  });
});

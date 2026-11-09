import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { FullImageFragment } from '@wepublish/editor/api';

import { ChooseEditImage } from './chooseEditImage';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({ data: undefined, loading: false }),
  useMutation: () => [vi.fn(), { loading: false }],
  useApolloClient: () => ({ query: vi.fn(async () => ({ data: {} })) }),
}));

// The dropped files are a byte long; exifr would fail on them and log a
// RangeError for every drop.
vi.mock('./imageMetaData', async importOriginal => ({
  ...(await importOriginal<typeof import('./imageMetaData')>()),
  readImageMetaData: vi.fn(async () => ({
    title: '',
    description: '',
    source: '',
    link: '',
    licence: '',
  })),
}));

const dropFile = (target: HTMLElement, file: File) => {
  const dataTransfer = {
    files: [file],
    items: [{ kind: 'file', type: file.type }],
    types: ['Files'],
  };

  fireEvent.dragEnter(target, { dataTransfer });
  fireEvent.dragOver(target, { dataTransfer });
  fireEvent.drop(target, { dataTransfer });
};

const theme = createTheme({ cssVariables: true });

const image = {
  id: 'image-1',
  largeURL: 'https://example.com/large.jpg',
  title: 'A portrait',
} as FullImageFragment;

const renderInput = (props: Partial<Parameters<typeof ChooseEditImage>[0]>) =>
  render(
    <ThemeProvider theme={theme}>
      <ChooseEditImage
        disabled={false}
        openChooseModalOpen={vi.fn()}
        openEditModalOpen={vi.fn()}
        removeImage={vi.fn()}
        {...props}
      />
    </ThemeProvider>
  );

describe('ChooseEditImage', () => {
  it('offers the empty box as one button', () => {
    const openChooseModalOpen = vi.fn();
    renderInput({ openChooseModalOpen });

    const choose = screen.getByRole('button', {
      name: 'chooseEditImage.chooseImage',
    });
    fireEvent.click(choose);

    expect(openChooseModalOpen).toHaveBeenCalled();
  });

  it('cannot be opened while disabled', () => {
    const openChooseModalOpen = vi.fn();
    renderInput({ openChooseModalOpen, disabled: true });

    fireEvent.click(
      screen.getByRole('button', { name: 'chooseEditImage.chooseImage' })
    );

    expect(openChooseModalOpen).not.toHaveBeenCalled();
  });

  it('groups its controls under the label it is pointed at', () => {
    render(
      <ThemeProvider theme={theme}>
        <span id="post-image-label">Post image</span>
        <ChooseEditImage
          disabled={false}
          openChooseModalOpen={vi.fn()}
          aria-labelledby="post-image-label"
        />
      </ThemeProvider>
    );

    const group = screen.getByRole('group', { name: 'Post image' });

    expect(
      within(group).getByRole('button', { name: 'chooseEditImage.chooseImage' })
    ).toBeInTheDocument();
  });

  it('groups the actions on a chosen image under the same label', () => {
    render(
      <ThemeProvider theme={theme}>
        <span id="post-image-label">Post image</span>
        <ChooseEditImage
          image={image}
          disabled={false}
          removeImage={vi.fn()}
          aria-labelledby="post-image-label"
        />
      </ThemeProvider>
    );

    const group = screen.getByRole('group', { name: 'Post image' });

    expect(
      within(group).getByRole('button', { name: 'chooseEditImage.removeImage' })
    ).toBeInTheDocument();
  });

  describe('with an image', () => {
    it('contains the image in the box instead of cropping it', () => {
      renderInput({ image });

      expect(screen.getByAltText('A portrait')).toHaveStyle({
        'object-fit': 'contain',
      });
    });

    it('names the image by its title, so the box is not a dead end', () => {
      renderInput({ image });

      expect(screen.getByAltText('A portrait')).toBeInTheDocument();
    });

    it('offers each action on its own', () => {
      const openEditModalOpen = vi.fn();
      const removeImage = vi.fn();
      renderInput({ image, openEditModalOpen, removeImage });

      fireEvent.click(
        screen.getByRole('button', { name: 'chooseEditImage.editImage' })
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'chooseEditImage.removeImage' })
      );

      expect(openEditModalOpen).toHaveBeenCalled();
      expect(removeImage).toHaveBeenCalled();
    });

    it('only offers the actions it was given', () => {
      renderInput({
        image,
        openEditModalOpen: undefined,
        removeImage: undefined,
      });

      expect(
        screen.queryByRole('button', { name: 'chooseEditImage.editImage' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'chooseEditImage.removeImage' })
      ).not.toBeInTheDocument();
    });
  });

  describe('a dropped file', () => {
    it('looks like the drawer it replaces a trip to', () => {
      renderInput({ onSelect: vi.fn() });

      const box = screen.getByRole('button', {
        name: 'chooseEditImage.chooseImage',
      });
      fireEvent.dragEnter(box, { dataTransfer: { types: ['Files'] } });

      expect(getComputedStyle(box).borderStyle).toBe('dashed');
    });

    it('says it will take the file while one is over the box', () => {
      renderInput({ onSelect: vi.fn() });

      const box = screen.getByRole('button', {
        name: 'chooseEditImage.chooseImage',
      });

      expect(
        screen.queryByText('articleEditor.panels.dropImage')
      ).not.toBeInTheDocument();

      fireEvent.dragEnter(box, { dataTransfer: { types: ['Files'] } });

      expect(
        screen.getByText('articleEditor.panels.dropImage')
      ).toBeInTheDocument();
    });

    it('opens the upload step on it, without the chooser', async () => {
      const openChooseModalOpen = vi.fn();
      renderInput({ onSelect: vi.fn(), openChooseModalOpen });

      dropFile(
        screen.getByRole('button', { name: 'chooseEditImage.chooseImage' }),
        new File(['x'], 'photo.png', { type: 'image/png' })
      );

      expect(
        await screen.findByText('images.panels.uploadImage')
      ).toBeInTheDocument();
      expect(openChooseModalOpen).not.toHaveBeenCalled();
    });

    it('refuses what is not an image', async () => {
      const onSelect = vi.fn();
      renderInput({ onSelect });

      dropFile(
        screen.getByRole('button', { name: 'chooseEditImage.chooseImage' }),
        new File(['x'], 'notes.pdf', { type: 'application/pdf' })
      );

      await waitFor(() =>
        expect(
          screen.queryByText('articleEditor.panels.dropImage')
        ).not.toBeInTheDocument()
      );
      expect(
        screen.queryByText('images.panels.uploadImage')
      ).not.toBeInTheDocument();
      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});

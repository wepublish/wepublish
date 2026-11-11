import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockImage, renderWithProviders } from '@wepublish/mocks/website';
import { BuilderImageUploadProps } from '@wepublish/website/builder';
import { t } from 'i18next';
import { ChangeEvent } from 'react';
import { ImageUpload } from './image-upload';

const renderImageUpload = (image: BuilderImageUploadProps['image']) => {
  const onUpload = vi.fn();
  const result = renderWithProviders(
    <ImageUpload
      image={image}
      onUpload={onUpload}
    />
  );
  const input =
    result.container.querySelector<HTMLInputElement>('input[type="file"]');

  if (!input) {
    throw new Error('The file input is missing');
  }

  return { onUpload, input, user: userEvent.setup() };
};

const button = (key: string) => screen.getByRole('button', { name: t(key) });

describe('ImageUpload', () => {
  it('shows the current image', () => {
    renderImageUpload(mockImage({ description: 'Avatar' }));

    expect(screen.getByRole('img', { name: 'Avatar' })).toBeInTheDocument();
  });

  it('deletes the image', async () => {
    const { user, onUpload } = renderImageUpload(mockImage());

    await user.click(button('user.imageUpload.delete'));

    expect(onUpload).toHaveBeenCalledWith(null);
  });

  it('opens the file picker to replace the image', async () => {
    const { user, input } = renderImageUpload(mockImage());
    const openPicker = vi.spyOn(input, 'click');

    await user.click(button('user.imageUpload.replace'));

    expect(openPicker).toHaveBeenCalledOnce();
  });

  it('hands the chosen file to onUpload', async () => {
    const { user, input, onUpload } = renderImageUpload(mockImage());
    const file = new File(['image'], 'avatar.png', { type: 'image/png' });

    await user.upload(input, file);

    expect(onUpload).toHaveBeenCalledOnce();

    const [event] = onUpload.mock.calls[0] as [ChangeEvent<HTMLInputElement>];

    expect(event.target.files?.[0]).toBe(file);
  });

  it('only accepts images', () => {
    const { input } = renderImageUpload(mockImage());

    expect(input).toHaveAttribute('accept', 'image/*');
  });

  it('offers only an upload when there is no image yet', async () => {
    const { user, input } = renderImageUpload(null);
    const openPicker = vi.spyOn(input, 'click');

    expect(
      screen.queryByRole('button', { name: t('user.imageUpload.delete') })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: t('user.imageUpload.replace') })
    ).not.toBeInTheDocument();

    await user.click(button('user.imageUpload.upload'));

    expect(openPicker).toHaveBeenCalledOnce();
  });
});
